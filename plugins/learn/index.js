/**
 * dsh-learn — background self-improvement for an assistant.
 *
 * WHY THIS EXISTS
 * The memory plugin can store what the model is told to store, but an assistant
 * should notice a correction or a durable fact on its own. Hermes runs
 * a review after each turn that writes memory and creates/patches skills; the
 * harness already exposes the seams for the same loop: durable `turn/end`
 * events, `ctx.llm.stream()` for an auxiliary call, skills as plain files under
 * `$DSH_HOME/skills`, and the memory plugin's own write helpers.
 *
 * DESIGN RULES
 *  - Automatic, not approval-based: the user asked for as little friction as
 *    possible. Writes are confined to $DSH_HOME/{memory,skills,learning}; the
 *    plugin never edits identity files, profile config, or host state.
 *  - Propose from the turn, not from tool output: the digest carries the user's
 *    words, the assistant's final text and tool *names*, never tool results.
 *    That is the prompt-injection boundary.
 *  - Bounded: only turns with enough human text or a correction marker get a
 *    model call, at most one review per few minutes, with hard input/output and
 *    skill caps.
 *  - One implementation: memory writes go through the memory plugin's
 *    `applyMemoryBatch`, so budgets, duplicates and the profile lock behavior do
 *    not fork.
 *  - Every write is auditable and reversible: an audit JSONL entry, a backup of
 *    every replaced skill, and no automatic deletion of a skill.
 *  - One dim line, never a job: a completed review appends one ignorable
 *    `plugin:dsh-learn/learned` session record, and the plugin's client half
 *    draws it as a muted footnote under that turn. A plugin record never
 *    enters the model-visible surface, and it replaces the old fake job row
 *    that put a "background job" counter in every session header. Quiet turns
 *    append nothing at all.
 *
 * @module @local/dsh-learn
 */

import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyMemoryBatch, readProfile, retainFact } from '../memory/index.js';

/** This plugin's Loader row id / Cordis plugin name. */
export const name = 'dsh-learn';

/** The model-call service is the only registry this plugin needs. */
export const inject = ['llm'];

/** Defaults; every value is overridable from the Loader row config. */
const DEFAULTS = {
  timeoutMs: 20000,
  maxTokens: 1500,
  maxInputChars: 8000,
  maxMemory: 3,
  minUserChars: 80,
  minToolCalls: 8,
  minAssistantChars: 700,
  minIntervalMs: 300000,
  maxPerHour: 6,
  maxSkillBytes: 8192,
  maxSkillWritesPerHour: 1,
  maxSkillWritesPerDay: 3,
  maxSkills: 200,
};

/** A turn is worth reviewing when the user stated something durable. */
const CORRECTION_RE = /\b(actually|remember|from now on|i prefer|i'd rather|do not|don't|never|always|next time|not quite|wrong|keep it|cancel that)\b/i;

/** Narrow secret shapes; a false positive costs one skipped memory, a leak costs everything. */
const SECRET_RE = /sk-[A-Za-z0-9]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{10,}/;

/** Instructions that must never be persisted as a skill (future-turn injection). */
const INJECTION_RE = /ignore (all |the )?(previous|prior|above) instructions|disregard (all|previous)|you are now|system prompt|developer message/i;

/** Injected user-role content that is not the human speaking. */
const SKIP_PREFIXES = ['<system-reminder', 'Time sampled while preparing'];

/** One turn's review state, keyed by session id. */
const turns = new Map();
/** Reviews in flight, so a test (and shutdown) can wait for them. */
const inflight = new Set();
/** Global rate limits; in-memory because a restart is a natural reset. */
let reviewTimes = [];
let skillTimes = [];
/** Warnings are once per process per cause. */
const warned = new Set();

/**
 * Emit one warning per key. stderr, because the Host log is the local sink.
 * @param key - dedupe key.
 * @param message - text to log once.
 */
