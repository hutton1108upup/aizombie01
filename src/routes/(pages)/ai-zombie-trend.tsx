import { TopicPage } from '@/components/blocks/topic-page';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(pages)/ai-zombie-trend')({
  head: () =>
    seo('/ai-zombie-trend', {
      canonicalLocale: 'en',
      alternateLocales: ['en'],
      title: 'AI zombie trend — AI Zombie Video',
      description:
        'What is the AI zombie trend? Same shot list as TikTok: tearful standoff, close-up, leap, wheat-field memory. 15 seconds, with sound.',
    }),
  component: AiZombieTrendRoute,
});

function AiZombieTrendRoute() {
  return (
    <TopicPage
      eyebrow="The viral TikTok trend"
      title="What is the AI zombie trend?"
      description="The AI zombie trend is the TikTok template where a tearful survivor holds a gun, a turned friend walks closer, the gun drops, and the clip cuts to a golden wheat-field memory. Our generator rebuilds the same four beats from two photos in minutes."
    />
  );
}
