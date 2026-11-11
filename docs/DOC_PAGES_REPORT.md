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

## Pages en attente

Voir `PENDING_PAGES` — lot Buttons en cours (`buttons-grid`, …).

## Décisions humaines

- `custom-elements.json` est généré au build (gitignore) — ne pas le committer.
- Pages `product: k3ux` restent dans PENDING jusqu’au lot UX.
