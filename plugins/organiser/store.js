/**
 * The organiser store: plans and notes in one SQLite file.
 *
 * Plans are the half of the calendar this plugin owns: what the user intends to
 * do that is not a commitment yet — a date, maybe a time, no attendees. Notes
 * are what they wrote down: one per day for the journal, and an inbox for
 * anything without a date.
 *
 * Two rules keep the surface from becoming a scrapbook:
 *
 *  - **A plan is not an event.** When a plan is put on the connected calendar it
 *    is *promoted* — the row keeps the provider's event id and stops appearing
 *    as a plan. It is never copied beside the event, and an event is never
 *    mirrored back into a plan, so every fact has one owner.
 *  - **One note per day.** The day's note is a journal entry; capture appends to
 *    it rather than replacing it, so a second thought cannot erase the first.
 *    Notes without a date are the inbox and may be many.
 *
 * `node:sqlite` keeps the dependency surface at zero, as in the records store.
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

import { isDate, isTime } from './time.js';

/** A store failure with a stable code, so a route or tool can say what went wrong. */
export class OrganiserError extends Error {
  constructor(message, code = 'organiser_error', status = 400) {
    super(message);
    this.name = 'OrganiserError';
    this.code = code;
    this.status = status;
  }
}

const PLAN_STATUSES = ['open', 'done', 'dropped'];
const MAX_TITLE = 200;
const MAX_PLAN_NOTES = 2000;
const MAX_NOTE_BODY = 10000;
const MAX_EVENT_ID = 512;
const DEFAULT_LIST_LIMIT = 200;
const MAX_LIST_LIMIT = 500;

function now() {
  return new Date().toISOString();
}

