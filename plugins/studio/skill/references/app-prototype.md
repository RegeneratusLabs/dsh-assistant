# App / iOS prototype rules · complete operating manual

> The complete manual for App / iOS prototypes that SKILL.md routes here: choosing an architecture, image sourcing channels and code, the AppPhone JSX skeleton, using ios_frame, and taste anchors.
> The three technical red lines for single-file inline React (style objects must be uniquely named, e.g. `const terminalStyles = {}`; share components between multiple babel scripts with `Object.assign(window, …)`; no `scrollIntoView`) and the pinned versions are in `references/react-setup.md` — read it before writing. The three-direction gate still applies (`references/directions.md`); when three versions of phones sit side by side, add `--ignore-layout` to compare.


When building iOS/Android/mobile app prototypes (triggers: "app prototype", "iOS mockup", "mobile app", "make an app"), the four points below **override** the general placeholder principle — an app prototype is a demo floor; static poses and cream placeholder cards persuade no one.

### 0. Choosing an architecture (decide this first)

**Default to single-file inline React** — all JSX/data/styles written straight into the main HTML's `<script type="text/babel">...</script>` tag, and **do not** load externally with `<script src="components.jsx">`. Reason: under the `file://` protocol browsers block external JS as cross-origin, and forcing the user to start an HTTP server violates the prototype instinct of "double-click and it opens". Referenced local images must be embedded as base64 data URLs; never assume a server exists.

**Split into external files only in two cases**:
- (a) a single file >1000 lines is hard to maintain → split into `components.jsx` + `data.js`, and state the delivery instructions explicitly (the `python3 -m http.server` command + the URL to visit)
- (b) you need multiple subagents writing different screens in parallel → `index.html` + one independent HTML per screen (`today.html`/`graph.html`...), aggregated with an iframe; each screen is also a self-contained single file

**Architecture cheat sheet**:

| Situation | Architecture | Delivery |
|------|------|----------|
| One person building a 4-6 screen prototype (the norm) | single-file inline | one `.html`, double-click to open |
| One person building a large app (>10 screens) | multiple jsx + server | include the start command |
| Multiple agents in parallel | multiple HTML + iframe | `index.html` aggregates; each screen opens on its own |

### 1. Find real images first — don't leave placeholders sitting there

By default, go get real images to fill the design; do not draw SVG, do not park cream cards, do not wait for the user to ask. Common channels:

| Situation | Preferred channel |
|------|---------|
| Art / museum / historical content | Wikimedia Commons (public domain), Met Museum Open Access, Art Institute of Chicago API |
| General life / photography | Unsplash, Pexels (royalty-free) |
| Material the user already has locally | `~/Downloads`, the project's `_archive/`, or the user's configured material library |

Wikimedia download pitfalls (on this machine curl through the proxy blows up on TLS; Python urllib goes straight through):

```python
# A compliant User-Agent is mandatory, otherwise 429
UA = 'ProjectName/0.1 (https://github.com/you; you@example.com)'
# Query the real URL with the MediaWiki API
api = 'https://commons.wikimedia.org/w/api.php'
# action=query&list=categorymembers to batch-fetch a series / prop=imageinfo+iiurlwidth for a thumburl at a given width
```

**Only** when every channel fails / the rights are unclear / the user explicitly asks, fall back to an honest placeholder (still no shoddy SVG).

**Real-image honesty test** (critical): before sourcing an image, ask yourself — "if this image were removed, would the information be damaged?"

| Situation | Judgment | Action |
|------|------|------|
| Cover of an article/essay list, scenery header on a profile page, decorative banner on a settings page | decoration, no intrinsic link to the content | **do not add**. Adding it is AI slop, equivalent to a purple gradient |
| Portraits in museum/person content, actual objects in product detail, locations on a map card | the content itself, intrinsically linked | **must add** |
| Faintest texture behind a graph/visualization | atmosphere, serving the content without stealing the scene | add, but opacity ≤ 0.08 |

**Counterexamples**: pairing an Unsplash "inspiration image" with a text essay, or stock photo models with a notes app — both are AI slop. Permission to use real images is not a license to abuse them.

