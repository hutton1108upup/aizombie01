import { createFileRoute } from '@tanstack/react-router';
import { env } from 'cloudflare:workers';
import { testPaymentConfig } from '@/aizombie/waffo-contracts';
import { handleTestCreditWebhook } from '@/aizombie/waffo-payments';
import { InvalidWebhookSignatureError } from '@/payment/errors';

export const Route = createFileRoute('/api/aizombie/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = testPaymentConfig(process.env);
        if (!config)
          return Response.json(
            { error: 'Test payments disabled.' },
            { status: 503 }
          );
        const signature = request.headers.get('x-waffo-signature');
        if (!signature)
          return Response.json(
            { error: 'Missing signature.' },
            { status: 400 }
          );
        const reader = request.body?.getReader();
        if (!reader) return new Response(null, { status: 400 });
        const parts: Uint8Array[] = [];
        let size = 0;
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
            env.DB,
            config,
            new TextDecoder().decode(bytes),
            signature
          );
          return Response.json({ received: true });
        } catch (error) {
          return Response.json(
            { error: 'Webhook rejected.' },
            {
              status: error instanceof InvalidWebhookSignatureError ? 400 : 500,
            }
          );
        }
      },
    },
  },
});
