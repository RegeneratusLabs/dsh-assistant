/**
 * Self-test for @local/dsh-organiser — no test runner, no network.
 *
 * Covers what can break silently: id allocation, validation, ordering, the
 * "promoted plans stop being plans" rule, one note per day with append capture,
 * the two-band agenda text, the JSON routes the page reads, and the config path
 * that puts the store under `$DSH_HOME/calendar`.
 *
 * Run: node plugins/organiser/selftest.mjs
 */
import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const home = mkdtempSync(path.join(os.tmpdir(), 'dsh-organiser-selftest-'));
const previousHome = process.env.DSH_HOME;
process.env.DSH_HOME = home;

mkdirSync(path.join(home, 'ambient'), { recursive: true });
writeFileSync(path.join(home, 'ambient', 'profile.json'), JSON.stringify({ timeZone: 'Australia/Brisbane' }));

const { apply, resolveConfig } = await import('./index.js');
const { openStore, OrganiserError } = await import('./store.js');
const { buildTools } = await import('./tools.js');
const { addDays, isValidZone, resolveZone, todayIn } = await import('./time.js');
const { createAutomation, createReminder, leadTime, listAutomations } = await import('./schedule.js');

let failures = 0;
/** Assert one condition, recording the outcome. */
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`ok   ${label}`);
    return;
  }
  failures += 1;
  console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
}

/** The error a call throws, or null when it does not throw. */
function thrown(fn) {
  try {
    fn();
    return null;
  } catch (error) {
    return error;
  }
}

const zone = 'Australia/Brisbane';
const dbPath = path.join(home, 'calendar', 'plans.db');
const store = openStore(dbPath);

