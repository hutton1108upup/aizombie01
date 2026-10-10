import Container from '@/components/layout/container';
import { Card, CardContent } from '@/components/ui/card';
import { seo } from '@/lib/seo';
import { Link } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const EXAMPLES = [
  { id: 'couple-1', label: 'Couple, 16:9, 480p', tone: 'normal' as const },
  { id: 'couple-2', label: 'Couple, 9:16, 480p', tone: 'normal' as const },
  { id: 'pet-1', label: 'Pet, 16:9, 480p', tone: 'infected' as const },
  { id: 'pet-2', label: 'Pet, 9:16, 480p', tone: 'infected' as const },
  { id: 'couple-3', label: 'Couple HD, 16:9, 720p', tone: 'normal' as const },
  { id: 'pet-3', label: 'Pet HD, 9:16, 720p', tone: 'infected' as const },
];

export const Route = createFileRoute('/(pages)/ai-zombie-video-examples')({
  head: () =>
    seo('/ai-zombie-video-examples', {
      canonicalLocale: 'en',
      alternateLocales: ['en'],
      title: 'AI zombie video examples — AI Zombie Video',
      description:
        'See AI zombie video examples: couples, pets, HD, 16:9 and 9:16. Concept cards only. Real generated samples are not available yet.',
    }),
  component: ExamplesRoute,
});

function ExamplesRoute() {
  return (
    <Container className="px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <Badge
          variant="outline"
          className="rounded-full border-primary/40 px-3 py-1 text-xs uppercase tracking-wider text-primary"
        >
          Examples
        </Badge>
        <h1 className="mt-6 text-balance text-3xl font-extrabold uppercase tracking-tight md:text-5xl">
          AI zombie video examples
        </h1>
        <p className="mx-auto mt-6 text-balance text-base text-muted-foreground md:text-lg">
          These are concept cards, not playable samples or generated results.
          Real samples will be published after provider validation.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 md:grid-cols-3">
        {EXAMPLES.map((e) => (
          <Card
            key={e.id}
            className="overflow-hidden border-border/60 bg-card/50"
          >
            <div
              className={cn(
                'relative aspect-video w-full overflow-hidden bg-gradient-to-br',
                e.tone === 'infected'
                  ? 'from-infected/30 via-card to-background'
                  : 'from-primary/30 via-card to-background'
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-background/70 backdrop-blur">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-7 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 rounded-md bg-background/70 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                Demo placeholder
              </div>
            </div>
            <CardContent className="p-4 text-sm">{e.label}</CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center text-sm">
        <Link
          to="/"
          hash="generator"
          className="text-primary underline-offset-4 hover:underline"
        >
          Make one now →
        </Link>
      </div>
    </Container>
  );
}
