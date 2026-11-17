/**
 * dsh-memory — an assistant memory layer over Hindsight.
 *
 * WHY THIS EXISTS
 * `@vectorize-io/hindsight-coding-agents` is a *coding-agent* integration: per-repo
 * banks, git-history ingest, knowledge pages about a codebase, and a ~12 KB
 * tool-usage manual injected on the first prompt (which then rides in every
 * request). An assistant has no repo, no git history and no codebase
 * pages — so the manual is pure overhead and the knowledge-page tier stays empty.
 *
 * What the field (Hermes / OpenClaw / Letta) actually converged on is three tiers:
 *
 *   1. a SMALL always-in-prompt curated block (~1-1.5k tokens, inspectable,
 *      agent-editable, hard character budgets) — this module;
 *   2. an UNBOUNDED on-demand search tier with no LLM cost — session search,
 *      already installed as @deepseek-ai/dsh-experimental-session-search;
 *   3. an OPTIONAL semantic tier — Hindsight itself, reached here as three
 *      ordinary tools instead of an injected manual.
 *
 * So this plugin is deliberately small: it owns tier 1 (a bounded profile file)
 * and exposes tier 3 (retain / recall / forget over the Hindsight REST API). It
 * injects a short profile section plus three tool schemas, and nothing else. It
 * makes no LLM calls of its own and never writes outside $DSH_HOME/memory.
 *
 * DESIGN RULES
 *  - Bounded: per-track character budgets, enforced BEFORE a write, with the
 *    overflow error carrying the current entries and the exact number of
 *    characters to free so the model can consolidate in one batch (the Hermes
 *    mechanism — limits force curation instead of silent truncation).
 *  - Cache-safe: one static section rendered from a file, not a per-turn dynamic
 *    block. The text only changes when the model edits it.
 *  - Fail-open: Hindsight down/unreachable degrades recall to an explanatory
 *    error; it never blocks a turn and never breaks boot.
 *  - No deps: node builtins + global fetch only, so the bundle resolves from any
 *    profile without a package install.
 *
 * SAFETY
 *  - A bank allowlist plus an optional denylist. The assistant must never read
 *    or write another agent's bank, even if a config or an environment variable
 *    points at it. `denyBanks` fences off named banks; refusing to register is
 *    safer than silently touching the wrong memory.
 *  - Every semantic failure is recorded to memory/alerts.json and surfaces as a
 *    warning line in the prompt block, because a silent retain failure looks
 *    exactly like "the assistant forgot".
 *
 * @module @local/dsh-memory
 */

import { copyFileSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

/** This plugin's Loader row id / Cordis plugin name. */
export const name = 'dsh-memory';

/** The two services this plugin needs: the prompt registry and the tool registry. */
export const inject = ['systemPrompt', 'tools'];

/** Prompt section id; unique so a reload replaces rather than duplicates it. */
const SECTION_NAME = 'memory:profile';

/** Defaults; every value is overridable from the Loader row config. */
const DEFAULTS = {
  userBudget: 2200,
  agentBudget: 4000,
  timeoutMs: 10000,
  recallMaxTokens: 800,
  minScore: 0.15,
};

/** Banks this assistant may touch unless the row explicitly widens the list. */
export const ALLOWED_BANKS = ['dsh-assistant'];

/**
 * Banks that are never ours, whatever the allowlist says. Empty by default:
 * set `denyBanks` on the row to fence off another agent's banks. Both are local
 * services, so a bug here would not be a remote incident — it would be worse.
 */
export const DENIED_BANKS = [];

/** Hindsight fact kinds this plugin writes. */
const TARGETS = ['user', 'agent', 'fact'];

/** How much semantic failure history the alert file keeps. */
const ALERT_LIMIT = 10;

/** Warnings are once per process per cause (the Host log is the local sink). */
const warned = new Set();

/**
 * Emit one warning per key. stderr, because in one-shot headless runs stdout is
 * the answer channel.
 * @param key - dedupe key.
 * @param message - text to log once.
 */
function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[dsh-memory] ${message}`);
}

/** This process's DSH home; real units set `DSH_HOME`, local runs may not. */
function dshHome() {
  // Fall back to DSH's own default home (~/.dsh), never to this deployment's
  // custom home: a stock install that forgets DSH_HOME must not write into a
  // directory belonging to a different product.
  return process.env.DSH_HOME ? path.resolve(process.env.DSH_HOME) : path.join(os.homedir(), '.dsh');
}

/**
 * A non-empty trimmed string, or undefined.
 * @param value - candidate config/env value.
 * @returns the setting, or undefined when absent/blank.
 */
function setting(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * A positive integer within a ceiling, else the fallback.
 * @param value - configured value.
 * @param fallback - default when unusable.
 * @param ceiling - hard upper bound.
 * @returns the effective integer.
 */
function positiveInt(value, fallback, ceiling) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) return fallback;
  return Math.min(number, ceiling);
}

/**
 * A number inside a closed range, else the fallback.
 * @param value - configured value.
 * @param fallback - default when unusable.
 * @param min - lower bound.
 * @param max - upper bound.
 * @returns the effective number.
 */
function numberInRange(value, fallback, min, max) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

/**
 * A comma-separated list, or the fallback.
 * @param value - configured value.
 * @param fallback - entries when absent.
 * @returns trimmed non-empty entries.
 */
function list(value, fallback) {
  if (typeof value !== 'string' || value.trim().length === 0) return fallback;
  return value.split(',').map((entry) => entry.trim()).filter(Boolean);
}

/**
 * May this bank be used?
 *
 * The denylist is checked first and ignores the allowlist entirely: widening
 * `allowBanks` must never be able to reach another agent's memory.
 * @param bankId - resolved bank.
 * @param allow - configured allowlist.
 * @param deny - configured denylist.
 * @returns whether the bank is ours.
 */
export function bankAllowed(bankId, allow = ALLOWED_BANKS, deny = DENIED_BANKS) {
  const id = String(bankId || '').trim();
  if (id.length === 0) return false;
  if (deny.some((denied) => id === denied || id.startsWith(`${denied}-`))) return false;
  return allow.includes(id);
}

/**
 * Resolve the profile file: row `config.profilePath`, else
 * `$DSH_MEMORY_PROFILE`, else `$DSH_HOME/memory/profile.json`. `~/` expands and
 * relative paths resolve under `$DSH_HOME`, so the loader never depends on cwd.
 * @param config - Loader row config.
 * @returns absolute profile path.
 */
function resolveProfilePath(config) {
  const raw = setting(config && config.profilePath) ?? setting(process.env.DSH_MEMORY_PROFILE);
  if (raw === undefined) return path.join(dshHome(), 'memory', 'profile.json');
  const expanded = raw.startsWith('~/') ? path.join(os.homedir(), raw.slice(2)) : raw;
  return path.isAbsolute(expanded) ? path.resolve(expanded) : path.resolve(dshHome(), expanded);
}

/** An empty profile: both curated tracks present, so callers never special-case. */
function emptyProfile() {
  return { user: [], agent: [] };
}

/**
 * Read the profile file, tolerating absence and malformed content.
 * @param file - absolute path.
 * @returns the profile (empty when missing/unreadable) plus a status.
 */
export function readProfile(file) {
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') return { profile: emptyProfile(), missing: true };
    return { profile: emptyProfile(), error: String((error && error.message) || error) };
  }
  try {
    const parsed = JSON.parse(raw);
    const profile = emptyProfile();
    for (const track of ['user', 'agent']) {
      const listValue = Array.isArray(parsed && parsed[track]) ? parsed[track] : [];
      profile[track] = listValue.filter((entry) => typeof entry === 'string' && entry.trim().length > 0).map((entry) => entry.trim());
    }
    return { profile };
  } catch (error) {
    return { profile: emptyProfile(), error: `not valid JSON: ${String((error && error.message) || error)}` };
  }
}

/**
 * Persist the profile atomically (write-then-rename) with 0600 permissions.
 *
 * The previous file is kept as `profile.json.bak` for one generation: learning
 * writes happen without an approval prompt, so the last good state must be one
 * copy away.
 * @param file - absolute path.
 * @param profile - the two curated tracks.
 * @returns nothing; throws on an unwritable path.
 */
export function writeProfile(file, profile) {
  const dir = path.dirname(file);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    copyFileSync(file, `${file}.bak`);
  } catch {
    // First write, or an unreadable previous file: no backup to keep.
  }
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify({ user: profile.user, agent: profile.agent }, null, 2)}\n`, { mode: 0o600 });
  renameSync(temp, file);
}

