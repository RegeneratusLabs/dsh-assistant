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
 * only the pure parts run. Phase 2 adds the brief-to-draft loop: the prefilled
 * conversation prompts, the preview/export routes (hermetic: no chrome spawn),
 * the overlay and download flow, and locale parity for every new string.
 */
import assert from 'node:assert/strict';
import fs, { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, truncateSync, writeFileSync } from 'node:fs';
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
    manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-layout') &&
    manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-workspace'),
  `the page needs the sidebar, layout and workspace rows, not ${manifest.dsh.client.inject.join(', ')}`,
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
for (const file of ['index.js', 'store.js', 'tools.js', 'export.js', 'client.js']) {
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
assert.match(client, /ctx\.slots\.register/);
assert.ok(client.includes('uiWorkspace'), 'the page must ask the Workspace service for its prefilled conversation');
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
assert.match(indexBody, /\/api\/studio\/preview/);
assert.match(indexBody, /\/api\/studio\/export/);
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

// The export route needs a browser to render; pointing the row at a path that
// does not exist keeps this test hermetic — every export request below stops at
// "no browser found" before any process is spawned.
const missingChrome = path.join(home, 'no-browsers', 'chrome-headless-shell');
const routes = [];
const registered = [];
const disposers = [];
const ctx = {
  tools: { register: (definition) => registered.push(definition) },
  connection: { fetch: { register: async (route) => { routes.push(route); return async () => {}; } } },
  effect: (fn) => { disposers.push(fn()); },
};
await apply(ctx, { chromeBinary: missingChrome });
assert.deepEqual(
  routes.map((route) => route.path).sort(),
  ['/api/studio', '/api/studio/export', '/api/studio/preview', '/api/studio/thumb'],
);
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

/* ── Phase 2: preview and export ─────────────────────────────────────────── */

const {
  buildExportArgs,
  exportFilename,
  exportResponse,
  findChromeBinary,
  MAX_PREVIEW_BYTES,
  resolveChrome,
} = await import('./export.js');

// The browser detection is duplicated from the browse plugin on purpose, so it
// is pinned here: an empty cache yields '', a configured binary wins, and a
// blank value falls back to detection.
const emptyBrowsers = path.join(home, 'no-browsers');
mkdirSync(emptyBrowsers, { recursive: true });
assert.equal(findChromeBinary(emptyBrowsers), '', 'an empty cache finds no browser');
assert.equal(resolveChrome({}, emptyBrowsers), '', 'empty config means auto-detect');
assert.equal(resolveChrome({ chromeBinary: '  /opt/chrome  ' }, emptyBrowsers), '/opt/chrome', 'config wins, trimmed');

// A configured path that names a directory (the empty detection dir) is still
// "no browser found": it is refused before any spawn, as a named StudioError.
const dirBrowserHtml = path.join(home, 'dir-browser.html');
writeFileSync(dirBrowserHtml, '<!doctype html><title>Dir browser</title>', { mode: 0o600 });
const dirBrowserWork = store.addWork({ path: dirBrowserHtml, title: 'Dir browser', module: 'web' });
const dirBrowserError = await exportResponse(
  store,
  { url: `/api/studio/export?id=${dirBrowserWork.work.id}&format=png` },
  emptyBrowsers,
).then(
  () => null,
  (error) => error,
);
assert.ok(dirBrowserError instanceof StudioError, 'an empty browser directory is a named refusal');
assert.equal(dirBrowserError.code, 'no_browser');
assert.equal(dirBrowserError.status, 503);

// The exact argv for each format, as a pure function: the selftest never
// spawns a browser, so this is where the flags are actually pinned.
const commonFlags = [
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-crash-reporter',
  '--no-first-run',
  '--disable-extensions',
  '--virtual-time-budget=5000',
  '--run-all-compositor-stages-before-draw',
];
const argsFor = (format, file = '/tmp/example.html', output = `/tmp/example.${format}`) =>
  buildExportArgs({ chrome: '/opt/chrome', file, output, format });
assert.deepEqual(argsFor('png'), [
  '/opt/chrome',
  ...commonFlags,
  '--hide-scrollbars',
  '--window-size=1920,1080',
  '--force-device-scale-factor=1',
  '--screenshot=/tmp/example.png',
  'file:///tmp/example.html',
]);
assert.deepEqual(argsFor('pdf'), [
  '/opt/chrome',
  ...commonFlags,
  '--no-pdf-header-footer',
  '--print-to-pdf=/tmp/example.pdf',
  'file:///tmp/example.html',
]);
assert.ok(argsFor('png', path.join(home, 'a b.html')).at(-1).endsWith('a%20b.html'), 'the file URL escapes spaces');
assert.throws(() => argsFor('gif'), /not an export format/, 'an unknown format is named');
assert.throws(() => buildExportArgs({ chrome: '', file: '/tmp/x.html', output: '/tmp/x.png', format: 'png' }), /No browser found/);

// A download name cannot smuggle a quote, a newline or a path separator into
// the response header.
const downloadName = exportFilename({ title: 'Draft: "poster" / v2' }, 'png');
assert.match(downloadName, /^[A-Za-z0-9 ._-]+\.png$/, `download name is sanitized: ${downloadName}`);
assert.ok(!/["/\r\n]/.test(downloadName));
assert.equal(exportFilename({ title: '···' }, 'pdf'), 'studio-work.pdf', 'an unusable title falls back');

// Preview: the library row is the allowlist, and the bytes are served under a
// policy that cannot reach the Host page framing them.
const draftHtml = path.join(home, 'pages', 'draft.html');
mkdirSync(path.dirname(draftHtml), { recursive: true, mode: 0o700 });
writeFileSync(draftHtml, '<!doctype html><title>Draft</title><h1>Draft</h1>', { mode: 0o600 });
const draftRegistered = await homeTool.execute({ action: 'add', path: draftHtml, title: 'Draft poster', module: 'web', theme: 'Editorial' });
const draftId = /WORK-\d+/.exec(draftRegistered.message)[0];

const previewRoute = routes.find((route) => route.path === '/api/studio/preview');
const previewed = await previewRoute.fetch({ url: `/api/studio/preview?id=${draftId}`, signal: undefined });
assert.equal(previewed.status, 200);
assert.equal(previewed.headers.get('content-type'), 'text/html; charset=utf-8');
assert.equal(previewed.headers.get('content-security-policy'), 'sandbox allow-scripts');
assert.equal(previewed.headers.get('x-content-type-options'), 'nosniff');
assert.equal(previewed.headers.get('cache-control'), 'no-store');
assert.match(await previewed.text(), /<h1>Draft<\/h1>/, 'the preview is the registered artifact');

const unknownPreview = await previewRoute.fetch({ url: '/api/studio/preview?id=WORK-404', signal: undefined });
assert.equal(unknownPreview.status, 404);
assert.match((await unknownPreview.json()).error, /^no work WORK-404$/);
const noId = await previewRoute.fetch({ url: '/api/studio/preview', signal: undefined });
assert.equal(noId.status, 400);
assert.match((await noId.json()).error, /a work id is required/);

const loopHtml = await homeTool.execute({ action: 'add', path: path.join(home, 'motion', 'loop.mp4'), title: 'Loop', module: 'motion' });
const loopId = /WORK-\d+/.exec(loopHtml.message)[0];
const notHtml = await previewRoute.fetch({ url: `/api/studio/preview?id=${loopId}`, signal: undefined });
assert.equal(notHtml.status, 415);
assert.match((await notHtml.json()).error, /is not an HTML page/);

const goneHtml = await homeTool.execute({ action: 'add', path: path.join(home, 'pages', 'gone.html'), title: 'Gone', module: 'web' });
const goneId = /WORK-\d+/.exec(goneHtml.message)[0];
const missing = await previewRoute.fetch({ url: `/api/studio/preview?id=${goneId}`, signal: undefined });
assert.equal(missing.status, 404);
assert.match((await missing.json()).error, /is not there any more/);

try {
  const realHtml = path.join(home, 'real.html');
  writeFileSync(realHtml, '<!doctype html><title>Linked</title>', { mode: 0o600 });
  const linkedHtml = path.join(home, 'pages', 'linked.html');
  symlinkSync(realHtml, linkedHtml);
  const linkedWork = await homeTool.execute({ action: 'add', path: linkedHtml, title: 'Linked', module: 'web' });
  const linkedId = /WORK-\d+/.exec(linkedWork.message)[0];
  const linked = await previewRoute.fetch({ url: `/api/studio/preview?id=${linkedId}`, signal: undefined });
  assert.equal(linked.status, 415, 'a symlink is not the delivered file');
  assert.match((await linked.json()).error, /is not a regular file/);
} catch (error) {
  // Windows without developer mode cannot create a symlink; the check is
  // meaningless there, but any other failure is real.
  if (!['EPERM', 'EACCES', 'ENOSYS'].includes(error?.code)) throw error;
}

const bigHtml = path.join(home, 'pages', 'big.html');
writeFileSync(bigHtml, '', { mode: 0o600 });
truncateSync(bigHtml, MAX_PREVIEW_BYTES + 1);
const bigWork = await homeTool.execute({ action: 'add', path: bigHtml, title: 'Big', module: 'web' });
const bigId = /WORK-\d+/.exec(bigWork.message)[0];
const tooBig = await previewRoute.fetch({ url: `/api/studio/preview?id=${bigId}`, signal: undefined });
assert.equal(tooBig.status, 413, 'the preview size cap is enforced');
assert.match((await tooBig.json()).error, /previews stop at 8 MB/);

// Export: a bad format is named before anything else, and a missing browser is
// a sentence rather than a spawn. No request below can start a child process.
const exportRoute = routes.find((route) => route.path === '/api/studio/export');
const badFormat = await exportRoute.fetch({ url: `/api/studio/export?id=${draftId}&format=gif`, signal: undefined });
assert.equal(badFormat.status, 400);
assert.match((await badFormat.json()).error, /is not an export format; use png or pdf/);
const noFormat = await exportRoute.fetch({ url: `/api/studio/export?id=${draftId}`, signal: undefined });
assert.equal(noFormat.status, 400);
assert.match((await noFormat.json()).error, /no format/);

for (const format of ['png', 'pdf']) {
  const noBrowser = await exportRoute.fetch({ url: `/api/studio/export?id=${draftId}&format=${format}`, signal: undefined });
  assert.equal(noBrowser.status, 503, `${format} stops before spawning when no browser is configured`);
  assert.match((await noBrowser.json()).error, /^No browser found to render this work/);
}
const exportUnknown = await exportRoute.fetch({ url: '/api/studio/export?id=WORK-404&format=png', signal: undefined });
assert.equal(exportUnknown.status, 404, 'export resolves the work before rendering');

// A refused export validates before touching the disk: if the directory exists
// at all, it is empty and private, and no browser was ever started.
const exportDir = path.join(home, 'studio', 'exports');
if (existsSync(exportDir)) {
  assert.equal(statSync(exportDir).mode & 0o777, 0o700, 'the export directory is private');
  assert.deepEqual(readdirSync(exportDir), [], 'a refused export leaves no output behind');
}
pass('P2 routes: preview bytes + headers, allowlist refusals, export format/no-browser refusals, chrome argv');

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

/* ── Phase 2: drafts, preview overlay, export flow ────────────────────────── */

assert.ok(clientApi.inject.includes('uiWorkspace'), 'the client declares the Workspace service it drafts through');

// The service reaches the page through the slot's inject face; with no service
// the page still renders and the composer explains why drafting is off.
const pageProps = slots[1].spec.inject();
assert.equal(typeof pageProps.t, 'function');
assert.equal(pageProps.workspace, null, 'a page without the service degrades instead of throwing');

/** Depth-first walk of a stubbed element tree. */
function findElement(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, predicate);
      if (found) return found;
    }
    return null;
  }
  if (predicate(node)) return node;
  for (const child of node.children ?? []) {
    const found = findElement(child, predicate);
    if (found) return found;
  }
  return null;
}