try {
  // ── plans ─────────────────────────────────────────────────────────────────
  const first = store.addPlan({ date: '2026-11-17', time: '09:00', title: 'Write the quote' });
  check('a plan gets a readable id', first.id === 'PLAN-1', first.id);
  check('a new plan is open', first.status === 'open');
  check('a plan starts with no event', first.eventId === null);

  const second = store.addPlan({ date: '2026-11-17', title: 'Call the bank' });
  const third = store.addPlan({ date: '2026-11-18', time: '08:00', title: 'Drive to the office' });
  check('plan ids are never reused', third.id === 'PLAN-3', third.id);

  check('a title is required', thrown(() => store.addPlan({ date: '2026-11-17', title: '  ' })) instanceof OrganiserError);
  check(
    'an impossible date is refused',
    thrown(() => store.addPlan({ date: '2026-02-30', title: 'x' }))?.code === 'invalid_date',
  );
  check(
    'a loose time is refused',
    thrown(() => store.addPlan({ date: '2026-11-17', time: '9:00', title: 'x' }))?.code === 'invalid_time',
  );

  store.updatePlan(second.id, { notes: 'only if the branch is open' });
  const afterNotes = store.updatePlan(second.id, { time: '15:00' });
  check('an update leaves fields it was not given', afterNotes.notes === 'only if the branch is open', String(afterNotes.notes));
  check('an update sets a time', afterNotes.time === '15:00');
  check('an empty time clears the time', store.updatePlan(second.id, { time: '' }).time === null);

  const ordered = store.listPlans({ from: '2026-11-17', to: '2026-11-18' });
  check(
    'plans sort by day, then time, untimed last',
    ordered.map((plan) => plan.id).join(',') === 'PLAN-1,PLAN-2,PLAN-3',
    ordered.map((plan) => plan.id).join(','),
  );

  store.setPlanStatus(third.id, 'done');
  check(
    'a done plan leaves the open list',
    store.listPlans({ from: '2026-11-17', to: '2026-11-18' }).every((plan) => plan.id !== third.id),
  );
  check(
    "status 'all' brings it back",
    store.listPlans({ from: '2026-11-17', to: '2026-11-18', status: 'all' }).some((plan) => plan.id === third.id),
  );
  check(
    'an end before the start is refused',
    thrown(() => store.listPlans({ from: '2026-11-18', to: '2026-11-17' }))?.code === 'invalid_range',
  );

  const promoted = store.promotePlan(second.id, { eventId: 'ev-2', source: 'google' });
  check('promotion records the event', promoted.eventId === 'ev-2' && promoted.eventSource === 'google');
  check(
    'a promoted plan is no longer listed as a plan',
    store.listPlans({ from: '2026-11-17', to: '2026-11-18', status: 'all' }).every((plan) => plan.id !== second.id),
  );
  check(
    'promoting twice is refused, not silently orphaned',
    thrown(() => store.promotePlan(second.id, { eventId: 'ev-9' }))?.code === 'already_promoted',
  );

  // ── notes ─────────────────────────────────────────────────────────────────
  const dayNote = store.addNote({ date: '2026-11-17', body: 'Rang the bank about the transfer.' });
  check('a note gets its own readable id', dayNote.note.id === 'NOTE-1', dayNote.note.id);
  check('a dated note is not an append', dayNote.appended === false);

  const appended = store.addNote({ date: '2026-11-17', body: 'They need the signed form.' });
  check('adding to the same day appends', appended.appended === true && appended.note.id === 'NOTE-1');
  check('the first text survives the append', appended.note.body.includes('Rang the bank') && appended.note.body.includes('signed form'));
  check('the append separates paragraphs', appended.note.body.includes('\n\n'), JSON.stringify(appended.note.body));

  const inbox = store.addNote({ body: 'Sprayer nozzle part number: 110-04' });
  check('an undated note goes to the inbox', inbox.note.date === null && inbox.note.id === 'NOTE-2', inbox.note.id);
  const inboxTwo = store.addNote({ body: 'Ask about the retention wording' });
  check('the inbox may hold many notes', inboxTwo.note.id === 'NOTE-3' && inboxTwo.note.date === null);

  check('a note needs a body', thrown(() => store.addNote({ date: '2026-11-18', body: ' ' }))?.code === 'missing_body');

  const saved = store.saveNoteForDate({ date: '2026-11-18', body: 'Boxes: 400, in the shed.' });
  check('saving a new day creates a note', saved.created === true && saved.note.date === '2026-11-18');
  const replaced = store.saveNoteForDate({ date: '2026-11-18', body: 'Boxes: 400, by the door.' });
  check('saving the same day replaces, it does not append', replaced.created === false && replaced.note.body === 'Boxes: 400, by the door.');

  check(
    'moving a note onto a taken day is refused',
    thrown(() => store.updateNote(inboxTwo.note.id, { date: '2026-11-17' }))?.code === 'date_taken',
  );

  const listed = store.listNotes();
  check(
    'notes list newest day first, inbox last',
    listed.map((note) => note.id).join(',') === 'NOTE-4,NOTE-1,NOTE-3,NOTE-2',
    listed.map((note) => `${note.id}:${note.date}`).join(','),
  );
  check(
    'a note range keeps only dated notes inside it',
    store.listNotes({ from: '2026-11-18', to: '2026-11-18' }).map((note) => note.id).join(',') === 'NOTE-4',
  );
  check(
    'search is case-insensitive and reaches the inbox',
    store.listNotes({ q: 'NOZZLE' }).map((note) => note.id).join(',') === 'NOTE-2',
  );

  const deleted = store.deleteNote(inboxTwo.note.id);
  check('a deleted note is withdrawn, not destroyed', deleted.deletedAt !== null && store.listNotes().every((note) => note.id !== inboxTwo.note.id));
  check('a deleted note still reads by id', store.getNote(inboxTwo.note.id).id === inboxTwo.note.id);
  const recreated = store.addNote({ body: 'Ask about the retention wording' });
  check('a withdrawn note does not block a new one', recreated.note.id === 'NOTE-5' && recreated.note.deletedAt === null);

  // ── the two-band agenda ───────────────────────────────────────────────────
  const fakeProvider = {
    id: 'fake',
    async agenda() {
      return {
        connected: true,
        events: [
          { id: 'ev-1', title: 'Standup', start: '2026-11-17T09:30:00+10:00', end: '2026-11-17T10:00:00+10:00', calendar: 'Work' },
          { id: 'ev-2', title: 'Call the bank', start: '2026-11-17T15:00:00+10:00', end: '2026-11-17T15:30:00+10:00', calendar: 'Work' },
          { id: 'ev-3', title: 'Conference', start: '2026-11-19', allDay: true },
          { id: 'ev-4', title: 'Next month', start: '2026-12-01T09:00:00+10:00', end: null },
        ],
      };
    },
  };

  const tools = buildTools({ store, zone, provider: fakeProvider });
  const agendaTool = tools.find((tool) => tool.name === 'organiser_agenda');
  const planTool = tools.find((tool) => tool.name === 'organiser_plan');
  const noteTool = tools.find((tool) => tool.name === 'organiser_note');
  check('three tools are built', Boolean(agendaTool && planTool && noteTool));

  const read = await agendaTool.execute({ from: '2026-11-17', to: '2026-11-23' });
  const text = read.message;
  check('the agenda names its range and zone', text.includes('2026-11-17 to 2026-11-23 (Australia/Brisbane)'));
  check('calendar events keep their band', text.includes('Calendar (3)'), text.split('\n').slice(0, 4).join(' | '));
  check('a timed event renders as a range', text.includes('09:30–10:00 — Standup'), text);
  check('an all-day event says so', text.includes('all day — Conference'), text);
  check('events outside the range are dropped', !text.includes('Next month'), text);
  check('plans keep their own band', text.includes('Plans (1)'), text);
  check(
    'a promoted plan does not appear beside its event',
    text.split('Call the bank').length - 1 === 1,
    `mentions: ${text.split('Call the bank').length - 1}`,
  );

  const bare = await buildTools({ store, zone, provider: null })
    .find((tool) => tool.name === 'organiser_agenda')
    .execute({ from: '2026-11-17', to: '2026-11-17' });
  check('no provider is reported, not hidden', bare.message.includes('Calendar: no calendar connected.'), bare.message);

  const failing = await buildTools({ store, zone, provider: { id: 'f', async agenda() { return { connected: true, events: [], error: 'quota exceeded' }; } } })
    .find((tool) => tool.name === 'organiser_agenda')
    .execute({ from: '2026-11-17', to: '2026-11-17' });
  check('a provider failure is named as unavailable', failing.message.includes('unavailable right now (quota exceeded)'), failing.message);

  check(
    'a reversed range is refused',
    (await agendaTool.execute({ from: '2026-11-18', to: '2026-11-17' })).message.startsWith('Not read: the end date is before'),
  );
  check(
    'an oversized range asks for a narrower one',
    (await agendaTool.execute({ from: '2026-11-01', to: '2027-01-31' })).message.includes('62 or fewer'),
  );

  const defaults = await agendaTool.execute({});
  const defaultFrom = todayIn(zone);
  check('the default range starts today', defaults.message.includes(`Agenda ${defaultFrom} to ${addDays(defaultFrom, 6)}`), defaults.message);

  // ── the plan tool ─────────────────────────────────────────────────────────
  const added = await planTool.execute({ action: 'add', date: '2026-11-20', title: 'Pick up the seed order' });
  check('plan add saves and reports the id', added.message.startsWith('Saved PLAN-4:'), added.message);
  check('plan update reports the new time', (await planTool.execute({ action: 'update', id: 'PLAN-4', time: '11:30' })).message.includes('11:30'));
  check('plan done reports the status', (await planTool.execute({ action: 'done', id: 'PLAN-4' })).message.startsWith('PLAN-4 done'));
  check('plan delete reports the id', (await planTool.execute({ action: 'delete', id: 'PLAN-4' })).message.startsWith('Deleted PLAN-4'));
  check(
    'a missing plan is a message, not a throw',
    (await planTool.execute({ action: 'update', id: 'PLAN-99', title: 'x' })).message.startsWith('Not saved: no plan PLAN-99'),
  );
  check('an unknown plan action is refused', (await planTool.execute({ action: 'postpone', id: 'PLAN-1' })).message.startsWith('Not saved:'));

  // ── the note tool ─────────────────────────────────────────────────────────
  const noted = await noteTool.execute({ action: 'add', date: '2026-11-19', body: 'Car service is due at 180,000 km.' });
  check('note add reports the new id and day', noted.message === 'Saved NOTE-6 for 2026-11-19.', noted.message);
  const notedAgain = await noteTool.execute({ action: 'add', date: '2026-11-19', body: 'Book it for the 24th.' });
  check('note add on a taken day appends', notedAgain.message === 'Added to NOTE-6 for 2026-11-19.', notedAgain.message);

  const noteList = await noteTool.execute({ action: 'list' });
  check('note list names its scope', noteList.message.startsWith('Notes, newest first ('));
  check('note list shows the day and the id', /2026-11-19 \(Thu\)\s+NOTE-6\s+Car service/.test(noteList.message), noteList.message);
  check('note list shows the inbox as inbox', /inbox\s+NOTE-2\s+Sprayer nozzle/.test(noteList.message), noteList.message);

  const found = await noteTool.execute({ action: 'list', q: 'bank' });
  check('note search narrows by word', found.message.startsWith('Notes matching "bank" (1)'), found.message);

  check(
    'note update replaces text',
    (await noteTool.execute({ action: 'update', id: 'NOTE-6', body: 'Car service due at 180,000 km — booked.' })).message === 'Updated NOTE-6 for 2026-11-19.',
  );
  check('note delete reports the id', (await noteTool.execute({ action: 'delete', id: 'NOTE-5' })).message === 'NOTE-5 deleted.');
  check(
    'note list needs both ends of a range',
    (await noteTool.execute({ action: 'list', from: '2026-11-01' })).message.includes('give both from and to'),
  );

  // ── the schedule seam ─────────────────────────────────────────────────────
  const shifted = leadTime('2026-11-17', '15:00', 30);
  check('a lead time moves the reminder earlier', shifted.date === '2026-11-17' && shifted.time === '14:30');
  const midnight = leadTime('2026-11-17', '00:10', 30);
  check('a lead time carries into the previous day', midnight.date === '2026-11-16' && midnight.time === '23:40', JSON.stringify(midnight));

  const created = [];
  const edits = [];
  const fakeSchedule = {
    async edit(request) {
      edits.push(request);
      return { id: request.id, deleted: true };
    },
    async create(request) {
      created.push(request);
      return { id: `SCHED-${created.length}`, title: request.title, status: 'active', scheduledAt: '2026-11-17T04:30:00Z', ...request.timing };
    },
    async catalog() {
      return [
        { id: 'A1', title: 'Daily brief', kind: 'daily', time: '07:00:00', timeZone: zone, scheduledAt: '2026-11-18T21:00:00Z', status: 'active' },
        { id: 'A2', title: 'Finished thing', kind: 'at', scheduledAt: '2026-11-01T00:00:00Z', status: 'ended' },
      ];
    },
  };
  const scheduleCtx = { get: (name) => (name === 'schedule' ? fakeSchedule : undefined) };

  check(
    'no schedule service is reported, not thrown',
    (await listAutomations({})).available === false,
  );
  const automationList = await listAutomations(scheduleCtx);
  check('automations list only active tasks', automationList.tasks.length === 1 && automationList.tasks[0].title === 'Daily brief');
  check('an automation carries a recurrence label', automationList.tasks[0].recurrence === 'daily 07:00', automationList.tasks[0].recurrence);
  check('an automation never carries its prompt', !('prompt' in automationList.tasks[0]));

  const reminder = await createReminder(scheduleCtx, {
    title: 'Dentist',
    date: '2026-11-17',
    time: '15:00',
    leadMinutes: 30,
    timeZone: zone,
  });
  check('a reminder is a one-shot task', created[0].timing.kind === 'at');
  check('a reminder is delivered into a new conversation', created[0].target.kind === 'new_once');
  check('a reminder lands at the lead time', created[0].timing.at.date === '2026-11-17' && created[0].timing.at.time === '14:30:00', JSON.stringify(created[0].timing));
  check('a reminder says what to say', created[0].prompt.includes('Remind the user about "Dentist"'), created[0].prompt);
  check('a reminder returns the task view', reminder.id === 'SCHED-1' && reminder.title === 'Dentist');

  const autom = await createAutomation(scheduleCtx, {
    title: 'Supplier research',
    instruction: 'Find three suppliers for the seed order.',
    date: '2026-11-17',
    time: '09:00',
    repeat: 'daily',
    timeZone: zone,
  });
  check('an automation carries the user instruction', created[1].prompt.startsWith('Find three suppliers'), created[1].prompt);
  check('a daily automation uses the daily timing', created[1].timing.kind === 'daily' && created[1].timing.daily.time === '09:00:00');
  check('an automation is delivered into a new conversation', created[1].target.kind === 'new_once');
  check('an automation returns the task view', autom.title === 'Supplier research');

  await createAutomation(scheduleCtx, { title: 'Weekday brief', instruction: 'Brief me.', date: '2026-11-17', time: '07:00', repeat: 'weekdays', timeZone: zone });
  check('weekdays map to Monday–Friday', created[2].timing.weekly.weekdays.join(',') === '1,2,3,4,5');
  await createAutomation(scheduleCtx, { title: 'Weekly review', instruction: 'Review.', date: '2026-11-17', time: '17:00', repeat: 'weekly', timeZone: zone });
  check('a weekly rule uses the chosen weekday', created[3].timing.weekly.weekdays.join(',') === '2', created[3].timing.weekly.weekdays.join(','));

  const refusing = { get: () => ({ async create() { throw new Error('The scheduled time must be strictly in the future.'); }, async catalog() { return []; } }) };
  check(
    'a refused schedule is a 400, not a host fault',
    (await createReminder(refusing, { title: 'x', date: '2020-01-01', time: '09:00', timeZone: zone }).catch((error) => error))?.status === 400,
  );
  check(
    'a reminder without the service is a clear error',
    (await createReminder({}, { title: 'x', date: '2026-11-17', time: '15:00', timeZone: zone }).catch((error) => error))?.code === 'schedule_unavailable',
  );

  // ── the routes the page reads ─────────────────────────────────────────────
  const routes = [];
  const disposers = [];
  const ctx = {
    tools: { register: () => {} },
    get: (name) => (name === 'schedule' ? fakeSchedule : undefined),
    connection: { fetch: { register: async (route) => { routes.push(route); return async () => {}; } } },
    effect: (fn) => { disposers.push(fn()); },
  };
  await apply(ctx, {});
  check(
    'apply registers five routes',
    routes.map((route) => route.path).sort().join(',') === '/api/organiser,/api/organiser/automation,/api/organiser/note,/api/organiser/plan,/api/organiser/reminder',
    routes.map((route) => route.path).sort().join(','),
  );

  const getRoute = routes.find((route) => route.path === '/api/organiser');
  const response = await getRoute.fetch({ url: '/api/organiser?from=2026-11-17&to=2026-11-18', signal: undefined });
  const payload = await response.json();
  check('the range route answers ok', payload.ok === true);
  check('the range route carries the zone and today', payload.zone === zone && /^\d{4}-\d{2}-\d{2}$/.test(payload.today));
  check('the range route says the calendar is not connected', payload.calendar.connected === false && payload.events.length === 0);
  check('the range route carries the plans it owns', payload.plans.some((plan) => plan.id === 'PLAN-1'));
  check('the range route carries the notes rail', payload.notes.length >= 3 && payload.notes.every((note) => note.deletedAt === null));

  const planRoute = routes.find((route) => route.path === '/api/organiser/plan');
  const planResponse = await planRoute.fetch({
    url: '/api/organiser/plan',
    signal: undefined,
    text: async () => JSON.stringify({ action: 'add', date: '2026-11-21', title: 'Clean the car' }),
  });
  const planPayload = await planResponse.json();
  check('the plan route saves a plan', planPayload.ok === true && planPayload.plan.id === 'PLAN-5', JSON.stringify(planPayload));

  const deleteResponse = await planRoute.fetch({
    url: '/api/organiser/plan',
    signal: undefined,
    text: async () => JSON.stringify({ action: 'delete', id: 'PLAN-5' }),
  });
  const deletePayload = await deleteResponse.json();
  check('the plan route withdraws a plan', deletePayload.ok === true && deletePayload.plan.deletedAt !== null, JSON.stringify(deletePayload));

  const noteRoute = routes.find((route) => route.path === '/api/organiser/note');
  const noteResponse = await noteRoute.fetch({
    url: '/api/organiser/note',
    signal: undefined,
    text: async () => JSON.stringify({ action: 'save', date: '2026-11-21', body: 'Cleaned the car early.' }),
  });
  const notePayload = await noteResponse.json();
  check('the note route saves the day note', notePayload.ok === true && notePayload.note.date === '2026-11-21', JSON.stringify(notePayload));

  const badResponse = await noteRoute.fetch({
    url: '/api/organiser/note',
    signal: undefined,
    text: async () => JSON.stringify({ action: 'wobble' }),
  });
  check('an unknown route action is a 400', badResponse.status === 400);

  const afterApply = await getRoute.fetch({ url: '/api/organiser?from=2026-11-17&to=2026-11-18', signal: undefined });
  const afterPayload = await afterApply.json();
  check('the range route carries the automations', afterPayload.automations.length === 1 && afterPayload.automationsAvailable === true);

  const reminderRoute = routes.find((route) => route.path === '/api/organiser/reminder');
  const reminderResponse = await reminderRoute.fetch({
    url: '/api/organiser/reminder',
    signal: undefined,
    text: async () => JSON.stringify({ title: 'Dentist', date: '2026-11-18', time: '15:00', leadMinutes: 60, timeZone: zone }),
  });
  const reminderPayload = await reminderResponse.json();
  check('the reminder route creates a task', reminderPayload.ok === true && reminderPayload.task.title === 'Dentist', JSON.stringify(reminderPayload));

  const automationRoute = routes.find((route) => route.path === '/api/organiser/automation');
  const automationResponse = await automationRoute.fetch({
    url: '/api/organiser/automation',
    signal: undefined,
    text: async () => JSON.stringify({ title: 'Supplier research', instruction: 'Find three suppliers.', date: '2026-11-18', time: '09:00', repeat: 'once', timeZone: zone }),
  });
  const automationPayload = await automationResponse.json();
  check('the automation route creates a task', automationPayload.ok === true && automationPayload.task.title === 'Supplier research', JSON.stringify(automationPayload));

  const deleteAutomation = await automationRoute.fetch({
    url: '/api/organiser/automation',
    signal: undefined,
    text: async () => JSON.stringify({ action: 'delete', id: 'A1' }),
  });
  const deleteAutomationPayload = await deleteAutomation.json();
  check('the automation route deletes a task', deleteAutomationPayload.ok === true && deleteAutomationPayload.deleted === true);
  check('the delete reaches the schedule service', edits.some((edit) => edit.id === 'A1' && edit.action === 'delete'), JSON.stringify(edits));

  const refused = await automationRoute.fetch({
    url: '/api/organiser/automation',
    signal: undefined,
    text: async () => JSON.stringify({ title: 'No instruction', date: '2026-11-18', time: '09:00', timeZone: zone }),
  });
  check('an automation without an instruction is a 400', refused.status === 400);

  // ── the config path ───────────────────────────────────────────────────────
  const resolved = resolveConfig({});
  check('the store lives under the home calendar dir', resolved.dbPath === dbPath, resolved.dbPath);
  check('the ambient zone is the default', resolved.timeZone === zone, resolved.timeZone);
  check('an invalid ambient zone falls back', isValidZone(resolveZone({ home: path.join(home, 'nowhere') })), resolveZone({ home: path.join(home, 'nowhere') }));
  check('row config can pin the zone', resolveConfig({ timeZone: 'Europe/London' }).timeZone === 'Europe/London');

  const dirMode = statSync(path.join(home, 'calendar')).mode & 0o777;
  check('the data directory is private', dirMode === 0o700, dirMode.toString(8));
  check('the store created its file', readdirSync(path.join(home, 'calendar')).some((name) => name.startsWith('plans.db')));

  const doomed = store.addPlan({ date: '2026-11-22', title: 'Throw this away' });
  const removed = store.deletePlan(doomed.id);
  check('delete withdraws the plan from every list', removed.deletedAt !== null && store.listPlans({ from: '2026-11-22', to: '2026-11-22', status: 'all' }).every((plan) => plan.id !== doomed.id));
  check('a withdrawn plan still reads by id', store.getPlan(doomed.id).deletedAt !== null);

  for (const dispose of disposers) if (typeof dispose === 'function') dispose();
} finally {
  store.close();
  rmSync(home, { recursive: true, force: true });
  if (previousHome === undefined) delete process.env.DSH_HOME;
  else process.env.DSH_HOME = previousHome;
}


