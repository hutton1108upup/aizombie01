import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

// No shell interpolation: works with Windows paths and uses local D1 only.
const production = process.argv.includes('--production');
const port = process.env.PORT ?? (production ? '3020' : '3000');
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const variables = {
  ...process.env,
  E2E_PERSIST_PATH: './.wrangler/e2e-state',
  VITE_BASE_URL: baseUrl,
  VITE_PAYMENT_PROVIDER: '',
  BETTER_AUTH_SECRET: 'e2e-better-auth-secret-32-characters',
};
function run(file: string, args: string[]) {
  const child = spawnSync(process.execPath, [resolve(file), ...args], {
    env: variables,
    stdio: 'inherit',
  });
  if (child.error) throw child.error;
  if (child.status !== 0) process.exit(child.status ?? 1);
}
run('node_modules/tsx/dist/cli.mjs', ['scripts/prepare-e2e-state.ts']);
run('node_modules/wrangler/bin/wrangler.js', [
  'd1',
  'migrations',
  'apply',
  'aizombie-local',
  '--local',
  '--persist-to',
  variables.E2E_PERSIST_PATH,
]);
if (production) run('node_modules/vite/bin/vite.js', ['build']);
const args = production ? ['preview'] : ['dev', '--mode', 'e2e'];
const server = spawn(
  process.execPath,
  [
    resolve('node_modules/vite/bin/vite.js'),
    ...args,
    '--host',
    '127.0.0.1',
    '--port',
    port,
    '--strictPort',
  ],
  { env: variables, stdio: 'inherit' }
);
server.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
server.on('exit', (code) => {
  process.exitCode = code ?? 0;
});
process.on('SIGTERM', () => server.kill());
process.on('SIGINT', () => server.kill());