/** Character count of one entry list, matching how the budget is described to the model. */
function trackChars(entries) {
  return entries.reduce((total, entry) => total + entry.length + 3, 0); // 3 = "- " + newline
}

/** Normalize an entry for duplicate comparison. */
export function normalizeEntry(text) {
  return String(text || '').trim().replace(/\s+/g, ' ');
}

/** Percentage of a budget, rounded, never above 100 in the rendered line. */
function usage(used, budget) {
  const percent = budget > 0 ? Math.min(100, Math.round((used / budget) * 100)) : 0;
  return `${used}/${budget} (${percent}%)`;
}

/**
 * Render the bounded prompt block.
 *
 * The block is intentionally small: a heading, an optional usage line, the two
 * tracks, a warning only when semantic memory recently failed, and one line of
 * usage guidance. Empty tracks are omitted so a fresh install costs ~40 tokens
 * rather than a header pair with nothing under it.
 * @param profile - the two curated tracks.
 * @param options - budgets, whether the semantic tier is on, and whether to warn.
 * @returns the section text (never empty; always carries the usage line).
 */
export function renderProfile(profile, options = {}) {
  const budgets = options.budgets ?? DEFAULTS;
  const semantic = options.semantic !== false;
  const lines = ['<memory_profile>'];
  if (profile.user.length > 0 || profile.agent.length > 0) {
    lines.push(
      `Usage: user ${usage(trackChars(profile.user), budgets.userBudget)} · agent ${usage(trackChars(profile.agent), budgets.agentBudget)}`,
    );
  }
  if (profile.user.length > 0) {
    lines.push('## About the user');
    for (const entry of profile.user) lines.push(`- ${entry}`);
  }
  if (profile.agent.length > 0) {
    lines.push('## Notes to self');
    for (const entry of profile.agent) lines.push(`- ${entry}`);
  }
  if (options.alert) {
    lines.push('Semantic memory’s last write failed — say so if the answer depends on it.');
  }
  lines.push(
    'Curated memory you maintain with `memory_remember` / `memory_forget`. Keep entries short and current; delete what stopped being true.',
    semantic
      ? 'Anything not in this block: call `memory_recall` before guessing, and `memory_remember` when the user states a durable preference, decision or fact.'
      : 'Anything not in this block: search past sessions before guessing, and `memory_remember` when the user states a durable preference, decision or fact.',
    '</memory_profile>',
  );
  return lines.join('\n');
}

/**
 * The live text of the injected profile section.
 *
 * The prompt registry re-evaluates a section whose `text` is a function once per
 * request, so passing this function (rather than a string captured at `apply`)
 * is what makes `memory_remember` / `memory_forget` visible in the same session.
 * Without it the block stays frozen until the Host restarts.
 * @param file - absolute profile path.
 * @param options - budgets, semantic mode, and the alert flag.
 * @returns the rendered block for the file's current contents.
 */
export function profileSectionText(file, options = {}) {
  const { profile, error } = readProfile(file);
  if (error) warnOnce(`section:${file}`, `cannot read ${file} (${error}); injecting an empty memory profile`);
  return renderProfile(profile, options);
}

/**
 * Check a proposed write against a track budget before touching the file.
 * @param entries - current entries for the track.
 * @param budget - character budget for the track.
 * @param incoming - the entry the model wants to add.
 * @returns null when it fits, else the overflow report (Hermes-shaped).
 */
function budgetOverflow(entries, budget, incoming) {
  const used = trackChars(entries);
  const after = used + incoming.length + 3;
  if (after <= budget) return null;
  return {
    used,
    budget,
    overflow: after - budget,
    entries: entries.slice(),
  };
}

/**
 * Format the overflow report the model must act on: it has to free characters by
 * consolidating or removing entries, in one batch, before retrying.
 * @param track - 'user' | 'agent'.
 * @param report - result of {@link budgetOverflow}.
 * @returns model-facing text.
 */
function overflowMessage(track, report) {
  const entries = report.entries.map((entry) => `- ${entry}`).join('\n');
  return [
    `The ${track} memory track is full: ${report.used}/${report.budget} chars used, this entry needs ${report.overflow} more chars freed.`,
    `Current entries:\n${entries || '(none)'}`,
    `Consolidate or remove entries to free at least ${report.overflow} chars, then retry. Do not pad — merge related entries.`,
  ].join('\n\n');
}

