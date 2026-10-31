# Changelog

All notable changes to this project will be documented in this file.

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
