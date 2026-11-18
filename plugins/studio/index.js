/**
 * Host half of the Studio.
 *
 * The Studio is the design skill's page. What the Host owns here is the works
 * library: the list of delivered designs, kept in this profile's own data
 * directory so the page and the assistant read the same rows. The page never
 * reads the filesystem — it asks the Host over the shared `/api` channel, which
 * means the owner cookie, Host/Origin fence and ownership check run before any
 * handler, exactly as they do for the other pages.
 *
 * There is one tool and four routes:
 *
 *  - `studio_library` — the model registers a delivered file at delivery time.
 *  - `GET /api/studio` — the page's list.
 *  - `GET /api/studio/thumb` — one thumbnail file from `studio/thumbs/`.
 *  - `GET /api/studio/preview` — one work's HTML, for the page's overlay.
 *  - `GET /api/studio/export` — the work rendered to PNG or PDF for download.
 *
 * Everything the plugin reads or writes lives under `$DSH_HOME/studio`:
 * `library.json`, `thumbs/` and the transient `exports/`. The delivered artifact
 * is only ever a path in a row, which is what keeps this plugin out of the
 * user's project directories; the preview and export routes resolve that path
 * from the row a request's id names, never from the request itself.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { exportResponse, previewResponse, resolveChrome } from './export.js';
import { openStore, StudioError } from './store.js';
import { buildTools } from './tools.js';

export const name = 'dsh-studio';

/** The connection channel serves the page; the tool registry serves the model. */
export const inject = ['connection', 'tools'];

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function fail(status, message, code = 'error') {
  return json({ ok: false, code, error: message }, status);
}

/** This process's DSH home; real deployments set `DSH_HOME`, local runs may not. */
function dshHome() {
  return process.env.DSH_HOME ? path.resolve(process.env.DSH_HOME) : path.join(os.homedir(), '.dsh');
}

/** The library directory: `$DSH_HOME/studio`, beside the rest of this profile's data. */
export function libraryDir() {
  return path.join(dshHome(), 'studio');
}

/** Image types a thumbnail may have; the client only ever shows these. */
const THUMB_TYPES = new Map([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
]);

/** A thumbnail miss; the page renders its placeholder for this work instead. */
function notFound() {
  return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
}

/**
 * One thumbnail from `studio/thumbs/`.
 *
 * The name is validated as a bare file name, so a traversal attempt is refused
 * before the path is built. Only the four raster types are served: an SVG is not
 * a thumbnail here, and refusing it keeps the route from being a way to serve
 * markup the plugin never drew. `lstat` rather than `stat` is deliberate — a
 * symlink planted in the directory is not a thumbnail, and following it would
 * let the route read a file outside the studio directory.
 */
function thumbResponse(store, request) {
  const name = new URL(request.url, 'http://localhost').searchParams.get('name') ?? '';
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) || path.basename(name) !== name) return notFound();
  const type = THUMB_TYPES.get(path.extname(name).toLowerCase());
  if (!type) return notFound();
  const file = path.join(store.thumbsDir, name);
  let info;
  try {
    info = fs.lstatSync(file);
  } catch {
    return notFound();
  }
  if (!info.isFile()) return notFound();
  let bytes;
  try {
    bytes = fs.readFileSync(file);
  } catch {
    return notFound();
  }
  return new Response(bytes, {
    status: 200,
    headers: { 'content-type': type, 'cache-control': 'no-store' },
  });
}

/**
 * @param ctx - Cordis context carrying `connection` and `tools`.
 * @param config - loader row config; `chromeBinary` overrides the browser used
 *   for exports, and an empty value auto-detects the Playwright headless shell.
 */
export async function apply(ctx, config) {
  const dir = libraryDir();
  const chromeBinary = resolveChrome(config ?? {});

  let store;
  try {
    store = openStore(dir);
  } catch (error) {
    // No store, no tools and no routes: a page that cannot keep what it is told
    // is worse than no page, because it would list works that are not saved.
    console.error(`[dsh-studio] cannot open ${dir}: ${error?.message ?? error}; nothing registered`);
    return;
  }

  for (const tool of buildTools({ store })) ctx.tools.register(tool);

  /** Every route returns a Response; an error is a message, never a stack. */
  const guard = (handler) => async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof StudioError) return fail(error.status, error.message, error.code);
      console.error(`[dsh-studio] route failed: ${error?.stack ?? error}`);
      return fail(500, String(error?.message ?? 'studio action failed'));
    }
  };

  const listRoute = await ctx.connection.fetch.register({
    path: '/api/studio',
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: guard(async () => json({ ok: true, works: store.listWorks() })),
  });

  const thumbsRoute = await ctx.connection.fetch.register({
    path: '/api/studio/thumb',
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: guard(async (request) => thumbResponse(store, request)),
  });

  const previewRoute = await ctx.connection.fetch.register({
    path: '/api/studio/preview',
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: guard(async (request) => previewResponse(store, request)),
  });

  const exportRoute = await ctx.connection.fetch.register({
    path: '/api/studio/export',
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: guard(async (request) => exportResponse(store, request, chromeBinary)),
  });

  ctx.effect(
    () => () => {
      void listRoute();
      void thumbsRoute();
      void previewRoute();
      void exportRoute();
    },
    'dsh-studio: /api routes',
  );

  console.error(`[dsh-studio] library=${store.libraryPath} chrome=${chromeBinary || 'missing'}`);
}