/** Every element matching `predicate`, depth first. */
function findElements(node, predicate, found = []) {
  if (!node || typeof node !== 'object') return found;
  if (Array.isArray(node)) {
    for (const child of node) findElements(child, predicate, found);
    return found;
  }
  if (predicate(node)) found.push(node);
  for (const child of node.children ?? []) findElements(child, predicate, found);
  return found;
}

/* The prompt builders are read by a person before they send. They name the
   skill and the process in plain language, never a tool id or a module token,
   give a worked example instead of an angle-bracket placeholder, and end with
   one editable-draft hint. */
const free = L.freeBrief('a poster for the harvest fair');
assert.match(free, /studio skill/i, 'the prompt names the skill');
assert.match(free, /harvest fair/, 'the prompt carries the user’s brief');
assert.match(free, /\n\nThe design task is: a poster for the harvest fair\.\n\n/, 'the brief is its own punctuated paragraph, never a run-on');
assert.match(free, /three directions/i, 'the gate happens in chat');
assert.match(free, /save it to my works/i, 'the result is saved without naming a tool id');
assert.ok(!/studio_library|\bmodule\b|[<>]/.test(free), 'no tool ids, module tokens or angle-bracket placeholders');
assert.match(free.trim().split('\n').at(-1), /^This is a starting point — edit it before sending\.$/, 'ends with the edit hint');
assert.match(L.freeBrief('stop here!'), /design task is: stop here!\n/, 'existing punctuation is not doubled');
assert.equal(L.freeBrief('   '), '', 'an empty brief builds nothing');

