/**
 * Serving a delivered work: preview bytes from the page's own origin, and a PNG
 * or PDF rendered by Chromium's headless shell.
 *
 * Two rules shape this file:
 *
 *  - **The library is the allowlist.** A request names a work id; the artifact
 *    path comes from that row, never from the request. A row that does not point
 *    at a regular `.html` file is refused with a sentence, so neither route can
 *    be turned into a file reader.
 *  - **Every failure is a sentence.** The page shows what the answer said; a
 *    stack, a raw errno or an empty body would leave the user without a next
 *    step. `StudioError` carries the status and code; the route's guard turns it
 *    into JSON.
 *
 * The browser detection is a deliberate copy of `plugins/browse/index.js`
 * `findChromeBinary` rather than an import: plugins are independent units here,
 * and this page must keep working when the browse plugin is disabled, moved or
 * absent. The copy is small and pinned by the selftest.
 */
import { spawn } from 'node:child_process';
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { StudioError } from './store.js';

/** The two things the page can export; anything else is refused by name. */
export const EXPORT_FORMATS = new Set(['png', 'pdf']);

/** A screenshot of a local file is seconds of work; a minute means something is wrong. */
export const RENDER_TIMEOUT_MS = 60_000;

/** A preview larger than this is not a page the overlay can usefully show. */
export const MAX_PREVIEW_BYTES = 8 * 1024 * 1024;

/** A rendered download larger than this is refused rather than held in memory. */
export const MAX_EXPORT_BYTES = 32 * 1024 * 1024;

/**
 * Flags every export shares, matching the browse plugin's render discipline:
 * no sandbox-dependent GPU, no crash reporter, and a fixed virtual clock so a
 * page whose animation has not started still renders its first frame.
 */
const COMMON_FLAGS = [
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-crash-reporter',
  '--no-first-run',
  '--disable-extensions',
  '--virtual-time-budget=5000',
  '--run-all-compositor-stages-before-draw',
];

/**
 * Pick the newest chrome-headless-shell (preferred) or full chromium under the
 * Playwright browser cache. The headless shell prints without a DevTools port,
 * which is why it is first choice.
 *
 * @param {string} [home] - the home directory holding `.cache/ms-playwright`.
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
 * The configured binary, or auto-detection. Empty config means "find it".
 * @param {{ chromeBinary?: unknown }} [config] - the row's config.
 * @param {string} [home] - passed through for detection.
 * @returns {string} a binary path, or '' when nothing is available.
 */
export function resolveChrome(config = {}, home = os.homedir()) {
  const configured = typeof config?.chromeBinary === 'string' ? config.chromeBinary.trim() : '';
  return configured || findChromeBinary(home);
}

/**
 * The exact Chromium invocation for one export. Pure, so the selftest can pin
 * the flags without spawning a browser.
 *
 * @param {{chrome: string, file: string, output: string, format: string}} input - binary, artifact, destination, format.
 * @returns {string[]} argv.
 */
export function buildExportArgs({ chrome, file, output, format }) {
  if (!EXPORT_FORMATS.has(format)) {
    throw new StudioError(`"${String(format)}" is not an export format; use png or pdf`, 'invalid_format');
  }
  if (!chrome) {
    throw new StudioError('No browser found to render this work; install the Chromium headless shell or set chromeBinary in the studio row', 'no_browser', 503);
  }
  // A file: URL rather than a path: spaces and non-ASCII names in a delivered
  // path must survive the hand-off to the browser unchanged.
  const url = pathToFileURL(file).href;
  if (format === 'pdf') {
    return [chrome, ...COMMON_FLAGS, '--no-pdf-header-footer', `--print-to-pdf=${output}`, url];
  }
  return [
    chrome,
    ...COMMON_FLAGS,
    '--hide-scrollbars',
    '--window-size=1920,1080',
    '--force-device-scale-factor=1',
    `--screenshot=${output}`,
    url,
  ];
}

