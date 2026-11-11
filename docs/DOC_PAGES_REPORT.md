# Rapport — migration gabarit doc

## Phase 0 (outillage)

| Étape | Statut | Notes |
| --- | --- | --- |
| B1 k3-codeblock | OK | `mount-usage.ts` + conversion `index.html` ; `.code-block` CSS retiré |
| B2 createExample | OK | `playground/create-example.ts` |
| B3 DOC_SECTIONS | OK | `playground/doc-sections.ts` (91 pages, `{ na }` initial) |
| B4 tables | OK | theming / keyboard / motion ; `{ na }` ; `field-row` retiré |
| B5 mountDocPage | OK | remplace `mountDocTables` + `mountUsageIfNeeded` |
| B6 garde-fou | OK | `tests/unit/doc-pages.test.ts` + `PENDING_PAGES` = tout le catalogue |
| B7 CEM | OK | `@custom-elements-manifest/analyzer` ; globs filtrés (évite crash circular JSON sur `**/*.ts`) ; `npm run manifest` dans `build` ; comparaison noms pour pages hors PENDING |

## Pages traitées

| Page | Commit message | Notes |
| --- | --- | --- |
| `buttons` | `docs(buttons): gabarit complet` | Examples (shape/variant/size) + States |
| `text-field` | `docs(text-field): gabarit complet` | Examples (variant) + States |
| `dialog` | `docs(dialog): gabarit complet` | Examples (variant) + Versions |
| `textarea` | `docs(textarea): gabarit complet` | Examples (variant, rows) + States |
| `field-group` | `docs(field-group): gabarit complet` | Examples (label) + States |
| `pin-field` | `docs(pin-field): gabarit complet` | Examples (variant, mask) + States |
| `select` | `docs(select): gabarit complet` | Examples (variant) + States |
| `checkbox` | `docs(checkbox): gabarit complet` | Examples + States |
| `radio` | `docs(radio): gabarit complet` | Examples (name) + States |
| `switch` | `docs(switch): gabarit complet` | Examples (selected) + States |
| `chip` | `docs(chip): gabarit complet` | Examples (variant…) + States + Versions |
| `counter` | `docs(counter): gabarit complet` | Examples (size, step) + States |
| `autocomplete` | `docs(autocomplete): gabarit complet` | Examples + States |
| `slider` | `docs(slider): gabarit complet` | Examples (playground) + States + Versions |
| `date-picker` | `docs(date-picker): gabarit complet` | Examples + States + Versions |
| `mood-calendar` | `docs(mood-calendar): gabarit complet` | Examples (demo) |
| `time-picker` | `docs(time-picker): gabarit complet` | Examples + States + Versions |
| `buttons-icon` | `docs(buttons-icon): gabarit complet` | Examples + States |
| `buttons-grid` | `docs(buttons-grid): gabarit complet` | Examples + Versions |
| `buttons-group` | `docs(buttons-group): gabarit complet` | Examples + States + Versions |
| `buttons-menu` | `docs(buttons-menu): gabarit complet` | Examples + States |
| `buttons-pad` | `docs(buttons-pad): gabarit complet` | Examples + Versions |
| `buttons-pill` | `docs(buttons-pill): gabarit complet` | Examples + States + Versions |
| `buttons-smart` | `docs(buttons-smart): gabarit complet` | Examples + States · pas de PAGE_TAGS (CEM sans tagName) |
| `buttons-split` | `docs(buttons-split): gabarit complet` | Examples + States |
| `buttons-segmented` | `docs(buttons-segmented): gabarit complet` | Examples + Versions |
| `fab` | `docs(fab): gabarit complet` | Examples (size/variant) + States |
| `fab-extended` | `docs(fab-extended): gabarit complet` | Examples (size/variant) + States |
| `fab-menu` | `docs(fab-menu): gabarit complet` | Examples (size/variant/placement) + States · icônes ms notranslate |
| `fab-dial` | `docs(fab-dial): gabarit complet` | Examples (position) |
| `fab-rail` | `docs(fab-rail): gabarit complet` | Examples (position/direction) |
| `ripple` | `docs(ripple): gabarit complet` | Examples (bounded) · Usage h2 retiré |
| `shape-chip` | `docs(shape-chip): gabarit complet` | Examples (placement/size) + States |
| `progress` | `docs(progress): gabarit complet` | Examples (shape + lab) + States + Versions |
| `loading` | `docs(loading): gabarit complet` | Examples (contained) · tag `k3-loading-indicator` |
| `skeleton` | `docs(skeleton): gabarit complet` | Examples (animation/shape) + States |
| `lazy` | `docs(lazy): gabarit complet` | Examples (fallback) + States |
| `snackbar` | `docs(snackbar): gabarit complet` | Examples (duration/action/dismiss) |
| `alert` | `docs(alert): gabarit complet` | Examples (variant/shape/dismissible) |
| `tooltip` | `docs(tooltip): gabarit complet` | Examples (position/variant) + Versions |
| `badge` | `docs(badge): gabarit complet` | Examples (dot/value/position) + States |
| `avatar` | `docs(avatar): gabarit complet` | Examples (variant/status/size/…) + States |
| `bubble` | `docs(bubble): gabarit complet` | Examples (placement/color) + States |
| `quote` | `docs(quote): gabarit complet` | Examples (layout/tilt) + States |
| `codeblock` | `docs(codeblock): gabarit complet` | Examples (collapsible/language) + States |
| `carousel` | `docs(carousel): gabarit complet` | Examples (layouts) + States + Versions |
| `coverflow` | `docs(coverflow): gabarit complet` | Examples (effect/orientation) + States + Versions |
| `card` | `docs(card): gabarit complet` | Examples (variant/interactive/media/…) + States |
| `menu` | `docs(menu): gabarit complet` | Examples (open-on/variant/density) + States + Versions |
| `list` | `docs(list): gabarit complet` | Examples (variant/selection/expand/…) + States |
| `table` | `docs(table): gabarit complet` | Examples (variant/columns) + States |
| `sheet` | `docs(sheet): gabarit complet` | Examples (placement/width/side) + States + Versions |
| `breadcrumb` | `docs(breadcrumb): gabarit complet` | Examples + States |
| `app-bar` | `docs(app-bar): gabarit complet` | Examples (size/align/sticky) + States + Versions |
| `footer-bar` | `docs(footer-bar): gabarit complet` | Examples + States |
| `tabs` | `docs(tabs): gabarit complet` | Examples (variant) + States + Versions |
| `navigation-bar` | `docs(navigation-bar): gabarit complet` | Examples (layout) + States + Versions |
| `navigation-rail` | `docs(navigation-rail): gabarit complet` | Examples (lab) + States + Versions |
| `index-list` | `docs(index-list): gabarit complet` | Examples + States |
| `prev-next` | `docs(prev-next): gabarit complet` | Examples + States |
| `pagination` | `docs(pagination): gabarit complet` | Examples + States |
| `pagination-alpha` | `docs(pagination-alpha): gabarit complet` | Examples + States + Versions |
| `scroll-to-top` | `docs(scroll-to-top): gabarit complet` | Examples + States |
| `toolbar` | `docs(toolbar): gabarit complet` | Examples + States + Versions |
| `gestures` | `docs(gestures): gabarit complet` | Examples + States · utility (no PAGE_TAGS) |
| `keyboard` | `docs(keyboard): gabarit complet` | Examples + States · utility (no PAGE_TAGS) |
| `keyboard-media` | `docs(keyboard-media): gabarit complet` | Examples + States · demo may reference deleted `k3-audio-player` |
| `mouse` | `docs(mouse): gabarit complet` | Examples + States · utility (no PAGE_TAGS) |
| `dnd` | `docs(dnd): gabarit complet` | Examples + States · utility (no PAGE_TAGS) |
| `scrollbar` | `docs(scrollbar): gabarit complet` | Examples + States · utility (no PAGE_TAGS) |

## Pages en attente

Voir `PENDING_PAGES` — uniquement pages `product: k3ux` (composants retirés du tree / lot UX). Aucune page k3ui restante hors Styles/Resources.

## Bloqués / hors lot k3ui (rester PENDING)

| Page | Raison |
| --- | --- |
| `iso-filter`, `masonry` | `product: k3ux` + composants retirés de `src/components/containment/` |
| `signature`, `rating`, `wheel-picker`, `countdown`, `marquee`, `sound-fx`, `confetti`, `text-bounce`, `text-scramble`, `heart-burst`, `halftone`, `card-holo`, `card-lenticular`, `card-scratch`, `audio-player`, `qr-code`, `charts-*` | `product: k3ux` (et/ou sources retirées du tree) — lot UX |
| `keyboard-media` (démo) | Démo playground référence `k3-audio-player` retiré — page utilitaire k3ui migrée ; démo audio bloquée jusqu’au lot UX |

## Décisions humaines

- `custom-elements.json` est généré au build (gitignore) — ne pas le committer.
- Pages `product: k3ux` restent dans PENDING jusqu’au lot UX.
