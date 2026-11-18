/**
 * The studio's works library: one JSON file beside its thumbnails.
 *
 * A work is a delivered design as the Studio page lists it — a title, the
 * artifact's path, the module it belongs to, an optional theme, and an optional
 * thumbnail filename. The file is the only copy of that list: the page and the
 * `studio_library` tool read the same rows, so a work registered in chat appears
 * on the page without a restart and the two surfaces cannot disagree.
 *
 * Three rules keep the file trustworthy:
 *
 *  - **A row is validated.** An unknown field is an error, never something to
 *    drop: quietly discarding a caller's field hides the mistake until the data
 *    is gone. A malformed row is reported by position, so the file can be fixed
 *    by hand.
 *  - **Nothing outside `$DSH_HOME/studio` is touched.** The artifact path is
 *    recorded as text and never opened; the store reads and writes only
 *    `library.json` and `thumbs/`. The model cannot use this tool to probe the
 *    filesystem.
 *  - **Writes are atomic and private.** 0700 for the directory and 0600 for the
 *    file, matching the rest of the profile's local data, and a temp-then-rename
 *    write so a crash cannot truncate the list.
 *
 * The library is re-read on every operation instead of cached: the file is
 * small, and an edit made by hand (or by a future importer) must not be hidden
 * behind a stale in-memory copy.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** A store failure with a stable code, so a route or tool can say what went wrong. */
export class StudioError extends Error {
  constructor(message, code = 'studio_error', status = 400) {
    super(message);
    this.name = 'StudioError';
    this.code = code;
    this.status = status;
  }
}

/** The file names inside — and only inside — the library directory. */
const LIBRARY_FILE = 'library.json';
const THUMBS_DIR = 'thumbs';

/** Every field a stored work carries; the tool may set the four in `ADD_FIELDS`. */
const WORK_FIELDS = ['id', 'title', 'path', 'module', 'theme', 'createdAt', 'thumb'];
const ADD_FIELDS = ['path', 'title', 'module', 'theme'];

const MAX_TITLE = 200;
const MAX_PATH = 4096;
const MAX_MODULE = 40;
const MAX_THEME = 120;
const MAX_THUMB = 160;
const MAX_WORKS = 500;

/** Ids are stable and readable: WORK-1, WORK-2, … */
const WORK_ID = /^WORK-[1-9]\d*$/;
/** A module is a lowercase token, so the page can render it without a lookup table. */
const MODULE_TOKEN = /^[a-z][a-z0-9-]*$/;
/** A thumbnail is a bare file name in `thumbs/`, never a path. */
const THUMB_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function now() {
  return new Date().toISOString();
}

/** Whether `key` was given at all, so `null` can mean "clear" rather than "leave". */
function given(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

/**
 * Refuse a field the record does not have.
 *
 * Rejection rather than dropping is deliberate: a caller that sends `publishAt`
 * believes it was stored, and the next read would prove otherwise with no clue
 * about where it went.
 */
function assertKnownFields(object, allowed, where = 'a work') {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) {
      throw new StudioError(`${where} has no field "${key}"; use ${allowed.join(', ')}`, 'unknown_field');
    }
  }
}

function cleanText(value, field, max, { required = true } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new StudioError(`${field} is required`, 'missing_field');
    return null;
  }
  if (typeof value !== 'string') throw new StudioError(`${field} must be text`, 'invalid_field');
  const text = value.trim();
  if (!text) {
    if (required) throw new StudioError(`${field} is empty`, 'missing_field');
    return null;
  }
  if (text.length > max) throw new StudioError(`${field} is longer than ${max} characters`, 'field_too_long');
  return text;
}

/**
 * The artifact path as it will be shown and copied.
 *
 * Absolute paths are kept; `~/` expands; a relative path resolves against the
 * working directory the model was given the file in. Resolution happens once,
 * at registration, so the page never has to guess a base.
 */
function cleanPath(value) {
  const text = cleanText(value, 'path', MAX_PATH);
  if (text.includes('\0')) throw new StudioError('path contains a null byte', 'invalid_path');
  if (text === '~') return os.homedir();
  if (text.startsWith('~/')) return path.join(os.homedir(), text.slice(2));
  return path.isAbsolute(text) ? text : path.resolve(process.cwd(), text);
}

