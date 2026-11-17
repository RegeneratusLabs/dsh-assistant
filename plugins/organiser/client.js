/**
 * Browser half of the Organiser.
 *
 * One left-sidebar entry (`sidebar.panellist`, id `organiser`) and the page it
 * selects (`main`, key `organiser`). Two views, one data set:
 *
 *  - **Day** — the week strip, the selected day's commitments (from the
 *    connected calendar), its plans (from this plugin's store), that day's note,
 *    and what is coming later in the week. The notes rail lists every note,
 *    dated newest first, with the inbox after.
 *  - **Month** — the same events and plans as a grid, three per cell and a
 *    count, so a month reads at a glance. Clicking a day opens it in Day.
 *
 * The page writes through the same routes the Host tools use, so a plan or a
 * note is one row whichever surface made it. Notes autosave; plans save on
 * submit; there is no "save" button to forget.
 *
 * Styling is one injected stylesheet rather than inline objects, because the
 * page has more rules than props. It uses the host's theme tokens only, so it
 * follows light/dark without a second palette.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-organiser',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useState } = React;

    const PANEL_ID = 'organiser';
    const NS = 'dsh-organiser';
    const STYLE_ATTR = 'data-dsh-organiser-styles';
    const DAY_MS = 86400000;

    const en = {
      panel: 'Organiser',
      day: 'Day',
      month: 'Month',
      today: 'Today',
      previous: 'Previous',
      next: 'Next',
      calendar: 'Calendar',
      plans: 'Plans',
      note: 'Note',
      notes: 'Notes',
      later: 'Later this week',
      searchNotes: 'Search notes',
      inbox: 'Inbox',
      loading: 'Reading the organiser…',
      loadFailed: 'Could not read the organiser',
      retry: 'Retry',
      nothingOnDay: 'Nothing on the calendar this day.',
      allDay: 'all day',
      markDone: 'Mark done',
      dismiss: 'Dismiss',
      nothingPlanned: 'Nothing planned. Add one below.',
      noNoteYet: 'Nothing written for this day yet.',
      noNotes: 'No notes yet. Write on a day, or ask me to note something.',
      noMatches: 'No notes match that.',
      addPlan: 'A plan for this day',
      planPlaceholder: 'What do you mean to do?',
      timePlaceholder: 'Time',
      add: 'Add',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved',
      saveFailed: 'Not saved',
      onePerDay: 'One note a day · plain text',
      askInChat: 'Ask in chat: “what did I note about the bank?”',
      notConnected: 'No calendar connected.',
      connectHint: 'Plans and notes still work. Connect Google Calendar on the Connectors page to see events.',
      calendarFailed: 'The calendar could not be read',
      inMonth: 'more',
      emptyDay: 'Nothing this day.',
      panelHint: 'Plans and notes stay in this home. Events come from your calendar.',
    };

    const zh = {
      panel: '日程',
      day: '日',
      month: '月',
      today: '今天',
      previous: '上一页',
      next: '下一页',
      calendar: '日历',
      plans: '计划',
      note: '笔记',
      notes: '笔记',
      later: '本周稍后',
      searchNotes: '搜索笔记',
      inbox: '收件箱',
      loading: '正在读取日程…',
      loadFailed: '无法读取日程',
      retry: '重试',
      nothingOnDay: '这一天日历上没有安排。',
      allDay: '全天',
      markDone: '标记完成',
      dismiss: '关闭',
      nothingPlanned: '没有计划。可在下方添加。',
      noNoteYet: '这一天还没有写笔记。',
      noNotes: '还没有笔记。在某天写下，或让我记一条。',
      noMatches: '没有匹配的笔记。',
      addPlan: '这一天的计划',
      planPlaceholder: '你打算做什么？',
      timePlaceholder: '时间',
      add: '添加',
      cancel: '取消',
      save: '保存',
      saving: '保存中…',
      saved: '已保存',
      saveFailed: '未保存',
      onePerDay: '每天一条笔记 · 纯文本',
      askInChat: '在对话里问：“关于银行我记了什么？”',
      notConnected: '未连接日历。',
      connectHint: '计划和笔记照常可用。在“连接”页面连接 Google 日历即可看到日程。',
      calendarFailed: '无法读取日历',
      inMonth: '条',
      emptyDay: '这一天没有安排。',
      panelHint: '计划和笔记留在这个家里。日程来自你连接的日历。',
    };

    /* ── dates: plain YYYY-MM-DD strings, UTC arithmetic, no Date drift ───── */

    function isDate(value) {
      return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`));
    }

    /** `date` plus whole days. */
    function addDays(date, days) {
      return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
    }

    /** The Monday of `date`'s week. */
    function startOfWeek(date) {
      const week = (new Date(Date.parse(`${date}T00:00:00Z`)).getUTCDay() + 6) % 7;
      return addDays(date, -week);
    }

    /** The seven days of `date`'s week, Monday first. */
    function weekOf(date) {
      const start = startOfWeek(date);
      return Array.from({ length: 7 }, (_, index) => addDays(start, index));
    }

    /** The 42 cells of the month whose YYYY-MM is `cursor`, Monday first. */
    function monthCells(cursor) {
      const start = startOfWeek(`${cursor}-01`);
      return Array.from({ length: 42 }, (_, index) => {
        const date = addDays(start, index);
        return { date, inMonth: date.slice(0, 7) === cursor };
      });
    }

    /** The YYYY-MM-DD an event falls on, in `zone`; all-day events are already dates. */
    function eventDay(event, zone) {
      if (!event) return null;
      if (event.allDay && isDate(event.start)) return event.start;
      const ms = Date.parse(event.start);
      if (!Number.isFinite(ms)) return null;
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: zone || undefined,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date(ms));
      const get = (type) => parts.find((part) => part.type === type)?.value;
      return `${get('year')}-${get('month')}-${get('day')}`;
    }

    /** Group a list under a day key, keeping the list's order inside each day. */
    function groupByDay(items, keyOf) {
      const out = new Map();
      for (const item of items) {
        const key = keyOf(item);
        if (!key) continue;
        if (!out.has(key)) out.set(key, []);
        out.get(key).push(item);
      }
      return out;
    }

    /** `Tue 17 Nov` — UTC noon, so no zone can shift the label to another day. */
    function dayShort(date) {
      return new Intl.DateTimeFormat(undefined, {
        timeZone: 'UTC',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(new Date(`${date}T12:00:00Z`));
    }

    /** `Tuesday 17 November`. */
    function dayLong(date) {
      return new Intl.DateTimeFormat(undefined, {
        timeZone: 'UTC',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date(`${date}T12:00:00Z`));
    }

    /** `November 2026`. */
    function monthTitle(cursor) {
      return new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(
        new Date(`${cursor}-01T12:00:00Z`),
      );
    }

    /** The weekday initials for the month header, Monday first. */
    function weekdayHeads() {
      const start = new Date('2024-01-01T12:00:00Z'); // a Monday
      return Array.from({ length: 7 }, (_, index) =>
        new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', weekday: 'short' }).format(new Date(start.getTime() + index * DAY_MS)),
      );
    }

    /** `09:30`, in `zone`. */
    function clock(iso, zone) {
      const ms = Date.parse(iso);
      if (!Number.isFinite(ms)) return '';
      return new Intl.DateTimeFormat(undefined, {
        timeZone: zone || undefined,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(ms));
    }

    /** The first line of a note, trimmed for the rail. */
    function notePreview(body, max = 64) {
      const first = String(body ?? '').split('\n').find((line) => line.trim()) ?? '';
      const text = first.trim();
      return text.length > max ? `${text.slice(0, max - 1)}…` : text;
    }

    /* ── the Host routes ──────────────────────────────────────────────────── */

    async function call(relative, init) {
      const response = await fetch(new URL(relative, document.baseURI).toString(), {
        credentials: 'same-origin',
        cache: 'no-store',
        ...init,
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

    function post(relative, body) {
      return call(relative, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    /* ── the stylesheet ───────────────────────────────────────────────────── */

    const CSS = `
.org-page {
  height: 100%; overflow: auto; color: var(--dsw-alias-label-primary, #111827);
  font-family: inherit;
}
.org-head {
  position: sticky; top: 0; z-index: 2;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 18px; border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24));
  background: var(--dsw-alias-bg-base, #fff);
}
.org-head h1 { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: .01em; }
.org-nav { display: flex; align-items: center; gap: 6px; }
.org-seg {
  display: flex; padding: 2px; margin-right: 10px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 7px;
  background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.06));
}
.org-seg button {
  height: 22px; padding: 0 11px; border: 1px solid transparent; border-radius: 5px;
  background: transparent; color: var(--dsw-alias-label-secondary, #6b7280);
  font: inherit; font-size: 12px; cursor: pointer;
}
.org-seg button[aria-pressed="true"] {
  background: var(--dsw-alias-bg-base, #fff); border-color: var(--dsw-alias-border-l1, rgba(127,127,127,.24));
  color: var(--dsw-alias-label-primary, #111827); font-weight: 600;
}
.org-icon {
  width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 6px;
  background: transparent; color: var(--dsw-alias-label-secondary, #6b7280); cursor: pointer;
}
.org-icon:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08)); }
.org-month { min-width: 112px; text-align: center; font-size: 12.5px; font-weight: 600; }
.org-todaybtn {
  height: 24px; padding: 0 11px; margin-left: 8px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 6px;
  background: transparent; color: inherit; font: inherit; font-size: 12px; cursor: pointer;
}
.org-todaybtn:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08)); }