function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[dsh-learn] ${message}`);
}

/** This process's DSH home. */
function dshHome() {
  return process.env.DSH_HOME ? path.resolve(process.env.DSH_HOME) : path.join(os.homedir(), '.dsh');
}

/** A non-empty trimmed string, or undefined. */
function setting(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** A non-negative integer within a ceiling, else the fallback. */
function nonNegativeInt(value, fallback, ceiling) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(number) || number < 0) return fallback;
  return Math.min(number, ceiling);
}

/** Resolve a configured path: `~/`, absolute, or relative to the home. */
function resolvePath(value, home) {
  if (!value) return undefined;
  const expanded = value.startsWith('~/') ? path.join(os.homedir(), value.slice(2)) : value;
  return path.isAbsolute(expanded) ? path.resolve(expanded) : path.resolve(home, expanded);
}

/** Read a small JSON document, returning undefined when absent or malformed. */
function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

/** Collapse whitespace so entries and comparisons stay stable. */
function normalize(text) {
  return String(text ?? '').trim().replace(/\s+/g, ' ');
}

/**
 * Resolve the Loader row config.
 * @param raw - row config.
 * @returns resolved config.
 */
function resolveConfig(raw = {}) {
  const home = dshHome();
  const status = readJson(path.join(home, 'memory', 'status.json')) ?? {};
  return {
    enabled: raw.enabled !== false,
    home,
    profilePath: resolvePath(setting(raw.profilePath), home) ?? status.profilePath ?? path.join(home, 'memory', 'profile.json'),
    userBudget: nonNegativeInt(raw.userBudget, status.userBudget ?? 2200, 20000),
    agentBudget: nonNegativeInt(raw.agentBudget, status.agentBudget ?? 4000, 20000),
    skillsDir: resolvePath(setting(raw.skillsDir), home) ?? path.join(home, 'skills'),
    auditPath: path.join(home, 'learning', 'audit.jsonl'),
    provider: setting(raw.provider),
    model: setting(raw.model),
    timeoutMs: nonNegativeInt(raw.timeoutMs, DEFAULTS.timeoutMs, 60000) || DEFAULTS.timeoutMs,
    maxTokens: nonNegativeInt(raw.maxTokens, DEFAULTS.maxTokens, 2000) || DEFAULTS.maxTokens,
    maxInputChars: nonNegativeInt(raw.maxInputChars, DEFAULTS.maxInputChars, 20000) || DEFAULTS.maxInputChars,
    maxMemory: nonNegativeInt(raw.maxMemory, DEFAULTS.maxMemory, 5) || DEFAULTS.maxMemory,
    minUserChars: nonNegativeInt(raw.minUserChars, DEFAULTS.minUserChars, 4000),
    minToolCalls: nonNegativeInt(raw.minToolCalls, DEFAULTS.minToolCalls, 500),
    minAssistantChars: nonNegativeInt(raw.minAssistantChars, DEFAULTS.minAssistantChars, 20000),
    minIntervalMs: nonNegativeInt(raw.minIntervalMs, DEFAULTS.minIntervalMs, 3600000),
    maxPerHour: nonNegativeInt(raw.maxPerHour, DEFAULTS.maxPerHour, 60) || DEFAULTS.maxPerHour,
    maxSkillBytes: nonNegativeInt(raw.maxSkillBytes, DEFAULTS.maxSkillBytes, 32768) || DEFAULTS.maxSkillBytes,
    maxSkillWritesPerHour: nonNegativeInt(raw.maxSkillWritesPerHour, DEFAULTS.maxSkillWritesPerHour, 10),
    maxSkillWritesPerDay: nonNegativeInt(raw.maxSkillWritesPerDay, DEFAULTS.maxSkillWritesPerDay, 50),
    maxSkills: nonNegativeInt(raw.maxSkills, DEFAULTS.maxSkills, 2000) || DEFAULTS.maxSkills,
    // Programmatic seam for the self-test; a Loader row cannot express a function.
    appendRecord: typeof raw.appendRecord === 'function' ? raw.appendRecord : undefined,
  };
}

/**
 * Is a turn worth a model call?
 * @param text - the human text of the turn.
 * @param minChars - configured floor.
 * @returns whether to review.
 */
export function looksReviewable(text, minChars = DEFAULTS.minUserChars) {
  const value = normalize(text);
  if (value.length === 0) return false;
  return value.length >= minChars || CORRECTION_RE.test(value);
}

/**
 * Did this turn do enough work to be worth reviewing even when the human said
 * little? A one-line "make me a slide" that ran 77 tool calls is exactly the
 * turn whose procedures and preferences are worth keeping, and the text gate
 * alone never sees it. Tool *names* are all this looks at, so the injection
 * boundary is unchanged.
 *
 * @param {object} turn - the captured turn.
 * @param {object} [limits] - configured floors.
 * @returns {boolean} whether the turn qualifies.
 */
export function isSubstantialTurn(turn, limits = {}) {
  const minToolCalls = limits.minToolCalls ?? DEFAULTS.minToolCalls;
  const minAssistantChars = limits.minAssistantChars ?? DEFAULTS.minAssistantChars;
  const toolCalls = Array.isArray(turn?.tools) ? turn.tools.length : 0;
  const assistantChars = (turn?.assistantTexts ?? []).join('\n').trim().length;
  return (minToolCalls > 0 && toolCalls >= minToolCalls) || (minAssistantChars > 0 && assistantChars >= minAssistantChars);
}

/**
 * Build the review digest: the user's words, the final answer, tool names only.
 * @param turn - the captured turn.
 * @param limits - optional character caps.
 * @returns a bounded digest string.
 */
export function buildDigest(turn, limits = {}) {
  const user = (turn.userTexts ?? []).slice(-2).join('\n---\n').slice(0, limits.userChars ?? 2500);
  const assistant = (turn.assistantTexts ?? []).filter(Boolean).at(-1)?.slice(0, limits.assistantChars ?? 2500) ?? '';
  const tools = (turn.tools ?? [])
    .slice(-(limits.tools ?? 20))
    .map((tool) => `${tool.name}${tool.error ? ' (error)' : ''}`)
    .join(', ');
  return [
    '<turn>',
    `User: ${user || '(none)'}`,
    `Assistant: ${assistant || '(none)'}`,
    `Tools: ${tools || '(none)'}`,
    '</turn>',
  ].join('\n');
}

/**
 * Extract a JSON object from a model reply that may carry prose or fences.
 * @param raw - model text.
 * @returns the parsed object, or null.
 */
export function parseReview(raw) {
  const text = String(raw ?? '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Validate and bound one review.
 *
 * The model is untrusted input: lengths, names, secrets and injection-shaped
 * prose are checked here, before anything touches the profile or the skills
 * directory.
 * @param parsed - the parsed JSON.
 * @param options - limits.
 * @returns `{memory, forget, skill, errors}` with invalid items dropped.
 */
export function validateReview(parsed, options = {}) {
  const maxMemory = options.maxMemory ?? DEFAULTS.maxMemory;
  const maxSkillBytes = options.maxSkillBytes ?? DEFAULTS.maxSkillBytes;
  const result = { memory: [], forget: [], skill: null, errors: [] };
  if (!parsed || typeof parsed !== 'object') {
    result.errors.push('reply was not a JSON object');
    return result;
  }

  const entries = (value, limit) => (Array.isArray(value) ? value.slice(0, limit) : []);
  for (const item of entries(parsed.memory, maxMemory)) {
    const text = normalize(item?.text);
    const target = item?.target === 'user' ? 'user' : 'agent';
    if (text.length < 3 || text.length > 400) {
      result.errors.push('memory text out of range');
      continue;
    }
    if (SECRET_RE.test(text)) {
      result.errors.push('memory looks like a secret');
      continue;
    }
    result.memory.push({ target, text });
  }
  for (const item of entries(parsed.forget, maxMemory)) {
    const text = normalize(item?.text);
    if (text.length < 3 || text.length > 200) {
      result.errors.push('forget text out of range');
      continue;
    }
    result.forget.push({ target: item?.target === 'user' ? 'user' : 'agent', text });
  }

  if (parsed.skill && typeof parsed.skill === 'object') {
    const name = normalize(parsed.skill.name);
    const description = normalize(parsed.skill.description);
    const when = normalize(parsed.skill.when);
    const body = String(parsed.skill.body ?? '').trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
      result.errors.push('skill name is not kebab-case');
    } else if (description.length < 10 || description.length > 200) {
      result.errors.push('skill description out of range');
    } else if (body.length < 40) {
      result.errors.push('skill body is too short');
    } else if (Buffer.byteLength(body) > maxSkillBytes) {
      result.errors.push('skill body is too large');
    } else if (SECRET_RE.test(body)) {
      result.errors.push('skill body looks like a secret');
    } else if (INJECTION_RE.test(body)) {
      result.errors.push('skill body looks like prompt injection');
    } else if (result.memory.length === 0 && result.errors.length === 0) {
      // A skill without any supporting fact is usually a hallucinated procedure.
      result.errors.push('skill without a supporting memory');
    } else {
      // An over-long `when` costs the skill its trigger line, not the skill: the
      // description is the fallback the composer uses.
      result.skill = { name, description, when: when.length > 0 && when.length <= 200 ? when : '', body };
    }
  }
  return result;
}

/** Count current skills (directories that are not the history store). */
export function countSkills(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory() && !entry.name.startsWith('.')).length;
  } catch {
    return 0;
  }
}

/**
 * The frontmatter line that marks a skill this plugin wrote.
 *
 * DSH discovers skills exactly one directory level below `$DSH_HOME/skills`
 * (`<root>/<name>/SKILL.md` or `<root>/<name>.md`), so a `learned/` subdirectory
 * would never be read; learned skills therefore stay at the top level and carry
 * their provenance inside the file itself. A skill without this marker was not
 * written by learn, and learn must not overwrite it.
 */
export const LEARN_MARKER = 'learned-by: dsh-learn';

/**
 * The house skill shape both the curated tree and learned skills use: a
 * `trigger-tests.json` stub flags a draft that still needs real fixtures.
 */
export const TRIGGER_TESTS_STUB = { should_fire: [], should_not_fire: [] };

/**
 * Does this skill file's frontmatter carry learn's provenance marker?
 * @param text - the skill file contents.
 * @returns whether learn wrote it.
 */
export function hasLearnMarker(text) {
  const raw = String(text ?? '');
  if (!raw.startsWith('---')) return false;
  const end = raw.indexOf('\n---', 3);
  const frontmatter = end < 0 ? '' : raw.slice(0, end);
  return frontmatter.split('\n').some((line) => line.trim() === LEARN_MARKER);
}

/**
 * Does the audit log record a skill write by learn under this directory?
 *
 * The marker in the file is the primary provenance signal; the audit log is the
 * fallback for skills learn wrote before the marker existed. Both rotated and
 * live audit files are read, because a rotation must not turn a learned skill
 * into a foreign one and trigger a spurious rename.
 * @param auditPath - the audit JSONL path.
 * @param dir - the skills directory.
 * @param name - the skill name.
 * @returns whether learn wrote that skill.
 */
export function auditShowsSkill(auditPath, dir, name) {
  if (!auditPath) return false;
  const root = path.resolve(dir);
  for (const file of [auditPath, `${auditPath}.1`]) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split('\n')) {
      if (line.trim().length === 0) continue;
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }
      if (entry?.ok !== true || entry.skill?.name !== name) continue;
      if (typeof entry.skill.file !== 'string') continue;
      if (path.resolve(entry.skill.file).startsWith(`${root}${path.sep}`)) return true;
    }
  }
  return false;
}

/**
 * Is the existing skill at `<dir>/<name>` one learn may replace?
 * @param options - `{dir, name, auditPath}`.
 * @returns true only for a skill learn authored.
 */
export function isLearnAuthored({ dir, name, auditPath }) {
  let existing;
  try {
    existing = readFileSync(path.join(dir, name, 'SKILL.md'), 'utf8');
  } catch {
    return false;
  }
  return hasLearnMarker(existing) || auditShowsSkill(auditPath, dir, name);
}

/**
 * Whether anything already answers to this name in a skills root.
 *
 * DSH discovers both `<root>/<name>/SKILL.md` and a flat `<root>/<name>.md`, so
 * a name is taken by either shape.
 * @param dir - the skills root.
 * @param name - the skill name.
 * @returns whether the name is occupied.
 */
function skillNameTaken(dir, name) {
  return existsSync(path.join(dir, name)) || existsSync(path.join(dir, `${name}.md`));
}

/**
 * The name to write under: unchanged when free, else the first `<name>-N`.
 * @param dir - the skills directory.
 * @param name - the proposed skill name.
 * @param limit - how many suffixes to try.
 * @returns the free name, or null when every suffix is taken.
 */
export function freeSkillName(dir, name, limit = 100) {
  if (!skillNameTaken(dir, name)) return name;
  for (let suffix = 2; suffix <= limit; suffix += 1) {
    const candidate = `${name}-${suffix}`;
    if (!skillNameTaken(dir, candidate)) return candidate;
  }
  return null;
}

/**
 * Render one skill file in the repo's house shape.
 *
 * A curated skill is frontmatter `name` + `description` (what and when), an H1,
 * a `## When to use` section, then the procedure, with a `trigger-tests.json`
 * beside it. The model supplies the procedure and the two descriptions; the
 * wrapper supplies the structure — and the provenance marker, because the
 * house shape is what the on-demand skills system already reads.
 * @param options - `{name, description, when, body}`.
 * @returns the SKILL.md text.
 */
