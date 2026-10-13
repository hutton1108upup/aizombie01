import { handleTestCreditWebhook } from '@/aizombie/waffo-payments';
import { InvalidWebhookSignatureError } from '@/payment/errors';

// No checkout creation, credentials, auth helpers or UI. Only the pinned store's
// platform-signed Test events can mutate the isolated sandbox database.
const config = {
  storeId: 'STO_1gfx0lwWHQDjgobmY2EziC',
  products: {
    single: 'PROD_10JcI98N2jEbfDyypVRfvZ',
    starter: 'PROD_4GW2DUS6MxYg1NJ8wUiH8Q',
    creator: 'PROD_26FJ6F9jgsj0Gduykf1mj2',
  },
};

export async function testReceiverRequest(request: Request, db: D1Database) {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/health') {
    return Response.json(
      { service: 'aizombie-waffo-test', mode: 'test' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
  if (url.pathname !== '/api/aizombie/payments/webhook')
    return new Response(null, { status: 404 });
  if (request.method !== 'POST')
    return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  const signature = request.headers.get('x-waffo-signature');
  if (!signature)
    return Response.json({ error: 'Missing signature.' }, { status: 400 });
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  let size = 0;
  const parts: Uint8Array[] = [];
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 65536) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      parts.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  try {
    await handleTestCreditWebhook(
      db,
      config,
      new TextDecoder().decode(bytes),
      signature
    );
    return Response.json({ received: true });
  } catch (error) {
    return Response.json(
      { error: 'Test webhook rejected.' },
      { status: error instanceof InvalidWebhookSignatureError ? 400 : 500 }
    );
  }
}

export default {
  fetch: (request: Request, bindings: { DB: D1Database }) =>
    testReceiverRequest(request, bindings.DB),
};
