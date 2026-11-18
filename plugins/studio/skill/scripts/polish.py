#!/usr/bin/env python3
"""
polish.py — the eye for polish-by-looking: cut the page into full-size screenshots, one screen at a time, and measure a few things you can check.

A full-page screenshot shrunk into a single image makes the type and the spacing unreadable, so the problems stay invisible too. This script shoots screen by screen at viewport height, so you look the way a user scrolls; it also counts the graphics, the characters and the blank space on each screen, and records a polish entry in the project. It measures facts only; it does not judge whether it looks good.

Usage:
  python3 scripts/polish.py shot page.html [--viewport 1440x900] [--mobile] [--max 12]
      Shoot screen by screen into <page dir>/polish/<file name>/round-N/, N increments automatically;
      --mobile also shoots 390x844; prints the facts for each screen, and appends this round's blank-space record to polish-log.md
  python3 scripts/polish.py thumbs design-demos/thumbs.html
      Check whether every cell of the thumbnail page (containers with a data-thumb attribute) really draws something, rather than being a placeholder block of colour
  python3 scripts/polish.py log <dir>
      Read that directory's polish-log.md: how many rounds each page has had, and whether any round shot screenshots but never wrote down what it saw

Dependencies: pip install playwright pillow && playwright install chromium (if missing it says so and exits; that is not a failure)
"""

import argparse
import io
import re
import sys
from datetime import date
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Only warn "nearly blank screen" when the background covers at least this share of a screen AND there is no graphics:
# quiet, airy designs often sit above 80% background and should not be flagged
BLANK_RATIO = 0.93
# Minimum content for one thumbnail cell: below these it is usually a placeholder block rather than this candidate's key screen
THUMB_MIN_CHARS = 6
THUMB_MIN_NODES = 6
THUMB_BLANK = 0.90

TILE_JS = r"""
([top, h]) => {
  const vis = (e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    const y0 = r.top + window.scrollY, y1 = y0 + r.height;
    if (y1 <= top || y0 >= top + h) return null;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return null;
    return r;
  };
  let graphics = 0, chars = 0, big = 0;
  for (const e of document.querySelectorAll('img,svg,canvas,video,picture')) {
    const r = vis(e); if (!r) continue;
    if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') continue;
    if (r.width * r.height >= 48 * 48) graphics++;          // anything under 48px square counts as an icon, not as graphics
  }
  for (const e of document.querySelectorAll('body *')) {
    const r = vis(e); if (!r) continue;
    const cs = getComputedStyle(e);
    if (cs.backgroundImage && cs.backgroundImage !== 'none' && r.width * r.height >= 200 * 120) graphics++;
    for (const n of e.childNodes) if (n.nodeType === 3) {
      const t = n.textContent.trim(); if (!t) continue;
      chars += t.length;
      if (parseFloat(cs.fontSize) >= 64) big = Math.max(big, parseFloat(cs.fontSize));
    }
  }
  return { graphics, chars, big };
}
"""

THUMB_JS = r"""
() => [...document.querySelectorAll('[data-thumb]')].map((e) => {
  const r = e.getBoundingClientRect();
  return { id: e.getAttribute('data-thumb') || '', x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height,
           chars: (e.innerText || '').replace(/\s+/g, '').length, nodes: e.querySelectorAll('*').length };
})
"""


def need_playwright():
    try:
        from playwright.sync_api import sync_playwright  # noqa: F401
        from PIL import Image  # noqa: F401
        return True
    except ImportError:
        print("Playwright for Python or Pillow is not installed, so this step is skipped. Install: pip install playwright pillow && playwright install chromium")
        print("When skipping, shoot screen by screen with whatever screenshots you have (one per screen, never the whole page squeezed into one), and check them yourself against references/polish-loop.md.")
        return False


def blank_ratio(img):
    """Share of the frame taken by the most common colour (downscale and quantise first, to erase anti-aliasing noise)."""
    small = img.convert("RGB").resize((96, 60))
    q = small.quantize(colors=24)
    counts = sorted(q.getcolors(), reverse=True)
    return counts[0][0] / (96 * 60)


def next_round(base):
    n = 1
    while (base / f"round-{n}").exists():
        n += 1
    return n