/**
 * Apply one atomic add/forget batch to the curated profile.
 *
 * Forgets are matched case-insensitively by substring, then adds are checked
 * for duplicates and budget. The file is written once and only when the whole
 * batch fits, so a caller can never leave a half-applied consolidation.
 * @param file - absolute profile path.
 * @param budgets - `{user, agent}` character budgets.
 * @param batch - `{add: [{target, text}], forget: [{target, text}]}`.
 * @returns `{ok, added, removed, message}`; `ok:false` means nothing was written.
 */
export function applyMemoryBatch(file, budgets, batch = {}) {
  const { profile, error } = readProfile(file);
  if (error) return { ok: false, added: [], removed: 0, message: `Memory profile is unreadable (${error}); nothing was changed.` };
  const limits = {
    user: Number.isFinite(Number(budgets.user)) ? Number(budgets.user) : DEFAULTS.userBudget,
    agent: Number.isFinite(Number(budgets.agent)) ? Number(budgets.agent) : DEFAULTS.agentBudget,
  };
  const known = new Set([...profile.user, ...profile.agent].map((entry) => entry.toLowerCase()));

  let removed = 0;
  for (const item of batch.forget ?? []) {
    const target = item.target === 'user' ? 'user' : 'agent';
    const needle = normalizeEntry(item.text).toLowerCase();
    if (needle.length === 0) continue;
    const kept = profile[target].filter((entry) => !entry.toLowerCase().includes(needle));
    removed += profile[target].length - kept.length;
    for (const dropped of profile[target]) if (!kept.includes(dropped)) known.delete(dropped.toLowerCase());
    profile[target] = kept;
  }

  const added = [];
  for (const item of batch.add ?? []) {
    const text = normalizeEntry(item.text);
    if (text.length === 0) continue;
    const target = item.target === 'user' ? 'user' : 'agent';
    if (known.has(text.toLowerCase())) continue;
    const overflow = budgetOverflow(profile[target], limits[target], text);
    if (overflow) return { ok: false, added: [], removed: 0, message: overflowMessage(target, overflow), profile };
    profile[target].push(text);
    known.add(text.toLowerCase());
    added.push({ target, text });
  }

  if (added.length > 0 || removed > 0) writeProfile(file, profile);
  return { ok: true, added, removed, profile, message: `Applied ${added.length} addition(s) and ${removed} removal(s).` };
}

/** Hindsight provides scores under a small shape; treat an absent score as relevant. */
function scoreOf(result) {
  const scores = result && result.scores;
  if (!scores || typeof scores !== 'object') return 1;
  for (const key of ['final', 'reranker', 'retrieval']) {
    if (typeof scores[key] === 'number') return scores[key];
  }
  return 1;
}

/** Read a small JSON document, returning undefined when absent or malformed. */
function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

/** Write a small JSON document atomically with 0600 permissions. */
function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temp, file);
}

/**
 * Record one semantic failure.
 *
 * The alert is what turns a silent retain failure (a depleted key, a dead
 * daemon) into something the next prompt can mention.
 * @param config - resolved config.
 * @param scope - 'retain' | 'recall'.
 * @param message - failure text.
 */
function recordAlert(config, scope, message) {
  const current = readJson(config.alertsPath);
  const alerts = Array.isArray(current?.alerts) ? current.alerts : [];
  alerts.push({ at: new Date().toISOString(), scope, message: String(message || '').slice(0, 400) });
  writeJson(config.alertsPath, { version: 1, alerts: alerts.slice(-ALERT_LIMIT) });
  updateStatus(config, { healthy: false, lastError: String(message || '').slice(0, 400) });
}

/** Remove resolved alerts for one scope. */
function clearAlert(config, scope) {
  const current = readJson(config.alertsPath);
  if (!Array.isArray(current?.alerts)) return;
  const alerts = current.alerts.filter((alert) => alert.scope !== scope);
  if (alerts.length === 0) {
    try {
      writeJson(config.alertsPath, { version: 1, alerts: [] });
    } catch {
      // Losing the alert file is not worth failing a turn over.
    }
    return;
  }
  writeJson(config.alertsPath, { version: 1, alerts });
}

/**
 * Whether a semantic failure is worth telling the prompt about.
 * @param config - resolved config.
 * @returns true when a retain alert exists.
 */
