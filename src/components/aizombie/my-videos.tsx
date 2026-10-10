import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardHeader } from '@/components/layout/dashboard-header';

const responseSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.string().uuid(),
      status: z.enum(['queued', 'running', 'done', 'failed']),
      quality: z.enum(['480p', '720p']),
      aspect: z.enum(['16:9', '9:16']),
      createdAt: z.number(),
      error: z.string().nullable(),
      videoUrl: z.string().nullable(),
    })
  ),
});
type Job = z.infer<typeof responseSchema>['jobs'][number];

export function MyVideos() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    async function load() {
      try {
        const response = await fetch('/api/aizombie/jobs', {
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? 'Sign in to view your videos.'
              : 'Could not load videos. Try again.'
          );
        const body = responseSchema.parse(await response.json());
        setJobs(body.jobs);
        setError(null);
        const pending = body.jobs.some(
          (j) => j.status === 'queued' || j.status === 'running'
        );
        if (pending && attempts++ < 120) timer = setTimeout(load, 5000);
        else if (pending)
          setError(
            'This task is taking longer than expected. Refresh to check again.'
          );
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : 'Could not load videos.'
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [refresh]);

  async function remove(job: Job) {
    setDeleting(job.id);
    try {
      const response = await fetch(`/api/aizombie/jobs/${job.id}`, {
        method: 'DELETE',
      });
      if (!response.ok)
        throw new Error('Could not delete this video. Try again.');
      setJobs((current) => current.filter((entry) => entry.id !== job.id));
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Could not delete video.'
      );
    } finally {
      setDeleting(null);
    }
  }
  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: 'My videos', isCurrentPage: true }]}
      />
      <div className="space-y-6 p-6" data-testid="my-videos">
        <h1 className="text-2xl font-semibold">My videos</h1>
        <p className="text-muted-foreground">
          Generation and checkout are not open yet. Only your own tasks appear
          here.
        </p>
        <button
          type="button"
          onClick={() => setRefresh((value) => value + 1)}
          data-testid="refresh-videos"
          className="rounded-md border px-4 py-2"
        >
          Refresh
        </button>
        {loading ? <output>Loading videos…</output> : null}
        {error ? <p role="alert">{error}</p> : null}
        {!loading && !error && jobs.length === 0 ? (
          <p data-testid="videos-empty">
            No videos yet.{' '}
            <Link to="/" hash="generator" className="underline">
              Explore the preview
            </Link>
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job.id} data-testid="video-job" data-job-id={job.id}>
              <CardContent className="space-y-3 p-4">
                <p>
                  {job.quality} · {job.aspect} · {job.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(job.createdAt).toLocaleString()}
                </p>
                {job.status === 'done' && job.videoUrl ? (
                  <>
                    <video
                      controls
                      preload="metadata"
                      src={`/api/aizombie/jobs/${job.id}/video`}
                      className="w-full rounded-md"
                    >
                      <track kind="captions" />
                    </video>
                    <a
                      href={`/api/aizombie/jobs/${job.id}/video?download=1`}
                      className="underline"
                    >
                      Download MP4
                    </a>
                  </>
                ) : null}
                {job.error ? <p role="alert">{job.error}</p> : null}
                {job.status === 'done' || job.status === 'failed' ? (
                  <button
                    type="button"
                    disabled={deleting === job.id}
                    onClick={() => void remove(job)}
                    className="block rounded-md border px-3 py-1"
                  >
                    Delete video
                  </button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