/** Whether `key` was given at all, so `null` can mean "clear" rather than "leave". */
function given(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function cleanTitle(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new OrganiserError('a plan needs a title', 'missing_title');
  if (text.length > MAX_TITLE) throw new OrganiserError(`the title is longer than ${MAX_TITLE} characters`, 'title_too_long');
  return text;
}

function cleanPlanNotes(value) {
  if (value == null) return null;
  const text = String(value).trim();
  if (text.length > MAX_PLAN_NOTES) throw new OrganiserError(`the notes are longer than ${MAX_PLAN_NOTES} characters`, 'notes_too_long');
  return text || null;
}

function cleanBody(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new OrganiserError('a note needs something in it', 'missing_body');
  if (text.length > MAX_NOTE_BODY) throw new OrganiserError(`the note is longer than ${MAX_NOTE_BODY} characters`, 'note_too_long');
  return text;
}

function cleanDate(value) {
  if (!isDate(value)) throw new OrganiserError(`not a date: ${String(value)} (expected YYYY-MM-DD)`, 'invalid_date');
  return value;
}

function cleanOptionalDate(value) {
  if (value == null || value === '') return null;
  return cleanDate(value);
}

function cleanTime(value) {
  if (value == null || value === '') return null;
  if (!isTime(value)) throw new OrganiserError(`not a time: ${String(value)} (expected HH:MM, 24-hour)`, 'invalid_time');
  return value;
}

function cleanPlanStatus(value) {
  if (!PLAN_STATUSES.includes(value)) throw new OrganiserError(`not a status: ${String(value)}`, 'invalid_status');
  return value;
}

/**
 * Open (or create) the organiser store.
 * @param {string} file - absolute path to the database.
 * @returns the store handle.
 */
export function openStore(file) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id          TEXT PRIMARY KEY,
      date        TEXT NOT NULL,
      time        TEXT,
      title       TEXT NOT NULL,
      notes       TEXT,
      status      TEXT NOT NULL DEFAULT 'open',
      event_id    TEXT,
      event_source TEXT,
      created     TEXT NOT NULL,
      updated     TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS plans_by_date ON plans (date);
    CREATE TABLE IF NOT EXISTS notes (
      id          TEXT PRIMARY KEY,
      date        TEXT,
      body        TEXT NOT NULL,
      created     TEXT NOT NULL,
      updated     TEXT NOT NULL,
      deleted_at  TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS notes_one_per_day ON notes (date) WHERE date IS NOT NULL AND deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS notes_by_date ON notes (date);
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);

  const statements = {
    planInsert: db.prepare(
      'INSERT INTO plans (id, date, time, title, notes, status, event_id, event_source, created, updated) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)',
    ),
    planById: db.prepare('SELECT * FROM plans WHERE id = ?'),
    planList: db.prepare(
      `SELECT * FROM plans
        WHERE event_id IS NULL AND date >= ? AND date <= ? AND (? = 'all' OR status = 'open')
        ORDER BY date, COALESCE(time, '99:99'), id`,
    ),
    noteInsert: db.prepare('INSERT INTO notes (id, date, body, created, updated, deleted_at) VALUES (?, ?, ?, ?, ?, NULL)'),
    noteById: db.prepare('SELECT * FROM notes WHERE id = ?'),
    noteByDate: db.prepare('SELECT * FROM notes WHERE date = ? AND deleted_at IS NULL'),
    noteUpdate: db.prepare('UPDATE notes SET body = ?, updated = ? WHERE id = ?'),
    notePatch: db.prepare('UPDATE notes SET body = ?, date = ?, updated = ? WHERE id = ?'),
    noteDelete: db.prepare('UPDATE notes SET deleted_at = ?, updated = ? WHERE id = ? AND deleted_at IS NULL'),
    noteList: db.prepare(
      `SELECT * FROM notes
        WHERE deleted_at IS NULL
          AND (? IS NULL OR (date IS NOT NULL AND date >= ? AND date <= ?))
          AND (? IS NULL OR body LIKE '%' || ? || '%')
        ORDER BY (date IS NULL), date DESC, updated DESC, rowid DESC
        LIMIT ?`,
    ),
    metaGet: db.prepare('SELECT value FROM meta WHERE key = ?'),
    metaPut: db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),
  };

  /**
   * Allocate the next readable id for a kind.
   *
   * Read and write are one immediate transaction, so two writers cannot take the
   * same number. Ids are never reissued, so a reference in conversation stays
   * meaningful after a plan is dropped or a note deleted.
   */
  function allocateId(prefix, key) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const row = statements.metaGet.get(key);
      const next = (row ? Number(row.value) : 0) + 1;
      if (!Number.isSafeInteger(next) || next < 1) throw new OrganiserError(`${key} is corrupt`, 'store_corrupt', 500);
      statements.metaPut.run(key, String(next));
      db.exec('COMMIT');
      return `${prefix}-${next}`;
    } catch (error) {
      try {
        db.exec('ROLLBACK');
      } catch {
        /* the transaction is already gone; the original error is the one worth keeping */
      }
      throw error;
    }
  }

  function decodePlan(row) {
    if (!row) return null;
    return {
      id: row.id,
      date: row.date,
      time: row.time ?? null,
      title: row.title,
      notes: row.notes ?? null,
      status: row.status,
      eventId: row.event_id ?? null,
      eventSource: row.event_source ?? null,
      created: row.created,
      updated: row.updated,
    };
  }

  function decodeNote(row) {
    if (!row) return null;
    return {
      id: row.id,
      date: row.date ?? null,
      body: row.body,
      created: row.created,
      updated: row.updated,
      deletedAt: row.deleted_at ?? null,
    };
  }

  function getPlan(id) {
    const plan = decodePlan(statements.planById.get(String(id ?? '')));
    if (!plan) throw new OrganiserError(`no plan ${String(id ?? '')}`, 'not_found', 404);
    return plan;
  }

  function getNote(id) {
    const note = decodeNote(statements.noteById.get(String(id ?? '')));
    if (!note) throw new OrganiserError(`no note ${String(id ?? '')}`, 'not_found', 404);
    return note;
  }

  /** Keep a new plan. A date and a title are the whole contract. */
  function addPlan({ date, time, title, notes } = {}) {
    const clean = {
      date: cleanDate(date),
      time: cleanTime(time),
      title: cleanTitle(title),
      notes: cleanPlanNotes(notes),
    };
    const id = allocateId('PLAN', 'plan_seq');
    const stamp = now();
    statements.planInsert.run(id, clean.date, clean.time, clean.title, clean.notes, 'open', stamp, stamp);
    return getPlan(id);
  }

  /**
   * Change the fields a plan may change.
   *
   * `time: null` or `''` clears the time (the plan belongs to the day, not an
   * hour). Fields the caller did not mention stay as they are — an update from
   * the page must not blank a note it never showed.
   */
  function updatePlan(id, patch = {}) {
    const current = getPlan(id);
    const next = { ...current };
    if (given(patch, 'date')) next.date = cleanDate(patch.date);
    if (given(patch, 'time')) next.time = cleanTime(patch.time);
    if (given(patch, 'title')) next.title = cleanTitle(patch.title);
    if (given(patch, 'notes')) next.notes = cleanPlanNotes(patch.notes);
    const sets = [];
    const values = [];
    for (const field of ['date', 'time', 'title', 'notes']) {
      if (next[field] !== current[field]) {
        sets.push(`${field} = ?`);
        values.push(next[field]);
      }
    }
    if (!sets.length) return current;
    values.push(now(), current.id);
    db.prepare(`UPDATE plans SET ${sets.join(', ')}, updated = ? WHERE id = ?`).run(...values);
    return getPlan(current.id);
  }

  /** Move a plan to done or dropped, or back to open. Status is a decision, not a field patch. */
  function setPlanStatus(id, status) {
    const current = getPlan(id);
    const clean = cleanPlanStatus(status);
    if (clean === current.status) return current;
    db.prepare('UPDATE plans SET status = ?, updated = ? WHERE id = ?').run(clean, now(), current.id);
    return getPlan(current.id);
  }

  /**
   * Mark a plan as now owned by the connected calendar.
   *
   * From this point the row is provenance, not an agenda entry: the event is the
   * single truth for that commitment. Promoting twice is refused rather than
   * silently orphaning the first event.
   */
  function promotePlan(id, { eventId, source } = {}) {
    const current = getPlan(id);
    if (current.eventId) throw new OrganiserError(`${current.id} is already on the calendar`, 'already_promoted', 409);
    const key = typeof eventId === 'string' ? eventId.trim() : '';
    if (!key || key.length > MAX_EVENT_ID) throw new OrganiserError('the provider returned no event id', 'invalid_event_id', 502);
    const from = typeof source === 'string' && source.trim() ? source.trim().slice(0, 40) : null;
    db.prepare('UPDATE plans SET event_id = ?, event_source = ?, updated = ? WHERE id = ?').run(key, from, now(), current.id);
    return getPlan(current.id);
  }

  /**
   * Plans in a date range, oldest first.
   *
   * Promoted plans are never listed: the event is the entry now, and showing
   * both would be exactly the duplication this store exists to avoid. A done or
   * dropped plan still lists when `status: 'all'`, because the day's record is
   * worth reading back.
   */
  function listPlans({ from, to, status = 'open' } = {}) {
    const start = cleanDate(from);
    const end = cleanDate(to);
    if (end < start) throw new OrganiserError('the end date is before the start date', 'invalid_range');
    const filter = status === 'all' ? 'all' : 'open';
    return statements.planList.all(start, end, filter).map(decodePlan);
  }

  /**
   * Keep a note.
   *
   * With a date, this appends to that day's note when one exists — the capture
   * path ("note that the accountant called") must never erase what is already
   * written. Without a date it lands in the inbox, and the inbox may hold many.
   * @returns {{note: object, appended: boolean}}
   */
  function addNote({ date, body } = {}) {
    const text = cleanBody(body);
    const day = cleanOptionalDate(date);
    if (day) {
      const existing = decodeNote(statements.noteByDate.get(day));
      if (existing) {
        const merged = `${existing.body}\n\n${text}`;
        if (merged.length > MAX_NOTE_BODY) {
          throw new OrganiserError(`appending would make the note longer than ${MAX_NOTE_BODY} characters`, 'note_too_long');
        }
        statements.noteUpdate.run(merged, now(), existing.id);
        return { note: getNote(existing.id), appended: true };
      }
    }
    const id = allocateId('NOTE', 'note_seq');
    const stamp = now();
    statements.noteInsert.run(id, day, text, stamp, stamp);
    return { note: getNote(id), appended: false };
  }

  /**
   * Replace a note's body, or move it to another day.
   *
   * Moving onto a day that already has a note is refused: the store's one note
   * per day would have to merge two texts, and a silent merge is a guess about
   * what the user meant.
   */
  function updateNote(id, patch = {}) {
    const current = getNote(id);
    const body = given(patch, 'body') ? cleanBody(patch.body) : current.body;
    const date = given(patch, 'date') ? cleanOptionalDate(patch.date) : current.date;
    if (date && date !== current.date) {
      const other = decodeNote(statements.noteByDate.get(date));
      if (other && other.id !== current.id) {
        throw new OrganiserError(`${other.id} already covers ${date}; update that note instead`, 'date_taken', 409);
      }
    }
    if (body === current.body && date === current.date) return current;
    statements.notePatch.run(body, date, now(), current.id);
    return getNote(current.id);
  }

  /**
   * The page's save: create the day's note, or replace it.
   *
   * The editor shows the whole note, so it replaces; chat capture appends. Both
   * end up as the same single row for the day.
   * @returns {{note: object, created: boolean}}
   */
  function saveNoteForDate({ date, body } = {}) {
    const day = cleanDate(date);
    const text = cleanBody(body);
    const existing = decodeNote(statements.noteByDate.get(day));
    if (existing) {
      if (existing.body === text) return { note: existing, created: false };
      statements.noteUpdate.run(text, now(), existing.id);
      return { note: getNote(existing.id), created: false };
    }
    const id = allocateId('NOTE', 'note_seq');
    const stamp = now();
    statements.noteInsert.run(id, day, text, stamp, stamp);
    return { note: getNote(id), created: true };
  }

  /** Withdraw a note from every list; the row stays, so a mistaken tap is recoverable in the file. */
  function deleteNote(id) {
    const current = getNote(id);
    if (current.deletedAt) return current;
    statements.noteDelete.run(now(), now(), current.id);
    return getNote(current.id);
  }

  /**
   * Notes, newest day first, inbox last.
   *
   * `from`/`to` restrict to dated notes in a range; `q` is a case-insensitive
   * substring search over the body. Both are optional and compose.
   */
  function listNotes({ from, to, q, limit } = {}) {
    let start = null;
    let end = null;
    if (from != null || to != null) {
      start = cleanDate(from);
      end = cleanDate(to);
      if (end < start) throw new OrganiserError('the end date is before the start date', 'invalid_range');
    }
    const needle = typeof q === 'string' && q.trim() ? q.trim() : null;
    const count = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), MAX_LIST_LIMIT) : DEFAULT_LIST_LIMIT;
    return statements.noteList.all(start, start, end, needle, needle, count).map(decodeNote);
  }

  /** The note for one day, or null. */
  function getNoteByDate(date) {
    return decodeNote(statements.noteByDate.get(cleanDate(date)));
  }

  return {
    addPlan,
    updatePlan,
    setPlanStatus,
    promotePlan,
    listPlans,
    getPlan,
    addNote,
    updateNote,
    saveNoteForDate,
    deleteNote,
    listNotes,
    getNote,
    getNoteByDate,
    close: () => db.close(),
  };
}
