/**
 * Browsing for the assistant, in three tiers.
 *
 * Tier 1 is not in this file: the native `web_fetch` tool already reads
 * server-rendered pages as Markdown, cheaply, with no browser. It should be the
 * first call for "what does this page say" and for link discovery.
 *
 * Tier 2 is the `browse` tool: a thin client for the CamoFox Browser Server
 * (the REST wrapper around Camoufox, a Firefox fork with engine-level
 * fingerprint spoofing) that already runs on this machine as its own systemd
 * unit. It exists for the things `web_fetch` cannot do:
 *
 *  - pages that need JavaScript, or a session with cookies;
 *  - the downloadable assets behind "Download" buttons — `links` with
 *    filter `assets` returns the real `_files/ugd/*.pdf` URLs that a Markdown
 *    conversion drops;
 *  - bot-protected sites, where headless Chromium is fingerprinted instantly;
 *  - anything that hits a challenge: we stop and say so instead of retrying.
 *
 * Tier 3 is the `render_html` tool: chromium's headless shell printing *our own*
 * HTML to a print PDF or a PNG at exact millimetres. Firefox's print path and
 * font metrics differ, so a poster or a letterhead belongs here and not in tier 2.
 *
 * Design rules that keep this safe and honest:
 *
 *  - no retries on a challenge; a retry loop deepens a block and can burn the
 *    IP for hours. `detectChallenge` runs on every navigation and the tool
 *    returns a plain "needs a human" answer;
 *  - the browser is a separate service, reached over loopback only. This plugin
 *    never spawns a browser and never touches a credentials store;
 *  - both tools write their artefacts (screenshots, PDFs, downloads) under
 *    `$DSH_HOME/browse` by default and return absolute paths, so nothing
 *    silently lands in a workspace the human is not looking at;
 *  - every child process is bounded (`timeoutMs`), because a hung renderer is
 *    the single most expensive failure mode we have seen in practice.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';

/** This plugin's Loader row id / Cordis plugin name. */
export const name = 'dsh-browse';
/** `tools` is the only service this plugin needs. */
export const inject = ['tools'];

/** Default CamoFox endpoint: the loopback REST server, no auth on loopback. */
const DEFAULT_CAMOFOX_URL = 'http://127.0.0.1:9377';
/** Default persistent CamoFox user id. Profiles (and cookies) key off this. */
const DEFAULT_USER_ID = 'dsh-assistant';
/** How much accessibility tree we hand the model; the rest is noise per step. */
const DEFAULT_MAX_SNAPSHOT_CHARS = 12000;
/** Assets worth calling out when `filter: "assets"` is asked for. */
const ASSET_EXTENSIONS = ['pdf', 'zip', 'docx', 'xlsx', 'pptx', 'csv', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'eps', 'ai', 'psd'];

/**
 * Text that means "a human has to get past this page". Deliberately broad: a
 * false positive costs one question, a false negative costs a retry storm.
 */
const CHALLENGE_TEXT = /(just a moment|verify (?:that )?you are (?:a )?human|are you a robot|checking your browser|enable javascript and cookies|unusual traffic|access denied|pardon our interruption|attention required|complete the security check|cf-chl|hcaptcha|recaptcha|captcha)/i;
/** URLs that are themselves a challenge endpoint. */
const CHALLENGE_URL = /(?:\/captcha|challenge|cf_chl|_incapsula|distil|perimeterx)/i;

/**
 * Decide whether a loaded page is a challenge rather than the content the
 * caller wanted. Returns `undefined` when the page looks normal.
 *
 * @param {{url?: string, title?: string, text?: string}} page - what we observed.
 * @returns {{needsHuman: true, reason: string} | undefined} the verdict, if blocked.
 */
export function detectChallenge(page = {}) {
  const url = String(page.url ?? '');
  if (CHALLENGE_URL.test(url)) return { needsHuman: true, reason: `challenge URL (${url.slice(0, 120)})` };
  const hay = `${String(page.title ?? '')}\n${String(page.text ?? '')}`;
  const match = CHALLENGE_TEXT.exec(hay);
  if (match) return { needsHuman: true, reason: `page says "${match[1]}"` };
  return undefined;
}

/** This process's DSH home; real units set `DSH_HOME`, local runs may not. */
function dshHome() {
  return process.env.DSH_HOME ? path.resolve(process.env.DSH_HOME) : path.join(os.homedir(), '.dsh');
}

/**
 * Pick the newest chrome-headless-shell (preferred) or full chromium under the
 * Playwright browser cache. Chrome's own binary is second choice because it
 * needs a DevTools port; the headless shell prints without one.
 *
 * @returns {string} an absolute binary path, or '' when none is installed.
 */
