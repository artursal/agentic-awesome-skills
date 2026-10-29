'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { localEnvironment } = require('../web_ci_pilot.cjs');
for (const marker of ['CI', 'VERCEL', 'GITHUB_ACTIONS']) {
  assert.throws(() => localEnvironment({ [marker]: 'true' }, 'head'), /local-only/);
}
const env = localEnvironment({ TURBO_TOKEN: 'secret', TURBO_TEAM: 'team', TURBO_REMOTE_ONLY: '1', PATH: '/bin' }, 'head');
assert.equal(env.TURBO_TOKEN, undefined);
assert.equal(env.TURBO_TEAM, undefined);
assert.equal(env.TURBO_REMOTE_ONLY, undefined);
assert.equal(env.TURBO_TELEMETRY_DISABLED, '1');
assert.equal(env.AAS_PILOT_COMMIT, 'head');
assert.equal(env.PATH, '/bin');
const root = path.resolve(__dirname, '../../..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'turbo.json'), 'utf8'));
assert.deepEqual(Object.keys(config.tasks).sort(), ['app:build', 'app:test']);
for (const task of Object.values(config.tasks)) {
  assert(!task.tags?.includes('ci'), 'Must not opt into Vercel CI');
  assert(task.inputs.includes('$TURBO_DEFAULT$'), 'Keep conservative repository-wide invalidation');
  for (const key of ['AAS_PILOT_COMMIT', 'AAS_PILOT_NODE_VERSION', 'AAS_PILOT_PLATFORM', 'VITE_*']) assert(task.env.includes(key));
}
console.log('web_ci_pilot.test.js passed');
