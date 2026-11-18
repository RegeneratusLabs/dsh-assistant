# Animation Pitfalls: the bugs hit in HTML animation, and the rules

The bugs hit most often when doing animation, and how to avoid them. Every rule here comes from a real failure.

Read this before writing animation; it saves a round of iteration.

## 1. Stacking layout — `position: relative` is a default obligation

**The bug**: a sentence-wrap element wrapped 3 bracket-layers (`position: absolute`). No `position: relative` was set on sentence-wrap, so the absolute brackets used `.canvas` as their coordinate system and floated 200px past the bottom of the screen.

**Rule**:
- Any container holding `position: absolute` children **must** explicitly set `position: relative`
- Even when no visual "offset" is needed, write `position: relative` as the coordinate anchor
- If you are writing `.parent { ... }` whose children include `.child { position: absolute }`, add relative to the parent reflexively

**Quick check**: for every `position: absolute`, count ancestors upward and confirm the nearest positioned ancestor is the coordinate system you *want*.

## 2. Character traps — do not rely on rare Unicode

**The bug**: wanted `␣` (U+2423 OPEN BOX) to visualize a "space token". Neither Noto Serif SC nor Cormorant Garamond has that glyph; it rendered as blank/tofu and the audience saw nothing at all.

**Rule**:
- **Every character that appears in the animation must exist in the font you chose**
- Common rare-character blacklist: `␣ ␀ ␐ ␋ ␨ ↩ ⏎ ⌘ ⌥ ⌃ ⇧ ␦ ␖ ␛`
- To express meta-characters like "space / return / tab", use a **CSS-built semantic box**:
  ```html
  <span class="space-key">Space</span>
  ```
  ```css
  .space-key {
    display: inline-flex;
    padding: 4px 14px;
    border: 1.5px solid var(--accent);
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.3em;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  ```
- Emoji must be verified too: some emoji fall back to a gray box in fonts outside Noto Emoji; best to use an `emoji` font-family or SVG

## 3. Data-driven Grid/Flex templates

**The bug**: the code had `const N = 6` tokens, but the CSS hardcoded `grid-template-columns: 80px repeat(5, 1fr)`. The 6th token had no column, so the whole matrix was misaligned.

**Rule**:
- When the count comes from a JS array (`TOKENS.length`), the CSS template should be data-driven too
- Option A: inject a CSS variable from JS
  ```js
  el.style.setProperty('--cols', N);
  ```
  ```css
  .grid { grid-template-columns: 80px repeat(var(--cols), 1fr); }
  ```
- Option B: use `grid-auto-flow: column` and let the browser extend it
- **Never combine "a fixed number + a JS constant"** — change N and the CSS will not follow

## 4. Transition gaps — scene changes must be continuous

**The bug**: between zoom1 (13-19s) and zoom2 (19.2-23s) the main sentence was already hidden; zoom1 fade out (0.6s) + zoom2 fade in (0.6s) + stagger delay (0.2s+) = about a second of pure blank screen. The audience thought the animation had frozen.

**Rule**:
- When switching scenes continuously, fade out and fade in must **overlap**; do not let the previous one vanish completely before the next begins
  ```js
  // Bad:
  if (t >= 19) hideZoom('zoom1');      // 19.0s out
  if (t >= 19.4) showZoom('zoom2');    // 19.4s in → 0.4s of blank in between

  // Good:
  if (t >= 18.6) hideZoom('zoom1');    // start the fade out 0.4s early
  if (t >= 18.6) showZoom('zoom2');    // fade in at the same time (cross-fade)
  ```
- Or use an "anchor element" (such as the main sentence) as the visual link between scenes; it briefly echoes during the zoom switch
- Do the arithmetic on CSS transition durations so the next step never fires before a transition ends

## 5. Pure Render principle — animation state must be seekable

**The bug**: `setTimeout` + `fireOnce(key, fn)` were used to trigger animation states in a chain. Normal playback was fine, but for frame-by-frame recording / seeking to an arbitrary time, a setTimeout that already fired cannot "go back in time".

