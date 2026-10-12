import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import analytics from '../analytics.config.json';

// Each preview build gets an isolated directory; older artifacts stay local.
const output = `outputs/preview-builds/${Date.now()}`;
mkdirSync(output, { recursive: true });

const variables = {
  ...process.env,
  AIZOMBIE_BUILD_ROOT: output,
  AIZOMBIE_WRANGLER_CONFIG: 'wrangler.preview.jsonc',
  VITE_BASE_URL: process.env.PREVIEW_BASE_URL ?? 'https://aizombietrend.video',
  VITE_RELEASE_MODE: 'preview',
  VITE_PAYMENT_PROVIDER: '',
  VITE_GOOGLE_LOGIN_ENABLED: 'false',
  VITE_MAIL_FROM: '',
  VITE_SUPPORT_EMAIL: '',
  VITE_GOOGLE_ANALYTICS_ID:
    process.env.VITE_GOOGLE_ANALYTICS_ID ?? analytics.googleMeasurementId,
  VITE_CLARITY_PROJECT_ID:
    process.env.VITE_CLARITY_PROJECT_ID ?? analytics.clarityProjectId,
  VITE_PLAUSIBLE_SCRIPT: '',
  VITE_UMAMI_WEBSITE_ID: '',
  VITE_UMAMI_SCRIPT: '',
  VITE_CRISP_WEBSITE_ID: '',
};
const build = spawnSync(
  process.execPath,
  [resolve('node_modules/vite/bin/vite.js'), 'build'],
  {
    env: variables,
    stdio: 'inherit',
  }
);
if (build.error) throw build.error;
process.exitCode = build.status ?? 1;
if (build.status === 0) {
  const config = `${output}/server/wrangler.json`;
  writeFileSync(
    'outputs/latest-preview-build.json',
    JSON.stringify({ config }, null, 2)
  );
  console.log(`Preview artifact: ${config}`);
}
