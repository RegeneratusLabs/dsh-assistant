/**
 * The shared body of the four pack self-tests.
 *
 * The packs differ only by cluster, so one runner keeps four copies of the same
 * assertions from drifting. Each pack's `selftest.mjs` names its directory and
 * delegates here.
 *
 * What is asserted:
 *  - the manifest is a bundle with a patch and the vendored assets, and it
 *    declares the schema peer (the Host resolution route for a linked plugin);
 *  - `index.js` parses as ESM (the Config schema keeps it out of plain Node, so
 *    the provider logic is exercised through the shared module instead);
 *  - every vendored SKILL.md parses, with a `name` matching its directory and a
 *    description;
 *  - the patch row carries one boolean per vendored skill, all shipped on;
 *  - the vendored copy is byte-identical to `skills/<cluster>/`;
 *  - the provider lists exactly the served skills and loads their bodies, and a
 *    flag turned off removes only that skill.
 *
 * Run: node plugins/skill-pack-<cluster>/selftest.mjs
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import { stubReact } from '../../test/client-harness.mjs';
import {
  BUNDLED_SKILL_RANK,
  createSkillProvider,
  parseFrontmatter,
  servedNames,
  vendoredNames,
} from './provider.mjs';

let failures = 0;

/** The Plugin Manager package that owns the `plugins.row.config` slot. */
const PLUGIN_MANAGER = '@deepseek-ai/dsh-client-ui-plugin-manager';

/** The one browser artifact the four packs share (`exports['./client']`). */
const CLIENT_FILE = fileURLToPath(new URL('./client.mjs', import.meta.url));

/** Evaluated artifact, loaded once per process. */
let kit;

/** Whether the artifact-wide contract checks already ran in this process. */
let contractChecked = false;

/** Assert one condition, recording the outcome. */
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`ok   ${label}`);
    return;
  }
  failures += 1;
  console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
}

/** A pack's vendored skill directory: `assets/skills/`. */
function assetsDir(packDir) {
  return path.join(packDir, 'assets', 'skills');
}

/** Every file below a directory, as relative paths, sorted. */
function filesUnder(directory) {
  const found = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else found.push(path.relative(directory, absolute));
    }
  };
  walk(directory);
  return found.sort();
}

/** Whether two directories hold the same files byte for byte. */
function sameTree(left, right) {
  if (!existsSync(left) || !existsSync(right)) return false;
  const leftFiles = filesUnder(left);
  const rightFiles = filesUnder(right);
  if (leftFiles.length !== rightFiles.length) return false;
  for (const file of leftFiles) {
    if (!rightFiles.includes(file)) return false;
    if (!readFileSync(path.join(left, file)).equals(readFileSync(path.join(right, file)))) return false;
  }
  return true;
}

/**
 * Read the `skills:` map of the pack's patch row with line checks, not a YAML
 * dependency. The shipped row is a fixed shape: `skills:` at one indent, one
 * `name: true|false` per line below it.
 * @param text - cordis.patch.yml.
 * @returns the flags, or null when the row has no `skills:` map.
 */
function patchSkillFlags(text) {
  const lines = text.split(/\r?\n/u);
  const start = lines.findIndex((line) => /^\s+skills:\s*$/u.test(line));
  if (start < 0) return null;
  const indent = /^\s*/u.exec(lines[start])[0].length;
  const flags = {};
  for (const line of lines.slice(start + 1)) {
    const match = /^(\s*)([a-z0-9]+(?:-[a-z0-9]+)*):\s*(true|false)\s*$/u.exec(line);
    if (match === null || match[1].length <= indent) break;
    flags[match[2]] = match[3] === 'true';
  }
  return flags;
}

/** The row id and module name a patch inserts. */
function patchRow(text) {
  const row = /- id:\s*(\S+)\s*\n\s+name:\s*'([^']+)'/u.exec(text);
  return row === null ? null : { id: row[1], name: row[2] };
}

