// Self-test for the browsing stack — no DSH process, no real browser, no network.
//
//   node plugins/browse/selftest.mjs
//
// Exercises the pure seams (challenge detection, config precedence, asset
// filtering, chromium argv, child-process timeout) and drives both tools against
// an in-process stub of the CamoFox REST server. Exits nonzero on the first
// failed assertion and removes its temporary home and output directory.
import assert from 'node:assert/strict';
import http from 'node:http';
import { EventEmitter } from 'node:events';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.join(os.tmpdir(), 'dsh-browse-selftest');
rmSync(ROOT, { recursive: true, force: true });
mkdirSync(path.join(ROOT, 'home'), { recursive: true, mode: 0o700 });
mkdirSync(path.join(ROOT, 'out'), { recursive: true, mode: 0o700 });
process.env.DSH_HOME = path.join(ROOT, 'home');
delete process.env.DSH_BROWSE_CAMOFOX_URL;
delete process.env.DSH_BROWSE_OUT;

const {
  apply,
  buildChromeArgs,
  buildProbeArgs,
  buildTools,
  detectChallenge,
  filterAssets,
  findChromeBinary,
  formatLayoutIssues,
  injectBaseHref,
  injectLayoutProbe,
  parseLayoutProbe,
  resolveConfig,
  runProcess,
} = await import('./index.js');

const pass = (message) => process.stdout.write(`PASS ${message}\n`);

// ── stub CamoFox server ──────────────────────────────────────────────────────
const state = { captcha: false, downloadsCalls: 0 };
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const send = (body, type = 'application/json') => {
    res.writeHead(200, { 'content-type': type });
    res.end(type === 'application/json' ? JSON.stringify(body) : body);
  };
  if (url.pathname === '/health') return send({ ok: true, engine: 'camoufox', browserConnected: false });
  if (url.pathname === '/tabs') return send({ tabId: 'tab-1', url: 'about:blank' });
  if (url.pathname === '/tabs/tab-1/navigate') return send({ ok: true, url: 'https://example.org/' });
  if (/^\/tabs\/tab-1\/(click|type|press)$/.test(url.pathname)) return send({ ok: true });
  if (url.pathname === '/tabs/tab-1/snapshot') {
    return send({ snapshot: state.captcha ? 'Just a moment... checking your browser' : '- heading "Example" [e1]\n- link "Download" [e2]' });
  }
  if (url.pathname === '/tabs/tab-1/links') {
    return send({
      links: [
        { url: 'https://example.org/brand.pdf', text: 'Brand guide' },
        { url: 'https://example.org/page.html', text: 'Page' },
        { url: 'https://example.org/_files/ugd/abc.zip', text: 'Resources' },
      ],
    });
  }
  if (url.pathname === '/tabs/tab-1/screenshot') return send(PNG, 'image/png');
  if (url.pathname === '/users/dsh-assistant/downloads') {
    state.downloadsCalls += 1;
    return send({ links: state.downloadsCalls === 1 ? [] : [{ id: 'd1', name: 'poster.pdf' }] });
  }
  if (url.pathname === '/downloads/d1/content') return send(Buffer.from('%PDF-1.4 test'), 'application/pdf');
  if (url.pathname === '/tabs/tab-1' && req.method === 'DELETE') return send({ ok: true });
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: `unhandled ${req.method} ${url.pathname}` }));
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;

// ── pure seams ───────────────────────────────────────────────────────────────
assert.equal(detectChallenge({ url: 'https://x.test/', title: 'Home', text: 'Welcome' }), undefined);
assert.equal(detectChallenge({ title: 'Just a moment...' })?.needsHuman, true);
assert.equal(detectChallenge({ url: 'https://x.test/captcha?token=1' })?.needsHuman, true);
assert.equal(detectChallenge({ text: 'Please complete the security check to continue' })?.needsHuman, true);
pass('challenge detection covers title, body and URL');

const resolved = resolveConfig({}, { DSH_HOME: '/tmp/x', DSH_BROWSE_CAMOFOX_URL: 'http://example:9/' });
assert.equal(resolved.camofoxUrl, 'http://example:9');
assert.equal(resolved.outputDir, path.join('/tmp/x', 'browse'));
assert.equal(resolved.userId, 'dsh-assistant');
assert.equal(resolveConfig({ camofoxUrl: 'http://row:1' }, { DSH_BROWSE_CAMOFOX_URL: 'http://env:2' }).camofoxUrl, 'http://row:1');
assert.equal(resolveConfig({}, { DSH_HOME: '/tmp/x', DSH_BROWSE_OUT: '/tmp/out' }).outputDir, '/tmp/out');
pass('config precedence: row over env over default');

