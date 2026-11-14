import test from 'node:test';
import assert from 'node:assert/strict';
import { bundleDrift, portCheck } from '../lib/doctor.mjs';
import { buildManifest } from '../lib/paths.mjs';

test('a busy port is a warning, not a failure, because the host is usually running', () => {
  const busy = portCheck(false, false);
  assert.equal(busy.ok, false);
  assert.equal(busy.level, 'warn');
  assert.match(busy.detail, /probably running/);

  const required = portCheck(false, true);
  assert.equal(required.level, 'fail');

  const free = portCheck(true, true);
  assert.equal(free.ok, true);
  assert.equal(free.level, 'ok');
});

test('bundle drift names installed bundles the manifest does not build', () => {
  const manifest = buildManifest();
  manifest.dsh.profile.bundles.push('answer-me-with-html', 'huashu-design');
  assert.deepEqual(bundleDrift(manifest), ['answer-me-with-html', 'huashu-design']);
});

test('bundle drift is empty for a profile setup just produced', () => {
  assert.deepEqual(bundleDrift(buildManifest()), []);
});

test('bundle drift ignores a manifest without a bundle list', () => {
  assert.deepEqual(bundleDrift(null), []);
  assert.deepEqual(bundleDrift({ name: 'x' }), []);
});
