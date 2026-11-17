/**
 * Dates, times, and the zone "today" is asked in.
 *
 * A plan is a date and an optional local time — the user's own intention, so it
 * carries no offset. An event from a provider is an instant and carries its own.
 * Both are rendered in this one zone, because a day that starts in Brisbane must
 * not be shown as yesterday's UTC day.
 *
 * The zone is the ambient profile's when it has one: that profile is already the
 * authority for "Right now" in the prompt, so using a different clock here would
 * let the assistant disagree with itself. Otherwise the host's system zone.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * A real calendar date in YYYY-MM-DD.
 *
 * ISO parsing already rejects the impossible days (2026-02-30), so the round
 * trip is the whole check. A loose regex would accept a date no calendar has,
 * and every later range comparison would quietly be wrong.
 */
export function isDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value;
}

/** A 24-hour local time, HH:MM. */
export function isTime(value) {
  return typeof value === 'string' && TIME_RE.test(value);
}

/** `date` plus whole days, as YYYY-MM-DD. */
export function addDays(date, days) {
  const start = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(start)) throw new Error(`not a date: ${date}`);
  return new Date(start + days * 86400000).toISOString().slice(0, 10);
}

/** Whole days between two dates; negative when `to` is earlier. */
export function daysBetween(from, to) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error(`not a date: ${from} to ${to}`);
  return Math.round((end - start) / 86400000);
}

/** Whether Intl accepts the zone. A bad zone must never be stored or echoed. */
export function isValidZone(zone) {
  if (typeof zone !== 'string' || !zone.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** Today, as YYYY-MM-DD, in `zone`. */
export function todayIn(zone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** `2026-11-17 (Tue)` — the weekday rendered at UTC noon so no zone can shift it. */
export function dayLabel(date) {
  const weekday = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short' }).format(
    new Date(`${date}T12:00:00Z`),
  );
  return `${date} (${weekday})`;
}

/** A time-of-day label for an instant, in `zone`. */
export function clockIn(iso, zone) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms));
}

/** The YYYY-MM-DD that `iso` falls on in `zone`. */
export function dateOf(iso, zone) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(ms));
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** The ambient profile's zone, read from the shared home. Missing or broken is not an error. */
export function ambientZone(home) {
  try {
    const parsed = JSON.parse(readFileSync(path.join(home, 'ambient', 'profile.json'), 'utf8'));
    return typeof parsed?.timeZone === 'string' ? parsed.timeZone : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The zone this plugin works in.
 *
 * Row config wins (an explicit choice for this deployment), then the ambient
 * profile, then the system, then UTC. The last two are fallbacks of last resort:
 * a zone the plugin picked itself is better than a crash on the first agenda.
 */
export function resolveZone({ configZone, home } = {}) {
  const candidates = [configZone, home ? ambientZone(home) : undefined, Intl.DateTimeFormat().resolvedOptions().timeZone, 'UTC'];
  for (const candidate of candidates) if (isValidZone(candidate)) return candidate;
  return 'UTC';
}