### 2. Delivery form: default to "tiled + operable", don't ask the user

An iOS app prototype has **exactly one default delivery form, so stop asking the user "tiled or operable"**: **tile 4-6 main screens, and every one of them is interactive**. See the whole thing at a glance (several iPhones side by side), and each one can switch tabs and do basic operations on its screen (expand, toggle, select, open a modal). Give both benefits at once; don't make the user choose.

| Dimension | Default |
|------|---------|
| **Screen count** | Tile **4-6 main screens** (covering the app's core functional surfaces — not a few random ones). With more than 6, take the main 4-6; the rest are reachable within a single phone via tabs/navigation |
| **Layout** | A composed showcase board, not a row of equal-sized phones (see "Showcase board" below); next to each phone, one line labeling which screen it is |
| **Per-phone interaction** | Each phone is its own mini state machine: tab bar switches, in-screen buttons/cards/switches click, modals open — not a static pose |

**Only two special cases deviate from the default** (only when the user says so explicitly; otherwise always the default):
- The user explicitly says "static screenshots only / doesn't need to be clickable / just show me the layout" → fall back to a pure static overview (each phone renders only `ScreenComponent`, no state machine)
- The user explicitly says "demo one flow only / walk through onboarding / single-phone demo" → a single `AppPhone` running the whole flow

**Default skeleton** (tiled phones, each with its own stateful AppPhone):

```jsx
// Each phone = an independent state machine, starting on the main screen it owns
function AppPhone({ initial }) {
  const [screen, setScreen] = React.useState(initial);
  const [modal, setModal] = React.useState(null);
  // Render the matching ScreenComponent per screen, passing onTabChange/onOpen/onClose/onToggle and other callbacks
  return (
    <IosFrame>
      <ScreenComponent
        screen={screen}
        onTabChange={setScreen}
        onOpen={setModal}
        onClose={() => setModal(null)}
      />
    </IosFrame>
  );
}

// Tiled: 4-6 phones side by side, each with initial set to a different main screen
<div style={{display: 'flex', gap: 32, flexWrap: 'wrap', padding: 48, alignItems: 'flex-start'}}>
  {mainScreens.map(s => (
    <div key={s.id}>
      <div style={{fontSize: 13, color: '#666', marginBottom: 8, fontStyle: 'italic'}}>{s.label}</div>
      <AppPhone initial={s.id} />
    </div>
  ))}
</div>
```

Screen components take callback props (`onTabChange`, `onOpen`, `onClose`, `onToggle`, `onAnnotation`) and never hardcode state. TabBar, buttons, work cards and switches get `cursor: pointer` + hover feedback. Each phone starts on a different main screen, but tab switching makes them all reachable from each other — tiling gives the overview, clicking gives depth.

The flex above is only the minimum skeleton that runs; replace it with a showcase board composition before delivery.

#### Showcase board: don't line the phones up in a row

In blind picks, whatever the direction, if it is five or six equal-sized phones spaced evenly in a row, the user's verdict is "too tidy, too boring". However good the screens are, the first thing they see is a tidy table. The showcase board is this direction's first poster; it needs design of its own:

| Device | How | Suits |
|---|---|---|
| Hierarchy | Enlarge the screen that best represents the app to 1.2–1.4× at the visual center, shrink the rest and scatter them around it at uneven heights | almost always; the first choice |
| Flow chain | Arrange in the order of the user's real task, connect screen to screen with a thin line from "where they clicked" to "which screen they went to", label written beside the line | apps with one main task flow (ordering, logging, travel mode) |
| Detail close-up | Beside one screen, a 2–3× close-up of a key component: the signature interaction, a data visualization, one carefully made control | when there is a detail worth remembering |
| Context background | The board's background uses this app's usage context: real photography, subject colors, its materials — not a white canvas | subjects with a strong scene (outdoors, kitchen, night) |
| Board typography | The board has its own title area: app name, one-line positioning, screen labels; type and color from this direction's own system | always |

Only three rules: the board's background color and type follow this direction (a dark direction gets a dark board, not a uniform white canvas); every phone is still clickable; screens are not scaled so small the type is unreadable (no phone narrower than 300px). The three directions' showcase boards must also differ in composition — this is the most easily overlooked difference between the three directions.

### 3. Run a real click test before delivery

Static screenshots only show layout; interaction bugs only surface when you click through. Run 3 minimum click tests with Playwright: enter detail / hit a key annotation / switch tab. Check that `pageerror` is 0 before delivering. Playwright can be invoked via `npx playwright`, or by the machine's global install path (`npm root -g` + `/playwright`).

### 4. Taste anchors (pursue list, and the fallback first choice)

With no design system, default toward these directions to avoid AI slop:

| Dimension | Prefer | Avoid |
|------|------|------|
| **Type** | display chosen per subject (the pairing table in `references/typography.md`), `-apple-system` for body | SF Pro or Inter everywhere — too much like the system default |
| **Color** | sample from the product's subject and real photography (color derivation protocol), one primary color carried throughout | polychrome clustering (unless the data really has ≥3 categorical dimensions) |
| **Information density · restrained** (default) | one less container, one less border, one less **decorative** icon — give the content room to breathe | every card paired with a meaningless icon + tag + status dot |
| **Information density · high density** (exception) | when the product's core selling point is "intelligence / data / context awareness" (AI tools, dashboards, trackers, copilots, pomodoro timers, health monitors, expense trackers), each screen needs **at least 3 places of visible product differentiation**: non-decorative data, dialogue/reasoning fragments, state inference, context linkage | one button and one clock — the sense of AI intelligence never shows, and it is indistinguishable from an ordinary app |
| **Detail signature** | leave one place with texture "worth screenshotting": the faintest oil-painting ground, a serif italic pull quote, a full-screen black-background recording waveform | spreading effort evenly everywhere, so everything ends up bland |

**Both principles apply at once**:
1. Taste = one detail at 120%, the rest at 80% — not everything exquisite, but exquisite enough in the right place
2. Subtraction is the fallback, not a universal law — when the core selling point needs information density to hold it up (AI / data / context-aware products), addition outranks restraint. See "Information density by type" below

### 5. The iOS device frame must use `assets/ios_frame.jsx` — never hand-write the Dynamic Island / status bar

When building an iPhone mockup, you are **hard-bound** to `assets/ios_frame.jsx`. This is a standard shell already aligned to exact iPhone 15 Pro specs: bezel, Dynamic Island (124×36, top:12, centered), status bar (time/signal/battery, cleared on both sides of the island, vertical center aligned to the island's midline), Home Indicator, and content-area top padding are all handled.

**Never write any of the following yourself in your HTML**:
- `.dynamic-island` / `.island` / `position: absolute; top: 11/12px; width: ~120;` a centered black rounded rectangle
- `.status-bar` with a hand-written time/signal/battery icon
- `.home-indicator` / a bottom home bar
- an iPhone bezel's rounded outer frame + black stroke + shadow

Hand-writing it hits position bugs 99% of the time — the status bar's time/battery gets squeezed by the island, or the content top padding is miscalculated and the first line of content sits under the island. The iPhone 15 Pro's notch is **fixed at 124×36 pixels**; the usable width left for the status bar on either side is narrow, not something you estimate by eye.

**Usage (exactly three steps)**:

```jsx
// Step 1: Read this skill's assets/ios_frame.jsx (path relative to this SKILL.md)
// Step 2: Paste the whole iosFrameStyles constant + the IosFrame component into your <script type="text/babel">
// Step 3: Wrap your own screen components in <IosFrame>...</IosFrame>, don't touch the island/status bar/home indicator
<IosFrame time="9:41" battery={85}>
  <YourScreen />  {/* content renders from top 54 down; the bottom is left for the home indicator — not your concern */}
</IosFrame>
```

**Exception**: bypass this only when the user explicitly asks to "pretend it's an iPhone 14 non-Pro notch", "make it Android, not iOS", or "a custom device form" — in that case read the matching `android_frame.jsx` or modify the constants in `ios_frame.jsx`; **do not** start a second island/status bar setup in the project HTML.