/**
 * Evaluate the shared browser artifact outside a browser.
 *
 * A client bundle is a classic script that registers factories into
 * `window.__ModuleLoader__`; the module table only ever hands a factory
 * `react`. `test/client-harness.mjs` supplies that stub, but its `loadClient`
 * keeps one registration and this file registers one per pack, so the sandbox
 * is built here.
 * @returns `{ entries, logic, react }` for the four registrations.
 */
function clientKit() {
  if (kit !== undefined) return kit;
  const registrations = [];
  const sandbox = {
    window: { __ModuleLoader__: { mode: 'live', load: (registration) => registrations.push(registration) } },
    document: { createElement: () => ({ setAttribute() {}, textContent: '' }), head: { appendChild() {} } },
    console,
  };
  vm.runInContext(readFileSync(CLIENT_FILE, 'utf8'), vm.createContext(sandbox), { filename: CLIENT_FILE });
  const react = stubReact();
  const require = (name) => (name === 'react' ? react : {});
  const entries = registrations.map((registration) => {
    const api = registration.factory(require);
    return { registration, api, logic: api.__logic };
  });
  kit = { entries, logic: entries[0].logic, react };
  return kit;
}

/** Every element in a rendered React element tree, depth first. */
function elements(node, found = []) {
  if (Array.isArray(node)) {
    for (const child of node) elements(child, found);
    return found;
  }
  if (node === null || typeof node !== 'object' || typeof node.type === 'undefined') return found;
  found.push(node);
  elements(node.children, found);
  return found;
}

/**
 * The row page's decisions, asserted without a browser: the config map diff,
 * the revision the write carries, and every way a write can fail.
 * @param logic - the artifact's `__logic`.
 * @param pack - the pack descriptor the form was built for.
 */
async function checkSaveLogic(logic, pack) {
  const flipped = pack.skills[1].name;
  const acceptedFlags = Object.fromEntries(pack.skills.map((skill) => [skill.name, true]));
  const value = { skills: { ...acceptedFlags } };
  const calls = [];
  const form = {
    state: { status: 'ready', writable: true, value, revision: 7 },
    async mutate(ops, revision) {
      calls.push({ ops, revision });
      return true;
    },
  };

  check('client: flagsOf reads only an explicit true', JSON.stringify(logic.flagsOf(form, pack)) === JSON.stringify(acceptedFlags));

  const wanted = { ...acceptedFlags, [flipped]: false };
  const outcome = await logic.saveSkillFlags(form, wanted, pack);
  check('save: an accepted write reports success', outcome.ok === true, JSON.stringify(outcome));
  check(
    'save: the config map diff is exactly the flipped skill',
    JSON.stringify(calls[0]?.ops) === JSON.stringify([{ op: 'set', path: ['skills', flipped], value: false }]),
    JSON.stringify(calls[0]?.ops),
  );
  check('save: the write carries the revision the form read', calls[0]?.revision === 7, String(calls[0]?.revision));

  const unchanged = await logic.saveSkillFlags(form, { ...acceptedFlags }, pack);
  check('save: nothing flipped writes nothing', unchanged.ok === true && unchanged.ops.length === 0 && calls.length === 1, JSON.stringify(unchanged));

  const refusedCallCount = calls.length;
  const refusing = { ...form, async mutate(ops, revision) { calls.push({ ops, revision }); return false; } };
  const refused = await logic.saveSkillFlags(refusing, wanted, pack);
  check(
    'save: a refused write is a failure, not a silent success',
    refused.ok === false && refused.code === 'failed' && refused.ops.length === 1 && calls.length === refusedCallCount + 1,
    JSON.stringify({ ok: refused.ok, code: refused.code, ops: refused.ops?.length }),
  );

  const throwing = { ...form, async mutate() { throw new Error('transport down'); } };
  const rejected = await logic.saveSkillFlags(throwing, wanted, pack);
  check(
    'save: a rejected write surfaces the error',
    rejected.ok === false && rejected.code === 'failed' && rejected.error?.message === 'transport down',
    JSON.stringify({ ok: rejected.ok, code: rejected.code }),
  );

  const readOnlyCalls = calls.length;
  const readOnly = await logic.saveSkillFlags({ ...form, state: { ...form.state, writable: false } }, wanted, pack);
  check(
    'save: a read-only profile refuses before writing',
    readOnly.ok === false && readOnly.code === 'read-only' && calls.length === readOnlyCalls,
    JSON.stringify({ ok: readOnly.ok, code: readOnly.code }),
  );

  const missing = await logic.saveSkillFlags(undefined, wanted, pack);
  check('save: a profile without the form reports no-form', missing.ok === false && missing.code === 'no-form', JSON.stringify(missing));

  // ── the rendered page, as an element tree ─────────────────────────────────
  const t = (key, params) => logic.format(logic.EN[key] ?? key, params);
  const Form = logic.createForm(stubReact(), pack);
  const tree = Form({ view: 'page', form, t });
  const buttons = elements(tree).filter((node) => node.type === 'button');
  const switches = buttons.filter((node) => node.props?.role === 'switch');
  check('form: one switch per vendored skill', switches.length === pack.skills.length, String(switches.length));
  check(
    'form: each switch names its skill and reports the accepted flag',
    switches.every((node, index) => node.props['aria-label'] === `Serve ${pack.skills[index].name}` && node.props['aria-checked'] === true),
  );
  check('form: the root names the pack', tree?.props?.['data-skill-pack'] === pack.id);
  const save = buttons.find((node) => node.props?.className === 'spk-save');
  check('form: a Save action waits for a change', save !== undefined && save.props.disabled === true);
  const summary = Form({ view: 'summary', form, t });
  check(
    'summary: names how many skills are on',
    summary === `${pack.skills.length} of ${pack.skills.length} skills on`,
    String(summary),
  );
}

