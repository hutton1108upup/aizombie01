import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync('wrangler.preview.jsonc', 'utf8')) as {
  account_id?: string;
  name?: string;
  routes?: Array<{ pattern: string; custom_domain?: boolean }>;
};
if (!config.account_id || !/^[a-f0-9]{32}$/.test(config.account_id)) {
  throw new Error(
    'Confirm the target Cloudflare account and pin account_id before preview deployment.'
  );
}
if (
  config.name !== 'aizombie01' ||
  !config.routes?.some(
    (route) => route.pattern === 'aizombietrend.video' && route.custom_domain
  )
) {
  throw new Error(
    'Preview deployment must target aizombie01 and aizombietrend.video.'
  );
}
console.log('Preview target is pinned. Paid release remains blocked.');