/**
 * One work's artifact as a regular HTML file.
 *
 * `lstat` rather than `stat` is deliberate: a symlink planted at the registered
 * path is not the file the user delivered, and following it would let an
 * exported row become a way to read anything on the machine.
 *
 * @param {object} work - a validated row from the store.
 * @returns {{file: string, size: number}} the artifact.
 */
export function artifactFile(work) {
  const id = typeof work?.id === 'string' ? work.id : 'this work';
  const file = typeof work?.path === 'string' ? work.path : '';
  if (!file.toLowerCase().endsWith('.html')) {
    throw new StudioError(`${id} is not an HTML page, so it cannot be previewed or exported here`, 'not_html', 415);
  }
  let info;
  try {
    info = lstatSync(file);
  } catch {
    throw new StudioError(`The file for ${id} is not there any more: ${file}`, 'missing_file', 404);
  }
  if (!info.isFile()) {
    throw new StudioError(`The file for ${id} is not a regular file: ${file}`, 'not_a_file', 415);
  }
  return { file, size: info.size };
}

/**
 * `GET /api/studio/preview?id=<workId>` — the work's HTML, served under a
 * policy that cannot reach the Host page that frames it.
 * @param {object} store - the open library.
 * @param {Request} request - the incoming request.
 * @returns {Response} the artifact bytes.
 */
export function previewResponse(store, request) {
  const id = new URL(request.url, 'http://localhost').searchParams.get('id');
  const work = store.findWork(id);
  const { file, size } = artifactFile(work);
  if (size > MAX_PREVIEW_BYTES) {
    throw new StudioError(
      `${work.id} is ${Math.ceil(size / (1024 * 1024))} MB; previews stop at ${MAX_PREVIEW_BYTES / (1024 * 1024)} MB. Export it instead.`,
      'too_large',
      413,
    );
  }
  let bytes;
  try {
    bytes = readFileSync(file);
  } catch {
    throw new StudioError(`The file for ${work.id} could not be read: ${file}`, 'unreadable_file', 500);
  }
  return new Response(bytes, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // The preview is an untrusted document inside the app's origin; the
      // sandbox directive gives it an opaque origin and scripts, nothing else.
      'content-security-policy': 'sandbox allow-scripts',
      'x-content-type-options': 'nosniff',
      'cache-control': 'no-store',
    },
  });
}

/**
 * A download name that is safe in a header and readable on disk: the title,
 * reduced to ASCII letters, digits, spaces and the three harmless punctuation
 * marks, with the format as the extension.
 * @param {object} work - the row the download came from.
 * @param {string} format - `png` or `pdf`.
 * @returns {string} the file name.
 */
export function exportFilename(work, format) {
  const title = typeof work?.title === 'string' ? work.title : '';
  const safe = title
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9 ._-]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[.\-\s]+|[.\-\s]+$/g, '')
    .slice(0, 80)
    .trim();
  return `${safe || 'studio-work'}.${format}`;
}

/**
 * Run one child process with a hard deadline. Resolves rather than throws: a
 * render either produced its file or it did not, and both are answers.
 *
 * stderr is drained into a bounded buffer. A pipe nobody reads fills up and
 * blocks the child, which turns a chatty failure into a wait for the deadline;
 * the tail is kept for diagnostics and never shown as the user's answer.
 *
 * @param {string[]} argv - binary and arguments.
 * @param {number} timeoutMs - kill deadline.
 * @returns {Promise<{code: number|null, timedOut: boolean, stderr: string}>} the outcome.
 */
function runProcess(argv, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    let stderr = '';
    const child = spawn(argv[0], argv.slice(1), { stdio: ['ignore', 'ignore', 'pipe'] });
    child.stderr?.on('data', (chunk) => {
      if (stderr.length < 8000) stderr += String(chunk);
    });
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stderr, ...value });
    };
    const timer = setTimeout(() => {
      // Settle first, then kill: a child that reports `close` from the signal
      // must not get to rewrite the answer.
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
    child.on('error', () => finish({ code: null, timedOut: false }));
    child.on('close', (code) => finish({ code, timedOut: false }));
  });
}

