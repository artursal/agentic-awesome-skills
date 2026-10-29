#!/usr/bin/env node
'use strict';

// Optional local experiment. Required CI never calls this entry point.
const { spawnSync, execFileSync } = require('node:child_process');
const path = require('node:path');

function localEnvironment(source, identity) {
  if (source.CI || source.VERCEL || source.GITHUB_ACTIONS) {
    throw new Error('The web CI pilot is local-only; cloud execution is disabled.');
  }
  const env = { ...source };
  for (const key of Object.keys(env)) {
    if (key.startsWith('TURBO_')) delete env[key];
  }
  return { ...env, TURBO_TELEMETRY_DISABLED: '1',
    AAS_PILOT_NODE_VERSION: process.version,
    AAS_PILOT_PLATFORM: `${process.platform}-${process.arch}`,
    AAS_PILOT_COMMIT: identity };
}

function main(args = process.argv.slice(2)) {
  if (args.some(arg => !['--dry-run', '--force'].includes(arg))) {
    throw new Error('Supported options: --dry-run, --force. Remote cache is disabled.');
  }
  const root = path.resolve(__dirname, '../..');
  const identity = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const env = localEnvironment(process.env, identity);
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const turbo = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'turbo.cmd' : 'turbo');
  function run(command, argv) {
    const started = performance.now();
    const result = spawnSync(command, argv, { cwd: root, env, stdio: 'inherit' });
    console.log(`[web-ci-pilot] ${argv.join(' ')}: ${((performance.now() - started) / 1000).toFixed(2)}s`);
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
  }
  // Always recreate ignored public assets before consulting the local cache.
  // This intentionally uses the pinned distribution catalog already in this tree.
  if (!args.includes('--dry-run')) run(npm, ['run', 'app:setup']);
  run(turbo, ['run', 'app:test', 'app:build', '--cache=local:rw', '--env-mode=strict',
    '--summarize', ...args.map(arg => arg === '--dry-run' ? '--dry=json' : arg)]);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { localEnvironment };
