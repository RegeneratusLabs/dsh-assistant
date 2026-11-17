/**
 * The tools: one read, two writes, all against the same store the page uses.
 *
 * Two sources on purpose, and the tools keep them visibly apart:
 *
 *  - **Calendar** — commitments, read from the connected provider. Never stored
 *    here, never edited here.
 *  - **Plans** — intentions that are not commitments yet, kept in this store. A
 *    plan is promoted into an event; it is never copied beside one.
 *  - **Notes** — what the user wrote down. One per day, plus an inbox.
 *
 * Because a plan can become an event, an agenda that quietly merged the two
 * would show the same thing twice or show the stale half. So the text result
 * prints two named bands, and the descriptions say which is which.
 *
 * The model is told not to invent: a plan carries only what the user said. A
 * missing time stays missing rather than becoming 09:00.
 */
import { OrganiserError } from './store.js';
import { addDays, clockIn, dateOf, dayLabel, daysBetween, isDate, todayIn } from './time.js';

function textResult(text) {
  return [{ type: 'text', text }];
}

const output = {
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: { message: { type: 'string' } },
    required: ['message'],
  },
  render: (_args, value) => textResult(value.message),
};

/** Keep a result small enough to read: a wide range is a request to narrow it. */
const MAX_ENTRIES = 40;
const MAX_SPAN_DAYS = 62;
const MAX_NOTE_LINES = 50;

/** A plan as one line, with its id so the next tool call can name it. */
export function planLine(plan) {
  const time = plan.time ?? 'no time';
  const status = plan.status === 'open' ? '' : ` (${plan.status})`;
  return `${time} — ${plan.title}  [${plan.id}${status}]`;
}

/** A note as one line: its day (or inbox), its id, and the first line of what was written. */
export function noteLine(note) {
  const day = note.date ? dayLabel(note.date) : 'inbox';
  const first = String(note.body ?? '').split('\n').find((line) => line.trim()) ?? '';
  const text = first.trim().length > 90 ? `${first.trim().slice(0, 89)}…` : first.trim();
  return `${day}  ${note.id}  ${text}`;
}

/**
 * Group entries under a day heading.
 * @param {Array<{day: string, line: string}>} entries - already sorted.
 */
function byDay(entries) {
  const lines = [];
  let day = null;
  for (const entry of entries) {
    if (entry.day !== day) {
      day = entry.day;
      lines.push(`  ${dayLabel(day)}`);
    }
    lines.push(`    ${entry.line}`);
  }
  return lines;
}

/** One event as a line in the calendar band. */
function eventLine(event, zone) {
  const title = typeof event?.title === 'string' && event.title.trim() ? event.title.trim() : '(untitled event)';
  const label = event.allDay ? 'all day' : (eventLabel(event, zone) ?? 'time unknown');
  const calendar = typeof event.calendar === 'string' && event.calendar.trim() ? `  [${event.calendar.trim()}]` : '';
  return `${label} — ${title}${calendar}`;
}

/** `09:30–10:00`, or `09:30` when the provider gave no end. */
function eventLabel(event, zone) {
  const start = clockIn(event.start, zone);
  if (!start) return null;
  const end = event.end ? clockIn(event.end, zone) : null;
  return end && end !== start ? `${start}–${end}` : start;
}

/** The day an event belongs to, in the user's zone; all-day events are already dates. */
function eventDay(event, zone) {
  if (event.allDay) return isDate(event.start) ? event.start : null;
  return dateOf(event.start, zone);
}

/**
 * Render the two bands.
 *
 * Calendar first: a commitment outranks an intention. Each band states its own
 * emptiness, so "nothing planned" is never ambiguous with "the calendar is not
 * connected" — those are different answers and the user acts differently.
 */
export function renderAgenda({ from, to, zone, plans, events, calendarNote }) {
  const lines = [`Agenda ${from} to ${to} (${zone})`, ''];

  const sortedEvents = events
    .map((event) => ({ event, day: eventDay(event, zone) }))
    .filter((entry) => entry.day && entry.day >= from && entry.day <= to)
    .sort((a, b) => (a.day === b.day ? String(a.event.start).localeCompare(String(b.event.start)) : a.day.localeCompare(b.day)));
  if (calendarNote) {
    lines.push(`Calendar: ${calendarNote}`);
  } else if (!sortedEvents.length) {
    lines.push('Calendar: nothing in this range.');
  } else {
    lines.push(`Calendar (${sortedEvents.length})`);
    lines.push(...byDay(sortedEvents.map((entry) => ({ day: entry.day, line: eventLine(entry.event, zone) }))));
  }

  lines.push('');
  if (!plans.length) {
    lines.push('Plans: none in this range.');
  } else {
    lines.push(`Plans (${plans.length})`);
    lines.push(...byDay(plans.map((plan) => ({ day: plan.date, line: planLine(plan) }))));
  }
  return lines.join('\n');
}

