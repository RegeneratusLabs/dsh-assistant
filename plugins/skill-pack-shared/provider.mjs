/**
 * The one skill provider the four skill packs share.
 *
 * WHY THIS EXISTS
 * A cluster of task knowledge is a folder of plain SKILL.md files, not a
 * feature: a pack only distributes the tree under `skills/` to a profile, so
 * four copies of the same provider would be four things to drift. Each pack's
 * `index.js` is a row manifest (a name, a Config, one registration); this
 * module is the provider it registers.
 *
 * THE CONTRACT
 * `ctx.skills.registerProvider()` wants a factory returning
 * `{ name, list(options), get(candidate, options) }`: `list()` returns
 * candidates (name, description, rank, opaque locator, resource base) and
 * `get()` returns the body for one candidate. The shapes below are the ones
 * `@deepseek-ai/dsh-skill-office` uses against `@deepseek-ai/dsh-skill`.
 *
 * WHAT A PACK MAY READ
 * Only its own vendored `assets/skills/` next to `index.js`, never
 * `$DSH_HOME/skills`: the packs are read-only distribution, and the repository
 * tree stays the single source of truth (bin/assistant.mjs sync-skills copies
 * it here; a test asserts the two stay byte-identical).
 *
 * The packs are link-installed in the profile, so the sibling relative import
 * below keeps the checkout and resolves. Four thin files would be the fallback
 * only for a packed install, which this profile does not do.
 *
 * @module skill-pack/provider
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, sep } from 'node:path';

/**
 * Standard precedence rank for packaged skill providers and local bundled
 * roots; mirrors `BUNDLED_SKILL_RANK` in `@deepseek-ai/dsh-skill` (0.2.2-rc.2).
 * The literal keeps this module loadable by plain Node, where the selftests run
 * without the Harness installation on the resolution path.
 */
export const BUNDLED_SKILL_RANK = 600;

/**
 * Read a SKILL.md's frontmatter with line checks, not a YAML dependency.
 *
 * Skills in this repository are authored against the cross-agent standard, so
 * `name`, `description` and `when` are single-line scalars. Anything a full YAML
 * parser would accept and this does not belongs in the skill body instead.
 *
 * @param raw - the whole file.
 * @returns `{ fields, body }`; `body` is everything after the closing fence.
 * @throws when the file has no frontmatter block.
 */
export function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(raw);
  if (match === null) throw new Error('no frontmatter block');
  const fields = {};
  for (const line of match[1].split(/\r?\n/u)) {
    const pair = /^([A-Za-z][\w-]*):\s*(.*)$/u.exec(line);
    if (pair === null) continue;
    fields[pair[1]] = pair[2].trim().replace(/^(['"])(.*)\1$/u, '$2');
  }
  return { fields, body: raw.slice(match[0].length).trim() };
}

/**
 * Parse one vendored skill file into the parts the registry serves.
 * @param raw - the whole SKILL.md.
 * @param file - the path, for the error message.
 * @returns `{ name, description, content }`.
 * @throws when the frontmatter has no description, as the Host requires one.
 */
export function parseSkill(raw, file) {
  const { fields, body } = parseFrontmatter(raw);
  if (typeof fields.description !== 'string' || fields.description.length === 0) {
    throw new Error(`${file} has no description`);
  }
  return { name: fields.name, description: fields.description, content: body };
}

/**
 * The vendored skill names this row's Config turns on: only an explicit `true`
 * serves a skill, so a flag set to `false` (or a name a later sync has not
 * added yet) is off.
 * @param names - every name vendored in the pack.
 * @param flags - the row's `skills` map.
 * @returns the served names, sorted.
 */
export function servedNames(names, flags) {
  const map = flags ?? {};
  return [...names].filter((name) => map[name] === true).sort();
}

/**
 * The directory names under one pack's vendored assets.
 * @param assetRoot - `assets/skills/` of a pack.
 * @returns the skill directory names, sorted; empty when the pack has not been
 *   synced yet, which is a valid (if unhelpful) state.
 */
export async function vendoredNames(assetRoot) {
  try {
    const entries = await readdir(assetRoot, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return [];
    throw error;
  }
}

/** A read failure that will not fix itself until the file appears. */
function persistentReadFailure(error) {
  const code = error instanceof Error && 'code' in error ? error.code : undefined;
  return code === 'ENOENT' || code === 'ENOTDIR';
}

/**
 * Build the provider one pack registers.
 *
 * @param options - `provider` (the registry name), `assetRoot` (absolute
 *   `assets/skills/`), `flags` (a function returning the row's current `skills`
 *   map, so a volatile toggle is read live), optional `rank`, `logger` and
 *   `invalidate` (the registration's own catalog invalidation).
 * @returns a provider for `ctx.skills.registerProvider`.
 */
export function createSkillProvider({
  provider,
  assetRoot,
  flags,
  rank = BUNDLED_SKILL_RANK,
  logger = console,
  invalidate = () => {},
}) {
  const reported = new Map();
  /** Report each distinct failure once; a recovering file clears its entry. */
  function failed(name, error, persistent) {
    const text = String(error);
    if (reported.get(name) !== text) {
      reported.set(name, text);
      logger.warn(`${provider}: skill "${name}" is unavailable: ${text}`);
    }
    return { kind: 'failed', error, persistent };
  }
  async function read(name, signal) {
    const file = join(assetRoot, name, 'SKILL.md');
    let raw;
    try {
      raw = await readFile(file, { encoding: 'utf8', signal });
    } catch (error) {
      if (signal?.aborted === true) throw error;
      return failed(name, error, persistentReadFailure(error));
    }
    try {
      return { kind: 'loaded', file, ...parseSkill(raw, file) };
    } catch (error) {
      return failed(name, error, true);
    }
  }
  return {
    name: provider,
    async list(options = {}) {
      const names = servedNames(await vendoredNames(assetRoot), flags());
      const reads = await Promise.all(
        names.map(async (name) => ({ name, read: await read(name, options.signal) })),
      );
      const candidates = [];
      let complete = true;
      for (const { name, read: result } of reads) {
        if (result.kind === 'failed') {
          complete = false;
          continue;
        }
        reported.delete(name);
        const directory = join(assetRoot, name);
        candidates.push({
          name,
          description: result.description,
          invocation: { modelInvocable: true, userInvocable: true },
          provider,
          source: 'bundled',
          rank,
          // The Host renders a model-facing body that may point at sibling files;
          // the directory is where those resolve from.
          resourceBase: { kind: 'directory', path: directory.split(sep).join('/') },
          locator: result.file,
        });
      }
      return { candidates, complete };
    },
    async get(candidate, options = {}) {
      const { rank: _rank, locator: _locator, ...summary } = candidate;
      const result = await read(candidate.name, options.signal);
      if (result.kind === 'failed') {
        // A vanished file is a stale catalog; ask the registry to rediscover.
        if (result.persistent) invalidate();
        else throw result.error;
        return undefined;
      }
      return { ...summary, content: result.content };
    },
  };
}
