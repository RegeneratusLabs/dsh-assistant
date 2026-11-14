# dsh-assistant

A assistant built on [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).
Everything is a plugin: identity, memory, the browser, and later the channel.

Early. One profile, four plugins, no channel yet.

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

## This machine

The assistant runs as the `dsh-assistant.service` user unit: home `~/.dsh-assistant`,
profile `personal`, port 7002, tailnet `https://127.0.0.1:7310/`.
After changing plugin code:

```sh
systemctl --user restart dsh-assistant.service
node bin/assistant.mjs doctor --home ~/.dsh-assistant --name personal
```

## What is installed

| Plugin | What it does |
|---|---|
| `@local/dsh-soul` | Injects `soul/SOUL.md` at prompt order 0. Edit the file; no restart config. |
| `@local/dsh-memory` | A bounded `memory/profile.json` plus `memory_remember` / `memory_recall` / `memory_forget`. Local by default; Hindsight is opt-in. |
| `@local/dsh-learn` | Reviews a completed turn in the background and records durable memory plus procedural skills under `$DSH_HOME`, with an audit log, caps and no approval prompt. |
| `dsh-ego-browser` | Real Chrome tools (`ego_*`): open, click, type, screenshot, tabs. Third-party (MIT), pinned to 0.9.14. |

## Data and privacy

- Data lives in `~/.dsh-assistant/`, mode 0700: soul, memory, sessions, credentials.
- Telemetry egress is off by default; the profile patch is `config/telemetry-off.patch.yml`.
- Memory is local. Semantic memory is off unless you set `apiUrl` on the memory row.
- Semantic memory is scoped to its own Hindsight bank (`dsh-assistant`). The plugin refuses
  any other bank, including another assistant's `another-agent` or `another-agent-*` banks.
- Learning writes only inside `$DSH_HOME/{memory,skills,learning}`; it never edits `SOUL.md`,
  profile config or host state. Every change is recorded in `learning/audit.jsonl`, and a
  replaced skill keeps up to five previous versions under `skills/.history/`.
- The browser plugin drives your installed Chrome and can act as you on sites.
  Treat it as consequential.

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
