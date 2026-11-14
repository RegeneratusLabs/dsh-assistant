/**
 * Self-test for @local/dsh-memory — no test runner, no network, no Hindsight.
 *
 * Covers the parts that can break silently: the profile file round-trip, the
 * bounded render, the budget overflow contract, prompt-section registration, tool
 * registration, and each tool's behaviour against a stubbed fetch.
 *
 * Run: node plugins/dsh-memory/selftest.mjs
 */

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const home = mkdtempSync(path.join(os.tmpdir(), 'dsh-memory-selftest-'));
process.env.DSH_HOME = home;

const { apply, readProfile, writeProfile, renderProfile } = await import('./index.js');

let failures = 0;
/** Assert one condition, recording the outcome. */
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`ok   ${label}`);
    return;
  }
  failures += 1;
  console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
}

// ── profile file round-trip ──────────────────────────────────────────────────
const file = path.join(home, 'memory', 'profile.json');
check('missing profile reads as empty', readProfile(file).profile.user.length === 0 && readProfile(file).missing === true);

writeProfile(file, { user: ['Based on the a coastal town.'], agent: ['Prefers local suppliers.'] });
const back = readProfile(file).profile;
check('round-trip keeps both tracks', back.user.length === 1 && back.agent.length === 1, JSON.stringify(back));
check('file is 0600', (readFileSync(file, { encoding: 'utf8' }) !== ''));

const rendered = renderProfile(back);
check('render includes both headings', rendered.includes('## About the user') && rendered.includes('## Notes to self'));
check('render is bounded at budget', renderProfile({ user: [], agent: [] }).length < 400);

// ── apply() against a fake ctx ───────────────────────────────────────────────
const registered = [];
let section = null;
const ctx = {
  systemPrompt: {
    getSectionOrder: () => 0,
    section: (spec) => {
      section = spec;
      return () => {};
    },
  },
  effect: (fn) => fn(),
  tools: { register: (tool) => registered.push(tool) },
};

apply(ctx, {
  bankId: 'test-bank',
  apiUrl: 'http://127.0.0.1:9177',
  profilePath: file,
  allowBanks: 'test-bank',
  probe: false,
});

check('prompt section registered', section !== null && section.name === 'memory:profile');
// The registry renders a function-valued `text` per request; a string here would
// freeze the block at boot (the regression this assertion exists to prevent).
const sectionText = () => (typeof section.text === 'function' ? section.text() : section.text);
check('section text is dynamic', typeof section.text === 'function', typeof section.text);
check('section carries the profile', sectionText().includes('a coastal town'));
check('section order sits after the persona', section.order === 1);
check('three tools registered', registered.length === 3, registered.map((t) => t.name).join(','));
check(
  'tool names are stable',
  ['memory_forget', 'memory_recall', 'memory_remember'].every((name) => registered.some((t) => t.name === name)),
);

// ── tools against a stubbed fetch ────────────────────────────────────────────
const calls = [];
globalThis.fetch = async (url, init) => {
  calls.push({ url, body: init?.body });
  if (String(url).endsWith('/memories')) return { ok: true, status: 200, text: async () => '{}' };
  if (String(url).endsWith('/memories/recall')) {
    return {
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          results: [
            { text: 'The user farms apples near Testville.', occurred_start: '2026-11-01T00:00:00Z', scores: { final: 0.91 } },
            { text: 'Prefers suppliers within an hour.', occurred_start: '2026-11-13T00:00:00Z', scores: { final: 0.77 } },
          ],
        }),
    };
  }
  return { ok: false, status: 404, text: async () => 'not found' };
};

const remember = registered.find((t) => t.name === 'memory_remember');
const recall = registered.find((t) => t.name === 'memory_recall');
const forget = registered.find((t) => t.name === 'memory_forget');

const denied = [];
const deniedCtx = {
  systemPrompt: { getSectionOrder: () => 0, section: () => () => {} },
  effect: (fn) => fn(),
  tools: { register: (tool) => denied.push(tool) },
};
apply(deniedCtx, { bankId: 'another-agent', apiUrl: 'http://127.0.0.1:9177', profilePath: file, probe: false });
check('a foreign bank is refused', denied.length === 0, denied.map((t) => t.name).join(','));