// ── the browser half ─────────────────────────────────────────────────────────
// Loaded through the harness, which evaluates the artifact and hands back its
// `__logic` seam. Only the pure parts run here: dates, grouping, and the two
// registrations. React never renders outside the browser.
const { loadClient } = await import('../../test/client-harness.mjs');
const { api: client, registration } = loadClient(fileURLToPath(new URL('./client.js', import.meta.url)));
const L = client.__logic;

check('one client registration, with the package id', registration.id === '@local/dsh-organiser');
check('a week starts on Monday', L.startOfWeek('2026-11-17') === '2026-11-16', L.startOfWeek('2026-11-17'));
check(
  'a week is seven days, ending on Sunday',
  L.weekOf('2026-11-17').join(',') === '2026-11-16,2026-11-17,2026-11-18,2026-11-19,2026-11-20,2026-11-21,2026-11-22',
  L.weekOf('2026-11-17').join(','),
);

const cells = L.monthCells('2026-11');
check('a month grid is six rows, Monday first', cells.length === 42 && cells[0].date === '2026-10-26', cells[0].date);
check('the 17th sits in the grid where it belongs', cells[22].date === '2026-11-17', cells[22].date);
check('only the month’s own days count as in-month', cells.filter((cell) => cell.inMonth).length === 30);

