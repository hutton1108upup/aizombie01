import Container from '@/components/layout/container';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const SHOTS = [
  {
    time: '0 to 4 s',
    title: 'The cabin',
    body: 'A tearful close-up behind a raised gun, then the turned one walking closer across the room.',
  },
  {
    time: '4 to 6 s',
    title: 'The face',
    body: 'An extreme close-up of the zombie: grey skin, white eyes, bared teeth.',
  },
  {
    time: '6 to 10 s',
    title: 'The leap',
    body: 'The survivor drops the gun and opens both arms. The zombie sprints across the cabin and leaps at them.',
  },
  {
    time: '10 to 15 s',
    title: 'The memory',
    body: 'In mid-air the film cuts to a golden wheat field, and the same leap lands as a hug between the two of you, alive.',
  },
];

export interface TopicPageProps {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  extra?: React.ReactNode;
}

export function TopicPage({
  eyebrow,
  title,
  description,
  ctaLabel = 'Explore the preview',
  ctaHref = '/',
  extra,
}: TopicPageProps) {
  return (
    <Container className="px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <Badge
          variant="outline"
          className="rounded-full border-primary/40 px-3 py-1 text-xs uppercase tracking-wider text-primary"
        >
          {eyebrow}
        </Badge>
        <h1 className="mt-6 text-balance text-3xl font-extrabold uppercase tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-6 text-balance text-base text-muted-foreground md:text-lg">
          {description}
        </p>
      </div>

      {extra ?? null}

      <ol className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
        {SHOTS.map((s, i) => (
          <li
            key={s.title}
            className="rounded-xl border border-border/60 bg-card/50 p-6"
          >
            <div className="flex items-baseline gap-3 text-sm uppercase tracking-wider text-primary">
              Step {i + 1}
              <span className="text-muted-foreground">· {s.time}</span>
            </div>
            <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>

      <Card className="mx-auto mt-12 max-w-3xl border-border/60 bg-card/50">
        <CardContent className="space-y-4 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Ready to make the trend yours?
          </p>
          <Link
            to={ctaHref}
            hash="generator"
            className={cn(buttonVariants({ size: 'lg' }), 'h-12 px-6')}
          >
            {ctaLabel}
          </Link>
        </CardContent>
      </Card>
    </Container>
  );
}
