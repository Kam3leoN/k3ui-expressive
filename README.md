# K3ui

**Material 3 Expressive** for the web — by **Kam3leoN**.

Greenfield v2 (not a fork of the previous class-based K3ui). Lit custom elements, TypeScript, SCSS design tokens, Tailwind CSS with purge. One JS + one CSS drop-in.

> Not affiliated with Google. “Material Design” and “Material 3” are trademarks of Google LLC.

## Install / use

```html
<link rel="stylesheet" href="dist/k3ui.css" />
<script type="module" src="dist/k3ui.js"></script>

<k3-button variant="filled">Hello</k3-button>
```

```ts
import { K3UI } from 'k3ui';
import 'k3ui/k3ui.css';

await K3UI.init({
  locale: 'fr-FR',             // BCP 47 tag or 'fr' / 'en'
  direction: 'ltr',            // writes <html dir>
  theme: {
    seed: '#00639B',
    mode: 'system',            // light · dark · system (OS) · auto (07:00–18:00 light)
    variant: 'expressive',
    contrast: 'auto',          // default · medium · high · auto (OS prefers-contrast)
    specVersion: '2025',
    motion: 'expressive',      // expressive · standard
  },
  motion: { reduce: 'system' },       // 'always' = reduced for everyone; the OS setting always wins
  interaction: { ripple: true },
  overlays: { scrollLock: false },    // true: lock page scroll while a modal dialog / sheet is open
  haptic: true,
  debug: false,
});
```

`init()` can be called again at any time: options **deep-merge** with the previous call
(`K3UI.init({ theme: { mode: 'dark' } })` keeps the seed), calls run one after the other,
and only what changed is re-applied. Unknown keys and invalid values are ignored with a
`console.warn`. `getInitOptions()` returns the options in effect.

Manual bootstrap (skip auto-init):

```html
<script>
  window.K3UI_MANUAL = true;
</script>
<script type="module" src="dist/k3ui.js"></script>
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Playground |
| `npm run build` | `dist/k3ui.js` + `dist/k3ui.css` + `tokens.json` + budget check |
| `npm run build:lazy` | `dist/lazy/` — base + one chunk per component (part of `build`) |
| `npm run build:pack -- select dialog` | Custom single-file pack with only these components (+ their children) |
| `npm test` | Vitest |
| `npm run test:e2e` | Playwright: smoke, dialog / sheet keyboard & ARIA, forms, perf budgets (`PW_CHROMIUM_PATH=…` to use a local Chromium, `K3UI_E2E_ALL_BROWSERS=1` for Firefox + WebKit) |
| `npm run version:bump -- patch` | Bump version + CHANGELOG |

## Architecture

- `src/core` — base element, lifecycle, focus trap, state layers
- `src/registry` + `src/bootstrap` — sole registration / `init()` path
- `src/components/{actions,inputs,feedback,containment,navigation,pickers,theme}`
- Lifecycle: `k3-open-start|end`, `k3-close-start|end`, plus press/select/change/morph where relevant (`preventDefault` on `*-start` cancels)

## v1 → v2 mapping (doc only)

| v1 | v2 |
| --- | --- |
| `K.Dialog` / `.dialog` AutoInit | `<k3-dialog>` + `.show()` / `.hide()` |
| `window.K3UI_OPTIONS` | `window.K3UI_OPTIONS` or `K3UI.init(options)` |
| SCSS class `.btn` | `<k3-button variant="…">` |
| Multi-chunk `dist/js` | Single `dist/k3ui.js`, or on-demand chunks with `k3ui/lazy` |

## Overlays & keyboard

Modal `k3-dialog` and `k3-sheet` move focus into the panel when they open, keep Tab /
Shift+Tab inside it (slotted controls included), close on Escape and give focus back to the
element that opened them. Only the top-most modal reacts to Escape; a widget inside it that
handles Escape itself (menu, select, autocomplete, visible tooltip) calls `preventDefault()`
and the modal stays open. Closed panels are `inert`.

## Forms

`k3-text-field`, `k3-textarea` and `k3-select` are form-associated: their value is in
`FormData`, and `required` / `pattern` / `type` / length constraints block native submission
and match `:invalid`. `checkValidity()`, `reportValidity()`, `setCustomValidity()`,
`validity` and `form.reset()` behave like native inputs.

## Registration

Importing a component module defines its tag (guarded, like Material Web). With the
registry, dependencies come along: `K3UI.init({ components: ['k3-audio-player'] })` also
defines its slider, buttons and progress (`src/registry/deps.ts`, kept in sync by
`tests/unit/registry-deps.test.ts`).

## On-demand loading

`k3ui` is one file with every component. `k3ui/lazy` is the same API split in chunks: a
base (init, theme, registry, i18n, core helpers — ≈ 92 kB gzip instead of ≈ 465 kB) and one
chunk per component, fetched only when the page uses it.

```html
<link rel="stylesheet" href="k3ui/dist/k3ui.css" />
<script type="module" src="k3ui/dist/lazy/k3ui.js"></script>

