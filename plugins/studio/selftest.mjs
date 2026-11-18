/**
 * Self-test for @local/dsh-studio — the English-first design skill and its page.
 *
 *   node plugins/studio/selftest.mjs
 *
 * No DSH process, no browser, no network. Checks the wiring a translation can
 * break silently: the bundle patch must find the skill directory and run the
 * package's own row, the skill must keep its English identity, every path
 * SKILL.md promises must exist, and no upstream identifier may survive in the
 * scripts. The Phase 1 page is checked the same way: the works store's
 * validation and modes, the tool's plain-error discipline, the routes the page
 * reads, and the client registrations — loaded through the shared harness, so
 * only the pure parts run.
 */
import assert from 'node:assert/strict';
import fs, { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.join(root, 'skill');
const read = (...parts) => readFileSync(path.join(root, ...parts), 'utf8');
const pass = (message) => process.stdout.write(`PASS ${message}\n`);

/** A throwaway profile home for the Host half; the real one is never touched. */
const home = mkdtempSync(path.join(os.tmpdir(), 'dsh-studio-selftest-'));
process.env.DSH_HOME = home;
process.on('exit', () => rmSync(home, { recursive: true, force: true }));

const cjk = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/;
/** Characters that may legitimately appear in English prose. */
const prose = (text) => text.replace(/[·×→←—–…「」『』【】]/g, '');

const manifest = JSON.parse(read('package.json'));
assert.equal(manifest.name, '@local/dsh-studio');
assert.equal(manifest.dsh?.bundle?.patch, './cordis.patch.yml');
assert.equal(manifest.exports['./package.json'], './package.json');
for (const [name, version] of Object.entries(manifest.dependencies ?? {})) {
  assert.match(version, /^\d+\.\d+\.\d+$/, `${name} must be pinned to an exact version`);
}
pass('manifest: bundle patch, exported package.json, pinned dependencies');

// The patch computes the skill directory from the package location, so a link
// install and a copied install both work; both halves of that expression matter.
const patch = read('cordis.patch.yml');
assert.match(patch, /providerName: studio/);
assert.match(patch, /@local\/dsh-studio\/package\.json/);
assert.match(patch, /'skill'\)/);
assert.match(patch, /@deepseek-ai\/dsh-skill-filesystem/);
pass('patch: filesystem provider rooted at the package skill directory');

const skill = read('skill', 'SKILL.md');
const front = /^---\n([\s\S]*?)\n---\n/.exec(skill);
assert.ok(front, 'SKILL.md must open with YAML frontmatter');
assert.match(front[1], /^name: studio$/m);
assert.match(front[1], /^description: /m);
assert.match(front[1], /version: 0\.1\.0/);
assert.match(front[1], /Regeneratus Labs/);
const description = /^description: (.*)$/m.exec(front[1])[1];
assert.ok(!cjk.test(description), 'the description agents see must be English');
assert.match(description, /prototype/i);
assert.match(description, /deck|slides/i);
assert.match(description, /animation/i);
assert.match(description, /critique/i);
pass('skill frontmatter: name, English description, trigger coverage, provenance');

