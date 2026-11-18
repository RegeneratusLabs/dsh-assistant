# Verification: the output verification flow

Some design-agent native environments (such as Claude.ai Artifacts) have a built-in `fork_verifier_agent` that spawns a subagent to check things by taking iframe screenshots. Most agent environments (Claude Code / Codex / Cursor / Trae / etc.) have no such built-in capability — doing it manually with Playwright covers the same verification scenarios.

## 🔴 Rule zero: verify your verification tool first

**Before you trust any render result, confirm that the renderer itself renders correctly.** This comes before all other verification, because when the tool is untrustworthy, every later step hands you a fake green light.

Two real-world failures (2026-09, one PPTX delivery using a client's template):

- **Thumbnails produced by macOS `qlmanage -t` let 4 bugs through, each of which caused overlapping text**. It takes a simplified
  render path and is far more forgiving about line spacing than real PowerPoint — going through all 20 pages one by one looked
  correct, and the moment the user opened it in WPS the text was sitting on top of text. **A thumbnail is not a render; do not use it as acceptance evidence.**
- **LibreOffice on macOS renders a Chinese PPTX as nothing but tofu boxes**, which briefly made everyone think the file was broken.

**How to tell whether the problem is the tool or the artifact: run a controlled experiment.**
Hand a **known-good file of the same kind** to the same renderer — in the second case above, take the client's official template
original and render it; its Chinese disappears in exactly the same way, and you can immediately conclude the problem is the
environment, not your file. This step saves hours of investigating in the wrong direction.

**Credibility ranking (macOS)**:

| Tool | Trustworthy? |
|---|---|
| `qlmanage -t` thumbnail | ❌ not acceptable as acceptance evidence |
| LibreOffice headless | ⚠️ layout trustworthy, fonts/Chinese may vanish wholesale |
| Keynote + AppleScript export to PDF | ✅ the automation-friendly first choice, a real typesetting engine |
| The target application itself (PowerPoint / WPS), opened | ✅ final confirmation, by a human |

⚠️ **Do not inject keystrokes with System Events** to drive GUI page-turning screenshots — the keystrokes land in whatever
window the user is currently typing into. Either use AppleScript's document-level API (such as Keynote's `export`) or look
at it by hand.

**Then add a mechanical check that depends on no renderer at all**: character-by-character text comparison (source data vs
artifact, which must be exactly equal after `re.sub(r'\s+','')`), and per-page element counts. A renderer can fool your eyes; it cannot fool counts.

---

## Verification checklist

Verification answers "is it broken"; "is it good" is the polish loop's job (`references/polish-loop.md`, look at full-size screenshots screen by screen and then fix). You need to do both.

After every HTML output, run this checklist:

### 1. Browser render check (mandatory)

The most basic thing: **does the HTML open**? On macOS:

```bash
open -a "Google Chrome" "/path/to/your/design.html"
```

Or take a screenshot with Playwright (next section).

### 2. Console error check

The most common problem in an HTML file is a JS error causing a blank white page. Run it through Playwright:

```bash
python3 "$HD/scripts/verify.py" path/to/design.html   # $HD = root directory of this skill
```

This script will:
1. Open the HTML in headless chromium
2. Save a screenshot into the project directory
3. Capture console errors
4. Report status

See `scripts/verify.py` for details.

### 3. Multi-viewport check

If the design is responsive, capture several viewports:

```bash
python3 "$HD/scripts/verify.py" design.html --viewports 1920x1080,1440x900,768x1024,375x667
```

### 4. Interaction check

Tweaks, animations, button toggles — the default static screenshot shows none of that. **Have the user open a browser and click through it**, or record it with Playwright:

```python
page.video.record('interaction.mp4')
```

### 5. Slide-by-slide check

For deck-type HTML, capture one after another:

```bash
python3 "$HD/scripts/verify.py" deck.html --slides 10  # capture the first 10
```

Produces `deck-slide-01.png`, `deck-slide-02.png`... for quick scanning.

