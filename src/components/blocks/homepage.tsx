import { useEffect, useId, useState } from 'react';
import Container from '@/components/layout/container';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import {
  IconCheck,
  IconPhotoPlus,
  IconSparkles,
  IconHeart,
  IconCookie,
  IconClock,
} from '@tabler/icons-react';
import { Routes } from '@/lib/routes';
import { readPreviewPhoto } from '@/aizombie/photos';
import { creditPacks } from '@/aizombie/contracts';

const FEATURE_PILLS = [
  { icon: IconPhotoPlus, label: '2 photos' },
  { icon: IconClock, label: '15 seconds' },
  { icon: IconSparkles, label: 'With sound' },
  { icon: IconSparkles, label: '16:9 or 9:16' },
] as const;

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
] as const;

const STEPS = [
  {
    n: '1',
    title: 'Add two photos',
    body: 'One of the person who holds the gun and one of the person, or pet, who turns. Faces go into every shot, so pick clear ones.',
  },
  {
    n: '2',
    title: 'Pick quality and format',
    body: '480p costs 100 credits and 720p costs 200. Choose 16:9 to match the trend, or 9:16 to fill a phone screen.',
  },
  {
    n: '3',
    title: 'Generation coming soon',
    body: 'Video generation and downloads will open after provider validation. This preview does not create a task.',
  },
] as const;

const PHOTO_TIPS = [
  'Front-facing, with the whole head in frame.',
  'Even light on the face. No sunglasses, masks or heavy filters.',
  'One person per photo. Group shots confuse the model.',
  'At least 300 px on each side, JPG, PNG or WebP, under 8 MB.',
  'Only people who agreed to appear. No celebrities, no children.',
] as const;

const PRICING = creditPacks.map((pack) => ({
  ...pack,
  price: `$${(pack.amount / 100).toFixed(2)}`,
  blurb: 'Proposed credit pack. Checkout is not open yet.',
  bullets: [
    `${pack.credits} credits`,
    'Planned: 100 credits per standard video',
    'Final expiry and refund terms will be confirmed before sales open',
  ],
}));

const FAQ = [
  {
    q: 'Can I generate a video now?',
    a: 'Not yet. This is a pre-launch preview. Photo previews work locally, but no photo is uploaded and no video is rendered.',
  },
  {
    q: 'What is the planned video format?',
    a: 'We are evaluating a 15-second zombie story made from two photos. Resolution, sound, timing and output quality will be confirmed using real samples before launch.',
  },
  {
    q: 'Can my pet be the zombie?',
    a: 'The pet option previews the proposed workflow. Pet generation has not been validated and is not currently available.',
  },
  {
    q: 'Can I buy credits?',
    a: 'Checkout is closed. Prices shown are proposed packs; no payment or credit deduction takes place in this preview.',
  },
  {
    q: 'What happens to my photos?',
    a: 'Photo previews are processed only in this browser tab. They are not uploaded or saved by the generator. Closing or reloading the page clears the previews. Provider processing and retention terms will be published before uploads open.',
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left'
      )}
    >
      {eyebrow ? (
        <div
          className={cn(
            'mb-4 text-sm font-medium text-primary',
            align === 'center' && 'justify-center'
          )}
        >
          {eyebrow}
        </div>
      ) : null}
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 text-balance text-base text-muted-foreground md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ExampleCard({
  label,
  tone,
}: {
  label: string;
  tone: 'normal' | 'infected';
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/50">
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden bg-gradient-to-br',
          tone === 'infected'
            ? 'from-infected/30 via-card to-background'
            : 'from-primary/30 via-card to-background'
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-foreground/80">
            <div className="flex size-14 items-center justify-center rounded-full bg-background/70 backdrop-blur">
              <svg
                viewBox="0 0 24 24"
                className="size-7 fill-current"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-xs uppercase tracking-wider">
              Demo placeholder
            </span>
          </div>
        </div>
        <div className="absolute bottom-2 right-2 rounded-md bg-background/70 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
          480p · 16:9
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-3 text-sm">{label}</div>
    </div>
  );
}