export function findChromeBinary(home = os.homedir()) {
  const cache = path.join(home, '.cache', 'ms-playwright');
  if (!existsSync(cache)) return '';
  let entries;
  try {
    entries = readdirSync(cache);
  } catch {
    return '';
  }
  const byVersion = (prefix) =>
    entries
      .filter((entry) => entry.startsWith(prefix))
      .map((entry) => ({ entry, version: Number(entry.slice(prefix.length)) || 0 }))
      .sort((a, b) => b.version - a.version);
  for (const { entry } of byVersion('chromium_headless_shell-')) {
    const binary = path.join(cache, entry, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
    if (existsSync(binary)) return binary;
  }
  for (const { entry } of byVersion('chromium-')) {
    const binary = path.join(cache, entry, 'chrome-linux64', 'chrome');
    if (existsSync(binary)) return binary;
  }
  return '';
}

/**
 * Resolve one row's configuration over the process environment. Pure, so the
 * self-test can exercise precedence without a DSH process.
 *
 * @param {Record<string, unknown>} [config] - the row's `config` object.
 * @param {NodeJS.ProcessEnv} [env] - the environment to read.
 * @returns {object} the resolved settings every call shares.
 */
export function resolveConfig(config = {}, env = process.env) {
  const home = env.DSH_HOME ? path.resolve(env.DSH_HOME) : path.join(os.homedir(), '.dsh');
  const camofoxUrl = String(config.camofoxUrl ?? env.DSH_BROWSE_CAMOFOX_URL ?? DEFAULT_CAMOFOX_URL).replace(/\/+$/, '');
  return {
    camofoxUrl,
    userId: String(config.userId ?? env.DSH_BROWSE_USER_ID ?? DEFAULT_USER_ID),
    outputDir: path.resolve(String(config.outputDir ?? env.DSH_BROWSE_OUT ?? path.join(home, 'browse'))),
    chromeBinary: String(config.chromeBinary ?? env.DSH_BROWSE_CHROME ?? '') || findChromeBinary(),
    maxSnapshotChars: Number(config.maxSnapshotChars ?? DEFAULT_MAX_SNAPSHOT_CHARS),
    requestTimeoutMs: Number(config.requestTimeoutMs ?? 30000),
    renderTimeoutMs: Number(config.renderTimeoutMs ?? 60000),
  };
}

/** Escape one value for a JSON body; keeps request construction explicit. */
function jsonBody(value) {
  return JSON.stringify(value);
}

/**
 * One REST client for the CamoFox server. `fetchImpl` is injectable so the
 * self-test can drive a stub server instead of a real browser.
 */
export class CamofoxClient {
  /**
   * @param {{baseUrl: string, fetchImpl?: Function, timeoutMs?: number}} options - endpoint and overrides.
   */
  constructor({ baseUrl, fetchImpl = globalThis.fetch, timeoutMs = 30000 }) {
    this.baseUrl = baseUrl;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Perform one request and decode JSON.
   *
   * @param {string} method - HTTP method.
   * @param {string} route - path with query string, already encoded.
   * @param {object} [body] - JSON body for writes.
   * @returns {Promise<{status: number, ok: boolean, data: any}>} the decoded answer.
   * @throws {Error} when the server is unreachable or exceeds the timeout.
   */
  async request(method, route, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${route}`, {
        method,
        headers: body === undefined ? undefined : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : jsonBody(body),
        signal: controller.signal,
      });
      const text = await response.text();
      let data;
      try {
        data = text.length === 0 ? {} : JSON.parse(text);
      } catch {
        data = { raw: text.slice(0, 400) };
      }
      return { status: response.status, ok: response.ok, data };
    } finally {
      clearTimeout(timer);
    }
  }

  /** Health probe; also pre-launches the browser on the server side. */
  health() {
    return this.request('GET', '/health');
  }

  /** Open one tab inside a user's session, creating the session on first use. */
  createTab(userId, sessionKey) {
    return this.request('POST', '/tabs', { userId, sessionKey });
  }

  /** Point an existing tab at a URL (or at a search macro). */
  navigate(userId, tabId, url) {
    return this.request('POST', `/tabs/${encodeURIComponent(tabId)}/navigate`, { userId, url });
  }

  /** Read the accessibility tree annotated with `eN` element references. */
  snapshot(userId, tabId) {
    return this.request('GET', `/tabs/${encodeURIComponent(tabId)}/snapshot?userId=${encodeURIComponent(userId)}`);
  }

  /** List the anchors on the page, paginated by the server. */
  links(userId, tabId, limit = 200) {
    return this.request('GET', `/tabs/${encodeURIComponent(tabId)}/links?userId=${encodeURIComponent(userId)}&limit=${limit}`);
  }

  /** Click by element ref from the latest snapshot. */
  click(userId, tabId, ref) {
    return this.request('POST', `/tabs/${encodeURIComponent(tabId)}/click`, { userId, ref });
  }

  /** Type into an element by ref. */
  type(userId, tabId, ref, text) {
    return this.request('POST', `/tabs/${encodeURIComponent(tabId)}/type`, { userId, ref, text });
  }

  /** Press one key (Enter, Escape, Tab...). */
  press(userId, tabId, key) {
    return this.request('POST', `/tabs/${encodeURIComponent(tabId)}/press`, { userId, key });
  }

  /** Raw PNG bytes for a screenshot. */
  async screenshot(userId, tabId, fullPage) {
    const response = await this.fetchImpl(
      `${this.baseUrl}/tabs/${encodeURIComponent(tabId)}/screenshot?userId=${encodeURIComponent(userId)}${fullPage ? '&fullPage=true' : ''}`,
      { signal: AbortSignal.timeout(this.timeoutMs) },
    );
    if (!response.ok) throw new Error(`screenshot failed (HTTP ${response.status})`);
    return Buffer.from(await response.arrayBuffer());
  }

  /** Downloads the server has captured for this user. */
  downloads(userId) {
    return this.request('GET', `/users/${encodeURIComponent(userId)}/downloads`);
  }

  /** Stream one captured download's bytes. */
  async downloadContent(userId, downloadId) {
    const response = await this.fetchImpl(
      `${this.baseUrl}/downloads/${encodeURIComponent(downloadId)}/content?userId=${encodeURIComponent(userId)}`,
      { signal: AbortSignal.timeout(this.timeoutMs) },
    );
    if (!response.ok) throw new Error(`download content failed (HTTP ${response.status})`);
    return Buffer.from(await response.arrayBuffer());
  }

  /** Close one tab. */
  closeTab(userId, tabId) {
    return this.request('DELETE', `/tabs/${encodeURIComponent(tabId)}`, { userId });
  }
}

/** Extract the text payload from a snapshot response, whatever shape it takes. */
export function snapshotText(data) {
  if (typeof data === 'string') return data;
  if (typeof data?.snapshot === 'string') return data.snapshot;
  if (typeof data?.text === 'string') return data.text;
  if (typeof data?.tree === 'string') return data.tree;
  return JSON.stringify(data ?? {});
}

/** Extract the link array from a `/links` response. */
export function linkList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.links)) return data.links;
  return [];
}

/**
 * Keep the links whose URL looks like a document, archive or image.
 *
 * @param {Array<{url?: string, text?: string}>} links - every anchor on the page.
 * @returns {Array<{url?: string, text?: string}>} the asset-looking subset.
 */
export function filterAssets(links) {
  return links.filter((link) => {
    const url = String(link?.url ?? '');
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
    return ASSET_EXTENSIONS.includes(ext) || /_files\/(?:ugd|archives)\//i.test(url);
  });
}

/** Short, stable tab key: the conversation id when the host offers one. */
function tabKeyFor(exec, explicit) {
  if (explicit) return `tab:${explicit}`;
  const sessionId = exec?.agent?.session?.id;
  return sessionId ? `session:${sessionId}` : 'session:default';
}

/** Human-readable byte size for tool output. */
function humanBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Resolve a caller-supplied output path, confining it to the output directory.
 *
 * The model names these paths (download `to`, render `pdf`/`png`), so an
 * unconfined resolve would let one tool call write anywhere the process user
 * can write. An explicit path may be relative to the output dir or absolute
 * inside it; anything else is refused by the caller rather than redirected.
 * @param {string} value - the caller's path.
 * @param {string} outputDir - resolved output directory from the row config.
 * @returns {string|null} absolute path inside the output dir, or null when it escapes.
 */
function confineOutput(value, outputDir) {
  const root = path.resolve(outputDir);
  const target = path.resolve(root, String(value));
  const rel = path.relative(root, target);
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return target;
}

/**
 * Build the `browse` and `render_html` tool definitions.
 *
 * @param {object} config - resolved settings from {@link resolveConfig}.
 * @param {object} [deps] - test seams: `client`, `spawnImpl`, `clock`, and the
 *   live Cordis `ctx` (needed for the attachment service behind `render_view`).
 * @returns {Array<object>} tool definitions for `ctx.tools.register`.
 */
export function buildTools(config, deps = {}) {
  const ctx = deps.ctx;
  const client = deps.client ?? new CamofoxClient({ baseUrl: config.camofoxUrl, timeoutMs: config.requestTimeoutMs });
  const spawnImpl = deps.spawnImpl ?? spawn;
  const now = deps.clock ?? (() => Date.now());
  /** tabKey -> tabId, one live tab per conversation (or per explicit `tab`). */
  const tabs = new Map();

  async function ensureTab(exec, tabName) {
    const key = tabKeyFor(exec, tabName);
    const existing = tabs.get(key);
    if (existing) return existing;
    const sessionKey = key.replace(/^[a-z]+:/, '').slice(0, 64) || 'default';
    const created = await client.createTab(config.userId, sessionKey);
    const tabId = created.data?.tabId;
    if (!created.ok || typeof tabId !== 'string') {
      throw new Error(`could not open a browser tab (HTTP ${created.status}): ${JSON.stringify(created.data).slice(0, 200)}`);
    }
    tabs.set(key, tabId);
    return tabId;
  }

  /** Read title + text of the current page, for challenge detection. */
  async function observe(tabId) {
    try {
      const snap = await client.snapshot(config.userId, tabId);
      return snapshotText(snap.data);
    } catch {
      return '';
    }
  }

  const browse = {
    name: 'browse',
    description:
      'Drive a real, anti-detect browser (CamoFox) for pages `web_fetch` cannot read: JavaScript apps, session/logged-in pages, bot-protected sites, and file downloads behind buttons. ' +
      'Actions: open (navigate), snapshot (accessibility tree with eN refs), links (anchors; filter "assets" for PDFs/ZIPs/images), click (by ref), type (ref + text), press (key), screenshot (saves a PNG, returns its path), download (fetch a URL through the browser and save the file), close, status. ' +
      'If a page is a captcha or bot challenge, the tool returns "needs a human" and must not be retried in a loop. Prefer `web_fetch` first for plain reading.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        action: {
          type: 'string',
          enum: ['open', 'snapshot', 'links', 'click', 'type', 'press', 'screenshot', 'download', 'close', 'status'],
          description: 'What to do. `open` first; the other actions act on that tab.',
        },
        url: { type: 'string', description: 'Absolute URL for `open` and `download`.' },
        tab: { type: 'string', description: 'Optional tab name. Default: one tab per conversation.' },
        ref: { type: 'string', description: 'Element reference from the latest snapshot, e.g. e12.' },
        text: { type: 'string', description: 'Text to type for `type`.' },
        key: { type: 'string', description: 'Key name for `press`, e.g. Enter or Escape.' },
        fullPage: { type: 'boolean', description: 'Capture the whole page height for `screenshot`.' },
        filter: { type: 'string', enum: ['all', 'assets'], description: 'For `links`: all anchors, or only documents/archives/images.' },
        to: { type: 'string', description: 'Destination file path for `download`; must stay under the browse output directory. Default: the output directory.' },
      },
      required: ['action'],
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { message: { type: 'string' } }, required: ['message'] },
      render: (_args, value) => [{ type: 'text', text: value.message }],
    },
    async execute(args, exec) {
      const action = String(args.action ?? '').toLowerCase();
      try {
        if (action === 'status') {
          const health = await client.health();
          return { message: `CamoFox ${config.camofoxUrl}: ${JSON.stringify(health.data).slice(0, 300)}` };
        }
        if (action === 'open') {
          const url = String(args.url ?? '');
          if (!/^https?:\/\//i.test(url)) return { message: `open needs an absolute http(s) URL, got "${url}".` };
          const tabId = await ensureTab(exec, args.tab);
          const nav = await client.navigate(config.userId, tabId, url);
          if (!nav.ok) return { message: `navigate failed (HTTP ${nav.status}): ${JSON.stringify(nav.data).slice(0, 300)}` };
          const text = await observe(tabId);
          const challenge = detectChallenge({ url, text });
          if (challenge) {
            return {
              message:
                `Blocked by a bot challenge at ${url} (${challenge.reason}).\n` +
                'This needs a human: solve it in the page and the session keeps the cookies. Do not retry automatically — repeated attempts deepen the block.\n' +
                `Options: (1) ask the user to open ${url} in their own browser, then import the cookies; (2) switch the CamoFox session to a visible display and let them click; (3) use a tier-0 source (the asset URL you already have, a sitemap, or a cached copy).`,
            };
          }
          return { message: `Opened ${url}\n\n${text.slice(0, config.maxSnapshotChars)}` };
        }
        if (action === 'snapshot') {
          const tabId = await ensureTab(exec, args.tab);
          const snap = await client.snapshot(config.userId, tabId);
          const text = snapshotText(snap.data);
          const challenge = detectChallenge({ text });
          if (challenge) return { message: `Page is a bot challenge (${challenge.reason}); needs a human.` };
          return { message: text.slice(0, config.maxSnapshotChars) };
        }
        if (action === 'links') {
          const tabId = await ensureTab(exec, args.tab);
          const result = await client.links(config.userId, tabId);
          const all = linkList(result.data);
          const wanted = args.filter === 'assets' ? filterAssets(all) : all;
          const lines = wanted.slice(0, 60).map((link) => `- ${link.url}${link.text ? `  — ${String(link.text).slice(0, 80)}` : ''}`);
          return { message: `${wanted.length} of ${all.length} links${args.filter === 'assets' ? ' (assets)' : ''}:\n${lines.join('\n') || '(none)'}` };
        }
        if (action === 'click') {
          const tabId = await ensureTab(exec, args.tab);
          const result = await client.click(config.userId, tabId, String(args.ref ?? ''));
          return { message: result.ok ? `Clicked ${args.ref}.` : `click failed (HTTP ${result.status}): ${JSON.stringify(result.data).slice(0, 200)}` };
        }
        if (action === 'type') {
          const tabId = await ensureTab(exec, args.tab);
          const result = await client.type(config.userId, tabId, String(args.ref ?? ''), String(args.text ?? ''));
          return { message: result.ok ? `Typed into ${args.ref}.` : `type failed (HTTP ${result.status}): ${JSON.stringify(result.data).slice(0, 200)}` };
        }
        if (action === 'press') {
          const tabId = await ensureTab(exec, args.tab);
          const result = await client.press(config.userId, tabId, String(args.key ?? 'Enter'));
          return { message: result.ok ? `Pressed ${args.key ?? 'Enter'}.` : `press failed (HTTP ${result.status}): ${JSON.stringify(result.data).slice(0, 200)}` };
        }
        if (action === 'screenshot') {
          const tabId = await ensureTab(exec, args.tab);
          const bytes = await client.screenshot(config.userId, tabId, Boolean(args.fullPage));
          await mkdir(config.outputDir, { recursive: true });
          const file = path.join(config.outputDir, `screenshot-${now()}.png`);
          await writeFile(file, bytes);
          return { message: `Saved ${file} (${humanBytes(bytes.length)}). View it with read_image.` };
        }
        if (action === 'download') {
          const url = String(args.url ?? '');
          if (!/^https?:\/\//i.test(url)) return { message: `download needs an absolute http(s) URL, got "${url}".` };
          let target = '';
          if (args.to) {
            target = confineOutput(String(args.to), config.outputDir) ?? '';
            if (target === '') return { message: `download "to" must stay under ${path.resolve(config.outputDir)}.` };
          }
          const tabId = await ensureTab(exec, args.tab);
          const before = new Set(linkList(await client.downloads(config.userId).then((r) => r.data).catch(() => ({ links: [] }))).map((d) => d.id));
          await client.navigate(config.userId, tabId, url);
          const deadline = now() + 20000;
          while (now() < deadline) {
            const listed = await client.downloads(config.userId).catch(() => ({ data: null }));
            const entries = linkList(listed.data);
            const fresh = entries.find((entry) => entry?.id && !before.has(entry.id));
            if (fresh) {
              const bytes = await client.downloadContent(config.userId, fresh.id);
              const fallbackName = String(fresh.name ?? url.split('/').pop() ?? 'download').replace(/[^\w.-]+/g, '_');
              const finalTarget = target || path.join(config.outputDir, fallbackName);
              await mkdir(path.dirname(finalTarget), { recursive: true });
              await writeFile(finalTarget, bytes);
              return { message: `Saved ${finalTarget} (${humanBytes(bytes.length)}).` };
            }
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          return { message: `No download appeared for ${url} within 20s. The file may need an in-page click (use links + click), or the URL may require the session cookie.` };
        }
        if (action === 'close') {
          const key = tabKeyFor(exec, args.tab);
          const tabId = tabs.get(key);
          if (!tabId) return { message: 'No tab to close.' };
          await client.closeTab(config.userId, tabId).catch(() => undefined);
          tabs.delete(key);
          return { message: 'Tab closed.' };
        }
        return { message: `Unknown action "${action}". Use open, snapshot, links, click, type, press, screenshot, download, close, or status.` };
      } catch (error) {
        return { message: `browse ${action} failed: ${error?.message ?? String(error)}` };
      }
    },
  };

  const renderHtml = {
    name: 'render_html',
    description:
      'Render a local HTML file to a print PDF or a PNG with chromium\'s headless shell (no DevTools port, no browser service). Use this for artwork *we* produce — posters, letterheads, slides — where exact millimetre sizes and embedded fonts matter. To look at a PNG you are iterating on, use `render_view` instead: it renders, returns the image, and checks the layout in one call. Not for reading other sites: that is `web_fetch` or `browse`.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        html: { type: 'string', description: 'Path to the HTML file (relative paths resolve against the process cwd).' },
        pdf: { type: 'string', description: 'Output PDF path; must stay under the browse output directory. Default: the HTML basename with a .pdf extension, in the output directory.' },
        png: { type: 'string', description: 'Output PNG path; must stay under the browse output directory. When given, a screenshot is taken instead of a PDF.' },
        width: { type: 'number', description: 'PNG viewport width in CSS px (ignored for PDF). Default 1280.' },
        height: { type: 'number', description: 'PNG viewport height in CSS px (ignored for PDF). Default 900.' },
        scale: { type: 'number', description: 'Device scale factor for PNG output. Default 2.' },
      },
      required: ['html'],
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { message: { type: 'string' } }, required: ['message'] },
      render: (_args, value) => [{ type: 'text', text: value.message }],
    },
    async execute(args) {
      const html = path.resolve(String(args.html ?? ''));
      if (!existsSync(html)) return { message: `No such HTML file: ${html}` };
      let output = path.join(config.outputDir, `${path.basename(html).replace(/\.html?$/i, '')}.pdf`);
      let refused = '';
      if (args.png) {
        output = confineOutput(String(args.png), config.outputDir);
        refused = 'png';
      } else if (args.pdf) {
        output = confineOutput(String(args.pdf), config.outputDir);
        refused = 'pdf';
      }
      if (!output) return { message: `render_html "${refused}" must stay under ${path.resolve(config.outputDir)}.` };
      if (config.chromeBinary === '') return { message: 'No chromium headless shell found under ~/.cache/ms-playwright; set DSH_BROWSE_CHROME to a binary.' };
      await mkdir(path.dirname(output), { recursive: true });
      const argv = buildChromeArgs({
        chrome: config.chromeBinary,
        html,
        output,
        mode: args.png ? 'png' : 'pdf',
        width: Number(args.width ?? 1280),
        height: Number(args.height ?? 900),
        scale: Number(args.scale ?? 2),
      });
      const result = await runProcess(spawnImpl, argv, config.renderTimeoutMs);
      if (result.timedOut) return { message: `Render timed out after ${config.renderTimeoutMs}ms: ${argv[0]}` };
      if (!existsSync(output)) {
        return { message: `Render produced no file (exit ${result.code}).\n${result.stderr.slice(-800)}` };
      }
      const info = await stat(output);
      return { message: `Wrote ${output} (${humanBytes(info.size)}).` };
    },
  };

  /**
   * `render_view` is the design-loop tool: one call renders, measures the layout
   * and hands the image back to the model. The old pairing (render_html, then
   * read_image) cost two model turns per look and stored two records of one
   * fact; this costs one.
   */
  const renderView = {
    name: 'render_view',
    description:
      'Render our own HTML, SEE the result, and check its layout in one step: writes a PNG, returns the image itself, and runs a deterministic probe for text past the canvas edge, clipped or overflowing containers, type under 15px, and painted-text collisions between blocks. ' +
      'Use this for every design iteration (posters, slides, social posts). Use `render_html` only for a PDF or a PNG nobody needs to inspect. When the probe lists a problem, fix it in the HTML and call again.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        html: { type: 'string', description: 'Path to the HTML file (relative paths resolve against the process cwd).' },
        png: { type: 'string', description: 'Output PNG path; must stay under the browse output directory. Default: the HTML basename with a .png extension, in the output directory.' },
        width: { type: 'number', description: 'Viewport width in CSS px. Default: the document body width from the layout probe, else 1280.' },
        height: { type: 'number', description: 'Viewport height in CSS px. Default: the document body height from the layout probe, else 900.' },
        scale: { type: 'number', description: 'Device scale factor. Default 2.' },
        check: { type: 'boolean', description: 'Run the layout probe. Default true; set false for a final export where only the image matters.' },
      },
      required: ['html'],
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          message: { type: 'string' },
          issues: { type: 'array', items: { type: 'string' } },
          image: {
            type: 'object',
            additionalProperties: false,
            properties: {
              attachmentId: { type: 'string' },
              mediaType: { type: 'string' },
              bytes: { type: 'integer' },
              width: { type: 'integer' },
              height: { type: 'integer' },
              name: { type: 'string' },
            },
          },
        },
        required: ['message'],
      },
      render: (_args, value) => {
        const blocks = [{ type: 'text', text: value.message }];
        if (value.image) blocks.push({ type: 'image', attachment: value.image });
        return blocks;
      },
    },
    async execute(args, exec) {
      const html = path.resolve(String(args.html ?? ''));
      if (!existsSync(html)) return { message: `No such HTML file: ${html}` };
      const png = args.png
        ? confineOutput(String(args.png), config.outputDir)
        : path.join(config.outputDir, `${path.basename(html).replace(/\.html?$/i, '')}.png`);
      if (!png) return { message: `render_view "png" must stay under ${path.resolve(config.outputDir)}.` };
      if (config.chromeBinary === '') {
        return { message: 'No chromium headless shell found under ~/.cache/ms-playwright; set DSH_BROWSE_CHROME to a binary.' };
      }

      // Pass 1: measure the document. The probe copy lives beside the original so
      // relative font and image paths resolve exactly as they do for the real render.
      let probe = null;
      let probeError = '';
      if (args.check !== false) {
        const probeName = `.dsh-layout-${process.pid}-${now()}.html`;
        const probeDir = path.dirname(html);
        const source = await readFile(html, 'utf8');
        let probeFile = path.join(probeDir, probeName);
        let probeReady = true;
        try {
          await writeFile(probeFile, injectLayoutProbe(source), { mode: 0o600 });
        } catch {
          try {
            probeFile = path.join(os.tmpdir(), probeName);
            await writeFile(probeFile, injectBaseHref(injectLayoutProbe(source), probeDir), { mode: 0o600 });
          } catch (error) {
            probeReady = false;
            probeError = `layout probe could not be written: ${error?.message ?? String(error)}`;
          }
        }
        if (probeReady) try {
          const run = await runProcess(
            spawnImpl,
            buildProbeArgs({
              chrome: config.chromeBinary,
              html: probeFile,
              width: Number(args.width ?? 1200),
              height: Number(args.height ?? 1200),
            }),
            config.renderTimeoutMs,
            { captureStdout: true },
          );
          if (run.timedOut) probeError = `layout probe timed out after ${config.renderTimeoutMs}ms`;
          else probe = parseLayoutProbe(run.stdout);
          if (!probe && probeError === '') probeError = `layout probe returned no report (exit ${run.code})`;
        } catch (error) {
          probeError = `layout probe failed: ${error?.message ?? String(error)}`;
        } finally {
          await unlink(probeFile).catch(() => undefined);
        }
      }

      // Pass 2: the render. Body size from the probe beats a default that crops.
      const width = Math.round(Number(args.width) || Number(probe?.w) || 1280);
      const height = Math.round(Number(args.height) || Number(probe?.h) || 900);
      const scale = Number(args.scale ?? 2) || 2;
      await mkdir(path.dirname(png), { recursive: true });
      const result = await runProcess(
        spawnImpl,
        buildChromeArgs({ chrome: config.chromeBinary, html, output: png, mode: 'png', width, height, scale }),
        config.renderTimeoutMs,
      );
      if (result.timedOut) return { message: `Render timed out after ${config.renderTimeoutMs}ms: ${config.chromeBinary}` };
      if (!existsSync(png)) {
        return { message: `Render produced no file (exit ${result.code}).\n${result.stderr.slice(-800)}` };
      }
      const info = await stat(png);

      // Attach the image so the model sees it in this same turn. Best effort: a
      // missing attachment service or a text-only route still leaves a usable path.
      let image;
      const attachments = ctx?.get?.('attachments');
      if (attachments) {
        try {
          const llm = ctx.get?.('llm');
          const routed = exec?.agent?.session?.requestHeader?.()?.config;
          const provider = routed?.provider ?? exec?.agent?.options?.provider;
          const model = routed?.model ?? exec?.agent?.options?.model;
          let capable = true;
          if (llm && provider && model) {
            const modelInfo = await llm.resolveModelInfo(provider, model, exec?.signal).catch(() => undefined);
            capable = Array.isArray(modelInfo?.inputModalities) && modelInfo.inputModalities.includes('image');
          }
          if (capable) {
            const data = await readFile(png);
            const ref = await attachments.saveImage({ data, mediaType: 'image/png', name: path.basename(png) });
            image = {
              attachmentId: String(ref.attachmentId),
              mediaType: ref.mediaType,
              bytes: ref.bytes,
              width: ref.width,
              height: ref.height,
              name: ref.name ?? path.basename(png),
            };
          }
        } catch {
          image = undefined;
        }
      }

      const lines = [`Rendered ${png} (${width}×${height} at ${scale}x, ${humanBytes(info.size)}).`];
      if (args.check !== false) {
        if (probe) {
          const found = formatLayoutIssues(probe.issues);
          lines.push(
            found.length > 0
              ? `Layout check found ${probe.issues.length} issue(s):\n${found.map((line) => `- ${line}`).join('\n')}`
              : 'Layout check: no objective layout problems.',
          );
          if (probe.skipped > 0) lines.push(`(${probe.skipped} rotated text block(s) were skipped by the collision check.)`);
        } else {
          lines.push(`Layout check unavailable: ${probeError}. Judge the image by eye.`);
        }
      }
      if (!image) lines.push('Image not attached (no attachment service or a text-only model route); inspect the PNG path instead.');
      return { message: lines.join('\n'), issues: probe ? formatLayoutIssues(probe.issues, 24) : [], ...(image ? { image } : {}) };
    },
  };

  return [browse, renderHtml, renderView];
}


/**
 * Build the chromium argv for one render. Pure, so the self-test can pin the
 * flags that matter without launching a browser.
 *
 * @param {{chrome: string, html: string, output: string, mode: 'pdf'|'png', width: number, height: number, scale: number}} options - render target.
 * @returns {string[]} argv, binary first.
 */
export function buildChromeArgs({ chrome, html, output, mode, width, height, scale }) {
  const common = [
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-crash-reporter',
    '--no-first-run',
    '--disable-extensions',
    '--hide-scrollbars',
    '--virtual-time-budget=5000',
    '--run-all-compositor-stages-before-draw',
  ];
  if (mode === 'pdf') {
    return [chrome, ...common, '--no-pdf-header-footer', `--print-to-pdf=${output}`, `file://${html}`];
  }
  return [
    chrome,
    ...common,
    `--screenshot=${output}`,
    `--window-size=${Math.round(width)},${Math.round(height)}`,
    `--force-device-scale-factor=${scale}`,
    `--default-background-color=FFFFFFFF`,
    `file://${html}`,
  ];
}

/**
 * The layout probe injected into a copy of the document before `--dump-dom`.
 *
 * It exists because the expensive part of a design iteration is not rendering —
 * it is the model *guessing* from a screenshot where the collision is and
 * fixing the wrong box. The probe answers the objective questions in numbers:
 * painted text past the canvas edge, a scroll container hiding content, type
 * below a legible floor, and painted-text collisions between separate blocks.
 * Judgement stays with the model; only measurements are asserted here.
 *
 * Deliberate limits keep it quiet rather than clever:
 *  - text bounds come from a Range, not the element box, because a right-aligned
 *    block is 1080px wide while its glyphs are not;
 *  - a subtree with a transform is skipped (its axis-aligned box lies about
 *    rotated type — the "type collision" direction is intentional overlap);
 *  - a collision must cover one sixth of the smaller painted line box (a
 *    graze is not reported; a 21% box overlap reads as text on text).
 */
export const LAYOUT_PROBE_SOURCE = `(async () => {
  try { await document.fonts.ready; } catch (e) {}
  const body = document.body;
  const br = body.getBoundingClientRect();
  const out = { w: Math.round(br.width), h: Math.round(br.height), issues: [], skipped: 0 };
  const transformed = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.transform !== 'none' || cs.rotate !== 'none') return true;
    }
    return false;
  };
  const leaves = [];
  for (const el of body.querySelectorAll('*')) {
    if (el.childElementCount > 0) continue;
    const text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
    if (!text) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
    if (rects.length === 0) continue;
    leaves.push({ el, text: text.slice(0, 44), rects, size: parseFloat(cs.fontSize) || 0, rot: transformed(el) });
  }
  for (const leaf of leaves) {
    let dx = 0, dy = 0;
    for (const r of leaf.rects) {
      dx = Math.max(dx, br.left - r.left, r.right - br.right);
      dy = Math.max(dy, br.top - r.top, r.bottom - br.bottom);
    }
    if (dx > 2 || dy > 2) out.issues.push({ k: 'out', t: leaf.text, dx: Math.round(dx), dy: Math.round(dy) });
  }
  const rotated = leaves.filter((l) => l.rot).map((l) => l.el);
  for (const el of body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.overflow === 'visible' || cs.transform !== 'none') continue;
    // Overflow caused by deliberate rotated bleed is a design choice, not a defect.
    if (rotated.some((node) => el.contains(node))) continue;
    const dx = el.scrollWidth - el.clientWidth;
    const dy = el.scrollHeight - el.clientHeight;
    if (dx > 2 || dy > 2) out.issues.push({ k: 'clip', t: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 32), dx, dy });
  }
  for (const leaf of leaves) {
    if (leaf.size > 0 && leaf.size < 15) out.issues.push({ k: 'tiny', t: leaf.text, px: +leaf.size.toFixed(1) });
  }
  const paint = leaves.filter((l) => !l.rot);
  out.skipped = leaves.length - paint.length;
  for (let a = 0; a < paint.length; a++) {
    for (let b = a + 1; b < paint.length; b++) {
      const A = paint[a], B = paint[b];
      if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
      let hit = 0, small = Infinity;
      for (const ra of A.rects) {
        small = Math.min(small, ra.width * ra.height);
        for (const rb of B.rects) {
          const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (x > 0 && y > 0) hit += x * y;
        }
      }
      for (const rb of B.rects) small = Math.min(small, rb.width * rb.height);
      const pct = small > 0 && Number.isFinite(small) ? Math.round((hit / small) * 100) : 0;
      if (pct >= 15) out.issues.push({ k: 'overlap', a: A.text, b: B.text, pct });
    }
  }
  out.issues = out.issues.slice(0, 24);
  const pre = document.createElement('pre');
  pre.id = '__dsh_layout';
  pre.textContent = 'AUDIT:' + JSON.stringify(out);
  document.documentElement.appendChild(pre);
})();`;

/**
 * Make a copy's relative URLs resolve against the original directory. Needed
 * only when the probe cannot be written beside the HTML (a read-only artwork
 * directory), because then the copy lives in a temp directory instead.
 */
export function injectBaseHref(html, directory) {
  const href = pathToFileURL(directory.endsWith(path.sep) ? directory : `${directory}${path.sep}`).href;
  const tag = `<base href="${href}">`;
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (head) => `${head}${tag}`) : `${tag}${html}`;
}

/** Wrap a document so the probe runs after the page's own scripts. */
export function injectLayoutProbe(html) {
  const tag = `<script>${LAYOUT_PROBE_SOURCE}<\/script>`;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${tag}</body>`) : `${html}${tag}`;
}

/**
 * Read the probe result out of a `--dump-dom` dump.
 *
 * @param {string} stdout - serialized DOM.
 * @returns {{w: number, h: number, issues: Array<object>, skipped: number} | null} the report, or null when absent.
 */
export function parseLayoutProbe(stdout) {
  const match = /__dsh_layout[^>]*>(AUDIT:[\s\S]*?)<\/pre>/i.exec(String(stdout ?? ''));
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].slice('AUDIT:'.length));
    if (!parsed || !Array.isArray(parsed.issues)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * chromium argv for the layout pass.
 *
 * @param {{chrome: string, html: string, width: number, height: number}} options - probe target.
 * @returns {string[]} argv, binary first.
 */
export function buildProbeArgs({ chrome, html, width, height }) {
  return [
    chrome,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-crash-reporter',
    '--no-first-run',
    '--disable-extensions',
    '--hide-scrollbars',
    '--virtual-time-budget=5000',
    `--window-size=${Math.round(width)},${Math.round(height)}`,
    '--dump-dom',
    `file://${html}`,
  ];
}

