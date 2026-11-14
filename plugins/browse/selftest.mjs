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
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
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
  buildTools,
  detectChallenge,
  filterAssets,
  findChromeBinary,
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
assert.ok(browse && render, 'both tools are registered');
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
assert.deepEqual(registered, ['browse', 'render_html']);
assert.match(logs.join('\n'), /\[dsh-browse\] camofox=/);
pass('apply registers browse + render_html and logs the wiring');

// render_html refuses a missing file instead of spawning anything.
const missing = await render.execute({ html: path.join(ROOT, 'nope.html') });
assert.match(missing.message, /No such HTML file/);
pass('render_html checks its input before spawning');

server.close();
rmSync(ROOT, { recursive: true, force: true });
process.stdout.write('OK dsh-browse selftest\n');
