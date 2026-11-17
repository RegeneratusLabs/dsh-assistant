/**
 * The schedule seam: reminders and automations, owned by DSH's Schedule service.
 *
 * A reminder is a one-shot task whose instruction is "tell the user this". An
 * automation is a task that starts a conversation and does the work. Both are
 * delivered by the Host into a conversation — `new_once` creates one at the
 * first delivery and reuses it — which is what makes "send me a chat message"
 * true without an external channel.
 *
 * The organiser never keeps its own timer. If the Schedule service is not
 * composed, the page says so and the rest of the organiser still works; a
 * second reminder loop would be exactly the duplication this plugin avoids.
 */
import { OrganiserError } from './store.js';
import { addDays, isDate, isTime } from './time.js';

const MAX_TITLE = 120;
const MAX_INSTRUCTION = 4000;
const MAX_LEAD_MINUTES = 24 * 60;
const MAX_TASKS = 50;
const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** The Schedule service, or null when this Host does not compose it. */
export function scheduleService(ctx) {
  const service = ctx?.get?.('schedule');
  return service && typeof service.create === 'function' ? service : null;
}

function cleanTitle(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new OrganiserError('a task needs a name', 'missing_title');
  if (text.length > MAX_TITLE) throw new OrganiserError(`the name is longer than ${MAX_TITLE} characters`, 'title_too_long');
  return text;
}

function cleanInstruction(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new OrganiserError('an automation needs an instruction', 'missing_instruction');
  if (text.length > MAX_INSTRUCTION) {
    throw new OrganiserError(`the instruction is longer than ${MAX_INSTRUCTION} characters`, 'instruction_too_long');
  }
  return text;
}

/** The Schedule service wants HH:mm:ss; the page sends HH:MM. */
function scheduleTime(value) {
  if (!isTime(value)) throw new OrganiserError(`not a time: ${String(value)} (expected HH:MM)`, 'invalid_time');
  return `${value}:00`;
}

function cleanZone(value) {
  if (typeof value !== 'string' || !value.trim()) throw new OrganiserError('a time zone is required', 'invalid_zone');
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: value });
    return value;
  } catch {
    throw new OrganiserError(`not a valid IANA time zone: ${value}`, 'invalid_zone');
  }
}

/**
 * Move a local wall time back by `minutes`, carrying into the previous day.
 *
 * Reminders are a local-time idea ("half an hour before"), so this stays in wall
 * time rather than converting to an instant and back: the Schedule service owns
 * the zone conversion. A DST jump can move the real instant by that offset,
 * which is the right trade for a reminder — the wall-clock reading is what the
 * user expects to hear.
 */
export function leadTime(date, time, minutes) {
  if (!isDate(date)) throw new OrganiserError(`not a date: ${String(date)}`, 'invalid_date');
  if (!isTime(time)) throw new OrganiserError(`not a time: ${String(time)}`, 'invalid_time');
  const lead = Math.max(0, Math.min(Math.trunc(Number(minutes) || 0), MAX_LEAD_MINUTES));
  const [hour, minute] = time.split(':').map(Number);
  let total = hour * 60 + minute - lead;
  let day = date;
  while (total < 0) {
    total += 1440;
    day = addDays(day, -1);
  }
  while (total >= 1440) {
    total -= 1440;
    day = addDays(day, 1);
  }
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return { date: day, time: `${hh}:${mm}` };
}

