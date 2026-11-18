#!/usr/bin/env python3
"""
learn.py — make the studio understand this user a little better with every project.

Experience lives on two layers:
  Ships with the skill  references/experience.md — general findings (reproduced across two projects, or measured), true for anyone;
                        hand-edited in the repo, this command does not write it.
  Local, private        ~/.dsh-studio/experience.md (STUDIO_HOME moves it) — this machine's user:
                        their own words, their taste, observations seen in only one project. Never distributed.

Usage:
  python3 scripts/learn.py [topic…]            before starting: read this user's preferences + experience related to the topics
  python3 scripts/learn.py add "…" --kind preference|observed|verified|superseded \
          --topics deck,color --evidence "words/project/file/measurement" [--do "what to do next time"] [--project name]
  python3 scripts/learn.py harvest <project dir>   after wrapping up: list what in the project could serve as evidence, and the test for whether to record it
  python3 scripts/learn.py status
  python3 scripts/learn.py -- status           when the topic word is literally add/harvest/status, separate it with --

Ported from `om learn` in huashu-motion (same author, MIT), with the dependency on studio commentary removed.
"""

import argparse
import json
import os
import re
import sys
from datetime import date
from pathlib import Path

KINDS = {
    'preference': 'the user said it out loud — quote them verbatim; holds for this user until they change their mind',
    'observed': 'seen in one project only — a clue, not a rule',
    'verified': 'reproduced in two or more projects, or measured — the general ones eventually go into references/experience.md',
    'superseded': 'no longer true — keep the entry, write down what replaced it',
}

SKILL_ROOT = Path(__file__).resolve().parent.parent
SHIPPED = SKILL_ROOT / 'references' / 'experience.md'

HEAD = """# Local experience (Studio)

What projects on this machine have taught. Written by `learn.py add`, and editable by hand: fix an entry in place when it is wrong,
and when it no longer holds change kind to superseded and say why. Not distributed with the skill.
"""


def home() -> Path:
    return Path(os.environ.get('STUDIO_HOME') or Path.home() / '.dsh-studio')


def local_file() -> Path:
    return home() / 'experience.md'


class LearnError(Exception):
    pass


def entries(path: Path, layer: str):
    """In a markdown file, each "## …" heading plus its body is one entry."""
    if not path.exists():
        return []
    out = []
    for block in re.split(r'\n(?=## )', path.read_text(encoding='utf-8')):
        if not block.startswith('## '):
            continue
        head = block.split('\n', 1)[0][3:].strip()
        m = re.search(r'·\s*(preference|observed|verified|superseded)\b', head)   # also accept it when a hand edit dropped the trailing ·
        kind = m.group(1) if m else ('shipped' if layer == 'shipped' else 'observed')
        t = re.search(r'topics?:\s*([^\n·]+)', head, re.I)
        tags = [x for x in re.split(r'[,，\s]+', t.group(1) if t else '') if x]
        idm = re.match(r'(L\d+)', head)
        out.append({'layer': layer, 'head': head, 'kind': kind, 'tags': tags,
                    'body': block.strip(), 'id': idm.group(1) if idm else None})
    return out


def recall(topics):
    want = [t.lower() for t in topics]

    def match(e):
        return not want or any(t in [x.lower() for x in e['tags']] or t in e['body'].lower() for t in want)

    local = entries(local_file(), 'local')
    shipped = entries(SHIPPED, 'shipped')
    prefs = [e for e in local if e['kind'] == 'preference']
    rest = [e for e in local if e['kind'] not in ('preference', 'superseded') and match(e)] + \
           [e for e in shipped if match(e)]
    on = f' ({", ".join(want)})' if want else ''
    parts = []
    if prefs:
        parts.append(f'## This user\'s preferences ({len(prefs)} entries) — their own words; they hold until they change their mind. '
                     f'Note: preferences have a scope; one that says it applies only to some material must not spill over into the default for every design\n\n'
                     + '\n\n'.join(e['body'] for e in prefs))
    else:
        parts.append(f'## This user\'s preferences: nothing recorded yet ({local_file()})')
    if rest:
        parts.append(f'## Experience from past projects{on} ({len(rest)} entries) — when the current project conflicts with an entry, the project wins; then go fix the entry\n\n'
                     + '\n\n'.join(('[local] ' if e['layer'] == 'local' else '') + e['body'] for e in rest))
    else:
        parts.append(f'## Experience from past projects{on}: no matches')
    return '\n\n'.join(parts)


