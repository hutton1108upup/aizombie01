import { createFileRoute } from '@tanstack/react-router';
import { env } from 'cloudflare:workers';
import { getOwnedVideoJob } from '../$id';

export const Route = createFileRoute('/api/aizombie/jobs/$id/video')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const result = await getOwnedVideoJob(request, params.id);
        if (result.response) return result.response;
        if (result.job.status !== 'done' || !result.job.videoKey) {
          return Response.json(
            { error: 'Video is not ready.' },
            { status: 404 }
          );
        }
        const file = await env.BUCKET.get(result.job.videoKey, {
          range: request.headers,
        });
        if (!file) return new Response('Not found', { status: 404 });
        const download =
          new URL(request.url).searchParams.get('download') === '1';
        const headers = new Headers({
          'Content-Type': 'video/mp4',
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
          'Accept-Ranges': 'bytes',
          'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="video-${result.job.id}.mp4"`,
        });
        const range = file.range;
        if (range && 'offset' in range && 'length' in range && range.length) {
          const offset = range.offset ?? 0;
          headers.set(
            'Content-Range',
            `bytes ${offset}-${offset + range.length - 1}/${file.size}`
          );
          headers.set('Content-Length', String(range.length));
          return new Response(file.body, { status: 206, headers });
        }
        headers.set('Content-Length', String(file.size));
        return new Response(file.body, { headers });
      },
    },
  },
});