const assets = filterAssets([
  { url: 'https://x.test/brand.pdf' },
  { url: 'https://x.test/page.html' },
  { url: 'https://x.test/_files/ugd/abc.pdf?dn=x' },
  { url: 'https://x.test/style.css' },
  { url: 'https://x.test/poster.PNG' },
]);
assert.deepEqual(assets.map((link) => link.url), ['https://x.test/brand.pdf', 'https://x.test/_files/ugd/abc.pdf?dn=x', 'https://x.test/poster.PNG']);
pass('asset filter keeps documents, archives and images');

const pdfArgs = buildChromeArgs({ chrome: '/bin/chrome', html: '/tmp/a.html', output: '/tmp/a.pdf', mode: 'pdf', width: 1, height: 1, scale: 1 });
assert.ok(pdfArgs.includes('--print-to-pdf=/tmp/a.pdf'));
assert.ok(pdfArgs.includes('--no-pdf-header-footer'));
assert.ok(pdfArgs.includes('file:///tmp/a.html'));
const pngArgs = buildChromeArgs({ chrome: '/bin/chrome', html: '/tmp/a.html', output: '/tmp/a.png', mode: 'png', width: 800, height: 600, scale: 2 });
assert.ok(pngArgs.includes('--screenshot=/tmp/a.png'));
assert.ok(pngArgs.includes('--window-size=800,600'));
assert.ok(pngArgs.includes('--force-device-scale-factor=2'));
pass('chromium argv carries the print and screenshot flags');

const binary = findChromeBinary();
assert.ok(binary === '' || existsSync(binary), 'a detected chrome binary must exist');
pass(`chrome detection: ${binary === '' ? 'none installed' : path.basename(binary)}`);

function fakeSpawn({ hang = false, code = 0, stderr = '' } = {}) {
  return () => {
    const child = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => child.emit('close', null);
    if (stderr) setTimeout(() => child.stderr.emit('data', stderr), 1);
    if (!hang) setTimeout(() => child.emit('close', code), 5);
    return child;
  };
}
assert.equal((await runProcess(fakeSpawn({ code: 0 }), ['/bin/x'], 200)).code, 0);
assert.equal((await runProcess(fakeSpawn({ hang: true }), ['/bin/x'], 50)).timedOut, true);
assert.match((await runProcess(fakeSpawn({ code: 2, stderr: 'boom' }), ['/bin/x'], 200)).stderr, /boom/);
pass('child processes are bounded and report stderr');

// ── tools against the stub server ────────────────────────────────────────────
const tools = buildTools({ ...resolved, camofoxUrl: baseUrl, outputDir: path.join(ROOT, 'out'), chromeBinary: '' });
const browse = tools.find((tool) => tool.name === 'browse');
const render = tools.find((tool) => tool.name === 'render_html');
const view = tools.find((tool) => tool.name === 'render_view');
assert.ok(browse && render && view, 'all three tools are registered');
assert.equal(browse.parameters.properties.action.enum.length, 10);

const say = async (args) => (await browse.execute(args, { agent: { session: { id: 'selftest' } } })).message;
assert.match(await say({ action: 'status' }), /CamoFox http/);
assert.match(await say({ action: 'open', url: 'https://example.org/' }), /Opened https:\/\/example\.org\/[\s\S]*heading "Example"/);
assert.match(await say({ action: 'links', filter: 'assets' }), /2 of 3 links \(assets\)[\s\S]*brand\.pdf[\s\S]*abc\.zip/);
assert.doesNotMatch(await say({ action: 'links', filter: 'assets' }), /page\.html/);
assert.equal(await say({ action: 'click', ref: 'e2' }), 'Clicked e2.');
assert.equal(await say({ action: 'type', ref: 'e2', text: 'hello' }), 'Typed into e2.');
assert.equal(await say({ action: 'press', key: 'Enter' }), 'Pressed Enter.');

