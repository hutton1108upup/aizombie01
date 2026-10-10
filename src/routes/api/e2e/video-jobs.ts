import { createFileRoute } from '@tanstack/react-router';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { user } from '@/db/auth.schema';
import { videoJobs } from '@/db/video.schema';

export const Route = createFileRoute('/api/e2e/video-jobs')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (
          !(import.meta.env.DEV && import.meta.env.MODE === 'e2e') ||
          request.headers.get('x-e2e-secret') !== 'local-e2e-secret'
        ) {
          return new Response('Not found', { status: 404 });
        }
        const body = z
          .object({
            email: z.email().startsWith('e2e-').endsWith('@example.test'),
          })
          .safeParse(await request.json());
        if (!body.success)
          return new Response('Invalid test account', { status: 400 });
        const db = getDb();
        const [owner] = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, body.data.email))
          .limit(1);
        if (!owner) return new Response('Not found', { status: 404 });
        const id = crypto.randomUUID();
        await db.insert(videoJobs).values({
          id,
          userId: owner.id,
          idempotencyKey: crypto.randomUUID(),
          status: 'failed',
          mode: 'couple',
          quality: '480p',
          aspect: '16:9',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          error: 'Test failure',
        });
        return Response.json({ id });
      },
    },
  },
});