/** Module names are tokens: `Deck` and `deck ` both become `deck`. */
function cleanModule(value) {
  const raw = cleanText(value, 'module', MAX_MODULE);
  const text = raw.toLowerCase().replace(/[\s_]+/g, '-');
  if (!MODULE_TOKEN.test(text)) {
    throw new StudioError(
      `not a module name: "${text}" (use a lowercase word such as web, deck, infographic, motion or xiaohongshu)`,
      'invalid_module',
    );
  }
  return text;
}

function cleanTheme(value) {
  return cleanText(value, 'theme', MAX_THEME, { required: false });
}

/** A thumbnail is stored as a bare file name under `thumbs/`; anything else is refused. */
function cleanThumb(value, where = 'thumb') {
  const text = cleanText(value, where, MAX_THUMB, { required: false });
  if (text === null) return null;
  if (!THUMB_NAME.test(text) || path.basename(text) !== text) {
    throw new StudioError(`${where} must be a file name in thumbs/, not a path: "${text}"`, 'invalid_thumb');
  }
  return text;
}

/** A timestamp read from the file must be a date the page can format. */
function cleanCreatedAt(value, where = 'createdAt') {
  const text = cleanText(value, where, 40);
  if (!Number.isFinite(Date.parse(text))) throw new StudioError(`${where} is not a date: "${text}"`, 'invalid_date');
  return text;
}

function cleanId(value) {
  if (typeof value !== 'string' || !WORK_ID.test(value.trim())) {
    throw new StudioError(`not a work id: "${String(value)}" (expected WORK-1)`, 'invalid_id');
  }
  return value.trim();
}

/** One stored row, all seven fields present and clean. */
function normalizeWork(raw, where = 'a work') {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new StudioError(`${where} is not an object`, 'invalid_work');
  }
  assertKnownFields(raw, WORK_FIELDS, where);
  return {
    id: cleanId(raw.id),
    title: cleanText(raw.title, `${where} title`, MAX_TITLE),
    path: cleanPath(raw.path),
    module: cleanModule(raw.module),
    theme: cleanTheme(raw.theme),
    createdAt: cleanCreatedAt(raw.createdAt, `${where} createdAt`),
    thumb: cleanThumb(raw.thumb, `${where} thumb`),
  };
}

/**
 * The fields a caller may set. `id` and `createdAt` are the store's, never the
 * caller's, so they are rejected here rather than ignored.
 */
function cleanInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new StudioError('a work needs a path, a title and a module', 'invalid_work');
  }
  assertKnownFields(input, ADD_FIELDS);
  const work = {
    path: cleanPath(input.path),
    title: cleanText(input.title, 'title', MAX_TITLE),
    module: cleanModule(input.module),
  };
  // An absent theme is "leave it alone"; an explicit empty one clears it. The
  // tool passes the caller's fields through, so the distinction survives here.
  if (given(input, 'theme')) work.theme = cleanTheme(input.theme);
  return work;
}

/**
 * Read the library file.
 *
 * A missing file is a fresh library, not an error. Anything else — unreadable,
 * malformed JSON, not a list, a row that fails validation — throws, so a write
 * built on it would refuse rather than replace data it could not read.
 * @param {string} file - absolute path to library.json.
 * @returns {object[]} validated works, in file order.
 */
function readLibrary(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw new StudioError(`cannot read ${LIBRARY_FILE}: ${String(error?.message ?? error)}`, 'store_unreadable', 500);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new StudioError(`${LIBRARY_FILE} is not valid JSON (${String(error?.message ?? error)}); fix or remove it`, 'store_corrupt', 500);
  }
  if (!Array.isArray(parsed)) throw new StudioError(`${LIBRARY_FILE} must hold a list of works`, 'store_corrupt', 500);
  return parsed.map((row, index) => normalizeWork(row, `work ${index + 1} in ${LIBRARY_FILE}`));
}