**Rule**:
- `render(t)` should ideally be a **pure function**: given t it outputs exactly one DOM state
- If a side effect is unavoidable (class switching, say), use a `fired` set with an explicit reset:
  ```js
  const fired = new Set();
  function fireOnce(key, fn) { if (!fired.has(key)) { fired.add(key); fn(); } }
  function reset() { fired.clear(); /* clear all .show classes */ }
  ```
- Expose `window.__seek(t)` for Playwright / debugging:
  ```js
  window.__seek = (t) => { reset(); render(t); };
  ```
- Animation-related setTimeout must not span >1 second, or seeking backwards falls apart

## 6. Measuring before fonts load = measuring wrong

**The bug**: `charRect(idx)` was called on DOMContentLoaded to measure bracket positions, before the fonts had loaded; every character width was the fallback font's width, so every position was wrong. Once the fonts loaded (~500ms later) the brackets' `left: Xpx` still held the old values — permanently offset.

**Rule**:
- Any layout code that depends on DOM measurement (`getBoundingClientRect`, `offsetWidth`) **must** be wrapped in `document.fonts.ready.then()`
  ```js
  document.fonts.ready.then(() => {
    requestAnimationFrame(() => {
      buildBrackets(...);  // fonts are ready now, measurements are accurate
      tick();              // animation starts
    });
  });
  ```
- The extra `requestAnimationFrame` gives the browser a frame to commit layout
- With the Google Fonts CDN, `<link rel="preconnect">` speeds up first load

## 7. Recording preparation — leave handles for video export

**The bug**: Playwright `recordVideo` defaults to 25fps and starts recording as soon as the context is created. The first 2 seconds of page load and font load were recorded. The delivered video began with 2 seconds of blank/white flash.

**Rule**:
- Provide `render-video.js` to handle it: warmup navigate → reload to restart the animation → wait for the duration → ffmpeg trim head + convert to H.264 MP4
- The animation's **frame 0** must be the complete initial state with the final layout already in place (not blank, not loading)
- Want 60fps? Use ffmpeg `minterpolate` in post; do not count on the browser's source frame rate
- Want a GIF? Two-stage palette (`palettegen` + `paletteuse`); a 30s 1080p animation compresses to 3MB

See `video-export.md` for the full script invocation.

## 8. Batch export — the tmp directory must carry a PID against concurrent collisions

**The bug**: 3 processes ran `render-video.js` in parallel on 3 HTML files. Because TMP_DIR was named with `Date.now()` only, 3 processes starting in the same millisecond shared one tmp directory. The first to finish cleaned up the tmp directory; the other two got `ENOENT` while reading it and all crashed.

**Rule**:
- Any temporary directory that multiple processes might share must be named with a **PID or random suffix**:
  ```js
  const TMP_DIR = path.join(DIR, '.video-tmp-' + Date.now() + '-' + process.pid);
  ```
- If you really want multi-file parallelism, use the shell's `&` + `wait` rather than forking inside one node script
- For batch recording of many HTML files, be conservative: run **serially** (2 at most in parallel; 3 or more queue up honestly)

## 9. Progress bar / replay button in the recording — Chrome elements pollute the video

**The bug**: the animation HTML added a `.progress` bar, a `.replay` button and a `.counter` timestamp to help humans debug playback. When recorded to MP4 for delivery, those elements sat at the bottom of the video, as if DevTools had been captured into it.

**Rule**:
- Manage "chrome elements" for humans (progress bar / replay button / footer / masthead / counter / phase labels) separately from the video content itself
- **Agree on a class name** `.no-record`: any element with this class is hidden automatically by the recording script
- The script side (`render-video.js`) injects CSS by default to hide common chrome class names:
  ```
  .progress .counter .phases .replay .masthead .footer .no-record [data-role="chrome"]
  ```
- Inject with Playwright's `addInitScript` (it applies before every navigate, so reload is covered too)
- To see the original HTML (with chrome), add the `--keep-chrome` flag

## 10. The first seconds of the recording repeat — warmup frames leaking