/**
 * The artifact itself once per process: four registrations and the keyed slot
 * entry each one installs.
 */
async function checkClientContract() {
  const { entries, logic } = clientKit();
  check('client: the shared file registers one entry per pack', entries.length === 4, String(entries.length));
  check(
    'client: the registrations are the four package rows',
    JSON.stringify(entries.map((entry) => entry.registration.id)) === JSON.stringify(logic.PACKS.map((pack) => pack.id)),
    JSON.stringify(entries.map((entry) => entry.registration.id)),
  );
  for (const entry of entries) {
    const pack = entry.logic.pack;
    const registered = [];
    const ctx = {
      effect: (fn) => { fn(); },
      locale: { register: () => () => {} },
      slots: {
        inject: (ownerKey, register) => { check(`client: ${pack.id} injects the Plugin Manager slot`, ownerKey === 'plugins.row.config', ownerKey); register(); },
        register: (options, component) => { registered.push({ options, component }); return () => {}; },
      },
    };
    entry.api.apply(ctx);
    const options = registered[0]?.options;
    check(
      `client: ${pack.id} registers the row key`,
      options?.name === 'plugins.row.config' && options?.key === `${pack.id}#${pack.row}` && options?.locale === logic.nsOf(pack),
      JSON.stringify(options),
    );
    check(`client: ${pack.id} owns its locale namespace`, logic.nsOf(pack) === `skill-pack-${pack.row.replace(/^dsh-skill-pack-/u, '')}` && new Set(logic.PACKS.map((entry) => logic.nsOf(entry))).size === logic.PACKS.length, logic.nsOf(pack));
    check(`client: ${pack.id} registers a component`, typeof registered[0]?.component === 'function');
    check(`client: ${pack.id} waits for the slots and locale services`, JSON.stringify(entry.api.inject) === '["slots","locale"]');
  }
  await checkSaveLogic(logic, logic.PACKS[0]);
}


