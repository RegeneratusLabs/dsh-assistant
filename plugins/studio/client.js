/**
 * Browser half of the Studio.
 *
 * One left-sidebar entry (`sidebar.panellist`, id `studio`) and the page it
 * selects (`main`, key `studio`). Two views over one library:
 *
 *  - **Home** — the brief composer placeholder, a quick-starts row, and the
 *    most recent works. The composer is deliberately inert: the controls say
 *    drafting is not ready yet rather than pretending to submit.
 *  - **Works** — the library the Host keeps, as a thumbnail grid. A tile with no
 *    thumbnail gets a placeholder; selecting one shows its details with the
 *    artifact path as text that can be copied. There is no file-open channel
 *    here: the page shows the path and stops, rather than inventing an opener.
 *
 * The list comes from the Host over the same `/api` channel the other pages use
 * (`GET /api/studio`), never from the filesystem. The client therefore never
 * needs to know where `$DSH_HOME` is, and the plugin's data has one owner. A
 * focus re-read keeps the list current when a work is delivered while the page
 * is open.
 *
 * Styling is one injected stylesheet, host theme tokens with per-token
 * fallbacks, so a renamed token degrades instead of going black and light/dark
 * follows without a second palette. All copy goes through the Client locale
 * service; `locale/en.json` mirrors this dictionary for the Plugin Manager
 * entry, and the selftest keeps the two in step.
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

    const en = {
      panel: 'Studio',
      home: 'Home',
      works: 'Works',
      views: 'Studio views',
      subtitle: 'Delivered designs, in one place.',
      brief: 'Brief',
      briefPlaceholder: 'What should the studio make?',
      draft: 'Draft it',
      comingSoon: 'Not ready yet.',
      composerNote: "Drafting from here isn't ready yet — for now, ask in chat.",
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
.stu-headnote {
  margin-left: 8px; font-size: 10px; font-weight: 400; letter-spacing: 0;
  text-transform: none; color: var(--dsw-alias-label-quaternary, #9ca3af);
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
.stu-brief:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary, #3b6ef6); outline-offset: 1px; }
.stu-composerfoot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding-top: 8px; border-top: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24));
}
.stu-hint { margin: 0; font-size: 10.5px; line-height: 1.5; color: var(--dsw-alias-label-tertiary, #9ca3af); }
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
  font: inherit; font-size: 12px; cursor: default;
}
.stu-chip:disabled { opacity: .7; }
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
.stu-detail:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary, #3b6ef6); outline-offset: 2px; }
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
  padding-top: 9px; border-top: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24));
}
.stu-path {
  flex: 1 1 260px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px; color: var(--dsw-alias-label-secondary, #6b7280);
  word-break: break-all; user-select: text;
}
.stu-btn {
  height: 26px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24));
  border-radius: 7px; background: transparent; color: var(--dsw-alias-label-primary, #111827);
  font: inherit; font-size: 11.5px; cursor: pointer;
}
.stu-btn:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08)); }
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

    /** The selected work's details; the path copy is a secondary action. */
    function WorkDetail({ work, onClose, t }) {
      const [copyState, setCopyState] = useState('idle');
      const panel = useRef(null);
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

      const fact = (label, value) =>
        value ? h('div', { className: 'stu-fact', key: label }, h('dt', null, label), h('dd', null, value)) : null;

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
          { className: 'stu-pathrow' },
          h('span', { className: 'stu-label' }, t('path')),
          h('code', { className: 'stu-path' }, work.path),
          h('button', { type: 'button', className: 'stu-btn', onClick: copyPath }, copyState === 'copied' ? t('copied') : t('copyPath')),
        ),
        copyState === 'failed' ? h('p', { className: 'stu-hint' }, t('copyFailed')) : null,
      );
    }

    function ErrorRow({ error, onRetry, t }) {
      return h(
        'div',
        { className: 'stu-error', role: 'alert', title: error ?? undefined },
        h('span', null, t('loadFailed')),
        h('button', { type: 'button', onClick: onRetry }, t('retry')),
      );
    }

    /* ── Home ─────────────────────────────────────────────────────────────── */

    function HomeView({ works, status, error, onRetry, onOpenWork, onSeeAll, t }) {
      const recents = recentWorks(works);
      const quick = ['quickDeck', 'quickWeb', 'quickMotion', 'quickInfographic'];
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
            readOnly: true,
            placeholder: t('briefPlaceholder'),
          }),
          h(
            'div',
            { className: 'stu-composerfoot' },
            h('p', { className: 'stu-hint' }, t('composerNote')),
            h('button', { type: 'button', className: 'stu-primary', disabled: true }, t('draft')),
          ),
        ),
        h(
          'section',
          { className: 'stu-section' },
          h('h2', null, t('quickStarts'), h('span', { className: 'stu-headnote' }, t('comingSoon'))),
          h(
            'div',
            { className: 'stu-chips' },
            ...quick.map((key) => h('button', { type: 'button', className: 'stu-chip', key, disabled: true }, t(key))),
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
            ? h(ErrorRow, { error, onRetry, t })
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

    function WorksView({ works, status, error, selected, onSelect, onClose, onRetry, t }) {
      const current = works.find((work) => work.id === selected) ?? null;
      if (status === 'error') return h(ErrorRow, { error, onRetry, t });
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
        current
          ? h(WorkDetail, { key: current.id, work: current, onClose, t })
          : h('p', { className: 'stu-hint' }, t('selectHint')),
      );
    }

    /* ── the page ─────────────────────────────────────────────────────────── */

    function StudioPage({ t }) {
      const [view, setView] = useState('home');
      const [works, setWorks] = useState([]);
      const [status, setStatus] = useState('loading');
      const [error, setError] = useState(null);
      const [reloadKey, setReloadKey] = useState(0);
      const [selected, setSelected] = useState(null);

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

      return h(
        'div',
        { className: 'stu-page' },
        h(
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
        ),
        h(
          'main',
          { className: 'stu-body' },
          view === 'home'
            ? h(HomeView, { works, status, error, onRetry: retry, onOpenWork: openWork, onSeeAll: () => setView('works'), t })
            : h(WorksView, { works, status, error, selected, onSelect: openWork, onClose: closeWork, onRetry: retry, t }),
        ),
      );
    }

    /* ── registration ─────────────────────────────────────────────────────── */

    /** Register the panel entry, the page it selects, and the resources they need. */
    function apply(ctx) {
      ctx.effect(injectStyles, 'dsh-studio: styles');
      ctx.effect(() => ctx.locale.register(NS, { en }), 'dsh-studio: dictionaries');
      const t = ctx.locale.bind(NS);

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
            inject: () => ({ t }),
          },
          StudioPage,
        ),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply,
      __logic: { recentWorks, thumbUrl, moduleName, formatDay, en },
    };
  },
});