/**
 * `GET /api/studio/export?id=<workId>&format=png|pdf` — render the work and
 * hand it back as a download.
 *
 * The output is written beside the library in `exports/`, with private modes,
 * and removed in `finally`: an export is a delivery, not a new file to manage.
 * @param {object} store - the open library.
 * @param {Request} request - the incoming request.
 * @param {string} chromeBinary - the resolved browser, or '' when none was found.
 * @returns {Promise<Response>} the rendered file.
 */
export async function exportResponse(store, request, chromeBinary) {
  const params = new URL(request.url, 'http://localhost').searchParams;
  const format = String(params.get('format') ?? '').toLowerCase();
  if (!EXPORT_FORMATS.has(format)) {
    throw new StudioError(`"${format || 'no format'}" is not an export format; use png or pdf`, 'invalid_format');
  }
  const work = store.findWork(params.get('id'));
  const { file } = artifactFile(work);
  // `lstat` so a configured path that names a directory is "no browser found"
  // rather than a failed spawn with a confusing exit code.
  let chromeInfo = null;
  if (chromeBinary) {
    try {
      chromeInfo = lstatSync(chromeBinary);
    } catch {
      chromeInfo = null;
    }
  }
  if (!chromeInfo?.isFile()) {
    throw new StudioError(
      'No browser found to render this work; install the Chromium headless shell or set chromeBinary in the studio row',
      'no_browser',
      503,
    );
  }

  const dir = path.join(store.dir, 'exports');
  try {
    ensurePrivateDir(dir);
  } catch (error) {
    throw new StudioError(`The export folder could not be created: ${String(error?.message ?? error)}`, 'export_unavailable', 500);
  }
  const output = path.join(dir, `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${format}`);
  try {
    const result = await runProcess(buildExportArgs({ chrome: chromeBinary, file, output, format }), RENDER_TIMEOUT_MS);
    if (result.timedOut) {
      throw new StudioError(`Rendering ${work.id} timed out after ${RENDER_TIMEOUT_MS / 1000} seconds`, 'render_timeout', 504);
    }
    if (!existsSync(output)) {
      throw new StudioError(`The browser did not produce a file (exit ${String(result.code)}); try again or export to PDF`, 'render_failed', 502);
    }
    try {
      chmodSync(output, 0o600);
    } catch {
      // Chrome created the file itself; the mode below the open mode is best effort.
    }
    // The render is the browser's output, not a trusted size; refuse to read an
    // unbounded file into memory and say so in one sentence.
    let size = 0;
    try {
      size = statSync(output).size;
    } catch {
      throw new StudioError(`The rendered ${format.toUpperCase()} could not be read`, 'render_unreadable', 500);
    }
    if (size > MAX_EXPORT_BYTES) {
      throw new StudioError(
        `The rendered ${format.toUpperCase()} is larger than ${MAX_EXPORT_BYTES / (1024 * 1024)} MB; export a smaller page`,
        'export_too_large',
        500,
      );
    }
    let bytes;
    try {
      bytes = readFileSync(output);
    } catch {
      throw new StudioError(`The rendered ${format.toUpperCase()} could not be read`, 'render_unreadable', 500);
    }
    return new Response(bytes, {
      status: 200,
      headers: {
        'content-type': format === 'pdf' ? 'application/pdf' : 'image/png',
        'content-disposition': `attachment; filename="${exportFilename(work, format)}"`,
        'content-length': String(bytes.length),
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } finally {
    // The file is already in memory (or the render failed), so removing it here
    // cannot truncate the download; a leftover temp file would only accumulate.
    try {
      unlinkSync(output);
    } catch {
      /* the render may have failed before writing anything */
    }
  }
}

/** Create `exports/` private, tolerating a foreign mount that refuses chmod. */
function ensurePrivateDir(dir) {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    chmodSync(dir, 0o700);
  } catch {
    // The create mode above is the best available on a mount that refuses chmod.
  }
}
