/**
 * The one tool: `studio_library`, the model's way into the same list the Studio
 * page shows.
 *
 * The skill registers a delivered file here at delivery time, so the page is a
 * record of what exists rather than a place the user has to file things by hand.
 * Every write goes through the store's validation; a refused write comes back as
 * one plain sentence the model can act on, never as a thrown shape it cannot
 * read.
 *
 * The tool does not touch the artifact: registering a work records its path, and
 * removing one forgets it. Nothing on disk outside `$DSH_HOME/studio` is read.
 */
import { StudioError } from './store.js';

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

/** A list must stay readable in a tool result; the page has no such limit. */
const MAX_LISTED = 50;
const MAX_SHOWN_PATH = 220;

/** One work as a line: its id, title, module and path — enough to act on next. */
export function workLine(work) {
  const path = work.path.length > MAX_SHOWN_PATH ? `${work.path.slice(0, MAX_SHOWN_PATH - 1)}…` : work.path;
  const theme = work.theme ? `, ${work.theme}` : '';
  return `${work.id}  ${work.title}  [${work.module}${theme}]  ${path}`;
}

/**
 * Build the tool.
 * @param {{ store: object }} context - the open library.
 * @returns the tool definitions.
 */
export function buildTools({ store }) {
  const library = {
    name: 'studio_library',
    description:
      "Keep the Studio's works library — the designs the studio has delivered, as the Studio page lists them. At delivery time register the delivered file with action 'add': give its path, a title, and the module it belongs to (web, deck, infographic, motion or xiaohongshu). Adding the same path again updates that work instead of duplicating it. Use 'list' to see what is registered, and 'remove' with an id to withdraw a work. This only records paths inside the studio's own library directory; it never opens, moves or changes the delivered file, and it does not read anything outside that directory. Record only what was actually delivered.",
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        action: { type: 'string', enum: ['add', 'list', 'remove'], description: 'What to do with the works library.' },
        id: { type: 'string', description: 'The work id, for remove.' },
        path: { type: 'string', description: 'For add: the delivered file, absolute or starting with ~/.' },
        title: { type: 'string', description: 'For add: what the work is, in a few words.' },
        module: { type: 'string', description: 'For add: the studio module it came from — web, deck, infographic, motion or xiaohongshu.' },
        theme: { type: 'string', description: 'For add: an optional theme or direction it explored. An empty string clears it on update.' },
      },
      required: ['action'],
    },
    output,
    async execute(args) {
      const raw = args && typeof args === 'object' ? args : {};
      const verb = raw.action === 'list' ? 'read' : 'saved';
      try {
        if (raw.action === 'add') {
          // The row minus the action is exactly the caller's fields, so an
          // unexpected field is refused by the store with its real name.
          const fields = { ...raw };
          delete fields.action;
          const { work, created } = store.addWork(fields);
          return { message: `${created ? 'Registered' : 'Updated'} ${work.id}: ${work.title} [${work.module}] — ${work.path}` };
        }
        if (raw.action === 'list') {
          const works = store.listWorks();
          if (!works.length) return { message: 'Works: none registered yet. Register a delivered file with action "add".' };
          const shown = works.slice(0, MAX_LISTED);
          const lines = [`Works (${works.length})`, ...shown.map(workLine)];
          if (works.length > shown.length) lines.push(`+${works.length - shown.length} more — remove one to keep the list short.`);
          return { message: lines.join('\n') };
        }
        if (raw.action === 'remove') {
          const removed = store.removeWork(raw.id);
          return { message: `Removed ${removed.id}: ${removed.title}` };
        }
        return { message: `Not saved: "${String(raw.action)}" is not add, list or remove.` };
      } catch (error) {
        if (error instanceof StudioError) return { message: `Not ${verb}: ${error.message}` };
        return { message: `Not ${verb}: ${String(error?.message ?? error)}` };
      }
    },
  };

  return [library];
}
