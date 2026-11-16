/**
 * Self-test for @local/dsh-connectors — no test runner, no network, no Composio.
 *
 * Covers the parts that can break silently: the catalog, the per-profile
 * identity, the route table and its validation, the no-key contract, the
 * credential-template header on the session MCP, and the rule that the key is
 * never echoed back to the page.
 *
 * Run: node plugins/connectors/selftest.mjs
 */

import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const home = mkdtempSync(path.join(os.tmpdir(), 'dsh-connectors-selftest-'));
const previousHome = process.env.DSH_HOME;
process.env.DSH_HOME = home;

const { apply, collect, serverView } = await import('./index.js');
const {
  APPS,
  composioStatus,
  disposeComposioSession,
  ensureComposioSession,
  identity,
  saveApiKey,
} = await import('./composio.js');

let failures = 0;
/** Assert one condition, recording the outcome. */
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`ok   ${label}`);
    return;
  }
  failures += 1;
  console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
}

function ctxWith({ credentials, mcpManager, routes = [] } = {}) {
  return {
    get(name) {
      if (name === 'mcpManager') return mcpManager;
      return undefined;
    },
    credentials: credentials ?? {
      resolve: async () => undefined,
      describe: async () => ({ configured: false }),
      set: async () => {},
    },
    connection: {
      fetch: {
        register: async (route) => {
          routes.push(route);
          return async () => {};
        },
      },
    },
    effect: () => {},
  };
}

// ── catalog ───────────────────────────────────────────────────────────────────
check('catalog has twelve apps', APPS.length === 12, String(APPS.length));
check(
  'catalog ids and slugs are unique',
  new Set(APPS.map((app) => app.id)).size === APPS.length &&
    new Set(APPS.map((app) => app.slug)).size === APPS.length,
);
check('two apps are marked as having no managed OAuth', APPS.filter((app) => !app.managedOAuth).length === 2);

// ── server view ──────────────────────────────────────────────────────────────
const server = serverView({
  name: 'composio',
  configured: true,
  status: { state: 'connected', lastError: null },
  command: '/secret/server',
});
check('serverView keeps identity and live status', server.name === 'composio' && server.state === 'connected');
check('serverView drops the command', server.command === undefined);
check('serverView bounds a diagnostic', serverView({ name: 'x', status: { lastError: 'y'.repeat(500) } }).error.length === 300);

// ── no key: a usable page, every app unconnected ─────────────────────────────
const status = await composioStatus(ctxWith());
check('no key reports unconfigured', status.configured === false && status.error === null);
check('no key still lists every app', status.apps.length === APPS.length);
check(
  'no key marks every app unconnectable',
  status.apps.every((app) => app.state === 'not_connected' && app.canConnect === false),
);

const empty = await collect(ctxWith());
check('collect tolerates a missing manager', empty.connectors.length === 0 && empty.available.mcpManager === false);
check('collect reports composio unavailable', empty.available.composio === false);
check('collect reports the session MCP as not registered', empty.composio.tools.registered === false);

const withFleet = await collect(
  ctxWith({
    mcpManager: { list: () => [{ name: 'ping', configured: true, status: { state: 'connected' } }] },
  }),
);
check('collect lists the MCP fleet', withFleet.connectors.length === 1 && withFleet.connectors[0].name === 'ping');

// ── identity: opaque, 0600, stable ──────────────────────────────────────────
const first = identity();
const second = identity();
check('identity is opaque and profile-scoped', /^dsh_assistant_[0-9a-f]{32}$/.test(first));
check('identity is reused', first === second);
const identityFile = path.join(home, 'connectors', 'identity.json');
check('identity file is 0600', (statSync(identityFile).mode & 0o777) === 0o600);
check('identity file never stores a display name', !readFileSync(identityFile, 'utf8').includes('@'));

// ── routes ──────────────────────────────────────────────────────────────────
const routes = [];
await apply(ctxWith({ routes }));
check(
  'apply registers the read, OAuth, key and MCP routes',
  routes.map((route) => `${route.methods.join(',')} ${route.path}`).join('\n') ===
    [
      'GET /api/connectors',
      'POST /api/connectors/connect',
      'POST /api/connectors/disconnect',
      'POST /api/connectors/key',
      'POST /api/connectors/servers/probe',
      'POST /api/connectors/servers/restart',
    ].join('\n'),
  routes.map((route) => route.path).join(', '),
);