export function hasRetainAlert(config) {
  const current = readJson(config.alertsPath);
  return Array.isArray(current?.alerts) && current.alerts.some((alert) => alert.scope === 'retain');
}

/**
 * Merge a patch into memory/status.json.
 *
 * Doctor and the startup log read this instead of parsing YAML, so the plugin
 * stays the single source of truth for its own resolved configuration.
 * @param config - resolved config.
 * @param patch - fields to merge.
 */
function updateStatus(config, patch) {
  // `previous` first: a field that already exists in the file must never
  // freeze a stale value over the freshly resolved config — otherwise a row
  // change (new bank or URL) would be ignored and `checkedAt` would stop
  // advancing after the first ever write.
  const previous = readJson(config.statusPath) ?? {};
  writeJson(config.statusPath, {
    ...previous,
    version: 1,
    bank: config.bankId,
    apiUrl: config.apiUrl,
    semantic: config.apiUrl !== '',
    profilePath: config.profilePath,
    userBudget: config.userBudget,
    agentBudget: config.agentBudget,
    checkedAt: new Date().toISOString(),
    allowBanks: config.allowBanks,
    denyBanks: config.denyBanks,
    ...patch,
  });
}

/**
 * Probe Hindsight health and bank stats, then record them.
 *
 * Best effort: a failed probe records the failure and never throws into boot.
 * @param config - resolved config.
 * @returns whether the daemon answered healthy.
 */
export async function probeHealth(config) {
  const started = Date.now();
  // A local daemon under consolidation can miss a 2s probe while answering in
  // 2ms a second later. One retry separates "busy" from "down"; the timeout is
  // roomy because this runs once, at boot, and only decides a diagnostic field.
  let response;
  let body;
  for (let attempt = 0; ; attempt += 1) {
    try {
      response = await fetch(`${config.apiUrl.replace(/\/+$/, '')}/health`, { signal: AbortSignal.timeout(8000) });
      body = await response.json().catch(() => ({}));
      break;
    } catch (error) {
      if (attempt >= 1) {
        updateStatus(config, { healthy: false, health: 'unreachable', lastError: String((error && error.message) || error).slice(0, 400) });
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  const healthy = response.ok && body.status === 'healthy';
  updateStatus(config, {
    healthy,
    health: body.status ?? 'unknown',
    database: body.database ?? null,
    probeMs: Date.now() - started,
    // A stale failure message next to healthy=true reads as a live problem.
    ...(healthy ? { lastError: null } : {}),
  });
  if (!healthy) return false;
  try {
    const stats = await hindsightFetch(config, `/v1/default/banks/${encodeURIComponent(config.bankId)}/stats`);
    const previous = readJson(config.statusPath) ?? {};
    updateStatus(config, {
      facts: stats.total_nodes ?? null,
      failedOperations: stats.failed_operations ?? null,
      // Historical failures never disappear, so the baseline is what makes a
      // new failure visible without crying wolf on every doctor run.
      failedOperationsBaseline: previous.failedOperationsBaseline ?? stats.failed_operations ?? null,
      pendingOperations: stats.pending_operations ?? null,
      lastWriteAt: stats.last_memory_write_at ?? null,
    });
  } catch (error) {
    warnOnce(`stats:${config.bankId}`, `cannot read bank stats: ${String((error && error.message) || error)}`);
  }
  return true;
}

/**
 * Call the Hindsight REST API with a timeout.
 * @param config - resolved plugin config.
 * @param pathname - API path beginning with `/v1/`.
 * @param init - fetch init (method/body).
 * @returns parsed JSON body.
 */
async function hindsightFetch(config, pathname, init) {
  const url = `${config.apiUrl.replace(/\/+$/, '')}${pathname}`;
  const response = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init && init.headers) },
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`Hindsight ${response.status} on ${pathname}: ${text.slice(0, 300)}`);
    error.status = response.status;
    throw error;
  }
  return text.length > 0 ? JSON.parse(text) : {};
}

/** Semantic recall is available only when an API URL is configured. */
function semanticEnabled(config) {
  return config.apiUrl !== '';
}

/** A transient failure: network, timeout, 408, 429, or 5xx. */
function retryable(error) {
  const status = error && error.status;
  if (typeof status === 'number') return status === 408 || status === 429 || status >= 500;
  return true;
}

