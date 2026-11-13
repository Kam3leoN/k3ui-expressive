# Changelog

## [1.2.3] — 2026-11-13

### Fixed — Select variant demo alignment

- Playground `items-end` stages use flex column + `justify-content: flex-end` so outlined / filled / standard field chromes share one horizontal baseline
- Select variants demo rewritten as `k3-demo-cols-3` cases (no orphan headers / uneven stacks)

## [1.2.2] — 2026-11-13

### Fixed — Select menu stacking / width consistency

- Open `k3-select` / `k3-menu` raise `z-index` so the panel never paints under the next field
- `match-width` panels use Popover top-layer + 100% field width CSS fallback before JS fit
- Fitted panel `z-index: 1200`

All notable changes to this project will be documented in this file.

## [1.2.1] — 2026-11-13

### Fixed — Select chevron rotation

- `k3-select` mirrors `open` on menu `open-start` / `close-start` (attribute + property in the same turn) so the field chevron rotates with the elastic menu instead of after motion ends
- Select composes `k3-menu` with `match-width` (Noph-style full field width + FastSpatial scaleY)

## [0.2.0] — 2026-11-13

### Changed — Date / time picker open motion (Noph / dialog spring)

- `k3-date-picker` / `k3-time-picker` open with the same FastSpatial **scaleY** spring as menus and basic dialogs (`enterScaleYPopover`) — replaces the short2 / standard fade; **scaleY close** via `data-closing`
- Modal pickers use **center** transform-origin (like `enterDialogMotion`); docked keeps top / flip-bottom
- Docked: prefer below the **field outline** (8dp gap); flip above only when below is tight; `data-clip` + overflow auto so dial cannot paint over the field
- Dial face enter/leave uses **spatial-fast** (snappier than panel morph)
- Modal scrim: pickers join `overlayStack`; `wouldOpenBeside` blocks a second dialog/picker beside an open scrim (nested from inside still OK)
- Motion: `allowsExpressiveMotion()` — **standard** / reduce = brute (no spring enter/exit / dial morph); expressive keeps springs
- Time dial while open: **dial ↔ keyboard** scales the face (0.8↔1) and **morphSize**s the panel height (Noph `setMode`); hand angle unwraps the short way (11→12 = +30°)
- `morphSize` / `spatialDefaultTiming` in `src/motion/morph.ts`
- Tests: dial enter/leave, docked top parity, overlay beside-scrim

### Changed — `k3-nav-rail` (M3 Expressive)

- `layout` `modal` (default) · `standard` — modal = flush start edge + end-side radii; standard = flush rail, no inset sheet; elevation-1 on compact and expanded; `appearance` kept as alias
- `position` `start` · `center` · `bottom` — leading destinations group alignment
- Slots `leading` / `trailing` (horizontal divider); deprecated `foot` still works
- Compact: end border removed in favour of elevation level 1

### Added — Lighthouse gauges on the playground home

- Section "Lighthouse K3[UI] scores": four 270° gauges (curved label, icon, value, Lighthouse colour bands 0–49 / 50–89 / 90–100 with legend), Desktop / Mobile tabs, FCP / LCP / TBT / CLS / Speed Index with band shapes (not colour only), last audit date and Lighthouse version. Gauges animate to each new score (reduced motion: instant), `role="meter"` with values
- Stored audit `playground/public/lighthouse.json` (`npm run lighthouse`: Lighthouse 12.8.2 in Chromium, desktop + mobile)
- Live audit button: dev / preview server endpoint `/__k3-lighthouse` (`run`, `ping`, full HTML `report`) running Lighthouse in headless Chromium — loopback clients with a localhost Host header only, same-origin paths only, one audit at a time; PageSpeed Insights on public hosts
- Loaded on demand when the section nears the viewport: no change to the home start-up (Lighthouse home desktop 100 / 100 / 100 / 100, mobile 97–99); its strings are merged with `i18n.extend()` from the section module, not added to the library catalogs
- Tests: 8 unit (summary, bands, arc, endpoint guards), 3 e2e (stored scores per form factor, live run with spinner then animation, no endpoint)

### Added — `k3-coverflow` / `k3-coverflow-item`

- `effect="slide"`: carousel without the 3D effect — covers side by side filling the viewport (as many as reach the edges), the centred one growing to `active-scale` (default 1.4) with the neighbours making room continuously (no overlap while sliding); horizontal and vertical, 1:1 drag, same lightbox / arrows / bullets / flip / optional mirror reflection as coverflow. `coverflowSlidePose()`, `coverflowSlideVisible()`. Playground toolbar Coverflow|Slide + Horizontal|Vertical; 7 unit tests, 1 e2e test

