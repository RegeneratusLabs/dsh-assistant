import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildManifest } from '../lib/paths.mjs';
import { prepare } from '../lib/setup.mjs';

test('manifest composes base, identity, memory, browser, voice and the plugin index', () => {
  const manifest = buildManifest();
  assert.deepEqual(manifest.dsh.profile.bundles, [
    '@deepseek-ai/dsh-base',
    '@deepseek-ai/dsh-web-app',
    '@local/dsh-soul',
    '@local/dsh-memory',
    '@local/dsh-learn',
    '@local/dsh-browse',
    '@deepseek-ai/dsh-experimental-voice-input-bundle',
    '@deepseek-ai/dsh-experimental-plugin-market-bundle',
  ]);
  assert.match(manifest.dependencies['@local/dsh-browse'], /^link:.+\/plugins\/browse$/);
  assert.match(manifest.dependencies['@local/dsh-soul'], /^link:.+\/plugins\/soul$/);
});

test('voice, the plugin index and auto review are individually optional', () => {
  const lean = buildManifest({ voice: false, market: false });
  assert.ok(!lean.dsh.profile.bundles.some((bundle) => bundle.includes('voice-input')));
  assert.ok(!lean.dsh.profile.bundles.some((bundle) => bundle.includes('plugin-market')));
  assert.ok(!lean.dsh.profile.bundles.includes('@deepseek-ai/dsh-experimental-auto-review'));

  const reviewed = buildManifest({ autoReview: true });
  assert.ok(reviewed.dsh.profile.bundles.includes('@deepseek-ai/dsh-experimental-auto-review'));
});

test('--no-browser drops only the browser plugin', () => {
  const manifest = buildManifest({ browser: false });
  assert.equal(manifest.dependencies['@local/dsh-browse'], undefined);
  assert.ok(!manifest.dsh.profile.bundles.includes('@local/dsh-browse'));
  assert.ok(manifest.dsh.profile.bundles.includes('@local/dsh-memory'));
});

test('prepare writes a private home, profile, privacy patch and soul', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'dsh-assistant-'));
  try {
    await prepare({ home, name: 'assistant' });
    const profile = path.join(home, 'profiles', 'assistant');

    const manifest = JSON.parse(await readFile(path.join(profile, 'package.json'), 'utf8'));
    assert.ok(manifest.dsh.profile.bundles.includes('@local/dsh-browse'));
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

test('prepare preserves bundles and dependencies installed outside setup', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'dsh-assistant-'));
  try {
    await prepare({ home, name: 'assistant' });
    const file = path.join(home, 'profiles', 'assistant', 'package.json');
    const before = JSON.parse(await readFile(file, 'utf8'));
    before.dependencies['answer-me-with-html'] = 'github:owner/repo#abc';
    before.dsh.profile.bundles.push('answer-me-with-html', '@deepseek-ai/dsh-experimental-auto-review');
    await (await import('node:fs/promises')).writeFile(file, `${JSON.stringify(before, null, 2)}\n`);

    await prepare({ home, name: 'assistant' });
    const after = JSON.parse(await readFile(file, 'utf8'));
    assert.equal(after.dependencies['answer-me-with-html'], 'github:owner/repo#abc');
    assert.ok(after.dsh.profile.bundles.includes('answer-me-with-html'));
    assert.ok(after.dsh.profile.bundles.includes('@deepseek-ai/dsh-experimental-auto-review'));
    // Manifest-owned entries still win over whatever the profile had.
    assert.match(after.dependencies['@local/dsh-soul'], /^link:.+\/plugins\/soul$/);
    assert.equal(after.dsh.profile.bundles[0], '@deepseek-ai/dsh-base');
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