/** What repeats, in the schedule service's own terms. */
function timingFor({ date, time, repeat, zone }) {
  const at = scheduleTime(time);
  switch (repeat) {
    case 'daily':
      return { kind: 'daily', daily: { time: at, time_zone: zone } };
    case 'weekdays':
      return { kind: 'weekly', weekly: { time: at, time_zone: zone, weekdays: [1, 2, 3, 4, 5] } };
    case 'weekly': {
      const weekday = ((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
      return { kind: 'weekly', weekly: { time: at, time_zone: zone, weekdays: [weekday] } };
    }
    case 'once':
    default:
      return { kind: 'at', at: { date, time: at, time_zone: zone } };
  }
}

/** A short, honest recurrence label for the page. */
export function recurrenceLabel(task) {
  switch (task?.kind) {
    case 'at':
    case 'after':
      return 'once';
    case 'every':
      return `every ${Math.max(1, Math.round((Number(task.everySeconds) || 60) / 60))} min`;
    case 'daily':
      return `daily ${String(task.time ?? '').slice(0, 5)}`;
    case 'weekly': {
      const days = (task.weekdays ?? []).map((day) => WEEKDAY_NAMES[day - 1]).filter(Boolean).join(', ');
      return `weekly ${days} ${String(task.time ?? '').slice(0, 5)}`;
    }
    case 'cron':
      return `cron ${task.expression ?? ''}`.trim();
    default:
      return String(task?.kind ?? 'scheduled');
  }
}

/** One task as the page and the agenda read it. Never its prompt. */
export function taskView(task) {
  return {
    id: String(task?.id ?? ''),
    title: String(task?.title ?? '(untitled)'),
    kind: String(task?.kind ?? ''),
    scheduledAt: String(task?.scheduledAt ?? ''),
    timeZone: typeof task?.timeZone === 'string' ? task.timeZone : null,
    status: String(task?.status ?? 'active'),
    recurrence: recurrenceLabel(task),
  };
}

/**
 * Create one task, translating the service's refusal into a 400.
 *
 * The Schedule service rejects a time in the past and an exhausted rule with a
 * message meant for a person; surfacing it as a 500 would blame the Host for the
 * user's input.
 */
async function createTask(service, request) {
  try {
    return await service.create(request);
  } catch (error) {
    throw new OrganiserError(String(error?.message ?? error).slice(0, 300), 'schedule_rejected', 400);
  }
}

/** Active tasks, soonest first. A missing service is an empty list, not an error. */
export async function listAutomations(ctx) {
  const service = scheduleService(ctx);
  if (!service) return { available: false, tasks: [] };
  try {
    const catalog = await service.catalog();
    const tasks = (Array.isArray(catalog) ? catalog : [])
      .filter((task) => task?.status === 'active')
      .slice(0, MAX_TASKS)
      .map(taskView);
    return { available: true, tasks };
  } catch (error) {
    return { available: true, tasks: [], error: String(error?.message ?? error).slice(0, 200) };
  }
}

/**
 * A one-shot "tell the user this" reminder.
 *
 * The prompt is the instruction the reminder conversation receives; the model
 * answers it, and that answer is the chat message the user asked for.
 */
export async function createReminder(ctx, input = {}) {
  const service = scheduleService(ctx);
  if (!service) throw new OrganiserError('the Schedule service is not available on this Host', 'schedule_unavailable', 409);

  const title = cleanTitle(input.title);
  const { date, time } = leadTime(input.date, input.time, input.leadMinutes);
  const zone = cleanZone(input.timeZone);
  const message = typeof input.message === 'string' ? input.message.trim().slice(0, 400) : '';
  const prompt = message
    ? `${message} Reply with one short message; no preamble.`
    : `Remind the user about "${title}". It is due at ${String(input.time).slice(0, 5)}. Reply with one short message; no preamble.`;

  const created = await createTask(service, {
    title,
    prompt,
    timing: { kind: 'at', at: { date, time: scheduleTime(time), time_zone: zone } },
    target: { kind: 'new_once' },
  });
  return taskView(created);
}

/**
 * A task that opens a conversation and does the work.
 *
 * The instruction is the user's own words; the trailing line only tells the new
 * conversation how to report, so a research task comes back as an answer rather
 * than another question.
 */
export async function createAutomation(ctx, input = {}) {
  const service = scheduleService(ctx);
  if (!service) throw new OrganiserError('the Schedule service is not available on this Host', 'schedule_unavailable', 409);

  const title = cleanTitle(input.title);
  const instruction = cleanInstruction(input.instruction);
  const zone = cleanZone(input.timeZone);
  if (!isDate(input.date)) throw new OrganiserError(`not a date: ${String(input.date)}`, 'invalid_date');
  if (!isTime(input.time)) throw new OrganiserError(`not a time: ${String(input.time)}`, 'invalid_time');

  const repeat = ['once', 'daily', 'weekdays', 'weekly'].includes(input.repeat) ? input.repeat : 'once';
  const prompt = `${instruction}\n\nThis task ran on a schedule the user set in their organiser. Carry it out now and report the result in one short message.`;

  const created = await createTask(service, {
    title,
    prompt,
    timing: timingFor({ date: input.date, time: input.time, repeat, zone }),
    target: { kind: 'new_once' },
  });
  return taskView(created);
}