- `orientation="vertical"`: covers stacked top to bottom on the y axis, tilting around x towards the centre, fading at the top and bottom edges; ↑ ↓ keys, vertical drag (touch `pan-x`) and wheel, up / down arrows on the side, bullet column with the active bullet 3× taller, flip covers turn over around x, no reflection; viewport height `--k3-coverflow-height`; `full-width` fits the covers to the top and bottom edges. Playground toolbar Horizontal|Vertical, 5 unit tests, 1 e2e test

- 3D cover flow: centred cover facing the viewer, side covers turned towards it, mirror reflection (`no-reflection`), endless loop by default (`mode="bounded"` to stop at the ends). Covers only — no captions, categories or scrollbar
- Each cover is a link (`href` / `target` / `rel`, unsafe schemes dropped, `noopener noreferrer` added for `_blank`) or turns over (`flip`, `slot="back"`, `k3-flip`, cancelable through `k3-change-start`); a side cover first comes to the centre on click
- Drag / swipe with momentum (exact critically damped spring, rubber band when bounded), arrow keys / Home / End with roving focus (RTL mirrored), horizontal wheel (`wheel` for the vertical one); `goTo()`, `next()`, `prev()`, `index`, `k3-change`; geometry props `angle`, `gap`, `spacing`, `depth`, `visible`
- A11y: `region` with `aria-roledescription`, covers named "alt (n of total)", off-centre covers `aria-hidden` and out of the tab order, live announcement; reduced motion: instant moves and flips
- `lightbox`: the centred link cover opens its image in a built-in viewer — scrim, top layer through the Popover API (no `<dialog>`, no new tab), image preloaded before it opens, ← → / side buttons / swipe move the covers and the image, Escape / scrim / close button, focus trapped and returned to the centred cover, Escape shared with the modal overlay stack; `open()`, `close()`, `k3-open`, `k3-close`; link gets `aria-haspopup="dialog"`
- `arrows`: previous / next side buttons (hidden at the ends when bounded, mirrored in RTL)
- `bullets`: one per cover, the active one 3× wider — width and colour follow the stage position frame by frame (drag included); roving focus, `aria-current`
- `full-width`: side covers and spacing computed (`coverflowFit`, perspective-exact `coverflowExtent`) so the covers reach both edges of the container; refitted on resize
- Direction read from the element's own computed style (arrows / bullets and covers always agree)
- Playground page `#/coverflow` (lightbox, flip and full-width demos), usage snippet, API tables. Demo images are royalty-free only: ten scenes painted from code (CC0, `scripts/coverflow-art.py`) and four CC0 / public-domain photos from the scikit-image sample data — `playground/public/coverflow/CREDITS.md`
- Tests: 32 unit tests, 8 e2e tests
- Bundle budget 610 → 620 kB gzip (`k3ui.js` 616.9 kB: +10.1 kB with the component, its options and doc strings)

### Tests — suite élargie (see `docs/TESTING.md`)

- Playwright : projets mobile Chromium (Pixel 5 + iPhone 12 metrics), specs clavier, mémoire, stress, visuel (snapshots), concurrent destroy/recreate ; CI `e2e` avec `K3UI_E2E_MOBILE=1`
- Vitest : fuzz sanitizer HTML/SVG, matrice config init, lifecycle registre, composants simultanés
- Budgets bundle JS **620** / CSS 28 kB gzip (relevé pour `k3-coverflow` + lightbox / arrows / bullets)

### Lighthouse — playground (see `docs/LIGHTHOUSE_2026-11.md`)

- Playground home: desktop **100 / 100 / 100 / 100** (was 95 perf); mobile perf 68 → 88–96 (TBT 1 900 → 210–470 ms, LCP 2.1 → 1.5 s, SI 4.3 → 1.6 s), A11y / BP / SEO 100. Deep-linked pages 85–91 → 94–98, all A11y 100
- `index.html` ships the shell + home only (490 → 70 kB); other pages go to `assets/doc-pages-<hash>.json`, stamped after first paint in short tasks; catalog grid prerendered at build; app requested after the static LCP; deep links show the loading veil (no flash of home, CLS 1.3 → 0); holo-effects CSS loads with its page
- Accessibility (library): host `aria-label` / `aria-expanded` / `aria-haspopup` / `aria-controls` now reach the inner `<button>` of `k3-button`, `k3-fab`, `k3-icon-button` (unnamed icon buttons); `k3-slider` names its handles from the host `aria-label`; `k3-fab-dial` / `k3-fab-rail` triggers named; `k3-text-field` inner control named by its label; `k3-select` items are `option`s; `k3-list` role + name on its item container, selection indicator `inert`; `k3-mood-calendar` grid rows / cells, years `group`; `k3-alert` status container is a `div`; `k3-text-bounce` readable text without `aria-label` on `<p>`; `k3-quote` `job-title` attribute (`role` kept); carousel label text-shadow
- Performance (library): `k3-button-group` no forced layout on first render; `k3-fab-menu` no style read while closed; `k3-scroll-to-top` one scroll read per frame; nav rail / bar selection without forced `offsetWidth`; `k3-loading-indicator` starts its cycle only once visible; `K3UI.init()` slices the cold colour-scheme computation (`theme.prepare()`, scheme cache) and yields between steps — `yieldToMain()` (scheduler.yield / MessageChannel, works with fake timers)
- Tests: 11 unit tests (ARIA forwarding, roles, names, fake-timer init) and e2e `playground-load.spec.ts` (deep link veil, CLS, stamped pages). `tests/unit/alert.test.ts` queries `.base` instead of `aside.base` (internal element changed)