// Every resource SKILL.md promises must be on disk. Drop prose punctuation and
// placeholders before checking so only real paths are tested.
const promised = new Set();
for (const match of skill.matchAll(/`((?:references|scripts)\/[^`]+?)`/g)) {
  const candidate = match[1].replace(/[.,;:)]+$/, '').trim();
  if (candidate.includes('<') || candidate.includes('*') || candidate.includes('…')) continue;
  promised.add(candidate);
}
assert.ok(promised.size >= 25, `expected the skill to promise its references and scripts, found ${promised.size}`);
for (const relative of promised) {
  assert.ok(existsSync(path.join(skillDir, relative)), `SKILL.md points at missing ${relative}`);
}
pass(`skill references resolve (${promised.size} paths)`);

// The gate file was renamed with the fork; the old Chinese name must not linger
// in instructions or in the scripts that write it.
assert.match(skill, /director-script\.md/);
for (const doc of ['skill/SKILL.md', 'skill/references/modules/motion.md', 'skill/references/ai-video-review.md']) {
  assert.ok(!read(doc).includes('导演稿'), `${doc} still names the old gate file`);
}
pass('gate filenames translated (director-script.md)');

// The state directory and env var were renamed; a leftover upstream name would
// write to the wrong place (and, under workspace permissions, fail).
const scripts = readdirSync(path.join(skillDir, 'scripts'), { recursive: true, encoding: 'utf8' })
  .filter((file) => /\.(py|mjs|js|sh)$/.test(file))
  .map((file) => path.join('skill', 'scripts', file));
for (const file of scripts) {
  const body = read(file);
  assert.ok(!body.includes('HUASHU_DESIGN_HOME'), `${file} still reads HUASHU_DESIGN_HOME`);
  assert.ok(!body.includes('HUASHU_CLOUD_OK'), `${file} still reads HUASHU_CLOUD_OK`);
  if (file.endsWith('html2pptx.js')) continue; // upstream copyright line is licence text
  assert.ok(!body.includes('huashu-design'), `${file} still carries the upstream package name`);
}
pass(`scripts renamed to STUDIO_HOME / ~/.dsh-studio (${scripts.length} files)`);

// Translation completeness: headings must be English everywhere. Quoted CJK
// examples inside bodies are allowed where the subject is Chinese typography,
// the platform's copy rules, or provenance.
const docs = [
  'skill/SKILL.md',
  ...readdirSync(path.join(skillDir, 'references'), { withFileTypes: true })
    .flatMap((entry) => entry.isDirectory()
      ? readdirSync(path.join(skillDir, 'references', entry.name)).map((file) => `skill/references/${entry.name}/${file}`)
      : [`skill/references/${entry.name}`])
    .filter((file) => file.endsWith('.md'))
].map((file) => [file, read(file)]);
assert.ok(docs.length >= 45, `expected the full reference library, found ${docs.length} docs`);
for (const [file, body] of docs) {
  for (const heading of body.matchAll(/^(#{1,6}) (.+)$/gm)) {
    assert.ok(!cjk.test(prose(heading[2])), `${file} has a Chinese heading: ${heading[2]}`);
  }
  assert.ok(body.length > 200, `${file} looks truncated`);
}
pass(`reference library translated (${docs.length} docs, English headings, non-empty)`);

// The style library promises a specimen image per style; a broken path would
// send the agent looking for a screenshot that is not there.
const styles = read('skill', 'references', 'design-styles.md');
const specimens = [...styles.matchAll(/assets\/style-specimens\/[^\s`"')]+/g)]
  .map((match) => match[0])
  .filter((specimen) => !/[<>|]/.test(specimen));
assert.ok(specimens.length >= 40, `expected the specimen library to be referenced, found ${specimens.length}`);
for (const specimen of specimens) {
  assert.ok(existsSync(path.join(skillDir, specimen)), `design-styles.md points at missing ${specimen}`);
}
pass(`style specimens resolve (${specimens.length} paths)`);

/* ── Phase 1: the UI spine ────────────────────────────────────────────────── */
// The page is a host-owned list plus one client registration. What breaks
// silently here is manifest shape, a missing locale key, a tool that throws
// instead of explaining, and a store that forgets its modes.

// The client half must be a browser artifact the module system can compose, and
// the Host row must resolve to this package's own entry.
assert.equal(manifest.exports['.'], './index.js');
assert.equal(manifest.exports['./client'], './client.js');
assert.equal(manifest.dsh?.client?.platform, 'web');
assert.equal(manifest.dsh?.client?.immediately, true);
assert.ok(Array.isArray(manifest.dsh?.client?.inject), 'dsh.client needs an inject list');
assert.ok(
  manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-sidebar') &&
    manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-layout'),
  `the page needs the sidebar and layout rows, not ${manifest.dsh.client.inject.join(', ')}`,
);
assert.deepEqual(
  Object.keys(manifest.dependencies ?? {}).sort(),
  ['pdf-lib', 'playwright', 'pptxgenjs'],
  'the page must not add a runtime dependency',
);
pass('manifest: client export, web client row, no new dependencies');

// Order is the point: the skill row stays first, the package row second.
const rows = [...patch.matchAll(/^\s*- id: ([^\s]+)\s*$/gm)].map((match) => match[1]);
assert.deepEqual(rows, ['dsh-studio-skill', 'studio'], `patch rows are ${rows.join(', ')}`);
assert.match(patch, /name: '@local\/dsh-studio'/);
pass('patch: skill row first, the package row second');

const upstream = ['guizang', '歸藏', 'media-desk', 'woniuniuniu', 'op7418', 'nexu-io', 'opendesign'];
for (const file of ['index.js', 'store.js', 'tools.js', 'client.js']) {
  const body = read(file);
  assert.ok(body.length > 3000, `${file} looks truncated`);
  assert.ok(!cjk.test(body), `${file} must be English only`);
  for (const word of upstream) assert.ok(!body.includes(word), `${file} still carries "${word}"`);
}
pass('host and client files exist, are English, and carry no upstream identifiers');