for (const module of ['deck', 'web', 'motion', 'infographic']) {
  const prompt = L.quickStart(module);
  assert.match(prompt, /studio skill/i, `${module} names the skill`);
  const lines = prompt.trim().split('\n');
  assert.match(lines.at(-1), /^This is a starting point — edit it before sending\.$/, `${module} ends with the edit hint`);
  const topic = lines.find((line) => line.startsWith('Topic: '));
  assert.ok(topic, `${module} carries a worked topic example`);
  assert.ok(topic.length > 'Topic: '.length, `${module} topic has words to overwrite`);
  assert.ok(!/[<>]/.test(prompt), `${module} has no angle-bracket placeholder`);
  assert.ok(!/studio_library|\bmodule\b/i.test(prompt), `${module} has no internal vocabulary`);
  assert.ok(!new RegExp(`\\b${module}\\b module`, 'i').test(prompt), `${module} is never named as a token`);
}
assert.match(L.quickStart('motion'), /video in this conversation/i, 'motion says the piece arrives as a video');
assert.ok(!/video in this conversation/i.test(L.quickStart('deck')), 'the video note belongs to motion only');
assert.equal(L.quickStart('wobble'), '', 'an unknown module builds no prompt');

const likeWork = {
  id: 'WORK-7',
  path: '/home/person/decks/offsite.html',
  module: 'deck',
  theme: 'Editorial',
  title: 'Offsite deck',
};
const like = L.makeLike(likeWork);
assert.match(like, /studio skill/i);
assert.match(like, /Find the work titled 'Offsite deck' in my works library/, 'the reference is named by title');
assert.match(like, /theme: 'Editorial'/, 'the theme is named');
assert.ok(!like.includes(likeWork.path), 'no absolute path in the prompt');
assert.ok(!/studio_library|\bmodule\b|[<>]/.test(like), 'no tool ids, module tokens or angle-bracket placeholders');
assert.match(like, /as a deck/, 'the new work is described in plain words');
assert.match(like, /New content: a launch page for our autumn workshops/, 'the new-content line is a worked example');
assert.match(like.trim().split('\n').at(-1), /^This is a starting point — edit it before sending\.$/);
const unthemed = L.makeLike({ path: '/x.html', module: 'web' });
assert.match(unthemed, /theme: not recorded/, 'a work without a theme still builds');
assert.ok(!unthemed.includes('/x.html'), 'no path leaks for an unthemed work either');
assert.match(unthemed, /as a landing page/, 'web is described as a landing page');
assert.ok(!/a new web\b/.test(unthemed), 'never "a new web"');

