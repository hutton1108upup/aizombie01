import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import { afterAll, beforeEach, describe, expect, test } from 'vitest';
const client = createClient({ url: ':memory:' });
const migration = readFileSync(
  new URL(
    '../../../src/db/migrations/0006_video_foundation.sql',
    import.meta.url
  ),
  'utf8'
);

async function entry(
  id: string,
  job: string,
  kind: string,
  amount: number,
  time = 100
) {
  return client.execute({
    sql: 'INSERT INTO video_credit_entries VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, 'grant', job, kind, amount, time],
  });
}
describe('durable video accounting foundation', () => {
  beforeEach(async () => {
    await client.executeMultiple(`
      PRAGMA foreign_keys=ON;
      DROP TABLE IF EXISTS video_credit_entries;
      DROP TABLE IF EXISTS video_credit_grants;
      DROP TABLE IF EXISTS video_jobs;
      DROP TABLE IF EXISTS user;
      CREATE TABLE user (id TEXT PRIMARY KEY);
      INSERT INTO user VALUES ('a'), ('b');
    `);
    await client.executeMultiple(migration);
    await client.executeMultiple(`
      INSERT INTO video_credit_grants VALUES ('grant', 'a', 'test', 'order', 'single', 100, 1000, 1);
      INSERT INTO video_jobs (id,user_id,idempotency_key,status,mode,quality,aspect,created_at,updated_at) VALUES
        ('job1','a','request1','queued','couple','480p','16:9',1,1),
        ('job2','a','request2','queued','couple','480p','16:9',1,1),
        ('job-b','b','request-b','queued','couple','480p','16:9',1,1);
    `);
  });
  afterAll(() => client.close());
  test('does not credit a repeated order or create a repeated user request', async () => {
    await expect(
      client.execute(
        "INSERT INTO video_credit_grants VALUES ('other', 'b', 'test', 'order', 'single', 100, 1000, 1)"
      )
    ).rejects.toThrow();
    await expect(
      client.execute(
        "INSERT INTO video_jobs (id,user_id,idempotency_key,status,mode,quality,aspect,created_at,updated_at) VALUES ('other','a','request1','queued','couple','480p','16:9',1,1)"
      )
    ).rejects.toThrow();
  });
  test('rejects cross-user spending and expired grants', async () => {
    await expect(entry('x', 'job-b', 'debit', -100)).rejects.toThrow(
      'owner mismatch'
    );
    await expect(entry('x', 'job1', 'debit', -100, 1000)).rejects.toThrow(
      'expired'
    );
  });
  test('concurrent requests cannot both spend the same balance', async () => {
    const results = await Promise.allSettled([
      entry('one', 'job1', 'debit', -100),
      entry('two', 'job2', 'debit', -100),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled')
    ).toHaveLength(1);
    const total = await client.execute(
      'SELECT SUM(amount) AS spent FROM video_credit_entries'
    );
    expect(total.rows[0].spent).toBe(-100);
  });
  test('refunds only a failed debit, exactly once and for the same amount', async () => {
    await entry('debit', 'job1', 'debit', -100);
    await expect(entry('r', 'job1', 'refund', 100)).rejects.toThrow(
      'invalid credit refund'
    );
    await client.execute(
      "UPDATE video_jobs SET status='failed' WHERE id='job1'"
    );
    await expect(entry('r', 'job1', 'refund', 99)).rejects.toThrow(
      'invalid credit refund'
    );
    await entry('refund', 'job1', 'refund', 100);
    await expect(entry('duplicate', 'job1', 'refund', 100)).rejects.toThrow();
  });
  test('soft deletion keeps spent credits; hard deletion of charged jobs is blocked', async () => {
    await entry('debit', 'job1', 'debit', -100);
    await client.execute(
      "UPDATE video_jobs SET deleted_at=200 WHERE id='job1'"
    );
    expect(
      (
        await client.execute(
          'SELECT SUM(amount) AS spent FROM video_credit_entries'
        )
      ).rows[0].spent
    ).toBe(-100);
    await expect(
      client.execute("DELETE FROM video_jobs WHERE id='job1'")
    ).rejects.toThrow();
  });
});