check('an all-day event is its own date', L.eventDay({ allDay: true, start: '2026-11-19' }, 'Australia/Brisbane') === '2026-11-19');
check(
  'a late event belongs to the next day in the user’s zone',
  L.eventDay({ start: '2026-11-17T23:30:00Z' }, 'Australia/Brisbane') === '2026-11-18',
  L.eventDay({ start: '2026-11-17T23:30:00Z' }, 'Australia/Brisbane'),
);
check('the same instant is still the 17th in UTC', L.eventDay({ start: '2026-11-17T23:30:00Z' }, 'UTC') === '2026-11-17');
check('a note preview is its first non-empty line', L.notePreview('\nfirst line\nsecond') === 'first line');
check(
  'a calendar keeps one colour and calendars differ',
  L.calendarColor('Work') === L.calendarColor('Work') && L.calendarColor('Work') !== L.calendarColor('Personal'),
);
check('minutes are read in the user zone', L.minutesOf('2026-11-17T09:30:00+10:00', 'Australia/Brisbane') === 570);
check('minutes follow the zone, not the offset', L.minutesOf('2026-11-17T23:30:00Z', 'UTC') === 1410);
const packed = L.packLanes([{ start: 540, end: 600 }, { start: 570, end: 630 }, { start: 600, end: 660 }]);
check('overlapping blocks take separate lanes', packed.lanes === 2 && packed.placed[1].lane === 1, JSON.stringify(packed.placed));
check('the mini month shows the ISO week', L.weekNumber('2026-11-17') === 47, String(L.weekNumber('2026-11-17')));
check(
  'a long preview is cut to length with an ellipsis',
  L.notePreview('x'.repeat(90), 20).length === 20 && L.notePreview('x'.repeat(90), 20).endsWith('…'),
);