/* The one call into the Workspace service, isolated so the assertion is about
   the contract rather than React state. */
const workspace = {
  calls: [],
  startSession(workspaceId, options) {
    this.calls.push({ workspaceId, options });
  },
};
assert.equal(L.startSessionFor(workspace, 'use the studio skill'), true);
// The call object is built in the harness's realm, so compare its fields one by
// one rather than by prototype-sensitive deep equality.
assert.equal(workspace.calls[0].workspaceId, undefined, 'no workspace: the current one is used');
assert.equal(workspace.calls[0].options.prompt, 'use the studio skill');
assert.equal(workspace.calls[0].options.whenDraftExists, 'replace');
assert.equal(L.startSessionFor(workspace, '   '), false, 'an empty prompt asks for nothing');
assert.equal(workspace.calls.length, 1);
assert.equal(L.startSessionFor(null, 'text'), false, 'a missing service is a refusal, not a throw');

assert.equal(L.draftBrief(workspace, 'a deck for the offsite'), true);
assert.equal(workspace.calls[1].options.prompt, L.freeBrief('a deck for the offsite'), 'Draft it sends the built prompt');
assert.equal(workspace.calls[1].options.whenDraftExists, 'replace');
assert.equal(L.draftBrief(workspace, '   '), false, 'an empty brief does nothing');
assert.equal(workspace.calls.length, 2);

