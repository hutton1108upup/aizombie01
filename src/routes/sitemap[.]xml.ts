import { createFileRoute } from '@tanstack/react-router';
import { getBaseUrl } from '@/lib/urls';
import { renderSitemap } from '@/lib/sitemap';
import { getSortedPosts } from '@/lib/blog';
import { getPageLocales } from '@/lib/pages';
import { websiteConfig } from '@/config/website';
import { locales, type Locale } from '@/lib/locale';

/**
 * Dynamic sitemap.xml
 * https://tanstack.dev/start/latest/docs/framework/react/guide/seo#dynamic-sitemap
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const base = getBaseUrl().replace(/\/$/, '');
        const staticUrls: {
          path: string;
          changefreq?: string;
          priority?: string;
          lastmod?: string;
          availableLocales?: Locale[];
        }[] = [
          {
            path: '/',
            changefreq: 'weekly',
            priority: '1.0',
            availableLocales: ['en'],
          },
          {
            path: '/ai-zombie-trend',
            changefreq: 'monthly',
            availableLocales: ['en'],
          },
          {
            path: '/zombie-love-story',
            changefreq: 'monthly',
            availableLocales: ['en'],
          },
          {
            path: '/zombie-pet',
            changefreq: 'monthly',
            availableLocales: ['en'],
          },
          {
            path: '/ai-zombie-video-examples',
            changefreq: 'monthly',
            availableLocales: ['en'],
          },
          { path: '/pricing', changefreq: 'monthly', availableLocales: ['en'] },
          { path: '/terms', changefreq: 'monthly' },
          { path: '/privacy', changefreq: 'monthly' },
          { path: '/cookie', changefreq: 'monthly' },
        ];

        if (websiteConfig.blog?.enable) {
          staticUrls.push({ path: '/blog', changefreq: 'weekly' });
        }

        const pages = staticUrls.map((page) => ({
          ...page,
          availableLocales: ['/terms', '/privacy', '/cookie'].includes(
            page.path
          )
            ? getPageLocales(page.path.slice(1))
            : page.availableLocales,
        }));
        if (websiteConfig.blog?.enable) {
          const postsBySlug = new Map<
            string,
            { availableLocales: Locale[]; lastmod: string }
          >();
          for (const locale of locales) {
            for (const post of getSortedPosts(locale)) {
              const existing = postsBySlug.get(post.slug);
              if (existing) {
                existing.availableLocales.push(locale);
              } else {
                postsBySlug.set(post.slug, {
                  availableLocales: [locale],
                  lastmod: new Date(post.date).toISOString().slice(0, 10),
                });
              }
            }
          }
          for (const [slug, post] of postsBySlug) {
            pages.push({
              path: `/blog/${slug}`,
              changefreq: 'weekly',
              lastmod: post.lastmod,
              availableLocales: post.availableLocales,
            });
          }
        }

        const sitemap = renderSitemap(base, pages);

        return new Response(sitemap, {
          headers: {
            'Content-Type': 'application/xml',
          },
        });
      },
    },
  },
});
