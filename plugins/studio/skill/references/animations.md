# Animations: the timeline animation engine

Read this when building animation/motion-design HTML. Principles, usage, typical patterns.

## Core pattern: Stage + Sprite

The studio's animation system (`assets/animations.jsx`) provides a timeline-driven engine:

- **`<Stage>`**: the container for the whole animation, automatically providing auto-scale (fit viewport) + scrubber + play/pause/loop controls
- **`<Sprite start end>`**: a time segment. A Sprite is only visible between `start` and `end`. Inside it, the `useSprite()` hook reads its own local progress `t` (0→1)
- **`useTime()`**: reads the current global time (seconds)
- **`Easing.easeInOut` / `Easing.easeOut` / ...**: easing functions
- **`interpolate(t, from, to, easing?)`**: interpolates by t

The pattern borrows from Remotion/After Effects, but is lightweight and has zero dependencies.

## Getting started

```html
<script type="text/babel" src="animations.jsx"></script>
<script type="text/babel">
  const { Stage, Sprite, useTime, useSprite, Easing, interpolate } = window.Animations;

  function Title() {
    const { t } = useSprite();  // local progress 0→1
    const opacity = interpolate(t, [0, 1], [0, 1], Easing.easeOut);
    const y = interpolate(t, [0, 1], [40, 0], Easing.easeOut);
    return (
      <h1 style={{ 
        opacity, 
        transform: `translateY(${y}px)`,
        fontSize: 120,
        fontWeight: 900,
      }}>
        Hello.
      </h1>
    );
  }

  function Scene() {
    return (
      <Stage duration={10}>  {/* 10-second animation */}
        <Sprite start={0} end={3}>
          <Title />
        </Sprite>
        <Sprite start={2} end={5}>
          <SubTitle />
        </Sprite>
        {/* ... */}
      </Stage>
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<Scene />);
</script>
```

## Common animation patterns

### 1. Fade In / Fade Out

```jsx
function FadeIn({ children }) {
  const { t } = useSprite();
  const opacity = interpolate(t, [0, 0.3], [0, 1], Easing.easeOut);
  return <div style={{ opacity }}>{children}</div>;
}
```

**Watch the range**: `[0, 0.3]` means the fade-in completes in the first 30% of the sprite, and opacity stays at 1 after that.

### 2. Slide In

```jsx
function SlideIn({ children, from = 'left' }) {
  const { t } = useSprite();
  const progress = interpolate(t, [0, 0.4], [0, 1], Easing.easeOut);
  const offset = (1 - progress) * 100;
  const directions = {
    left: `translateX(-${offset}px)`,
    right: `translateX(${offset}px)`,
    top: `translateY(-${offset}px)`,
    bottom: `translateY(${offset}px)`,
  };
  return (
    <div style={{
      transform: directions[from],
      opacity: progress,
    }}>
      {children}
    </div>
  );
}
```

### 3. Typewriter effect (⚠️ tell the two cases apart first; do not pop characters one by one)

The constant-speed per-character typewriter is the official anti-pattern (on the best-practices "AI slop" list: it looks like old-film subtitles). Choose the right one by content:

- **AI output** (tokens streaming in) → Chunk Reveal: irregular blocky emergence, see `animation-best-practices.md` §4.5 / `gsap-recipes.md` §3.4
- **User input** (a real person typing in a field) → 3f per character + a cursor that stays solid, then blinks + occasional backspaces, see #3 of the eight techniques in `ui-demo-animation.md`

### 4. Number count-up

```jsx
function CountUp({ from = 0, to = 100, duration = 0.6 }) {
  const { t } = useSprite();
  const progress = interpolate(t, [0, duration], [0, 1], Easing.easeOut);
  const value = Math.floor(from + (to - from) * progress);
  return <span>{value.toLocaleString()}</span>;
}
```

### 5. Segmented explanation (the classic teaching animation)

```jsx
function Scene() {
  return (
    <Stage duration={20}>
      {/* Phase 1: show the problem */}
      <Sprite start={0} end={4}>
        <Problem />
      </Sprite>

      {/* Phase 2: show the approach */}
      <Sprite start={4} end={10}>
        <Approach />
      </Sprite>

      {/* Phase 3: show the result */}
      <Sprite start={10} end={16}>
        <Result />
      </Sprite>

      {/* caption visible throughout */}
      <Sprite start={0} end={20}>
        <Caption />
      </Sprite>
    </Stage>
  );
}
```

