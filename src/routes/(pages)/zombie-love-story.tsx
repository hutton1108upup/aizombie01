import { TopicPage } from '@/components/blocks/topic-page';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(pages)/zombie-love-story')({
  head: () =>
    seo('/zombie-love-story', {
      canonicalLocale: 'en',
      alternateLocales: ['en'],
      title: 'Zombie Love Story — AI Zombie Video',
      description:
        'Cast the survivor and the person who turns in the two-photo hug story. 15-second cinematic clip with the cabin, the leap, and the wheat-field memory.',
    }),
  component: ZombieLoveStoryRoute,
});

function ZombieLoveStoryRoute() {
  return (
    <TopicPage
      eyebrow="Two-photo hug story"
      title="Make a Zombie Love Story"
      description="Cast one photo as the survivor and one as the turned partner. The cabin closes, the leap lands, and the same leap lands again as a hug in a golden wheat field."
    />
  );
}