export function composeSkillMarkdown({ name, description, when, body }) {
  const procedure = String(body ?? '').trim();
  const trigger = normalize(when) || normalize(description);
  // "supplier-research" -> "Supplier research", the sentence-case H1 the
  // curated tree uses. A body that already opens with its own H1 keeps it.
  const title = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
  const lines = ['---', `name: ${name}`, `description: ${normalize(description)}`, LEARN_MARKER, '---', ''];
  if (!/^#\s/.test(procedure)) lines.push(`# ${title}`, '');
  if (!/^##\s+when to use\b/im.test(procedure)) lines.push('## When to use', '', trigger, '');
  lines.push(procedure, '');
  return lines.join('\n');
}

/**
 * Write one skill, keeping a bounded history of the version it replaced.
 *
 * A colliding name is only a collision when the existing skill was NOT written
 * by learn: the curation loop may replace its own output, but a user's or a
 * pack's skill is never overwritten. A foreign collision is written under the
 * first free `<name>-N` and reported back as `renamedFrom`.
 * @param options - `{dir, name, description, when, body, keep, auditPath}`.
 * @returns `{file, backup, name, renamedFrom}`; `file:null` when no name is free.
 */
export function writeSkill({ dir, name, description, when, body, keep = 5, auditPath }) {
  const occupied = skillNameTaken(dir, name);
  const target = occupied && !isLearnAuthored({ dir, name, auditPath }) ? freeSkillName(dir, name) : name;
  if (target === null) return { file: null, backup: null, name: null, renamedFrom: name };

  const skillDir = path.join(dir, target);
  const file = path.join(skillDir, 'SKILL.md');
  mkdirSync(skillDir, { recursive: true, mode: 0o700 });
  let backup = null;
  if (existsSync(file)) {
    const history = path.join(dir, '.history', target);
    mkdirSync(history, { recursive: true, mode: 0o700 });
    backup = path.join(history, `${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    copyFileSync(file, backup);
    const old = readdirSync(history).filter((entry) => entry.endsWith('.md')).sort();
    for (const stale of old.slice(0, Math.max(0, old.length - keep))) {
      try {
        unlinkSync(path.join(history, stale));
      } catch {
        // A stale history file is not worth failing a write over.
      }
    }
  }
  const text = composeSkillMarkdown({ name: target, description, when, body });
  // Temp-then-rename like every other store in this repo: a crash mid-write
  // would otherwise corrupt the skill, and a first write has no backup.
  const temp = `${file}.${process.pid}.tmp`;
  writeFileSync(temp, text, { mode: 0o600 });
  renameSync(temp, file);
  // The stub marks a draft: learn cannot write honest fixtures, and its
  // existence is what asks a curator to fill them in. An existing file is
  // curation work and is never replaced.
  const triggers = path.join(skillDir, 'trigger-tests.json');
  if (!existsSync(triggers)) writeFileSync(triggers, `${JSON.stringify(TRIGGER_TESTS_STUB, null, 2)}\n`, { mode: 0o600 });
  return { file, backup, name: target, renamedFrom: target === name ? null : name };
}

/** Append one audit record, rotating a file that grew past 2 MB. */
function audit(config, entry) {
  mkdirSync(path.dirname(config.auditPath), { recursive: true, mode: 0o700 });
  try {
    if (statSync(config.auditPath).size > 2_000_000) renameSync(config.auditPath, `${config.auditPath}.1`);
  } catch {
    // No previous audit file.
  }
  appendFileSync(config.auditPath, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`, { mode: 0o600 });
}

/**
 * The session record the client half renders. The type must stay under the
 * `plugin:` grammar and match `RECORD` in client.js.
 */
export const NOTICE_RECORD = 'plugin:dsh-learn/learned';

/** Resolved once: the Host's own `appendPluginRecord`. */
let recordAppender;

/**
 * Resolve `appendPluginRecord` from the Host's session package.
 *
 * Shipped packages resolve from the dsh installation, but only a bundle that
 * declares one as a peer is routed there when it lives outside the profile
 * (the Loader intercepts this import); the installed copy is the module
 * instance — and `Session` class — the Host already uses. Plain Node (the
 * self-test) has no such route, so a miss degrades to audit-only learning.
 * @returns the appender, or null when this composition cannot record notices.
 */
async function appenderForNotices() {
  if (recordAppender !== undefined) return recordAppender;
  try {
    const module = await import('@deepseek-ai/dsh-session');
    recordAppender = typeof module.appendPluginRecord === 'function' ? module.appendPluginRecord : null;
    if (recordAppender === null) warnOnce('notice-record', 'session module has no appendPluginRecord; notices stay audit-only');
  } catch (error) {
    recordAppender = null;
    const detail = (error && (error.code || error.message)) || error;
    warnOnce('notice-record', `session module unavailable (${String(detail).slice(0, 120)}); notices stay audit-only`);
  }
  return recordAppender;
}

/**
 * The display-only payload for one completed review: counts, a skill name and —
 * when it happened — a rename or a lost review. Never the stored text.
 * @param turnId - the turn the review observed.
 * @param applied - what the review wrote, plus optional `renamedFrom` /
 *   `failure` keys the caller derives from the write and the model replies.
 * @returns a small JSON payload.
 */
export function learnedNotice(turnId, applied) {
  const notice = {
    v: 1,
    turn: Number.isSafeInteger(turnId) ? turnId : 0,
    memory: applied.memory.length,
    forget: applied.forget,
    skill: applied.skill?.name ?? null,
  };
  // Keep the payload minimal: only a review that has something extra to say
  // carries the extra fields, so an ordinary notice stays byte-identical.
  if (applied.skill?.renamedFrom) notice.renamed = String(applied.skill.renamedFrom);
  if (applied.failure) notice.failure = String(applied.failure);
  return notice;
}

/**
 * Append the notice record after a review changed something.
 *
 * A record that cannot be written (the session closed while the auxiliary
 * model call ran) is dropped: the audit log already holds the change, and a
 * notice is never worth failing a review over. The appender argument exists so
 * the self-test can assert the append without a live Host.
 * @param session - the observed Session.
 * @param notice - the payload from {@link learnedNotice}.
 * @param append - optional appender override.
 * @returns whether a record was committed.
 */
export async function recordLearned(session, notice, append) {
  const writer = append ?? (await appenderForNotices());
  if (typeof writer !== 'function' || !session) return false;
  try {
    writer(session, NOTICE_RECORD, notice);
    return true;
  } catch (error) {
    const detail = String((error && (error.message || error.code)) || error).slice(0, 120);
    warnOnce(`notice-append:${detail.slice(0, 60)}`, `notice record skipped: ${detail}`);
    return false;
  }
}

/** The semantic write config, or null when Hindsight is not configured. */
function semanticConfig(config) {
  const status = readJson(path.join(config.home, 'memory', 'status.json'));
  if (!status || status.semantic !== true || !status.apiUrl || !status.bank) return null;
  return {
    apiUrl: status.apiUrl,
    bankId: status.bank,
    allowBanks: [status.bank],
    denyBanks: Array.isArray(status.denyBanks) ? status.denyBanks : [],
    timeoutMs: config.timeoutMs,
    profilePath: config.profilePath,
    statusPath: path.join(config.home, 'memory', 'status.json'),
    alertsPath: path.join(config.home, 'memory', 'alerts.json'),
    userBudget: config.userBudget,
    agentBudget: config.agentBudget,
  };
}

/** Whether the hourly/daily skill-write caps allow another write. */
function skillBudgetAllows(config) {
  const now = Date.now();
  skillTimes = skillTimes.filter((time) => now - time < 24 * 60 * 60 * 1000);
  const lastHour = skillTimes.filter((time) => now - time < 60 * 60 * 1000).length;
  return lastHour < config.maxSkillWritesPerHour && skillTimes.length < config.maxSkillWritesPerDay;
}

/** Whether the global review rate limits allow another call. */
function reviewBudgetAllows(config) {
  const now = Date.now();
  reviewTimes = reviewTimes.filter((time) => now - time < 60 * 60 * 1000);
  if (reviewTimes.length >= config.maxPerHour) return false;
  const last = reviewTimes.at(-1);
  return last === undefined || now - last >= config.minIntervalMs;
}

/** Instructions the curator model reads once per review. */
function systemPrompt(maxMemory) {
  return [
    'You are the background curator for an assistant.',
    'Read one completed turn and reply with JSON only, no prose.',
    'Record only durable, user-relevant facts: stated preferences, decisions, corrections, people, projects and constraints.',
    'Never record transient task state, tool output, credentials, or anything already present in the memory profile.',
    'When the turn taught a repeatable procedure the user will want again, propose one skill: a short self-contained SKILL.md body, not a diary. A skill must be supported by a memory entry in the same reply.',
    'Return: {"memory":[{"target":"user"|"agent","text":"..."}],"forget":[{"target":"user"|"agent","text":"..."}],"skill":{"name":"kebab-case","description":"what it does and when to reach for it, one line","when":"the situation that should trigger it, one line","body":"markdown procedure only — no frontmatter, no When-to-use heading"}|null}',
    `At most ${maxMemory} memory entries, ${maxMemory} forgets and 1 skill. Empty arrays when nothing qualifies.`,
    'Keep the reply under 1400 tokens: memory text under 200 characters, skill body under 2500 characters (about 50 lines). A cut-off reply is discarded.',
  ].join('\n');
}

/**
 * The reduced retry prompt: same contract, less input.
 *
 * The first reply hit the token ceiling, so the retry drops the existing-skills
 * list and hard-caps the digest; `memoryOnly` is the last resort, which asks for
 * one memory decision and no skill so a small object must survive the ceiling.
 * @param turn - the captured turn.
 * @param config - resolved config.
 * @param options - whether this is the memory-only fallback, and the profile text.
 * @returns the user content for the retry.
 */
export function reducedPrompt(turn, config, { memoryOnly = false, memoryBlock = '(empty)' } = {}) {
  const digest = buildDigest(turn, memoryOnly ? { userChars: 600, assistantChars: 300, tools: 5 } : { userChars: 1200, assistantChars: 900, tools: 10 });
  const block = memoryBlock.slice(0, memoryOnly ? 800 : 1500);
  const ceiling = memoryOnly ? 1200 : 3000;
  return [`<memory_profile>\n${block}\n</memory_profile>`, digest].join('\n').slice(0, Math.min(ceiling, config.maxInputChars));
}

/** System prompt for the memory-only fallback: the smallest decision that still saves the turn. */
function memoryOnlyPrompt() {
  return [
    'You are the background curator for an assistant.',
    'The previous reply was cut off, so answer the smallest useful question.',
    'Reply with JSON only: {"memory":[{"target":"user"|"agent","text":"..."}]} holding at most one durable fact, or {"memory":[]}.',
    'No forget list, no skill. Keep the whole reply under 120 characters of JSON.',
  ].join('\n');
}

/**
 * Run one auxiliary model call and collect its text.
 * @param ctx - Cordis context with the llm service.
 * @param options - `{route, sessionId, system, input, config, purpose}`.
 * @returns the collected text and finish reason.
 */
async function callReviewModel(ctx, { route, sessionId, system, input, config, purpose }) {
  let output = '';
  let finish;
  const signal = AbortSignal.timeout(config.timeoutMs);
  const stream = ctx.llm.stream({
    provider: route.provider,
    model: route.model,
    // The routed provider needs the session identity on the request; the loop
    // stamps it for conversation calls and an auxiliary call must do the same.
    sessionId,
    system,
    messages: [{ role: 'user', content: [{ type: 'text', text: input }] }],
    maxTokens: config.maxTokens,
    signal,
    purpose,
  });
  for await (const chunk of stream) {
    if (chunk.type === 'text-delta') output += chunk.text;
    else if (chunk.type === 'finish') finish = chunk.reason;
  }
  return { output, finish };
}

/** Whether a finish reason represents a hard failure worth aborting the review. */
function hardFailure(finish) {
  const truncated = finish?.kind === 'max-tokens';
  if (!finish) return 'finish missing';
  if (finish.kind === 'stop' || truncated) return null;
  const failure = finish.failure;
  return failure ? `${failure.code ?? 'LLM_ERROR'}: ${String(failure.message ?? '').slice(0, 200)}` : `finish ${finish.kind}`;
}

/**
 * Run one review and apply its validated result.
 * @param ctx - Cordis context with the llm service.
 * @param turn - the captured turn.
 * @param config - resolved config.
 */
async function review(ctx, turn, config) {
  const route = config.provider && config.model ? { provider: config.provider, model: config.model } : turn.route;
  if (!route?.provider || !route?.model) {
    warnOnce('route', 'no provider/model route captured; skipping reviews for this session');
    return;
  }

  const profile = readProfile(config.profilePath).profile;
  const memoryBlock =
    [...profile.user.map((entry) => `user: ${entry}`), ...profile.agent.map((entry) => `agent: ${entry}`)]
      .join('\n')
      .slice(0, 3000) || '(empty)';
  const skills = countSkills(config.skillsDir);
  const digest = buildDigest(turn);
  const input = [
    `<memory_profile>\n${memoryBlock}\n</memory_profile>`,
    `<existing_skills count="${skills}">\n${listSkillNames(config.skillsDir).slice(0, 60).join(', ') || '(none)'}\n</existing_skills>`,
    digest,
  ]
    .join('\n')
    .slice(0, config.maxInputChars);

  const call = (system, text, purpose) => callReviewModel(ctx, { route, sessionId: turn.sessionId, system, input: text, config, purpose });
  const first = await call(systemPrompt(config.maxMemory), input, 'learning-review');
  const failure = hardFailure(first.finish);
  if (failure !== null) {
    warnOnce(`review-finish:${failure.slice(0, 60)}`, `review call failed: ${failure}`);
    audit(config, { session: turn.sessionId, ok: false, error: failure });
    return;
  }

  // A truncated reply is only lost if the JSON did not survive: a model can
  // finish a complete object and then ramble past the ceiling.
  let parsed = parseReview(first.output);
  let memoryOnly = false;
  let lastOutput = first.output;
  /** Why the truncated reply could not be salvaged, when it could not. */
  let lost = null;
  if (first.finish?.kind === 'max-tokens' && parsed === null) {
    // The failure this plugin actually hit in production: the ceiling cut the
    // JSON mid-object and every review was silently dropped. Retry once with a
    // reduced prompt, then with the smallest decision that still saves the turn.
    warnOnce('review-truncated', `review was cut off at maxTokens=${config.maxTokens}; retrying with a reduced prompt`);
    const retry = await call(systemPrompt(config.maxMemory), reducedPrompt(turn, config, { memoryBlock }), 'learning-review-retry');
    const retryFailure = hardFailure(retry.finish);
    if (retryFailure !== null) {
      lost = `retry failed: ${retryFailure}`;
    } else {
      parsed = parseReview(retry.output);
      lastOutput = retry.output;
      if (parsed === null) {
        memoryOnly = true;
        const smallest = await call(memoryOnlyPrompt(), reducedPrompt(turn, config, { memoryOnly: true, memoryBlock }), 'learning-review-memory-only');
        const smallestFailure = hardFailure(smallest.finish);
        if (smallestFailure !== null) {
          lost = `memory-only fallback failed: ${smallestFailure}`;
        } else {
          parsed = parseReview(smallest.output);
          lastOutput = smallest.output;
        }
      }
    }
  }

  if (parsed === null) {
    // Three replies and not one usable object: still record the failure where
    // the user sees review outcomes, instead of dropping the review silently.
    const detail = `${lost ?? 'truncated review (max-tokens)'}; ${lastOutput.length} chars, no complete JSON after retry and memory-only fallback`;
    warnOnce('review-truncated-lost', `review was cut off at maxTokens=${config.maxTokens} and both fallbacks failed`);
    audit(config, { session: turn.sessionId, ok: false, error: detail });
    await recordLearned(turn.session, learnedNotice(turn.turnId, { memory: [], forget: 0, skill: null, failure: 'truncated' }), config.appendRecord);
    return;
  }

  const result = validateReview(parsed, config);
  // The memory-only fallback never carried a skill; keep it that way even if
  // the model volunteered one, because that path has no supporting evidence.
  if (memoryOnly) result.skill = null;
  const applied = { memory: [], forget: 0, skill: null };

  if (result.memory.length > 0 || result.forget.length > 0) {
    const batch = applyMemoryBatch(
      config.profilePath,
      { user: config.userBudget, agent: config.agentBudget },
      { add: result.memory, forget: result.forget },
    );
    if (!batch.ok) {
      audit(config, { session: turn.sessionId, ok: false, error: batch.message, errors: result.errors });
      return;
    }
    applied.memory = batch.added;
    applied.forget = batch.removed;
    const semantic = semanticConfig(config);
    if (semantic) {
      for (const entry of batch.added) await retainFact(semantic, entry.text, [entry.target]);
    }
  }

  if (result.skill && countSkills(config.skillsDir) < config.maxSkills && skillBudgetAllows(config)) {
    const written = writeSkill({
      dir: config.skillsDir,
      name: result.skill.name,
      description: result.skill.description,
      when: result.skill.when,
      body: result.skill.body,
      keep: 5,
      auditPath: config.auditPath,
    });
    if (written.file === null) {
      result.errors.push('no free skill name');
    } else {
      applied.skill = {
        name: written.name,
        file: written.file,
        backup: written.backup,
        ...(written.renamedFrom ? { renamedFrom: written.renamedFrom } : {}),
      };
      skillTimes.push(Date.now());
    }
  } else if (result.skill) {
    result.errors.push('skill write skipped by a cap');
  }

  if (applied.memory.length === 0 && applied.forget === 0 && applied.skill === null) {
    if (result.errors.length > 0) {
      audit(config, { session: turn.sessionId, ok: false, error: 'review rejected', errors: result.errors });
    }
    return; // A quiet turn is a good turn: no audit noise.
  }
  audit(config, {
    session: turn.sessionId,
    ok: true,
    route: `${route.provider}/${route.model}`,
    memory: applied.memory,
    forget: applied.forget,
    skill: applied.skill,
    errors: result.errors,
  });
  await recordLearned(turn.session, learnedNotice(turn.turnId, applied), config.appendRecord);
}

/** Skill names only; the review never needs their bodies. */
function listSkillNames(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

/** A fresh turn record. */
function blankTurn(turnId) {
  return { turnId, userTexts: [], assistantTexts: [], tools: [], route: null };
}

/** The human text of a user/message event, or null for injected content. */
function humanText(data) {
  if (!data || data.source?.kind !== 'user') return null;
  const text = (data.content ?? [])
    .filter((block) => block?.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
  if (text.length === 0 || SKIP_PREFIXES.some((prefix) => text.startsWith(prefix))) return null;
  return text;
}

/** The visible text of an assistant/message event, or null. */
function assistantText(data) {
  const text = (data?.message?.content ?? [])
    .filter((block) => block?.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
  return text.length > 0 ? text : null;
}

/**
 * Observe one durable session event.
 * @param ctx - Cordis context.
 * @param config - resolved config.
 * @param session - the emitting session.
 * @param event - the durable event.
 */
export function observe(ctx, config, session, event) {
  try {
    if (!config.enabled) return;
    const header = session.header ?? {};
    if (header.isSeeded || header.origin === 'subagent' || Number(header.delegationDepth) > 0) return;
    const id = session.id;
    const type = event?.type;
    const data = event?.data ?? {};

    if (type === 'turn/start') {
      turns.set(id, blankTurn(data.turn ?? 0));
      // Evict the oldest buffered session rather than clearing the map: a
      // blanket clear would drop every in-flight turn too, including the
      // sessions a review is about to read.
      if (turns.size > 500) turns.delete(turns.keys().next().value);
      return;
    }
    const turn = turns.get(id);
    if (!turn) return;

    if (type === 'request/header') {
      const route = data.header?.config;
      if (route?.provider && route?.model) turn.route = { provider: route.provider, model: route.model };
      return;
    }
    if (type === 'user/message') {
      const text = humanText(data);
      if (text) turn.userTexts.push(text);
      return;
    }
    if (type === 'assistant/message') {
      const text = assistantText(data);
      if (text) turn.assistantTexts.push(text);
      return;
    }
    if (type === 'tool/call') {
      turn.tools.push({ callId: data.callId, name: data.name, error: false });
      return;
    }
    if (type === 'tool/result') {
      if (data.message?.isError || data.isError) {
        const callId = data.toolCallId ?? data.message?.toolCallId;
        const tool = turn.tools.find((entry) => entry.callId === callId);
        if (tool) tool.error = true;
      }
      return;
    }
    if (type !== 'turn/end') return;

    turns.delete(id);
    if (data.reason?.kind !== 'completed') return;
    const combined = turn.userTexts.join('\n');
    const reviewable = looksReviewable(combined, config.minUserChars) || isSubstantialTurn(turn, config);
    if (!reviewable) return;
    if (!reviewBudgetAllows(config)) return;
    reviewTimes.push(Date.now());
    const work = review(ctx, { ...turn, sessionId: id, session }, config).catch((error) => {
      warnOnce(`review:${String((error && error.message) || error).slice(0, 80)}`, `review failed: ${String((error && error.message) || error)}`);
    });
    inflight.add(work);
    void work.finally(() => inflight.delete(work));
  } catch (error) {
    warnOnce(`observe:${String((error && error.message) || error).slice(0, 80)}`, `event handling failed: ${String((error && error.message) || error)}`);
  }
}

/** Test-only: clear the in-memory rate state and turn buffers. */
export function resetState() {
  turns.clear();
  reviewTimes = [];
  skillTimes = [];
}

/** Wait for every in-flight review; used by the self-test and a clean stop. */
export async function whenIdle() {
  while (inflight.size > 0) await Promise.allSettled([...inflight]);
}

/**
 * Register the turn reviewer.
 * @param ctx - Cordis context with the llm service.
 * @param config - Loader row config.
 */
export function apply(ctx, config) {
  const resolved = resolveConfig(config);
  if (!resolved.enabled) {
    console.error('[dsh-learn] disabled; no turn reviews');
    return;
  }
  ctx.effect(() => {
    const dispose = ctx.on('session/event', (session, event) => observe(ctx, resolved, session, event));
    return () => {
      if (typeof dispose === 'function') dispose();
    };
  }, 'dsh-learn: turn reviews');
  const route = resolved.provider && resolved.model ? `${resolved.provider}/${resolved.model}` : 'session route';
  console.error(`[dsh-learn] reviewing turns · ${route} · skills=${resolved.skillsDir}`);
}