// The outcome helper keeps the visible copy friendly and the exception text
// out of the sentence (it goes to the error row's title only).
const noService = L.draftFrom(null, 'text', (key) => key);
assert.equal(noService.ok, false);
assert.equal(noService.error, 'draftUnavailable');
assert.equal(noService.detail, undefined);
const boomService = { startSession() { throw new Error('boom'); } };
const failedDraft = L.draftFrom(boomService, 'text', (key) => key);
assert.equal(failedDraft.ok, false);
assert.equal(failedDraft.error, 'draftFailed');
assert.equal(failedDraft.detail, 'boom');
const svc = { calls: [], startSession(workspaceId, options) { this.calls.push({ workspaceId, options }); } };
assert.equal(L.draftFrom(svc, 'text', (key) => key).ok, true);

clientApi.apply({
  effect: () => {},
  get: (name) => (name === 'uiWorkspace' ? svc : undefined),
  locale: { register: () => () => {}, bind: () => (key) => key },
  slots: { inject: (_name, callback) => callback(), register: () => () => {} },
});
assert.equal(clientApi.__logic.workspaceService({ uiWorkspace: svc }), svc, 'the service is found on the context');
assert.equal(clientApi.__logic.workspaceService({}), null, 'no service means no drafting');

/* Export and preview requests are functions with an injected fetch, so the
   success and error paths are asserted without a browser. */
const detailWork = {
  id: 'WORK-3',
  title: 'Draft poster',
  path: '/home/person/pages/draft.html',
  module: 'web',
  theme: 'Editorial',
  createdAt: '2026-11-18T09:00:00Z',
  thumb: null,
};

const exportCalls = [];
const okExportFetch = async (url, init) => {
  exportCalls.push({ url, init });
  return {
    ok: true,
    headers: { get: (name) => (name === 'content-disposition' ? 'attachment; filename="Draft poster.png"' : null) },
    blob: async () => 'BLOB',
  };
};
const okExport = await L.downloadExport(okExportFetch, detailWork, 'png');
assert.equal(okExport.ok, true);
assert.equal(okExport.blob, 'BLOB');
assert.equal(okExport.filename, 'Draft poster.png', 'the download name comes from the response header');
assert.match(exportCalls[0].url, /api\/studio\/export\?id=WORK-3&format=png$/, 'the export URL is the fetch target');
assert.equal(exportCalls[0].init.cache, 'no-store');
assert.equal(exportCalls[0].init.credentials, 'same-origin');

const failingExportFetch = async () => ({
  ok: false,
  status: 503,
  json: async () => ({ ok: false, code: 'no_browser', error: 'No browser found to render this work' }),
});
const failedExport = await L.downloadExport(failingExportFetch, detailWork, 'png');
assert.equal(failedExport.ok, false);
assert.equal(failedExport.error, 'No browser found to render this work', 'the Host sentence is shown, not saved as a file');

const plainFailureFetch = async () => ({
  ok: false,
  status: 500,
  json: async () => {
    throw new Error('not json');
  },
});
assert.match((await L.downloadExport(plainFailureFetch, detailWork, 'png')).error, /HTTP 500/);
const offlineFetch = async () => {
  throw new Error('offline');
};
assert.match((await L.downloadExport(offlineFetch, detailWork, 'png')).error, /Could not reach the server/);
const noHeaderExport = await L.downloadExport(
  async () => ({ ok: true, headers: { get: () => null }, blob: async () => 'BLOB' }),
  detailWork,
  'pdf',
);
assert.equal(noHeaderExport.filename, 'studio-work.pdf', 'a missing header falls back to a safe name');

const previewCalls = [];
const okProbe = await L.probePreview(async (url, init) => {
  previewCalls.push({ url, init });
  return { ok: true };
}, detailWork);
assert.equal(okProbe.ok, true);
assert.match(previewCalls[0].url, /api\/studio\/preview\?id=WORK-3$/);
const missingProbe = await L.probePreview(
  async () => ({ ok: false, status: 404, json: async () => ({ error: 'no work WORK-3' }) }),
  detailWork,
);
assert.equal(missingProbe.ok, false);
assert.equal(missingProbe.error, 'no work WORK-3', 'the 404 sentence reaches the failed state');
const downProbe = await L.probePreview(async () => {
  throw new Error('down');
}, detailWork);
assert.equal(downProbe.ok, false);
assert.equal(downProbe.error, null);

