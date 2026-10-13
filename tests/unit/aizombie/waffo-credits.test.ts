import { afterEach, describe, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import {
  applyTestCreditEvent,
  createTestCreditCheckout,
  handleTestCreditWebhook,
  safeWaffoCheckoutUrl,
  testCreditHistory,
} from '@/aizombie/waffo-payments';
import {
  testPaymentConfig,
  usdCents,
  validateTestCreditEvent,
  type TestPaymentConfig,
} from '@/aizombie/waffo-contracts';
import type { WaffoPancake } from '@waffo/pancake-ts';

const config: TestPaymentConfig = {
  merchantId: 'MER_test',
  privateKey: 'unused-test-key',
  storeId: 'STO_test',
  products: {
    single: 'PROD_single',
    starter: 'PROD_starter',
    creator: 'PROD_creator',
  },
};
const checkoutId = '00000000-0000-4000-8000-000000000001';
function event(type = 'order.completed') {
  return {
    eventId: 'PAY_one',
    eventType: type,
    mode: 'test',
    storeId: config.storeId,
    data: {
      orderId: 'ORD_one',
      orderMerchantExternalId: checkoutId,
      merchantProvidedBuyerIdentity: 'user-one',
      currency: 'USD',
      orderStatus: 'completed',
      paymentStatus: 'succeeded',
      refundStatus: 'succeeded',
      listPrice: { subtotal: '6.90' },
      amount: '7.45',
      orderMetadata: {
        app: 'aizombie',
        userId: 'user-one',
        packId: 'single',
        productId: 'PROD_single',
      },
    },
  };
}
const databases: DatabaseSync[] = [];
function database() {
  const sqlite = new DatabaseSync(':memory:');
  databases.push(sqlite);
  sqlite.exec(
    "PRAGMA foreign_keys = ON; CREATE TABLE user(id TEXT PRIMARY KEY); INSERT INTO user VALUES ('user-one'), ('user-two');"
  );
  sqlite.exec(
    readFileSync('src/db/migrations/0007_waffo_test_payments.sql', 'utf8')
  );
  sqlite
    .prepare(`INSERT INTO aizombie_test_checkouts
    (id, user_id, request_id, pack_id, product_id, store_id, amount, credits, created_at, updated_at)
    VALUES (?, 'user-one', 'request', 'single', 'PROD_single', 'STO_test', 690, 100, 1, 1)`)
    .run(checkoutId);
  const adapter = {
    prepare: (sql: string) => ({
      bind: (...args: (string | number | null)[]) => ({
        first: async () => sqlite.prepare(sql).get(...args) ?? null,
        run: async () => sqlite.prepare(sql).run(...args),
        all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
      }),
    }),
  } as unknown as Pick<D1Database, 'prepare'>;
  return { sqlite, adapter };
}
afterEach(() => {
  for (const db of databases.splice(0)) db.close();
});

describe('AI Zombie Test payments', () => {
  test('the real SDK rejects an unsigned callback without changing credits', async () => {
    const { adapter } = database();
    await expect(
      handleTestCreditWebhook(
        adapter,
        config,
        JSON.stringify(event()),
        'invalid'
      )
    ).rejects.toThrow('Invalid Waffo');
    expect((await testCreditHistory(adapter, 'user-one')).credits).toBe(0);
  });
  test('disabled or incomplete configuration never enables payment', () => {
    expect(testPaymentConfig({})).toBeNull();
    expect(
      testPaymentConfig({
        AIZOMBIE_WAFFO_TEST_ENABLED: 'true',
        WAFFO_PRIVATE_KEY: 'other-project',
      })
    ).toBeNull();
    expect(
      testPaymentConfig({ AIZOMBIE_WAFFO_TEST_ENABLED: 'prod' })
    ).toBeNull();
  });
  test('money uses exact decimal cents and rejects malformed values', () => {
    expect(usdCents('6.90')).toBe(690);
    expect(usdCents('6.9')).toBe(690);
    for (const value of ['6.901', '-6.90', '6e2', '', 6.9])
      expect(usdCents(value)).toBeNull();
  });
  test('matches store, product, user, Test mode, payment status and list price', () => {
    expect(validateTestCreditEvent(event(), config).pack.credits).toBe(100);
    for (const mutate of [
      (e: ReturnType<typeof event>) => {
        e.mode = 'prod';
      },
      (e: ReturnType<typeof event>) => {
        e.storeId = 'STO_other';
      },
      (e: ReturnType<typeof event>) => {
        e.data.currency = 'EUR';
      },
      (e: ReturnType<typeof event>) => {
        e.data.listPrice.subtotal = '0.01';
      },
      (e: ReturnType<typeof event>) => {
        e.data.paymentStatus = 'pending';
      },
      (e: ReturnType<typeof event>) => {
        e.data.orderMetadata.productId = 'PROD_other';
      },
      (e: ReturnType<typeof event>) => {
        e.data.merchantProvidedBuyerIdentity = 'user-two';
      },
    ]) {
      const value = event();
      mutate(value);
      expect(() => validateTestCreditEvent(value, config)).toThrow();
    }
  });
  test('duplicate completion credits only once and never another user', async () => {
    const { adapter } = database();
    await applyTestCreditEvent(adapter, config, event());
    await applyTestCreditEvent(adapter, config, event());
    expect((await testCreditHistory(adapter, 'user-one')).credits).toBe(100);
    expect((await testCreditHistory(adapter, 'user-two')).credits).toBe(0);
    const forged = event();
    forged.data.orderMetadata.userId = 'user-two';
    forged.data.merchantProvidedBuyerIdentity = 'user-two';
    await expect(
      applyTestCreditEvent(adapter, config, forged)
    ).rejects.toThrow();
  });
  test('refund before or after completion removes credits permanently; failed refund does not', async () => {
    const { adapter } = database();
    await applyTestCreditEvent(adapter, config, event());
    await applyTestCreditEvent(adapter, config, event('refund.failed'));
    expect((await testCreditHistory(adapter, 'user-one')).credits).toBe(100);
    await applyTestCreditEvent(adapter, config, event('refund.succeeded'));
    await applyTestCreditEvent(adapter, config, event());
    expect((await testCreditHistory(adapter, 'user-one')).credits).toBe(0);
    const other = database();
    await applyTestCreditEvent(
      other.adapter,
      config,
      event('refund.succeeded')
    );
    await applyTestCreditEvent(other.adapter, config, event());
    expect((await testCreditHistory(other.adapter, 'user-one')).credits).toBe(
      0
    );
  });
  test('requires a local checkout and rejects a different order on retries', async () => {
    const { adapter } = database();
    const unknown = event();
    unknown.data.orderMerchantExternalId =
      '00000000-0000-4000-8000-000000000009';
    await expect(
      applyTestCreditEvent(adapter, config, unknown)
    ).rejects.toThrow();
    await applyTestCreditEvent(adapter, config, event());
    const different = event();
    different.data.orderId = 'ORD_other';
    await expect(
      applyTestCreditEvent(adapter, config, different)
    ).rejects.toThrow();
  });
  test('checkout retries reuse session and cannot change packs', async () => {
    const { adapter } = database();
    let calls = 0;
    const client = {
      checkout: {
        authenticated: {
          create: async (params: {
            productId: string;
            metadata: Record<string, string>;
          }) => {
            calls++;
            expect(params.productId).toBe('PROD_starter');
            expect(params.metadata.userId).toBe('user-one');
            return {
              checkoutUrl:
                'https://pancake.waffo.ai/consumer/checkout/test#token=fake',
            };
          },
        },
      },
    } as unknown as WaffoPancake;
    const input = {
      userId: 'user-one',
      email: 'e2e-user@example.test',
      packId: 'starter' as const,
      requestId: crypto.randomUUID(),
      origin: 'http://localhost:3000',
    };
    const first = await createTestCreditCheckout(
      adapter,
      config,
      input,
      client
    );
    expect(
      await createTestCreditCheckout(adapter, config, input, client)
    ).toEqual(first);
    expect(calls).toBe(1);
    await expect(
      createTestCreditCheckout(
        adapter,
        config,
        { ...input, packId: 'creator' },
        client
      )
    ).rejects.toThrow();
  });
  test('only Waffo HTTPS checkout redirects are allowed', () => {
    expect(
      safeWaffoCheckoutUrl('https://pancake.waffo.ai/consumer/checkout/x')
    ).toContain('/consumer/');
    for (const url of [
      'http://pancake.waffo.ai/consumer/x',
      'https://evil.test/consumer/x',
      'https://pancake.waffo.ai/merchant/x',
    ])
      expect(() => safeWaffoCheckoutUrl(url)).toThrow();
  });
});
