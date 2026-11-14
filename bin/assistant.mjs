#!/usr/bin/env node
/**
 * dsh-assistant CLI — setup, start, doctor.
 *
 * Deliberately small: the product is a DSH profile composed from plugins, not a
 * framework. Add capability as a plugin, not as another command.
 */

import { setup } from '../lib/setup.mjs';
import { doctor } from '../lib/doctor.mjs';
import { start } from '../lib/start.mjs';
import { DEFAULTS, expandHome } from '../lib/paths.mjs';

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
    if (arg === '--home') opts.home = argv[++i];
    else if (arg === '--name') opts.name = argv[++i];
    else if (arg === '--port') opts.port = Number(argv[++i]);
    else if (arg === '--no-browser') opts.browser = false;
    else if (arg === '--require-port-free') opts.requirePortFree = true;
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else throw new Error(`unknown option: ${arg}`);
  }
  opts.home = expandHome(opts.home);
  return opts;
}

const usage = `dsh-assistant — a assistant on DeepSeek Harness

  setup    create the profile, install the plugins, write the privacy patch
  start    run the host (default http://127.0.0.1:${DEFAULTS.port})
  doctor   check the install without changing anything

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
  else throw new Error(`unknown command: ${command}\n\n${usage}`);
} catch (error) {
  console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
