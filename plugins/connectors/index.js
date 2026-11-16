/**
 * Host half of the Connectors page.
 *
 * Two planes, one authenticated read route:
 *  - Composio — the OAuth catalog and the runtime session MCP, via the broker
 *    in `composio.js`;
 *  - `ctx.mcpManager` — the MCP server fleet (status, probe, restart).
 *
 * Connector *configuration* stays on the official Plugins page / Settings.
 * The only writes here are safe runtime operations: MCP probe/restart, and
 * Composio connect/disconnect plus storing the project key, which never touch
 * profile files. The route is registered on the shared `/api` channel, so the
 * owner cookie, Host/Origin fence and ownership check run before every handler.
 * No credential, server command, profile path or Composio user id is returned.
 */
import {
  ConnectorError,
  appById,
  composioStatus,
  connectApp,
  disconnectApp,
  disposeComposioSession,
  ensureComposioSession,
  saveApiKey,
} from './composio.js';

export const name = 'dsh-connectors';

/** The connection channel and the credential seam (Composio key) are required. */
export const inject = ['connection', 'credentials'];

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

/** Truncate an upstream diagnostic; it may embed a path or a command line. */
function trim(value, max = 300) {
  return typeof value === 'string' ? value.slice(0, max) : null;
}

/** One managed MCP server; only identity, configured intent and live status. */
export function serverView(server) {
  const status = server?.status ?? {};
  return {
    name: String(server?.name ?? ''),
    configured: server?.configured === true,
    state: typeof status.state === 'string' ? status.state : 'unknown',
    reason: typeof status.reason === 'string' ? status.reason : null,
    error: trim(status.lastError),
    closeConfirmed: typeof status.closeConfirmed === 'boolean' ? status.closeConfirmed : null,
  };
}

/** Read both planes; a missing manager degrades to an empty plane, not a failed page. */
export async function collect(ctx) {
  // Register the Composio session MCP before listing the fleet, so the page
  // shows it on the first read. A missing key/manager is reported, not fatal.
  const tools = await ensureComposioSession(ctx);
  const mcpManager = ctx.get('mcpManager');

  const connectors = [];
  if (mcpManager && typeof mcpManager.list === 'function') {
    for (const server of mcpManager.list()) connectors.push(serverView(server));
  }

  const composio = await composioStatus(ctx);

  return {
    generatedAt: new Date().toISOString(),
    connectors,
    composio: { ...composio, tools },
    available: {
      mcpManager: Boolean(mcpManager),
      composio: composio.configured,
    },
  };
}

/** Parse `{app}` for a connect/disconnect action. */
async function readApp(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ConnectorError('bad_request', 'Expected a JSON body.', 400);
  }
  const id = typeof body?.app === 'string' ? body.app : '';
  if (!appById(id)) throw new ConnectorError('not_in_catalogue', 'Unknown app.', 404);
  return id;
}

/** Parse `{key}` for the key-setup action without ever echoing it. */
async function readKey(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ConnectorError('bad_request', 'Expected a JSON body.', 400);
  }
  return typeof body?.key === 'string' ? body.key : '';
}

function fromError(error) {
  if (error instanceof ConnectorError) return fail(error.status, error.message, error.code);
  return fail(500, trim(error?.message) ?? 'connectors action failed', 'error');
}

export async function apply(ctx) {
  const read = await ctx.connection.fetch.register({
    path: '/api/connectors',
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: async () => {
      try {
        return json(await collect(ctx));
      } catch (error) {
        return fromError(error);
      }
    },
  });

  const connect = await ctx.connection.fetch.register({
    path: '/api/connectors/connect',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      try {
        return json({ ok: true, ...(await connectApp(ctx, await readApp(request))) });
      } catch (error) {
        return fromError(error);
      }
    },
  });

  const disconnect = await ctx.connection.fetch.register({
    path: '/api/connectors/disconnect',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      try {
        return json({ ok: true, ...(await disconnectApp(ctx, await readApp(request))) });
      } catch (error) {
        return fromError(error);
      }
    },
  });

  const key = await ctx.connection.fetch.register({
    path: '/api/connectors/key',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      try {
        const tools = await saveApiKey(ctx, await readKey(request));
        return json({ ok: true, configured: true, tools });
      } catch (error) {
        return fromError(error);
      }
    },
  });

  const mcpAction = (kind) => async (request) => {
    const manager = ctx.get('mcpManager');
    if (!manager) return fail(409, 'The MCP manager is not composed on this host.', 'not_configured');
    let body;
    try {
      body = await request.json();
    } catch {
      return fail(400, 'Expected a JSON body.', 'bad_request');
    }
    const name = typeof body?.name === 'string' ? body.name : '';
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(name)) return fail(400, 'Invalid connector name.', 'bad_request');
    try {
      if (kind === 'probe') {
        const probe = await manager.probe(name);
        return json({ ok: true, probe });
      }
      await manager.restart(name);
      return json({ ok: true });
    } catch (error) {
      return fail(502, trim(error?.message) ?? `${kind} failed`, 'upstream');
    }
  };

  const probe = await ctx.connection.fetch.register({
    path: '/api/connectors/servers/probe',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: mcpAction('probe'),
  });
  const restart = await ctx.connection.fetch.register({
    path: '/api/connectors/servers/restart',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: mcpAction('restart'),
  });

  ctx.effect(
    () => () => {
      disposeComposioSession();
      void read();
      void connect();
      void disconnect();
      void key();
      void probe();
      void restart();
    },
    'dsh-connectors: /api routes',
  );
}