def unfilled_rounds(log, page_name):
    """Which rounds of this page, in the polish log, left all three "most damaging problems" empty."""
    if not log.exists():
        return []
    out = []
    for block in re.split(r"^## ", log.read_text(encoding="utf-8"), flags=re.MULTILINE)[1:]:
        m = re.match(re.escape(page_name) + r" · round (\d+)", block)
        if not m:
            continue
        seg = block.split("Three most damaging problems", 1)[-1].split("What changed this round", 1)[0]
        if not any(re.sub(r"^\d+\.\s*", "", ln).strip() for ln in seg.split("\n") if re.match(r"^\d+\.", ln)):
            out.append(int(m.group(1)))
    return out


def cmd_log(a):
    """Check before wrapping up: did every round of every page in the directory write down what it saw."""
    log = Path(a.dir).resolve() / "polish-log.md"
    if not log.exists():
        print(f"✗ {log} does not exist: no polish round has run yet (polish.py shot <page.html>).")
        return 1
    text = log.read_text(encoding="utf-8")
    pages = sorted(set(re.findall(r"^## (.+?) · round \d+", text, re.MULTILINE)))
    bad = 0
    for pg in pages:
        rounds = len(re.findall(r"^## " + re.escape(pg) + r" · round \d+", text, re.MULTILINE))
        empty = unfilled_rounds(log, pg)
        bad += bool(empty)
        print(f"  {'✗' if empty else '✓'} {pg}: {rounds} rounds" + (f", rounds {', '.join(map(str, empty))} left the three most damaging problems empty" if empty else ""))
    if bad:
        print("\nSome rounds are empty: open that round's screenshots one by one, and fill in the three most damaging problems and what you changed.")
    return 1 if bad else 0


