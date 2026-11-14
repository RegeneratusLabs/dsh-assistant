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
import os from 'node:os';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';

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
 * Build the `browse` and `render_html` tool definitions.
 *
 * @param {object} config - resolved settings from {@link resolveConfig}.
 * @param {object} [deps] - test seams: `client`, `spawnImpl`, `clock`.
 * @returns {Array<object>} tool definitions for `ctx.tools.register`.
 */
export function buildTools(config, deps = {}) {
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
        to: { type: 'string', description: 'Destination file path for `download`. Default: under the browse output directory.' },
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
              const target = path.resolve(String(args.to ?? path.join(config.outputDir, fallbackName)));
              await mkdir(path.dirname(target), { recursive: true });
              await writeFile(target, bytes);
              return { message: `Saved ${target} (${humanBytes(bytes.length)}).` };
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
      'Render a local HTML file to a print PDF or a PNG with chromium\'s headless shell (no DevTools port, no browser service). Use this for artwork *we* produce — posters, letterheads, slides — where exact millimetre sizes and embedded fonts matter. Not for reading other sites: that is `web_fetch` or `browse`.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        html: { type: 'string', description: 'Path to the HTML file (relative paths resolve against the process cwd).' },
        pdf: { type: 'string', description: 'Output PDF path. Default: the HTML path with a .pdf extension.' },
        png: { type: 'string', description: 'Output PNG path. When given, a screenshot is taken instead of a PDF.' },
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
      if (config.chromeBinary === '') return { message: 'No chromium headless shell found under ~/.cache/ms-playwright; set DSH_BROWSE_CHROME to a binary.' };
      const png = args.png ? path.resolve(String(args.png)) : '';
      const output = png || path.resolve(String(args.pdf ?? html.replace(/\.html?$/i, '') + '.pdf'));
      await mkdir(path.dirname(output), { recursive: true });
      const argv = buildChromeArgs({
        chrome: config.chromeBinary,
        html,
        output,
        mode: png ? 'png' : 'pdf',
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

  return [browse, renderHtml];
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
 * Run one child process with a hard timeout. Resolves rather than throws: a
 * render either produced its file or it did not, and both outcomes are answers.
 *
 * @param {Function} spawnImpl - `child_process.spawn`.
 * @param {string[]} argv - binary and arguments.
 * @param {number} timeoutMs - kill deadline.
 * @returns {Promise<{code: number|null, timedOut: boolean, stderr: string}>} the outcome.
 */
export function runProcess(spawnImpl, argv, timeoutMs) {
  return new Promise((resolve) => {
    let stderr = '';
    let settled = false;
    const child = spawnImpl(argv[0], argv.slice(1), { stdio: ['ignore', 'ignore', 'pipe'] });
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
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
  for (const tool of buildTools(resolved)) ctx.tools.register(tool);
  console.error(
    `[dsh-browse] camofox=${resolved.camofoxUrl} user=${resolved.userId} out=${resolved.outputDir} chrome=${resolved.chromeBinary === '' ? 'missing' : path.basename(resolved.chromeBinary)}`,
  );
}