/** Write the whole list atomically, with private modes. */
function writeLibrary(file, works) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(dir, 0o700);
  } catch {
    // A directory on a foreign mount that refuses chmod still works; the file mode matters more.
  }
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temp, `${JSON.stringify(works, null, 2)}\n`, { mode: 0o600 });
    try {
      fs.chmodSync(temp, 0o600);
    } catch {
      // The open mode above already requested 0600; chmod is belt-and-braces against umask oddities.
    }
    fs.renameSync(temp, file);
  } catch (error) {
    // A failed write must not leave a temp file behind for the next run to trip on.
    try {
      fs.unlinkSync(temp);
    } catch {
      // The write may have failed before the file existed, or cleanup failed; the original error is the one to report.
    }
    throw error;
  }
}

/** Continue the numbering from the highest id present, so a live reference keeps its meaning. */
function nextId(works) {
  let highest = 0;
  for (const work of works) {
    const number = Number(work.id.slice('WORK-'.length));
    if (Number.isSafeInteger(number) && number > highest) highest = number;
  }
  return `WORK-${highest + 1}`;
}

/** Newest first; equal timestamps fall back to the newer id. */
function byRecency(a, b) {
  if (a.createdAt !== b.createdAt) return b.createdAt.localeCompare(a.createdAt);
  return Number(b.id.slice('WORK-'.length)) - Number(a.id.slice('WORK-'.length));
}

/**
 * Open (or create) the library directory.
 *
 * `thumbs/` is created eagerly so a future thumbnail writer has a home; the
 * library file itself is only written on the first `addWork`, so opening the
 * plugin leaves no half-empty artifact behind.
 * @param {string} dir - absolute path to the studio directory.
 * @returns the library handle.
 */
export function openStore(dir) {
  const libraryPath = path.join(dir, LIBRARY_FILE);
  const thumbsDir = path.join(dir, THUMBS_DIR);

  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const tighten = (target) => {
    try {
      fs.chmodSync(target, 0o700);
    } catch {
      // A foreign mount may refuse chmod; creating with the mode above is the best available.
    }
  };
  tighten(dir);
  fs.mkdirSync(thumbsDir, { recursive: true, mode: 0o700 });
  tighten(thumbsDir);

  function listWorks() {
    return readLibrary(libraryPath).sort(byRecency);
  }

  /**
   * Register a delivered file, or update the work already registered at that path.
   *
   * Updating by path is the rule that keeps one artifact one work: running the
   * same delivery twice must not grow the grid, and a re-render keeps its id so
   * the page can follow it.
   * @returns {{work: object, created: boolean}}
   */
  function addWork(input) {
    const clean = cleanInput(input);
    const works = readLibrary(libraryPath);
    const index = works.findIndex((work) => work.path === clean.path);
    if (index >= 0) {
      const current = works[index];
      const next = {
        ...current,
        title: clean.title,
        module: clean.module,
        theme: given(clean, 'theme') ? clean.theme : current.theme,
      };
      works[index] = next;
      writeLibrary(libraryPath, works);
      return { work: next, created: false };
    }
    if (works.length >= MAX_WORKS) {
      throw new StudioError(`the library holds ${MAX_WORKS} works; remove one before adding another`, 'library_full', 409);
    }
    const work = {
      id: nextId(works),
      title: clean.title,
      path: clean.path,
      module: clean.module,
      theme: clean.theme ?? null,
      createdAt: now(),
      thumb: null,
    };
    works.push(work);
    writeLibrary(libraryPath, works);
    return { work, created: true };
  }

  /** Withdraw one work. The artifact itself is never touched. */
  function removeWork(id) {
    const key = typeof id === 'string' ? id.trim() : '';
    if (!key) throw new StudioError('a work id is required', 'missing_id');
    const works = readLibrary(libraryPath);
    const index = works.findIndex((work) => work.id === key);
    if (index < 0) throw new StudioError(`no work ${key}`, 'not_found', 404);
    const [removed] = works.splice(index, 1);
    writeLibrary(libraryPath, works);
    return removed;
  }

  return { dir, libraryPath, thumbsDir, addWork, listWorks, removeWork };
}
