/**
 * Browser half of the four skill packs: the Plugins-page form for one pack row.
 *
 * WHY ONE FILE SERVES FOUR PACKAGES
 * A pack's `skills` map is volatile, so toggling a skill republishes the Host
 * catalog instead of restarting the row — but a volatile field is still just a
 * field, and a field without a form is a YAML edit. A row gains its Configure
 * page only while its browser half registers `plugins.row.config`, and that
 * half must be a *classic script* the Web module table materialises per
 * package: the table keys one artifact per package, has no cross-package
 * `import`, and its package-local chunks resolve inside the package that owns
 * them. Four copies of the same form would therefore be four things to drift,
 * so all four packs point `exports['./client']` at this one file, which
 * registers a form for every pack listed below — whichever pack's script the
 * page loads first registers all four and the rest short-circuit. Enabling one
 * pack alone is enough for its own form; the other three keys simply have no
 * row to attach to.
 *
 * THE SLOT CONTRACT
 * `plugins.row.config` is a keyed slot declared by
 * `@deepseek-ai/dsh-client-ui-plugin-manager`, keyed `<package>#<row id>` with
 * the row id as the pack's `cordis.patch.yml` declares it. The page renders the
 * entry with `{ view: 'summary' | 'page', form }`:
 *   - `summary` is the one-liner a row without a description falls back to;
 *   - `page` is the section under the row's description. `form.state` is the
 *     accepted settings snapshot for the row's namespace (the row id) and
 *     `form.mutate(ops, revision)` is the serialized write.
 * The save path is path ops, not a whole-section replace: a replace rebuilt
 * from what the page can see would delete fields the client never received, and
 * `mutate` is the same writer every host form uses. A refusal (`false`) or a
 * rejected call is shown inline — never reported as saved.
 *
 * RENDERING RULES
 * The controls are the Host's own, copied from the rendered Plugin Manager
 * (`role="switch"` with `aria-checked`, a 36x20 track and a 16px thumb) and the
 * settings form footer (a save button beside an inline `role="alert"` line).
 * Classes are renamed under `spk-`, and every colour is a `--dsw-alias-*`
 * theme token, so light/dark switching and a renamed token degrade gracefully.
 *
 * The decisions live in `__logic` so `selftest.mjs` can assert them outside a
 * browser (`test/client-harness.mjs` supplies the React stub).
 */

