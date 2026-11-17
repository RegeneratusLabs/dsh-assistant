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
      automations: 'Automations',
      newAutomation: 'New automation',
      automationName: 'Name',
      automationInstruction: 'What should it do?',
      automationHint: 'Runs in a new conversation, then reports back here.',
      automationEmpty: 'No automations today.',
      automationUnavailable: 'Automations are not available on this Host.',
      remindMe: 'Send me a chat message',
      atTheTime: 'at the time',
      minutesBefore: 'min before',
      reminderSet: 'Plan saved, reminder set.',
      planSaved: 'Plan saved.',
      scheduleFailed: 'Could not schedule the reminder',
      automationCreated: 'Automation created.',
      repeat: 'Repeat',
      once: 'Once',
      daily: 'Daily',
      weekdays: 'Weekdays',
      weekly: 'Weekly',
      week: 'Week',
      upNext: 'Up next',
      nothingUpcoming: 'Nothing coming up.',
      allDayLabel: 'all day',
      nextRun: 'Next run',
      manageInAutomation: 'Manage in Automation tasks',
      dayNote: 'Note',
      reopen: 'Reopen',
      delete: 'Delete',
      confirmDelete: 'Delete for good?',
      deleted: 'Deleted.',
      deleteFailed: 'Could not delete',
      connectToEdit: 'Connect a calendar to change this event.',
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
      automations: '自动化',
      newAutomation: '新建自动化',
      automationName: '名称',
      automationInstruction: '要它做什么？',
      automationHint: '会在新会话中运行，并把结果回报在这里。',
      automationEmpty: '今天没有自动化。',
      automationUnavailable: '此宿主未启用自动化。',
      remindMe: '给我发一条消息',
      atTheTime: '准时',
      minutesBefore: '分钟前',
      reminderSet: '计划已保存，提醒已设置。',
      planSaved: '计划已保存。',
      scheduleFailed: '无法设置提醒',
      automationCreated: '自动化已创建。',
      repeat: '重复',
      once: '一次',
      daily: '每天',
      weekdays: '工作日',
      weekly: '每周',
      week: '周',
      upNext: '接下来',
      nothingUpcoming: '接下来没有安排。',
      allDayLabel: '全天',
      nextRun: '下次运行',
      manageInAutomation: '在“自动化”中管理',
      dayNote: '笔记',
      reopen: '重新打开',
      delete: '删除',
      confirmDelete: '确认删除？',
      deleted: '已删除。',
      deleteFailed: '无法删除',
      connectToEdit: '连接日历后可修改该日程。',
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

    /**
     * A colour per calendar, derived from its name.
     *
     * Google sends its own palette with the provider; until then a stable hash
     * keeps Work blue and Personal terracotta across views, and the same event
     * never changes colour between renders.
     */
    const PALETTE = Object.freeze(['#2f6feb', '#c0623d', '#2c8f6b', '#7b5cff', '#a8791a', '#0e7490', '#a2376b', '#5b7f2a', '#9a4f0f', '#4b5563']);

    function calendarColor(name) {
      const text = String(name ?? 'Calendar');
      let hash = 0;
      for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
      return PALETTE[hash % PALETTE.length];
    }

    /** Minutes since local midnight for an instant, in `zone`. */
    function minutesOf(iso, zone) {
      const ms = Date.parse(iso);
      if (!Number.isFinite(ms)) return null;
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: zone || undefined,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(new Date(ms));
      const get = (type) => parts.find((part) => part.type === type)?.value;
      return Number(get('hour')) * 60 + Number(get('minute'));
    }

    /** ISO week number for the mini-month caption. */
    function weekNumber(date) {
      const target = new Date(`${date}T00:00:00Z`);
      const day = (target.getUTCDay() + 6) % 7;
      target.setUTCDate(target.getUTCDate() - day + 3);
      const first = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
      const firstDay = (first.getUTCDay() + 6) % 7;
      first.setUTCDate(first.getUTCDate() - firstDay + 3);
      return 1 + Math.round((target - first) / (7 * 86400000));
    }

    /** Greedy lane packing so overlapping blocks sit side by side. */
    function packLanes(items) {
      const laneEnds = [];
      const placed = [];
      for (const item of items) {
        let lane = laneEnds.findIndex((end) => end <= item.start);
        if (lane === -1) {
          lane = laneEnds.length;
          laneEnds.push(item.end);
        } else {
          laneEnds[lane] = item.end;
        }
        placed.push({ ...item, lane });
      }
      return { placed, lanes: Math.max(1, laneEnds.length) };
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
  height: 100%; overflow: auto; display: flex; flex-direction: column; color: var(--dsw-alias-label-primary, #111827);
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
  border-left: 3px solid var(--org-ev, var(--dsw-alias-brand-primary, #3b6ef6)); border-radius: 8px;
  background: color-mix(in srgb, var(--org-ev, transparent) 6%, transparent);
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
.org-mi .dot { width: 5px; height: 5px; border-radius: 50%; flex: none; background: var(--org-ev, var(--dsw-alias-brand-primary, #3b6ef6)); }
.org-mi.plan { color: var(--dsw-alias-label-secondary, #6b7280); }
.org-mi.plan .dot { background: transparent; border: 1.2px solid var(--dsw-alias-label-tertiary, #9ca3af); }
.org-more { font-size: 10px; color: var(--dsw-alias-label-tertiary, #9ca3af); }

.org-empty { padding: 40px 22px; font-size: 13px; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-retry { margin-left: 10px; border: 1px solid currentColor; background: transparent; color: inherit; border-radius: 6px; padding: 2px 9px; font: inherit; font-size: 12px; cursor: pointer; }

.org-page { --org-auto: #7b5cff; }
.org-auto { display: grid; grid-template-columns: 16px 62px minmax(0, 1fr) auto; gap: 9px; align-items: center; padding: 5px 2px; }
.org-auto .glyph { color: var(--org-auto); font-size: 12px; }
.org-auto .title { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.org-auto .when { font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #9ca3af); white-space: nowrap; }
.org-form { display: flex; flex-direction: column; gap: 6px; }
.org-formrow { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.org-remind { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--dsw-alias-label-secondary, #6b7280); }
.org-remind input { accent-color: var(--dsw-alias-brand-primary, #3b6ef6); }
.org-select { height: 30px; padding: 0 6px; border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 7px; background: transparent; color: inherit; font: inherit; font-size: 12.5px; }
.org-hint { margin: 0; font-size: 10.5px; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-toast { margin: 10px 18px 0; padding: 7px 11px; border-radius: 8px; font-size: 12px; color: var(--dsw-alias-label-secondary, #6b7280); background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.06)); border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); }
.org-mi.auto { color: var(--org-auto); }
.org-mi.auto .dot { background: var(--org-auto); }


/* ── week view ─────────────────────────────────────────────────────────── */
.org-week { flex: 1; min-height: 0; display: grid; grid-template-columns: 188px minmax(0, 1fr) 288px; }
.org-side { border-right: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); padding: 12px 10px; display: flex; flex-direction: column; gap: 16px; min-height: 0; }
.org-minihead { display: flex; align-items: baseline; justify-content: space-between; padding: 0 2px 6px; }
.org-minihead b { font-size: 12px; font-weight: 600; }
.org-minihead span { font-size: 9.5px; letter-spacing: .07em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-mini { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px 0; }
.org-mini .h { font-size: 9px; font-weight: 700; color: var(--dsw-alias-label-tertiary, #9ca3af); text-align: center; padding-bottom: 3px; }
.org-mini button { position: relative; height: 22px; border: 0; background: none; color: var(--dsw-alias-label-primary, #111827); font: inherit; font-size: 10.5px; border-radius: 5px; cursor: pointer; }
.org-mini button.out { color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-mini button.week { background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.06)); border-radius: 0; }
.org-mini button.today { background: var(--dsw-alias-brand-primary, #3b6ef6); color: var(--dsw-alias-label-primary-foreground, #fff); font-weight: 700; border-radius: 50%; width: 20px; height: 20px; margin: 1px auto; }
.org-mini button.sel { box-shadow: inset 0 0 0 1.5px var(--dsw-alias-brand-primary, #3b6ef6); }
.org-mini button i { position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 3px; height: 3px; border-radius: 50%; background: var(--dsw-alias-brand-primary, #3b6ef6); }
.org-mini button.today i { display: none; }

.org-upnext h4 { margin: 0 0 4px; padding: 0 2px; font-size: 9.5px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-nrow { display: grid; grid-template-columns: 9px 1fr; gap: 8px; width: 100%; padding: 6px 2px; border: 0; border-top: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18)); background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; align-items: start; }
.org-nrow:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08)); }
.org-nrow .d { width: 7px; height: 7px; border-radius: 50%; margin-top: 5px; }
.org-nrow .d.event { background: var(--org-ev, var(--dsw-alias-brand-primary, #3b6ef6)); }
.org-nrow .d.plan { background: transparent; border: 1.5px solid var(--dsw-alias-label-tertiary, #9ca3af); }
.org-nrow .d.auto { background: transparent; border: 1.5px solid var(--org-auto); }
.org-nrow .w { display: block; font-size: 9px; color: var(--dsw-alias-label-tertiary, #9ca3af); font-family: ui-monospace, monospace; }
.org-nrow .n { display: block; font-size: 12px; line-height: 1.3; color: var(--dsw-alias-label-primary, #111827); }

.org-gridwrap { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.org-ghead { display: grid; grid-template-columns: 48px repeat(7, minmax(0, 1fr)); height: 48px; flex: none; border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); }
.org-ghead .gut { border-right: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18)); }
.org-gday { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 1px; padding: 0 8px; border: 0; border-left: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18)); background: none; color: inherit; font: inherit; cursor: pointer; }
.org-gday:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08)); }
.org-gday .nm { font-size: 9px; font-weight: 700; letter-spacing: .08em; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-gday .nu { font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; }
.org-gday.today .nm, .org-gday.today .nu { color: var(--dsw-alias-brand-primary, #3b6ef6); }
.org-gall { display: grid; grid-template-columns: 48px repeat(7, minmax(0, 1fr)); min-height: 44px; flex: none; border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); }
.org-gall .gut { font-size: 8.5px; letter-spacing: .05em; color: var(--dsw-alias-label-tertiary, #9ca3af); padding: 4px 0 0 6px; border-right: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18)); }
.org-adcol { border-left: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18)); padding: 4px 3px; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.org-chip { height: 16px; padding: 0 5px; border-radius: 4px; font-size: 9.5px; font-weight: 600; display: flex; align-items: center; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.org-chip.event { color: var(--org-ev); background: color-mix(in srgb, var(--org-ev) 12%, transparent); border-left: 2px solid var(--org-ev); }
.org-chip.plan { color: var(--dsw-alias-label-secondary, #6b7280); border: 1px dashed var(--dsw-alias-border-l2, rgba(127,127,127,.4)); }
.org-gbody { flex: none; height: 720px; display: grid; grid-template-columns: 48px repeat(7, minmax(0, 1fr)); }
.org-hgut { position: relative; border-right: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18)); }
.org-hgut span { position: absolute; right: 6px; font-size: 8.5px; color: var(--dsw-alias-label-tertiary, #9ca3af); font-family: ui-monospace, monospace; }
.org-gcol { position: relative; border-left: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18)); background-image: repeating-linear-gradient(to bottom, transparent 0 47.5px, var(--dsw-alias-border-l1, rgba(127,127,127,.14)) 47.5px 48px); cursor: pointer; }
.org-gcol.today { background-color: color-mix(in srgb, var(--dsw-alias-brand-primary, #3b6ef6) 3.5%, transparent); }
.org-block { position: absolute; border-radius: 5px; padding: 3px 5px; overflow: hidden; font-size: 10px; line-height: 1.25; cursor: pointer; text-align: left; font-family: inherit; }
.org-block .bt { display: block; font-size: 8.5px; font-family: ui-monospace, monospace; opacity: .8; }
.org-block .bn { display: block; font-weight: 600; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.org-block.event { color: var(--org-ev); background: color-mix(in srgb, var(--org-ev) 13%, transparent); border: 0; border-left: 3px solid var(--org-ev); }
.org-block.plan { color: var(--dsw-alias-label-secondary, #6b7280); background: transparent; border: 1px dashed var(--dsw-alias-border-l2, rgba(127,127,127,.4)); border-left: 3px dashed var(--dsw-alias-label-tertiary, #9ca3af); }
.org-block.auto { color: var(--org-auto); background: color-mix(in srgb, var(--org-auto) 9%, transparent); border: 1px dashed color-mix(in srgb, var(--org-auto) 42%, transparent); border-left: 3px dashed var(--org-auto); }
.org-block.sel { box-shadow: 0 0 0 2px var(--dsw-alias-bg-base, #fff), 0 0 0 3.5px var(--org-ev, var(--dsw-alias-brand-primary, #3b6ef6)); z-index: 3; }
.org-nowline { position: absolute; left: 0; right: 0; border-top: 1.5px solid #e5484d; z-index: 4; pointer-events: none; }
.org-nowline i { position: absolute; left: -3px; top: -3.5px; width: 7px; height: 7px; border-radius: 50%; background: #e5484d; }
.org-nowline span { position: absolute; right: 4px; top: -13px; font-size: 8.5px; font-family: ui-monospace, monospace; color: #e5484d; }

.org-detail { border-left: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,.04)); display: flex; flex-direction: column; min-height: 0; overflow: auto; }
.org-dcard { background: var(--dsw-alias-bg-base, #fff); border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-top: 3px solid var(--org-ev, var(--dsw-alias-brand-primary, #3b6ef6)); padding: 12px 14px; }
.org-dkind { display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--org-ev, var(--dsw-alias-brand-primary, #3b6ef6)); }
.org-dcard h2 { margin: 4px 0 2px; font-size: 15px; font-weight: 600; }
.org-dwhen { font-size: 11.5px; color: var(--dsw-alias-label-secondary, #6b7280); font-family: ui-monospace, monospace; }
.org-drow { display: grid; grid-template-columns: 58px 1fr; gap: 6px; font-size: 11.5px; padding: 3px 0; }
.org-drow .k { font-size: 9.5px; letter-spacing: .05em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #9ca3af); padding-top: 1px; }
.org-dclose { border: 0; background: none; color: var(--dsw-alias-label-tertiary, #9ca3af); cursor: pointer; font: inherit; font-size: 12px; }
.org-dclose:hover { color: var(--dsw-alias-label-primary, #111827); }
.org-note-wide { padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; }
.org-note-wide h4 { margin: 0; font-size: 9.5px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--dsw-alias-label-tertiary, #9ca3af); }
.org-note-wide textarea { width: 100%; min-height: 120px; resize: vertical; border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 8px; background: var(--dsw-alias-bg-base, #fff); color: inherit; font: inherit; font-size: 12px; line-height: 1.6; padding: 8px; }
.org-note-wide textarea:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary, #3b6ef6); outline-offset: 1px; }

.org-dactions { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 14px 12px; }
.org-btn { height: 28px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 7px; background: transparent; color: var(--dsw-alias-label-primary, #111827); font: inherit; font-size: 11.5px; cursor: pointer; }
.org-btn:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08)); }
.org-btn.danger { color: var(--dsw-alias-state-error-primary, #c62828); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #c62828) 40%, transparent); }
.org-btn.danger.armed { background: var(--dsw-alias-state-error-primary, #c62828); border-color: transparent; color: #fff; }
.org-trash { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.24)); border-radius: 7px; background: transparent; color: var(--dsw-alias-label-tertiary, #9ca3af); font: inherit; font-size: 11px; cursor: pointer; }
.org-trash:hover { color: var(--dsw-alias-state-error-primary, #c62828); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #c62828) 40%, transparent); }
.org-trash.armed { background: var(--dsw-alias-state-error-primary, #c62828); border-color: transparent; color: #fff; }
.org-trash svg { flex: none; }
.org-plan.done .org-ptitle { text-decoration: line-through; opacity: .55; }
.org-check.done { background: var(--dsw-alias-brand-primary, #3b6ef6); border-color: var(--dsw-alias-brand-primary, #3b6ef6); display: grid; place-items: center; }
.org-check.done::after { content: "✓"; color: var(--dsw-alias-label-primary-foreground, #fff); font-size: 9px; line-height: 1; }
.org-block.done .bn { text-decoration: line-through; opacity: .55; }
.org-mi.done { text-decoration: line-through; opacity: .55; }
.org-dcard h2.struck { text-decoration: line-through; opacity: .6; }

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
        { className: 'org-event', style: { '--org-ev': calendarColor(event.calendar) } },
        h('span', { className: 'org-mono' }, time || 'time unknown'),
        h('span', { className: 'org-etitle', title: event.title }, event.title || '(untitled event)'),
        event.calendar ? h('span', { className: 'org-cal' }, event.calendar) : null,
      );
    }

    function PlanRow({ plan, onToggle, t }) {
      const done = plan.status === 'done';
      return h(
        'div',
        { className: `org-plan${done ? ' done' : ''}` },
        h('button', {
          type: 'button',
          className: `org-check${done ? ' done' : ''}`,
          title: done ? t('reopen') : t('markDone'),
          'aria-label': `${done ? t('reopen') : t('markDone')}: ${plan.title}`,
          onClick: () => onToggle(plan),
        }),
        h('span', { className: 'org-mono' }, plan.time ?? 'no time'),
        h('span', { className: 'org-ptitle', title: plan.title }, plan.title),
        h('span', { className: 'org-pid' }, plan.id),
      );
    }

    function MonthView({ cursor, today, eventsByDay, plansByDay, automationsByDay, zone, t, onOpenDay }) {
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
              const autos = automationsByDay.get(cell.date) ?? [];
              const items = [
                ...events.map((event) => ({ kind: 'event', key: event.id ?? event.start, title: event.title, color: calendarColor(event.calendar) })),
                ...plans.map((plan) => ({ kind: 'plan', key: plan.id, title: plan.title, done: plan.status === 'done' })),
                ...autos.map((task) => ({ kind: 'auto', key: task.id, title: task.title })),
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
                    { className: `org-mi${item.kind === 'plan' ? ' plan' : item.kind === 'auto' ? ' auto' : ''}${item.done ? ' done' : ''}`, key: `${item.kind}:${item.key}`, style: item.color ? { '--org-ev': item.color } : undefined },
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


    /* ── week pieces ──────────────────────────────────────────────────────── */

    const GRID_START = 7;
    const GRID_END = 22;
    const GRID_HOUR = 48;

    function MiniMonth({ cursor, today, selected, marks, onPick, t }) {
      const cells = monthCells(cursor);
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'org-minihead' },
          h('b', null, monthTitle(cursor)),
          h('span', null, `W${weekNumber(selected ?? today)}`),
        ),
        h(
          'div',
          { className: 'org-mini' },
          ...weekdayHeads().map((name) => h('div', { className: 'h', key: name }, name)),
          ...cells.map((cell) => {
            const count = marks.get(cell.date) ?? 0;
            const classes = [
              cell.inMonth ? '' : 'out',
              cell.date === today ? 'today' : '',
              cell.date === selected ? 'sel' : '',
              cell.date === selected ? 'week' : '',
            ].filter(Boolean).join(' ');
            return h(
              'button',
              {
                key: cell.date,
                type: 'button',
                className: classes,
                onClick: () => onPick(cell.date),
                title: dayShort(cell.date),
              },
              String(Number(cell.date.slice(8, 10))),
              count ? h('i') : null,
            );
          }),
        ),
      );
    }

    function UpNext({ items, t, onSelect }) {
      return h(
        'div',
        { className: 'org-upnext' },
        h('h4', null, t('upNext')),
        ...(items.length
          ? items.map((item) =>
              h(
                'button',
                { type: 'button', className: 'org-nrow', key: item.key, onClick: () => onSelect(item.ref) },
                h('span', { className: `d ${item.kind}` }),
                h('span', null, h('span', { className: 'w' }, item.when), h('span', { className: 'n' }, item.title)),
              ),
            )
          : [h('p', { className: 'org-muted', style: { padding: '0 2px' } }, t('nothingUpcoming'))]),
      );
    }

    function WeekGrid({ days, zone, today, nowMin, eventsByDay, plansByDay, automationsByDay, selected, t, onPickDay, onSlot, onSelect }) {
      const topFor = (minutes) => ((minutes - GRID_START * 60) / 60) * GRID_HOUR;
      const label = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

      const allDay = (date) => [
        ...(eventsByDay.get(date) ?? [])
          .filter((event) => event.allDay)
          .map((event) => ({ key: event.id ?? `${event.start}`, kind: 'event', title: event.title, color: calendarColor(event.calendar) })),
        ...(plansByDay.get(date) ?? [])
          .filter((plan) => !plan.time)
          .map((plan) => ({ key: plan.id, kind: 'plan', title: plan.title })),
      ];

      const timed = (date) => {
        const items = [];
        for (const event of eventsByDay.get(date) ?? []) {
          if (event.allDay) continue;
          const start = minutesOf(event.start, zone);
          const end = event.end ? minutesOf(event.end, zone) : start === null ? null : start + 30;
          if (start === null || end === null) continue;
          items.push({
            key: event.id ?? event.start,
            kind: 'event',
            start,
            end: Math.max(end, start + 15),
            title: event.title,
            time: `${label(start)} – ${label(end)}`,
            color: calendarColor(event.calendar),
            ref: { kind: 'event', id: event.id, data: event },
          });
        }
        for (const plan of plansByDay.get(date) ?? []) {
          if (!plan.time) continue;
          const [hour, minute] = plan.time.split(':').map(Number);
          const start = hour * 60 + minute;
          items.push({
            key: plan.id,
            kind: 'plan',
            start,
            end: start + 30,
            title: plan.title,
            time: plan.time,
            done: plan.status === 'done',
            ref: { kind: 'plan', id: plan.id, data: plan },
          });
        }
        for (const task of automationsByDay.get(date) ?? []) {
          const start = minutesOf(task.scheduledAt, zone);
          if (start === null) continue;
          items.push({
            key: task.id,
            kind: 'auto',
            start,
            end: start + 20,
            title: task.title,
            time: label(start),
            ref: { kind: 'auto', id: task.id, data: task },
          });
        }
        items.sort((a, b) => a.start - b.start || a.end - b.end);
        return packLanes(items);
      };

      const hourLabels = [];
      for (let hour = GRID_START; hour < GRID_END; hour += 1) hourLabels.push(hour);

      return h(
        'div',
        { className: 'org-gridwrap' },
        h(
          'div',
          { className: 'org-ghead' },
          h('div', { className: 'gut' }),
          ...days.map((date) =>
            h(
              'button',
              { type: 'button', key: date, className: `org-gday${date === today ? ' today' : ''}`, onClick: () => onPickDay(date) },
              h('span', { className: 'nm' }, new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', weekday: 'short' }).format(new Date(`${date}T12:00:00Z`))),
              h('span', { className: 'nu' }, String(Number(date.slice(8, 10)))),
            ),
          ),
        ),
        h(
          'div',
          { className: 'org-gall' },
          h('div', { className: 'gut' }, t('allDayLabel')),
          ...days.map((date) =>
            h(
              'div',
              { className: 'org-adcol', key: `ad-${date}` },
              ...allDay(date).map((item) =>
                h(
                  'span',
                  { className: `org-chip ${item.kind}`, key: item.key, style: item.color ? { '--org-ev': item.color } : undefined, title: item.title },
                  item.title,
                ),
              ),
            ),
          ),
        ),
        h(
          'div',
          { className: 'org-gbody' },
          h(
            'div',
            { className: 'org-hgut' },
            ...hourLabels.map((hour) => h('span', { key: hour, style: { top: `${topFor(hour * 60) + 1}px` } }, `${String(hour).padStart(2, '0')}:00`)),
          ),
          ...days.map((date) => {
            const { placed, lanes } = timed(date);
            const width = 100 / lanes;
            return h(
              'div',
              {
                className: `org-gcol${date === today ? ' today' : ''}`,
                key: `col-${date}`,
                onClick: (event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const offset = event.clientY - rect.top;
                  const raw = GRID_START * 60 + Math.round((offset / GRID_HOUR) * 4) * 15;
                  const minutes = Math.max(GRID_START * 60, Math.min(GRID_END * 60 - 15, raw));
                  onSlot(date, label(minutes));
                },
              },
              ...placed.map((block) => {
                const style = {
                  top: `${topFor(block.start) + 2}px`,
                  height: `${Math.max(18, topFor(block.end) - topFor(block.start) - 4)}px`,
                  left: `calc(${block.lane * width}% + 2px)`,
                  width: `calc(${width}% - 4px)`,
                };
                if (block.color) style['--org-ev'] = block.color;
                const chosen = selected && selected.kind === block.kind && selected.id === block.ref.id;
                const compact = topFor(block.end) - topFor(block.start) < 34;
                return h(
                  'button',
                  {
                    type: 'button',
                    key: block.key,
                    className: `org-block ${block.kind}${block.done ? ' done' : ''}${chosen ? ' sel' : ''}`,
                    style,
                    title: `${block.time} ${block.title}`,
                    onClick: (event) => {
                      event.stopPropagation();
                      onSelect(block.ref);
                    },
                  },
                  compact ? null : h('span', { className: 'bt' }, block.time),
                  h('span', { className: 'bn' }, block.title),
                );
              }),
              date === today && nowMin !== null && nowMin >= GRID_START * 60 && nowMin < GRID_END * 60
                ? h('div', { className: 'org-nowline', style: { top: `${topFor(nowMin)}px` } }, h('i'), h('span', null, label(nowMin)))
                : null,
            );
          }),
        ),
      );
    }

    function DetailCard({ item, t, zone, onClose, onToggle, onDelete }) {
      const [confirming, setConfirming] = useState(false);
      useEffect(() => {
        if (!confirming) return undefined;
        const timer = setTimeout(() => setConfirming(false), 4000);
        return () => clearTimeout(timer);
      }, [confirming]);
      if (!item) return null;
      const data = item.data ?? {};
      const done = item.kind === 'plan' && data.status === 'done';
      const color = item.kind === 'event' ? calendarColor(data.calendar) : undefined;
      const style = color ? { '--org-ev': color } : undefined;
      let when = '';
      if (item.kind === 'event') {
        const day = eventDay({ start: data.start, allDay: data.allDay }, zone);
        const start = data.allDay ? t('allDayLabel') : clock(data.start, zone);
        const end = data.allDay || !data.end ? '' : ` – ${clock(data.end, zone)}`;
        when = `${day ? dayShort(day) : ''} · ${start}${end}`;
      } else if (item.kind === 'plan') {
        when = `${data.date ? dayShort(data.date) : ''} · ${data.time ?? t('allDayLabel')}`;
      } else {
        const day = data.scheduledAt ? eventDay({ start: data.scheduledAt }, zone) : null;
        when = `${day ? dayShort(day) : ''} · ${data.scheduledAt ? clock(data.scheduledAt, zone) : ''}`;
      }
      return h(
        'div',
        { className: 'org-dcard', style },
        h(
          'div',
          { className: 'org-dkind' },
          h('span', null, item.kind === 'event' ? t('calendar') : item.kind === 'plan' ? t('plans') : t('automations')),
          h('button', { type: 'button', className: 'org-dclose', onClick: onClose, 'aria-label': t('dismiss') }, '✕'),
        ),
        h('h2', { className: done ? 'struck' : undefined }, data.title ?? ''),
        h('div', { className: 'org-dwhen' }, when),
        item.kind === 'plan' && data.status && data.status !== 'open' ? h('div', { className: 'org-drow' }, h('span', { className: 'k' }, 'Status'), h('span', null, data.status)) : null,
        item.kind === 'event' && data.calendar ? h('div', { className: 'org-drow' }, h('span', { className: 'k' }, t('calendar')), h('span', null, data.calendar)) : null,
        item.kind === 'event' && data.location ? h('div', { className: 'org-drow' }, h('span', { className: 'k' }, 'Where'), h('span', null, data.location)) : null,
        item.kind === 'auto' ? h('div', { className: 'org-drow' }, h('span', { className: 'k' }, t('nextRun')), h('span', null, data.recurrence ?? '')) : null,
        item.kind === 'auto' ? h('p', { className: 'org-muted' }, t('manageInAutomation')) : null,
        h(
          'div',
          { className: 'org-dactions' },
          item.kind === 'plan'
            ? h('button', { type: 'button', className: 'org-btn', onClick: () => onToggle(data) }, done ? t('reopen') : t('markDone'))
            : null,
          item.kind === 'event'
            ? h('p', { className: 'org-muted' }, t('connectToEdit'))
            : h(
                'button',
                {
                  type: 'button',
                  className: `org-trash${confirming ? ' armed' : ''}`,
                  title: confirming ? t('confirmDelete') : t('delete'),
                  'aria-label': confirming ? t('confirmDelete') : t('delete'),
                  onClick: () => {
                    if (!confirming) {
                      setConfirming(true);
                      return;
                    }
                    onDelete(item);
                  },
                },
                h(
                  'svg',
                  { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, 'aria-hidden': 'true' },
                  h('path', { d: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.6 4.5l.6 8.1h5.6l.6-8.1' }),
                  h('path', { d: 'M6.8 6.8v3.6M9.2 6.8v3.6', strokeLinecap: 'round' }),
                ),
                confirming ? h('span', null, t('confirmDelete')) : null,
              ),
        ),
      );
    }

    function NoteCard({ value, onChange, state, t, heading }) {
      return h(
        'div',
        { className: 'org-note-wide' },
        heading ? h('h4', null, heading) : null,
        h('textarea', { value, placeholder: t('noNoteYet'), onChange: (event) => onChange(event.target.value) }),
        h(
          'div',
          { className: 'org-notefoot' },
          h(
            'span',
            { className: `state${state === 'error' ? ' error' : ''}` },
            state === 'saving' ? t('saving') : state === 'error' ? t('saveFailed') : state === 'saved' ? t('saved') : '',
          ),
          h('span', null, t('onePerDay')),
        ),
      );
    }

    function OrganiserPage({ t }) {
      const [view, setView] = useState('day');
      const [today, setToday] = useState(null);
      const [zone, setZone] = useState(null);
      const [selected, setSelected] = useState(null);
      const [cursor, setCursor] = useState(null);
      const [data, setData] = useState({
        plans: [],
        events: [],
        notes: [],
        automations: [],
        automationsAvailable: true,
        automationError: null,
        calendar: { connected: false, error: null },
      });
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
      const [remind, setRemind] = useState(false);
      const [lead, setLead] = useState(10);
      const [autoOpen, setAutoOpen] = useState(false);
      const [autoTitle, setAutoTitle] = useState('');
      const [autoInstruction, setAutoInstruction] = useState('');
      const [autoTime, setAutoTime] = useState('09:00');
      const [autoRepeat, setAutoRepeat] = useState('once');
      const [toast, setToast] = useState(null);
      const [selectedItem, setSelectedItem] = useState(null);
      const [tick, setTick] = useState(0);

      const week = useMemo(() => (selected ? weekOf(selected) : []), [selected]);
      const range = useMemo(() => {
        if (!selected) return null;
        if (view !== 'day' && cursor) {
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
            setData((d) => ({ ...d, notes: payload.notes, calendar: payload.calendar, automations: payload.automations ?? d.automations, automationsAvailable: payload.automationsAvailable !== false }));
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
        call(`api/organiser?from=${rangeFrom}&to=${rangeTo}&status=all`)
          .then((payload) => {
            if (!alive) return;
            setZone(payload.zone);
            setToday(payload.today);
            setData((d) => ({ ...d, plans: (payload.plans ?? []).filter((plan) => plan.status !== 'dropped'), events: payload.events, notes: payload.notes, automations: payload.automations ?? [], automationsAvailable: payload.automationsAvailable !== false, calendar: payload.calendar }));
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
      const automationsByDay = useMemo(
        () => groupByDay(data.automations, (task) => eventDay({ start: task.scheduledAt }, zone)),
        [data.automations, zone],
      );
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

      const pickDay = useCallback((date) => {
        setSelected(date);
        setDraft(null);
        setDraftDate(date);
        setNoteState('idle');
        setSelectedItem(null);
      }, []);

      /* A click on an empty slot opens the day with the plan form filled in. */
      const slotClick = useCallback((date, time) => {
        setSelected(date);
        setDraft(null);
        setDraftDate(date);
        setNewTime(time);
        setAdding(true);
        setAutoOpen(false);
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

      const setPlanState = useCallback(
        async (id, action) => {
          setBusy(true);
          try {
            const payload = await post('api/organiser/plan', { action, id });
            setData((d) => ({ ...d, plans: d.plans.map((plan) => (plan.id === id ? payload.plan : plan)) }));
          } catch (cause) {
            setToast(`${t('saveFailed')}: ${cause.message}`);
          } finally {
            setBusy(false);
          }
        },
        [t],
      );

      const togglePlan = useCallback(
        (plan) => setPlanState(plan.id, plan.status === 'done' ? 'open' : 'done'),
        [setPlanState],
      );

      const deleteItem = useCallback(
        async (item) => {
          if (!item) return;
          try {
            if (item.kind === 'plan') {
              await post('api/organiser/plan', { action: 'delete', id: item.id });
              setData((d) => ({ ...d, plans: d.plans.filter((plan) => plan.id !== item.id) }));
            } else if (item.kind === 'auto') {
              await post('api/organiser/automation', { action: 'delete', id: item.id });
              setReloadKey((key) => key + 1);
            } else {
              setToast(t('connectToEdit'));
              return;
            }
            setSelectedItem(null);
            setToast(t('deleted'));
          } catch (cause) {
            setToast(`${t('deleteFailed')}: ${cause.message}`);
          }
        },
        [t],
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
            /* The reminder is a separate Schedule task: the plan stays local, the
               message is delivered by the Host into a new conversation. */
            if (remind && newTime) {
              try {
                await post('api/organiser/reminder', {
                  title,
                  date: selected,
                  time: newTime,
                  leadMinutes: lead,
                  timeZone: zone,
                });
                setToast(t('reminderSet'));
              } catch (cause) {
                setToast(`${t('scheduleFailed')}: ${cause.message}`);
              }
            } else {
              setToast(t('planSaved'));
            }
            setNewTitle('');
            setNewTime('');
            setRemind(false);
            setAdding(false);
          } catch (cause) {
            setError(cause.message);
          } finally {
            setBusy(false);
          }
        },
        [newTitle, newTime, selected, remind, lead, zone, t],
      );

      const submitAutomation = useCallback(
        async (event) => {
          event.preventDefault();
          const title = autoTitle.trim();
          const instruction = autoInstruction.trim();
          if (!title || !instruction || !selected) return;
          setBusy(true);
          try {
            await post('api/organiser/automation', {
              title,
              instruction,
              date: selected,
              time: autoTime,
              repeat: autoRepeat,
              timeZone: zone,
            });
            setAutoTitle('');
            setAutoInstruction('');
            setAutoRepeat('once');
            setAutoOpen(false);
            setToast(t('automationCreated'));
            setReloadKey((key) => key + 1);
          } catch (cause) {
            setToast(`${t('scheduleFailed')}: ${cause.message}`);
          } finally {
            setBusy(false);
          }
        },
        [autoTitle, autoInstruction, autoTime, autoRepeat, selected, zone, t],
      );

      /* A toast is a receipt, not a state: it clears itself. */
      useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
      }, [toast]);

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
            setData((d) => ({ ...d, notes: payload.notes, calendar: payload.calendar, automations: payload.automations ?? d.automations, automationsAvailable: payload.automationsAvailable !== false }));
            setStatus('ready');
          })
          .catch((cause) => {
            setStatus('error');
            setError(cause.message);
          });
      }, []);

      /* The now line and the "up next" reading follow the clock once a minute. */
      useEffect(() => {
        const timer = setInterval(() => setTick((value) => value + 1), 60000);
        return () => clearInterval(timer);
      }, []);
      const nowMin = useMemo(() => minutesOf(new Date().toISOString(), zone), [zone, tick]);

      /* The rail: every note, newest day first, inbox after. */
      const railNotes = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return needle ? data.notes.filter((note) => note.body.toLowerCase().includes(needle)) : data.notes;
      }, [data.notes, query]);
      const datedNotes = railNotes.filter((note) => note.date);
      const inboxNotes = railNotes.filter((note) => !note.date);

      const dayEvents = selected ? (eventsByDay.get(selected) ?? []) : [];
      const dayPlans = selected ? (plansByDay.get(selected) ?? []) : [];
      const dayAutomations = selected ? (automationsByDay.get(selected) ?? []) : [];

      const later = useMemo(() => {
        if (!selected) return [];
        const rows = [];
        for (let step = 1; step <= 3; step += 1) {
          const date = addDays(selected, step);
          const events = (eventsByDay.get(date) ?? []).slice().sort((a, b) => String(a.start).localeCompare(String(b.start)));
          const plans = plansByDay.get(date) ?? [];
          const items = [
            ...events.map((event) => ({ kind: 'event', time: event.allDay ? 'all day' : clock(event.start, zone), title: event.title, calendar: event.calendar })),
            ...plans.filter((plan) => plan.status === 'open').map((plan) => ({ kind: 'plan', time: plan.time ?? 'no time', title: plan.title, id: plan.id })),
          ];
          if (items.length) rows.push({ date, items });
        }
        return rows;
      }, [selected, eventsByDay, plansByDay, zone]);

      /* The detail panel follows the live row, so Done/Reopen show the new state. */
      const detailItem = useMemo(() => {
        if (!selectedItem) return null;
        if (selectedItem.kind === 'plan') {
          const current = data.plans.find((plan) => plan.id === selectedItem.id);
          if (current) return { ...selectedItem, data: current };
        }
        return selectedItem;
      }, [selectedItem, data.plans]);

      const monthMarks = useMemo(() => {
        const marks = new Map();
        if (!cursor) return marks;
        for (const cell of monthCells(cursor)) {
          const count =
            (eventsByDay.get(cell.date)?.length ?? 0) +
            (plansByDay.get(cell.date)?.length ?? 0) +
            (automationsByDay.get(cell.date)?.length ?? 0);
          if (count) marks.set(cell.date, count);
        }
        return marks;
      }, [cursor, eventsByDay, plansByDay, automationsByDay]);

      const upNext = useMemo(() => {
        if (!selected) return [];
        const from = today && today > selected ? today : selected;
        const items = [];
        for (let step = 0; step <= 7; step += 1) {
          const date = addDays(from, step);
          for (const event of eventsByDay.get(date) ?? []) {
            items.push({
              key: `e-${event.id ?? event.start}`,
              kind: 'event',
              at: date,
              start: minutesOf(event.start, zone) ?? 0,
              when: `${dayShort(date)} · ${event.allDay ? t('allDayLabel') : clock(event.start, zone)}`,
              title: event.title,
              ref: { kind: 'event', id: event.id, data: event },
            });
          }
          for (const plan of plansByDay.get(date) ?? []) {
            if (plan.status !== 'open') continue;
            const [hour, minute] = (plan.time ?? '00:00').split(':').map(Number);
            items.push({
              key: `p-${plan.id}`,
              kind: 'plan',
              at: date,
              start: plan.time ? hour * 60 + minute : 0,
              when: `${dayShort(date)} · ${plan.time ?? t('allDayLabel')}`,
              title: plan.title,
              ref: { kind: 'plan', id: plan.id, data: plan },
            });
          }
          for (const task of automationsByDay.get(date) ?? []) {
            items.push({
              key: `a-${task.id}`,
              kind: 'auto',
              at: date,
              start: minutesOf(task.scheduledAt, zone) ?? 0,
              when: `${dayShort(date)} · ${clock(task.scheduledAt, zone)} ↻`,
              title: task.title,
              ref: { kind: 'auto', id: task.id, data: task },
            });
          }
        }
        items.sort((a, b) => (a.at === b.at ? a.start - b.start : a.at < b.at ? -1 : 1));
        return items.slice(0, 5);
      }, [selected, today, eventsByDay, plansByDay, automationsByDay, zone, t]);

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
              h('button', { type: 'button', 'aria-pressed': view === 'week', onClick: () => setView('week') }, t('week')),
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

        toast ? h('div', { className: 'org-toast', role: 'status' }, toast) : null,

        view === 'week' && cursor
          ? h(
              'div',
              { className: 'org-week' },
              h(
                'aside',
                { className: 'org-side' },
                h(MiniMonth, { cursor, today, selected, marks: monthMarks, onPick: pickDay, t }),
                h(UpNext, { items: upNext, t, onSelect: setSelectedItem }),
              ),
              h(WeekGrid, {
                days: week,
                zone,
                today,
                nowMin,
                t,
                eventsByDay,
                plansByDay,
                automationsByDay,
                selected: selectedItem,
                onPickDay: pickDay,
                onSlot: slotClick,
                onSelect: setSelectedItem,
              }),
              h(
                'aside',
                { className: 'org-detail' },
                detailItem
                  ? h(DetailCard, {
                  key: `${detailItem.kind}:${detailItem.id}`,
                  item: detailItem,
                  t,
                  zone,
                  onClose: () => setSelectedItem(null),
                  onToggle: togglePlan,
                  onDelete: deleteItem,
                })
                  : null,
                h(NoteCard, {
                  value: noteBody,
                  state: noteState,
                  t,
                  heading: `${t('dayNote')} · ${selected ? dayShort(selected) : ''}`,
                  onChange: (value) => {
                    setDraftDate(selected);
                    setDraft(value);
                    setNoteState('idle');
                  },
                }),
              ),
            )
          : view === 'month' && cursor
          ? h(MonthView, {
              cursor,
              today,
              zone,
              t,
              eventsByDay,
              plansByDay,
              automationsByDay,
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
                    ? dayPlans.map((plan) => h(PlanRow, { key: plan.id, plan, onToggle: togglePlan, t }))
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
                        h(
                          'label',
                          { className: 'org-remind' },
                          h('input', {
                            type: 'checkbox',
                            checked: remind,
                            disabled: !newTime,
                            onChange: (event) => setRemind(event.target.checked),
                          }),
                          t('remindMe'),
                          h(
                            'select',
                            {
                              className: 'org-select',
                              value: String(lead),
                              disabled: !remind || !newTime,
                              'aria-label': t('remindMe'),
                              onChange: (event) => setLead(Number(event.target.value)),
                            },
                            h('option', { value: '0' }, t('atTheTime')),
                            h('option', { value: '10' }, `10 ${t('minutesBefore')}`),
                            h('option', { value: '30' }, `30 ${t('minutesBefore')}`),
                            h('option', { value: '60' }, `60 ${t('minutesBefore')}`),
                          ),
                        ),
                        h('button', { type: 'submit', className: 'org-primary', disabled: busy || !newTitle.trim() }, t('add')),
                        h('button', { type: 'button', className: 'org-dashed', onClick: () => { setAdding(false); setNewTitle(''); setNewTime(''); } }, t('cancel')),
                      )
                    : h('button', { type: 'button', className: 'org-dashed', onClick: () => setAdding(true) }, `+ ${t('addPlan')}`),
                ),

                h(
                  'section',
                  { className: 'org-band' },
                  h('h3', null, t('automations'), h('span', { className: 'meta' }, String(dayAutomations.length))),
                  ...(dayAutomations.length
                    ? dayAutomations.map((task) =>
                        h(
                          'div',
                          { className: 'org-auto', key: task.id },
                          h('span', { className: 'glyph' }, '↻'),
                          h('span', { className: 'org-mono' }, clock(task.scheduledAt, zone) || '—'),
                          h('span', { className: 'title', title: task.title }, task.title),
                          h('span', { className: 'when' }, task.recurrence),
                        ),
                      )
                    : autoOpen
                      ? []
                      : [h('p', { className: 'org-muted' }, data.automationsAvailable === false ? t('automationUnavailable') : t('automationEmpty'))]),
                  autoOpen
                    ? h(
                        'form',
                        { className: 'org-form', onSubmit: submitAutomation },
                        h('input', {
                          className: 'org-input',
                          value: autoTitle,
                          placeholder: t('automationName'),
                          autoFocus: true,
                          onChange: (event) => setAutoTitle(event.target.value),
                        }),
                        h('input', {
                          className: 'org-input',
                          value: autoInstruction,
                          placeholder: t('automationInstruction'),
                          onChange: (event) => setAutoInstruction(event.target.value),
                        }),
                        h(
                          'div',
                          { className: 'org-formrow' },
                          h('input', {
                            className: 'org-input org-timeinput',
                            type: 'time',
                            value: autoTime,
                            'aria-label': t('timePlaceholder'),
                            onChange: (event) => setAutoTime(event.target.value),
                          }),
                          h(
                            'select',
                            {
                              className: 'org-select',
                              value: autoRepeat,
                              'aria-label': t('repeat'),
                              onChange: (event) => setAutoRepeat(event.target.value),
                            },
                            h('option', { value: 'once' }, t('once')),
                            h('option', { value: 'daily' }, t('daily')),
                            h('option', { value: 'weekdays' }, t('weekdays')),
                            h('option', { value: 'weekly' }, t('weekly')),
                          ),
                          h('button', { type: 'submit', className: 'org-primary', disabled: busy || !autoTitle.trim() || !autoInstruction.trim() }, t('add')),
                          h('button', { type: 'button', className: 'org-dashed', onClick: () => { setAutoOpen(false); setAutoTitle(''); setAutoInstruction(''); } }, t('cancel')),
                        ),
                        h('p', { className: 'org-hint' }, t('automationHint')),
                      )
                    : h('button', { type: 'button', className: 'org-dashed', onClick: () => setAutoOpen(true) }, `+ ${t('newAutomation')}`),
                ),

                h(
                  'section',
                  { className: 'org-band' },
                  h('h3', null, `${t('note')}${selected ? ` · ${dayShort(selected)}` : ''}`),
                  h(NoteCard, {
                    value: noteBody,
                    state: noteState,
                    t,
                    onChange: (value) => {
                      setDraftDate(selected);
                      setDraft(value);
                      setNoteState('idle');
                    },
                  }),
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
        calendarColor,
        minutesOf,
        packLanes,
        weekNumber,
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
