# React + Babel project rules

The technical rules you must follow when building prototypes with HTML + React + Babel. Break them and it blows up.

## Pinned Script Tags (use exactly these versions)

Put these three script tags in the HTML `<head>`, with **pinned versions + integrity hashes**:

```html
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>
```

**Do not** use unpinned versions like `react@18` or `react@latest` — you get version drift / cache problems.

**Do not** omit `integrity` — if the CDN is ever hijacked or tampered with, this is the line of defence.

## File structure

```
project-name/
├── index.html               # main HTML
├── components.jsx           # component file (loaded with type="text/babel")
├── data.js                  # data file
└── styles.css               # extra CSS (optional)
```

Loading them in the HTML:

```html
<!-- React + Babel first -->
<script src="https://unpkg.com/react@18.3.1/..."></script>
<script src="https://unpkg.com/react-dom@18.3.1/..."></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/..."></script>

<!-- then your component files -->
<script type="text/babel" src="components.jsx"></script>
<script type="text/babel" src="pages.jsx"></script>

<!-- main entry last -->
<script type="text/babel">
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
</script>
```

**Do not** use `type="module"` — it conflicts with Babel.

## Three rules you cannot break

### Rule 1: `styles` objects must have unique names

**Wrong** (guaranteed to break with multiple components):
```jsx
// components.jsx
const styles = { button: {...}, card: {...} };

// pages.jsx  ← same name, overwrites!
const styles = { container: {...}, header: {...} };
```

**Right**: every component file prefixes its styles with a unique name.

```jsx
// terminal.jsx
const terminalStyles = { 
  screen: {...}, 
  line: {...} 
};

// sidebar.jsx
const sidebarStyles = { 
  container: {...}, 
  item: {...} 
};
```

**Or use inline styles** (recommended for small components):
```jsx
<div style={{ padding: 16, background: '#111' }}>...</div>
```

This one is **non-negotiable**. Every time you write `const styles = {...}` you must replace it with a specific name, otherwise loading multiple components errors out across the whole stack.

### Rule 2: Scope is not shared; export manually

**The key fact**: each `<script type="text/babel">` is compiled independently by Babel, and **scope does not flow between them**. The `Terminal` component defined in `components.jsx` is **undefined by default** in `pages.jsx`.

**The fix**: at the end of every component file, export the components/utilities you want to share onto `window`:

```jsx
// end of components.jsx
function Terminal(props) { ... }
function Line(props) { ... }
const colors = { green: '#...', red: '#...' };

Object.assign(window, {
  Terminal, Line, colors,
  // list everything you want to use elsewhere here
});
```

Then `pages.jsx` can use `<Terminal />` directly, because JSX resolves it from `window.Terminal`.

### Rule 3: Do not use scrollIntoView

`scrollIntoView` pushes the whole HTML container upward and wrecks the web harness layout. **Never use it.**

Alternatives:
```js
// scroll to a position inside the container
container.scrollTop = targetElement.offsetTop;

// or use element.scrollTo
container.scrollTo({
  top: targetElement.offsetTop - 100,
  behavior: 'smooth'
});
```

## Calling the Claude API (inside HTML)

Some native design-agent environments (e.g. Claude.ai Artifacts) provide a zero-config `window.claude.complete`, but most agent environments (Claude Code / Codex / Cursor / Trae / etc.) **do not** have it locally.

If your HTML prototype needs to call an LLM for a demo (say, building a chat interface), two options:

### Option A: don't call for real, use a mock

Recommended for demos. Write a fake helper that returns a preset response:
```jsx
window.claude = {
  async complete(prompt) {
    await new Promise(r => setTimeout(r, 800)); // simulated latency
    return "This is a mock response. Replace it with the real API when you deploy.";
  }
};
```

### Option B: really call the Anthropic API (not recommended, local demos only)

Needs an API key, and the user must paste their own key into the HTML before it runs. **Never hardcode a key in the HTML.**

⚠️ Security boundary: this approach is only suitable for a local `file://` demo that you close right after. The key stays in the DOM/memory —
**do not deploy this page, and do not screenshot or screen-record it for distribution with a key filled in**. In production always forward through a local proxy backend;
the browser side never touches the key. Default to option A/C (no key at all).

```html
<input id="api-key" placeholder="Paste your Anthropic API key" />
<script>
window.claude = {
  async complete(prompt) {
    const key = document.getElementById('api-key').value;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    return data.content[0].text;
  }
};
</script>
```

**Note**: calling the Anthropic API straight from the browser runs into CORS. If the preview environment you were handed does not support CORS bypass, this route is closed. In that case use option A mocks, or tell the user a proxy backend is needed.

### Option C: use the agent's own LLM to generate mock data

For local demos only, you can call the current agent session's LLM capability once (or a multi-model skill the user installed) to generate mock response data first, then hardcode it into the HTML. That way the HTML runtime depends on no API at all.

## Standard HTML starter template

Copy this template as the skeleton for a React prototype:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Prototype Name</title>

  <!-- React + Babel pinned -->
  <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y" crossorigin="anonymous"></script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; width: 100%; }
    body { 
      font-family: -apple-system, 'SF Pro Text', sans-serif;
      background: #FAFAFA;
      color: #1A1A1A;
    }
    #root { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>

  <!-- your component files -->
  <script type="text/babel" src="components.jsx"></script>

  <!-- main entry -->
  <script type="text/babel">
    const { useState, useEffect } = React;

    function App() {
      return (
        <div style={{padding: 40}}>
          <h1>Hello</h1>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>
```

## Common errors and fixes

**`styles is not defined` or `Cannot read property 'button' of undefined`**
→ You defined `const styles` in one file and another file overwrote it. Rename each one to a specific name.

**`Terminal is not defined`**
→ Scope does not flow across files. Add `Object.assign(window, {Terminal})` at the end of the file that defines Terminal.

**Whole page is blank, console shows no errors**
→ Most likely a JSX syntax error that Babel didn't report to the console. Temporarily swap `babel.min.js` for the unminified `babel.js`; the error messages get much clearer.

**ReactDOM.createRoot is not a function**
→ Wrong version. Confirm you are on react-dom@18.3.1 (not 17 or something else).

**`Objects are not valid as a React child`**
→ You rendered an object instead of JSX/string. Usually you wrote `{someObj}` where `{someObj.name}` was meant.

## Splitting files in bigger projects

**A single file over 1000 lines** is hard to maintain. Split it like this:

```
project/
├── index.html
├── src/
│   ├── primitives.jsx      # base elements: Button, Card, Badge...
│   ├── components.jsx      # business components: UserCard, PostList...
│   ├── pages/
│   │   ├── home.jsx        # home page
│   │   ├── detail.jsx      # detail page
│   │   └── settings.jsx    # settings page
│   ├── router.jsx          # simple routing (React state switching)
│   └── app.jsx             # entry component
└── data.js                 # mock data
```

Load them in order in the HTML:
```html
<script type="text/babel" src="src/primitives.jsx"></script>
<script type="text/babel" src="src/components.jsx"></script>
<script type="text/babel" src="src/pages/home.jsx"></script>
<script type="text/babel" src="src/pages/detail.jsx"></script>
<script type="text/babel" src="src/pages/settings.jsx"></script>
<script type="text/babel" src="src/router.jsx"></script>
<script type="text/babel" src="src/app.jsx"></script>
```

**At the end of every file** you need `Object.assign(window, {...})` to export what you want to share.