.org-note-banner {
  margin: 10px 18px 0; padding: 8px 12px; border-radius: 8px; font-size: 12px;
  border: 1px solid var(--dsw-alias-state-error-primary, #c62828);
  color: var(--dsw-alias-state-error-primary, #c62828);
  display: flex; align-items: center; gap: 10px;
}
.org-note-banner button {
  margin-left: auto; border: 1px solid currentColor; border-radius: 6px; background: transparent;
  color: inherit; font: inherit; font-size: 12px; padding: 2px 9px; cursor: pointer;
}

.org-cols { display: grid; grid-template-columns: 132px minmax(0, 1fr) 292px; }
.org-days { border-right: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); padding: 10px 8px; display: flex; flex-direction: column; gap: 2px; }
.org-day {
  display: grid; grid-template-columns: 34px 1fr auto; align-items: center;
  height: 42px; padding: 0 10px; border: 0; border-radius: 7px; background: none;
  color: var(--dsw-alias-label-secondary, #6b7280); font: inherit; text-align: left; cursor: pointer;
}
.org-day:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08)); }
.org-day .wd { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
.org-day .num { font-size: 14px; font-weight: 500; color: var(--dsw-alias-label-primary, #111827); font-variant-numeric: tabular-nums; }
.org-day .dots { display: flex; gap: 3px; }
.org-day .dots i { width: 4px; height: 4px; border-radius: 50%; background: var(--dsw-alias-brand-primary, #3b6ef6); opacity: .55; }
.org-day[aria-current="date"] {
  background: var(--dsw-alias-bg-layer-2, rgba(127,127,127,.1));
  box-shadow: inset 2px 0 0 var(--dsw-alias-brand-primary, #3b6ef6);
}
.org-day[aria-current="date"] .wd, .org-day[aria-current="date"] .num { color: var(--dsw-alias-brand-primary, #3b6ef6); }
.org-day[aria-current="date"] .wd, .org-day[aria-current="date"] .num { font-weight: 700; }
.org-day[aria-current="date"] .dots i { opacity: 1; }

.org-pane { padding: 16px 22px 18px; display: flex; flex-direction: column; gap: 17px; min-width: 0; }
.org-pane h2 { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -.01em; display: flex; align-items: center; gap: 10px; }
.org-chip {
  font-size: 10px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
  color: var(--dsw-alias-brand-primary, #3b6ef6);
  background: var(--dsw-alias-bg-layer-2, rgba(127,127,127,.1));
  border-radius: 999px; padding: 3px 8px;
}
.org-band { display: flex; flex-direction: column; gap: 8px; }
.org-band h3 {
  margin: 0; display: flex; align-items: baseline; justify-content: space-between;
  font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
}
.org-band h3 .meta { font-size: 10.5px; font-weight: 400; letter-spacing: 0; text-transform: none; }
.org-event {
  display: grid; grid-template-columns: 92px minmax(0, 1fr) auto; align-items: center; gap: 12px;
  padding: 9px 12px; border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24));
  border-left: 3px solid var(--dsw-alias-brand-primary, #3b6ef6); border-radius: 8px;
}
.org-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; color: var(--dsw-alias-label-secondary, #6b7280); white-space: nowrap; }
.org-etitle { font-size: 13.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.org-cal {
  font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #9ca3af);
  border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 5px; padding: 2px 6px; white-space: nowrap;
}
.org-plan { display: grid; grid-template-columns: 16px 74px minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 6px 2px; }
.org-check {
  width: 15px; height: 15px; padding: 0; border-radius: 50%; cursor: pointer;
  border: 1.5px solid var(--dsw-alias-border-l2, rgba(127,127,127,.42)); background: transparent;
}
.org-check:hover { border-color: var(--dsw-alias-brand-primary, #3b6ef6); }
.org-ptitle { font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.org-pid { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-muted { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-add { display: flex; align-items: center; gap: 6px; margin-top: 2px; flex-wrap: wrap; }
.org-dashed {
  align-self: flex-start; padding: 5px 13px; border-radius: 999px; cursor: pointer;
  border: 1px dashed var(--dsw-alias-border-l2, rgba(127,127,127,.42));
  background: transparent; color: var(--dsw-alias-label-secondary, #6b7280); font: inherit; font-size: 12px;
}
.org-dashed:hover { color: var(--dsw-alias-label-primary, #111827); border-color: var(--dsw-alias-label-secondary, #6b7280); }
.org-input {
  height: 30px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24));
  border-radius: 7px; background: transparent; color: inherit; font: inherit; font-size: 12.5px;
}
.org-input:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary, #3b6ef6); outline-offset: 1px; }
.org-timeinput { width: 96px; }
.org-primary {
  height: 30px; padding: 0 12px; border: 0; border-radius: 7px; cursor: pointer;
  background: var(--dsw-alias-brand-primary, #3b6ef6); color: var(--dsw-alias-label-primary-foreground, #fff);
  font: inherit; font-size: 12.5px; font-weight: 600;
}
.org-primary:disabled { opacity: .5; cursor: default; }

.org-notecard {
  border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.04)); padding: 10px 12px 8px;
}
.org-notecard textarea {
  width: 100%; min-height: 92px; resize: vertical; border: 0; background: transparent;
  color: inherit; font: inherit; font-size: 13px; line-height: 1.65; padding: 2px;
}
.org-notecard textarea:focus-visible { outline: none; }
.org-notefoot {
  display: flex; justify-content: space-between; gap: 10px; font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); padding-top: 7px; margin-top: 6px;
}
.org-notefoot .state.error { color: var(--dsw-alias-state-error-primary, #c62828); }

.org-up { display: grid; grid-template-columns: 74px 92px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 4px 0; font-size: 12.5px; }
.org-upday { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-uptitle { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.org-rail {
  border-left: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24));
  background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.04));
  display: flex; flex-direction: column; min-height: 0;
}
.org-rail h3 {
  margin: 0; padding: 14px 16px 8px; display: flex; justify-content: space-between; align-items: baseline;
  font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
}
.org-search {
  display: flex; align-items: center; gap: 7px; height: 30px; margin: 0 16px 10px; padding: 0 9px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 7px;
  background: var(--dsw-alias-bg-base, #fff);
  color: var(--dsw-alias-label-tertiary, #9ca3af);
}
.org-search input { width: 100%; border: 0; outline: none; background: transparent; color: var(--dsw-alias-label-primary, #111827); font: inherit; font-size: 12px; }
.org-nlist { flex: 1; overflow: auto; min-height: 0; }
.org-nitem {
  display: flex; flex-direction: column; gap: 2px; width: 100%; text-align: left;
  padding: 8px 16px; border: 0; border-top: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24));
  border-left: 2px solid transparent; background: transparent; color: inherit; font: inherit; cursor: pointer;
}
.org-nitem:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08)); }
.org-nitem.cur { background: var(--dsw-alias-bg-base, #fff); border-left-color: var(--dsw-alias-brand-primary, #3b6ef6); }
.org-nitem .nd { font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-nitem.cur .nd { color: var(--dsw-alias-brand-primary, #3b6ef6); font-weight: 600; }
.org-nitem .nb { font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.org-group { padding: 11px 16px 4px; border-top: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); font-size: 10px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-railfoot { margin-top: auto; padding: 11px 16px; border-top: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); font-size: 10.5px; line-height: 1.5; color: var(--dsw-alias-label-tertiary, #9ca3af); }

.org-monthwrap { padding: 14px 20px 18px; }
.org-mcal { border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 10px; overflow: hidden; }
.org-mhead { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.04)); }
.org-mhead div { padding: 7px 9px; font-size: 10px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-mgrid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--dsw-alias-border-l1, rgba(127,127,127,.24)); }
.org-cell {
  display: flex; flex-direction: column; gap: 3px; min-width: 0; min-height: 96px;
  padding: 6px 8px; border: 0; background: var(--dsw-alias-bg-base, #fff);
  color: inherit; font: inherit; text-align: left; cursor: pointer;
}
.org-cell:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08)); }
.org-cell.dim { background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.04)); color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-cell .dn { font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
.org-cell.today .dn { color: var(--dsw-alias-brand-primary, #3b6ef6); }
.org-mi { display: flex; align-items: center; gap: 5px; font-size: 10.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.org-mi .dot { width: 5px; height: 5px; border-radius: 50%; flex: none; background: var(--dsw-alias-brand-primary, #3b6ef6); }
.org-mi.plan { color: var(--dsw-alias-label-secondary, #6b7280); }
.org-mi.plan .dot { background: transparent; border: 1.2px solid var(--dsw-alias-label-tertiary, #9ca3af); }
.org-more { font-size: 10px; color: var(--dsw-alias-label-tertiary, #9ca3af); }

.org-empty { padding: 40px 22px; font-size: 13px; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-retry { margin-left: 10px; border: 1px solid currentColor; background: transparent; color: inherit; border-radius: 6px; padding: 2px 9px; font: inherit; font-size: 12px; cursor: pointer; }

@media (max-width: 980px) {
  .org-cols { grid-template-columns: 116px minmax(0, 1fr); }
  .org-rail { display: none; }
}
`;

    /** Inject the stylesheet once; the disposer removes only what we added. */
    function injectStyles() {
      if (typeof document === 'undefined') return () => {};
      if (typeof document.querySelector === 'function' && document.querySelector(`style[${STYLE_ATTR}]`) !== null) {
        return () => {};
      }
      const tag = document.createElement('style');
      tag.setAttribute(STYLE_ATTR, '');
      tag.dataset.plugin = '@local/dsh-organiser';
      tag.textContent = CSS;
      document.head.appendChild(tag);
      return () => {
        if (typeof tag.remove === 'function') tag.remove();
      };
    }

    /* ── small pieces ─────────────────────────────────────────────────────── */

    function OrganiserGlyph() {
      return h(
        'svg',
        { width: 18, height: 18, viewBox: '0 0 18 18', fill: 'none', 'aria-hidden': 'true' },
        h('rect', { x: 2.4, y: 3.6, width: 13.2, height: 11.8, rx: 2.2, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', { d: 'M2.4 7.6h13.2M6.2 2.1v3.1M11.8 2.1v3.1', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
      );
    }

    function EventRow({ event, zone, t }) {
      const time = event.allDay
        ? t('allDay')
        : (() => {
            const start = clock(event.start, zone);
            const end = event.end ? clock(event.end, zone) : '';
            return start && end && end !== start ? `${start}–${end}` : start;
          })();
      return h(
        'div',
        { className: 'org-event' },
        h('span', { className: 'org-mono' }, time || 'time unknown'),
        h('span', { className: 'org-etitle', title: event.title }, event.title || '(untitled event)'),
        event.calendar ? h('span', { className: 'org-cal' }, event.calendar) : null,
      );
    }

    function PlanRow({ plan, onDone, t }) {
      return h(
        'div',
        { className: 'org-plan' },
        h('button', {
          type: 'button',
          className: 'org-check',
          title: t('markDone'),
          'aria-label': `${t('markDone')}: ${plan.title}`,
          onClick: () => onDone(plan.id),
        }),
        h('span', { className: 'org-mono' }, plan.time ?? 'no time'),
        h('span', { className: 'org-ptitle', title: plan.title }, plan.title),
        h('span', { className: 'org-pid' }, plan.id),
      );
    }

    function MonthView({ cursor, today, eventsByDay, plansByDay, zone, t, onOpenDay }) {
      const cells = monthCells(cursor);
      return h(
        'div',
        { className: 'org-monthwrap' },
        h(
          'div',
          { className: 'org-mcal' },
          h('div', { className: 'org-mhead' }, ...weekdayHeads().map((name) => h('div', { key: name }, name))),
          h(
            'div',
            { className: 'org-mgrid' },
            ...cells.map((cell) => {
              const events = (eventsByDay.get(cell.date) ?? []).slice().sort((a, b) => String(a.start).localeCompare(String(b.start)));
              const plans = plansByDay.get(cell.date) ?? [];
              const items = [
                ...events.map((event) => ({ kind: 'event', key: event.id ?? event.start, title: event.title })),
                ...plans.map((plan) => ({ kind: 'plan', key: plan.id, title: plan.title })),
              ];
              const shown = items.slice(0, 3);
              return h(
                'button',
                {
                  type: 'button',
                  key: cell.date,
                  className: `org-cell${cell.inMonth ? '' : ' dim'}${cell.date === today ? ' today' : ''}`,
                  onClick: () => onOpenDay(cell.date),
                  title: dayShort(cell.date),
                },
                h('span', { className: 'dn' }, String(Number(cell.date.slice(8, 10)))),
                ...shown.map((item) =>
                  h(
                    'span',
                    { className: `org-mi${item.kind === 'plan' ? ' plan' : ''}`, key: `${item.kind}:${item.key}` },
                    h('i', { className: 'dot' }),
                    item.title || '(untitled)',
                  ),
                ),
                items.length > shown.length
                  ? h('span', { className: 'org-more' }, `+${items.length - shown.length} ${t('inMonth')}`)
                  : null,
              );
            }),
          ),
        ),
      );
    }

    /* ── the page ─────────────────────────────────────────────────────────── */

    function OrganiserPage({ t }) {
      const [view, setView] = useState('day');
      const [today, setToday] = useState(null);
      const [zone, setZone] = useState(null);
      const [selected, setSelected] = useState(null);
      const [cursor, setCursor] = useState(null);
      const [data, setData] = useState({ plans: [], events: [], notes: [], calendar: { connected: false, error: null } });
      const [status, setStatus] = useState('loading');
      const [error, setError] = useState(null);
      const [draft, setDraft] = useState(null);
      const [draftDate, setDraftDate] = useState(null);
      const [noteState, setNoteState] = useState('idle');
      const [adding, setAdding] = useState(false);
      const [newTitle, setNewTitle] = useState('');
      const [newTime, setNewTime] = useState('');
      const [query, setQuery] = useState('');
      const [busy, setBusy] = useState(false);
      const [reloadKey, setReloadKey] = useState(0);

      const week = useMemo(() => (selected ? weekOf(selected) : []), [selected]);
      const range = useMemo(() => {
        if (!selected) return null;
        if (view === 'month' && cursor) {
          const cells = monthCells(cursor);
          return { from: cells[0].date, to: cells[41].date };
        }
        return { from: week[0], to: week[6] };
      }, [view, cursor, selected, week]);

      const rangeFrom = range?.from ?? null;
      const rangeTo = range?.to ?? null;

      /* First read: learn today and the zone, then the range effect takes over. */
      useEffect(() => {
        let alive = true;
        call('api/organiser')
          .then((payload) => {
            if (!alive) return;
            setToday(payload.today);
            setZone(payload.zone);
            setSelected((current) => current ?? payload.today);
            setCursor((current) => current ?? payload.today.slice(0, 7));
            setData((d) => ({ ...d, notes: payload.notes, calendar: payload.calendar }));
            setStatus('ready');
          })
          .catch((cause) => {
            if (!alive) return;
            setStatus('error');
            setError(cause.message);
          });
        return () => {
          alive = false;
        };
      }, []);

      /* Every range change re-reads the plans and events for it. */
      useEffect(() => {
        if (!rangeFrom || !rangeTo) return undefined;
        let alive = true;
        call(`api/organiser?from=${rangeFrom}&to=${rangeTo}`)
          .then((payload) => {
            if (!alive) return;
            setZone(payload.zone);
            setToday(payload.today);
            setData((d) => ({ ...d, plans: payload.plans, events: payload.events, notes: payload.notes, calendar: payload.calendar }));
            setError(null);
          })
          .catch((cause) => {
            if (alive) setError(cause.message);
          });
        return () => {
          alive = false;
        };
      }, [rangeFrom, rangeTo, reloadKey]);

      /* The month label follows the selected day in Day view. */
      useEffect(() => {
        if (selected) setCursor(selected.slice(0, 7));
      }, [selected]);

      const eventsByDay = useMemo(
        () => groupByDay(data.events, (event) => eventDay(event, zone)),
        [data.events, zone],
      );
      const plansByDay = useMemo(() => groupByDay(data.plans, (plan) => plan.date), [data.plans]);
      const notesByDate = useMemo(() => new Map(data.notes.filter((note) => note.date).map((note) => [note.date, note])), [data.notes]);

      const dayNote = selected ? notesByDate.get(selected) ?? null : null;
      const noteBody = draft !== null && draftDate === selected ? draft : dayNote?.body ?? '';

      /* Persist the note after a pause. The server trims; adopt its text so the
         comparison settles instead of saving on every keystroke forever. */
      useEffect(() => {
        if (draft === null || draftDate !== selected) return undefined;
        const committed = dayNote?.body ?? '';
        if (draft === committed) return undefined;
        const timer = setTimeout(() => {
          const body = draft;
          setNoteState('saving');
          void (async () => {
            try {
              /* What the server now holds: its trimmed text, or nothing. Adopting
                 it keeps the draft and the row in step, so autosave settles. */
              let stored = null;
              if (!body.trim()) {
                if (dayNote) {
                  await post('api/organiser/note', { action: 'delete', id: dayNote.id });
                  setData((d) => ({ ...d, notes: d.notes.filter((note) => note.id !== dayNote.id) }));
                }
              } else {
                const payload = await post('api/organiser/note', { action: 'save', date: selected, body });
                stored = payload.note.body;
                setData((d) => ({ ...d, notes: [payload.note, ...d.notes.filter((note) => note.id !== payload.note.id)] }));
              }
              setNoteState('saved');
              setDraft((current) => (current === body ? stored : current));
            } catch (cause) {
              setNoteState('error');
              setError(cause.message);
            }
          })();
        }, 900);
        return () => clearTimeout(timer);
      }, [draft, draftDate, selected, dayNote]);

      const openDay = useCallback((date) => {
        setSelected(date);
        setDraft(null);
        setDraftDate(date);
        setNoteState('idle');
        setAdding(false);
        setView('day');
      }, []);

      const shift = useCallback(
        (direction) => {
          if (view === 'month' && cursor) {
            const [year, month] = cursor.split('-').map(Number);
            const next = new Date(Date.UTC(year, month - 1 + direction, 1));
            setCursor(next.toISOString().slice(0, 7));
            return;
          }
          setSelected((current) => (current ? addDays(current, direction * 7) : current));
        },
        [view, cursor],
      );

      const goToday = useCallback(() => {
        if (!today) return;
        setSelected(today);
        setCursor(today.slice(0, 7));
        setDraft(null);
        setDraftDate(today);
      }, [today]);

      const completePlan = useCallback(
        async (id) => {
          setBusy(true);
          try {
            await post('api/organiser/plan', { action: 'done', id });
            setData((d) => ({ ...d, plans: d.plans.filter((plan) => plan.id !== id) }));
          } catch (cause) {
            setError(cause.message);
          } finally {
            setBusy(false);
          }
        },
        [],
      );

      const submitPlan = useCallback(
        async (event) => {
          event.preventDefault();
          const title = newTitle.trim();
          if (!title || !selected) return;
          setBusy(true);
          try {
            const payload = await post('api/organiser/plan', {
              action: 'add',
              date: selected,
              time: newTime || undefined,
              title,
            });
            setData((d) => ({ ...d, plans: [...d.plans, payload.plan] }));
            setNewTitle('');
            setNewTime('');
            setAdding(false);
          } catch (cause) {
            setError(cause.message);
          } finally {
            setBusy(false);
          }
        },
        [newTitle, newTime, selected],
      );

      const retry = useCallback(() => {
        setStatus('loading');
        setError(null);
        setReloadKey((key) => key + 1);
        call('api/organiser')
          .then((payload) => {
            setToday(payload.today);
            setZone(payload.zone);
            setSelected((current) => current ?? payload.today);
            setCursor((current) => current ?? payload.today.slice(0, 7));
            setData((d) => ({ ...d, notes: payload.notes, calendar: payload.calendar }));
            setStatus('ready');
          })
          .catch((cause) => {
            setStatus('error');
            setError(cause.message);
          });
      }, []);

      /* The rail: every note, newest day first, inbox after. */
      const railNotes = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return needle ? data.notes.filter((note) => note.body.toLowerCase().includes(needle)) : data.notes;
      }, [data.notes, query]);
      const datedNotes = railNotes.filter((note) => note.date);
      const inboxNotes = railNotes.filter((note) => !note.date);

      const dayEvents = selected ? (eventsByDay.get(selected) ?? []) : [];
      const dayPlans = selected ? (plansByDay.get(selected) ?? []) : [];

      const later = useMemo(() => {
        if (!selected) return [];
        const rows = [];
        for (let step = 1; step <= 3; step += 1) {
          const date = addDays(selected, step);
          const events = (eventsByDay.get(date) ?? []).slice().sort((a, b) => String(a.start).localeCompare(String(b.start)));
          const plans = plansByDay.get(date) ?? [];
          const items = [
            ...events.map((event) => ({ kind: 'event', time: event.allDay ? 'all day' : clock(event.start, zone), title: event.title, calendar: event.calendar })),
            ...plans.map((plan) => ({ kind: 'plan', time: plan.time ?? 'no time', title: plan.title, id: plan.id })),
          ];
          if (items.length) rows.push({ date, items });
        }
        return rows;
      }, [selected, eventsByDay, plansByDay, zone]);

      if (status === 'loading' && !today) {
        return h('div', { className: 'org-page' }, h('div', { className: 'org-empty' }, t('loading')));
      }
      if (status === 'error' && !today) {
        return h(
          'div',
          { className: 'org-page' },
          h(
            'div',
            { className: 'org-empty' },
            `${t('loadFailed')}: ${error ?? ''}`,
            h('button', { type: 'button', className: 'org-retry', onClick: retry }, t('retry')),
          ),
        );
      }

      const selectedEvents = dayEvents;
      const calendar = data.calendar ?? { connected: false, error: null };

      return h(
        'div',
        { className: 'org-page' },

        h(
          'header',
          { className: 'org-head' },
          h('h1', null, t('panel')),
          h(
            'div',
            { className: 'org-nav' },
            h(
              'div',
              { className: 'org-seg', role: 'group' },
              h(
                'button',
                {
                  type: 'button',
                  'aria-pressed': view === 'day',
                  onClick: () => {
                    setView('day');
                    if (selected) setCursor(selected.slice(0, 7));
                  },
                },
                t('day'),
              ),
              h('button', { type: 'button', 'aria-pressed': view === 'month', onClick: () => setView('month') }, t('month')),
            ),
            h('button', { type: 'button', className: 'org-icon', title: t('previous'), 'aria-label': t('previous'), onClick: () => shift(-1) }, '‹'),
            h('div', { className: 'org-month' }, cursor ? monthTitle(cursor) : ''),
            h('button', { type: 'button', className: 'org-icon', title: t('next'), 'aria-label': t('next'), onClick: () => shift(1) }, '›'),
            h('button', { type: 'button', className: 'org-todaybtn', onClick: goToday }, t('today')),
          ),
        ),

        error && today
          ? h(
              'div',
              { className: 'org-note-banner', role: 'alert' },
              h('span', null, error),
              h('button', { type: 'button', onClick: () => setError(null) }, t('dismiss')),
            )
          : null,

        view === 'month' && cursor
          ? h(MonthView, {
              cursor,
              today,
              zone,
              t,
              eventsByDay,
              plansByDay,
              onOpenDay: openDay,
            })
          : h(
              'div',
              { className: 'org-cols' },

              h(
                'nav',
                { className: 'org-days' },
                ...week.map((date) => {
                  const dots = (eventsByDay.get(date)?.length ?? 0) + (plansByDay.get(date)?.length ?? 0);
                  return h(
                    'button',
                    {
                      type: 'button',
                      key: date,
                      className: 'org-day',
                      'aria-current': date === selected ? 'date' : undefined,
                      onClick: () => openDay(date),
                    },
                    h('span', { className: 'wd' }, new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', weekday: 'short' }).format(new Date(`${date}T12:00:00Z`))),
                    h('span', { className: 'num' }, String(Number(date.slice(8, 10)))),
                    h(
                      'span',
                      { className: 'dots' },
                      ...Array.from({ length: Math.min(dots, 3) }, (_, index) => h('i', { key: index })),
                    ),
                  );
                }),
              ),

              h(
                'section',
                { className: 'org-pane' },
                h('h2', null, selected ? dayLong(selected) : '', selected === today ? h('span', { className: 'org-chip' }, t('today')) : null),

                h(
                  'section',
                  { className: 'org-band' },
                  h(
                    'h3',
                    null,
                    t('calendar'),
                    h('span', { className: 'meta' }, calendar.connected ? 'Google' : ''),
                  ),
                  ...(calendar.error
                    ? [h('p', { className: 'org-muted' }, `${t('calendarFailed')}: ${calendar.error}`)]
                    : !calendar.connected
                      ? [h('p', { className: 'org-muted' }, h('strong', null, t('notConnected')), ' ', t('connectHint'))]
                      : selectedEvents.length
                        ? selectedEvents
                            .slice()
                            .sort((a, b) => String(a.start).localeCompare(String(b.start)))
                            .map((event) => h(EventRow, { key: event.id ?? event.start, event, zone, t }))
                        : [h('p', { className: 'org-muted' }, t('nothingOnDay'))]),
                ),

                h(
                  'section',
                  { className: 'org-band' },
                  h('h3', null, t('plans'), h('span', { className: 'meta' }, String(dayPlans.length))),
                  ...(dayPlans.length
                    ? dayPlans.map((plan) => h(PlanRow, { key: plan.id, plan, onDone: completePlan, t }))
                    : [h('p', { className: 'org-muted' }, t('nothingPlanned'))]),
                  adding
                    ? h(
                        'form',
                        { className: 'org-add', onSubmit: submitPlan },
                        h('input', {
                          className: 'org-input',
                          value: newTitle,
                          placeholder: t('planPlaceholder'),
                          autoFocus: true,
                          onChange: (event) => setNewTitle(event.target.value),
                          onKeyDown: (event) => {
                            if (event.key === 'Escape') {
                              setAdding(false);
                              setNewTitle('');
                              setNewTime('');
                            }
                          },
                        }),
                        h('input', {
                          className: 'org-input org-timeinput',
                          type: 'time',
                          value: newTime,
                          'aria-label': t('timePlaceholder'),
                          onChange: (event) => setNewTime(event.target.value),
                        }),
                        h('button', { type: 'submit', className: 'org-primary', disabled: busy || !newTitle.trim() }, t('add')),
                        h('button', { type: 'button', className: 'org-dashed', onClick: () => { setAdding(false); setNewTitle(''); setNewTime(''); } }, t('cancel')),
                      )
                    : h('button', { type: 'button', className: 'org-dashed', onClick: () => setAdding(true) }, `+ ${t('addPlan')}`),
                ),

                h(
                  'section',
                  { className: 'org-band' },
                  h('h3', null, `${t('note')}${selected ? ` · ${dayShort(selected)}` : ''}`),
                  h(
                    'div',
                    { className: 'org-notecard' },
                    h('textarea', {
                      value: noteBody,
                      placeholder: t('noNoteYet'),
                      onChange: (event) => {
                        setDraftDate(selected);
                        setDraft(event.target.value);
                        setNoteState('idle');
                      },
                    }),
                    h(
                      'div',
                      { className: 'org-notefoot' },
                      h(
                        'span',
                        { className: `state${noteState === 'error' ? ' error' : ''}` },
                        noteState === 'saving'
                          ? t('saving')
                          : noteState === 'error'
                            ? t('saveFailed')
                            : noteState === 'saved'
                              ? t('saved')
                              : '',
                      ),
                      h('span', null, t('onePerDay')),
                    ),
                  ),
                ),

                later.length
                  ? h(
                      'section',
                      { className: 'org-band' },
                      h('h3', null, t('later')),
                      ...later.flatMap((row) =>
                        row.items.slice(0, 1).map((item) =>
                          h(
                            'div',
                            { className: 'org-up', key: `${row.date}:${item.title}` },
                            h('span', { className: 'org-upday' }, dayShort(row.date)),
                            h('span', { className: 'org-mono' }, item.time),
                            h('span', { className: 'org-uptitle' }, item.title),
                            item.kind === 'plan' ? h('span', { className: 'org-pid' }, item.id) : item.calendar ? h('span', { className: 'org-cal' }, item.calendar) : null,
                          ),
                        ),
                      ),
                    )
                  : null,
              ),

              h(
                'aside',
                { className: 'org-rail' },
                h('h3', null, t('notes'), h('span', { className: 'meta' }, String(railNotes.length))),
                h(
                  'label',
                  { className: 'org-search' },
                  h(
                    'svg',
                    { width: 13, height: 13, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, 'aria-hidden': 'true' },
                    h('circle', { cx: 7, cy: 7, r: 4.6 }),
                    h('path', { d: 'M10.4 10.4 14 14' }),
                  ),
                  h('input', {
                    value: query,
                    placeholder: t('searchNotes'),
                    'aria-label': t('searchNotes'),
                    onChange: (event) => setQuery(event.target.value),
                  }),
                ),
                h(
                  'div',
                  { className: 'org-nlist' },
                  ...datedNotes.map((note) =>
                    h(
                      'button',
                      {
                        type: 'button',
                        key: note.id,
                        className: `org-nitem${note.date === selected ? ' cur' : ''}`,
                        onClick: () => openDay(note.date),
                        title: note.body,
                      },
                      h('span', { className: 'nd' }, dayShort(note.date)),
                      h('span', { className: 'nb' }, notePreview(note.body)),
                    ),
                  ),
                  inboxNotes.length ? h('div', { className: 'org-group' }, t('inbox')) : null,
                  ...inboxNotes.map((note) =>
                    h(
                      'div',
                      { className: 'org-nitem', key: note.id, title: note.body },
                      h('span', { className: 'nd' }, t('inbox')),
                      h('span', { className: 'nb' }, notePreview(note.body)),
                    ),
                  ),
                  !railNotes.length
                    ? h('p', { className: 'org-muted', style: { padding: '4px 16px 10px' } }, query.trim() ? t('noMatches') : t('noNotes'))
                    : null,
                ),
                h('div', { className: 'org-railfoot' }, t('askInChat')),
              ),
            ),
      );
    }

    /** Register the panel entry and the page it selects. */
    function apply(ctx) {
      ctx.effect(injectStyles, 'dsh-organiser: styles');
      ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh-organiser: dictionaries');
      const t = ctx.locale.bind(NS);

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 8,
            locale: NS,
            label: () => t('panel'),
          },
          OrganiserGlyph,
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
          OrganiserPage,
        ),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply,
      __logic: {
        addDays,
        startOfWeek,
        weekOf,
        monthCells,
        eventDay,
        groupByDay,
        dayShort,
        dayLong,
        monthTitle,
        notePreview,
        clock,
      },
    };
  },
});
