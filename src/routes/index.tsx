import { HomePage } from '@/components/blocks/homepage';
import { websiteConfig } from '@/config/website';
import { seo } from '@/lib/seo';
import { getCanonicalUrlForLocale } from '@/lib/urls';
import { localeConfig } from '@/lib/locale';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  head: () => {
    const name = websiteConfig.metadata?.name ?? '';
    const title = websiteConfig.metadata?.title ?? '';
    const description = websiteConfig.metadata?.description ?? '';
    const url = getCanonicalUrlForLocale('/', 'en');
    const inLanguage = localeConfig.en.hreflang;
    const webSiteJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name,
      description,
      url,
      inLanguage,
    };
    const metadata = seo('/', {
      title,
      description,
      canonicalLocale: 'en',
      alternateLocales: ['en'],
    });
    return {
      ...metadata,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(webSiteJsonLd),
        },
      ],
    };
  },
  component: HomePage,
});
