# dsh-assistant

An assistant profile for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).
Everything is a plugin: identity, memory, learning, browsing and connectors.

Early. One profile, five plugins, no channel yet.

## Requirements

- Node >= 24.9
- DSH 0.2.2-rc.2: `npm i -g @deepseek-ai/dsh`
- `pnpm` (DSH's plugin manager uses it)
- Chrome or Chromium, for the browser plugin

## Quick start

```sh
npm run setup
npm start
```

Open the printed URL, go to **Settings → Models**, add a model key. Then:

```sh
npm run doctor
```

`setup` creates `~/.dsh-assistant` (0700), links the local plugins, installs the
pinned browser plugin, and writes the telemetry-off patch. It never touches an
existing DSH home or the host.

## What is installed

| Plugin | What it does |
|---|---|
| `@local/dsh-soul` | Injects `soul/SOUL.md` at prompt order 0. Edit the file; no restart config. |
| `@local/dsh-memory` | A bounded `memory/profile.json` plus `memory_remember` / `memory_recall` / `memory_forget`. Local by default; Hindsight is opt-in. |
| `@local/dsh-learn` | Reviews a completed turn in the background and records durable memory plus procedural skills under `$DSH_HOME`, with an audit log, caps and no approval prompt. A turn qualifies when the human wrote enough to state something durable *or* when the work itself was substantial (8+ tool calls or a long final answer), so a one-line request that ran for twenty minutes is still reviewed. |
| `@local/dsh-connectors` | The Connectors page: Gmail, Outlook, Slack, Google Calendar/Drive, Dropbox, Notion, HubSpot, Stripe, QuickBooks, Xero and Shopify with Connect/Disconnect through Composio, plus the live MCP server fleet with probe/restart. The Composio key is saved from the page; a session MCP exposes the connected apps as tools. |
| `@local/dsh-organiser` | The organiser: a Day view and a Month view for plans and a plain-text note per day, both kept locally. The calendar band reads events from a connected calendar once the Google path lands; until then it says so. |
| `@local/dsh-browse` | The browsing stack. Tier 1 is the host's `web_fetch`; tier 2 is `browse` over the CamoFox server (JS pages, sessions, downloads, captcha stop); tier 3 is `render_html` (chromium printing our own HTML to PDF/PNG at exact millimetres) and `render_view` (same render, but returns the image and a layout check — text past the edge, clipped boxes, sub-15px type, painted-text collisions — in one call). |

## Data and privacy

- Data lives in `~/.dsh-assistant/`, mode 0700: soul, memory, sessions, credentials.
- Telemetry egress is off by default; the profile patch is `config/telemetry-off.patch.yml`.
- Memory is local. Semantic memory is off unless you set `apiUrl` on the memory row.
- Semantic memory is scoped to a Hindsight bank (`dsh-assistant` by default). Widen
  `allowBanks` deliberately; set `denyBanks` to fence off any bank that is not this
  assistant's, including another agent's.
- Learning writes only inside `$DSH_HOME/{memory,skills,learning}`; it never edits `SOUL.md`,
  profile config or host state. Every change is recorded in `learning/audit.jsonl`, and a
  replaced skill keeps up to five previous versions under `skills/.history/`.
- The browsing stack reaches the CamoFox server on loopback only; it never spawns a browser
  or reads a credentials store. `browse` acts as you on sites — treat its actions as
  consequential, and stop (do not retry) when a page asks for a captcha.
- Connectors use Composio as the OAuth broker: connected-app tokens are held by Composio,
  not in this home. The key itself is stored in the 0600 credential store and is never
  returned to the page. Use a dedicated Composio project for this assistant.

## Adding a plugin

1. Create `plugins/<name>/` with a `package.json` that declares `dsh.bundle`.
2. Add its package name to `dsh.profile.bundles` in `lib/paths.mjs`.
3. `npm run setup`, then `npm run doctor`.

No core patches. No second implementation of something that already works.

## Tests

```sh
npm test          # hermetic
npm run test:live # read-only against the local Hindsight daemon
```