function GeneratorForm() {
  const [mode, setMode] = useState<'couple' | 'pet'>('couple');
  const [survivorPhoto, setSurvivorPhoto] = useState<string | null>(null);
  const [zombiePhoto, setZombiePhoto] = useState<string | null>(null);
  const [quality, setQuality] = useState<'480p' | '720p'>('480p');
  const [aspect, setAspect] = useState<'16:9' | '9:16'>('16:9');
  const [terms, setTerms] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const survivorLabel = 'Holds the gun';
  const zombieLabel = mode === 'couple' ? 'Turns into a zombie' : 'Your pet';

  async function readFile(
    e: React.ChangeEvent<HTMLInputElement>,
    onLoaded: (dataUrl: string | null) => void
  ) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    onLoaded(null);
    setPhotoError(null);
    setReading(true);
    try {
      onLoaded(await readPreviewPhoto(file));
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : 'Unable to preview this photo.'
      );
    } finally {
      setReading(false);
    }
  }

  return (
    <Card className="border-border/60 bg-card/60 p-2 backdrop-blur">
      <CardContent className="space-y-6 p-6" data-clarity-mask="true">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as 'couple' | 'pet')}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="couple">
              <IconHeart className="size-4" />
              Couple
            </TabsTrigger>
            <TabsTrigger value="pet">
              <IconCookie className="size-4" />
              Pet
            </TabsTrigger>
          </TabsList>
          <TabsContent value="couple" className="mt-6 space-y-6">
            <PhotoSlot
              label={survivorLabel}
              hint="Clear front-facing photo, face well lit"
              photo={survivorPhoto}
              onChange={(e) => readFile(e, setSurvivorPhoto)}
              onClear={() => setSurvivorPhoto(null)}
            />
            <PhotoSlot
              label={zombieLabel}
              hint="Clear front-facing photo of your partner or friend"
              photo={zombiePhoto}
              onChange={(e) => readFile(e, setZombiePhoto)}
              onClear={() => setZombiePhoto(null)}
              accent="infected"
            />
          </TabsContent>
          <TabsContent value="pet" className="mt-6 space-y-6">
            <PhotoSlot
              label={survivorLabel}
              hint="Clear front-facing photo, face well lit"
              photo={survivorPhoto}
              onChange={(e) => readFile(e, setSurvivorPhoto)}
              onClear={() => setSurvivorPhoto(null)}
            />
            <PhotoSlot
              label={zombieLabel}
              hint="Clear front-facing photo of your pet"
              photo={zombiePhoto}
              onChange={(e) => readFile(e, setZombiePhoto)}
              onClear={() => setZombiePhoto(null)}
              accent="infected"
            />
          </TabsContent>
        </Tabs>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Label>Quality</Label>
            <RadioGroup
              value={quality}
              onValueChange={(v) => setQuality(v as '480p' | '720p')}
              className="grid grid-cols-2 gap-3"
            >
              <QualityCard
                value="480p"
                credits="100 credits"
                selected={quality === '480p'}
              />
              <QualityCard
                value="720p"
                credits="200 credits"
                selected={quality === '720p'}
              />
            </RadioGroup>
          </div>
          <div className="space-y-3">
            <Label>Format</Label>
            <RadioGroup
              value={aspect}
              onValueChange={(v) => setAspect(v as '16:9' | '9:16')}
              className="grid grid-cols-2 gap-3"
            >
              <FormatCard
                value="16:9"
                subtitle="Like the trend"
                selected={aspect === '16:9'}
              />
              <FormatCard
                value="9:16"
                subtitle="Full screen"
                selected={aspect === '9:16'}
              />
            </RadioGroup>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Checkbox
            id="photo-consent"
            checked={terms}
            onCheckedChange={(v) => setTerms(Boolean(v))}
            className="mt-1"
          />
          <Label htmlFor="photo-consent">
            I only use photos of myself, my own pet, or people who agreed to
            appear, and I accept the{' '}
            <Link
              to={Routes.TermsOfService}
              className="text-primary underline-offset-4 hover:underline"
            >
              Terms
            </Link>
            . The video is AI-generated, not real footage.
          </Label>
        </div>

        {photoError ? (
          <p
            role="alert"
            data-testid="photo-error"
            className="text-sm text-destructive"
          >
            {photoError}
          </p>
        ) : null}
        {reading ? <output>Checking photo…</output> : null}
        <button
          type="button"
          disabled
          data-testid="generate-video"
          className={cn(
            buttonVariants({ size: 'lg' }),
            'h-12 w-full rounded-xl opacity-60'
          )}
        >
          Video generation coming soon
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Preview only. Photos remain in this tab. No upload, payment or
          generation is performed.
        </p>
      </CardContent>
    </Card>
  );
}

