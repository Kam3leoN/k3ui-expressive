# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- `k3-chart` — engine helpers renamed `ensureChartEngine()` / `ChartEngine` (aliases `ensureChartJsRegistered` / `ChartJs` kept); docs and playground present the charts as k3ui charts only; without a `height` attribute the frame follows `--k3-chart-height` (default 280px)
- `HoloCardEffect` lists the add-on foil names (autocomplete); the playground-only `cosmos` / `radiant` / `ice` approximations are replaced by the add-on
- `k3-codeblock` rewritten without `k3-list` / line numbers: dark panel (`#24292e`, 16px radius), `k3-tabs` title + copy/download icon buttons (theme colours); default `theme="dark"` (`okaidia` alias, `material` for M3 adaptive); collapse UI removed
- Syntax highlighting — Prism removed; lightweight built-in tokenizer in `src/syntax` (all languages in `k3ui.js`). `k3ui/syntax` remains an empty stub for `syntax.use()` compat. `prismjs` / `vendor:prism` dropped

### Added

- `k3ui/holo-effects.css` — optional add-on with 13 foils for `k3-holo-card` (`holo`, `reverse`, `cosmos`, `rainbow`, `rainbow-alt`, `secret`, `v`, `vmax`, `vstar`, `full-art`, `shiny`, `radiant`, `full-art-wave`), adapted from pokemon-cards-css and pixel-identical to it; painted through `::part(card|shine|glare)` with the `--k3-holo-*` variables, card layout via `--k3-holo-art-window`, `--k3-holo-reverse-clip`, `--k3-holo-art-clip`, `--k3-holo-texture`. **GPL-3.0**: source in `addons/holo-effects/`, built to `dist/holo-effects/` (CSS, images, license) by `npm run build:holo-effects`, never part of `k3ui.js` / `k3ui.css`; package license field is now `MIT AND GPL-3.0-only`
- Playground *Card holographic*: the model select lists every foil (gold card for `secret`); *Card scratch*: live scratched percentage next to the reset button
- `k3-holo-card` — holographic trading card: 3D tilt toward the pointer on a damped spring (mouse, touch, device tilt via `enableMotion()`), built-in `prism` foil (rainbow bands, grain, sparkles, glare — textures generated in SVG, no image), `max-rotate`, `reset-delay`, `motion-range`; `::part(card|shine|glare)` and `--k3-holo-*` variables so other foils can be painted from outside
- `k3-scratch-card` — scratch-off layer over any content: `silver` / `gold` covers drawn in canvas (metal bands, grain, engraved localized label) or an image, four erase styles reproducing scratchcard-js (`line`, `circle`, `spray`, `brush`), `reveal-at`, `reveal-duration`, `revealed`, `reveal()` / `reset()` / `percent`, `k3-scratch` / `k3-reveal` / `k3-error`; sharp on high-density screens, keeps the scratches on resize, finger scratching without scrolling, content hidden from assistive tech until revealed and a “Reveal all” button on keyboard focus
- `k3-lenticular-card` — lenticular image: each child is a view; tilting the card (pointer, finger, arrow keys, device tilt) switches views, interleaved in stripes under ridged plastic mid-switch; `axis`, `rest-frame`, `transition`, `max-rotate`, `keyboard`, `show()`, `k3-change`, announced to screen readers
- Playground pages *Card holographic*, *Card lenticular*, *Card scratch* (Containment → Cards submenu); `data-i18n-alt` translates image `alt` text
- `k3-marquee`: text version styling (`text-size`, `text-font`, `text-weight`), sanitized `html` content (`html` property, `{ html: true }` for `addContent` / `replaceContent`, `k3-sanitize` event), `drag` (grab to move with mouse, pen or touch — links are not followed after a drag), `pause-on-scroll`, `k3-loop` event, templates (`variant`: plain · tonal · filled · outlined) and a fixed `label` slot
- `sanitizeHTML()` / `sanitizeHTMLDetailed()` — allowlist HTML sanitizer for untrusted strings: inert parsing, DOM rebuilt node by node (no `innerHTML`, no mutation XSS, Trusted Types friendly), dangerous elements dropped with their content, no event handlers / `style` / `id` / `name`, URL scheme checks, forced `noopener noreferrer`, custom elements never instantiated, size / node / depth limits
- `k3-marquee` `pause-at-items` + `item-pause` — dwell when each item’s start reaches the near edge, then scroll to the next; `k3-item-pause` event; demo #6
- `K3UI.init({ theme: { specVersion } })`; playground settings: Material color spec select (2025 / 2021) applied live, persisted and replayed before first paint
- `k3-halftone` **print mode** — real screen-print halftone of an image (`<img>` / `<canvas>` / `<video>` / `src`): ink separation with grey-component replacement, one rotated screen per ink, tone-accurate dots (area-true lookup table), plates overprinted on paper; presets `poster` · `cmyk` · `riso` · `mono`, custom `inks`, `shape` (circle · ellipse · square · line), `contrast`, `black`, `dot-gain`, `angle`, `misregistration`, `paper`, `grain`, `roughness`, `ink-opacity`, `toBlob()` / `download()`, `k3-render`; animated register drift without re-rendering. `renderHalftone()` engine exported
- `specVersion` theme option (`'2025'` default · `'2021'`), `<k3-theme spec-version>`, `DEFAULT_COLOR_SPEC`, `AUTO_LIGHT_START_H` / `AUTO_LIGHT_END_H`
- `k3-qr-code` — styled QR: zero-dependency encoder (ISO/IEC 18004, v1–40, ECC L–H), qr.io patterns / markers / centres, gradient, logo, CTA frames; PNG / SVG / JPEG / WebP export
- `buildQrPayload()` / `validateQrPayload()` helpers
- `i18n.extend()` — merge app/demo locale dictionaries into the runtime catalogs
- `src/registry/deps.ts` — registering a component also defines the elements it renders
- Every component module self-registers its tag on import (guarded)
- `resolveIdRef()` — `for="…"` targets resolve inside shadow roots (date / time pickers, slider)
- `--k3-text-field-max-width`; CI workflow and `npm run check`
- `themeCssVars()` — pure scheme → CSS custom properties (prerender / SSR); same values `themeApi.apply()` writes
- `k3-lazy` — lazy region: trigger (`visible` · `idle` · `interaction` · `eager` · `manual`), registers the k3 elements it contains, optional `loader`, `k3-skeleton` around the real content (no layout shift) or `k3-loading-indicator` after 150 ms (kept 300 ms), custom `fallback` / `error` slots, Retry, `aria-busy`, `k3-load-start` / `k3-load-end`
- Lazy utilities (no UI): `whenTriggered()`, `pendingCustomElements()`, `registry.registerWhen()`; lifecycle phases `load-start` / `load-end`