/**
 * One compact line per probe finding, ordered by how likely it is to be a real
 * defect. The model reads these before it looks at the image.
 *
 * @param {Array<object>} issues - probe issues.
 * @param {number} [limit] - maximum lines to render.
 * @returns {string[]} formatted lines.
 */
export function formatLayoutIssues(issues, limit = 12) {
  return (Array.isArray(issues) ? issues : []).slice(0, limit).map((issue) => {
    if (issue.k === 'out') return `text past the canvas edge: "${issue.t}" (${issue.dx}px x, ${issue.dy}px y)`;
    if (issue.k === 'clip') return `clipped by its container: "${issue.t}" (${issue.dx}px x, ${issue.dy}px y hidden)`;
    if (issue.k === 'tiny') return `type below 15px: "${issue.t}" (${issue.px}px)`;
    if (issue.k === 'overlap') return `text collision: "${issue.a}" ↔ "${issue.b}" (${issue.pct}% of the smaller box)`;
    return `layout issue: ${JSON.stringify(issue).slice(0, 120)}`;
  });
}

/**
 * Run one child process with a hard timeout. Resolves rather than throws: a
 * render either produced its file or it did not, and both outcomes are answers.
 *
 * @param {Function} spawnImpl - `child_process.spawn`.
 * @param {string[]} argv - binary and arguments.
 * @param {number} timeoutMs - kill deadline.
 * @param {{captureStdout?: boolean}} [options] - capture stdout for a `--dump-dom` probe.
 * @returns {Promise<{code: number|null, timedOut: boolean, stderr: string, stdout: string}>} the outcome.
 */