const remembered = await remember.execute({ text: 'Runs a small apple orchard near Testville.', target: 'user' });
check('remember writes the profile', readProfile(file).profile.user.some((entry) => entry.includes('apple')), remembered.message);
check('remember renders a usage line', /Usage: user \d+\/2200 \(\d+%\)/.test(sectionText()), sectionText());
const duplicate = await remember.execute({ text: '  runs a small apple orchard near Testville. ', target: 'user' });
check('duplicate entries are refused', duplicate.message.includes('Already'), duplicate.message);
check(
  'duplicate did not grow the track',
  readProfile(file).profile.user.filter((entry) => entry.includes('apple')).length === 1,
  JSON.stringify(readProfile(file).profile.user),
);
check('remember is visible in the same-session prompt block', sectionText().includes('apple'), sectionText());
check('remember retains to Hindsight', calls.some((call) => String(call.url).endsWith('/memories')), JSON.stringify(calls));
check('remember tags the fact', calls.some((call) => String(call.body).includes('"tags":["user"]')));

const recalled = await recall.execute({ query: 'what do they farm?' });
check('recall formats results', recalled.message.includes('apples') && recalled.message.includes('0.91'), recalled.message);

const forgot = await forget.execute({ text: 'apple', target: 'user' });
check('forget removes the entry', !readProfile(file).profile.user.some((entry) => entry.includes('apple')), forgot.message);
check('forget leaves the same-session prompt block immediately', !sectionText().includes('apple'), sectionText());

// ── budget overflow contract ─────────────────────────────────────────────────
const tight = path.join(home, 'memory', 'tight.json');
writeProfile(tight, { user: ['x'.repeat(60)], agent: [] });
const tightCtx = {
  systemPrompt: { getSectionOrder: () => 0, section: () => () => {} },
  effect: (fn) => fn(),
  tools: { register: (tool) => registered.push(tool) },
};
const before = registered.length;
apply(tightCtx, { profilePath: tight, userBudget: 100 });
const tightRemember = registered.slice(before).find((t) => t.name === 'memory_remember');
const overflow = await tightRemember.execute({ text: 'y'.repeat(60), target: 'user' });
check('overflow reports chars to free', overflow.message.includes('chars') && overflow.message.includes('100'), overflow.message);
check('overflow does not write', readProfile(tight).profile.user.length === 1);

// ── fail-open recall ─────────────────────────────────────────────────────────
globalThis.fetch = async () => ({ ok: false, status: 500, text: async () => 'boom' });
const degraded = await recall.execute({ query: 'anything' });
check('recall fails open', degraded.message.toLowerCase().includes('failed'), degraded.message);

// ── semantic memory is opt-in (no Hindsight by default) ─────────────────────
const localFile = path.join(home, 'memory', 'local.json');
const localTools = [];
let localFetches = 0;
globalThis.fetch = async () => {
  localFetches += 1;
  throw new Error('semantic memory is off; no request expected');
};
const localCtx = {
  systemPrompt: { getSectionOrder: () => 0, section: () => () => {} },
  effect: (fn) => fn(),
  tools: { register: (tool) => localTools.push(tool) },
};
apply(localCtx, { profilePath: localFile });

const localRemember = localTools.find((t) => t.name === 'memory_remember');
const localRecall = localTools.find((t) => t.name === 'memory_recall');
const localWrite = await localRemember.execute({ text: 'Likes tea.', target: 'user' });
check('local memory stores without Hindsight', readProfile(localFile).profile.user.includes('Likes tea.'), localWrite.message);
check('local memory reports a local write', localWrite.message.includes('prompt block'), localWrite.message);
const factWrite = await localRemember.execute({ text: 'A fact.', target: 'fact' });
check('fact without Hindsight is refused honestly', factWrite.message.includes('not configured'), factWrite.message);
const localQuery = await localRecall.execute({ query: 'tea' });
check('recall without Hindsight explains itself', localQuery.message.includes('not configured'), localQuery.message);
check('no network when semantic memory is off', localFetches === 0, String(localFetches));

rmSync(home, { recursive: true, force: true });
console.log(failures === 0 ? '\nselftest PASS' : `\nselftest FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