/**
 * Store one fact in the configured bank.
 *
 * The client-supplied operation id makes the retry idempotent: re-submitting
 * after a lost acknowledgement returns the original operation instead of
 * extracting the same fact twice.
 * @param config - resolved config.
 * @param content - the fact text.
 * @param tags - Hindsight tags (the curated tracks double as tags).
 * @returns `{ok, operationId?, message?}`; never throws.
 */
export async function retainFact(config, content, tags) {
  if (!semanticEnabled(config)) return { ok: true, skipped: true };
  if (!bankAllowed(config.bankId, config.allowBanks, config.denyBanks)) return { ok: false, message: `bank ${config.bankId} is not allowed` };
  const operationId = randomUUID();
  const body = JSON.stringify({
    items: [{ content, context: 'Assistant conversation with the user', tags }],
    async: true,
    operation_id: operationId,
  });
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await hindsightFetch(config, `/v1/default/banks/${encodeURIComponent(config.bankId)}/memories`, {
        method: 'POST',
        body,
      });
      const id = result.operation_id ?? operationId;
      clearAlert(config, 'retain');
      updateStatus(config, { healthy: true, lastRetainAt: new Date().toISOString(), lastOperationId: id });
      return { ok: true, operationId: id };
    } catch (error) {
      lastError = error;
      if (attempt === 1 || !retryable(error)) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  recordAlert(config, 'retain', String((lastError && lastError.message) || lastError));
  warnOnce(`retain:${String((lastError && lastError.message) || '').slice(0, 60)}`, `retain failed: ${String((lastError && lastError.message) || lastError)}`);
  return { ok: false, message: String((lastError && lastError.message) || lastError) };
}

/**
 * Recall facts by meaning, dropping weak matches so noise stays out of context.
 *
 * The dropped count matters: "nothing matched" and "facts exist but none are
 * close" are different answers, and conflating them once made a working bank
 * look broken.
 * @param config - resolved plugin config.
 * @param query - natural-language query.
 * @returns kept results and how many weaker matches the relevance bar removed.
 */
async function recallFacts(config, query) {
  const started = Date.now();
  try {
    const body = await hindsightFetch(config, `/v1/default/banks/${encodeURIComponent(config.bankId)}/memories/recall`, {
      method: 'POST',
      body: JSON.stringify({ query, max_tokens: config.recallMaxTokens }),
    });
    const results = Array.isArray(body.results) ? body.results : [];
    const kept = results.filter((result) => scoreOf(result) >= config.minScore);
    clearAlert(config, 'recall');
    updateStatus(config, { healthy: true, lastRecallAt: new Date().toISOString(), lastRecallMs: Date.now() - started, lastRecallCount: kept.length });
    return { kept, dropped: results.length - kept.length };
  } catch (error) {
    recordAlert(config, 'recall', String((error && error.message) || error));
    throw error;
  }
}

/**
 * Resolve the Loader row config into the values the plugin uses.
 * @param config - raw row config.
 * @returns resolved config.
 */
function resolveConfig(config) {
  const raw = config || {};
  const profilePath = resolveProfilePath(raw);
  const dir = path.dirname(profilePath);
  return {
    // Empty means semantic memory is not configured. The bounded profile block
    // and the tools still work; Hindsight is opt-in, never a first-run dependency.
    apiUrl: setting(raw.apiUrl) ?? setting(process.env.HINDSIGHT_API_URL) ?? '',
    bankId: setting(raw.bankId) ?? setting(process.env.HINDSIGHT_BANK) ?? 'dsh-assistant',
    profilePath,
    dir,
    statusPath: path.join(dir, 'status.json'),
    alertsPath: path.join(dir, 'alerts.json'),
    userBudget: positiveInt(raw.userBudget, DEFAULTS.userBudget, 20000),
    agentBudget: positiveInt(raw.agentBudget, DEFAULTS.agentBudget, 20000),
    timeoutMs: positiveInt(raw.timeoutMs, DEFAULTS.timeoutMs, 30000),
    recallMaxTokens: positiveInt(raw.recallMaxTokens, DEFAULTS.recallMaxTokens, 4000),
    minScore: numberInRange(raw.minScore, DEFAULTS.minScore, 0, 1),
    allowBanks: list(raw.allowBanks, ALLOWED_BANKS),
    denyBanks: list(raw.denyBanks, DENIED_BANKS),
    probe: raw.probe !== false,
    inject: raw.inject !== false,
  };
}

