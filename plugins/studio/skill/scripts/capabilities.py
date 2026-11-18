#!/usr/bin/env python3
"""
capabilities.py — see what the user actually has on hand, which decides the material tier (see references/materials.md).

Read-only: checks the skill directories, whether keys exist in the environment (presence only, values never printed), and whether a few commands are installed.
Not detected does not mean not available (Codex ships image_gen, for example); if the user says they have it, the user is right.

Usage: python3 scripts/capabilities.py [--json]
"""

import json
import os
import shutil
import sys
from pathlib import Path

SKILL_DIRS = ['~/.claude/skills', '~/.agents/skills', '~/.codex/skills', '~/.cursor/skills',
              '.claude/skills', '.agents/skills']
IMAGE_SKILLS = ['huashu-gpt-image', 'nano-banana-pro', 'lovart-api']
SIBLINGS = {
    'huashu-gpt-image': 'npx skills add alchaincyf/huashu-gpt-image',
    'huashu-art-motion': 'npx skills add alchaincyf/huashu-art-motion',
    'huashu-md-html': 'npx skills add alchaincyf/huashu-md-html',
    'huashu-3djs': None,
    'huashu-flow-diagram': None,
    'huashu-motion': None,
}
IMAGE_KEYS = ['OPENAI_API_KEY', 'GEMINI_API_KEY']   # presence only; this skill has no script that calls an image API directly, so a key does not mean images can be generated


def installed_skills():
    found = {}
    for d in SKILL_DIRS:
        p = Path(d).expanduser()
        if p.is_dir():
            for s in p.iterdir():
                if (s / 'SKILL.md').exists():
                    found.setdefault(s.name, str(s))
    return found


def detect():
    skills = installed_skills()
    keys = [k for k in IMAGE_KEYS if os.environ.get(k)]
    image = [s for s in IMAGE_SKILLS if s in skills]
    tools = {t: bool(shutil.which(t)) for t in ('node', 'ffmpeg', 'npx')}
    tools['playwright(py)'] = False
    try:   # the wrapper being installed is not enough; chromium must be there too
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            tools['playwright(py)'] = Path(p.chromium.executable_path).exists()
    except Exception:
        pass
    siblings = {s: skills.get(s) for s in SIBLINGS}
    # the tiers are not a ladder: T0 is always there; image generation (an image skill is installed) adds T1; an installed sibling skill adds T2
    tier = ['T0'] + (['T1'] if image else []) + (['T2'] if any(siblings.values()) else [])
    return {'tier': '+'.join(tier), 'image_skills': image, 'image_keys': keys,
            'siblings': siblings, 'tools': tools}


def main():
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass
    r = detect()
    if '--json' in sys.argv:
        print(json.dumps(r, ensure_ascii=False, indent=2))
        return 0
    print(f'Material tier: {r["tier"]} (T0 is available to everyone; T1 can generate images; T2 has sibling skills installed. See references/materials.md)')
    print('Image generation: ' + (', '.join(r['image_skills']) if r['image_skills'] else 'no image-generation skill detected')
          + '. If your runtime ships its own image tool (Codex image_gen, say), or the user says so, that also counts as T1')
    if r['image_keys'] and not r['image_skills']:
        print(f'  Keys in the environment: {"+".join(r["image_keys"])}; this skill does not call an image API directly, so install huashu-gpt-image before claiming image generation')
    have = [s for s, p in r['siblings'].items() if p]
    print('Sibling skills: ' + ('+'.join(have) if have else 'none'))
    print('Tools: ' + '  '.join(f'{k} {"✓" if v else "✗"}' for k, v in r['tools'].items()))
    missing = [(s, cmd) for s, cmd in SIBLINGS.items() if cmd and not r['siblings'][s]]
    if missing:
        print('Missing ones do not block anything; when relevant to this task, recommend one at delivery:')
        for s, cmd in missing:
            print(f'  {s}: {cmd}')
    if not r['tools']['playwright(py)']:
        print('Screenshots and the design check need: pip install playwright pillow && playwright install chromium')
    return 0


if __name__ == '__main__':
    sys.exit(main())