/**
 * Run one pack's self-test.
 * @param packUrl - `new URL('./', import.meta.url)` from the pack's selftest.
 * @returns the failure count (0 = pass).
 */
export async function runPackSelftest(packUrl) {
  failures = 0;
  const packDir = fileURLToPath(packUrl).replace(/[\\/]+$/u, '');
  const cluster = path.basename(packDir).replace(/^skill-pack-/u, '');
  const expectedName = `@local/dsh-skill-pack-${cluster}`;
  console.log(`\n${expectedName} (skills/${cluster})\n`);

  // ── manifest ───────────────────────────────────────────────────────────────
  const manifest = JSON.parse(readFileSync(path.join(packDir, 'package.json'), 'utf8'));
  check('manifest: package name', manifest.name === expectedName, manifest.name);
  check('manifest: declares a bundle patch', manifest.dsh?.bundle?.patch === './cordis.patch.yml', manifest.dsh?.bundle?.patch);
  check(
    'manifest: ships index, patch and assets',
    ['index.js', 'cordis.patch.yml', 'assets'].every((entry) => manifest.files?.includes(entry)),
    JSON.stringify(manifest.files),
  );
  check(
    'manifest: the schema peer the linked row resolves from the installation',
    typeof manifest.peerDependencies?.['@deepseek-ai/schemastery'] === 'string',
    JSON.stringify(manifest.peerDependencies),
  );

  // ── the wiring file parses; the schema import needs the Harness ────────────
  const syntax = spawnSync(process.execPath, ['--check', path.join(packDir, 'index.js')], { encoding: 'utf8' });
  check('index.js parses as ESM', syntax.status === 0, (syntax.stderr ?? '').trim().split('\n').at(-2) ?? '');

  // ── the row config: one boolean per vendored skill, all shipped on ─────────
  const patchText = readFileSync(path.join(packDir, 'cordis.patch.yml'), 'utf8');
  const row = patchRow(patchText);
  check('patch: inserts this pack by id and module name', row?.id === `dsh-skill-pack-${cluster}` && row?.name === expectedName, JSON.stringify(row));

  const names = await vendoredNames(assetsDir(packDir));
  const flags = patchSkillFlags(patchText);
  check('patch: the row carries a skills map', flags !== null);
  if (names.length === 0) {
    check('vendored assets: no skills yet (run bin/assistant.mjs sync-skills)', flags !== null && Object.keys(flags ?? {}).length === 0);
  } else {
    check(
      'config: one boolean per vendored skill, all on',
      names.every((name) => typeof flags?.[name] === 'boolean') && names.every((name) => flags?.[name] === true),
      JSON.stringify(flags),
    );
    check(
      'config: no flag names a skill that is not vendored',
      Object.keys(flags ?? {}).every((name) => names.includes(name)),
      JSON.stringify(Object.keys(flags ?? {})),
    );
  }

  // ── every vendored skill parses, and matches the tree it came from ─────────
  const described = {};
  for (const name of names) {
    const file = path.join(assetsDir(packDir), name, 'SKILL.md');
    let parsed;
    try {
      parsed = parseFrontmatter(readFileSync(file, 'utf8'));
    } catch (error) {
      check(`vendored ${name}: SKILL.md parses`, false, String(error));
      continue;
    }
    described[name] = parsed.fields.description;
    check(
      `vendored ${name}: frontmatter name matches the directory and the description is present`,
      parsed.fields.name === name && typeof parsed.fields.description === 'string' && parsed.fields.description.length > 0,
      JSON.stringify(parsed.fields.name),
    );
  }
  if (names.length > 0) {
    const treeDir = path.resolve(packDir, '..', '..', 'skills', cluster);
    check('sync: the vendored copy is the tree, byte for byte', sameTree(assetsDir(packDir), treeDir));
  }

  // ── the browser half: this row's Configure page on the Web Plugins page ────
  const clientExport = manifest.exports?.['./client'];
  check('manifest: exports a browser half', clientExport === '../skill-pack-shared/client.mjs', String(clientExport));
  check(
    'manifest: the exported browser half exists',
    typeof clientExport === 'string' && existsSync(path.resolve(packDir, clientExport)),
    String(clientExport),
  );
  const dshClient = manifest.dsh?.client;
  check('manifest: declares a Web browser half', dshClient?.platform === 'web', JSON.stringify(dshClient));
  check('manifest: the browser half loads with the app', dshClient?.immediately === true, JSON.stringify(dshClient));
  check(
    'manifest: the browser half activates after the Plugin Manager package',
    Array.isArray(dshClient?.inject) && dshClient.inject.includes(PLUGIN_MANAGER),
    JSON.stringify(dshClient?.inject),
  );

  const { logic } = clientKit();
  const descriptor = logic.PACKS.find((entry) => entry.id === expectedName);
  check('client: the shared form serves this pack row', descriptor !== undefined && descriptor.row === row?.id, JSON.stringify(descriptor === undefined ? null : { id: descriptor.id, row: descriptor.row }));
  check(
    'client: the form lists exactly the vendored skills',
    JSON.stringify(descriptor?.skills.map((skill) => skill.name)) === JSON.stringify(names),
    JSON.stringify(descriptor?.skills.map((skill) => skill.name)),
  );
  check(
    'client: every form description is the vendored SKILL.md description',
    names.every((name) => descriptor?.skills.find((skill) => skill.name === name)?.description === described[name]),
  );

  // ── the provider serves only true flags, and loads bodies ─────────────────
  check('servedNames: only an explicit true serves a skill', JSON.stringify(servedNames(['a', 'b'], { a: true, b: false })) === '["a"]');
  check('servedNames: a missing flag is off', JSON.stringify(servedNames(['a'], {})) === '[]');
  check('servedNames: an unknown flag invents nothing', JSON.stringify(servedNames(['a'], { ghost: true })) === '[]');

  if (names.length > 0) {
    const live = {};
    for (const name of names) live[name] = true;
    const provider = createSkillProvider({ provider: `test-${cluster}`, assetRoot: assetsDir(packDir), flags: () => live });
    const listed = await provider.list();
    check('provider: lists every skill whose flag is true', JSON.stringify(listed.candidates.map((skill) => skill.name)) === JSON.stringify(names), JSON.stringify(listed.candidates.map((skill) => skill.name)));
    check('provider: discovery completed', listed.complete === true);

    const first = listed.candidates[0];
    const source = parseFrontmatter(readFileSync(path.join(assetsDir(packDir), first.name, 'SKILL.md'), 'utf8'));
    check('provider: candidates carry rank, source, provider and a resource base', first.rank === BUNDLED_SKILL_RANK && first.source === 'bundled' && first.provider === `test-${cluster}` && first.resourceBase?.kind === 'directory', JSON.stringify({ rank: first.rank, source: first.source }));
    check('provider: the candidate description is the frontmatter description', first.description === source.fields.description);
    const loaded = await provider.get(first);
    check('provider: get returns the body', loaded?.content === source.body && loaded.content.length > 0, `${loaded?.content?.length ?? 0} chars`);

    live[first.name] = false;
    const without = await provider.list();
    check(
      'toggle: a false flag removes exactly that skill',
      without.candidates.length === names.length - 1 && !without.candidates.some((skill) => skill.name === first.name),
      JSON.stringify(without.candidates.map((skill) => skill.name)),
    );
    for (const name of names) live[name] = false;
    check('toggle: an all-off row serves nothing', (await provider.list()).candidates.length === 0);
  }

  // ── the artifact itself, asserted once per process ────────────────────────
  if (!contractChecked) {
    contractChecked = true;
    await checkClientContract();
  }

  console.log(failures === 0 ? '\nselftest PASS' : `\nselftest FAIL (${failures})`);
  return failures;
}