## Easing functions

The preset easing curves:

| Easing | Character | Use for |
|--------|------|------|
| `linear` | Constant speed | Scrolling captions, continuous animation |
| `easeIn` | Slow→fast | Exits, disappearing |
| `easeOut` | Fast→slow | Entrances, appearing |
| `easeInOut` | Slow→fast→slow | Position changes |
| **`expoOut`** ⭐ | **Exponential ease-out** | **The Anthropic-grade primary easing** (physical sense of weight) |
| **`overshoot`** ⭐ | **Elastic overshoot** | **Toggles / buttons popping out / emphasis interactions** |
| `spring` | Spring | Interaction feedback, geometry settling back |
| `anticipation` | Reverse first, then forward | Emphasising a motion |

**Default the primary easing to `expoOut`** (not `easeOut`) — see `animation-best-practices.md` §2.
`expoOut` for entrances, `easeIn` for exits, `overshoot` for toggles — the baseline rules of Anthropic-grade animation.

## Rhythm and duration guidance

### Micro-interactions (0.1-0.3s)
- Button hover
- Card expand
- Tooltip appearing

### UI transitions (0.3-0.8s)
- Page changes
- Modal appearing
- List items joining

### Narrative animation (2-10s per segment)
- One phase of a concept explanation
- The reveal of a data chart
- A scene transition

### A single narrative segment should never exceed 10 seconds
Human attention is finite. Say one thing in 10 seconds, then move to the next.

## The order in which to think about animation

### 1. Content/story first, animation second

**Wrong**: decide you want fancy animation first, then stuff content into it
**Right**: first work out what information must be conveyed, then use animation to serve that information

Animation is a **signal**, not **decoration**. A fade-in emphasises "this matters, look here" — if everything fades in, the signal stops working.

### 2. Write the timeline scene by scene

```
0:00 - 0:03   the problem appears (fade in)
0:03 - 0:06   the problem is magnified/expanded (zoom+pan)
0:06 - 0:09   the solution appears (slide in from right)
0:09 - 0:12   the solution is explained (typewriter)
0:12 - 0:15   the result demoed (counter up + chart reveal)
0:15 - 0:18   one-line summary (static, 3 seconds to read)
0:18 - 0:20   CTA or fade out
```

Write the timeline, then write the components.

### 3. Assets first

The images/icons/fonts the animation needs must be ready **beforehand**. Do not go looking for material halfway through — it breaks the rhythm.

## Common questions

**Animation stutters**
→ Mostly layout thrashing. Use `transform` and `opacity`; do not animate `top`/`left`/`width`/`height`/`margin`. The browser GPU-accelerates `transform`.

**Animation is too fast to follow**
→ A reader needs 100-150ms per Chinese character, 300-500ms per word. If you are telling a story with text, leave at least 3 seconds per sentence.

**Animation is too slow, the audience gets bored**
→ Interesting visual change needs to be dense. A static frame for more than 5 seconds gets dull.

**Several animations interfere with each other**
→ Use CSS `will-change: transform` to tell the browser in advance that this element will move, reducing reflow.

**Recording to video**
→ Use the skill's own toolchain (one command produces three formats): see `video-export.md`
- `scripts/render-video.js` — HTML → 25fps MP4 (Playwright + ffmpeg)
- `scripts/convert-formats.sh` — 25fps MP4 → 60fps MP4 + optimised GIF
- Want more precise frame rendering? Make render(t) a pure function, see item 5 in `animation-pitfalls.md`

## Working with video tools

This skill makes **HTML animation** (running in the browser). If the end product has to serve as video material:

- **Short animation/concept demo**: make HTML animation with the methods here → screen record
- **Long video/narrative** (5-20 minutes with narration): follow the narration-driven track in `references/modules/motion.md` (`voiceover-pipeline.md`), do not outsource to other tools
- **Motion graphics**: professional tools like After Effects/Motion Canvas fit better

## When you need physical animation (spring / decay)

Do not pull in Popmotion (its CDN is guaranteed to fail on restricted networks, violating the self-contained principle — see #17 in `animation-pitfalls.md`). For spring needs go through GSAP: `elastic.out` / `back.out` and custom springEase mappings are in `gsap-recipes.md` §1.2; for landing aftershock use the dampedSettle closed-form solution (`camera-language.md` §9).