def add_entry(kind, topics, text, evidence, todo=None, project=None):
    if kind not in KINDS:
        raise LearnError('learn.py add needs --kind ' + '|'.join(KINDS) + '\n' +
                         '\n'.join(f'  {k:<11} {v}' for k, v in KINDS.items()))
    tags = [x for x in re.split(r'[,，\s]+', topics or '') if x]
    if not tags:
        raise LearnError('learn.py add needs --topics (for example deck,color,direction), otherwise it cannot be found again next time')
    if not (text or '').strip():
        raise LearnError('learn.py add needs the finding written out as text: learn.py add "…" --kind … --topics … --evidence …')
    if not (evidence or '').strip():
        raise LearnError('learn.py add needs --evidence: the exact words, the project and files, the measurement — an entry nobody can check is just a rumour')
    if kind == 'preference' and not re.search(r'[「“"]', text):
        raise LearnError('preference must quote the user\'s own words: put the quote in quotation marks, e.g. "…"')
    f = local_file()
    f.parent.mkdir(parents=True, exist_ok=True)
    prev = f.read_text(encoding='utf-8') if f.exists() else HEAD
    n = 1 + max([0] + [int(e['id'][1:]) for e in entries(f, 'local') if e['id']])
    block = [f'## L{n} · {date.today().isoformat()} · {kind} · topics: {", ".join(tags)}', '',
             f'- {"Quote" if kind == "preference" else "Finding"}: {text.strip()}']
    if todo:
        block.append(f'- Next time: {todo.strip()}')
    block.append(f'- Evidence: {evidence.strip()}' + (f' ({project})' if project else ''))
    f.write_text(prev.rstrip() + '\n\n' + '\n'.join(block) + '\n', encoding='utf-8')
    return f'Recorded  L{n} → {f}'


def harvest(project: Path):
    if not project.is_dir():
        raise LearnError(f'Not a directory: {project}')
    lines = [f'Harvest  {project}']
    approved = project / 'direction-approved.md'
    if approved.exists():
        lines += ['', 'direction-approved.md (which of the three directions they picked, and how they said it — the most direct evidence of taste):',
                  approved.read_text(encoding='utf-8').strip()[:3000]]
    directions = project / 'directions.md'
    if directions.exists():
        lines += ['', f'directions.md is at: {directions} (direction cards; read them against their choice to see which logic and which intensity they lean towards, not just which colour)']
    demos = sorted((project / 'design-demos').glob('dir-*.html')) if (project / 'design-demos').is_dir() else []
    if demos:
        lines.append(f'design-demos: {len(demos)} complete directions' + (' (plus the thumbnail page thumbs.html)' if (project / 'design-demos' / 'thumbs.html').exists() else ''))
    ledger = home() / 'ledger.jsonl'
    if ledger.exists():
        mine = [l for l in ledger.read_text(encoding='utf-8').splitlines()
                if l.strip() and json.loads(l).get('project_dir') == str(project.resolve())]
        lines.append(f'Appearance ledger: {len(mine)} entries for this project' + ('' if mine else ' — shipped without logging it? run design_lint.py ledger add'))
    lines += ['', 'Then find what they said in the conversation — quote it word for word.', '',
              'Record it only when all three hold: it is not obvious; it saves time or a wrong turn on the next project; this project produced evidence. Then, in order:',
              '  1. Does an existing entry say the opposite? Fix that entry first (learn.py lists them; edit the file directly).',
              '  2. Can a tool catch it (one of design_lint.py\'s checks)? Change the tool and its test instead of writing it down.',
              '  3. Otherwise: learn.py add "…" --kind preference|observed --topics … --evidence "…" [--do "…"].',
              '     Their own words are a preference, and state its scope ("only for their own covers"); what you saw in one project is observed.',
              '  4. Seen in two projects, or measured, and true for anyone (not this user\'s taste)? On the development machine',
              '     write it into references/experience.md, which ships with the skill, and fold the stable part into the reference it belongs to.',
              f'Local experience: {local_file()}']
    return '\n'.join(lines)


def status():
    f = local_file()
    local = entries(f, 'local')
    shipped = entries(SHIPPED, 'shipped')
    by = {k: sum(1 for e in local if e['kind'] == k) for k in KINDS}
    s = (f'Local {f}' + (f' ({len(local)} entries: preferences {by["preference"]}, observed {by["observed"]}, '
                         f'verified {by["verified"]}, superseded {by["superseded"]})' if f.exists() else ' (none yet)'))
    return s + f'\n{len(shipped)} entries ship with the skill, in references/experience.md'


def main(argv=None):
    for stream in (sys.stdout, sys.stderr):   # the Windows console is not UTF-8 by default
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass
    argv = list(sys.argv[1:] if argv is None else argv)
    try:
        if argv and argv[0] == '--':
            print(recall(argv[1:]))
        elif argv and argv[0] == 'add':
            p = argparse.ArgumentParser(prog='learn.py add')
            p.add_argument('text')
            p.add_argument('--kind', required=True)
            p.add_argument('--topics', required=True)
            p.add_argument('--evidence', default='')
            p.add_argument('--do', dest='todo')
            p.add_argument('--project')
            a = p.parse_args(argv[1:])
            print(add_entry(a.kind, a.topics, a.text, a.evidence, a.todo, a.project))
        elif argv and argv[0] == 'harvest':
            if len(argv) < 2:
                raise LearnError('usage: learn.py harvest <project dir>')
            print(harvest(Path(argv[1])))
        elif argv and argv[0] == 'status':
            print(status())
        else:
            print(recall(argv))
    except LearnError as e:
        print(str(e), file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
