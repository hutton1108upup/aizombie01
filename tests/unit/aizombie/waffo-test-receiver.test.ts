import { expect, test } from 'vitest';
import { testReceiverRequest } from '@/aizombie/waffo-test-receiver';

const unavailableDb = new Proxy({} as D1Database, {
  get() {
    throw new Error('Unverified requests must not reach the DB');
  },
});
const endpoint =
  'https://aizombie-waffo-test.duckweed1014.workers.dev/api/aizombie/payments/webhook';

test('Test receiver exposes no auth helpers, checkout or order history', async () => {
  for (const path of [
    '/api/e2e/users',
    '/api/aizombie/payments',
    '/dashboard/payments',
    '/',
  ]) {
    expect(
      (
        await testReceiverRequest(
          new Request(new URL(path, endpoint)),
          unavailableDb
        )
      ).status
    ).toBe(404);
  }
  expect(
    (await testReceiverRequest(new Request(endpoint), unavailableDb)).status
  ).toBe(405);
});

test('Test receiver rejects missing/invalid signatures before DB access', async () => {
  expect(
    (
      await testReceiverRequest(
        new Request(endpoint, { method: 'POST', body: '{}' }),
        unavailableDb
      )
    ).status
  ).toBe(400);
  expect(
    (
      await testReceiverRequest(
        new Request(endpoint, {
          method: 'POST',
          body: '{}',
          headers: { 'x-waffo-signature': 'invalid' },
        }),
        unavailableDb
      )
    ).status
  ).toBe(400);
});

test('Test receiver rejects oversized bodies before verification or DB access', async () => {
  expect(
    (
      await testReceiverRequest(
        new Request(endpoint, {
          method: 'POST',
          body: 'x'.repeat(65537),
          headers: { 'x-waffo-signature': 'invalid' },
        }),
        unavailableDb
      )
    ).status
  ).toBe(413);
});