// The page may not reach into Harness Client internals, write outside its own
// component tree, or bypass the locale service.
const client = read('client.js');
assert.ok(!client.includes('dsh-client-ui-primitives'), 'client.js must not use client UI primitives');
assert.ok(!/require\(\s*['"]@deepseek-ai\//.test(client), 'client.js must not require a DSH client package');
assert.ok(!client.includes('document.body.appendChild'), 'client.js must not append to document.body');
assert.match(client, /ctx\.slots\.inject\('sidebar\.panellist'/);
assert.match(client, /ctx\.slots\.inject\('main'/);
assert.match(client, /ctx\.locale\.register\(NS, \{ en \}\)/);
assert.match(client, /api\/studio/);
pass('client: no primitives, no body writes, panel + page registered through the locale service');

// One palette only: a colour literal may appear as a var() fallback, so a
// renamed token degrades instead of going black, but never as a paint on its
// own. Strip comments and the fallbacks, then no colour literal may remain.
const css = /const CSS = `([\s\S]*?)`;/.exec(client)?.[1] ?? '';
assert.ok(css.length > 1000, 'the stylesheet must be a single block');
assert.ok(!/var\(--dsw-alias-[a-z0-9-]+\)/.test(css), 'every theme token needs a fallback value');
const withoutFallbacks = css.replace(/var\(\s*--dsw-alias-[a-z0-9-]+\s*,\s*(?:rgba?\([^)]*\)|[^()]*)\)/g, 'var(--token)');
const paints = withoutFallbacks.replace(/\/\*[\s\S]*?\*\//g, '');
assert.ok(!/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(paints), 'client.js must not paint with a literal colour outside a var() fallback');
pass('client: theme tokens only, each with a fallback, no second palette');

// Every key the page asks for must exist in the English dictionary, and the
// dictionary file is the one the Plugin Manager reads.
const locale = JSON.parse(read('locale', 'en.json'));
assert.ok(locale.meta?.title && locale.meta?.description, 'locale/en.json needs meta.title and meta.description');
const dictionary = locale.ui ?? {};
const usedKeys = new Set([...client.matchAll(/\bt\('([^']+)'\)/g)].map((match) => match[1]));
assert.ok(usedKeys.size >= 20, `expected a real page, found ${usedKeys.size} locale keys`);
for (const key of usedKeys) {
  assert.ok(Object.prototype.hasOwnProperty.call(dictionary, key), `client.js uses t('${key}') but locale/en.json has no ui.${key}`);
}
pass(`locale: English dictionary covers all ${usedKeys.size} keys used by the page`);

// The store owns everything under $DSH_HOME/studio and nothing else, with the
// profile's private modes.
const indexBody = read('index.js');
const storeBody = read('store.js');
assert.ok(indexBody.includes('$DSH_HOME/studio'), 'index.js must name $DSH_HOME/studio');
assert.match(storeBody, /0o700/, 'the store must create private directories');
assert.match(storeBody, /0o600/, 'the store must write a private library file');
assert.match(indexBody, /connection\.fetch\.register/);
assert.match(indexBody, /\/api\/studio/);
assert.match(indexBody, /ctx\.tools\.register/);
pass('host: $DSH_HOME/studio paths, 0700/0600 guards, one tool and the page routes');

/* ── the works store ─────────────────────────────────────────────────────── */

const { apply, libraryDir } = await import('./index.js');
const { openStore, StudioError } = await import('./store.js');
const { buildTools } = await import('./tools.js');

/** The error a call throws, or null when it does not throw. */
function thrown(fn) {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
}

assert.equal(libraryDir(), path.join(home, 'studio'));

const storeDir = path.join(home, 'workstore');
const store = openStore(storeDir);
const thumbs = path.join(storeDir, 'thumbs');
assert.ok(statSync(storeDir).isDirectory() && statSync(thumbs).isDirectory(), 'openStore creates its directory and thumbs/');
assert.equal(statSync(storeDir).mode & 0o777, 0o700, 'the library directory is private');
assert.equal(statSync(thumbs).mode & 0o777, 0o700, 'the thumbs directory is private');
assert.ok(!existsSync(store.libraryPath), 'opening the store writes no file');

const first = store.addWork({ path: path.join(home, 'decks', 'offsite.html'), title: 'Offsite deck', module: 'Deck' });
assert.equal(first.created, true);
assert.equal(first.work.id, 'WORK-1');
assert.equal(first.work.module, 'deck');
assert.equal(first.work.theme, null);
assert.equal(first.work.thumb, null);
assert.match(first.work.createdAt, /^\d{4}-\d{2}-\d{2}T/);
assert.equal(statSync(store.libraryPath).mode & 0o777, 0o600, 'the library file is private');

const updated = store.addWork({ path: path.join(home, 'decks', 'offsite.html'), title: 'Offsite deck, revised', module: 'deck', theme: 'Editorial' });
assert.equal(updated.created, false, 'the same path updates rather than duplicates');
assert.equal(updated.work.id, first.work.id);
assert.equal(updated.work.createdAt, first.work.createdAt);
assert.equal(updated.work.theme, 'Editorial');

const second = store.addWork({ path: path.join(home, 'pages', 'launch.html'), title: 'Launch page', module: 'web' });
assert.equal(second.work.id, 'WORK-2');
assert.equal(store.listWorks().map((work) => work.id).join(','), 'WORK-2,WORK-1', 'newest work first');
assert.equal(JSON.parse(readFileSync(store.libraryPath, 'utf8')).length, 2);

const unknownField = thrown(() => store.addWork({ path: path.join(home, 'x.html'), title: 'x', module: 'web', extra: 1 }));
assert.ok(unknownField instanceof StudioError && unknownField.code === 'unknown_field', 'an unknown field is a named StudioError');
assert.equal(thrown(() => store.addWork({ path: path.join(home, 'x.html'), title: '  ', module: 'web' }))?.code, 'missing_field');
assert.equal(thrown(() => store.addWork({ path: path.join(home, 'x.html'), title: 'x', module: 'Web 2.0' }))?.code, 'invalid_module');
assert.equal(thrown(() => store.addWork({ path: path.join(home, 'x.html'), title: 'x', module: 'web', theme: 'x'.repeat(200) }))?.code, 'field_too_long');
assert.equal(thrown(() => store.addWork({ path: path.join(home, 'x.html'), title: 'x', module: 'web', id: 'WORK-9' }))?.code, 'unknown_field');

const expanded = store.addWork({ path: '~/notes/deck.html', title: 'Tilde path', module: 'web' });
assert.equal(expanded.work.path, path.join(os.homedir(), 'notes', 'deck.html'), '~/ expands at registration');
const relative = store.addWork({ path: 'relative/thing.html', title: 'Relative path', module: 'web' });
assert.equal(relative.work.path, path.join(process.cwd(), 'relative', 'thing.html'), 'a relative path resolves once, against the working directory');
assert.equal(store.removeWork(expanded.work.id).id, expanded.work.id);
assert.equal(thrown(() => store.removeWork('WORK-404'))?.code, 'not_found');
assert.equal(thrown(() => store.removeWork(''))?.code, 'missing_id');
assert.equal(store.listWorks().length, 3, 'the removals left the rest of the library alone');

// A file that cannot be read is reported by position and never overwritten.
const brokenDir = path.join(home, 'broken');
const broken = openStore(brokenDir);
writeFileSync(broken.libraryPath, '{not json', { mode: 0o600 });
assert.equal(thrown(() => broken.listWorks())?.code, 'store_corrupt');
writeFileSync(broken.libraryPath, JSON.stringify([{ id: 'WORK-1', title: 'x', path: '/x', module: 'web', theme: null, createdAt: new Date().toISOString(), thumb: null, extra: true }]));
assert.equal(thrown(() => broken.listWorks())?.code, 'unknown_field');
writeFileSync(broken.libraryPath, JSON.stringify([{ id: 'WORK-1', title: 'x', path: '/x', module: 'web', theme: null, createdAt: new Date().toISOString(), thumb: '../escape.png' }]));
assert.equal(thrown(() => broken.listWorks())?.code, 'invalid_thumb');
assert.equal(thrown(() => broken.addWork({ path: '/y', title: 'y', module: 'web' }))?.code, 'invalid_thumb', 'a write refuses a library it cannot read');

// A write that fails mid-way must not leave its temp file behind for the next
// run to trip on. The failure is simulated because a real full disk is not
// available here; the cleanup path is what is under test.
const writeFileSyncOriginal = fs.writeFileSync;
fs.writeFileSync = (target, ...rest) => {
  writeFileSyncOriginal(target, 'partial', { mode: 0o600 });
  throw new Error('simulated full disk');
};
const failedWrite = thrown(() => store.addWork({ path: path.join(home, 'decks', 'another.html'), title: 'Another deck', module: 'deck' }));
fs.writeFileSync = writeFileSyncOriginal;
assert.ok(failedWrite instanceof Error, 'a failed write surfaces the error');
assert.ok(!readdirSync(storeDir).some((name) => name.endsWith('.tmp')), 'a failed write cleans up its temp file');
pass('store: ids, one-work-per-path, validation, modes, corrupt-file refusal, write cleanup');

/* ── the tool ────────────────────────────────────────────────────────────── */

const [tool] = buildTools({ store });
assert.equal(tool.name, 'studio_library');
const addMessage = await tool.execute({ action: 'add', path: path.join(home, 'motion', 'loop.mp4'), title: 'Loop', module: 'Motion' });
assert.match(addMessage.message, /^Registered WORK-\d+: Loop \[motion\] — /);
const again = await tool.execute({ action: 'add', path: path.join(home, 'motion', 'loop.mp4'), title: 'Loop, second pass', module: 'motion' });
assert.match(again.message, /^Updated WORK-\d+: Loop, second pass/);
const refused = await tool.execute({ action: 'add', path: path.join(home, 'motion', 'loop.mp4'), title: 'Loop', module: 'motion', id: 'WORK-99' });
assert.match(refused.message, /^Not saved: a work has no field "id"/);
const listed = await tool.execute({ action: 'list' });
assert.match(listed.message, /^Works \(\d+\)\nWORK-\d+ {2}/);
const unknownAction = await tool.execute({ action: 'wobble' });
assert.match(unknownAction.message, /^Not saved: "wobble" is not add, list or remove\.$/);
const removedByTool = await tool.execute({ action: 'remove', id: JSON.parse(readFileSync(store.libraryPath, 'utf8')).at(-1).id });
assert.match(removedByTool.message, /^Removed WORK-\d+: /);
pass('tool: add/update/list/remove answer in plain sentences, refusals included');

/* ── the routes the page reads ───────────────────────────────────────────── */

const routes = [];
const registered = [];
const disposers = [];
const ctx = {
  tools: { register: (definition) => registered.push(definition) },
  connection: { fetch: { register: async (route) => { routes.push(route); return async () => {}; } } },
  effect: (fn) => { disposers.push(fn()); },
};
await apply(ctx, {});
assert.deepEqual(routes.map((route) => route.path).sort(), ['/api/studio', '/api/studio/thumb']);
assert.deepEqual(registered.map((definition) => definition.name), ['studio_library']);

const listRoute = routes.find((route) => route.path === '/api/studio');
const empty = await (await listRoute.fetch({ url: '/api/studio', signal: undefined })).json();
assert.equal(empty.ok, true);
assert.deepEqual(empty.works, [], 'a fresh profile has no works');

const homeTool = registered[0];
await homeTool.execute({ action: 'add', path: path.join(home, 'pages', 'landing.html'), title: 'Landing', module: 'web' });
const payload = await (await listRoute.fetch({ url: '/api/studio', signal: undefined })).json();
assert.equal(payload.works.length, 1);
assert.equal(payload.works[0].title, 'Landing');

const thumbsDir = path.join(home, 'studio', 'thumbs');
mkdirSync(thumbsDir, { recursive: true, mode: 0o700 });
writeFileSync(path.join(thumbsDir, 'cover.png'), Buffer.from('89504e470d0a1a0a', 'hex'), { mode: 0o600 });
const thumbRoute = routes.find((route) => route.path === '/api/studio/thumb');
const thumb = await thumbRoute.fetch({ url: '/api/studio/thumb?name=cover.png', signal: undefined });
assert.equal(thumb.status, 200);
assert.equal(thumb.headers.get('content-type'), 'image/png');
assert.equal((await thumb.arrayBuffer()).byteLength, 8);
const traversal = await thumbRoute.fetch({ url: '/api/studio/thumb?name=../library.json', signal: undefined });
assert.equal(traversal.status, 404, 'a path is not a thumbnail name');
const markup = await thumbRoute.fetch({ url: '/api/studio/thumb?name=cover.svg', signal: undefined });
assert.equal(markup.status, 404, 'only raster thumbnails are served');
const outside = path.join(home, 'outside.png');
writeFileSync(outside, Buffer.from('89504e470d0a1a0a', 'hex'), { mode: 0o600 });
try {
  symlinkSync(outside, path.join(thumbsDir, 'linked.png'));
  const linked = await thumbRoute.fetch({ url: '/api/studio/thumb?name=linked.png', signal: undefined });
  assert.equal(linked.status, 404, 'a symlink in thumbs/ is not a thumbnail');
} catch (error) {
  // Windows without developer mode cannot create a symlink; the check is
  // meaningless there, but any other failure is real.
  if (!['EPERM', 'EACCES', 'ENOSYS'].includes(error?.code)) throw error;
}

// A file where the home directory belongs: openStore cannot create the library,
// and apply must log and leave the plugin unregistered instead of throwing.
const blockedHome = path.join(home, 'blocked-home');
writeFileSync(blockedHome, 'x');
process.env.DSH_HOME = blockedHome;
const refusedApply = await apply(
  { tools: { register: () => {} }, connection: { fetch: { register: async () => { throw new Error('must not register'); } } }, effect: () => {} },
  {},
);
process.env.DSH_HOME = home;
assert.equal(refusedApply, undefined, 'apply resolves quietly when the store cannot be opened');
pass('routes: library list, thumbnail bytes, traversal and symlinks refused, apply degrades quietly');

for (const dispose of disposers) if (typeof dispose === 'function') dispose();

/* ── the browser half ────────────────────────────────────────────────────── */

const { loadClient } = await import('../../test/client-harness.mjs');
const { api: clientApi, registration } = loadClient(fileURLToPath(new URL('./client.js', import.meta.url)));
const L = clientApi.__logic;
assert.equal(registration.id, '@local/dsh-studio');
assert.equal(L.recentWorks([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }]).length, 4);
assert.equal(L.recentWorks(null).length, 0);
assert.equal(L.thumbUrl({ thumb: null }), null);
assert.match(L.thumbUrl({ thumb: 'cover.png' }), /api\/studio\/thumb\?name=cover\.png$/);
assert.equal(L.moduleName('deck'), 'Deck');
assert.equal(L.moduleName(''), '');
assert.equal(L.formatDay('not a date'), '');
assert.match(L.formatDay('2026-11-17T09:00:00Z'), /2026/);
assert.deepEqual(Object.keys(L.en).sort(), Object.keys(dictionary).sort(), 'the page dictionary and locale/en.json must carry the same keys');
// The dictionary is built in the harness's realm, so compare its values one by
// one rather than by prototype-sensitive deep equality.
for (const [key, value] of Object.entries(L.en)) assert.equal(dictionary[key], value, `locale/en.json ui.${key} must match the page dictionary`);

const slots = [];
const dictionaries = [];
const effects = [];
clientApi.apply({
  effect: (fn) => { effects.push(fn); },
  locale: {
    register: (namespace, entries) => { dictionaries.push([namespace, entries]); return () => {}; },
    bind: () => (key) => key,
  },
  slots: {
    inject: (_name, callback) => callback(),
    register: (spec, component) => { slots.push({ spec, component }); return () => {}; },
  },
});
assert.equal(slots.length, 2);
assert.equal(slots[0].spec.name, 'sidebar.panellist');
assert.equal(slots[0].spec.id, 'studio');
assert.equal(slots[1].spec.name, 'main');
assert.equal(slots[1].spec.key, 'studio');
assert.equal(slots[0].spec.label(), 'panel', 'the panel label goes through the dictionary');
assert.equal(typeof slots[1].spec.inject().t, 'function', 'the page receives its translator');
assert.equal(effects.length, 2, 'styles and dictionaries are effects');
const cleanups = effects.map((fn) => fn());
assert.ok(cleanups.every((cleanup) => typeof cleanup === 'function'), 'every registration returns its cleanup');
assert.deepEqual(dictionaries.map(([namespace]) => namespace), ['dsh-studio']);
assert.ok(dictionaries[0][1].en, 'the English dictionary is registered');

// A slot entry that throws blanks the panel, so the two components must at
// least build their element tree with the stubbed React.
const glyph = slots[0].component({ size: 18, active: false });
assert.equal(glyph.type, 'svg', 'the sidebar glyph is an icon');
const page = slots[1].component({ t: (key) => key });
assert.equal(page.type, 'div');
assert.equal(page.props.className, 'stu-page');
assert.equal(page.children.length, 2, 'the page shell holds its header and body');
pass('client: registrations, dictionary parity, effects with cleanup, shell renders');

process.stdout.write('studio selftest: ok\n');
