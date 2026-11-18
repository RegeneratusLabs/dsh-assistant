# Tweaks: real-time parameter tuning for design variants

Tweaks is one of this skill's core capabilities — it lets the user switch variations and adjust parameters in real time without touching code.

**Cross agent-environment fit**: some native design-agent environments (e.g. Claude.ai Artifacts) rely on the host's postMessage to write tweak values back into source files for persistence. This skill uses a **pure front-end localStorage approach** — same effect (state survives a refresh), but persistence happens in browser localStorage rather than in source files. This approach works in any agent environment (Claude Code / Codex / Cursor / Trae / etc.).

## When to add Tweaks

- The user explicitly asks for "tunable parameters" / "switching between versions"
- The design has several variations that need comparing
- The user did not ask, but you judge that **a few instructive tweaks would show the user the possibilities**

Default recommendation: **add 2-3 tweaks to every design** (colour theme / font size / layout variant) even if the user did not ask — showing the user the possibility space is part of the design service.

## Implementation (pure front-end version)

### Basic structure

```jsx
const TWEAK_DEFAULTS = {
  "primaryColor": "#2F6F5E",
  "fontSize": 16,
  "density": "comfortable",
  "dark": false
};

function useTweaks() {
  const [tweaks, setTweaks] = React.useState(() => {
    try {
      const stored = localStorage.getItem('design-tweaks');
      return stored ? { ...TWEAK_DEFAULTS, ...JSON.parse(stored) } : TWEAK_DEFAULTS;
    } catch {
      return TWEAK_DEFAULTS;
    }
  });

  const update = (patch) => {
    const next = { ...tweaks, ...patch };
    setTweaks(next);
    try {
      localStorage.setItem('design-tweaks', JSON.stringify(next));
    } catch {}
  };

  const reset = () => {
    setTweaks(TWEAK_DEFAULTS);
    try {
      localStorage.removeItem('design-tweaks');
    } catch {}
  };

  return { tweaks, update, reset };
}
```

### Tweaks panel UI

A floating panel in the bottom-right corner. Collapsible:

```jsx
function TweaksPanel() {
  const { tweaks, update, reset } = useTweaks();
  const [open, setOpen] = React.useState(false);

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
    }}>
      {open ? (
        <div style={{
          background: 'white',
          border: '1px solid #e5e5e5',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          width: 280,
          fontFamily: 'system-ui',
          fontSize: 13,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <strong>Tweaks</strong>
            <button onClick={() => setOpen(false)} style={{
              border: 'none', background: 'none', cursor: 'pointer', fontSize: 16,
            }}>×</button>
          </div>

          {/* color */}
          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ marginBottom: 4, color: '#666' }}>Primary colour</div>
            <input 
              type="color" 
              value={tweaks.primaryColor} 
              onChange={e => update({ primaryColor: e.target.value })}
              style={{ width: '100%', height: 32 }}
            />
          </label>

          {/* font size slider */}
          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ marginBottom: 4, color: '#666' }}>Font size ({tweaks.fontSize}px)</div>
            <input 
              type="range" 
              min={12} max={24} step={1}
              value={tweaks.fontSize}
              onChange={e => update({ fontSize: +e.target.value })}
              style={{ width: '100%' }}
            />
          </label>

          {/* density options */}
          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ marginBottom: 4, color: '#666' }}>Density</div>
            <select 
              value={tweaks.density}
              onChange={e => update({ density: e.target.value })}
              style={{ width: '100%', padding: 6 }}
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </label>

          {/* dark mode toggle */}
          <label style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <input 
              type="checkbox" 
              checked={tweaks.dark}
              onChange={e => update({ dark: e.target.checked })}
            />
            <span>Dark mode</span>
          </label>

          <button onClick={reset} style={{
            width: '100%',
            padding: '8px 12px',
            background: '#f5f5f5',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
          }}>Reset</button>
        </div>
      ) : (
        <button 
          onClick={() => setOpen(true)}
          style={{
            background: '#1A1A1A',
            color: 'white',
            border: 'none',
            borderRadius: 999,
            padding: '10px 16px',
            fontSize: 12,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >⚙ Tweaks</button>
      )}
    </div>
  );
}
```