const read = await routes[0].fetch(new Request('http://host/api/connectors'));
const readBody = await read.json();
check('read route is 200 without a key', read.status === 200);
check('read route returns the catalog', readBody.composio.apps.length === APPS.length);
check('read route never returns an identity or key', !JSON.stringify(readBody).includes('dsh_assistant_'));

const unknown = await routes[1].fetch(
  new Request('http://host/api/connectors/connect', {
    method: 'POST',
    body: JSON.stringify({ app: 'not-an-app' }),
  }),
);
check('connect rejects an app outside the catalog', unknown.status === 404);

const noKey = await routes[1].fetch(
  new Request('http://host/api/connectors/connect', {
    method: 'POST',
    body: JSON.stringify({ app: 'gmail' }),
  }),
);
check('connect without a key is a 409', noKey.status === 409);
check('connect without a key names the ref', (await noKey.json()).code === 'not_configured');

const shortKey = await routes[3].fetch(
  new Request('http://host/api/connectors/key', {
    method: 'POST',
    body: JSON.stringify({ key: 'short' }),
  }),
);
check('key route rejects a malformed key', shortKey.status === 400);

const whitespaceKey = await routes[3].fetch(
  new Request('http://host/api/connectors/key', {
    method: 'POST',
    body: JSON.stringify({ key: 'not a key with space' }),
  }),
);
check('key route rejects whitespace', whitespaceKey.status === 400);

const noManager = await routes[4].fetch(
  new Request('http://host/api/connectors/servers/probe', {
    method: 'POST',
    body: JSON.stringify({ name: 'ping' }),
  }),
);
check('MCP action without a manager is a 409', noManager.status === 409);

// ── key storage and the credential template ────────────────────────────────
let stored = null;
const credentials = {
  resolve: async () => (stored ? { value: stored } : undefined),
  describe: async () => ({ configured: Boolean(stored), source: 'file' }),
  set: async (ref, value) => {
    if (ref !== 'COMPOSIO_API_KEY') throw new Error('wrong ref');
    stored = value;
  },
};
const storedCtx = ctxWith({ credentials });
const saved = await saveApiKey(storedCtx, '  test-key-not-a-real-secret  ');
check('saveApiKey trims and stores the secret', stored === 'test-key-not-a-real-secret', String(stored));
check('saveApiKey reports the session as unregistered without a manager', saved.registered === false);

// A manager plus a stubbed Composio response registers the session MCP with a
// credential template — never the literal key.
const originalFetch = globalThis.fetch;
let registered = null;
let fetched = 0;
globalThis.fetch = async () => {
  fetched += 1;
  return new Response(
    JSON.stringify({ mcp: { url: 'https://session.composio.dev/mcp' }, session_id: 'sess_1' }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
};
try {
  const manager = {
    register(name, entry) {
      registered = { name, entry };
      return () => {
        registered = null;
      };
    },
    list: () => [],
  };
  const result = await ensureComposioSession(ctxWith({ credentials, mcpManager: manager }));
  check('a session MCP is registered', result.registered === true && registered?.name === 'composio');
  check('the session MCP uses streamable-http', registered?.entry?.transport === 'streamable-http');
  check(
    'the session MCP keeps the key as a credential template',
    registered?.entry?.headers?.['x-api-key'] === '${credential:COMPOSIO_API_KEY}',
  );
  check('the literal key never reaches the registration', !JSON.stringify(registered).includes('test-key-not-a-real-secret'));
  check('one Composio request creates the session', fetched === 1);

  const again = await ensureComposioSession(ctxWith({ credentials, mcpManager: manager }));
  check('session registration is idempotent', again.registered === true && fetched === 1);

  disposeComposioSession();
  check('dispose drops the registration', registered === null);
} finally {
  globalThis.fetch = originalFetch;
  disposeComposioSession();
}

// ── theme-safe buttons ──────────────────────────────────────────────────────
// The host's brand fill flips from black in light mode to white in dark mode;
// a hard-coded white label disappears on the dark button. Keep the pair of
// semantic tokens the host itself uses.
const clientSource = readFileSync(new URL('./client.js', import.meta.url), 'utf8');
check('primary buttons use the host fill token', clientSource.includes('--dsw-alias-button-primary-fill'));
check('primary buttons use the on-brand foreground token', clientSource.includes('--dsw-alias-label-primary-foreground'));
check('primary buttons never hard-code white text', !/color:\s*'#fff'/.test(clientSource));

rmSync(home, { recursive: true, force: true });
if (previousHome === undefined) delete process.env.DSH_HOME;
else process.env.DSH_HOME = previousHome;
console.log(failures === 0 ? '\nselftest PASS' : `\nselftest FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
