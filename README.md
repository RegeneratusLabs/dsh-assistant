# dsh-assistant

A assistant built on [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).
Everything is a plugin: identity, memory, the browser, and later the channel.

Early. One profile, three plugins, no channel yet.

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

`setup` creates `~/.dsh-assistant` (0700), links the two local plugins, installs the
pinned browser plugin, and writes the telemetry-off patch. It never touches an
existing DSH home or the host.

## What is installed

| Plugin | What it does |
|---|---|
| `@local/dsh-soul` | Injects `soul/SOUL.md` at prompt order 0. Edit the file; no restart config. |
| `@local/dsh-memory` | A bounded `memory/profile.json` plus `memory_remember` / `memory_recall` / `memory_forget`. Local by default; Hindsight is opt-in. |
| `dsh-ego-browser` | Real Chrome tools (`ego_*`): open, click, type, screenshot, tabs. Third-party (MIT), pinned to 0.9.14. |

## Data and privacy

- Data lives in `~/.dsh-assistant/`, mode 0700: soul, memory, sessions, credentials.
- Telemetry egress is off by default; the profile patch is `config/telemetry-off.patch.yml`.
- Memory is local. Semantic memory is off unless you set `apiUrl` on the memory row.
- The browser plugin drives your installed Chrome and can act as you on sites.
  Treat it as consequential.

## Adding a plugin

1. Create `plugins/<name>/` with a `package.json` that declares `dsh.bundle`.
2. Add its package name to `dsh.profile.bundles` in `lib/paths.mjs`.
3. `npm run setup`, then `npm run doctor`.

No core patches. No second implementation of something that already works.

## Tests

```sh
npm test
```
