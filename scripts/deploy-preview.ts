import './check-preview';
import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const pointer = JSON.parse(
  readFileSync('outputs/latest-preview-build.json', 'utf8')
) as { config: string };
const root = realpathSync('outputs/preview-builds');
const config = realpathSync(pointer.config);
if (!config.startsWith(`${root}${sep}`)) {
  throw new Error(
    'Preview artifact must be inside the isolated build directory.'
  );
}
const expected = JSON.parse(readFileSync('wrangler.preview.jsonc', 'utf8'));
const artifact = JSON.parse(readFileSync(config, 'utf8'));
if (
  artifact.account_id !== expected.account_id ||
  artifact.name !== expected.name
) {
  throw new Error(
    'Preview artifact does not match the confirmed deployment target.'
  );
}
const deployment = spawnSync(
  process.execPath,
  [
    resolve('node_modules/wrangler/bin/wrangler.js'),
    'deploy',
    '--config',
    config,
  ],
  { stdio: 'inherit' }
);
if (deployment.error) throw deployment.error;
process.exitCode = deployment.status ?? 1;
