/**
 * Browser half of @local/dsh-learn — one dim line under a reviewed turn.
 *
 * The host half appends an ignorable `plugin:dsh-learn/learned` session record
 * after a review that changed something. The record is part of the log (so the
 * line survives reload and fork) but never part of the model-visible surface.
 * Chat renders `conversation.chat.turnTail` once per finished turn; the entry
 * subscribes to the session's own event window and draws counts only — never
 * the stored text, never a chip, border or icon.
 *
 * Copy rules: the line is a footnote, not an announcement. It stays at
 * `label-tertiary`, 11px, under the reply, and a quiet turn draws nothing.
 *
 * The pure scan/format decisions live in `__logic` so they can be asserted
 * outside a browser (`selftest.mjs`, through `test/client-harness.mjs`).
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-learn',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useSyncExternalStore } = React;

    const NS = 'dsh-learn';
    const SLOT = 'conversation.chat.turnTail';
    /** Must match NOTICE_RECORD in index.js and the plugin-record grammar. */
    const RECORD = 'plugin:dsh-learn/learned';
    const RECORD_VERSION = 1;

    const LINE = {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginTop: '9px',
      fontSize: '11px',
      lineHeight: '16px',
      letterSpacing: '0.005em',
      color: 'var(--dsw-alias-label-tertiary)',
      width: 'fit-content',
      userSelect: 'none',
    };
    const DOT = {
      color: 'var(--dsw-alias-label-caption)',
      fontSize: '12px',
      lineHeight: 1,
      transform: 'translateY(-1px)',
    };
    const SEP = {
      color: 'var(--dsw-alias-label-caption)',
      opacity: 0.6,
      padding: '0 1px',
    };
    const SKILL = {
      fontFamily: 'var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
      fontSize: '10.5px',
    };

    const COPY_EN = {
      'line.memory.one': 'learned 1 memory',
      'line.memory.other': 'learned {count} memories',
      'line.forget.one': 'forgot 1',
      'line.forget.other': 'forgot {count}',
      'line.skill': 'skill {name}',
      'line.renamed': 'saved as a new name — {name} was taken',
      'line.failed': 'review failed, nothing learned',
    };
    const COPY_ZH = {
      'line.memory.one': '记下 1 条记忆',
      'line.memory.other': '记下 {count} 条记忆',
      'line.forget.one': '移除 1 条',
      'line.forget.other': '移除 {count} 条',
      'line.skill': '技能 {name}',
      'line.renamed': '改名为 {name}（原名已被占用）',
      'line.failed': '复盘失败，未记录',
    };

    /**
     * Turn the record payload into the compact key the line renders.
     *
     * The keys are also the store snapshot, so they must be stable: equal
     * payloads produce an identical string. Anything malformed, a different
     * version, or another plugin's record yields '' and draws nothing.
     * @param {unknown} data - the record payload.
     * @returns {string} a stable JSON key, or '' when it is not ours.
     */
    function payloadKey(data) {
      if (typeof data !== 'object' || data === null) return '';
      if (data.v !== RECORD_VERSION) return '';
      if (!Number.isSafeInteger(data.turn)) return '';
      const memory = Number.isSafeInteger(data.memory) && data.memory > 0 ? data.memory : 0;
      const forget = Number.isSafeInteger(data.forget) && data.forget > 0 ? data.forget : 0;
      const skill = typeof data.skill === 'string' && data.skill !== '' ? data.skill : '';
      const renamed = typeof data.renamed === 'string' ? data.renamed : '';
      const failure = typeof data.failure === 'string' && data.failure !== '' ? data.failure : '';
      if (memory === 0 && forget === 0 && skill === '' && failure === '') return '';
      return JSON.stringify({ m: memory, f: forget, s: skill, r: renamed, e: failure });
    }

    /** Index one event window by turn; a later record for the same turn wins. */
    function indexByTurn(entries) {
      const map = new Map();
      for (const entry of entries ?? []) {
        const event = entry?.event;
        if (!event || event.ignorable !== true || event.type !== RECORD) continue;
        const key = payloadKey(event.data);
        if (key === '') continue;
        map.set(event.data.turn, key);
      }
      return map;
    }

    /** Per-event-source caches, invalidated by the window's revision. */
    const caches = new WeakMap();

    /**
     * The line key for one turn, read from the session's own event window.
     * @param {object} source - the binding's eventSource face.
     * @param {number} turn - the turn being rendered.
     * @returns {string} a stable key, or '' when that turn learned nothing.
     */
    function noticeKey(source, turn) {
      if (!Number.isSafeInteger(turn)) return '';
      let snapshot;
      try {
        snapshot = source?.getSnapshot?.();
      } catch {
        return '';
      }
      if (snapshot === undefined || snapshot === null) return '';
      const revision = snapshot.revision;
      let cache = caches.get(source);
      if (cache === undefined || !Number.isFinite(revision) || cache.revision !== revision) {
        cache = { revision: Number.isFinite(revision) ? revision : -1, map: indexByTurn(snapshot.entries) };
        caches.set(source, cache);
      }
      return cache.map.get(turn) ?? '';
    }

    /**
     * The parts a line renders: memory count, forget count, skill name.
     * @param {string} key - a key from {@link noticeKey}.
     * @param {Function} t - the plugin's locale translator.
     * @returns {Array<{kind: string, text: string}>} parts in display order.
     */
    function formatNotice(key, t) {
      let data;
      try {
        data = JSON.parse(key);
      } catch {
        return [];
      }
      const parts = [];
      if (Number.isSafeInteger(data?.m) && data.m > 0) {
        parts.push({
          kind: 'memory',
          text: t(data.m === 1 ? 'line.memory.one' : 'line.memory.other', { count: data.m }),
        });
      }
      if (Number.isSafeInteger(data?.f) && data.f > 0) {
        parts.push({
          kind: 'forget',
          text: t(data.f === 1 ? 'line.forget.one' : 'line.forget.other', { count: data.f }),
        });
      }
      if (typeof data?.s === 'string' && data.s !== '') {
        parts.push({ kind: 'skill', text: t('line.skill', { name: data.s }) });
      }
      if (typeof data?.r === 'string' && data.r !== '') {
        parts.push({ kind: 'renamed', text: t('line.renamed', { name: data.r }) });
      }
      if (typeof data?.e === 'string' && data.e !== '') {
        parts.push({ kind: 'failure', text: t('line.failed') });
      }
      return parts;
    }

    /**
     * The dim footnote under one finished turn.
     * @param {{turn: number, t: Function, sourceOf: Function}} props - slot props
     *   plus the per-session face.
     */
    function LearnedLine({ turn, t, sourceOf }) {
      const subscribe = useCallback(
        (notify) => {
          let source;
          try {
            source = sourceOf();
          } catch {
            source = undefined;
          }
          return source && typeof source.subscribe === 'function' ? source.subscribe(notify) : () => {};
        },
        [sourceOf],
      );
      const read = useCallback(() => {
        let source;
        try {
          source = sourceOf();
        } catch {
          source = undefined;
        }
        return source ? noticeKey(source, turn) : '';
      }, [sourceOf, turn]);
      const key = useSyncExternalStore(subscribe, read, () => '');
      if (key === '') return null;
      const parts = formatNotice(key, t);
      if (parts.length === 0) return null;
      const nodes = [h('span', { key: 'dot', style: DOT }, '·')];
      parts.forEach((part, index) => {
        if (index > 0) nodes.push(h('span', { key: `sep:${index}`, style: SEP }, '·'));
        nodes.push(h('span', { key: `part:${index}`, style: part.kind === 'skill' ? SKILL : undefined }, part.text));
      });
      return h('div', { style: LINE, 'data-learn-notice': String(turn) }, nodes);
    }

    /**
     * Register the turn-tail entry.
     * @param {object} ctx - the client context (`slots`, `sessions`, `locale`).
     */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { en: COPY_EN, zh: COPY_ZH }), 'dsh-learn: dictionaries');
      const t = ctx.locale.bind(NS);
      ctx.slots.inject(SLOT, () =>
        ctx.slots.register(
          {
            name: SLOT,
            id: 'dsh-learn',
            order: 40,
            locale: NS,
            inject: (sessionId) => ({
              t,
              sourceOf: () => ctx.sessions?.binding?.(sessionId)?.eventSource,
            }),
          },
          LearnedLine,
        ),
      );
    }

    return {
      inject: ['slots', 'sessions', 'locale'],
      apply,
      __logic: { payloadKey, indexByTurn, noticeKey, formatNotice },
    };
  },
});
