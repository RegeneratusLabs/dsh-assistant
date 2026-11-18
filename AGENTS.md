# AGENTS.md

This is a lean product repo. **Do not create documentation.** That is the rule.

- The only prose files are `README.md` (install and use) and this file. No research notes, audits,
  design briefs, ADRs, decision registers, changelogs, status reports, or translation pairs. Update
  README only when behavior a user sees changes. Comments explain *why*; commit messages explain *what*.
- **Code is a plugin; task knowledge is a skill.** A new capability is `plugins/<name>/` with a
  `dsh.bundle` patch and a test. A new task instruction is a portable `SKILL.md` folder under
  `skills/<cluster>/<name>/` (the cross-agent standard), shipped into profiles only by the thin
  skill-pack plugins in `plugins/`; the packs vendor the tree via `bin/assistant.mjs sync-skills`
  and a test asserts the two stay in sync. Never patch DSH core. Never add a second way to do the
  same thing.
- Keep the dependency surface small and pinned. No `latest`, no auto-update.
- Security defaults stay: telemetry egress off, approvals on, no secrets in the repo, logs or memory.
  The browser plugin acts as the user; treat its actions as consequential.
- A plugin without a test is unfinished. `npm test` must pass before a commit.
- One change at a time. Keep the tree clean. If you feel the urge to write a plan, write a test instead.

## Public pushes

This repository is public. Sanitize and generalize **every** push, including force-pushes:

- No private network details: tailnet or MagicDNS names, VPN/LAN hostnames, private IPs, or
  ports tied to one machine.
- No personal identity: real names, personal email addresses, usernames, home paths, or
  machine/service names.
- No machine-specific setup: "this machine" instructions, systemd units, personal profile
  names, or local data directories.
- Fixtures stay generic (`example.com`, `test`, `Testville`). Never use a real person, place,
  client, farm, or asset.
- Private or domain-specific plugins stay untracked on the local machine. The public tree
  carries only generic plugins.
- Before pushing: scan every reachable commit for the sensitive terms you know about
  (`git grep -nEi '<terms>' $(git rev-list --all)`), run `npm test`, and verify a fresh clone.
  A force-push does not purge GitHub's cached objects; treat any leaked secret as leaked and
  rotate it.
