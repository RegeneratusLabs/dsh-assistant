#!/usr/bin/env node
/**
 * dsh-assistant CLI — setup, start, doctor, sync-skills.
 *
 * Deliberately small: the product is a DSH profile composed from plugins, not a
 * framework. Add capability as a plugin, not as another command.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { setup } from '../lib/setup.mjs';
import { doctor } from '../lib/doctor.mjs';
import { start } from '../lib/start.mjs';
import { DEFAULTS, expandHome, repoRoot } from '../lib/paths.mjs';

/**
 * Copy the authored tree into the packs' vendored assets.
 *
 * The tree under `skills/` is the source of truth; a pack serves only the files
 * it carries, so the copy must be byte-identical and a folder deleted from the
 * tree must not linger in a pack. A cluster without a pack fails loudly: a
 * silent copy would write a directory nothing loads.
 */
function syncSkills() {
  const tree = path.join(repoRoot, 'skills');
  const clusters = existsSync(tree)
    ? readdirSync(tree, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => entry.name)
        .sort()
    : [];
  let copied = 0;
  let pruned = 0;
  for (const cluster of clusters) {
    const pack = path.join(repoRoot, 'plugins', `skill-pack-${cluster}`);
    if (!existsSync(path.join(pack, 'package.json'))) throw new Error(`skills/${cluster}/ has no plugins/skill-pack-${cluster} to ship it`);
    const assets = path.join(pack, 'assets', 'skills');
    const names = readdirSync(path.join(tree, cluster), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => entry.name)
      .sort();
    mkdirSync(assets, { recursive: true });
    for (const name of names) {
      const target = path.join(assets, name);
      rmSync(target, { recursive: true, force: true });
      cpSync(path.join(tree, cluster, name), target, { recursive: true });
      copied += 1;
    }
    for (const stale of readdirSync(assets)) {
      if (names.includes(stale)) continue;
      rmSync(path.join(assets, stale), { recursive: true, force: true });
      pruned += 1;
    }
  }
  const skills = `${copied} skill${copied === 1 ? '' : 's'}`;
  const stale = pruned === 0 ? '' : `; pruned ${pruned} stale ${pruned === 1 ? 'copy' : 'copies'}`;
  console.log(`vendored ${skills} from ${clusters.length} cluster${clusters.length === 1 ? '' : 's'}${stale}`);
}

function parse(argv) {
  const opts = {
    home: process.env.DSH_ASSISTANT_HOME ?? DEFAULTS.home,
    name: DEFAULTS.name,
    port: DEFAULTS.port,
    browser: true,
    requirePortFree: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) throw new Error(`option ${arg} needs a value`);
      i += 1;
      return next;
    };
    if (arg === '--home') opts.home = value();
    else if (arg === '--name') opts.name = value();
    else if (arg === '--port') {
      const raw = value();
      if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 65535) throw new Error(`option --port needs a number 1-65535, got "${raw}"`);
      opts.port = Number(raw);
    } else if (arg === '--no-browser') opts.browser = false;
    else if (arg === '--require-port-free') opts.requirePortFree = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else throw new Error(`unknown option: ${arg}`);
  }
  opts.home = expandHome(opts.home);
  return opts;
}

const usage = `dsh-assistant — an assistant on DeepSeek Harness

  setup        create the profile, install the plugins, write the privacy patch
  start        run the host (default http://127.0.0.1:${DEFAULTS.port})
  doctor       check the install without changing anything
  sync-skills  copy skills/<cluster>/<name>/ into the skill packs' vendored assets

Options:
  --home <dir>     data home (default ~/.dsh-assistant)
  --name <name>    profile name (default assistant)
  --port <port>    host port (default ${DEFAULTS.port})
  --no-browser     skip the Chrome browser plugin
  --require-port-free  make doctor fail when the port is already in use
`;

try {
  const [command, ...rest] = process.argv.slice(2);
  const opts = parse(rest);
  if (!command || command === 'help' || opts.help) {
    process.stdout.write(usage);
    process.exit(0);
  }
  if (command === 'setup') await setup(opts);
  else if (command === 'start') start(opts);
  else if (command === 'doctor') process.exit(await doctor(opts));
  else if (command === 'sync-skills') syncSkills();
  else throw new Error(`unknown command: ${command}\n\n${usage}`);
} catch (error) {
  console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