function PhotoSlot({
  label,
  hint,
  photo,
  onChange,
  onClear,
  accent,
}: {
  label: string;
  hint: string;
  photo: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  accent?: 'infected';
}) {
  const inputId = useId();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return (
    <div className="space-y-2">
      <div className="text-base font-medium">{label}</div>
      <p className="text-sm text-muted-foreground">{hint}</p>
      <label
        htmlFor={inputId}
        className={cn(
          'relative flex min-h-40 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border bg-card/40 transition-colors hover:bg-card/70',
          accent === 'infected' && 'border-infected/40'
        )}
      >
        {photo ? (
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={label} className="size-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClear();
              }}
              className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-1 text-xs"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <IconPhotoPlus className="size-6" />
            <span className="text-sm font-medium">Add photo</span>
          </div>
        )}
        <input
          disabled={!hydrated}
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label={label}
          data-testid={accent ? 'zombie-photo' : 'survivor-photo'}
          className="sr-only"
          onChange={onChange}
        />
      </label>
    </div>
  );
}

function QualityCard({
  value,
  credits,
  selected,
}: {
  value: string;
  credits: string;
  selected: boolean;
}) {
  return (
    <Label
      className={cn(
        'flex cursor-pointer items-center justify-between rounded-xl border bg-card/40 p-4 transition-colors',
        selected ? 'border-primary bg-primary/10' : 'border-border'
      )}
    >
      <RadioGroupItem value={value} className="sr-only" />
      <span className="text-base font-medium">{value}</span>
      <span className="text-sm text-muted-foreground">{credits}</span>
    </Label>
  );
}

function FormatCard({
  value,
  subtitle,
  selected,
}: {
  value: string;
  subtitle: string;
  selected: boolean;
}) {
  return (
    <Label
      className={cn(
        'flex cursor-pointer flex-col items-start gap-1 rounded-xl border bg-card/40 p-4 transition-colors',
        selected ? 'border-primary bg-primary/10' : 'border-border'
      )}
    >
      <RadioGroupItem value={value} className="sr-only" />
      <span className="text-base font-medium">{value}</span>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </Label>
  );
}