def cmd_shot(a):
    if not need_playwright():
        return 0
    from playwright.sync_api import sync_playwright
    from PIL import Image

    page_path = Path(a.file).resolve()
    if not page_path.exists():
        print(f"File not found: {page_path}")
        return 2
    base = page_path.parent / "polish" / page_path.stem
    rnd = next_round(base)
    out = base / f"round-{rnd}"
    out.mkdir(parents=True, exist_ok=True)

    views = [("desktop", a.viewport)]
    if a.mobile:
        views.append(("mobile", (390, 844)))

    lines, errors = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for label, (w, h) in views:
            pg = browser.new_page(viewport={"width": w, "height": h})
            pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.goto(page_path.as_uri(), wait_until="domcontentloaded")
            try:
                pg.wait_for_load_state("networkidle", timeout=8000)
            except Exception:
                pass
            pg.wait_for_timeout(a.wait)
            total = pg.evaluate("Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)")
            n = max(1, min(a.max, -(-total // h)))
            full = Image.open(io.BytesIO(pg.screenshot(full_page=True)))
            scale = full.width / w
            thin_run = 0
            lines.append(f"{label} {w}x{h}: full page {total}px, {-(-total // h)} screens" + (f" (only the first {n} screens shot)" if n < -(-total // h) else ""))
            for i in range(n):
                top = i * h
                box = (0, int(top * scale), full.width, int(min(total, top + h) * scale))
                tile = full.crop(box)
                name = f"{label}-{i + 1:02d}.png"
                tile.save(out / name)
                facts = pg.evaluate(TILE_JS, [top, h])
                br = blank_ratio(tile)
                notes = []
                if br >= BLANK_RATIO and facts["graphics"] == 0:
                    notes.append("nearly blank screen")
                if facts["graphics"] == 0 and not facts["big"]:
                    thin_run += 1
                    if thin_run >= 2:
                        notes.append(f"{thin_run} screens in a row have only text and boxes: no graphics, no large type")
                else:
                    thin_run = 0
                lines.append(f"  {name}  graphics {facts['graphics']}  text {facts['chars']} chars  background {br:.0%}"
                             + (f"  largest type {facts['big']:.0f}px" if facts["big"] else "")
                             + ("  ← " + "; ".join(notes) if notes else ""))
            pg.close()
        browser.close()

    print(f"Round {rnd} screenshots: {out}")
    print("\n".join(lines))
    if errors:
        print(f"{len(errors)} console errors; fix these first:")
        for e in errors[:5]:
            print("  " + e[:160])
    if any("only text and boxes" in x for x in lines):
        print("\nSeveral screens in a row have only text and boxes: those screens have not been designed yet. Write the screen-by-screen script as references/steady-track.md section 3 describes, "
              "give each screen a different form (product UI plus annotations, data as image, before/after, a demo you can play with…), then redo those screens.")
    print("\nNow open the screenshots above one by one and look at the originals (do not just read these numbers), write down the three most damaging problems as references/polish-loop.md asks, fix them, and run another round.")

    log = page_path.parent / "polish-log.md"
    unfilled = unfilled_rounds(log, page_path.name)
    if unfilled:
        print(f"\n⚠ {page_path.name}: the three most damaging problems for rounds {', '.join(map(str, unfilled))} are still empty. Shooting screenshots without writing down what you saw is the same as not looking: "
              "go back, open that round's screenshots, and fill in the three problems and the changes.")
    head = "" if log.exists() else "# Polish log\n\nEvery round: look at the full-size screenshots screen by screen, write down the three most damaging problems, fix them, shoot again.\n"
    with log.open("a", encoding="utf-8") as f:
        f.write(f"{head}\n## {page_path.name} · round {rnd} · {date.today().isoformat()}\n\n"
                f"Screenshots: `polish/{page_path.stem}/round-{rnd}/`\n\n" + "\n".join("    " + x for x in lines) + "\n\n"
                "Three most damaging problems (which screen, which element):\n1. \n2. \n3. \n\nWhat changed this round:\n\n")
    print(f"Appended this round's record to {log}; fill in the three most damaging problems and what changed.")
    return 0


def cmd_thumbs(a):
    if not need_playwright():
        return 0
    from playwright.sync_api import sync_playwright
    from PIL import Image

    page_path = Path(a.file).resolve()
    if not page_path.exists():
        print(f"File not found: {page_path}")
        return 2
    with sync_playwright() as p:
        browser = p.chromium.launch()
        pg = browser.new_page(viewport={"width": 1600, "height": 1000})
        pg.goto(page_path.as_uri(), wait_until="domcontentloaded")
        try:
            pg.wait_for_load_state("networkidle", timeout=8000)
        except Exception:
            pass
        pg.wait_for_timeout(800)
        cells = pg.evaluate(THUMB_JS)
        full = Image.open(io.BytesIO(pg.screenshot(full_page=True)))
        browser.close()

    if not cells:
        print("No cells with a data-thumb attribute were found. Add data-thumb=\"1\"…\"6\" to each cell's container and run it again.")
        return 1
    bad = 0
    for c in cells:
        crop = full.crop((int(c["x"]), int(c["y"]), int(c["x"] + c["w"]), int(c["y"] + c["h"])))
        br = blank_ratio(crop) if crop.width > 4 and crop.height > 4 else 1.0
        why = []
        if c["chars"] < THUMB_MIN_CHARS:
            why.append(f"only {c['chars']} characters")
        if c["nodes"] < THUMB_MIN_NODES:
            why.append(f"only {c['nodes']} elements")
        if br >= THUMB_BLANK:
            why.append(f"{br:.0%} is the same colour")
        empty = len(why) >= 2
        bad += empty
        print(f"  {'✗' if empty else '✓'} cell {c['id'] or '?'}  {c['w']:.0f}x{c['h']:.0f}  {c['chars']} chars / {c['nodes']} elements / background {br:.0%}"
              + ("  ← still a placeholder: " + "; ".join(why) if empty else ""))
    if len(cells) < 6:
        print(f"Only {len(cells)} cells. Three logics with two candidates each means there should be 6.")
    if bad:
        print(f"\n{bad} cells are still placeholders and do not count as candidates. Each cell has to draw the single most important screen of its candidate: real headline, real palette, real skeleton, and the hero asset visible."
              "\nWhen you cannot draw it, start from the matching style specimen .html source under assets/style-specimens/ (change the subject, the colours, the words); see references/steady-track.md.")
        return 1
    print("\nAll six cells draw something. Next, open the screenshots yourself and look: which three are strongest on their own, and most different from each other.")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("shot")
    s.add_argument("file")
    s.add_argument("--viewport", default="1440x900", type=lambda v: tuple(int(x) for x in v.lower().split("x")))
    s.add_argument("--mobile", action="store_true", help="also shoot 390x844")
    s.add_argument("--max", type=int, default=12, help="maximum screens to shoot per viewport")
    s.add_argument("--wait", type=int, default=1200, help="how many milliseconds to wait after load before shooting (for fonts and entrance animation)")
    t = sub.add_parser("thumbs")
    t.add_argument("file")
    g = sub.add_parser("log")
    g.add_argument("dir", help="directory that holds polish-log.md")
    a = ap.parse_args(argv)
    return {"shot": cmd_shot, "thumbs": cmd_thumbs, "log": cmd_log}[a.cmd](a)


if __name__ == "__main__":
    sys.exit(main())
