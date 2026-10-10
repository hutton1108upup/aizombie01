import { readFileSync } from 'node:fs';
import { loadEnv } from 'vite';
import { productionConfigErrors } from '../src/aizombie/readiness';

const variables = {
  ...loadEnv('production', process.cwd(), ''),
  ...process.env,
};
const errors = productionConfigErrors({
  baseUrl: variables.VITE_BASE_URL,
  secret: variables.BETTER_AUTH_SECRET,
  googleEnabled: variables.VITE_GOOGLE_LOGIN_ENABLED === 'true',
  googleId: variables.GOOGLE_CLIENT_ID,
  googleSecret: variables.GOOGLE_CLIENT_SECRET,
});
const config = readFileSync('wrangler.jsonc', 'utf8');
if (
  /mkfast-template|demo\.tanstarter\.dev|00000000-0000-0000-0000-000000000000|00000000000000000000000000000000/.test(
    config
  )
) {
  errors.push(
    'Replace the local-only Cloudflare bindings with verified project resources.'
  );
}
if (!variables.VITE_MAIL_FROM || !variables.VITE_SUPPORT_EMAIL) {
  errors.push('Configure verified sender and support addresses.');
}
// Deliberate release stop: a flag or credentials alone cannot turn a stub into
// a paid service. Remove only after the full provider/commerce journey passes.
errors.push(
  'Video provider, durable queue, private uploads and credit-pack webhooks are not connected or verified.'
);
for (const error of errors) console.error(`BLOCKED: ${error}`);
console.error('Launch is blocked. No remote changes were made.');
process.exitCode = 1;