export function HomePage() {
  return (
    <div className="flex flex-col">
      {/* 2. Hero */}
      <section id="hero" className="relative pt-12 md:pt-16">
        <Container className="px-6">
          <div className="mx-auto max-w-4xl text-center">
            <Badge
              variant="outline"
              className="rounded-full border-primary/40 px-3 py-1 text-xs uppercase tracking-wider text-primary"
            >
              Pre-launch preview
            </Badge>
            <h1 className="mt-6 text-balance text-3xl font-extrabold uppercase tracking-tight md:text-5xl lg:text-6xl">
              AI Zombie Video Generator
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-balance text-base text-muted-foreground md:text-lg">
              Two photos in. One of you has turned, the other cannot pull the
              trigger, and the last thing you see is your best day together. The
              viral zombie trend clip, made for you shot by shot.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              {FEATURE_PILLS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-foreground/80"
                >
                  <Icon className="size-3.5 text-primary" />
                  {label}
                </span>
              ))}
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Concept preview. Real generated samples are not available yet.
            </p>
          </div>
        </Container>
      </section>

      {/* 3. Generator */}
      <section id="generator" className="py-12 md:py-20">
        <Container className="px-6">
          <div className="mx-auto max-w-3xl">
            <SectionHeading
              title="Make your AI zombie video"
              description="Preview two photos and explore the planned format. Generation is not open yet."
            />
            <div className="mt-10">
              <GeneratorForm />
            </div>
          </div>
        </Container>
      </section>

      {/* 4. Shot list */}
      <section id="shots" className="bg-muted/30 py-12 md:py-20">
        <Container className="px-6">
          <SectionHeading
            eyebrow="What happens in your AI zombie video"
            title="Every clip follows the shot list of the trend"
            description="So yours cuts the same way as the ones in your feed."
          />
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
        </Container>
      </section>

      {/* 5. Examples */}
      <section id="examples" className="py-12 md:py-20">
        <Container className="px-6">
          <SectionHeading
            title="AI zombie video examples"
            description="Both clips came out of this generator as you see them, sound included. Press play."
          />
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            <ExampleCard label="Couple version, 16:9, 480p" tone="normal" />
            <ExampleCard label="Pet version, 16:9, 480p" tone="infected" />
          </div>
          <div className="mt-6 text-center text-sm">
            <Link
              to="/ai-zombie-video-examples"
              className="text-primary underline-offset-4 hover:underline"
            >
              See all examples →
            </Link>
          </div>
        </Container>
      </section>

      {/* 6. How to */}
      <section id="how-to" className="bg-muted/30 py-12 md:py-20">
        <Container className="px-6">
          <SectionHeading
            title="How to make an AI zombie video"
            description="There is no prompt to write and nothing to edit. The shot list is built in."
          />
          <ol className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="rounded-xl border border-border/60 bg-card/50 p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mx-auto mt-12 max-w-4xl rounded-xl border border-border/60 bg-card/50 p-6">
            <h3 className="text-base font-semibold">Photos that work best</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {PHOTO_TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <IconCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 text-center text-sm">
            <Link
              to="/zombie-love-story"
              className="text-primary underline-offset-4 hover:underline"
            >
              Make a Zombie Love Story →
            </Link>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              Cast the survivor and the person who turns in the two-photo hug
              story.
            </span>
          </div>
        </Container>
      </section>

      {/* 7. Pricing */}
      <section id="pricing" className="py-12 md:py-20">
        <Container className="px-6">
          <SectionHeading
            eyebrow="Proposed pricing"
            title="Credit packs planned for launch"
            description="A 480p video costs 100 credits and a 720p video costs 200."
          />
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {PRICING.map((p) => (
              <Card
                key={p.name}
                className={cn(
                  'relative border-border/60 bg-card/50',
                  p.popular && 'border-primary ring-2 ring-primary/40'
                )}
              >
                {p.popular ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most popular
                  </div>
                ) : null}
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.blurb}</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">
                      {p.price}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled
                    data-testid={`credit-pack-${p.id}`}
                    className={cn(
                      buttonVariants({
                        variant: p.popular ? 'default' : 'outline',
                      }),
                      'w-full'
                    )}
                  >
                    Checkout coming soon
                  </button>
                  <ul className="mt-4 space-y-2 text-sm">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <IconCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{b}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="bg-muted/30 py-12 md:py-20">
        <Container className="px-6">
          <SectionHeading title="AI zombie video FAQ" />
          <div className="mx-auto mt-10 max-w-3xl">
            <Accordion className="w-full">
              {FAQ.map((item, i) => (
                <AccordionItem key={item.q} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-base font-medium">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Container>
      </section>
    </div>
  );
}
