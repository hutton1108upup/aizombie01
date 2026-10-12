const PUBLIC_PATHS = new Set([
  '/',
  '/pricing',
  '/ai-zombie-trend',
  '/ai-zombie-video-examples',
  '/zombie-love-story',
  '/zombie-pet',
  '/privacy',
  '/terms',
  '/cookie',
]);

/** Only public pages on the verified production domain enter analytics. */
export function analyticsPageUrl(value: string): string | null {
  const url = new URL(value);
  if (url.origin !== 'https://aizombietrend.video') return null;
  const path = url.pathname.replace(/^\/zh(?=\/|$)/, '') || '/';
  if (!PUBLIC_PATHS.has(path)) return null;
  return `${url.origin}${url.pathname}`;
}

export function analyticsReferrer(value: string): string {
  if (!value) return '';
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.origin : '';
  } catch {
    return '';
  }
}
