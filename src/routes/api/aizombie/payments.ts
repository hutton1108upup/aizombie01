import { createFileRoute } from '@tanstack/react-router';
import { env } from 'cloudflare:workers';
import type { z } from 'zod';
import { auth } from '@/auth/auth';
import {
  readSmallJson,
  requireSameOrigin,
  requireVideoUser,
} from '@/aizombie/access';
import {
  creditCheckoutSchema,
  testPaymentConfig,
} from '@/aizombie/waffo-contracts';
import {
  createTestCreditCheckout,
  testCreditHistory,
} from '@/aizombie/waffo-payments';

function unavailable() {
  return Response.json(
    { error: 'Test checkout is not configured.' },
    { status: 503 }
  );
}

export const Route = createFileRoute('/api/aizombie/payments')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const access = await requireVideoUser(request);
        if (access.response) return access.response;
        if (!testPaymentConfig(process.env)) return unavailable();
        return Response.json(await testCreditHistory(env.DB, access.userId), {
          headers: { 'Cache-Control': 'private, no-store' },
        });
      },
      POST: async ({ request }) => {
        const originError = requireSameOrigin(request);
        if (originError) return originError;
        const access = await requireVideoUser(request);
        if (access.response) return access.response;
        const config = testPaymentConfig(process.env);
        if (!config) return unavailable();
        let input: z.infer<typeof creditCheckoutSchema>;
        try {
          input = creditCheckoutSchema.parse(await readSmallJson(request));
        } catch {
          return Response.json(
            { error: 'Invalid checkout request.' },
            { status: 400 }
          );
        }
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user.email)
          return Response.json({ error: 'Sign in again.' }, { status: 401 });
        try {
          const result = await createTestCreditCheckout(env.DB, config, {
            ...input,
            userId: access.userId,
            email: session.user.email,
            origin: new URL(request.url).origin,
          });
          return Response.json(result, {
            headers: { 'Cache-Control': 'private, no-store' },
          });
        } catch {
          return Response.json(
            {
              error:
                'Could not create checkout. Retry this request or contact support.',
            },
            { status: 502 }
          );
        }
      },
    },
  },
});