const shot = await say({ action: 'screenshot' });
const shotPath = /Saved (\/\S+\.png)/.exec(shot)?.[1];
assert.ok(shotPath && existsSync(shotPath), 'screenshot writes a file');
assert.deepEqual(readFileSync(shotPath), PNG);

state.captcha = true;
const blocked = await say({ action: 'snapshot' });
assert.match(blocked, /bot challenge/);
assert.match(blocked, /needs a human/);
state.captcha = false;
pass('browse drives open/links/click/type/press/screenshot and stops on a challenge');

const download = await say({ action: 'download', url: 'https://example.org/poster.pdf' });
const downloaded = /Saved (\/\S+\.pdf)/.exec(download)?.[1];
assert.ok(downloaded && existsSync(downloaded), 'download writes a file');
assert.match(readFileSync(downloaded, 'utf8'), /%PDF-1\.4/);
pass('download captures a server-tracked file');

assert.equal(await say({ action: 'close' }), 'Tab closed.');
assert.match(await say({ action: 'open', url: 'not-a-url' }), /absolute http\(s\) URL/);
assert.match(await say({ action: 'bogus' }), /Unknown action/);
pass('edge cases answer instead of throwing');

// apply() registers both tools and states its wiring.
const registered = [];
const logs = [];
const origError = console.error;
console.error = (...args) => logs.push(args.join(' '));
apply({ tools: { register: (tool) => registered.push(tool.name) } }, { camofoxUrl: baseUrl });
console.error = origError;
assert.deepEqual(registered, ['browse', 'render_html', 'render_view']);
assert.match(logs.join('\n'), /\[dsh-browse\] camofox=/);
pass('apply registers browse + render_html + render_view and logs the wiring');

// render_html refuses a missing file instead of spawning anything.
const missing = await render.execute({ html: path.join(ROOT, 'nope.html') });
assert.match(missing.message, /No such HTML file/);
pass('render_html checks its input before spawning');

