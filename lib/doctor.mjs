/** `doctor`: read-only checks. Never changes the profile or the host. */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { buildManifest, profileDir } from './paths.mjs';

const TELEMETRY_IDS = ['session-log-deepseek', 'plugin-package-inventory-deepseek', 'session-telemetry-otel'];

function portFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '127.0.0.1');
  });
}

/**
 * How to report the port check.
 *
 * The host is normally running when doctor is useful (it is the post-change
 * check), so a busy port is only a warning unless the caller is pre-flighting a
 * start and explicitly requires the port to be free.
 * @param free - whether the port could be bound.
 * @param required - whether the caller requires a free port.
 * @returns result fields for the results table.
 */
export function portCheck(free, required = false) {
  if (free) return { ok: true, level: 'ok', detail: '' };
  if (required) return { ok: false, level: 'fail', detail: 'another process is listening — stop it before starting' };
  return { ok: false, level: 'warn', detail: 'the host is probably running; pass --require-port-free to require it free' };
}

/**
 * Bundles installed in the profile that this repository no longer builds.
 *
 * Drift is not an error: it is how a profile picks up a plugin from the Plugins
 * page. It is a warning because `npm run setup` no longer reproduces the live
 * profile, which is worth knowing before trusting it as the source of truth.
 * @param manifest - the parsed profile manifest.
 * @returns installed bundle names absent from the manifest this repo builds.
 */
export function bundleDrift(manifest) {
  const installed = manifest?.dsh?.profile?.bundles;
  if (!Array.isArray(installed)) return [];
  const browser = Boolean(manifest?.dependencies?.['dsh-ego-browser']);
  const expected = new Set(buildManifest({ browser }).dsh.profile.bundles);
  return installed.filter((bundle) => !expected.has(bundle));
}

function dshVersion() {
  try {
    return execFileSync(process.env.DSH_BIN || 'dsh', ['--version'], { encoding: 'utf8', timeout: 15000 }).trim();
  } catch {
    return null;
  }
}

export async function doctor({ home, name, port, requirePortFree = false }) {
  const dir = profileDir(home, name);
  const results = [];
  const add = (ok, label, detail = '', level = 'fail') => results.push({ ok, label, detail, level: ok ? 'ok' : level });

  const [major, minor] = process.versions.node.split('.').map(Number);
  add(major > 24 || (major === 24 && minor >= 9), 'Node >= 24.9', process.versions.node);

  const version = dshVersion();
  add(version !== null, 'dsh on PATH', version ?? 'not found — install @deepseek-ai/dsh');

  let manifest = null;
  try {
    manifest = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'));
    add(true, 'profile manifest', dir);
  } catch {
    add(false, 'profile manifest', `${path.join(dir, 'package.json')} — run "npm run setup"`);
  }

  const soul = path.join(home, 'soul', 'SOUL.md');
  const soulOk = existsSync(soul);
  add(soulOk, 'soul file', soul);
  if (soulOk) add((statSync(soul).mode & 0o777) === 0o600, 'soul permissions 0600', (statSync(soul).mode & 0o777).toString(8));

  const dependencies = manifest?.dependencies ?? {};
  for (const dependency of Object.keys(dependencies)) {
    const present = existsSync(path.join(dir, 'node_modules', dependency, 'package.json'));
    add(present, `plugin ${dependency}`, present ? '' : 'missing — run "npm run setup"');
  }

  const drift = bundleDrift(manifest);
  if (drift.length > 0) {
    add(false, 'bundle drift', `${drift.join(', ')} — installed but not built by "npm run setup"`, 'warn');
  }

  const patch = path.join(dir, 'cordis.patch.yml');
  const patchText = existsSync(patch) ? readFileSync(patch, 'utf8') : '';
  for (const id of TELEMETRY_IDS) {
    add(patchText.includes(`- id: ${id}`), `telemetry off: ${id}`, existsSync(patch) ? '' : 'patch missing');
  }

  add(existsSync(path.join(home, 'memory')), 'memory directory', path.join(home, 'memory'));
  const portResult = portCheck(await portFree(port), requirePortFree);
  add(portResult.ok, `port ${port}`, portResult.detail, portResult.level);

  const credentials = existsSync(path.join(home, '.credentials.yaml'));
  add(credentials, 'model credentials', credentials ? '' : 'none yet — add a key in Settings → Models', 'warn');

  let failed = 0;
  let warned = 0;
  for (const result of results) {
    if (!result.ok && result.level === 'fail') failed += 1;
    if (!result.ok && result.level === 'warn') warned += 1;
    const prefix = result.level === 'ok' ? 'ok  ' : result.level === 'warn' ? 'WARN' : 'FAIL';
    console.log(`${prefix}  ${result.label}${result.detail ? ` — ${result.detail}` : ''}`);
  }
  console.log(failed === 0 ? `\ndoctor: PASS${warned ? ` (${warned} warning)` : ''}` : `\ndoctor: ${failed} problem(s)`);
  return failed === 0 ? 0 : 1;
}