<k3-select label="Country">…</k3-select>
<!-- loads select + text-field + menu + menu-item, nothing else -->
```

```ts
import { init } from 'k3ui/lazy';

await init(); // components: 'auto' is the default of this entry
```

- `components: 'auto'` defines the k3 elements present in the document, then watches it:
  an element added later (router view, `innerHTML`, framework render) is loaded as it
  enters the DOM. It also works with the full bundle: `init({ components: 'auto' })`.
- `K3UI.registry.observe(root)` does the same for a subtree or a shadow root you own
  (`.disconnect()` to stop, `.ready` to await); `registry.registerPresent(root)` is the
  one-shot version. An explicit list still works: `init({ components: ['k3-dialog'] })`.
- Children a component renders always come along (`src/registry/deps.ts`).
- With a bundler you can also import elements directly — each entry imports its children:
  `import 'k3ui/components/k3-select';`
- Exports that embed component code are only in the full bundle: the Material shapes
  helpers, `K3Coverflow` / `K3CoverflowItem` and the snackbar constants. With `k3ui/lazy`
  take the classes from their entry (`k3ui/components/k3-coverflow`).
- `k3ui/components.json` lists every tag with its file, dependencies and gzip size.

## Custom pack

One self-contained file with the base and only the components you choose — dependencies
are resolved for you (`k3-select` brings `k3-text-field`, `k3-menu` and `k3-menu-item`).
Run it from a clone of this repository:

```bash
npm run build:pack -- --list                      # components and what they require
npm run build:pack -- select dialog               # → dist/packs/k3ui.pack.js
npm run build:pack -- select,dialog --name shop --out dist/packs
```

Use the pack in place of `dist/k3ui.js`, with the same `dist/k3ui.css`; `init()` registers
everything the pack holds. `<name>.json` records the selection, the components that were
added as dependencies and the gzip size.

## Lazy loading

Two layers — use the one that fits:

- **Utility** (logic only): `await registry.registerWhen(el, 'visible')` defines the k3
  elements under `el` once it scrolls into view (`idle`, `interaction`, `eager` too).
  `whenTriggered()` / `pendingCustomElements()` are the underlying primitives.
- **Component** (states + a11y): `<k3-lazy>` adds a `k3-skeleton` around the real content
  (or `fallback="indicator"`), an optional `loader` promise, errors with Retry, `aria-busy`.

```html
<k3-lazy trigger="visible">
  <k3-card>…</k3-card>
</k3-lazy>
```

## Theming

`K3UI.init({ theme: { seed: '#00639B', variant, specVersion } })` — `variant` defaults to
`expressive`. Colours follow the Material **2025** color spec by default (Material 3
Expressive): Expressive keeps the seed hue on primary and rotates secondary / tertiary.
`specVersion: '2021'` (or `<k3-theme spec-version="2021">`) restores the legacy palette,
where Expressive rotated the primary hue by +240°.

## Halftone

`<k3-halftone>` screen-prints an image: inks are separated (poster, CMYK, riso, mono or your
own `inks`), each ink gets its own rotated screen and dot sizes follow the tones exactly.

```html
<k3-halftone preset="cmyk" shape="ellipse" size="7">
  <img src="photo.jpg" alt="Harbour at dusk" />
</k3-halftone>
```

Cross-origin images need CORS (`crossorigin="anonymous"`) — otherwise the component falls back
to its CSS dot overlay and fires `k3-error`. Any other slotted content keeps that overlay.

## Animations & card effects (`k3ux`)

Decorative UX effects (confetti, text bounce/scramble, heart burst, halftone, holo / scratch /
lenticular cards) live in the companion package **`k3ux`** so `k3ui` stays UI-only.

```bash
npm i k3ui k3ux
```

```js
import 'k3ui';
import 'k3ui/k3ui.css';
import 'k3ux';
import 'k3ux/holo-effects.css'; // optional GPL-3.0 foils for k3-holo-card
```

## Cover flow

`<k3-coverflow>` turns a row of covers in 3D: the centred one faces you, the others turn
towards it. Endless by default (`mode="bounded"` stops at the ends), with a mirror reflection
(`no-reflection` removes it). Covers only — no caption, category or scrollbar. Each cover is a
link (`href`, `target`, `rel`) or turns over (`flip`, `slot="back"`) once centred.

```html
<k3-coverflow label="Gallery" lightbox arrows bullets full-width>
  <k3-coverflow-item href="big/dunes.webp"><img src="dunes.webp" alt="Desert dunes" /></k3-coverflow-item>
  <k3-coverflow-item flip>
    <img src="2.webp" alt="Card" />
    <img slot="back" src="2-back.webp" alt="" />
  </k3-coverflow-item>
