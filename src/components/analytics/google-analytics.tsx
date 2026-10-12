import { useEffect } from 'react';
import { useRouterState } from '@tanstack/react-router';
import { ClientScript } from '@/components/shared/client-script';
import { clientEnv } from '@/env/client';
import { analyticsPageUrl, analyticsReferrer } from '@/lib/site-analytics';

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
  aizombieGaId?: string;
};

export function GoogleAnalytics() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const id = clientEnv.VITE_GOOGLE_ANALYTICS_ID;
  const validId = Boolean(id && /^G-[A-Z0-9]+$/.test(id));
  useEffect(() => {
    if (!import.meta.env.PROD || !validId) return;
    const pageUrl = analyticsPageUrl(
      new URL(pathname, window.location.origin).href
    );
    if (!pageUrl) return;
    const target = window as AnalyticsWindow;
    target.dataLayer ??= [];
    target.gtag ??= (...args: unknown[]) => {
      target.dataLayer?.push(args);
    };
    if (target.aizombieGaId !== id) {
      target.gtag('js', new Date());
      target.gtag('config', id, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: pageUrl,
        page_referrer: analyticsReferrer(document.referrer),
      });
      target.aizombieGaId = id;
    }
    const frame = window.requestAnimationFrame(() => {
      target.gtag?.('event', 'page_view', {
        send_to: id,
        page_location: pageUrl,
        page_title: document.title,
        page_referrer: analyticsReferrer(document.referrer),
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [id, validId, pathname]);

  if (
    !import.meta.env.PROD ||
    !validId ||
    typeof window === 'undefined' ||
    !analyticsPageUrl(window.location.href)
  )
    return null;
  return (
    <ClientScript
      id="google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
      async
    />
  );
}
