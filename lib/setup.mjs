/**
 * `setup`: create a throwaway-free DSH home and profile, link the bundled
 * plugins, install the pinned browser plugin, and write the privacy patch.
 *
 * No host service, no root, no systemd. The host is started by `start`.
 */

import { existsSync } from 'node:fs';
import { chmod, copyFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { buildManifest, profileDir, repoRoot } from './paths.mjs';

const TELEMETRY_PATCH = path.join(repoRoot, 'config', 'telemetry-off.patch.yml');

/** Write the profile files and return what was created. Idempotent. */
export async function prepare({ home, name, browser = true }) {
  const dir = profileDir(home, name);
  for (const target of [home, path.join(home, 'soul'), path.join(home, 'memory'), path.join(home, 'profiles'), dir]) {
    await mkdir(target, { recursive: true, mode: 0o700 });
  }

  const manifest = buildManifest({ browser });
  await writeFile(path.join(dir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  // Peer packages come from the DSH installation. Installing them here would add
  // a second harness copy to the profile and break module identity.
  await writeFile(path.join(dir, '.npmrc'), 'auto-install-peers=false\n', { mode: 0o600 });

  // The profile patch is owned by setup, so the privacy default cannot be lost
  // because the user already had a home-level patch. The home layer still wins
  // if someone deliberately overrides it there.
  await copyFile(TELEMETRY_PATCH, path.join(dir, 'cordis.patch.yml'));

  const soul = path.join(home, 'soul', 'SOUL.md');
  if (!existsSync(soul)) {
    await copyFile(path.join(repoRoot, 'config', 'SOUL.md'), soul);
    await chmod(soul, 0o600);
  }

  return { dir, manifest, soul };
}

/** Install the profile's dependencies with pnpm (DSH's own package manager). */
function install(dir) {
  try {
    execFileSync('pnpm', ['--version'], { stdio: 'ignore' });
  } catch {
    throw new Error('pnpm is required but was not found on PATH (npm i -g pnpm, or install DSH first)');
  }
  execFileSync('pnpm', ['install', '--reporter=append-only'], { cwd: dir, stdio: 'inherit' });
}

export async function setup(opts) {
  const { dir } = await prepare(opts);
  console.log(`profile: ${dir}`);
  console.log('installing plugins…');
  install(dir);
  console.log(`
Next:
  npm start
  open the printed URL, then Settings → Models, and add a model key.
  Run "npm run doctor" at any time to check the install.`);
}