### Changed

- `k3-marquee` rewritten on the MarqueeJS model (Vincent Loy, MIT): time-based scrolling in px/s (`requestAnimationFrame`, same speed at any refresh rate), `direction` up / down, `start="edge"` (enters from the far edge — the screen edge, not the content width) or `filled`, `clone-count`, `separator`, `pause-on-focus` (default on), `paused`, MarqueeJS methods (`start`, `pause`, `resume`, `toggle`, `restart`, `addContent`, `replaceContent`, `getContentList`, `recalculate`), `k3-pause` / `k3-play` events, automatic pause off-screen and in hidden tabs. Previous attributes and `play()` / `stop()` / `durationFromSpeed()` keep working; copies are real DOM clones (no HTML string) refreshed when the content changes; the host takes the full width so a classic pass crosses the whole space
- Bundle budget 500 → 600 kB gzip: k3ui.js now carries the chart engine (≈ 70 kB); syntax is a small custom highlighter (Prism removed)
- `k3-codeblock` tokens keep `.token.*` class names; the rendered `<code>` keeps the author's language class next to the canonical one (`language-html language-markup`)
- `k3-halftone`: any non-image content keeps the CSS dot overlay (previous behaviour, same attributes); `mode="overlay"` forces it for images
- Material Color Utilities 0.2.7 → 0.4.0 with the **2025 color spec** by default: the Expressive variant keeps the seed hue on primary (the 2021 spec rotated it by +240°, so a purple seed gave a teal UI). Tonal spot / vibrant / neutral also follow the 2025 tones; `specVersion: '2021'` keeps the previous colours
- Replaced `qr-code-styling`-based QR with in-house encoder + SVG renderer
- QR generator wizard moved out of the published package to `apps/qr-generator` (`npm run dev:qr`)

### Fixed