/** Model-facing text render for a tool result. */
function textResult(text) {
  return [{ type: 'text', text }];
}

/**
 * Build the three tool definitions.
 *
 * Schemas are plain JSON Schema (the shape the registry projects to the model);
 * descriptions stay one or two sentences because every character here is paid on
 * every request.
 * @param ctx - Cordis context.
 * @param config - resolved plugin config.
 * @returns the tool definitions.
 */
function buildTools(ctx, config) {
  const budgets = { user: config.userBudget, agent: config.agentBudget };
  const outputSchema = {
    type: 'object',
    additionalProperties: false,
    properties: { message: { type: 'string' } },
    required: ['message'],
  };

  const remember = {
    name: 'memory_remember',
    description:
      'Store a durable fact about the user or a note to yourself. Use for stated preferences, decisions, people, ongoing projects and corrections. Do not store transient task state or anything already in the memory_profile block.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        text: { type: 'string', description: 'One short, self-contained sentence. No dates needed — Hindsight timestamps it.' },
        target: {
          type: 'string',
          enum: TARGETS,
          description: 'user = about the person; agent = a note to yourself; fact = background knowledge, Hindsight only (not in the prompt block).',
        },
      },
      required: ['text', 'target'],
    },
    output: { schema: outputSchema, render: (_args, value) => textResult(value.message) },
    async execute(args) {
      const text = String(args.text || '').trim();
      if (text.length === 0) return { message: 'Nothing to store: `text` was empty.' };
      const target = TARGETS.includes(args.target) ? args.target : 'fact';

      if (target === 'fact') {
        if (!semanticEnabled(config)) {
          return { message: 'Semantic memory is not configured, so a `fact` cannot be stored. Use target `agent` for a note that belongs in the prompt block.' };
        }
        const retained = await retainFact(config, text, [target]);
        return { message: retained.ok ? 'Stored in Hindsight (recall it with memory_recall).' : 'Hindsight did not accept the fact; it was not stored (the failure is logged).' };
      }

      const result = applyMemoryBatch(config.profilePath, budgets, { add: [{ target, text }] });
      if (!result.ok) return { message: result.message };
      if (result.added.length === 0) return { message: `Already in the ${target} track; nothing to add.` };

      const semantic = semanticEnabled(config);
      if (!semantic) return { message: `Stored in the ${target} track; it is in the prompt block from the next request.` };
      const retained = await retainFact(config, text, [target]);
      return {
        message: retained.ok
          ? `Stored in the ${target} track; the semantic write is queued. It is in the prompt block from the next request.`
          : `Stored in the ${target} track; the semantic write failed and is flagged for the next prompt.`,
      };
    },
  };

  const recall = {
    name: 'memory_recall',
    description:
      'Search long-term memory (Hindsight) by meaning. Use before answering questions about the user, past decisions or earlier work when the memory_profile block does not already cover it.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: { type: 'string', description: 'What you are trying to remember, in natural language.' },
      },
      required: ['query'],
    },
    output: { schema: outputSchema, render: (_args, value) => textResult(value.message) },
    async execute(args) {
      const query = String(args.query || '').trim();
      if (query.length === 0) return { message: 'Nothing to search: `query` was empty.' };
      if (!semanticEnabled(config)) {
        return {
          message:
            'Semantic memory is not configured; the curated memory_profile block is always available, and past sessions can be searched. Set apiUrl in the memory row to enable Hindsight recall.',
        };
      }
      try {
        const { kept, dropped } = await recallFacts(config, query);
        if (kept.length === 0) {
          return {
            message:
              dropped > 0
                ? `No memory passed the relevance bar for "${query}" (${dropped} weaker match${dropped === 1 ? '' : 'es'} dropped). The bank has facts, just none close to this; a more specific query may find them.`
                : `No memories matched "${query}".`,
          };
        }
        const lines = kept.slice(0, 8).map((result, index) => {
          const when = result.occurred_start ? String(result.occurred_start).slice(0, 10) : '';
          const score = typeof result.scores?.final === 'number' ? ` [${result.scores.final.toFixed(2)}]` : '';
          return `${index + 1}. ${when ? `${when} — ` : ''}${String(result.text || '').trim()}${score}`;
        });
        return { message: `Recalled ${kept.length} memories for "${query}":\n${lines.join('\n')}` };
      } catch (error) {
        return {
          message: `Memory recall failed (${String((error && error.message) || error)}). Continue without it and say so if the answer depends on memory.`,
        };
      }
    },
  };

  const forget = {
    name: 'memory_forget',
    description:
      'Remove an entry from the curated memory_profile (user or agent track). Use when a fact stopped being true or the user asks you to forget it. Hindsight keeps a historical record; this removes it from the always-on block.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        text: { type: 'string', description: 'The entry to remove — a distinctive prefix is enough.' },
        target: { type: 'string', enum: ['user', 'agent'], description: 'Which curated track to remove it from.' },
      },
      required: ['text', 'target'],
    },
    output: { schema: outputSchema, render: (_args, value) => textResult(value.message) },
    async execute(args) {
      const needle = String(args.text || '').trim();
      const target = args.target === 'user' ? 'user' : 'agent';
      if (needle.length === 0) return { message: 'Nothing to forget: `text` was empty.' };
      const result = applyMemoryBatch(config.profilePath, budgets, { forget: [{ target, text: needle }] });
      if (!result.ok) return { message: result.message };
      if (result.removed === 0) return { message: `No ${target} entry matched "${args.text}".` };
      return { message: `Removed ${result.removed} ${target} entr${result.removed === 1 ? 'y' : 'ies'} from the prompt block.` };
    },
  };

  return [remember, recall, forget];
}

