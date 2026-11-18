# Module · Web page / landing page / site / interface prototype

Clickable sites, landing pages, corporate sites, dashboards and desktop interface prototypes go here (for phone apps go to `references/app-prototype.md`). Pass the narrow bridge in SKILL.md first, then work from this manual.

## The hero: put the most distinctive thing in the subject's world first

The hero is the first thing the audience sees. Open with the most distinctive thing in this subject's world, in whichever form fits best: a single headline, an image, a piece of animation, a playable demo, one interactive moment.

"A big number + a small label + a row of supporting data + gradient accents" is the default answer for a hero; use it only when it really is the best fit. The same goes for the "big hero + three-column features + testimonials + CTA" landing page template.

## Every screen below must have been designed

A designed hero with "a small heading + three identical cards" all the way down is the most common landing page failure. Every content block deserves the question: what form suits this content best —
a chart, a demo you can move, a stretch of large type, a product interface, a timeline — rather than the default of putting it in a card.

**The product must be visible.** A page introducing an App, tool or hardware must show the product itself: use a screenshot if there is one; if not, draw the interface from the real content the user gave
(`assets/ios_frame.jsx` for phone apps, `assets/macos_window.jsx` for desktop software). A landing page that only describes the product in words is not done.
When the product's core mechanism can become a small playable demo (move the altitude and watch the weather change, drag the slider and watch the price), it is often the best screen on the whole page.

## The order of work

1. Three directions: one complete HTML per direction + a hero screenshot + a full-page long screenshot (`references/directions.md`)
2. After the choice, write the assumptions + placeholder structure for the user to see, then fill in the components (the standard flow in `references/workflow.md`)
3. Once structure and rhythm are settled, add Tweaks (`references/tweaks-system.md`) so the user can adjust colors, type sizes and copy themselves
4. At least 2 rounds of the polish loop (`references/polish-loop.md`), looking screen by screen on both desktop and phone

## Hard rules

- Body text ≥14px (16px on mobile), clickable elements ≥44×44px, body contrast ≥4.5:1
- Responsive: verify at least the 1440 and 375 widths (`python3 "$HD/scripts/verify.py" page.html --viewports 1440x900,375x812`)
- Interactions must really work: navigation, tabs, disclosure, form states built, zero console errors
- Do not invent data, testimonials or logo walls; leave an honest placeholder or ask the user
- Motion: one choreographed page load beats a fade-up on every block; motion that responds to a user action (expanding, confirming) is the good kind

## Starter components

| File | Purpose |
|---|---|
| `assets/browser_window.jsx` | Present a web page inside a browser window (URL bar + tab bar) |
| `assets/macos_window.jsx` | Desktop app window shell |
| `assets/design_canvas.jsx` | Compare several static variants side by side |

React + Babel conventions and the three technical red lines (style objects must be uniquely named, multiple babel scripts share via `Object.assign(window, …)`, no `scrollIntoView`): `references/react-setup.md`.

## Related files

| What you want to do | Read |
|---|---|
| Style library and specimens (the web section of the seconds roulette, plus the cross-medium Chinese and East Asian section) | `references/design-styles.md` |
| Type pairings and Chinese typesetting | `references/typography.md` |
| The user has a codebase / design system | `references/design-context.md` |
| Verification before delivery | `references/verification.md` |