### Fixed — audit 2026-11 (see `docs/AUDIT_2026-11.md`)

- **Dialog / modal sheet keyboard access**: focus now moves into the panel on open, Tab / Shift+Tab cycle through shadow *and* slotted controls, Escape returns focus to the trigger. `FocusTrap` walks the composed tree (it only saw the shadow panel, so Tab left the modal). Closed panels are `inert` (their controls were reachable with Tab) and the panel is named by its headline (`aria-labelledby`)
- **Escape closes one layer at a time**: modal dialogs / sheets share an overlay stack — only the top-most closes; an Escape consumed by an inner menu, select or visible tooltip (`preventDefault()`) no longer also closes the dialog
- **XSS**: `k3-tabs` `icons` / `customIcons` SVG markup was rendered with `unsafeHTML`; it now goes through the new `sanitizeSVG()`
- `K3UI.init()` deep-merges successive calls (a later `theme: { mode }` kept no seed), no longer resets a theme set with `K3UI.theme.apply()`, and runs concurrent calls one after the other (auto-bootstrap + app call)
- `K3UI.init()` leaked one document-wide `MutationObserver` per call (icon ligature guard) — now one per root
- `theme.apply({ target })` (e.g. `<k3-theme global="false">`) stored the local target as the default of every later global call, and replaced the document's OS / clock listeners; targets now keep their own state (`theme.release(target)`)
- `k3-text-field` / `k3-textarea`: `required`, `pattern`, `type`, `minlength`… now reach the form (`ElementInternals.setValidity`): native submit blocking, `:invalid`, `form.checkValidity()`; `checkValidity()`, `reportValidity()`, `setCustomValidity()`, `validity`, `validationMessage`, `form`, form reset / disabled fieldset / state restore. `k3-select` `required` reports `valueMissing`
- `k3-loading-indicator` re-rendered on every animation frame forever (background spin in JS) — the spin is a compositor CSS animation; spin and morph cycle pause off-screen and in hidden tabs (no `k3-morph-*` events there)
- `k3-progress` indeterminate canvas loop kept painting off-screen — paused until visible
- Audio player: the on-demand Material Color Utilities import pulled the whole package namespace into `k3ui.js` (−20 kB raw)
- `k3-heart-burst` particles built with `innerHTML` (Trusted Types sink) — DOM API now
- `syntax.resolve('constructor' | '__proto__')` returned Object internals; `i18n.t()` the same for prototype keys
- `registry.registerWhen(el)` skipped `el` itself when it is the lazy k3 element
- `?k3ui-debug=<unknown>` silenced the logger instead of using `info`
- Public property types: `k3-codeblock` `collapsedHeight`, `k3-qr-code` `color` / `background`, `k3-heart-burst` `count` were typed as their default literal (`150`, `"#000000"`…), rejecting any other value in TypeScript — also the cause of the failing `npm run lint`

### Added — audit 2026-11

- `K3UI.init()` options `direction`, `theme.contrast: 'auto'` (OS `prefers-contrast`, live), `motion.reduce` (`system` · `always`), `interaction.ripple`, `overlays.scrollLock` (opt-in); unknown keys / invalid values warn and are ignored; `__proto__` & co. never merged. `getInitOptions()`
- `locale` accepts BCP 47 tags (`fr-FR` → `fr`); `normalizeLocale()`
- `k3-tabs` WAI-ARIA keyboard pattern: roving tabindex, ←/→ (mirrored in RTL), Home / End
- `sanitizeSVG(markup, { allowIds })` — allowlist SVG icon sanitizer (shapes + presentation attributes; no handlers, `style`, `href`, `use`, `image`, `foreignObject`, animation; ids only on request)
- Core: `overlayStack`, `tabbableElements()`, shared on-screen signal (`src/core/visibility.ts`, one `IntersectionObserver` for all subscribers)
- Tests: 37 unit tests (focus trap, overlay stack, SVG sanitizer, init config, theme targets, tabs, forms, robustness) and Playwright specs for dialog / sheet keyboard & ARIA, nested Escape, forms and performance budgets. `PW_CHROMIUM_PATH` / `K3UI_E2E_ALL_BROWSERS` in `playwright.config.ts`; CI runs e2e (Chromium, + informative Firefox / WebKit job)

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