- Playground navigation — the *Charts* submenu lists its pages again (`charts-bar` / `charts-line` / `charts-other` were missing from the catalog, so Graphiques opened an empty flyout)
- `k3-chart` — no more jump from 0 to the chart height when the element upgrades after the first paint: k3ui.css reserves the frame (`--k3-chart-height`, or the `height` attribute where CSS can read it)
- `k3-marquee` in RTL pages: the continuous loop showed gaps and the edge start was off-screen (the track inherited the page direction). The strip geometry is now physical in both directions, each copy keeps the page reading direction, and the layout is re-measured when `dir` changes; text set with `text-size` keeps a proportional line height (bigger text was clipped)
- Playground: colours flipped at load / refresh for customised themes — `<k3-theme>` re-applied its static attributes over the saved theme; it is now synced before it upgrades, and returning visitors replay their cached theme before first paint
- `K3UI.keyboard` / `K3UI.mouse` were typed on the global but missing at runtime
- `k3-sheet` drag-to-dismiss threw a ReferenceError (`isRtl` undefined)
- `k3-card-set` keyboard navigation never moved focus (`nav.index` → `itemIndex`)
- Outlined fields (`text-field`, `select`, `textarea`): the notch stayed open on empty fields
- `k3-select` showed Lit part markers in option labels; `k3-codeblock` glyphs rendered as ligature text
- Accessible names: `k3-switch` (slotted label or host `aria-label`), `k3-fab-menu` trigger, `k3-nav-item` (WCAG 2.5.3 label in name)
- TypeScript errors (`npm run lint` passes), 2 wrong test fixtures, dead code
- `npm run build` failed outside the author's machine (`D:/K3ui` hard-coded in scripts)
- Redundant render cycles in `text-field`, `wheel-picker`, `toolbar`, `button-segmented`; external `selectedIndices` writes now apply
- Missing / hard-coded English strings now localized (FR / EN): autocomplete, scroll-to-top, codeblock, countdown, slider, wheel-picker, button-grid, counter, breadcrumb, segmented, fab-menu

### Changed (playground / site)

- Lighthouse (mobile): 98 performance · 100 accessibility · 100 best practices · 100 SEO
- Self-hosted Material Symbols subset (`playground/icons.json` → `scripts/subset-icons.py`); no Google request on page load
- Static page paints first: default locale prerendered at build, app booted after first paint, no whole-app fade, reserved shell sizes (CLS 0), lazy images, loading veil hidden at boot
- Catalog warm-up on first interaction (idle, never with Save-Data) instead of every page view; Material Symbols variable fonts load only on their pages
- Vercel: immutable cache for hashed assets, security headers
- Default theme prerendered at build (`playground/theme-defaults.ts`): no purple → teal colour flash when the app boots
- API tables and Usage snippets load with their page (own chunks); Usage blocks no longer pre-mounted for every page at boot
- Icon glyphs of not-yet-upgraded elements stay out of layout (icon font leaves the critical window); bottom nav bar placeholder matches the final bar
- Dialog, settings switches and page footer nav register after first paint
- Build-time HTML compaction (comments, indentation; `pre` / `code` / `script` / `style` untouched — rendered text identical): 541 → 429 KB
- Code-sample and package-manager toggles follow the WAI-ARIA tabs pattern (roles, `aria-selected`, roving tabindex, arrow keys) — accessibility 100 on component pages
- New docs page *Lazy loading* (`k3-lazy`: skeleton, indicator, error + Retry, Replay)

## [0.1.0] — 2026-10-31

Premier jalon pre-1.0 après le greenfield `0.0.1`. API encore évolutive (pas de promesse de stabilité 1.x).

### Added

- `k3-qr-code` — patterns body / eye frame / eye ball, rendu neighbor-aware, couleurs MD2 500, ECC L–H, générateur playground
- `k3-carousel` (+ items / keylines), `k3-signature`, `k3-rating`, `k3-alert`, `k3-quote`, `k3-button-card`
- Audio player (card / compact / toolbar / sticky), waveform PCM, volume toolbar, hotkeys média
- Confetti presets + sound FX, haptic selection (switch, dialog, menu, slider ticks, snackbar)
- Core helpers : keyboard, mouse, media-hotkeys ; FAB visibility
- Playground : Material Symbols catalog, sponsors, demos & i18n FR/EN élargis

### Changed

- Tooltip top-layer (escape overflow), edge scrollbar, sheet chrome shift
- Progress / scroll-to-top / fab-menu polish ; button-group & slider refinements
- Version badge playground lit `VERSION` (`src/version.ts`)

## [0.0.1] — 2026-10-17

### Added

- Greenfield K3ui v2: Lit custom elements, SCSS tokens, Tailwind v4 purge
- Centralized `K3UI.init()` + component registry
- Core: lifecycle events, focus trap, state layers, form-associated helpers
- i18n FR/EN, debug logger, dynamic theme (Material Color Utilities)
- Full component catalog (actions, inputs, feedback, containment, navigation, pickers, theme)
- Dist artefacts: `k3ui.js`, `k3ui.css`, `tokens.json`, typings
- Vitest unit tests, Playwright smoke, bundle budget script