/* HomeView is presentational: the page owns the brief, so a render can pin both
   the disabled state and the click contract without a React renderer. */
const homeFor = (brief, onDraft, onQuick = () => {}) =>
  L.HomeView({
    works: [],
    status: 'ready',
    error: null,
    brief,
    onBrief: () => {},
    onDraft,
    canDraft: true,
    onQuick,
    onRetry: () => {},
    onOpenWork: () => {},
    onSeeAll: () => {},
    t: (key) => key,
  });

const draftCalls = [];
const readyHome = homeFor('a deck for the offsite', () => draftCalls.push(L.freeBrief('a deck for the offsite')));
const area = findElement(readyHome, (element) => element.type === 'textarea');
assert.equal(area.props.readOnly, undefined, 'the composer is editable');
assert.equal(area.props.value, 'a deck for the offsite');
assert.equal(area.props.placeholder, 'briefPlaceholder');
assert.equal(typeof area.props.onChange, 'function', 'typing updates the page');
const primary = findElement(readyHome, (element) => element.type === 'button' && element.props.className === 'stu-primary');
assert.equal(primary.props.disabled, false, 'Draft it is enabled for a non-empty brief');
assert.equal(primary.props['aria-describedby'], 'stu-draft-note', 'Draft it is described by its note');
const draftNote = findElement(readyHome, (element) => element.props?.id === 'stu-draft-note');
assert.equal(draftNote.props.className, 'stu-note', 'the note is a normal-size line, not a caption');
primary.props.onClick();
assert.equal(draftCalls.length, 1, 'Draft it calls the draft action');

const emptyHome = homeFor('   ', () => draftCalls.push('called'));
const emptyPrimary = findElement(emptyHome, (element) => element.type === 'button' && element.props.className === 'stu-primary');
assert.equal(emptyPrimary.props.disabled, true, 'Draft it is off for an empty brief');

const quickModules = [];
const chipHome = homeFor('x', () => {}, (module) => quickModules.push(module));
const chips = findElements(chipHome, (element) => element.type === 'button' && element.props.className === 'stu-chip');
assert.equal(chips.length, 4, 'the four quick starts are buttons');
assert.ok(chips.every((chip) => chip.props.disabled === false), 'the chips are enabled when the service exists');
chips[0].props.onClick();
assert.deepEqual(quickModules, ['deck'], 'a chip drafts its own module');

/* The detail panel: primary preview, no dead buttons for a video, the same
   make-like treatment as the chips, and errors kept with the actions. */
let previewOpens = 0;
const likeCallsBefore = workspace.calls.length;
const detail = L.WorkDetail({
  work: detailWork,
  onClose: () => {},
  onPreview: () => { previewOpens += 1; },
  workspace,
  canDraft: true,
  t: (key) => key,
});
assert.match(L.previewUrl(detailWork), /api\/studio\/preview\?id=WORK-3$/);
assert.match(L.exportUrl(detailWork, 'png'), /api\/studio\/export\?id=WORK-3&format=png$/);
assert.match(L.exportUrl(detailWork, 'pdf'), /api\/studio\/export\?id=WORK-3&format=pdf$/);
assert.equal(L.exportUrl(detailWork, 'exe'), L.exportUrl(detailWork, 'png'), 'an unknown format falls back to png');
assert.equal(L.isHtmlPath(detailWork.path), true);
assert.equal(L.isHtmlPath('/home/person/motion/loop.mp4'), false);

const previewButton = findElement(detail, (element) => element.type === 'button' && element.children.includes('preview'));
assert.match(previewButton.props.className, /\bstu-primary\b/, 'Preview is the primary action');
previewButton.props.onClick();
assert.equal(previewOpens, 1, 'Preview opens the in-page overlay');

const likeButton = findElement(detail, (element) => element.type === 'button' && element.children.includes('makeLike'));
assert.equal(likeButton.props.disabled, false, 'Make one like this is enabled with the service');
likeButton.props.onClick();
assert.equal(workspace.calls.length, likeCallsBefore + 1, 'Make one like this asks for a conversation');
assert.equal(workspace.calls.at(-1).options.prompt, L.makeLike(detailWork), 'it sends the make-like prompt');
const detailNote = findElement(detail, (element) => element.props?.className === 'stu-note');
assert.equal(detailNote.children[0], 'draftNote', 'the same one-liner sits beside the actions');

