# Lighthouse — playground (novembre 2026)

Mesures Lighthouse 12.8.2, Chromium 1243 headless, build de production
(`npm run build:playground`) servi comme sur Vercel : en-têtes de `vercel.json`,
brotli, cache immuable sur `/assets`. Conteneur Linux à 2 vCPU : le score
Performance mobile varie de ±5 points d'un passage à l'autre (TBT bruité). Les
valeurs ci-dessous viennent de passages réels, non arrondis à notre avantage.

## Accueil `/`

| | Perf | A11y | Best Practices | SEO | FCP | LCP | TBT | CLS | SI |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile — avant | 68 | 100 | 100 | 100 | 1,5 s | 2,1 s | 1 900 ms | 0 | 4,3 s |
| Mobile — après (3 derniers passages) | 88 · 90 · 89 | 100 | 100 | 100 | 1,2 s | 1,5 s | 410–470 ms | 0 | 1,6 s |
| Mobile — après (meilleurs passages de la session) | 95 · 96 | 100 | 100 | 100 | 1,2 s | 1,5–1,7 s | 210–270 ms | 0 | 1,6 s |
| Desktop — avant | 95 | 100 | 100 | 100 | 0,4 s | 1,2 s | 130 ms | 0 | 1,0 s |
| Desktop — après (2 passages) | **100** · **100** | 100 | 100 | 100 | 0,3 s | 0,4 s | 0–10 ms | 0 | 0,6 s |

## Pages en lien direct (desktop)

| Page | Avant | Après |
| --- | --- | --- |
| `#/buttons` | Perf 85 | Perf 97 · A11y 100 |
| `#/dialog` | Perf 87 | Perf 97 · A11y 100 |
| `#/text-field` | Perf 91 · **A11y 97** (`label`) | Perf 98 · A11y 100 |
| `#/carousel`, `#/list`, `#/select` | — | Perf 94 / 97 / 98 · A11y 100 |

## Accessibilité sur les 104 pages (axe-core, règles WCAG 2.1 A/AA + bonnes pratiques)

Avant : 9 règles notées par Lighthouse en échec sur 30+ pages — `button-name`,
`aria-required-children`, `aria-required-parent`, `aria-input-field-name`,
`aria-hidden-focus`, `aria-roles`, `aria-prohibited-attr`, `aria-allowed-role`,
`color-contrast`, `heading-order`, plus `label` (text-field).
Après : **aucune**. Restent 3 règles qu'axe signale mais que Lighthouse ne note pas :
`region` (contenu hors repère), `nested-interactive` (signature, chip, card),
`landmark-unique` (démos de navigation qui répètent `nav`).

## Ce qui a été changé

Bibliothèque (profite à toutes les applications) :

- `K3Element` répercute `aria-label`, `aria-expanded`, `aria-haspopup`,
  `aria-controls` de l'hôte sur le `<button>` interne de `k3-button`, `k3-fab`,
  `k3-icon-button` (boutons icône sans nom accessible) ; `k3-slider` nomme ses
  poignées avec l'`aria-label` de l'hôte ; déclencheurs de `k3-fab-dial` /
  `k3-fab-rail` nommés.
- `k3-text-field` : le champ interne porte le libellé (`aria-label`).
- `k3-select` : ses `k3-menu-item` sont des `option` de la `listbox` (ils
  étaient `menuitemradio`).
- `k3-list` : rôle et nom sur le conteneur qui contient les éléments (le menu
  d'actions n'est plus un enfant invalide de la liste) ; indicateur de sélection
  `inert` (case à cocher focalisable sous `aria-hidden`).
- `k3-mood-calendar` : `row` / `gridcell` (en `display: contents`) dans la grille,
  années en `group`.
- `k3-alert` : conteneur `div` (le rôle `status` n'est pas permis sur `aside`).
- `k3-text-bounce` : texte lisible en `sr-only` (pas d'`aria-label` sur `<p>`).
- `k3-quote` : attribut `job-title` (l'attribut `role` reste accepté).
- `k3-carousel-item` : ombre portée du libellé (contraste sur image claire).
- Performance : `k3-button-group` ne force plus un recalcul de mise en page au
  premier rendu (≈ 400 ms à CPU ×4 sur le playground) ; `k3-fab-menu` ne lit plus
  le style calculé quand il est fermé ; `k3-scroll-to-top` lit le défilement une
  fois par frame ; sélection de `k3-nav-rail` / `k3-nav-bar` sans `offsetWidth`
  forcé ; `k3-loading-indicator` ne démarre son cycle qu'une fois visible ;
  `K3UI.init()` calcule le schéma de couleurs par tranches (`theme.prepare()`,
  cache des schémas) et rend la main entre les étapes (`yieldToMain()`, sans
  `setTimeout` : compatible avec les faux timers des tests).

Playground :

- `index.html` ne contient plus que le shell et l'accueil (490 kB → 70 kB) ; les
  autres pages sont extraites au build dans `assets/doc-pages-<hash>.json` et
  réinsérées après le premier affichage, par petits lots (comme le parseur HTML).
- Grille du catalogue pré-rendue au build (LCP desktop).
- L'application se charge après le LCP de la page statique.
- Démarrage découpé en tâches courtes ; menu secondaire construit à la première
  ouverture ; effets holo (CSS GPL) chargés avec leur page.
- Lien direct : voile de chargement dès le premier rendu au lieu d'un flash de
  l'accueil (CLS 1,3 → 0 sur `#/dialog`), composants de la page mis à niveau
  avant affichage.
- Accessibilité des démos : noms des boutons icône, couleurs de libellé des
  nuanciers au contraste maximal, titres hiérarchisés, rôles corrigés.

## Limites

- **Performance mobile à 100 non atteinte** (88–96 selon le passage). Il reste
  ≈ 250–450 ms de TBT simulé : évaluation du bundle `app` du playground (437 kB,
  dont ≈ 180 kB de textes de documentation embarqués dans les catalogues i18n de
  la bibliothèque), premier calcul MCU, rendu Lit du shell, mise en page
  initiale. Les étapes suivantes sont décrites ci-dessous.
- Ressources externes (polices Material Symbols depuis Google) inaccessibles
  dans l'environnement de mesure : Best Practices est mesuré sans elles.
- Firefox / WebKit non testés ici.

## Prochaines étapes pour le 100 mobile

1. Sortir les ≈ 1 290 clés `doc.*` / `playground.*` des catalogues de la
   bibliothèque (`src/i18n/locales`) vers le playground (`i18n.extend()`) :
   −180 kB bruts dans `k3ui.js` **et** dans le bundle du playground. Changement
   de contenu de `i18n.t()` pour ces clés internes : à valider (test
   `i18n-en-us` à adapter).
2. Découper `playground/app.ts` (4 400 lignes) par page.
3. Rendu serveur / Declarative Shadow DOM du shell (rail, barre d'app).