// ── layout probe (pure seams) ────────────────────────────────────────────────
const probeSource = injectLayoutProbe('<html><body><p>hi</p></body></html>');
assert.match(probeSource, /__dsh_layout/);
assert.ok(probeSource.indexOf('__dsh_layout') < probeSource.indexOf('</body>'), 'probe runs before </body>');
assert.match(injectLayoutProbe('<p>no body tag</p>'), /no body tag[\s\S]*__dsh_layout/);
assert.match(injectBaseHref('<html><head></head><body></body></html>', '/tmp/art'), /<base href="file:\/\/\/tmp\/art\/">/);
const dump = '<html><body><pre id="__dsh_layout">AUDIT:{"w":1080,"h":1080,"issues":[{"k":"out","t":"x","dx":9,"dy":0}],"skipped":0}</pre></body></html>';
assert.equal(parseLayoutProbe(dump).issues[0].k, 'out');
assert.equal(parseLayoutProbe('<html></html>'), null);
assert.equal(parseLayoutProbe('<pre id="__dsh_layout">AUDIT:not json</pre>'), null);
assert.deepEqual(buildProbeArgs({ chrome: '/bin/c', html: '/a.html', width: 1080, height: 1080 }).slice(-2), ['--dump-dom', 'file:///a.html']);
const formatted = formatLayoutIssues([
  { k: 'out', t: 'Off', dx: 4, dy: 0 },
  { k: 'clip', t: 'Line', dx: 3, dy: 0 },
  { k: 'tiny', t: 'Fine', px: 9 },
  { k: 'overlap', a: 'A', b: 'B', pct: 21 },
]);
assert.match(formatted[0], /past the canvas edge/);
assert.match(formatted[1], /clipped by its container/);
assert.match(formatted[2], /below 15px/);
assert.match(formatted[3], /collision: "A" ↔ "B" \(21%/);
pass('layout probe injects, parses, and formats its findings');

// ── render_view: probe + screenshot + attached image in one call ─────────────
const artDir = path.join(ROOT, 'art');
mkdirSync(artDir, { recursive: true });
const artHtml = path.join(artDir, 'card.html');
writeFileSync(artHtml, '<!doctype html><html><body><p>card</p></body></html>');
const saved = [];
const viewCtx = {
  get: (service) =>
    service === 'attachments'
      ? { saveImage: async ({ data, mediaType, name }) => { saved.push({ bytes: data.length, mediaType, name }); return { attachmentId: 'sha256:abc', mediaType, bytes: data.length, width: 1080, height: 1080, name }; } }
      : undefined,
};
/** A spawn stub that answers the probe with a DOM dump and every render with a PNG. */
function fakeChrome({ probeJson = null, pngBytes = PNG } = {}) {
  return (bin, argv, options) => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => child.emit('close', null);
    setTimeout(() => {
      if (argv.includes('--dump-dom')) {
        child.stdout.emit('data', `<html><body><pre id="__dsh_layout">AUDIT:${JSON.stringify(probeJson ?? { w: 1080, h: 1080, issues: [], skipped: 0 })}</pre></body></html>`);
      } else {
        const out = argv.find((arg) => arg.startsWith('--screenshot=')).slice('--screenshot='.length);
        writeFileSync(out, pngBytes);
      }
      child.emit('close', 0);
    }, 1);
    return child;
  };
}
const viewTools = buildTools(
  { ...resolved, chromeBinary: '/bin/chrome', outputDir: artDir },
  { ctx: viewCtx, spawnImpl: fakeChrome({ probeJson: { w: 1080, h: 1080, issues: [{ k: 'overlap', a: 'A', b: 'B', pct: 21 }], skipped: 2 } }) },
);
const viewTool = viewTools.find((tool) => tool.name === 'render_view');
const viewed = await viewTool.execute({ html: artHtml }, { agent: { options: { provider: 'p', model: 'm' } } });
assert.match(viewed.message, /Rendered .*card\.png \(1080×1080 at 2x/);
assert.match(viewed.message, /Layout check found 1 issue/);
assert.match(viewed.message, /collision: "A" ↔ "B"/);
assert.match(viewed.message, /2 rotated text block/);
assert.ok(existsSync(path.join(artDir, 'card.png')), 'render_view writes the PNG');
assert.equal(viewed.image.attachmentId, 'sha256:abc');
assert.equal(saved.length, 1);
assert.equal(saved[0].mediaType, 'image/png');
assert.deepEqual(viewed.issues, ['text collision: "A" ↔ "B" (21% of the smaller box)']);
const blocks = viewTool.output.render({}, viewed);
assert.equal(blocks[0].type, 'text');
assert.equal(blocks[1].type, 'image');
assert.equal(blocks[1].attachment.attachmentId, 'sha256:abc');

// check:false skips the probe and the attachment still rides along.
const lean = await viewTool.execute({ html: artHtml, check: false, width: 800, height: 600 }, {});
assert.doesNotMatch(lean.message, /Layout check/);
assert.match(lean.message, /800×600/);
assert.equal(lean.issues.length, 0);

// No attachment service: the path is still returned, no image block.
const textOnly = buildTools({ ...resolved, chromeBinary: '/bin/chrome', outputDir: artDir }, { spawnImpl: fakeChrome({}) });
const bare = await textOnly.find((tool) => tool.name === 'render_view').execute({ html: artHtml }, {});
assert.equal(bare.image, undefined);
assert.match(bare.message, /Image not attached/);
pass('render_view renders, checks, and attaches the image in one call');

// ── output paths stay under the configured output directory ─────────────────
// The model names these paths; an unconfined resolve would let one tool call
// write anywhere the process user can write. Approvals gate the call, the
// confinement makes the promise hold by construction.
const escapeDownload = await say({ action: 'download', url: 'https://example.org/poster.pdf', to: `${ROOT}-escape.pdf` });
assert.match(escapeDownload, /must stay under/);
const escapeHtmlRender = await render.execute({ html: artHtml, png: `${ROOT}-escape.png` });
assert.match(escapeHtmlRender.message, /must stay under/);
const escapeView = await viewTool.execute({ html: artHtml, png: '/escape.png' }, { agent: { options: { provider: 'p', model: 'm' } } });
assert.match(escapeView.message, /must stay under/);
assert.ok(!existsSync('/escape.png'), 'an escaping png is never written');
const nested = await viewTool.execute({ html: artHtml, png: 'nested/deep.png' }, { agent: { options: { provider: 'p', model: 'm' } } });
assert.match(nested.message, /Rendered/);
assert.ok(existsSync(path.join(artDir, 'nested', 'deep.png')), 'a relative png lands under the output dir');
pass('download and render destinations are confined to the output dir');

server.close();
rmSync(ROOT, { recursive: true, force: true });
process.stdout.write('OK dsh-browse selftest\n');