### Applying the Tweaks

Use Tweaks in the main component:

```jsx
function App() {
  const { tweaks } = useTweaks();

  return (
    <div style={{
      '--primary': tweaks.primaryColor,
      '--font-size': `${tweaks.fontSize}px`,
      background: tweaks.dark ? '#0A0A0A' : '#FAFAFA',
      color: tweaks.dark ? '#FAFAFA' : '#1A1A1A',
    }}>
      {/* your content */}
      <TweaksPanel />
    </div>
  );
}
```

Using the variables in CSS:

```css
button.cta {
  background: var(--primary);
  color: white;
  font-size: var(--font-size);
}
```

## Typical Tweak options

What tweaks to add for each kind of design:

### General
- Primary colour (colour picker)
- Font size (slider 12-24px)
- Typeface (select: display font vs body font)
- Dark mode (toggle)

### Slide deck
- Theme (light/dark/brand)
- Background style (solid/gradient/image)
- Type contrast (more decorative vs more restrained)
- Information density (minimal/standard/dense)

### Product prototype
- Layout variant (layout A / B / C)
- Interaction speed (animation speed 0.5x-2x)
- Data volume (number of mock records 5/20/100)
- State (empty/loading/success/error)

### Animation
- Speed (0.5x-2x)
- Loop (once/loop/ping-pong)
- Easing (linear/easeOut/spring)

### Landing page
- Hero style (image/gradient/pattern/solid)
- CTA copy (a few variants)
- Structure (single column / two column / sidebar)

## Tweaks design principles

### 1. Meaningful options, not busywork

Every tweak must expose a **real design decision**. Do not add tweaks nobody would ever actually switch (e.g. a border-radius slider from 0-50px — the user drags it and finds every intermediate value ugly).

Good tweaks expose **discrete, considered variations**:
- "Corner style": square / slightly rounded / heavily rounded (three options)
- Not: "corner radius": 0-50px slider

### 2. Less is more

A design's Tweaks panel gets **at most 5-6** options. More than that and it becomes a "settings page", losing the point of quickly exploring variations.

### 3. The defaults are the finished design

Tweaks are **a bonus**. The default values must themselves be a complete, shippable design. What the user sees after closing the Tweaks panel is the output.

### 4. Sensible grouping

When there are many options, group them:

```
---- Visual ----
Primary colour | Font size | Dark mode

---- Layout ----
Density | Sidebar position

---- Content ----
Data shown | State
```

## Forward compatibility with source-level persistence hosts

If you later want the design to also run in environments that support source-level tweaks (e.g. Claude.ai Artifacts), keep the **EDITMODE marker block**:

```jsx
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primaryColor": "#2F6F5E",
  "fontSize": 16,
  "density": "comfortable",
  "dark": false
}/*EDITMODE-END*/;
```

The marker block **does nothing** under the localStorage approach (it is just an ordinary comment), but hosts that support writing back to source will read it and achieve source-level persistence. Adding it is harmless in the current environment and keeps you forward compatible.

## Common questions

**The Tweaks panel covers the design content**
→ Make it closable. Closed by default, showing a small button that expands on click.

**The user has to set the same tweaks again after switching**
→ localStorage is already in use. If it does not persist across a refresh, check whether localStorage is available (incognito mode fails; you must catch it).

**Several HTML pages should share tweaks**
→ Add the project name to the localStorage key: `design-tweaks-[projectName]`.

**I want relationships between tweaks**
→ Add the logic in `update`:

```jsx
const update = (patch) => {
  let next = { ...tweaks, ...patch };
  // coupling: switching to dark mode also flips the text colour
  if (patch.dark === true && !patch.textColor) {
    next.textColor = '#F0EEE6';
  }
  setTweaks(next);
  localStorage.setItem(...);
};
```
