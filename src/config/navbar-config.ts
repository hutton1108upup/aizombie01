import {
  IconRoute,
  IconHeart,
  IconCookie,
  IconVideo,
} from '@tabler/icons-react';
import type { MenuItemConfig } from '../types';
import { Routes as DefaultRoutes } from '@/lib/routes';

/**
 * AI Zombie Video navbar links — hard-coded (we don't ship a separate locale
 * for marketing copy at this stage).
 */
export function getNavbarLinks(): MenuItemConfig[] {
  const links: MenuItemConfig[] = [
    {
      title: 'Trend',
      href: '/ai-zombie-trend',
      icon: IconRoute,
      external: false,
    },
    {
      title: 'Love story',
      href: '/zombie-love-story',
      icon: IconHeart,
      external: false,
    },
    {
      title: 'Pet',
      href: '/zombie-pet',
      icon: IconCookie,
      external: false,
    },
    {
      title: 'Examples',
      href: '/ai-zombie-video-examples',
      icon: IconVideo,
      external: false,
    },
  ];
  links.push({
    title: 'Pricing',
    href: DefaultRoutes.Pricing,
    external: false,
  });

  return links;
}
