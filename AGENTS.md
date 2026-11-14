# AGENTS.md

This is a lean product repo. **Do not create documentation.** That is the rule.

- The only prose files are `README.md` (install and use) and this file. No research notes, audits,
  design briefs, ADRs, decision registers, changelogs, status reports, or translation pairs. Update
  README only when behavior a user sees changes. Comments explain *why*; commit messages explain *what*.
- **Everything is a plugin.** A new capability is `plugins/<name>/` with a `dsh.bundle` patch and a
  test. Never patch DSH core. Never add a second way to do the same thing.
- Keep the dependency surface small and pinned. No `latest`, no auto-update.
- Security defaults stay: telemetry egress off, approvals on, no secrets in the repo, logs or memory.
  The browser plugin acts as the user; treat its actions as consequential.
- A plugin without a test is unfinished. `npm test` must pass before a commit.
- One change at a time. Keep the tree clean. If you feel the urge to write a plan, write a test instead.
