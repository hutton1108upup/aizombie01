import { z } from 'zod';
import { creditPacks } from '@/aizombie/contracts';

export const creditCheckoutSchema = z
  .object({
    packId: z.enum(['single', 'starter', 'creator']),
    requestId: z.string().uuid(),
  })
  .strict();

export type CreditPackId = z.infer<typeof creditCheckoutSchema>['packId'];
export type TestPaymentConfig = {
  merchantId: string;
  privateKey: string;
  storeId: string;
  products: Record<CreditPackId, string>;
};

// Explicit Test-only switch. Never fall back to another provider's credentials.
export function testPaymentConfig(
  values: Record<string, string | undefined>
): TestPaymentConfig | null {
  if (values.AIZOMBIE_WAFFO_TEST_ENABLED !== 'true') return null;
  const merchantId = values.AIZOMBIE_WAFFO_TEST_MERCHANT_ID;
  const privateKey = values.AIZOMBIE_WAFFO_TEST_PRIVATE_KEY;
  const storeId = values.AIZOMBIE_WAFFO_TEST_STORE_ID;
  const products = {
    single: values.AIZOMBIE_WAFFO_TEST_SINGLE_PRODUCT_ID,
    starter: values.AIZOMBIE_WAFFO_TEST_STARTER_PRODUCT_ID,
    creator: values.AIZOMBIE_WAFFO_TEST_CREATOR_PRODUCT_ID,
  };
  if (
    !merchantId?.startsWith('MER_') ||
    !privateKey ||
    !storeId?.startsWith('STO_') ||
    Object.values(products).some((id) => !id?.startsWith('PROD_')) ||
    new Set(Object.values(products)).size !== 3
  )
    return null;
  return {
    merchantId,
    privateKey,
    storeId,
    products: products as Record<CreditPackId, string>,
  };
}

export function usdCents(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d{1,8}(\.\d{1,2})?$/.test(value))
    return null;
  const [dollars, cents = ''] = value.split('.');
  return Number(dollars) * 100 + Number(cents.padEnd(2, '0'));
}

const eventSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.enum(['order.completed', 'refund.succeeded', 'refund.failed']),
  storeId: z.string(),
  mode: z.literal('test'),
  data: z.object({
    orderId: z.string().min(1),
    orderMerchantExternalId: z.string().uuid(),
    merchantProvidedBuyerIdentity: z.string().min(1),
    currency: z.literal('USD'),
    orderStatus: z.string().optional(),
    paymentStatus: z.string().optional(),
    refundStatus: z.string().optional(),
    listPrice: z.object({ subtotal: z.string() }).optional(),
    orderMetadata: z.object({
      app: z.literal('aizombie'),
      userId: z.string().min(1),
      packId: z.enum(['single', 'starter', 'creator']),
      productId: z.string().min(1),
    }),
  }),
});

export function validateTestCreditEvent(
  raw: unknown,
  config: TestPaymentConfig
) {
  const event = eventSchema.parse(raw);
  const metadata = event.data.orderMetadata;
  if (
    event.storeId !== config.storeId ||
    metadata.productId !== config.products[metadata.packId] ||
    event.data.merchantProvidedBuyerIdentity !== metadata.userId
  ) {
    throw new Error('Payment store, product or buyer does not match.');
  }
  const pack = creditPacks.find((entry) => entry.id === metadata.packId);
  if (!pack) throw new Error('Unknown credit pack.');
  if (
    event.eventType === 'order.completed' &&
    (event.data.orderStatus !== 'completed' ||
      event.data.paymentStatus !== 'succeeded' ||
      usdCents(event.data.listPrice?.subtotal) !== pack.amount)
  )
    throw new Error('Payment status or list price does not match.');
  if (
    event.eventType === 'refund.succeeded' &&
    event.data.refundStatus !== 'succeeded'
  )
    throw new Error('Refund has not succeeded.');
  return { event, pack, metadata };
}
