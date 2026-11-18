/**
 * Self-test for @local/dsh-studio — the English-first design skill.
 *
 *   node plugins/studio/selftest.mjs
 *
 * No DSH process, no browser, no network. Checks the wiring a translation can
 * break silently: the bundle patch must find the skill directory, the skill must
 * keep its English identity, every path SKILL.md promises must exist, and no
 * upstream identifier may survive in the scripts.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.join(root, 'skill');
const read = (...parts) => readFileSync(path.join(root, ...parts), 'utf8');
const pass = (message) => process.stdout.write(`PASS ${message}\n`);

const cjk = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/;
/** Characters that may legitimately appear in English prose. */
const prose = (text) => text.replace(/[·×→←—–…「」『』【】]/g, '');

const manifest = JSON.parse(read('package.json'));
assert.equal(manifest.name, '@local/dsh-studio');
assert.equal(manifest.dsh?.bundle?.patch, './cordis.patch.yml');
assert.equal(manifest.exports['./package.json'], './package.json');
for (const [name, version] of Object.entries(manifest.dependencies ?? {})) {
  assert.match(version, /^\d+\.\d+\.\d+$/, `${name} must be pinned to an exact version`);
}
pass('manifest: bundle patch, exported package.json, pinned dependencies');

// The patch computes the skill directory from the package location, so a link
// install and a copied install both work; both halves of that expression matter.
const patch = read('cordis.patch.yml');
assert.match(patch, /providerName: studio/);
assert.match(patch, /@local\/dsh-studio\/package\.json/);
assert.match(patch, /'skill'\)/);
assert.match(patch, /@deepseek-ai\/dsh-skill-filesystem/);
pass('patch: filesystem provider rooted at the package skill directory');

const skill = read('skill', 'SKILL.md');
const front = /^---\n([\s\S]*?)\n---\n/.exec(skill);
assert.ok(front, 'SKILL.md must open with YAML frontmatter');
assert.match(front[1], /^name: studio$/m);
assert.match(front[1], /^description: /m);
assert.match(front[1], /version: 0\.1\.0/);
assert.match(front[1], /Regeneratus Labs/);
const description = /^description: (.*)$/m.exec(front[1])[1];
assert.ok(!cjk.test(description), 'the description agents see must be English');
assert.match(description, /prototype/i);
assert.match(description, /deck|slides/i);
assert.match(description, /animation/i);
assert.match(description, /critique/i);
pass('skill frontmatter: name, English description, trigger coverage, provenance');

// Every resource SKILL.md promises must be on disk. Drop prose punctuation and
// placeholders before checking so only real paths are tested.
const promised = new Set();
for (const match of skill.matchAll(/`((?:references|scripts)\/[^`]+?)`/g)) {
  const candidate = match[1].replace(/[.,;:)]+$/, '').trim();
  if (candidate.includes('<') || candidate.includes('*') || candidate.includes('…')) continue;
  promised.add(candidate);
}
assert.ok(promised.size >= 25, `expected the skill to promise its references and scripts, found ${promised.size}`);
for (const relative of promised) {
  assert.ok(existsSync(path.join(skillDir, relative)), `SKILL.md points at missing ${relative}`);
}
pass(`skill references resolve (${promised.size} paths)`);

// The gate file was renamed with the fork; the old Chinese name must not linger
// in instructions or in the scripts that write it.
assert.match(skill, /director-script\.md/);
for (const doc of ['skill/SKILL.md', 'skill/references/modules/motion.md', 'skill/references/ai-video-review.md']) {
  assert.ok(!read(doc).includes('导演稿'), `${doc} still names the old gate file`);
}
pass('gate filenames translated (director-script.md)');

// The state directory and env var were renamed; a leftover upstream name would
// write to the wrong place (and, under workspace permissions, fail).
const scripts = readdirSync(path.join(skillDir, 'scripts'), { recursive: true, encoding: 'utf8' })
  .filter((file) => /\.(py|mjs|js|sh)$/.test(file))
  .map((file) => path.join('skill', 'scripts', file));
for (const file of scripts) {
  const body = read(file);
  assert.ok(!body.includes('HUASHU_DESIGN_HOME'), `${file} still reads HUASHU_DESIGN_HOME`);
  assert.ok(!body.includes('HUASHU_CLOUD_OK'), `${file} still reads HUASHU_CLOUD_OK`);
  if (file.endsWith('html2pptx.js')) continue; // upstream copyright line is licence text
  assert.ok(!body.includes('huashu-design'), `${file} still carries the upstream package name`);
}
pass(`scripts renamed to STUDIO_HOME / ~/.dsh-studio (${scripts.length} files)`);

// Translation completeness: headings must be English everywhere. Quoted CJK
// examples inside bodies are allowed where the subject is Chinese typography,
// the platform's copy rules, or provenance.
const docs = [
  'skill/SKILL.md',
  ...readdirSync(path.join(skillDir, 'references'), { withFileTypes: true })
    .flatMap((entry) => entry.isDirectory()
      ? readdirSync(path.join(skillDir, 'references', entry.name)).map((file) => `skill/references/${entry.name}/${file}`)
      : [`skill/references/${entry.name}`])
    .filter((file) => file.endsWith('.md'))
].map((file) => [file, read(file)]);
assert.ok(docs.length >= 45, `expected the full reference library, found ${docs.length} docs`);
for (const [file, body] of docs) {
  for (const heading of body.matchAll(/^(#{1,6}) (.+)$/gm)) {
    assert.ok(!cjk.test(prose(heading[2])), `${file} has a Chinese heading: ${heading[2]}`);
  }
  assert.ok(body.length > 200, `${file} looks truncated`);
}
pass(`reference library translated (${docs.length} docs, English headings, non-empty)`);

// The style library promises a specimen image per style; a broken path would
// send the agent looking for a screenshot that is not there.
const styles = read('skill', 'references', 'design-styles.md');
const specimens = [...styles.matchAll(/assets\/style-specimens\/[^\s`"')]+/g)]
  .map((match) => match[0])
  .filter((specimen) => !/[<>|]/.test(specimen));
assert.ok(specimens.length >= 40, `expected the specimen library to be referenced, found ${specimens.length}`);
for (const specimen of specimens) {
  assert.ok(existsSync(path.join(skillDir, specimen)), `design-styles.md points at missing ${specimen}`);
}
pass(`style specimens resolve (${specimens.length} paths)`);

process.stdout.write('studio selftest: ok\n');
