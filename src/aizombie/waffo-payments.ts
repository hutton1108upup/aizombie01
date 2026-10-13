import { WaffoPancake, verifyWebhook } from '@waffo/pancake-ts';
import { creditPacks } from '@/aizombie/contracts';
import {
  type CreditPackId,
  type TestPaymentConfig,
  validateTestCreditEvent,
} from '@/aizombie/waffo-contracts';
import { InvalidWebhookSignatureError } from '@/payment/errors';

type CheckoutRow = {
  id: string;
  user_id: string;
  pack_id: CreditPackId;
  product_id: string;
  store_id: string;
  amount: number;
  credits: number;
  status: 'pending' | 'paid' | 'refunded';
  order_id: string | null;
  session_url: string | null;
  session_expires_at: number | null;
};

export function safeWaffoCheckoutUrl(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'pancake.waffo.ai' ||
    url.username ||
    url.password ||
    !url.pathname.startsWith('/consumer/')
  ) {
    throw new Error('Unexpected Waffo checkout destination.');
  }
  return value;
}

export async function createTestCreditCheckout(
  db: Pick<D1Database, 'prepare'>,
  config: TestPaymentConfig,
  input: {
    userId: string;
    email: string;
    packId: CreditPackId;
    requestId: string;
    origin: string;
  },
  client = new WaffoPancake({
    merchantId: config.merchantId,
    privateKey: config.privateKey,
    environment: 'test',
  })
) {
  const pack = creditPacks.find((entry) => entry.id === input.packId);
  if (!pack) throw new Error('Unknown credit pack.');
  const now = Date.now();
  const productId = config.products[pack.id];
  await db
    .prepare(`INSERT INTO aizombie_test_checkouts
    (id, user_id, request_id, pack_id, product_id, store_id, amount, credits, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, request_id) DO NOTHING`)
    .bind(
      crypto.randomUUID(),
      input.userId,
      input.requestId,
      pack.id,
      productId,
      config.storeId,
      pack.amount,
      pack.credits,
      now,
      now
    )
    .run();
  const row = await db
    .prepare(
      'SELECT * FROM aizombie_test_checkouts WHERE user_id = ? AND request_id = ?'
    )
    .bind(input.userId, input.requestId)
    .first<CheckoutRow>();
  if (
    !row ||
    row.pack_id !== pack.id ||
    row.product_id !== productId ||
    row.store_id !== config.storeId
  )
    throw new Error(
      'Checkout request cannot be reused for a different product.'
    );
  if (row.status !== 'pending') throw new Error('Checkout already completed.');
  if (row.session_url && (row.session_expires_at ?? 0) > now)
    return {
      id: row.id,
      url: safeWaffoCheckoutUrl(row.session_url),
      mode: 'test' as const,
    };
  if (row.session_url)
    throw new Error('Checkout expired. Start a new request.');
  const result = await client.checkout.authenticated.create({
    buyerIdentity: input.userId,
    buyerEmail: input.email,
    productId,
    currency: 'USD',
    orderMerchantExternalId: row.id,
    metadata: {
      app: 'aizombie',
      userId: input.userId,
      packId: pack.id,
      productId,
    },
    successUrl: `${input.origin}/dashboard/payments`,
    expiresInSeconds: 2700,
  });
  const url = safeWaffoCheckoutUrl(result.checkoutUrl);
  await db
    .prepare(
      'UPDATE aizombie_test_checkouts SET session_url = ?, session_expires_at = ?, updated_at = ? WHERE id = ? AND status = ?'
    )
    .bind(url, now + 2700000, Date.now(), row.id, 'pending')
    .run();
  return { id: row.id, url, mode: 'test' as const };
}

// Only call after signature verification. The local checkout owns all entitlements.
export async function applyTestCreditEvent(
  db: Pick<D1Database, 'prepare'>,
  config: TestPaymentConfig,
  raw: unknown
) {
  const { event, pack, metadata } = validateTestCreditEvent(raw, config);
  const row = await db
    .prepare('SELECT * FROM aizombie_test_checkouts WHERE id = ?')
    .bind(event.data.orderMerchantExternalId)
    .first<CheckoutRow>();
  if (
    !row ||
    row.user_id !== metadata.userId ||
    row.pack_id !== pack.id ||
    row.product_id !== metadata.productId ||
    row.store_id !== event.storeId ||
    row.amount !== pack.amount ||
    row.credits !== pack.credits ||
    (row.order_id !== null && row.order_id !== event.data.orderId)
  ) {
    throw new Error('Webhook does not match a server-created checkout.');
  }
  if (event.eventType === 'refund.failed') return;
  const status = event.eventType === 'refund.succeeded' ? 'refunded' : 'paid';
  // Any successful refund freezes this sandbox grant, including partial refunds.
  // Compare-and-update makes retries harmless and refund-before-completion safe.
  await db
    .prepare(`UPDATE aizombie_test_checkouts SET status = ?, order_id = ?, updated_at = ?
    WHERE id = ? AND (order_id IS NULL OR order_id = ?) AND status <> 'refunded'`)
    .bind(status, event.data.orderId, Date.now(), row.id, event.data.orderId)
    .run();
}

export async function handleTestCreditWebhook(
  db: Pick<D1Database, 'prepare'>,
  config: TestPaymentConfig,
  payload: string,
  signature: string
) {
  let event: unknown;
  try {
    event = verifyWebhook(payload, signature, {
      environment: 'test',
      toleranceMs: 2700000,
    });
  } catch {
    throw new InvalidWebhookSignatureError('Waffo');
  }
  await applyTestCreditEvent(db, config, event);
}

export async function testCreditHistory(
  db: Pick<D1Database, 'prepare'>,
  userId: string
) {
  const rows = await db
    .prepare(`SELECT id, pack_id AS packId, credits, status, created_at AS createdAt
    FROM aizombie_test_checkouts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`)
    .bind(userId)
    .all();
  const balance = await db
    .prepare(`SELECT COALESCE(SUM(credits), 0) AS credits
    FROM aizombie_test_checkouts WHERE user_id = ? AND status = 'paid'`)
    .bind(userId)
    .first<{ credits: number }>();
  return { mode: 'test', credits: balance?.credits ?? 0, orders: rows.results };
}