**The bug**: the old `render-video.js` flow was `goto → wait fonts 1.5s → reload → wait duration`. Recording starts when the context is created, so the animation had already played during warmup and then restarted from 0 on reload. The result: the first seconds of the video were "mid-animation + a cut + animation from 0", strongly repetitive.

**Rule**:
- **Warmup and Record must use separate contexts**:
  - Warmup context (no `recordVideo` option): only loads the url, waits for fonts, then closes
  - Record context (with `recordVideo`): starts from a fresh state; the animation is recorded from t=0
- ffmpeg `-ss trim` can only cut Playwright's small startup latency (~0.3s); it **cannot** be used to hide warmup frames — the source must be clean
- Closing the recording context is when the webm file is written to disk; that is a Playwright constraint
- The code pattern:
  ```js
  // Phase 1: warmup (throwaway)
  const warmupCtx = await browser.newContext({ viewport });
  const warmupPage = await warmupCtx.newPage();
  await warmupPage.goto(url, { waitUntil: 'networkidle' });
  await warmupPage.waitForTimeout(1200);
  await warmupCtx.close();

  // Phase 2: record (fresh)
  const recordCtx = await browser.newContext({ viewport, recordVideo });
  const page = await recordCtx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(DURATION * 1000);
  await page.close();
  await recordCtx.close();
  ```

## 11. Do not draw "fake chrome" inside the frame — decorative player UI collides with real chrome

**The bug**: the animation used the `Stage` component, which already ships a scrubber + timecode + pause button (`.no-record` chrome, hidden on export). I then drew a "`00:60 ──── CLAUDE-DESIGN / ANATOMY`" magazine-page-number-style decorative progress bar at the bottom of the frame, feeling good about it. **Result**: the user saw two progress bars — one the Stage controller, one my decoration. Visually they collided completely and it was judged a bug. "Why is there a second progress bar inside the video?"

**Rule**:

- Stage already provides: scrubber + timecode + pause/replay buttons. **Do not draw** progress indicators, a current timecode, a copyright byline strip, or a chapter counter inside the frame — they either collide with chrome or are filler slop (violating "earn its place").
- "Page-number feel", "magazine feel", "byline strip at the bottom" — these **decorative urges** are high-frequency filler that AI adds automatically. Be alert every time one appears: does it convey irreplaceable information? Or is it just filling space?
- If you firmly believe a bottom strip must exist (e.g. the animation's subject *is* player UI), it must be **narratively necessary** and **visually clearly distinct from the Stage scrubber** (different position, different form, different tone).

**Element ownership test** (every element drawn into the canvas must pass it):

| What it belongs to | Handling |
|--------------------|----------|
| Narrative content of a given act | OK, keep it |
| Global chrome (for control/debugging) | Add the `.no-record` class, hidden on export |
| **Belongs to no act and is not chrome** | **Delete it**. It is an ownerless thing, and necessarily filler slop |

**Self-check (3 seconds before delivery)**: take one static screenshot and ask yourself —

- Is there anything in the frame that "looks like video player UI" (a horizontal progress bar, a timecode, something shaped like control buttons)?
- If so, is the narrative damaged by deleting it? If not, delete it.
- Does the same class of information (progress/time/byline) appear twice? Merge it into chrome in one place.

**Counter-examples**: `00:42 ──── PROJECT NAME` drawn at the bottom, a "CH 03 / 06" chapter counter in the bottom-right corner, a version number "v0.3.1" at the frame edge — all fake-chrome filler.

## 12. Blank lead-in + recording offset — the triple trap of `__ready` × tick × lastTick

**The bug (A · blank lead-in)**: a 60-second animation exported to MP4 had 2-3 seconds of blank page at the start. `ffmpeg --trim=0.3` could not cut it.

**The bug (B · offset start, a real 2026-04-20 incident)**: exported a 24-second video; the user's impression was "the video only starts playing its first frame at 19 seconds". In reality recording began at animation t=5, ran to t=24, then looped back to t=0 and recorded 5 more seconds to the end — so the video's last 5 seconds were the animation's real beginning.

**Root cause** (both bugs share one):

Playwright `recordVideo` starts writing WebM from the moment of `newContext()`; at that point Babel/React/font loading together take L seconds (2-6s). The recording script waits for `window.__ready = true` as the anchor for "the animation starts here" — it must be strictly paired with animation `time = 0`. There are two common ways to get it wrong:

| Mistake | Symptom |
|---------|---------|
| `__ready` set in `useEffect` or a synchronous setup phase (before tick's first frame) | The recording script thinks the animation started while WebM is still recording a blank page → **blank lead-in** |
| tick's `lastTick = performance.now()` initialized at **script top level** | The L seconds of font loading are counted into the first frame's `dt`, `time` jumps to L instantly → the whole recording lags by L seconds → **offset start** |

**✅ The correct full starter tick template** (hand-written animation must use this skeleton):

```js
// ━━━━━━ state ━━━━━━
let time = 0;
let playing = false;   // ❗ do not play by default; start once fonts are ready
let lastTick = null;   // ❗ sentinel — dt is forced to 0 on the first tick (don't use performance.now())
const fired = new Set();

// ━━━━━━ tick ━━━━━━
function tick(now) {
  if (lastTick === null) {
    lastTick = now;
    window.__ready = true;   // ✅ the pair: "recording start" and "animation t=0" in the same frame
    render(0);               // render again to be sure the DOM is ready (fonts are ready now)
    requestAnimationFrame(tick);
    return;
  }
  const dt = (now - lastTick) / 1000;   // time only advances after the first frame
  lastTick = now;

  if (playing) {
    let t = time + dt;
    if (t >= DURATION) {
      t = window.__recording ? DURATION - 0.001 : 0;  // no loop while recording; keep the 0.001s so the last frame survives
      if (!window.__recording) fired.clear();
    }
    time = t;
    render(time);
  }
  requestAnimationFrame(tick);
}

// ━━━━━━ boot ━━━━━━
// Do not rAF at top level — wait for fonts to finish loading before starting
document.fonts.ready.then(() => {
  render(0);                 // paint the initial frame first (fonts are ready)
  playing = true;
  requestAnimationFrame(tick);  // the first tick pairs __ready with t=0
});

// ━━━━━━ seek interface (for render-video's defensive correction)━━━━━━
window.__seek = (t) => { fired.clear(); time = t; lastTick = null; render(t); };
```

**Why this template is right**:

| Link | Why it must be this way |
|------|-------------------------|
| `lastTick = null` + a first-frame `return` | Stops the L seconds between script load and tick's first execution from being counted as animation time |
| `playing = false` by default | During font loading `tick` may run without advancing time, avoiding mis-rendered frames |
| `__ready` set on tick's first frame | The recording script starts its clock right then, and the corresponding picture is the animation's true t=0 |
| Starting tick inside `document.fonts.ready.then(...)` | Avoids fallback-font width measurement and first-frame font jumps |
| `window.__seek` exists | Lets `render-video.js` correct proactively — the second line of defense |

**The matching defenses on the recording script side**:
1. `addInitScript` injects `window.__recording = true` (before page goto)
2. `waitForFunction(() => window.__ready === true)`, and records the offset at that moment as the ffmpeg trim
3. **Additionally**: after `__ready`, proactively `page.evaluate(() => window.__seek && window.__seek(0))`, forcing any time drift in the HTML back to zero — the second line of defense, for HTML that does not follow the starter template strictly

**How to verify**: after exporting the MP4
```bash
ffmpeg -i video.mp4 -ss 0 -vframes 1 frame-0.png
ffmpeg -i video.mp4 -ss $DURATION-0.1 -vframes 1 frame-end.png
```
The first frame must be the animation's t=0 initial state (not mid-way, not black); the last frame must be the animation's final state (not some moment of a second loop).

**Reference implementation**: the Stage component in `assets/animations.jsx` and `scripts/render-video.js` both implement this protocol. Hand-written HTML must adopt the starter tick template — every line defends against a specific bug.

## 13. Looping is forbidden while recording — the `window.__recording` signal

**The bug**: the animation Stage defaults to `loop=true` (convenient in the browser). `render-video.js` keeps recording 300ms past the duration as a buffer before stopping, and those 300ms push the Stage into its next cycle. When ffmpeg `-t DURATION` cuts, the last 0.5-1s falls in the next cycle — the video's ending suddenly jumps back to the first frame (Scene 1) and the audience thinks the video is broken.

**Root cause**: there is no "I am recording" handshake between the recording script and the HTML. The HTML does not know it is being recorded and keeps looping as if this were an interactive browser session.

**Rule**:

1. **Recording script**: inject `window.__recording = true` in `addInitScript` (before page goto):
   ```js
   await recordCtx.addInitScript(() => { window.__recording = true; });
   ```

2. **Stage component**: recognize the signal and force loop=false:
   ```js
   const effectiveLoop = (typeof window !== 'undefined' && window.__recording) ? false : loop;
   // ...
   if (next >= duration) return effectiveLoop ? 0 : duration - 0.001;
   //                                                       ↑ keep 0.001 so Sprite end=duration is not cut off
   ```

3. **fadeOut of the closing Sprite**: in a recording context set `fadeOut={0}`, otherwise the video's end fades to transparent/dark — the user expects to stop on a clear last frame, not a fade out. For hand-written HTML, use `fadeOut={0}` on closing Sprites.

**Reference implementation**: the Stage in `assets/animations.jsx` / `scripts/render-video.js` both ship the handshake. A hand-written Stage must implement `__recording` detection — otherwise recording will always hit this trap.

**Verify**: after exporting the MP4, `ffmpeg -ss 19.8 -i video.mp4 -frames:v 1 end.png` and check whether the last 0.2 seconds is still the expected final frame, with no sudden switch to another scene.

## 14. 60fps video defaults to frame duplication — minterpolate has poor compatibility

**The bug**: 60fps MP4s generated by `convert-formats.sh` with `minterpolate=fps=60:mi_mode=mci...` would not open in some macOS QuickTime / Safari versions (all black or refused outright). VLC / Chrome could open them.

**Root cause**: the H.264 elementary stream output by minterpolate contains SEI / SPS fields that some players parse incorrectly.

**Rule**:

- For 60fps by default use the simple `fps=60` filter (frame duplication); compatibility is broad (QuickTime/Safari/Chrome/VLC all open it)
- For high-quality interpolation use the `--minterpolate` flag explicitly — but **test it locally** on the target player before delivery
- The value of the 60fps tag is **algorithmic recognition by upload platforms** (Bilibili / YouTube prioritize 60fps-marked streams); the perceived smoothness gain for CSS animation is slight
- Add `-profile:v high -level 4.0` for broader H.264 compatibility

**`convert-formats.sh` now defaults to compatibility mode**. If you need high-quality interpolation, add the `--minterpolate` flag:
```bash
bash convert-formats.sh input.mp4 --minterpolate
```

## 15. The CORS trap of `file://` + external `.jsx` — single-file delivery must inline the engine

**The bug**: the animation HTML loaded the engine externally with `<script type="text/babel" src="animations.jsx"></script>`. Double-clicked open locally (`file://` protocol) → Babel Standalone pulls the `.jsx` over XHR → Chrome reports `Cross origin requests are only supported for protocol schemes: http, https, chrome, chrome-extension...` → the whole page goes black, reporting no `pageerror`, only a console error, so it is easily misdiagnosed as "the animation did not trigger".

Starting an HTTP server does not necessarily save you — with a global proxy on the machine, `localhost` goes through the proxy too and returns 502 / connection refused.

**Rule**:

- **Single-file delivery (an HTML that works on double-click)** → `animations.jsx` must be **inlined** into a `<script type="text/babel">...</script>` tag; do not use `src="animations.jsx"`
- **Multiple-file projects (start an HTTP server to demo)** → external loading is fine, but state the command explicitly at delivery: `python3 -m http.server 8000`
- The test: what you deliver is an "HTML file" or a "project directory with a server"? The former uses inlining
- The Stage component / animations.jsx are often 200+ lines — pasting them into an HTML `<script>` block is entirely acceptable; do not fear the size

**Minimal verification**: double-click the HTML you generated and **do not** open it through any server. Only if the Stage shows the animation's first frame normally does it pass.

## 16. Cross-scene inverse-color context — do not hardcode colors in frame elements

**The bug**: building a multi-scene animation, elements that **appear in every scene** — `ChapterLabel` / `SceneNumber` / `Watermark` — had `color: '#1A1A1A'` (dark text) hardcoded in the component. The first 4 scenes had light backgrounds, fine; at the 5th, black-background scene, "05" and the watermark disappeared outright — no error, no check triggered, key information invisible.

**Rule**:

- **Frame elements reused across multiple scenes** (chapter labels / scene numbers / timecodes / watermarks / copyright strips) **must not hardcode color values**
- Use one of three approaches:
  1. **`currentColor` inheritance**: the element writes only `color: currentColor`, and the parent scene container sets `color: the computed value`
  2. **invert prop**: the component accepts `<ChapterLabel invert />` to switch light/dark by hand
  3. **Compute from the background**: `color: contrast-color(var(--scene-bg))` (a new CSS 4 API, or a JS check)
- Before delivery, use Playwright to extract **a representative frame from each scene** and check by eye that "cross-scene elements" are all visible

What makes this trap insidious: **there is no bug report**. Only a human eye or OCR can catch it.

## 17. Offline / no-CDN true self-containment — inline React/Babel entirely, and transpile the engine too

**The bug (2026-05 promo animation project)**: the animation HTML used `<script src="https://unpkg.com/react...">` + `<script src=".../@babel/standalone">` from CDNs. The machine had a global proxy, and during Playwright recording chromium got `net::ERR_CONNECTION_CLOSED` from both unpkg and Google Fonts:

1. React/ReactDOM did not load → `window.React undefined`
2. Babel did not load → the JSX inside `<script type="text/babel">` ran as plain JS → `Unexpected token '<'`

After fixing React/Babel came the second trap: **inlining the `animations.jsx` engine as a plain `<script>` still reported `Unexpected token '<'` → `window.Animations is undefined`**. Root cause: **the `animations.jsx` engine itself contains JSX** (`Stage`/`Sprite` components `return (<div>...)`); it was designed to be loaded through `<script type="text/babel">` and transpiled by Babel. Only the app code had been transpiled; the engine was forgotten → that engine's JSX was never compiled.

**Rule** (when building a truly self-contained single file that "opens on double-click / works offline / can be recorded by Playwright"):

- **Inline React + ReactDOM locally**: `curl` down `react.production.min.js` (~10KB) + `react-dom.production.min.js` (~131KB) into the local project, inline them into `<script>`, no CDN
- **Precompile Babel at build time, ship no Babel at runtime**: use `@babel/standalone` (downloaded once, build-only) in node with `Babel.transform(src,{presets:['react']}).code` to turn JSX into `React.createElement`. **Both the app and the `animations.jsx` engine must go through transform** — the engine contains JSX, and skipping it guarantees `Unexpected token '<'`
- **Switch fonts to system fonts**: the Google Fonts CDN gets cut by the proxy too. For Chinese animation use the `'PingFang SC'` (sans) / `'Songti SC'` (serif) system fonts, no network dependence. `document.fonts.ready` resolves immediately for system fonts, so recording does not stall
- **base64-inline image assets**: `<img src="png/x.png">` relative paths do render under `file://`, but for true portability (moving the file does not lose images) inline them as base64 data URLs; convert large background images to JPEG and compress first, then base64
- **Template the build**: leave `__REACT__/__REACTDOM__/__ASSETS__/__ENGINE__` tokens in the HTML template plus a `type="text/jsx-source"` app source block; a node build script reads the tokens and injects (vendor as-is, engine + app through Babel) → writes the final single file. To change the animation, edit the template and re-run the build

**Verify**: Playwright `page.evaluate(()=>({React:typeof window.React, Animations:typeof window.Animations}))` — both should be `object`. Either being `undefined` means the corresponding `<script>` threw (most likely JSX that was not transpiled).

**Relation to pitfall #15**: #15 says "for a single file do not link `.jsx` externally via `src=` (file:// CORS)"; this pitfall goes further — even **remote CDNs for React/Babel/fonts break under a restricted network**, so true self-containment requires full inlining + build-time transpile.

## 18. 【HyperFrames】CSS transition + class switching is nondeterministic under seek rendering

CSS `transition` runs on the wall clock, not the timeline. Frame-by-frame seek rendering takes an independent screenshot per frame, and a transition's intermediate state depends on "how much wall-clock time has passed when this frame is seeked" — entirely nondeterministic: it may sit at the start value forever, or randomly stop in the middle. Measured during the c3 migration (2026-07-17): `.watermark-br` used `transition: opacity 0.6s` + class switching, and its opacity would not obey under seek rendering.

**Fix**: express every state change on the render path as a tween or a pure function of t. When migrating old demos, search the whole file for `transition:` and change each one into a lerp inside `render(t)`; new compositions never write transition in the first place. Transitions on interaction states like hover do not matter (they never fire during rendering).

## 19. 【HyperFrames】The proxy tween's first frame does not fire — add `render(0)` manually

When a proxy tween hangs `render(t)` onto a GSAP timeline (the old-demo adapter route), `onUpdate` is not necessarily called while the timeline sits at t=0 — the first frame may be the HTML's static uninitialized state rather than the `render(0)` picture.

**Fix**: call `render(0)` once by hand, synchronously, after registering the timeline. Full recipe in `references/hyperframes-backend.md`.

## 20. 【HyperFrames】The contrast gate conflicts with dark cinematic — use `--no-contrast`, the other four gates must be 0 errors

`npm run check`'s contrast gate checks all text against WCAG AA 4.5:1. In dark cinematic design, watermarks at 16-40% opacity, mono labels and decorative text are **deliberately** low-contrast (part of the film look) and report errors in bulk, and the framework has no per-element exemption mechanism. On c3, all 42 contrast errors were design intent.

**Fix**: for dark cinematic output use `npx hyperframes check --no-contrast`; the lint/runtime/layout/motion gates must still be 0 errors. **Do not skip contrast for light-background informational output** — errors there are usually genuine readability problems (the readability floor is in SKILL.md, narrow bridge 5).

## 21. 【HyperFrames/GSAP】The immediateRender phantom of fromTo — elements appear seconds early

GSAP's `fromTo()` defaults to `immediateRender: true`: the from state is rendered onto the element while the timeline is being built. If the from state is itself visible (`autoAlpha > 0`), the element shows up in the frame before its tween begins — short effects such as sparks, click rings, ripples and dust are the most vulnerable (B00 hit it 4 times in one build: effects hanging in frame seconds before their landing moment).

**Fix**: add `immediateRender: false` explicitly to every `fromTo()` whose from state is visible; or switch to "set hidden initially + to". Self-check: after rendering, extract the opening frame of each act and look for "effect elements that should not be present".

## 22. 【Camera】Text goes blurry in 3D/zoom mode — magnify with CSS zoom, not transform scale

**Symptom**: pushing in on the page with `transform: scale()` (especially in 3D perspective mode) blurs text; the higher the factor, the blurrier, and beyond 2x it is undeliverable.

**Root cause**: Chromium rasterizes at the element's **layout size** and then enlarges the bitmap. scale only enlarges the bitmap.

**Solution** (shotcraft precedent, the most expensive knowledge in the library): camera-layer magnification uses the **CSS `zoom` property** (layout-level scaling: re-layout and rasterize at the enlarged size, so text is sharp at any factor). For the coordinate math and full formula see `camera-language.md` §3.4 and `gsap-recipes.md` §9.2. Note: `zoom` triggers a re-layout every frame and is the only legal exception to "never tween layout properties"; it is allowed only on the `#world` camera layer; slower renders under offline frame-by-frame rendering are normal — artifact quality comes first. Companion: full-page screenshots from 2x up, plus a separate 4x slice for close-ups that cross-fades in over 6 frames during the push.

## 23. 【Camera】perspective broken by an intermediate layer — 3D flattens instantly

**Symptom**: `perspective` + `preserve-3d` are set, yet the render has no 3D feel at all; every layer lies flat.

**Root cause**: **any intermediate layer** between `#camera` and the 3D children that adds `overflow: hidden`, `filter`, `opacity < 1` or `clip-path` creates a new stacking context and flattens preserve-3d.

**Solution**: in 3D mode, apply filter/opacity effects only to the **innermost elements**; check each layer along the container chain for those four properties. Troubleshooting mantra: from `#camera` to the problem element, run `getComputedStyle` on every layer in between and check those four items.

## 24. 【Camera】pan reveals the edge — blank space outside the canvas while panning

**Symptom**: while the camera pans/tilts, a white or black edge shows at the frame border.

**Root cause**: `#world` is only as large as the viewport, so the camera goes out of bounds as soon as it moves.

**Solution**: extend `#world` outward on all sides by bleed ≥ max pan amplitude + 8% safety margin (camera-language §3.3). Background/atmosphere layers must fill the bleed area too, not just the viewport. Self-check: seek the timeline to both endpoints of each pan segment and screenshot, then look at all four edges.

## Quick self-check list (5 seconds before starting work)

- [ ] Every parent of a `position: absolute` has `position: relative`?
- [ ] The special characters in the animation (`␣` `⌘` `emoji`) all exist in the font?
- [ ] The Grid/Flex template's count matches the JS data length?
- [ ] Scene changes cross-fade, with no >0.3s of pure blank?
- [ ] DOM measurement code wrapped in `document.fonts.ready.then()`?
- [ ] `render(t)` pure, or backed by an explicit reset mechanism?
- [ ] Frame 0 is the complete initial state, not blank?
- [ ] No "fake chrome" decoration in frame (progress bar / timecode / bottom byline colliding with the Stage scrubber)?
- [ ] The animation tick's first frame sets `window.__ready = true` synchronously? (built into animations.jsx; hand-written HTML adds it)
- [ ] Stage detects `window.__recording` and forces loop=false? (mandatory for hand-written HTML)
- [ ] The closing Sprite's `fadeOut` set to 0 (the video ends on a clear frame)?
- [ ] 60fps MP4 defaults to frame-duplication mode (compatibility), with `--minterpolate` only for high-quality interpolation?
- [ ] After export, extracted frame 0 + last frame to confirm they are the animation's initial/final state?
- [ ] Involving a specific brand (Stripe/Anthropic/Lovart/...): did you complete the "brand assets protocol" (SKILL.md narrow bridge 2, five steps)? Did you write `brand-spec.md`?
- [ ] For single-file delivery: is `animations.jsx` inlined rather than `src="..."`? (external .jsx under file:// goes black on CORS)
- [ ] Elements that appear across scenes (chapter labels/watermarks/scene numbers) have no hardcoded colors? Visible on every scene's background?
- [ ] For offline/true self-containment: React+ReactDOM inlined locally, **both the app and the `animations.jsx` engine through Babel transpile**, system fonts? (see pitfall #17; the engine contains JSX, skip the transpile and `Unexpected token '<'` is guaranteed)
- [ ] 【HyperFrames】No CSS `transition` on the render path? All state changes are tweens or pure functions of t? (pitfall #18)
- [ ] 【HyperFrames】`render(0)` added after registering proxy-tween scenes? (pitfall #19)
- [ ] 【HyperFrames】check passed? Dark cinematic uses `--no-contrast`, the other four gates 0 errors? (pitfall #20)
- [ ] 【HyperFrames/GSAP】Every `fromTo()` with a visible from state has `immediateRender:false`? (pitfall #21, 4 phantoms measured on B00)
- [ ] 【Camera】3D/zoom close-ups use CSS `zoom`, not blurry scale magnification? (pitfall #22)
- [ ] 【Camera】No overflow/filter/opacity/clip-path on the layers between `#camera` and the 3D elements? (pitfall #23)
- [ ] 【Camera】`#world` extended with bleed, pan endpoints show no blank edges? (pitfall #24)