export function runProcess(spawnImpl, argv, timeoutMs, options = {}) {
  return new Promise((resolve) => {
    let stderr = '';
    let stdout = '';
    let settled = false;
    const child = spawnImpl(argv[0], argv.slice(1), {
      stdio: ['ignore', options.captureStdout ? 'pipe' : 'ignore', 'pipe'],
    });
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, ...value });
    };
    const timer = setTimeout(() => {
      // The deadline is authoritative: settle first, then kill, so a child that
      // reports `close` synchronously from the signal cannot rewrite the answer.
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        child.kill('SIGKILL');
      } catch {
        /* the child is already gone */
      }
      resolve({ code: null, timedOut: true, stderr });
    }, timeoutMs);
    child.stderr?.on('data', (chunk) => {
      if (stderr.length < 8000) stderr += String(chunk);
    });
    child.stdout?.on('data', (chunk) => {
      if (stdout.length < 8_000_000) stdout += String(chunk);
    });
    child.on('error', (error) => finish({ code: null, timedOut: false, stderr: `${stderr}${error.message}` }));
    child.on('close', (code) => finish({ code, timedOut: false, stderr }));
  });
}

/**
 * Register the tools. One log line states the wiring, because "which browser is
 * this session using" is the first question after any confusing result.
 *
 * @param {object} ctx - Cordis context with `tools`.
 * @param {object} [config] - the row's config.
 */
export function apply(ctx, config) {
  const resolved = resolveConfig(config ?? {});
  for (const tool of buildTools(resolved, { ctx })) ctx.tools.register(tool);
  console.error(
    `[dsh-browse] camofox=${resolved.camofoxUrl} user=${resolved.userId} out=${resolved.outputDir} chrome=${resolved.chromeBinary === '' ? 'missing' : path.basename(resolved.chromeBinary)}`,
  );
}
