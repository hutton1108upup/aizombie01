import { createFileRoute } from '@tanstack/react-router';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { createJobSchema } from '@/aizombie/contracts';
import {
  readSmallJson,
  requireSameOrigin,
  requireVideoUser,
} from '@/aizombie/access';
import { getDb } from '@/db';
import { videoJobs } from '@/db/video.schema';

export async function createVideoJob(request: Request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const access = await requireVideoUser(request);
  if (access.response) return access.response;
  let raw: unknown;
  try {
    raw = await readSmallJson(request);
  } catch {
    return Response.json(
      { error: 'Invalid JSON or request exceeds 4 KB.' },
      { status: 400 }
    );
  }
  if (!createJobSchema.safeParse(raw).success) {
    return Response.json(
      { error: 'Two uploaded photo references and consent are required.' },
      { status: 422 }
    );
  }
  // Enabling this requires private uploads, credit reservation and a real queue.
  // No fake jobs, credit deductions or provider calls are made here.
  return Response.json(
    {
      code: 'generation_unavailable',
      error: 'Video generation is not available yet. No credits were charged.',
    },
    { status: 503 }
  );
}

export async function listVideoJobs(request: Request) {
  const access = await requireVideoUser(request);
  if (access.response) return access.response;
  const rows = await getDb()
    .select()
    .from(videoJobs)
    .where(
      and(eq(videoJobs.userId, access.userId), isNull(videoJobs.deletedAt))
    )
    .orderBy(desc(videoJobs.createdAt))
    .limit(50);
  return Response.json(
    {
      jobs: rows.map((job) => ({
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
      })),
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}

export const Route = createFileRoute('/api/aizombie/jobs')({
  server: {
    handlers: {
      POST: ({ request }) => createVideoJob(request),
      GET: ({ request }) => listVideoJobs(request),
    },
  },
});
