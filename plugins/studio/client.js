/**
 * Browser half of the Studio.
 *
 * One left-sidebar entry (`sidebar.panellist`, id `studio`) and the page it
 * selects (`main`, key `studio`). Two views over one library:
 *
 *  - **Home** — the brief composer, a quick-starts row, and the most recent
 *    works. Draft it asks the Workspace service for a new conversation whose
 *    composer already holds the brief; it never sends, so the user still reads
 *    and edits before the studio skill runs in chat.
 *  - **Works** — the library the Host keeps, as a thumbnail grid. A tile with no
 *    thumbnail gets a placeholder; selecting one shows its details with the
 *    artifact path, an in-page preview, PNG/PDF export buttons, and "make one
 *    like this" — another prefilled conversation that reuses the work's visual
 *    language. There is no file-open channel here: the page shows the path and
 *    stops, rather than inventing an opener.
 *
 * The list comes from the Host over the same `/api` channel the other pages use
 * (`GET /api/studio`), never from the filesystem. The client therefore never
 * needs to know where `$DSH_HOME` is, and the plugin's data has one owner. A
 * focus re-read keeps the list current when a work is delivered while the page
 * is open, and a delivered work's preview is served by the same library row.
 *
 * Styling is one injected stylesheet, host theme tokens with per-token
 * fallbacks, so a renamed token degrades instead of going black and light/dark
 * follows without a second palette. All copy goes through the Client locale
 * service; `locale/en.json` mirrors this dictionary for the Plugin Manager
 * entry, and the selftest keeps the two in step. The prompt text the composer
 * carries is model-facing content rather than UI copy, so it lives beside the
 * builders that compose it.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-studio',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useRef, useState } = React;

    const PANEL_ID = 'studio';
    const NS = 'dsh-studio';
    const STYLE_ATTR = 'data-dsh-studio-styles';
    /** The Home strip is a glance, not the library; four tiles is the glance. */
    const RECENT_LIMIT = 4;

    /** The quick starts, in the order the page shows them, and the module each names. */
    const QUICK_STARTS = [
      { key: 'quickDeck', module: 'deck' },
      { key: 'quickWeb', module: 'web' },
      { key: 'quickMotion', module: 'motion' },
      { key: 'quickInfographic', module: 'infographic' },
    ];

    const en = {
      panel: 'Studio',
      home: 'Home',
      works: 'Works',
      views: 'Studio views',
      subtitle: 'Delivered designs, in one place.',
      brief: 'Brief',
      briefPlaceholder: 'What should the studio make?',
      draft: 'Draft it',
      draftNote: 'Opens a new conversation with the words written out — review, then send.',
      quickStarts: 'Quick starts',
      quickDeck: 'A deck',
      quickWeb: 'A landing page',
      quickMotion: 'A motion loop',
      quickInfographic: 'An infographic',
      recent: 'Recent works',
      seeAll: 'See all works',
      loading: 'Reading the works library…',
      loadFailed: 'Could not read the works library',
      retry: 'Retry',
      emptyTitle: 'No works yet',
      emptyBody: "Designs you ask for in chat show up here when they're ready.",
      emptyRecent: 'Nothing delivered yet.',
      askInChat: 'Or ask in chat: “design a deck for the offsite”.',
      module: 'Type',
      theme: 'Theme',
      registered: 'Delivered',
      untitled: 'Untitled work',
      path: 'Path',
      copyPath: 'Copy path',
      copied: 'Copied',
      copyFailed: 'Select the path and copy it.',
      preview: 'Preview',
      previewLoading: 'Loading the preview…',
      previewFailed: 'The preview could not load. The file may be missing, or too large to show here.',
      nonHtmlNote: 'Video and other non-page works open in chat — copy the path to find the file.',
      makeLike: 'Make one like this',
      exportPng: 'Export PNG',
      exportPdf: 'Export PDF',
      exportPreparing: 'Preparing…',
      exportFailed: 'Could not export this work. Try again.',
      draftFailed: 'Could not open a new conversation. Your brief is still here.',
      draftUnavailable: "Drafting isn't available here — you can still ask in chat.",
      close: 'Close',
      selectHint: 'Choose a work to see its details.',
    };

    const CSS = `
.stu-page {
  height: 100%; overflow: auto; display: flex; flex-direction: column;
  color: var(--dsw-alias-label-primary, #111827); font-family: inherit;
}
.stu-head {
  position: sticky; top: 0; z-index: 2;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 18px; border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24));
  background: var(--dsw-alias-bg-base, #fff);
}
.stu-head h1 { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: .01em; }
.stu-sub { margin: 2px 0 0; font-size: 11.5px; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.stu-seg {
  display: flex; padding: 2px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 7px;
  background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.04));
}
.stu-seg button {
  height: 22px; padding: 0 11px; border: 1px solid transparent; border-radius: 5px;
  background: transparent; color: var(--dsw-alias-label-secondary, #6b7280);
  font: inherit; font-size: 12px; cursor: pointer;
}
.stu-seg button[aria-pressed="true"] {
  background: var(--dsw-alias-bg-base, #fff); border-color: var(--dsw-alias-border-l1, rgba(127,127,127,.24));
  color: var(--dsw-alias-label-primary, #111827); font-weight: 600;
}
.stu-count {
  margin-left: 5px; font-size: 10.5px; font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-tertiary, #9ca3af); font-weight: 400;
}
.stu-body {
  width: 100%; max-width: 1080px; margin: 0 auto; padding: 18px 22px 30px;
  box-sizing: border-box; display: flex; flex-direction: column; gap: 18px;
}
.stu-section { display: flex; flex-direction: column; gap: 10px; }
.stu-sechead { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.stu-section h2, .stu-sechead h2 {
  margin: 0; font-size: 10.5px; font-weight: 700; letter-spacing: .1em;
  text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #9ca3af);
}
.stu-card {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px 14px; border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.04));
}
.stu-label {
  font-size: 10.5px; font-weight: 700; letter-spacing: .09em;
  text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #9ca3af);
}
.stu-brief {
  width: 100%; min-height: 96px; resize: vertical; box-sizing: border-box;
  padding: 2px; border: 0; background: transparent; color: inherit;
  font: inherit; font-size: 13px; line-height: 1.6;
}
.stu-page button:focus-visible, .stu-page a:focus-visible, .stu-page textarea:focus-visible,
.stu-page iframe:focus-visible, .stu-detail:focus-visible, .stu-dialog:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, #3b6ef6); outline-offset: 2px;
}
.stu-composerfoot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding-top: 8px; border-top: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24));
}
.stu-hint { margin: 0; font-size: 10.5px; line-height: 1.5; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.stu-note { margin: 0; font-size: 12px; line-height: 1.5; color: var(--dsw-alias-label-secondary, #6b7280); }
.stu-primary {
  height: 30px; padding: 0 14px; border: 0; border-radius: 7px; cursor: pointer;
  background: var(--dsw-alias-brand-primary, #3b6ef6); color: var(--dsw-alias-label-primary-foreground, #fff);
  font: inherit; font-size: 12.5px; font-weight: 600;
}
.stu-primary:disabled { opacity: .5; cursor: default; }
.stu-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.stu-chip {
  height: 28px; padding: 0 12px; border: 1px dashed var(--dsw-alias-border-l2, rgba(127,127,127,.42));
  border-radius: 999px; background: transparent; color: var(--dsw-alias-label-secondary, #6b7280);
  font: inherit; font-size: 12px; cursor: pointer;
}
.stu-chip:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08)); }
.stu-chip:disabled { opacity: .7; cursor: default; }
.stu-link {
  padding: 0; border: 0; background: none; color: var(--dsw-alias-link, #3b6ef6);
  font: inherit; font-size: 12px; cursor: pointer;
}
.stu-link:hover { text-decoration: underline; }
.stu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.stu-recents { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.stu-tile {
  display: flex; flex-direction: column; gap: 0; padding: 0; overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 9px;
  background: var(--dsw-alias-card-fill, rgba(127,127,127,.04)); color: inherit; font: inherit;
  text-align: left; cursor: pointer;
}
.stu-tile:hover { background: var(--dsw-alias-card-fill-hover, rgba(127,127,127,.08)); }
.stu-tile[aria-pressed="true"] {
  border-color: var(--dsw-alias-brand-primary, #3b6ef6);
  box-shadow: 0 0 0 1px var(--dsw-alias-brand-primary, #3b6ef6);
}
.stu-thumb {
  display: block; width: 100%; aspect-ratio: 16 / 10; overflow: hidden;
  background: var(--dsw-alias-bg-layer-2, rgba(127,127,127,.10));
}
.stu-recents .stu-thumb { aspect-ratio: 16 / 9; }
.stu-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.stu-thumbph {
  display: grid; place-items: center; width: 100%; height: 100%;
  color: var(--dsw-alias-label-quaternary, #9ca3af);
}
.stu-tilebody { display: flex; flex-direction: column; gap: 3px; padding: 8px 10px 10px; }
.stu-tiletitle {
  font-size: 12.5px; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.stu-tilemeta {
  font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #9ca3af);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.stu-detail {
  display: flex; flex-direction: column; gap: 10px;
  padding: 12px 14px; border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.04));
}
.stu-detailhead { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.stu-detailhead h2 { margin: 0; font-size: 14.5px; font-weight: 600; letter-spacing: -.01em; }
.stu-facts {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px 16px; margin: 0;
}
.stu-fact { display: flex; flex-direction: column; gap: 1px; }
.stu-fact dt {
  font-size: 9.5px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #9ca3af);
}
.stu-fact dd { margin: 0; font-size: 12.5px; }
.stu-pathrow {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding-top: 2px;
}
.stu-path {
  flex: 1 1 260px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px; color: var(--dsw-alias-label-tertiary, #9ca3af);
  word-break: break-all; user-select: text;
}
.stu-btn {
  height: 26px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24));
  border-radius: 7px; background: transparent; color: var(--dsw-alias-label-primary, #111827);
  font: inherit; font-size: 11.5px; cursor: pointer;
}
.stu-btn:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08)); }
.stu-btn:disabled { opacity: .5; cursor: default; }
.stu-btn:disabled:hover { background: transparent; }
.stu-actions { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 9px; border-top: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); }
.stu-actions .stu-primary { height: 26px; padding: 0 12px; font-size: 11.5px; }
.stu-download {
  display: inline-flex; align-items: center; box-sizing: border-box;
  text-decoration: none; line-height: 1;
}
.stu-overlay {
  position: fixed; inset: 0; z-index: 60; display: grid; place-items: center;
  padding: 24px; box-sizing: border-box;
  background: var(--dsw-alias-bg-mask-1, rgba(0,0,0,.45));
}
.stu-dialog {
  display: flex; flex-direction: column; gap: 10px;
  width: min(1040px, 100%); height: min(92vh, 900px); max-height: 100%;
  padding: 12px 14px 14px; box-sizing: border-box;
  border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 12px;
  background: var(--dsw-alias-bg-base, #fff);
  box-shadow: 0 18px 60px var(--dsw-alias-bg-mask-drop, rgba(0,0,0,.28));
}
.stu-dialoghead { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.stu-dialoghead h2 {
  margin: 0; font-size: 14.5px; font-weight: 600; letter-spacing: -.01em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.stu-dialogbody { display: flex; flex-direction: column; gap: 8px; flex: 1 1 auto; min-height: 0; }
.stu-dialogbody > .stu-hint { margin: 0; padding: 4px 2px; }
.stu-frame {
  flex: 1 1 auto; width: 100%; min-height: 0; border: 0; border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.04));
}
.stu-empty { margin: 0; padding: 26px 2px; font-size: 13px; line-height: 1.6; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.stu-empty h2 { margin: 0 0 6px; font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-secondary, #6b7280); }
.stu-empty p { margin: 0 0 6px; }
.stu-error {
  display: flex; align-items: center; gap: 10px; padding: 9px 12px;
  border: 1px solid var(--dsw-alias-state-error-primary, #c62828); border-radius: 8px;
  color: var(--dsw-alias-state-error-primary, #c62828); font-size: 12px;
}
.stu-error button {
  margin-left: auto; padding: 2px 9px; border: 1px solid currentColor;
  border-radius: 6px; background: transparent; color: inherit;
  font: inherit; font-size: 12px; cursor: pointer;
}
.stu-muted { margin: 0; font-size: 12px; color: var(--dsw-alias-label-tertiary, #9ca3af); }
`;

    /** One stylesheet for the page, removed when the plugin unloads. */
    function injectStyles() {
      if (typeof document === 'undefined') return () => {};
      if (typeof document.querySelector === 'function' && document.querySelector(`style[${STYLE_ATTR}]`) !== null) {
        return () => {};
      }
      const tag = document.createElement('style');
      tag.setAttribute(STYLE_ATTR, '');
      tag.dataset.plugin = '@local/dsh-studio';
      tag.textContent = CSS;
      document.head.appendChild(tag);
      return () => {
        if (typeof tag.remove === 'function') tag.remove();
      };
    }

    /* ── the Host route ───────────────────────────────────────────────────── */

    async function call(relative) {
      const response = await fetch(new URL(relative, document.baseURI).toString(), {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const text = await response.text();
      let payload = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        /* non-JSON body */
      }
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error ?? `HTTP ${response.status}`);
      }
      return payload;
    }

    /* ── drafting a new conversation ──────────────────────────────────────── */

    /*
     * These prompts are read by the person in the composer before they send, so
     * they are written the way a colleague would brief the studio: plain nouns,
     * no tool ids, no module tokens, and a worked example the person can
     * overwrite. They stay short enough to edit; the page fills the composer
     * and never sends.
     */

    /** The last line of every prompt: the draft is editable, nothing is sent yet. */
    const EDIT_HINT = 'This is a starting point — edit it before sending.';

    /** A worked example, not a placeholder: the reader overwrites the words. */
    const TOPIC_EXAMPLE = {
      deck: 'Topic: a deck for our quarterly offsite',
      web: 'Topic: a landing page for our farmers market',
      motion: 'Topic: a short loop announcing our spring sale',
      infographic: 'Topic: an infographic about where our water goes',
    };

    /**
     * A plain noun for each kind of work, used to describe the task in the
     * prompt. The stored module token is never shown to the person reading it.
     */
    const MODULE_TASK = {
      deck: 'a deck',
      web: 'a landing page',
      motion: 'a motion loop',
      infographic: 'an infographic',
    };

    /**
     * A delivered brief as a prompt that reaches the studio skill.
     *
     * The user's words sit on their own line with a full stop, so a brief that
     * does not end in punctuation cannot run into the next sentence. The rest
     * says what to do and where the result goes in ordinary language.
     * @param {string} text - what the user typed.
     * @returns {string} the prompt for the new conversation's composer.
     */
    function freeBrief(text) {
      const brief = String(text ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      // The page only calls this with text, but an empty brief is refused here
      // too: a prompt with an empty task sentence is worse than no prompt.
      if (!brief) return '';
      const sentence = /[.!?]$/.test(brief) ? brief : `${brief}.`;
      return [
        'Use the studio skill for this.',
        '',
        `The design task is: ${sentence}`,
        '',
        'Follow the studio process: offer three directions first, wait for me to pick one, then execute that direction.',
        'When the design is ready, save it to my works.',
        '',
        EDIT_HINT,
      ].join('\n');
    }

    /**
     * A quick start: the kind of work, the process, and a worked topic line.
     * @param {string} moduleId - deck, web, motion or infographic.
     * @returns {string} the prompt, or '' for an unknown module.
     */
    function quickStart(moduleId) {
      const id = String(moduleId ?? '')
        .trim()
        .toLowerCase();
      const task = MODULE_TASK[id];
      if (!task) return '';
      const process = [
        'Follow the studio process: offer three directions first, wait for me to pick one, then execute that direction.',
        'When the design is ready, save it to my works.',
      ];
      if (id === 'motion') {
        // A motion piece is a video, not a page the Studio can preview; say so
        // where the person is about to ask for one.
        process.push('The finished piece arrives as a video in this conversation.');
      }
      return [
        `Use the studio skill to make ${task}.`,
        '',
        process.join(' '),
        '',
        TOPIC_EXAMPLE[id],
        '',
        EDIT_HINT,
      ].join('\n');
    }

    /**
     * A new work in the visual language of an existing one. The reference is
     * named by title and theme rather than by path: the person reading it knows
     * the work by name, and the new conversation can find it in the library.
     * @param {object} work - the row the user selected.
     * @returns {string} the prompt.
     */
    function makeLike(work) {
      const title = typeof work?.title === 'string' && work.title.trim() ? work.title.trim() : 'Untitled work';
      const theme =
        typeof work?.theme === 'string' && work.theme.trim() ? `'${work.theme.trim()}'` : 'not recorded';
      const task = MODULE_TASK[typeof work?.module === 'string' ? work.module.trim() : ''] ?? 'a design';
      return [
        'Use the studio skill.',
        '',
        `Find the work titled '${title}' in my works library (theme: ${theme}), read its file, and reuse its visual language.`,
        '',
        'Follow the studio process: offer three directions first, wait for me to pick one, then execute that direction.',
        `When the design is ready, save it to my works as ${task}.`,
        '',
        'New content: a launch page for our autumn workshops',
        '',
        EDIT_HINT,
      ].join('\n');
    }

    /**
     * The Workspace service, or null.
     *
     * `uiWorkspace` is in this plugin's `inject`, so a profile without the
     * workspace client row parks the whole panel instead of reaching this
     * guard. The guard is belt-and-braces for a context whose service is
     * missing at apply time: the page then renders with drafting disabled and
     * says why, rather than throwing during registration.
     * @param {object} ctx - the plugin context.
     * @returns {object|null} the service.
     */
    function workspaceService(ctx) {
      if (!ctx) return null;
      let service = null;
      try {
        service = typeof ctx.get === 'function' ? ctx.get('uiWorkspace') : ctx.uiWorkspace;
      } catch {
        service = null;
      }
      return service && typeof service.startSession === 'function' ? service : null;
    }

    /**
     * Ask for a new conversation carrying `prompt`. Never sends: the composer
     * holds the text and the user presses send after reading it.
     * @param {object|null} service - the Workspace service.
     * @param {string} prompt - the built prompt.
     * @returns {boolean} whether a conversation was requested.
     */
    function startSessionFor(service, prompt) {
      const text = typeof prompt === 'string' ? prompt.trim() : '';
      if (!text) return false;
      if (!service || typeof service.startSession !== 'function') return false;
      service.startSession(undefined, { prompt: text, whenDraftExists: 'replace' });
      return true;
    }

    /**
     * Draft a free brief into a new conversation.
     * @param {object|null} service - the Workspace service.
     * @param {string} brief - what the user typed.
     * @returns {boolean} whether a conversation was requested.
     */
    function draftBrief(service, brief) {
      const text = typeof brief === 'string' ? brief.trim() : '';
      if (!text) return false;
      return startSessionFor(service, freeBrief(text));
    }

    /**
     * Ask for a conversation and describe the outcome for the page.
     *
     * The message is friendly copy; a thrown exception's text goes into the
     * error row's title only, so the visible line stays readable.
     * @param {object|null} service - the Workspace service.
     * @param {string} prompt - the built prompt.
     * @param {(key: string) => string} t - the page translator.
     * @returns {{ok: boolean, error?: string, detail?: string}} the outcome.
     */
    function draftFrom(service, prompt, t) {
      if (!service) return { ok: false, error: t('draftUnavailable') };
      try {
        return startSessionFor(service, prompt) ? { ok: true } : { ok: false, error: t('draftUnavailable') };
      } catch (cause) {
        return { ok: false, error: t('draftFailed'), detail: String(cause?.message ?? cause) };
      }
    }

    /** The file name a download response asked for, or a safe fallback. */
    function filenameFromDisposition(header, fallback) {
      const match = /filename="([^"]+)"/.exec(typeof header === 'string' ? header : '');
      return match ? match[1] : fallback;
    }

    /**
     * Ask the export route for one file and hand back what to save.
     *
     * Failure is a sentence: the Host's JSON error is already written for the
     * person reading it, so it becomes the message rather than a stack. Pure
     * enough to test with a stub fetch — no DOM and no object URLs here.
     * @param {Function} fetchImpl - `fetch`.
     * @param {object} work - the row being exported.
     * @param {string} format - png or pdf.
     * @returns {Promise<{ok: boolean, blob?: Blob, filename?: string, error?: string}>} the outcome.
     */
    async function downloadExport(fetchImpl, work, format) {
      let response;
      try {
        response = await fetchImpl(exportUrl(work, format), { credentials: 'same-origin', cache: 'no-store' });
      } catch {
        return { ok: false, error: 'Could not reach the server for this export. Try again.' };
      }
      if (!response.ok) {
        let sentence = `Could not export this work (HTTP ${response.status}).`;
        try {
          const payload = await response.json();
          if (payload && typeof payload.error === 'string' && payload.error) sentence = payload.error;
        } catch {
          // A non-JSON body keeps the HTTP sentence.
        }
        return { ok: false, error: sentence };
      }
      try {
        const blob = await response.blob();
        const header = typeof response.headers?.get === 'function' ? response.headers.get('content-disposition') : '';
        return { ok: true, blob, filename: filenameFromDisposition(header, `studio-work.${format}`) };
      } catch {
        return { ok: false, error: 'The export arrived unreadable. Try again.' };
      }
    }

    /**
     * Check that the preview will load before the frame asks for it. An iframe
     * fires no error event for a 404 or 413, so the status has to come from a
     * request the page can read.
     * @param {Function} fetchImpl - `fetch`.
     * @param {object} work - the row being previewed.
     * @returns {Promise<{ok: boolean, error?: string|null}>} the outcome.
     */
    async function probePreview(fetchImpl, work) {
      try {
        const response = await fetchImpl(previewUrl(work), { credentials: 'same-origin', cache: 'no-store' });
        if (response.ok) return { ok: true };
        let error = null;
        try {
          const payload = await response.json();
          if (payload && typeof payload.error === 'string' && payload.error) error = payload.error;
        } catch {
          // The failed state still reads; the detail is optional.
        }
        return { ok: false, error };
      } catch {
        return { ok: false, error: null };
      }
    }

    /* ── small pieces ─────────────────────────────────────────────────────── */

    /** The newest few, for the Home strip; the Host already sorted them. */
    function recentWorks(works, limit = RECENT_LIMIT) {
      return (Array.isArray(works) ? works : []).slice(0, limit);
    }

    /** The Host's thumbnail route, or null when the work has no thumbnail. */
    function thumbUrl(work) {
      const name = typeof work?.thumb === 'string' ? work.thumb : '';
      if (!name) return null;
      const base = typeof document !== 'undefined' && document.baseURI ? document.baseURI : 'http://localhost/';
      return new URL(`api/studio/thumb?name=${encodeURIComponent(name)}`, base).toString();
    }

    /** Whether this work's artifact is the kind the preview and export routes serve. */
    function isHtmlPath(value) {
      return typeof value === 'string' && value.toLowerCase().endsWith('.html');
    }

    /** The route that serves one work's HTML for the in-page overlay. */
    function previewUrl(work) {
      const id = typeof work?.id === 'string' ? work.id : '';
      const base = typeof document !== 'undefined' && document.baseURI ? document.baseURI : 'http://localhost/';
      return new URL(`api/studio/preview?id=${encodeURIComponent(id)}`, base).toString();
    }

    /**
     * The download route for one work. Only png and pdf exist; an unknown format
     * asks for png rather than building a URL the Host would refuse.
     */
    function exportUrl(work, format) {
      const id = typeof work?.id === 'string' ? work.id : '';
      const kind = format === 'pdf' ? 'pdf' : 'png';
      const base = typeof document !== 'undefined' && document.baseURI ? document.baseURI : 'http://localhost/';
      return new URL(`api/studio/export?id=${encodeURIComponent(id)}&format=${kind}`, base).toString();
    }

    /** `deck` reads as `Deck` in a tile caption. */
    function moduleName(value) {
      const text = typeof value === 'string' ? value : '';
      return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
    }

    /** A date the page can show, or nothing when the row is malformed. */
    function formatDay(iso) {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    }

    function StudioGlyph() {
      return h(
        'svg',
        { width: 18, height: 18, viewBox: '0 0 18 18', fill: 'none', 'aria-hidden': 'true' },
        h('rect', { x: 2.4, y: 2.4, width: 13.2, height: 13.2, rx: 3, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', {
          d: 'M5.7 12.3 8.9 5.6l3.4 6.7',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    function Thumb({ work }) {
      const src = thumbUrl(work);
      if (src) return h('span', { className: 'stu-thumb' }, h('img', { src, alt: '', loading: 'lazy' }));
      return h(
        'span',
        { className: 'stu-thumb' },
        h(
          'span',
          { className: 'stu-thumbph', 'aria-hidden': 'true' },
          h(
            'svg',
            { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none' },
            h('rect', { x: 3, y: 4.5, width: 18, height: 15, rx: 2.5, stroke: 'currentColor', strokeWidth: 1.2 }),
            h('path', {
              d: 'M3.4 16.2 9 10.8l4.2 4.1 2.7-2.6 4.7 4.5',
              stroke: 'currentColor',
              strokeWidth: 1.2,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }),
            h('circle', { cx: 8.2, cy: 8.6, r: 1.3, stroke: 'currentColor', strokeWidth: 1.2 }),
          ),
        ),
      );
    }

    function WorkTile({ work, selected, onSelect, t }) {
      const meta = [moduleName(work.module), work.theme].filter(Boolean).join(' · ');
      return h(
        'button',
        {
          type: 'button',
          className: 'stu-tile',
          'aria-pressed': selected,
          onClick: () => onSelect(work),
        },
        h(Thumb, { work }),
        h(
          'span',
          { className: 'stu-tilebody' },
          h('span', { className: 'stu-tiletitle' }, work.title || t('untitled')),
          meta ? h('span', { className: 'stu-tilemeta' }, meta) : null,
        ),
      );
    }

    /**
     * The framed document, separated from the dialog so its three states are
     * plain data: checking the route, ready to frame, or failed with the Host's
     * sentence. An iframe reports no error for a 404/413, which is why the
     * overlay asks first.
     */
    function PreviewBody({ work, state, failure, onFailed, t }) {
      if (state === 'failed') {
        return h('p', { className: 'stu-hint', role: 'alert', title: failure ?? undefined }, t('previewFailed'));
      }
      if (state === 'checking') {
        return h('p', { className: 'stu-hint', role: 'status', 'aria-busy': true }, t('previewLoading'));
      }
      return h('iframe', {
        className: 'stu-frame',
        title: t('preview'),
        sandbox: 'allow-scripts',
        src: previewUrl(work),
        onError: onFailed,
      });
    }

    /**
     * The in-page preview: one dialog over the page, not a second window and not
     * a body-level portal. Escape closes it, focus moves in on open and back to
     * whatever opened it on close, Tab stays inside the dialog, and the framed
     * document is sandboxed to scripts so a delivered page cannot reach the Host
     * page around it.
     */
    function PreviewOverlay({ work, onClose, t }) {
      const dialog = useRef(null);
      const [state, setState] = useState('checking');
      const [failure, setFailure] = useState(null);

      /* The route is checked before the frame is pointed at it, so a missing,
         oversized or non-HTML work shows the failed state instead of a blank
         frame that never reports anything. */
      useEffect(() => {
        let alive = true;
        probePreview(fetch, work).then((result) => {
          if (!alive) return;
          if (result.ok) {
            setState('ready');
          } else {
            setFailure(result.error ?? null);
            setState('failed');
          }
        });
        return () => {
          alive = false;
        };
      }, [work]);

      useEffect(() => {
        const restore = typeof document !== 'undefined' ? document.activeElement : null;
        const node = dialog.current;
        if (node && typeof node.focus === 'function') node.focus();
        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
            return;
          }
          if (event.key !== 'Tab') return;
          const scope = dialog.current;
          if (!scope || typeof scope.querySelectorAll !== 'function') return;
          const focusables = [
            ...scope.querySelectorAll(
              'a[href], button:not([disabled]), textarea, input, select, iframe, [tabindex]:not([tabindex="-1"])',
            ),
          ];
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          const active = typeof document !== 'undefined' ? document.activeElement : null;
          if (event.shiftKey && (active === first || active === scope)) {
            event.preventDefault();
            if (typeof last.focus === 'function') last.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            if (typeof first.focus === 'function') first.focus();
          }
        };
        document.addEventListener('keydown', onKey);
        return () => {
          document.removeEventListener('keydown', onKey);
          if (restore && typeof restore.focus === 'function') restore.focus();
        };
      }, [onClose]);

      const title = work.title || t('untitled');
      return h(
        'div',
        { className: 'stu-overlay', role: 'presentation' },
        h(
          'div',
          {
            className: 'stu-dialog',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': `${t('preview')}: ${title}`,
            tabIndex: -1,
            ref: dialog,
          },
          h(
            'div',
            { className: 'stu-dialoghead' },
            h('h2', null, title),
            h('button', { type: 'button', className: 'stu-btn', onClick: onClose }, t('close')),
          ),
          h(
            'div',
            { className: 'stu-dialogbody' },
            h(PreviewBody, { work, state, failure, onFailed: () => setState('failed'), t }),
          ),
        ),
      );
    }

    /**
     * The selected work's details: preview, a new work in the same language,
     * exports, and the path. Errors from these actions render inside the panel,
     * where the buttons are, rather than at the top of the page.
     */
    function WorkDetail({ work, onClose, onPreview, workspace, canDraft, t }) {
      const [copyState, setCopyState] = useState('idle');
      const [exporting, setExporting] = useState(null);
      const [actionError, setActionError] = useState(null);
      const [exportError, setExportError] = useState(null);
      const panel = useRef(null);
      const downloadAnchor = useRef(null);
      /* Selecting a tile replaces the hint with this panel; focus it so a
         keyboard user hears what appeared instead of being left behind. */
      useEffect(() => {
        const node = panel.current;
        if (node && typeof node.focus === 'function') node.focus();
      }, []);
      const copyPath = useCallback(() => {
        const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : null;
        if (!clipboard || typeof clipboard.writeText !== 'function') {
          setCopyState('failed');
          return;
        }
        clipboard.writeText(work.path).then(
          () => setCopyState('copied'),
          () => setCopyState('failed'),
        );
      }, [work.path]);

      const makeLikeNow = useCallback(() => {
        if (!canDraft) return;
        const result = draftFrom(workspace, makeLike(work), t);
        setActionError(result.ok ? null : result);
      }, [canDraft, workspace, work, t]);

      /** Save a fetched blob through a hidden anchor that lives in this tree. */
      const saveDownload = useCallback((blob, filename) => {
        const anchor = downloadAnchor.current;
        if (!anchor || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return false;
        const href = URL.createObjectURL(blob);
        anchor.href = href;
        anchor.download = filename;
        if (typeof anchor.click === 'function') anchor.click();
        setTimeout(() => URL.revokeObjectURL(href), 1000);
        return true;
      }, []);

      const runExport = useCallback(
        async (format) => {
          if (exporting) return;
          setExportError(null);
          setActionError(null);
          setExporting(format);
          try {
            const result = await downloadExport(fetch, work, format);
            if (!result.ok) {
              setExportError({ error: result.error });
              return;
            }
            if (!saveDownload(result.blob, result.filename)) setExportError({ error: t('exportFailed') });
          } catch {
            setExportError({ error: t('exportFailed') });
          } finally {
            setExporting(null);
          }
        },
        [exporting, work, t, saveDownload],
      );

      const fact = (label, value) =>
        value ? h('div', { className: 'stu-fact', key: label }, h('dt', null, label), h('dd', null, value)) : null;

      /* The preview and export routes only serve HTML. A motion piece is a
         video, so those controls are absent rather than a row of dead buttons;
         the panel says where the file lives instead. */
      const canRender = isHtmlPath(work.path);

      return h(
        'section',
        { className: 'stu-detail', tabIndex: -1, ref: panel, 'aria-label': work.title || t('untitled') },
        h(
          'div',
          { className: 'stu-detailhead' },
          h('h2', null, work.title || t('untitled')),
          h('button', { type: 'button', className: 'stu-btn', onClick: onClose }, t('close')),
        ),
        h(
          'dl',
          { className: 'stu-facts' },
          fact(t('module'), moduleName(work.module)),
          fact(t('registered'), formatDay(work.createdAt)),
          fact(t('theme'), work.theme),
        ),
        h(
          'div',
          { className: 'stu-actions' },
          canRender
            ? h('button', { type: 'button', className: 'stu-btn stu-primary', onClick: () => onPreview(work) }, t('preview'))
            : null,
          h(
            'button',
            {
              type: 'button',
              className: 'stu-btn',
              disabled: !canDraft,
              title: canDraft ? undefined : t('draftUnavailable'),
              onClick: makeLikeNow,
            },
            t('makeLike'),
          ),
          canRender
            ? h(
                'button',
                { type: 'button', className: 'stu-btn', disabled: Boolean(exporting), onClick: () => runExport('png') },
                t('exportPng'),
              )
            : null,
          canRender
            ? h(
                'button',
                { type: 'button', className: 'stu-btn', disabled: Boolean(exporting), onClick: () => runExport('pdf') },
                t('exportPdf'),
              )
            : null,
        ),
        h('p', { className: 'stu-note' }, t('draftNote')),
        canRender ? null : h('p', { className: 'stu-note' }, t('nonHtmlNote')),
        exporting ? h('p', { className: 'stu-note', role: 'status', 'aria-busy': true }, t('exportPreparing')) : null,
        actionError ? h(ErrorRow, { message: actionError.error, detail: actionError.detail, t }) : null,
        exportError ? h(ErrorRow, { message: exportError.error, detail: exportError.detail, t }) : null,
        h(
          'div',
          { className: 'stu-pathrow' },
          h('span', { className: 'stu-label' }, t('path')),
          h('code', { className: 'stu-path' }, work.path),
          h('button', { type: 'button', className: 'stu-btn', onClick: copyPath }, copyState === 'copied' ? t('copied') : t('copyPath')),
        ),
        copyState === 'failed' ? h('p', { className: 'stu-hint' }, t('copyFailed')) : null,
        h('a', { ref: downloadAnchor, hidden: true, 'aria-hidden': 'true', tabIndex: -1 }),
      );
    }

    /** One inline error, as a sentence; `detail` is the technical text in the tooltip. */
    function ErrorRow({ message, detail, onRetry, t }) {
      return h(
        'div',
        { className: 'stu-error', role: 'alert', title: detail ?? undefined },
        h('span', null, message ?? t('loadFailed')),
        onRetry ? h('button', { type: 'button', onClick: onRetry }, t('retry')) : null,
      );
    }

    /* ── Home ─────────────────────────────────────────────────────────────── */

    /**
     * The composer is controlled by the page and never sends: `onDraft` asks for
     * a prefilled conversation, and the button says why it is off rather than
     * pretending to work when the Workspace service is missing.
     */
    function HomeView({
      works,
      status,
      error,
      brief,
      onBrief,
      onDraft,
      canDraft,
      onQuick,
      onRetry,
      onOpenWork,
      onSeeAll,
      t,
    }) {
      const recents = recentWorks(works);
      const ready = canDraft && typeof brief === 'string' && brief.trim().length > 0;
      return h(
        React.Fragment,
        null,
        h(
          'section',
          { className: 'stu-card' },
          h('label', { className: 'stu-label', htmlFor: 'stu-brief' }, t('brief')),
          h('textarea', {
            id: 'stu-brief',
            className: 'stu-brief',
            rows: 4,
            value: typeof brief === 'string' ? brief : '',
            placeholder: t('briefPlaceholder'),
            onChange: (event) => onBrief(event.target.value),
          }),
          h(
            'div',
            { className: 'stu-composerfoot' },
            h('p', { className: 'stu-note', id: 'stu-draft-note' }, canDraft ? t('draftNote') : t('draftUnavailable')),
            h(
              'button',
              {
                type: 'button',
                className: 'stu-primary',
                disabled: !ready,
                'aria-describedby': 'stu-draft-note',
                onClick: onDraft,
              },
              t('draft'),
            ),
          ),
        ),
        h(
          'section',
          { className: 'stu-section' },
          h('h2', null, t('quickStarts')),
          h(
            'div',
            { className: 'stu-chips' },
            ...QUICK_STARTS.map(({ key, module }) =>
              h(
                'button',
                {
                  type: 'button',
                  className: 'stu-chip',
                  key,
                  disabled: !canDraft,
                  title: canDraft ? undefined : t('draftUnavailable'),
                  onClick: () => onQuick(module),
                },
                t(key),
              ),
            ),
          ),
        ),
        h(
          'section',
          { className: 'stu-section' },
          h(
            'div',
            { className: 'stu-sechead' },
            h('h2', null, t('recent')),
            works.length ? h('button', { type: 'button', className: 'stu-link', onClick: onSeeAll }, t('seeAll')) : null,
          ),
          status === 'error'
            ? h(ErrorRow, { message: t('loadFailed'), detail: error, onRetry, t })
            : status === 'loading'
              ? h('p', { className: 'stu-muted', role: 'status', 'aria-busy': true }, t('loading'))
              : recents.length
                ? h(
                    'div',
                    { className: 'stu-recents' },
                    ...recents.map((work) => h(WorkTile, { key: work.id, work, selected: false, onSelect: onOpenWork, t })),
                  )
                : h(
                    React.Fragment,
                    null,
                    h('p', { className: 'stu-muted' }, t('emptyRecent')),
                    h('p', { className: 'stu-hint' }, t('askInChat')),
                  ),
        ),
      );
    }

    /* ── Works ────────────────────────────────────────────────────────────── */

    function WorksView({ works, status, error, selected, onSelect, onClose, onPreview, workspace, canDraft, onRetry, t }) {
      const current = works.find((work) => work.id === selected) ?? null;
      if (status === 'error') return h(ErrorRow, { message: t('loadFailed'), detail: error, onRetry, t });
      if (status === 'loading') return h('p', { className: 'stu-empty', role: 'status', 'aria-busy': true }, t('loading'));
      if (!works.length) {
        return h(
          'div',
          { className: 'stu-empty' },
          h('h2', null, t('emptyTitle')),
          h('p', null, t('emptyBody')),
          h('p', { className: 'stu-hint' }, t('askInChat')),
        );
      }
      return h(
        React.Fragment,
        null,
        /* The selected work leads: the panel is where focus lands, so it sits
           above the grid rather than below a wall of tiles. */
        current
          ? h(WorkDetail, { key: current.id, work: current, onClose, onPreview, workspace, canDraft, t })
          : h('p', { className: 'stu-hint' }, t('selectHint')),
        h(
          'div',
          { className: 'stu-grid' },
          ...works.map((work) =>
            h(WorkTile, {
              key: work.id,
              work,
              selected: work.id === selected,
              onSelect: (picked) => (picked.id === selected ? onClose() : onSelect(picked)),
              t,
            }),
          ),
        ),
      );
    }

    /* ── the page ─────────────────────────────────────────────────────────── */

    function StudioPage({ t, workspace }) {
      const [view, setView] = useState('home');
      const [works, setWorks] = useState([]);
      const [status, setStatus] = useState('loading');
      const [error, setError] = useState(null);
      const [reloadKey, setReloadKey] = useState(0);
      const [selected, setSelected] = useState(null);
      const [brief, setBrief] = useState('');
      const [draftError, setDraftError] = useState(null);
      const [previewing, setPreviewing] = useState(null);

      /* One read of the library, then a quiet re-read when the window comes
         back: a work delivered in chat while this page sits open appears
         without a remount. The quiet path never shows the list as loading and
         never replaces what is already on screen with an error. */
      useEffect(() => {
        let alive = true;
        const read = () => call('api/studio');
        const adopt = (payload) => {
          if (!alive) return;
          setWorks(Array.isArray(payload?.works) ? payload.works : []);
          setError(null);
          setStatus('ready');
        };
        setStatus('loading');
        read()
          .then(adopt)
          .catch((cause) => {
            if (!alive) return;
            setError(String(cause?.message ?? cause));
            setStatus('error');
          });
        const refresh = () => {
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
          read().then(adopt, () => {
            /* A focus re-read that fails leaves the list that is already shown. */
          });
        };
        const listen = typeof window !== 'undefined' && typeof window.addEventListener === 'function';
        if (listen) {
          window.addEventListener('focus', refresh);
          document.addEventListener('visibilitychange', refresh);
        }
        return () => {
          alive = false;
          if (listen) {
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', refresh);
          }
        };
      }, [reloadKey]);

      const retry = useCallback(() => setReloadKey((key) => key + 1), []);
      const openWork = useCallback((work) => {
        setSelected(work.id);
        setView('works');
      }, []);
      const closeWork = useCallback(() => setSelected(null), []);

      /* Every "draft" here asks the Workspace service for a prefilled
         conversation. Nothing is sent, and a refusal is shown where the user
         is looking rather than replacing the page. The work detail runs its
         own copy of this for Make one like this, so that error stays in the
         panel with the button. */
      const report = useCallback((result) => setDraftError(result.ok ? null : result), []);
      const draftNow = useCallback(() => {
        if (typeof brief !== 'string' || !brief.trim()) return;
        report(draftFrom(workspace, freeBrief(brief), t));
      }, [workspace, brief, t, report]);
      const quick = useCallback((module) => report(draftFrom(workspace, quickStart(module), t)), [workspace, t, report]);
      const openPreview = useCallback((work) => setPreviewing(work.id), []);
      const closePreview = useCallback(() => setPreviewing(null), []);

      const current = works.find((work) => work.id === previewing) ?? null;
      const header = h(
        'header',
        { className: 'stu-head' },
        h(
          'div',
          null,
          h('h1', null, t('panel')),
          h('p', { className: 'stu-sub' }, t('subtitle')),
        ),
        h(
          'nav',
          { className: 'stu-seg', role: 'group', 'aria-label': t('views') },
          h('button', { type: 'button', 'aria-pressed': view === 'home', onClick: () => setView('home') }, t('home')),
          h(
            'button',
            { type: 'button', 'aria-pressed': view === 'works', onClick: () => setView('works') },
            t('works'),
            works.length ? h('span', { className: 'stu-count' }, String(works.length)) : null,
          ),
        ),
      );
      const body = h(
        'main',
        { className: 'stu-body' },
        view === 'home'
          ? h(HomeView, {
              works,
              status,
              error,
              brief,
              onBrief: setBrief,
              onDraft: draftNow,
              canDraft: Boolean(workspace),
              onQuick: quick,
              onRetry: retry,
              onOpenWork: openWork,
              onSeeAll: () => setView('works'),
              t,
            })
          : h(WorksView, {
              works,
              status,
              error,
              selected,
              onSelect: openWork,
              onClose: closeWork,
              onPreview: openPreview,
              workspace,
              canDraft: Boolean(workspace),
              onRetry: retry,
              t,
            }),
      );

      return h(
        'div',
        { className: 'stu-page' },
        ...[
          header,
          draftError ? h(ErrorRow, { message: draftError.error, detail: draftError.detail, t }) : null,
          body,
          current ? h(PreviewOverlay, { work: current, onClose: closePreview, t }) : null,
        ].filter(Boolean),
      );
    }

    /* ── registration ─────────────────────────────────────────────────────── */

    /** Register the panel entry, the page it selects, and the resources they need. */
    function apply(ctx) {
      ctx.effect(injectStyles, 'dsh-studio: styles');
      ctx.effect(() => ctx.locale.register(NS, { en }), 'dsh-studio: dictionaries');
      const t = ctx.locale.bind(NS);
      /* Declared in `inject`, so the loader parks this panel until the
         Workspace service exists. Reading it through the optional guard keeps
         registration from throwing in a context where it is absent anyway;
         the page then disables drafting and says so. */
      const workspace = workspaceService(ctx);

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 9,
            locale: NS,
            label: () => t('panel'),
          },
          StudioGlyph,
        ),
      );

      ctx.slots.inject('main', () =>
        ctx.slots.register(
          {
            name: 'main',
            key: PANEL_ID,
            locale: NS,
            inject: () => ({ t, workspace }),
          },
          StudioPage,
        ),
      );
    }

    return {
      inject: ['slots', 'locale', 'uiWorkspace'],
      apply,
      __logic: {
        recentWorks,
        thumbUrl,
        moduleName,
        formatDay,
        en,
        freeBrief,
        quickStart,
        makeLike,
        startSessionFor,
        draftBrief,
        draftFrom,
        workspaceService,
        isHtmlPath,
        previewUrl,
        exportUrl,
        filenameFromDisposition,
        downloadExport,
        probePreview,
        PreviewBody,
        PreviewOverlay,
        HomeView,
        WorkDetail,
        ErrorRow,
        quickStarts: QUICK_STARTS,
      },
    };
  },
});