(function () {
  'use strict';

  /**
   * The packs this bundle serves: each package name, the Loader row id its
   * `cordis.patch.yml` inserts, and the vendored skills in display order.
   * A pack's `selftest.mjs` asserts this table against the pack's manifest,
   * patch and vendored `SKILL.md` frontmatter, so the form cannot describe a
   * skill the pack does not ship.
   */
  const PACKS = [
    {
      id: '@local/dsh-skill-pack-daily-ops',
      row: 'dsh-skill-pack-daily-ops',
      skills: [
        {
          name: 'daily-brief',
          description: `Assemble a short morning brief from what is actually on disk — open tasks from TASKS.md, anything dated today in the user's plan files, and today's weather for their location looked up on the web — in five sections or fewer, saying plainly what was skipped and why. Use when the user says "good morning", "brief me", "what's today look like", "start my day", "catch me up on today", or "morning, what's on?"`,
        },
        {
          name: 'handoff',
          description: `Compact a long working session into one short pickup document that a fresh assistant can continue from with zero chat history — what we were doing, what is decided, what is still open, where every file lives, which skill to load next, and the first action. Use when the user says "wrap this up for later", "I'll pick this up tomorrow", "handoff", "save where we are", "I'm starting a new chat", or when a long session ends with work still unfinished.`,
        },
        {
          name: 'memory-keeper',
          description: `Curate what the assistant durably knows about the user, in two tiers — a short always-visible profile block (name forms, key people and relationships, standing preferences, communication tone) and dated memory notes for everything else — including decoding the user's own shorthand and nicknames, asking once about people the profile is missing, and removing anything on request. Use when the user says "remember that", "what do you know about me", "forget I said that", "update my profile", or shares a lasting fact about themselves.`,
        },
        {
          name: 'task-board',
          description: `Keep a plain TASKS.md the user can also edit by hand — capture tasks from chat in their own words, one checkbox per task with a date only when they gave one, check for duplicates before adding, move stale or overdue items into a dated review section instead of deleting them, and tick what is done. Use when the user says "add a task", "put this on my list", "what's on my list", "I keep forgetting to", "mark that done", or "clean up my list".`,
        },
      ],
    },
    {
      id: '@local/dsh-skill-pack-life-admin',
      row: 'dsh-skill-pack-life-admin',
      skills: [
        {
          name: 'bill-triage',
          description: `Audit every recurring bill and subscription the user has — from statements, screenshots, PDFs, or a list from memory — into one table of provider, amount, cadence and renewal date, then flag increases, duplicates and forgotten subscriptions, sort them into keep/negotiate/cancel, and draft the cancellation letters for the user to send. Use when someone says "go through my bills", "what am I subscribed to", "is this charge right", "audit my subscriptions", or "why did my bill go up".`,
        },
        {
          name: 'complaint-escalation',
          description: `Turn a consumer problem — a faulty product, an unfair charge, a broken service — into a case that gets resolved: gather the facts, write a firm first letter stating the remedy wanted and a reply deadline, draft an escalation to an ombudsman or consumer-protection body if that is ignored, and keep a dated contact log. Use when someone says "they won't refund me", "write a complaint letter", "this company is ignoring me", or "escalate this".`,
        },
        {
          name: 'explain-this-document',
          description: `Explain a document the user received — bill, insurance letter, lease, contract, official-looking notice — in plain language: what it says, what they must do and by when, what happens if they ignore it, a glossary of the five terms most likely to confuse them, and clauses worth checking. Use when someone says "what does this letter mean", "explain this contract", "explain this bill or notice", or "is this saying what I think".`,
        },
        {
          name: 'paperwork-forms',
          description: `Get an official or administrative form filled in correctly — read it in full first, translate every question into plain language, gather the user's answers in one batched interview, list the required attachments, and deliver draft answers in a table to copy in plus a submission checklist. Use when someone says "help me fill this form", "this application is confusing", or "what does question 7 mean".`,
        },
      ],
    },
    {
      id: '@local/dsh-skill-pack-home-family',
      row: 'dsh-skill-pack-home-family',
      skills: [
        {
          name: 'appointment-prep',
          description: `Prepare a clinician-ready one-page summary, a question list with answer space, and a since-last-visit list for a doctor, dentist, or specialist appointment. Use when the user says they have a doctor's appointment, asks what to ask the doctor, or wants help getting ready for an appointment.`,
        },
        {
          name: 'elder-care',
          description: `Coordinate ongoing care for an aging parent or relative with one appointment log, a pharmacist-confirmed medication schedule, a before-the-call checklist, and a plain-language family summary. Use when the user is juggling a parent's care across time — an appointments log piling up, care home staff questions, helping a parent manage medication from several clinicians. Not for preparing one appointment (that is appointment-prep) or planning meals (meal-plan-groceries).`,
        },
        {
          name: 'gift-registry',
          description: `Keep a running gift-idea file for each person, log hints with dates, and propose three budget-fit options before an occasion without repeating a gift already given. Use when the user asks for a gift idea, says a birthday is coming up, mentions someone wanting something, or asks what to get.`,
        },
        {
          name: 'meal-plan-groceries',
          description: `Plan a week of dinners around food the user already has, then produce one grocery list grouped by store section. Use when the user asks to plan meals for the week, make a grocery list, decide what's for dinner, use up what's in the fridge, or plan the shopping.`,
        },
      ],
    },
    {
      id: '@local/dsh-skill-pack-research-decisions',
      row: 'dsh-skill-pack-research-decisions',
      skills: [
        {
          name: 'big-purchase',
          description: `Research which model of a considered purchase to buy — appliance, laptop, mattress, car model, pram, bike — by agreeing a budget and the 3–5 criteria that actually matter to this buyer, checking current models against dated and sourced claims, scoring the shortlist in one comparison table, and giving a recommendation with a confidence level and the one fact that would most change it. Use when someone says "which X should I buy", "is it worth the extra money", "before I buy" or "best X for". Not for the broader commitment decision (renovate, move, switch insurers) — that is decision-grill.`,
        },
        {
          name: 'claim-check',
          description: `Check whether a specific claim, rumor or forwarded story someone else made is true before the user repeats or shares it — restate the claim precisely, trace it to its origin, find at least two independent dated sources, grade it solid, contested, unproven or false with the reason, and write a short verdict the user can quote — while medical and financial claims point to the official source and never become personal advice. Use when the user brings a specific claim to check: "is it true that", "this sounds off", "check this", "did X really happen". Not for open research questions ("what do studies say") or comparing products — answer those directly or with big-purchase.`,
        },
        {
          name: 'decision-grill',
          description: `Interview the user about a big personal commitment — renovating, moving house, changing jobs, a large outlay — in batched rounds of 3–5 numbered questions, each with a recommended answer they can accept, until the constraints, budget, dealbreakers and the real motivation are explicit, then write a decision brief the user approves. Use when someone says "should I" about a commitment or "help me decide", "thinking about renovating", "I'm torn between". Not for choosing between named products or models — that is big-purchase.`,
        },
        {
          name: 'teach-me',
          description: `Tutor the user across sessions on a topic they actually want to learn, keeping a small workspace with a MISSION.md that records why they care, their current level and the goal in their own words, plus a lesson log; every session reads both, teaches one bounded thing with a worked example, sets a small practice task between sessions, and appends to the log. Use when someone says "teach me", "help me learn", "I want to understand" or "explain it like I'll need to use it".`,
        },
      ],
    },
  ];

  /**
   * The locale namespace one pack owns. A namespace's texts have exactly one
   * owner (`ctx.locale.register` refuses a second registration of the same
   * namespace and locale), so the four entries cannot share one name.
   * @param pack - the pack whose form is being registered.
   */
  function nsOf(pack) {
    return `skill-pack-${pack.row.replace(/^dsh-skill-pack-/u, '')}`;
  }

  /** The form's own copy. Skill names and descriptions are pack content. */
  const EN = {
    summary: '{on} of {total} skills on',
    save: 'Save',
    saving: 'Saving…',
    saveFailed: 'Not saved: the profile refused the change.',
    readOnly: 'This profile does not accept configuration changes.',
    loading: 'Loading this pack’s skills…',
    unavailable: 'This profile does not expose this pack’s configuration.',
    switchLabel: 'Serve {name}',
  };
  const ZH = {
    summary: '{total} 个技能，已开启 {on} 个',
    save: '保存',
    saving: '保存中…',
    saveFailed: '未保存：配置文件拒绝了这次修改。',
    readOnly: '该配置文件不接受修改。',
    loading: '正在读取这个技能包…',
    unavailable: '该配置文件没有提供这个技能包的设置。',
    switchLabel: '启用 {name}',
  };

  /** The form's styles: copied from the Host switch and settings footer, `spk-` namespaced. */
  const CSS = `
.spk-form { display: flex; flex-direction: column; }
.spk-list { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.spk-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-top: 1px solid var(--dsw-alias-border-l2); }
.spk-row:first-child { border-top: 0; padding-top: 0; }
.spk-text { flex: 1; min-width: 0; }
.spk-name { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-primary); }
.spk-description { margin: 4px 0 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); }
.spk-notice { margin: 0 0 12px; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-tertiary); }
.spk-footer { display: flex; align-items: center; gap: 8px; padding-top: 16px; }
.spk-failed { flex: 1; min-width: 0; margin: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-error); }
.spk-save { appearance: none; border: 1px solid transparent; border-radius: 8px; padding: 5px 14px; font: inherit; font-size: 13px; line-height: 1.5; cursor: pointer; background: var(--dsw-alias-label-primary); color: var(--dsw-alias-bg-layer-3); }
.spk-save:disabled { opacity: 0.4; cursor: default; }
.spk-save:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 1px; }
.spk-switch { box-sizing: border-box; position: relative; flex: 0 0 auto; width: 36px; height: 20px; padding: 2px; border: 0; border-radius: 999px; background: var(--dsw-alias-border-l3); cursor: pointer; }
.spk-switch[aria-checked='true'] { background: var(--dsw-alias-brand-primary); }
.spk-switch:disabled { cursor: default; opacity: 0.5; }
.spk-switch:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px; }
.spk-thumb { display: block; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-label-primary-foreground); transition: transform 0.12s ease; }
.spk-switch[aria-checked='false'] .spk-thumb { background: var(--dsw-alias-switch-thumb); }
.spk-switch[aria-checked='true'] .spk-thumb { transform: translate(16px); }
`;

  /** The `plugins.row.config` key a pack registers under. */
  function keyOf(pack) {
    return `${pack.id}#${pack.row}`;
  }

  /** Interpolate `{name}` placeholders when no locale `t` is seated. */
  function format(text, params) {
    return String(text).replace(/\{(\w+)\}/gu, (whole, name) => (params !== undefined && name in params ? String(params[name]) : whole));
  }

  /** Fallback translator over {@link EN}; the slot seats the real one. */
  function fallbackT(key, params) {
    return format(EN[key] ?? key, params);
  }

  /**
   * The flags the accepted config carries. Only an explicit `true` serves a
   * skill (the provider reads the same rule), so a missing name is off.
   * @param form - the row's `ConfigPageForm`, or undefined when the namespace is
   *   not exposed to this profile.
   * @param pack - the pack whose skills are shown.
   * @returns one boolean per known skill.
   */
  function flagsOf(form, pack) {
    const value = form === undefined || form === null ? undefined : form.state?.value;
    const map = value === null || typeof value !== 'object' ? undefined : value.skills;
    const flags = {};
    for (const skill of pack.skills) {
      flags[skill.name] = map !== null && typeof map === 'object' && map[skill.name] === true;
    }
    return flags;
  }

  /**
   * The write for one save: exactly the skills the user flipped, addressed by
   * path so every other field of the row (and every unknown skill name) is left
   * alone.
   * @param wanted - the flags the form shows.
   * @param accepted - the flags the Host last accepted.
   * @param pack - the pack whose skills are compared.
   * @returns ordered `set` ops; empty when nothing changed.
   */
  function diffOps(wanted, accepted, pack) {
    const ops = [];
    for (const skill of pack.skills) {
      const want = wanted[skill.name] === true;
      if (want === (accepted[skill.name] === true)) continue;
      ops.push({ op: 'set', path: ['skills', skill.name], value: want });
    }
    return ops;
  }

  /**
   * Save the flipped skills through the config editor.
   *
   * A refusal or a rejected write is a failure the caller must show; only a
   * `true` answer means the profile accepted the change.
   * @param form - the row's `ConfigPageForm`.
   * @param wanted - the flags the user chose.
   * @param pack - the pack being edited.
   * @returns `{ ok: true, ops }`, or `{ ok: false, code, ops, error? }` with
   *   `code` one of `no-form`, `read-only`, `failed`.
   */
  async function saveSkillFlags(form, wanted, pack) {
    const state = form === undefined || form === null ? undefined : form.state;
    if (state === undefined || (state.status !== undefined && state.status !== 'ready')) {
      return { ok: false, code: 'no-form', ops: [] };
    }
    if (state.writable === false) return { ok: false, code: 'read-only', ops: [] };
    const ops = diffOps(wanted ?? flagsOf(form, pack), flagsOf(form, pack), pack);
    if (ops.length === 0) return { ok: true, ops };
    let accepted;
    try {
      accepted = await form.mutate(ops, state.revision);
    } catch (error) {
      return { ok: false, code: 'failed', ops, error };
    }
    return accepted === true ? { ok: true, ops } : { ok: false, code: 'failed', ops };
  }

  /**
   * Build the form component for one pack. A component factory, not a component:
   * the same file serves four packs and each registration closes over its own.
   * @param React - the browser module table's React.
   * @param pack - the pack this form edits.
   * @returns the slot component.
   */
  function createForm(React, pack) {
    const h = React.createElement;

    /**
     * The row's Configure page: one switch per vendored skill and one Save.
     * @param props - the slot's owner props (`view`, `form`) plus the seated `t`.
     */
    function SkillPackSettings(props) {
      const t = typeof props.t === 'function' ? props.t : fallbackT;
      const form = props.form;
      const state = form === undefined || form === null ? undefined : form.state;
      const [pending, setPending] = React.useState(null);
      const [saving, setSaving] = React.useState(false);
      const [failure, setFailure] = React.useState(null);
      const accepted = flagsOf(form, pack);
      const wanted = pending === null ? accepted : pending;
      const on = pack.skills.filter((skill) => wanted[skill.name] === true).length;

      if (props.view === 'summary') {
        return t('summary', { on: String(on), total: String(pack.skills.length) });
      }
      if (state === undefined || state.status === 'unavailable') {
        return h('p', { className: 'spk-notice', role: 'status' }, t('unavailable'));
      }
      if (state.status === 'loading') {
        return h('p', { className: 'spk-notice', role: 'status' }, t('loading'));
      }

      const writable = state.writable !== false;
      const disabled = !writable || saving;
      const dirty = pack.skills.some((skill) => (wanted[skill.name] === true) !== (accepted[skill.name] === true));

      async function save() {
        setSaving(true);
        setFailure(null);
        const outcome = await saveSkillFlags(form, wanted, pack);
        setSaving(false);
        if (outcome.ok === true) {
          setPending(null);
          return;
        }
        setFailure(t(outcome.code === 'read-only' ? 'readOnly' : 'saveFailed'));
      }

      const rows = pack.skills.map((skill) => h(
        'li',
        { className: 'spk-row', key: skill.name },
        h(
          'div',
          { className: 'spk-text' },
          h('code', { className: 'spk-name' }, skill.name),
          h('p', { className: 'spk-description' }, skill.description),
        ),
        h(
          'button',
          {
            type: 'button',
            role: 'switch',
            'aria-checked': wanted[skill.name] === true,
            'aria-label': t('switchLabel', { name: skill.name }),
            className: 'spk-switch',
            disabled,
            onClick: () => {
              setFailure(null);
              setPending({ ...wanted, [skill.name]: wanted[skill.name] !== true });
            },
          },
          h('span', { className: 'spk-thumb' }),
        ),
      ));

      return h(
        'div',
        { className: 'spk-form', 'data-skill-pack': pack.id },
        writable ? null : h('p', { className: 'spk-notice', role: 'status' }, t('readOnly')),
        h('ul', { className: 'spk-list' }, rows),
        h(
          'div',
          { className: 'spk-footer' },
          failure === null ? null : h('p', { className: 'spk-failed', role: 'alert' }, failure),
          h(
            'button',
            {
              type: 'button',
              className: 'spk-save',
              disabled: !writable || saving || !dirty,
              'aria-busy': saving,
              onClick: save,
            },
            saving ? t('saving') : t('save'),
          ),
        ),
      );
    }

    return SkillPackSettings;
  }

  /** The styles, injected once per materialisation; the module table owns the tag. */
  function injectStyles() {
    if (typeof document === 'undefined' || document === null || document.head === undefined || document.head === null) return;
    const style = document.createElement('style');
    style.setAttribute('data-plugin-css', 'skill-pack');
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /** What a test reads back: the table, the pure decisions, and the component factory. */
  const logic = {
    PACKS,
    nsOf,
    EN,
    keyOf,
    format,
    flagsOf,
    diffOps,
    saveSkillFlags,
    createForm,
  };

  /**
   * One pack's bundle registration: the factory materialises the form for that
   * pack and hands back the plugin Cordis activates.
   * @param pack - the pack this entry edits.
   * @returns the `window.__ModuleLoader__.load` registration.
   */
  function registrationFor(pack) {
    return {
      id: pack.id,
      factory(require) {
        const React = require('react');
        injectStyles();
        return {
          inject: ['slots', 'locale'],
          apply(ctx) {
            const ns = nsOf(pack);
            ctx.effect(() => ctx.locale.register(ns, { en: EN, zh: ZH }), 'skill-pack: dictionaries');
            ctx.slots.inject('plugins.row.config', () => ctx.slots.register({
              name: 'plugins.row.config',
              key: keyOf(pack),
              locale: ns,
            }, createForm(React, pack)));
          },
          __logic: { ...logic, pack },
        };
      },
    };
  }

  const target = typeof window === 'undefined' || window === null ? undefined : window.__ModuleLoader__;
  if (target === undefined || target === null || typeof target.load !== 'function') return;
  if (target.mode === 'queue') {
    // Before the module system exists the facade only queues; registering the
    // same id twice would throw when the queue drains, so remember our own.
    const queued = globalThis.__skillPackBundle ?? (globalThis.__skillPackBundle = new Set());
    for (const pack of PACKS) {
      if (queued.has(pack.id)) continue;
      queued.add(pack.id);
      target.load(registrationFor(pack));
    }
    return;
  }
  // Live: an id that is already registered throws. That is the normal case for
  // three of the four packs (this one file serves all of them), and the only
  // case that must be tolerated; a pruned or invalidated id registers again.
  for (const pack of PACKS) {
    try {
      target.load(registrationFor(pack));
    } catch {
      continue;
    }
  }
})();
