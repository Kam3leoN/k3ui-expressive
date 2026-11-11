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

_(aucune — phase C à suivre : `buttons`, `text-field`, `dialog`)_

## Pages en attente

Voir `PENDING_PAGES` dans `tests/unit/doc-pages.test.ts` (91 ids).

## Décisions humaines

- `custom-elements.json` est généré au build (gitignore) — ne pas le committer.
- Pages `product: k3ux` restent dans PENDING jusqu’au lot UX.
