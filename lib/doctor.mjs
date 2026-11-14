/** `doctor`: read-only checks. Never changes the profile or the host. */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { profileDir } from './paths.mjs';

const TELEMETRY_IDS = ['session-log-deepseek', 'plugin-package-inventory-deepseek', 'session-telemetry-otel'];

function portFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '127.0.0.1');
  });
}

function dshVersion() {
  try {
    return execFileSync(process.env.DSH_BIN || 'dsh', ['--version'], { encoding: 'utf8', timeout: 15000 }).trim();
  } catch {
    return null;
  }
}

export async function doctor({ home, name, port }) {
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

  const patch = path.join(dir, 'cordis.patch.yml');
  const patchText = existsSync(patch) ? readFileSync(patch, 'utf8') : '';
  for (const id of TELEMETRY_IDS) {
    add(patchText.includes(`- id: ${id}`), `telemetry off: ${id}`, existsSync(patch) ? '' : 'patch missing');
  }

  add(existsSync(path.join(home, 'memory')), 'memory directory', path.join(home, 'memory'));
  const free = await portFree(port);
  add(free, `port ${port} free`, free ? '' : 'another process is listening');

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
