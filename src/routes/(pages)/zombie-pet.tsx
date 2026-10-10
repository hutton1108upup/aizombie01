import { TopicPage } from '@/components/blocks/topic-page';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(pages)/zombie-pet')({
  head: () =>
    seo('/zombie-pet', {
      canonicalLocale: 'en',
      alternateLocales: ['en'],
      title: 'Zombie Pet version — AI Zombie Video',
      description:
        'Same four-shot story with your pet as the zombie. Upload one photo of the survivor and one of the pet. Pet generation is a planned option and has not been validated.',
    }),
  component: ZombiePetRoute,
});

function ZombiePetRoute() {
  return (
    <TopicPage
      eyebrow="Pet version"
      title="Can my pet be the zombie?"
      description="Explore the planned pet workflow using local photo previews. Pet generation has not been validated and is not currently available."
    />
  );
}
