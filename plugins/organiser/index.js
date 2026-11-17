/**
 * Host half of the Organiser.
 *
 * Two sources, one plugin: plans and notes kept in this home, and events read
 * from the connected calendar. The Host owns both so the page and the assistant
 * can never disagree about what a day holds — the page reads the same rows and
 * the same provider as `organiser_agenda`.
 *
 * The routes sit on the shared `/api` channel, so the owner cookie, Host/Origin
 * fence and ownership check run before every handler, exactly as they do for the
 * Connectors and Records pages.
 *
 * There is no provider yet. The calendar band says so rather than pretending the
 * day is empty, and plans and notes work with no account at all, which is the
 * point of having them.
 */
import os from 'node:os';
import path from 'node:path';

import { openStore, OrganiserError } from './store.js';
import { buildTools } from './tools.js';
import { resolveZone, todayIn } from './time.js';

export const name = 'dsh-organiser';

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

function setting(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/** Expand `~/`, else resolve a relative path under `$DSH_HOME`. */
function resolvePath(raw) {
  const value = setting(raw);
  if (!value) return undefined;
  if (value === '~') return os.homedir();
  if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2));
  return path.isAbsolute(value) ? value : path.join(dshHome(), value);
}

/**
 * Resolve the loader row.
 *
 * `timeZone` is optional on purpose: unset means follow the ambient profile, so
 * a user who already told the assistant where they are does not have to say it
 * twice.
 */
export function resolveConfig(config) {
  const raw = config || {};
  const home = dshHome();
  const dataDir = resolvePath(raw.dataDir) ?? path.join(home, 'calendar');
  const dbPath = resolvePath(raw.dbPath) ?? path.join(dataDir, 'plans.db');
  return {
    home,
    dataDir,
    dbPath,
    timeZone: resolveZone({ configZone: setting(raw.timeZone), home }),
  };
}

/** Read a JSON body without throwing on an empty or malformed one. */
async function readJson(request) {
  try {
    const text = await request.text();
    if (!text) return {};
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * @param ctx - Cordis context carrying `connection` and `tools`.
 * @param config - loader row config.
 */
export async function apply(ctx, config) {
  const resolved = resolveConfig(config);

  let store;
  try {
    store = openStore(resolved.dbPath);
  } catch (error) {
    // No store, no tools and no routes: a page that cannot keep what it is told
    // is worse than no page, because it would say "saved" and nothing would be.
    console.error(`[dsh-organiser] cannot open ${resolved.dbPath}: ${error?.message ?? error}; nothing registered`);
    return;
  }
  ctx.effect(() => () => store.close(), 'dsh-organiser: store');

  // The provider lands with the Google read path. Until then the calendar band
  // reports the truth instead of drawing an empty day.
  const provider = null;
  for (const tool of buildTools({ store, zone: resolved.timeZone, provider })) ctx.tools.register(tool);

  /** Every route returns a Response; an error is a message, never a stack. */
  const guard = (handler) => async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof OrganiserError) return fail(error.status, error.message, error.code);
      console.error(`[dsh-organiser] route failed: ${error?.stack ?? error}`);
      return fail(500, String(error?.message ?? 'organiser action failed'));
    }
  };

  const read = await ctx.connection.fetch.register({
    path: '/api/organiser',
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: guard(async (request) => {
      const url = new URL(request.url, 'http://localhost');
      const from = url.searchParams.get('from') ?? todayIn(resolved.timeZone);
      const to = url.searchParams.get('to') ?? from;
      const status = url.searchParams.get('status') === 'all' ? 'all' : 'open';

      const plans = store.listPlans({ from, to, status });
      const notes = store.listNotes({ limit: 500 });

      let events = [];
      let calendar = { connected: false, error: null };
      if (provider) {
        const result = await provider.agenda({ from, to, signal: request.signal });
        if (result?.error) calendar = { connected: Boolean(result.connected), error: String(result.error) };
        else {
          calendar = { connected: result?.connected !== false, error: null };
          events = Array.isArray(result?.events) ? result.events : [];
        }
      }

      return json({
        ok: true,
        zone: resolved.timeZone,
        today: todayIn(resolved.timeZone),
        from,
        to,
        calendar,
        plans,
        events,
        notes,
      });
    }),
  });

  const planRoute = await ctx.connection.fetch.register({
    path: '/api/organiser/plan',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: guard(async (request) => {
      const body = await readJson(request);
      const action = typeof body.action === 'string' ? body.action : '';
      if (action === 'add') {
        return json({ ok: true, plan: store.addPlan({ date: body.date, time: body.time, title: body.title, notes: body.notes }) });
      }
      if (action === 'update') {
        const patch = {};
        for (const key of ['date', 'time', 'title', 'notes']) {
          if (Object.prototype.hasOwnProperty.call(body, key)) patch[key] = body[key];
        }
        return json({ ok: true, plan: store.updatePlan(body.id, patch) });
      }
      if (action === 'done' || action === 'drop' || action === 'open') {
        return json({ ok: true, plan: store.setPlanStatus(body.id, action) });
      }
      return fail(400, `unknown plan action "${action}"`, 'invalid_action');
    }),
  });

  const noteRoute = await ctx.connection.fetch.register({
    path: '/api/organiser/note',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: guard(async (request) => {
      const body = await readJson(request);
      const action = typeof body.action === 'string' ? body.action : '';
      if (action === 'save') {
        const saved = store.saveNoteForDate({ date: body.date, body: body.body });
        return json({ ok: true, note: saved.note, created: saved.created });
      }
      if (action === 'add') {
        const saved = store.addNote({ date: body.date, body: body.body });
        return json({ ok: true, note: saved.note, appended: saved.appended });
      }
      if (action === 'delete') {
        return json({ ok: true, note: store.deleteNote(body.id) });
      }
      return fail(400, `unknown note action "${action}"`, 'invalid_action');
    }),
  });

  ctx.effect(
    () => () => {
      void read();
      void planRoute();
      void noteRoute();
    },
    'dsh-organiser: /api routes',
  );

  console.error(
    `[dsh-organiser] store=${resolved.dbPath} zone=${resolved.timeZone} calendar=${provider ? 'connected' : 'not connected'}`,
  );
}
