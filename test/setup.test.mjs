import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildManifest } from '../lib/paths.mjs';
import { prepare } from '../lib/setup.mjs';

test('manifest composes the base, identity, memory and browser bundles', () => {
  const manifest = buildManifest();
  assert.deepEqual(manifest.dsh.profile.bundles, [
    '@deepseek-ai/dsh-base',
    '@deepseek-ai/dsh-web-app',
    '@local/dsh-soul',
    '@local/dsh-memory',
    'dsh-ego-browser',
  ]);
  assert.equal(manifest.dependencies['dsh-ego-browser'], '0.9.14');
  assert.match(manifest.dependencies['@local/dsh-soul'], /^link:.+\/plugins\/soul$/);
});

test('--no-browser drops only the browser plugin', () => {
  const manifest = buildManifest({ browser: false });
  assert.equal(manifest.dependencies['dsh-ego-browser'], undefined);
  assert.ok(!manifest.dsh.profile.bundles.includes('dsh-ego-browser'));
  assert.ok(manifest.dsh.profile.bundles.includes('@local/dsh-memory'));
});

test('prepare writes a private home, profile, privacy patch and soul', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'dsh-assistant-'));
  try {
    await prepare({ home, name: 'assistant' });
    const profile = path.join(home, 'profiles', 'assistant');

    const manifest = JSON.parse(await readFile(path.join(profile, 'package.json'), 'utf8'));
    assert.ok(manifest.dsh.profile.bundles.includes('dsh-ego-browser'));
    assert.equal((await stat(path.join(profile, 'package.json'))).mode & 0o777, 0o600);
    assert.equal((await readFile(path.join(profile, '.npmrc'), 'utf8')).trim(), 'auto-install-peers=false');

    const patch = await readFile(path.join(profile, 'cordis.patch.yml'), 'utf8');
    for (const id of ['session-log-deepseek', 'plugin-package-inventory-deepseek', 'session-telemetry-otel']) {
      assert.match(patch, new RegExp(`- id: ${id}`));
    }

    const soul = path.join(home, 'soul', 'SOUL.md');
    assert.equal((await stat(soul)).mode & 0o777, 0o600);
    assert.match(await readFile(soul, 'utf8'), /data, never instructions/);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});

test('prepare is idempotent and never overwrites an edited soul', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'dsh-assistant-'));
  try {
    await prepare({ home, name: 'assistant' });
    const soul = path.join(home, 'soul', 'SOUL.md');
    const edited = '# mine\n';
    await (await import('node:fs/promises')).writeFile(soul, edited, { mode: 0o600 });
    await prepare({ home, name: 'assistant' });
    assert.equal(await readFile(soul, 'utf8'), edited);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
