/**
 * The `skills/<cluster>/<name>/` tree, as AGENTS.md describes it.
 *
 * Task knowledge is portable: one folder per skill, plain SKILL.md, no plugin
 * code. The four thin skill-pack plugins vendor this tree (bin/assistant.mjs
 * sync-skills), so these tests are what keeps the vendored copy honest and
 * keeps a skill from shipping broken.
 *
 * An empty-but-structured tree (the four cluster directories, nothing yet) is
 * valid while authors are still landing content; as soon as one skill exists,
 * every rule applies to all of them. Frontmatter is read with line checks, not a
 * YAML dependency, matching the provider that serves it.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseFrontmatter } from '../plugins/skill-pack-shared/provider.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_ROOT = path.join(ROOT, 'skills');
const PLUGINS_ROOT = path.join(ROOT, 'plugins');

/** The only clusters a pack ships; a fifth directory is a mistake. */
const CLUSTERS = ['daily-ops', 'home-family', 'life-admin', 'research-decisions'];

/** The most lines a skill body may carry. */
const MAX_BODY_LINES = 500;

/** The most characters a skill description may carry. */
const MAX_DESCRIPTION_CHARS = 1024;

/** Directories directly below a path, dot-directories excluded. */
function directories(directory) {
  try {
    return readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

/** Every file below a directory, as relative paths, sorted. */
function filesUnder(directory) {
  const found = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else found.push(path.relative(directory, absolute));
    }
  };
  walk(directory);
  return found.sort();
}

/** One authored skill. */
const skills = CLUSTERS.flatMap((cluster) =>
  directories(path.join(SKILLS_ROOT, cluster)).map((name) => ({ cluster, name, dir: path.join(SKILLS_ROOT, cluster, name) })),
);

/** Skip a content rule while the tree is still empty. */
const emptyTree = skills.length === 0 ? 'the tree has no skills yet' : false;

test('the tree holds exactly the four known clusters', () => {
  assert.deepEqual(directories(SKILLS_ROOT), CLUSTERS);
  for (const cluster of CLUSTERS) assert.ok(existsSync(path.join(SKILLS_ROOT, cluster)), `skills/${cluster}/ is missing`);
});

test('every skill has a SKILL.md with a matching name and a description', { skip: emptyTree }, () => {
  for (const skill of skills) {
    const file = path.join(skill.dir, 'SKILL.md');
    assert.ok(existsSync(file), `${skill.cluster}/${skill.name}: SKILL.md is missing`);
    const raw = readFileSync(file, 'utf8');
    const { fields } = parseFrontmatter(raw);
    assert.equal(fields.name, skill.name, `${skill.cluster}/${skill.name}: frontmatter name must match the directory`);
    assert.equal(typeof fields.description, 'string', `${skill.cluster}/${skill.name}: no description`);
    const description = fields.description.trim();
    assert.ok(description.length > 0, `${skill.cluster}/${skill.name}: the description is empty`);
    assert.ok(description.length <= MAX_DESCRIPTION_CHARS, `${skill.cluster}/${skill.name}: the description is ${description.length} chars, over ${MAX_DESCRIPTION_CHARS}`);
    // The provider reads frontmatter line by line; a folded description would
    // serve one truncated line, so the shallow shape is the contract.
    const block = raw.slice(0, raw.indexOf('\n---', 4));
    for (const line of block.split(/\r?\n/).slice(1)) {
      assert.match(line, /^[A-Za-z][\w-]*:\s*\S/u, `${skill.cluster}/${skill.name}: frontmatter line is not a single-line field: ${JSON.stringify(line)}`);
    }
  }
});

test('every skill has trigger tests with at least eight prompts on each side', { skip: emptyTree }, () => {
  for (const skill of skills) {
    const file = path.join(skill.dir, 'trigger-tests.json');
    assert.ok(existsSync(file), `${skill.cluster}/${skill.name}: trigger-tests.json is missing`);
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    for (const key of ['should_fire', 'should_not_fire']) {
      const prompts = parsed[key];
      assert.ok(Array.isArray(prompts), `${skill.cluster}/${skill.name}: ${key} must be an array`);
      assert.ok(prompts.length >= 8, `${skill.cluster}/${skill.name}: ${key} has ${prompts.length} prompts, needs 8`);
      for (const prompt of prompts) {
        assert.equal(typeof prompt, 'string', `${skill.cluster}/${skill.name}: ${key} holds a non-string`);
        assert.ok(prompt.trim().length > 0, `${skill.cluster}/${skill.name}: ${key} holds an empty prompt`);
      }
    }
  }
});

test('every skill body is at most 500 lines', { skip: emptyTree }, () => {
  for (const skill of skills) {
    const { body } = parseFrontmatter(readFileSync(path.join(skill.dir, 'SKILL.md'), 'utf8'));
    const lines = body.split(/\r?\n/u);
    while (lines.length > 0 && lines.at(-1).trim() === '') lines.pop();
    assert.ok(lines.length > 0, `${skill.cluster}/${skill.name}: the body is empty`);
    assert.ok(lines.length <= MAX_BODY_LINES, `${skill.cluster}/${skill.name}: the body is ${lines.length} lines, over ${MAX_BODY_LINES}`);
  }
});

test('no skill name appears twice in the tree', { skip: emptyTree }, () => {
  const seen = new Map();
  for (const skill of skills) {
    const previous = seen.get(skill.name);
    assert.equal(previous, undefined, `${skill.name} exists in both ${previous} and ${skill.cluster}`);
    seen.set(skill.name, skill.cluster);
  }
});

test('the vendored copy in each pack is byte-identical to the tree', { skip: emptyTree }, () => {
  for (const skill of skills) {
    const vendored = path.join(PLUGINS_ROOT, `skill-pack-${skill.cluster}`, 'assets', 'skills', skill.name);
    assert.ok(existsSync(vendored), `${skill.cluster}/${skill.name}: no vendored copy; run node bin/assistant.mjs sync-skills`);
    const authored = filesUnder(skill.dir);
    const copied = filesUnder(vendored);
    assert.deepEqual(copied, authored, `${skill.cluster}/${skill.name}: the vendored file list differs; run node bin/assistant.mjs sync-skills`);
    for (const file of authored) {
      assert.ok(
        readFileSync(path.join(skill.dir, file)).equals(readFileSync(path.join(vendored, file))),
        `${skill.cluster}/${skill.name}/${file}: the vendored copy differs; run node bin/assistant.mjs sync-skills`,
      );
    }
  }
});

test('every vendored folder belongs to exactly one pack', () => {
  const owners = new Map();
  for (const entry of readdirSync(PLUGINS_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('skill-pack-') || entry.name === 'skill-pack-shared') continue;
    const cluster = entry.name.slice('skill-pack-'.length);
    assert.ok(CLUSTERS.includes(cluster), `plugins/${entry.name} is not one of the four cluster packs`);
    const assets = path.join(PLUGINS_ROOT, entry.name, 'assets', 'skills');
    for (const name of directories(assets)) {
      const packs = owners.get(name) ?? [];
      packs.push(cluster);
      owners.set(name, packs);
    }
  }
  for (const [name, packs] of owners) {
    assert.equal(packs.length, 1, `${name} is vendored by ${packs.length} packs: ${packs.join(', ')}`);
    const cluster = packs[0];
    const authored = skills.some((skill) => skill.cluster === cluster && skill.name === name);
    assert.ok(authored, `skills/${cluster}/${name}/ does not exist, but the pack still vendors it; run node bin/assistant.mjs sync-skills`);
  }
});
