import type { MenuItemConfig } from '../types';
export function getFooterLinks(): MenuItemConfig[] {
  return [
    {
      title: 'Product',
      items: [
        { title: 'Preview', href: '/#generator', external: false },
        {
          title: 'Examples',
          href: '/ai-zombie-video-examples',
          external: false,
        },
        { title: 'Planned pricing', href: '/pricing', external: false },
      ],
    },
    {
      title: 'Stories',
      items: [
        { title: 'Trend', href: '/ai-zombie-trend', external: false },
        { title: 'Love story', href: '/zombie-love-story', external: false },
        { title: 'Pet', href: '/zombie-pet', external: false },
      ],
    },
    {
      title: 'Legal',
      items: [
        { title: 'Terms', href: '/terms', external: false },
        { title: 'Privacy', href: '/privacy', external: false },
        { title: 'Cookies', href: '/cookie', external: false },
      ],
    },
  ];
}
