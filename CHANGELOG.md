# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- `k3-qr-code` — styled QR: zero-dependency encoder (ISO/IEC 18004, v1–40, ECC L–H), qr.io patterns / markers / centres, gradient, logo, CTA frames; PNG / SVG / JPEG / WebP export
- `buildQrPayload()` / `validateQrPayload()` helpers
- `i18n.extend()` — merge app/demo locale dictionaries into the runtime catalogs
- `src/registry/deps.ts` — registering a component also defines the elements it renders
- Every component module self-registers its tag on import (guarded)
- `resolveIdRef()` — `for="…"` targets resolve inside shadow roots (date / time pickers, slider)
- `--k3-text-field-max-width`; CI workflow and `npm run check`

### Changed

- Replaced `qr-code-styling`-based QR with in-house encoder + SVG renderer
- QR generator wizard moved out of the published package to `apps/qr-generator` (`npm run dev:qr`)

### Fixed

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
