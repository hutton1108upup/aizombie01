import { createFileRoute } from '@tanstack/react-router';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { env } from 'cloudflare:workers';
import { requireSameOrigin, requireVideoUser } from '@/aizombie/access';
import { getDb } from '@/db';
import { videoJobs } from '@/db/video.schema';

export async function getOwnedVideoJob(request: Request, id: string) {
  const access = await requireVideoUser(request);
  if (access.response) return { response: access.response };
  if (!z.string().uuid().safeParse(id).success) {
    return {
      response: Response.json({ error: 'Invalid job ID.' }, { status: 400 }),
    };
  }
  const [job] = await getDb()
    .select()
    .from(videoJobs)
    .where(
      and(
        eq(videoJobs.id, id),
        eq(videoJobs.userId, access.userId),
        isNull(videoJobs.deletedAt)
      )
    )
    .limit(1);
  if (!job)
    return {
      response: Response.json({ error: 'Not found.' }, { status: 404 }),
    };
  return { job };
}

export async function readVideoJob(request: Request, id: string) {
  const result = await getOwnedVideoJob(request, id);
  if (result.response) return result.response;
  const { job } = result;
  return Response.json(
    {
      id: job.id,
      status: job.status,
      quality: job.quality,
      aspect: job.aspect,
      createdAt: job.createdAt,
      error: job.error,
      videoUrl:
        job.status === 'done' && job.videoKey
          ? `/api/aizombie/jobs/${job.id}/video`
          : null,
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}

export async function deleteVideoJob(request: Request, id: string) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const result = await getOwnedVideoJob(request, id);
  if (result.response) return result.response;
  if (result.job.status === 'queued' || result.job.status === 'running') {
    return Response.json(
      { error: 'Wait until this task finishes before deleting it.' },
      { status: 409 }
    );
  }
  if (result.job.videoKey) await env.BUCKET.delete(result.job.videoKey);
  // Retain accounting history: deletion must not restore spent credits.
  await getDb()
    .update(videoJobs)
    .set({ deletedAt: Date.now(), videoKey: null })
    .where(and(eq(videoJobs.id, id), eq(videoJobs.userId, result.job.userId)));
  return new Response(null, { status: 204 });
}

export const Route = createFileRoute('/api/aizombie/jobs/$id')({
  server: {
    handlers: {
      GET: ({ request, params }) => readVideoJob(request, params.id),
      DELETE: ({ request, params }) => deleteVideoJob(request, params.id),
    },
  },
});