</k3-coverflow>
```

- `lightbox` — the centred link cover opens its `href` image in a built-in viewer: scrim, top
  layer (Popover API, no `<dialog>`, no new tab), ← → / side buttons / swipe, Escape or a click
  on the scrim to close, focus trapped then returned. `open()` / `close()`, `k3-open` / `k3-close`.
- `arrows` — previous / next buttons on the sides (hidden at the ends when bounded).
- `bullets` — one per cover; the active one is 3× wider and the width follows the motion.
- `full-width` — side covers and spacing are computed so the covers reach both edges of the
  container (narrow screens keep the default layout).
- `orientation="vertical"` — covers stacked top to bottom, tilting around x and fading at the
  edges: ↑ ↓ keys, vertical drag and wheel, arrows on the side, bullets in a column, flips around
  x, no reflection. Height from `--k3-coverflow-height` (default 2.6 × cover height).
- `effect="slide"` — no 3D: a flat row (or column, with `orientation="vertical"`) that fills the
  viewport, the centred cover growing to `active-scale` (default 1.4) while its neighbours make
  room as it slides. Same navigation, lightbox, arrows, bullets, flip and optional mirror reflection.

Drag / swipe with momentum, click a side cover, ← → Home End, horizontal wheel (`wheel` adds the
vertical one). `k3-change` `{ index }` when a cover is centred, `k3-flip` `{ flipped }`. Size with
`--k3-coverflow-item-width` / `--k3-coverflow-item-height` / `--k3-coverflow-bullet-size`; tune
with `angle`, `gap`, `spacing`, `depth`, `visible`. Only `http(s)`, `mailto`, `tel` and relative
links are followed. The playground demo images are CC0 / public domain
(`playground/public/coverflow/CREDITS.md`).

## Untrusted content

- `sanitizeHTML(html)` / `sanitizeHTMLDetailed(html)` — allowlist sanitizer returning a
  `DocumentFragment` (inert parsing, DOM rebuilt node by node, Trusted Types friendly).
- `sanitizeSVG(markup, { allowIds })` — inline SVG icons: shapes and presentation
  attributes only. `k3-tabs` passes its SVG icons through it.

## Syntax highlighting

`<k3-codeblock language="php">` uses a lightweight built-in tokenizer (no Prism). Languages
ship in `k3ui.js`. The legacy `k3ui/syntax` entry still exists as an empty stub so older
`syntax.use()` calls stay harmless.

```js
import { syntax } from 'k3ui';
syntax.highlight('SELECT 1', 'mysql');
```

Default `theme="dark"` uses a fixed dark panel; `theme="material"` follows M3 roles.
Override any `--k3-code-*` variable for custom colours. Source uses JetBrains Mono.

## Lighthouse scores (playground home)

The playground home shows its own Lighthouse scores as gauges (performance, accessibility, best
practices, SEO — desktop and mobile, with the FCP / LCP / TBT / CLS / Speed Index metrics).

- **Stored audit** — `playground/public/lighthouse.json`, refreshed with Lighthouse in Chromium:

  ```bash
  npm run build:playground && npm run preview   # other terminal
  npm run lighthouse                            # or: npm run lighthouse -- http://127.0.0.1:4173/
  ```

- **Live audit** — the "Run the audit" button measures the page now. On `localhost` the dev /
  preview server runs Lighthouse in headless Chromium (`/__k3-lighthouse/*`, loopback clients
  only, same-origin pages only) and links the full HTML report; use `npm run preview` for
  representative performance. On a public address the page asks PageSpeed Insights (Lighthouse
  in Chrome, Google) — set `data-psi-key` on `#lighthouse-root` for a higher quota.

Lighthouse is not a dependency: the runner uses a local install, `LIGHTHOUSE_BIN`, or
`npm exec lighthouse@12.8.2`. Chrome / Chromium is found automatically (`CHROME_PATH` to force one).

## Development

```bash
npm ci
npm run dev           # playground
npm run check         # lint (tsc) + tests + build — same as CI
npm run build:playground
```

The playground self-hosts its Material Symbols subset. To use a new ligature, add it to
`playground/icons.json`, then regenerate the font:

```bash
pip install fonttools brotli
python3 scripts/subset-icons.py path/to/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].woff2
```

## License

MIT © Kam3leoN