## Playwright Setup

First use requires:

```bash
# if it is not installed yet
npm install -g playwright
npx playwright install chromium

# or the Python version
pip install playwright
playwright install chromium
```

If the user already has Playwright installed globally, just use it.

## Screenshot best practices

### Capture the full page

```python
page.screenshot(path='full.png', full_page=True)
```

### Capture the viewport

```python
page.screenshot(path='viewport.png')  # by default only the visible area
```

### Capture a specific element

```python
element = page.query_selector('.hero-section')
element.screenshot(path='hero.png')
```

### High-resolution screenshot

```python
page = browser.new_page(device_scale_factor=2)  # retina
```

### Wait for the animation to finish before capturing

```python
page.wait_for_timeout(2000)  # wait 2 seconds to let the animation settle
page.screenshot(...)
```

## Sending screenshots to the user

### Open a local screenshot directly

```bash
open screenshot.png
```

The user will look at it in their own Preview/Figma/VSCode/browser.

### Upload to an image host and share the link

If a remote collaborator needs to see it (Slack/Feishu/WeChat, say), have the user upload the screenshot with their own image-hosting tool or MCP, get a permanent link, and paste it anywhere.

## When verification fails

### Blank white page

The console definitely has an error. Check first:

1. Whether the React+Babel script tag's integrity hash is correct (see `react-setup.md`)
2. Whether it is a `const styles = {...}` naming collision
3. Whether cross-file components are exported to `window`
4. A JSX syntax error (babel.min.js does not report it; switch to the unminified babel.js)

### Animation stutters

- Record a stretch with the Chrome DevTools Performance tab
- Look for layout thrashing (frequent reflow)
- Prefer `transform` and `opacity` for motion (GPU-accelerated)

### Fonts are wrong

- Check whether the `@font-face` url is reachable
- Check the fallback fonts
- Chinese fonts load slowly: show the fallback first, then switch after loading

### Layout is misaligned

- Check whether `box-sizing: border-box` is applied globally
- Check the `*  margin: 0; padding: 0` reset
- Turn on gridlines in Chrome DevTools to see the actual layout

## Verification = the designer's second pair of eyes

**Always go through it yourself**. When AI writes code you frequently get:

- Looks right but the interaction has a bug
- Static screenshot is good but things misalign on scroll
- Looks good wide but collapses narrow
- Dark mode was never tested
- After a Tweaks toggle some components do not respond

**The last minute of verification saves an hour of rework**.

## Common verification script commands

```bash
# basic: open + screenshot + capture errors
python3 "$HD/scripts/verify.py" design.html

# multiple viewports
python3 "$HD/scripts/verify.py" design.html --viewports 1920x1080,375x667

# multiple slides
python3 "$HD/scripts/verify.py" deck.html --slides 10

# output to a specific directory
python3 "$HD/scripts/verify.py" design.html --output ./screenshots/

# headless=false, opens a real browser for you to look at
python3 "$HD/scripts/verify.py" design.html --show
```

## Hard verification of video artifacts (verify-video.sh)

Rendered MP4s/final cuts are not checked by eye; verify them with a script (verification on the HTML compositing side is handled by `hyperframes check`'s five-gate audit; this script only covers the artifact side):

```bash
# a finished cut (requires an audio track by default)
bash scripts/verify-video.sh final.mp4 --duration=22 --fps=60 --width=1920 --height=1080

# a silent intermediate artifact
bash scripts/verify-video.sh raw.mp4 --duration=10 --fps=60 --no-audio

# a cinematic opening on a deliberate black frame
bash scripts/verify-video.sh film.mp4 --duration=30 --fps=60 --allow-black-open
```

Checks: resolution/frame rate, duration error (±2%), presence of an audio stream (the machine enforcement of the no-audio = unfinished hard rule), leading/trailing black frames (blackdetect, the typical symptom of a recording-start offset or a loop jump-back), LUFS loudness (target −14±4 for a finished cut). A non-zero exit code means delivery is not allowed.