/**
 * Register the profile section and the three memory tools.
 * @param ctx - Cordis context carrying `systemPrompt` and `tools`.
 * @param config - Loader row config.
 */
export function apply(ctx, config) {
  const resolved = resolveConfig(config);
  if (semanticEnabled(resolved) && !bankAllowed(resolved.bankId, resolved.allowBanks, resolved.denyBanks)) {
    console.error(
      `[dsh-memory] refusing bank "${resolved.bankId}": allowed banks are ${resolved.allowBanks.join(', ')}; ` +
        'no memory tools or prompt block registered',
    );
    return;
  }
  const loaded = readProfile(resolved.profilePath);
  if (loaded.error) {
    warnOnce(`profile:${resolved.profilePath}`, `cannot read ${resolved.profilePath} (${loaded.error}); starting from an empty profile`);
  }

  if (resolved.inject) {
    const allocated = typeof ctx.systemPrompt.getSectionOrder === 'function'
      ? ctx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA_PREFIX')
      : undefined;
    const order = Number.isFinite(allocated) ? allocated + 1 : 1;
    ctx.effect(() => {
      // `text` is a function on purpose: the registry renders it per request, so
      // a write through the tools shows up in this session instead of only after
      // a restart. The file is small and read synchronously; a failed read
      // degrades to an empty block and never throws into prompt assembly.
      const dispose = ctx.systemPrompt.section({
        name: SECTION_NAME,
        order,
        text: () =>
          profileSectionText(resolved.profilePath, {
            budgets: { userBudget: resolved.userBudget, agentBudget: resolved.agentBudget },
            semantic: semanticEnabled(resolved),
            alert: semanticEnabled(resolved) && hasRetainAlert(resolved),
          }),
        interpolate: false,
      });
      return () => void dispose();
    }, 'dsh-memory: profile section');
  }

  for (const tool of buildTools(ctx, resolved)) ctx.tools.register(tool);

  if (semanticEnabled(resolved)) {
    const cached = readJson(resolved.statusPath) ?? {};
    updateStatus(resolved, { semantic: true });
    if (resolved.probe) void probeHealth(resolved);
    console.error(
      `[dsh-memory] bank=${resolved.bankId} semantic=${resolved.apiUrl} profile=${resolved.profilePath} ` +
        `entries=${loaded.profile.user.length}user/${loaded.profile.agent.length}agent budgets=${resolved.userBudget}/${resolved.agentBudget} ` +
        `health=${cached.healthy === true ? 'healthy' : 'probing'}`,
    );
  } else {
    updateStatus(resolved, { semantic: false, healthy: null, facts: null, failedOperations: null, lastError: null });
    console.error(
      `[dsh-memory] bank=${resolved.bankId} semantic=off profile=${resolved.profilePath} ` +
        `entries=${loaded.profile.user.length}user/${loaded.profile.agent.length}agent budgets=${resolved.userBudget}/${resolved.agentBudget}`,
    );
  }
}