/**
 * Render a note list. `scope` is the header, so search and range read honestly.
 */
export function renderNotes({ scope, notes }) {
  if (!notes.length) return `${scope}: none.`;
  const lines = [`${scope} (${notes.length})`];
  for (const note of notes.slice(0, MAX_NOTE_LINES)) lines.push(noteLine(note));
  if (notes.length > MAX_NOTE_LINES) lines.push(`+${notes.length - MAX_NOTE_LINES} more — narrow the range or the search.`);
  return lines.join('\n');
}

/**
 * Build the three tools.
 * @param {{ store: object, zone: string, provider?: { id: string, agenda: Function } | null }} context
 * @returns the tool definitions.
 */
export function buildTools({ store, zone, provider = null }) {
  const agenda = {
    name: 'organiser_agenda',
    description:
      "Read the user's agenda: plans they have kept, and events on their connected calendar, for a date range. Call this whenever they ask what is on, what is planned today or this week, or whether anything they planned needs to change — including when the weather turns and they ask what is affected. Do not answer from memory. 'Plans' are their own intentions; 'Calendar' is commitments from the connected calendar. This does not include what they wrote down — reads those with organiser_note. Dates are YYYY-MM-DD in the user's zone; omit both to read today and the next six days.",
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        from: { type: 'string', description: 'First day, YYYY-MM-DD. Defaults to today.' },
        to: { type: 'string', description: 'Last day, inclusive, YYYY-MM-DD. Defaults to six days after from.' },
        status: {
          type: 'string',
          enum: ['open', 'all'],
          description: "Which plans to include: 'open' (default) or 'all' to include finished and dropped ones.",
        },
      },
    },
    output,
    async execute(args, exec) {
      try {
        const raw = args && typeof args === 'object' ? args : {};
        const from = raw.from === undefined ? todayIn(zone) : raw.from;
        if (!isDate(from)) return { message: `Not read: "${String(raw.from)}" is not a date (YYYY-MM-DD).` };
        const to = raw.to === undefined ? addDays(from, 6) : raw.to;
        if (!isDate(to)) return { message: `Not read: "${String(raw.to)}" is not a date (YYYY-MM-DD).` };
        const span = daysBetween(from, to);
        if (span < 0) return { message: 'Not read: the end date is before the start date.' };
        if (span > MAX_SPAN_DAYS) return { message: `Not read: that is ${span} days; ask for ${MAX_SPAN_DAYS} or fewer.` };

        const status = raw.status === 'all' ? 'all' : 'open';
        const plans = store.listPlans({ from, to, status });

        let events = [];
        let calendarNote = null;
        if (provider) {
          const read = await provider.agenda({ from, to, signal: exec?.signal });
          if (read?.error) calendarNote = `unavailable right now (${read.error}).`;
          else if (read?.connected === false) calendarNote = 'no calendar connected.';
          else events = Array.isArray(read?.events) ? read.events : [];
        } else {
          calendarNote = 'no calendar connected.';
        }

        const kept = Math.max(0, MAX_ENTRIES - Math.min(plans.length, MAX_ENTRIES));
        const shownPlans = plans.slice(0, MAX_ENTRIES);
        const shownEvents = events.slice(0, kept);
        const dropped = plans.length - shownPlans.length + Math.max(0, events.length - shownEvents.length);

        let message = renderAgenda({ from, to, zone, plans: shownPlans, events: shownEvents, calendarNote });
        if (dropped > 0) message += `\n\n+${dropped} more not shown — narrow the range.`;
        return { message };
      } catch (error) {
        if (error instanceof OrganiserError) return { message: `Not read: ${error.message}` };
        return { message: `Not read: ${String(error?.message ?? error)}` };
      }
    },
  };

  const plan = {
    name: 'organiser_plan',
    description:
      "Keep, change, finish or drop a plan — something the user intends to do that is not on their calendar yet. Record only what they actually said: never invent a date or a time, and leave the time empty when they gave none. Use action 'add' with a date and title, 'update' with an id to correct it, 'done' or 'drop' when it is finished or abandoned. This does not write to the connected calendar; events are made from the organiser page.",
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        action: { type: 'string', enum: ['add', 'update', 'done', 'drop'], description: 'What to do with the plan.' },
        id: { type: 'string', description: 'The plan id, for update/done/drop.' },
        date: { type: 'string', description: 'The day, YYYY-MM-DD.' },
        time: { type: 'string', description: 'Optional local time, HH:MM (24-hour). An empty string clears it.' },
        title: { type: 'string', description: "What the plan is, in the user's words." },
        notes: { type: 'string', description: 'Anything they added. An empty string clears it.' },
      },
      required: ['action'],
    },
    output,
    async execute(args) {
      const raw = args && typeof args === 'object' ? args : {};
      try {
        if (raw.action === 'add') {
          const saved = store.addPlan({ date: raw.date, time: raw.time, title: raw.title, notes: raw.notes });
          return { message: `Saved ${saved.id}: ${saved.date} ${planLine(saved)}` };
        }
        if (raw.action === 'update') {
          const patch = {};
          for (const key of ['date', 'time', 'title', 'notes']) {
            if (Object.prototype.hasOwnProperty.call(raw, key)) patch[key] = raw[key];
          }
          if (!Object.keys(patch).length) return { message: 'Not saved: update needs at least one of date, time, title or notes.' };
          const saved = store.updatePlan(raw.id, patch);
          return { message: `Updated ${saved.id}: ${saved.date} ${planLine(saved)}` };
        }
        if (raw.action === 'done' || raw.action === 'drop') {
          const saved = store.setPlanStatus(raw.id, raw.action === 'done' ? 'done' : 'dropped');
          return { message: `${saved.id} ${saved.status}: ${saved.date} ${planLine(saved)}` };
        }
        return { message: `Not saved: "${String(raw.action)}" is not add, update, done or drop.` };
      } catch (error) {
        if (error instanceof OrganiserError) return { message: `Not saved: ${error.message}` };
        return { message: `Not saved: ${String(error?.message ?? error)}` };
      }
    },
  };

  const note = {
    name: 'organiser_note',
    description:
      "Keep what the user wrote down — a phone call, a part number, what happened today — or read it back. Pass a date when the note belongs to a day (a day holds one note; adding to it appends a paragraph, so nothing already written is lost). Leave the date out for a note with no day, which goes to the inbox. Use 'list' to read notes back: a range, a search word, or both. 'update' replaces one note's text, 'delete' withdraws it. Record only what the user actually said.",
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        action: { type: 'string', enum: ['add', 'update', 'list', 'delete'], description: 'What to do with notes.' },
        id: { type: 'string', description: 'The note id, for update/delete.' },
        date: { type: 'string', description: 'The day it belongs to, YYYY-MM-DD. Omit for the inbox; an empty string also clears it on update.' },
        body: { type: 'string', description: "The note's text, in the user's words." },
        q: { type: 'string', description: 'For list: a word or phrase to search for.' },
        from: { type: 'string', description: 'For list: first day, YYYY-MM-DD.' },
        to: { type: 'string', description: 'For list: last day, inclusive, YYYY-MM-DD.' },
      },
      required: ['action'],
    },
    output,
    async execute(args) {
      const raw = args && typeof args === 'object' ? args : {};
      try {
        if (raw.action === 'add') {
          const { note: saved, appended } = store.addNote({ date: raw.date, body: raw.body });
          const where = saved.date ? `for ${saved.date}` : 'in the inbox';
          return { message: `${appended ? 'Added to' : 'Saved'} ${saved.id} ${where}.` };
        }
        if (raw.action === 'update') {
          const patch = {};
          if (Object.prototype.hasOwnProperty.call(raw, 'body')) patch.body = raw.body;
          if (Object.prototype.hasOwnProperty.call(raw, 'date')) patch.date = raw.date;
          if (!Object.keys(patch).length) return { message: 'Not saved: update needs a body or a date.' };
          const saved = store.updateNote(raw.id, patch);
          return { message: `Updated ${saved.id}${saved.date ? ` for ${saved.date}` : ' (inbox)'}.` };
        }
        if (raw.action === 'delete') {
          const saved = store.deleteNote(raw.id);
          return { message: `${saved.id} deleted${saved.date ? ` (${saved.date})` : ''}.` };
        }
        if (raw.action === 'list') {
          const from = raw.from === undefined ? undefined : raw.from;
          const to = raw.to === undefined ? undefined : raw.to;
          if ((from !== undefined && !isDate(from)) || (to !== undefined && !isDate(to))) {
            return { message: 'Not read: from and to must be dates (YYYY-MM-DD).' };
          }
          if ((from === undefined) !== (to === undefined)) return { message: 'Not read: give both from and to, or neither.' };
          const needle = typeof raw.q === 'string' && raw.q.trim() ? raw.q.trim() : null;
          const notes = store.listNotes({ from, to, q: needle });
          const scope = needle
            ? `Notes matching "${needle}"`
            : from
              ? `Notes ${from} to ${to}`
              : 'Notes, newest first';
          return { message: renderNotes({ scope, notes }) };
        }
        return { message: `Not saved: "${String(raw.action)}" is not add, update, list or delete.` };
      } catch (error) {
        if (error instanceof OrganiserError) return { message: `Not saved: ${error.message}` };
        return { message: `Not saved: ${String(error?.message ?? error)}` };
      }
    },
  };

  return [agenda, plan, note];
}