const exportButtons = findElements(
  detail,
  (element) => element.type === 'button' && element.children.some((text) => text === 'exportPng' || text === 'exportPdf'),
);
assert.equal(exportButtons.length, 2, 'both formats are buttons, not raw download links');
assert.ok(exportButtons.every((button) => button.props.disabled === false));
assert.equal(findElements(detail, (element) => element.type === 'a' && element.props.href).length, 0, 'no plain download anchors');
assert.equal(findElements(detail, (element) => element.type === 'a' && element.props.hidden === true).length, 1, 'the save anchor stays inside the tree');

const videoDetail = L.WorkDetail({
  work: { ...detailWork, path: '/home/person/motion/loop.mp4' },
  onClose: () => {},
  onPreview: () => {},
  workspace,
  canDraft: true,
  t: (key) => key,
});
assert.equal(findElements(videoDetail, (element) => element.type === 'button' && element.children.includes('preview')).length, 0, 'a video hides Preview');
assert.equal(
  findElements(videoDetail, (element) => element.type === 'button' && element.children.some((text) => text === 'exportPng' || text === 'exportPdf')).length,
  0,
  'a video hides the exports',
);
assert.ok(findElements(videoDetail, (element) => element.children.some((text) => text === 'nonHtmlNote')).length > 0, 'the panel says where a video lives');
assert.equal(findElements(videoDetail, (element) => element.type === 'button' && element.children.includes('copyPath')).length, 1, 'Copy path stays');

const noSvcDetail = L.WorkDetail({
  work: detailWork,
  onClose: () => {},
  onPreview: () => {},
  workspace: null,
  canDraft: false,
  t: (key) => key,
});
const noSvcLike = findElement(noSvcDetail, (element) => element.type === 'button' && element.children.includes('makeLike'));
assert.equal(noSvcLike.props.disabled, true, 'Make one like this is disabled without the service');
assert.equal(noSvcLike.props.title, 'draftUnavailable', 'and explains why');

// Error ownership: the page no longer takes a make-like callback, and both
// action errors render through ErrorRow inside the detail panel.
assert.match(client, /actionError \? h\(ErrorRow/, 'make-like errors render inside the detail panel');
assert.match(client, /exportError \? h\(ErrorRow/, 'export errors render inside the detail panel');
assert.ok(!client.includes('onMakeLike'), 'the page does not own the make-like action');

/* The overlay: a dialog, a pre-checked body with three states, and a close
   button wired to the page. The iframe only appears once the route answered. */
const readyBody = L.PreviewBody({ work: detailWork, state: 'ready', failure: null, onFailed: () => {}, t: (key) => key });
assert.equal(readyBody.type, 'iframe', 'the ready state frames the work');
assert.equal(readyBody.props.sandbox, 'allow-scripts', 'a delivered page gets scripts and nothing else');
assert.match(readyBody.props.src, /api\/studio\/preview\?id=WORK-3$/);
assert.equal(readyBody.props.title, 'preview');
const checkingBody = L.PreviewBody({ work: detailWork, state: 'checking', failure: null, onFailed: () => {}, t: (key) => key });
assert.equal(checkingBody.props.role, 'status', 'the checking state is a status');
assert.equal(checkingBody.props['aria-busy'], true);
const failedBody = L.PreviewBody({ work: detailWork, state: 'failed', failure: 'no work WORK-3', onFailed: () => {}, t: (key) => key });
assert.equal(failedBody.props.role, 'alert', 'the failed state is an alert');
assert.equal(failedBody.props.title, 'no work WORK-3', 'the Host sentence is the detail');

let closed = 0;
const overlay = L.PreviewOverlay({ work: detailWork, onClose: () => { closed += 1; }, t: (key) => key });
const dialog = findElement(overlay, (element) => element.props?.role === 'dialog');
assert.ok(dialog, 'the overlay is a dialog');
assert.equal(dialog.props['aria-modal'], 'true');
assert.equal(dialog.props.tabIndex, -1, 'the dialog takes focus');
const closeButton = findElement(overlay, (element) => element.type === 'button' && element.children.includes('close'));
closeButton.props.onClick();
assert.equal(closed, 1, 'Close dismisses the overlay');
pass('P2 client: plain prompts, Draft it + make-like contract, preview states, export fetch flow, motion detail, service degrade');

process.stdout.write('studio selftest: ok\n');