const grouped = L.groupByDay([{ d: 'a', n: 1 }, { d: 'a', n: 2 }, { d: 'b', n: 3 }], (item) => item.d);
check('grouping keeps order inside a day', grouped.get('a').map((item) => item.n).join(',') === '1,2');

const slots = [];
const dicts = [];
const effects = [];
client.apply({
  effect: (fn) => {
    effects.push(fn);
    fn();
  },
  locale: {
    register: (ns, dictionary) => {
      dicts.push([ns, dictionary]);
      return () => {};
    },
    bind: () => (key) => key,
  },
  slots: {
    inject: (_name, callback) => callback(),
    register: (spec, component) => {
      slots.push({ spec, component });
      return () => {};
    },
  },
});
check(
  'the panel entry and the page are registered',
  slots.length === 2 &&
    slots[0].spec.name === 'sidebar.panellist' &&
    slots[0].spec.id === 'organiser' &&
    slots[1].spec.name === 'main' &&
    slots[1].spec.key === 'organiser',
  slots.map((slot) => slot.spec.name).join(','),
);
check('the dictionaries cover both host languages', Boolean(dicts[0]?.[1]?.en && dicts[0]?.[1]?.zh));
check('the panel label goes through the dictionary', slots[0].spec.label() === 'panel');
check('the page receives its translator', typeof slots[1].spec.inject().t === 'function');
check('the stylesheet and dictionaries are effects', effects.length === 2);

console.log(failures === 0 ? '\nselftest PASS' : `\nselftest FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
