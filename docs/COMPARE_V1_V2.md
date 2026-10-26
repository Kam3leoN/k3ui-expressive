# Comparaison K3ui v1 vs v2

**Date :** 2026-10-26  
**Repos :** [K3ui_OLD_v1](https://github.com/Kam3leoN/K3ui_OLD_v1) · [k3ui-expressive](https://github.com/Kam3leoN/k3ui-expressive) (`D:\K3ui`)  
**Critère « meilleur » :** kit UI Material 3 Expressive réutilisable (DX, a11y, thème, maintenabilité, distribution) — **pas** le volume de widgets démo / effets.

Matrice machine : [`COMPARE_V1_V2_matrix.json`](./COMPARE_V1_V2_matrix.json).

---

## Verdict

| | Score /100 |
|---|---|
| **v1** (classes + AutoInit) | **73.4** |
| **v2** (Lit custom elements) | **90.4** |
| Écart | **+17.0** → **gagnant clair : v2** (seuil plan ≥ 8) |

**Recommandation**

- **Nouveau projet / design system** → **v2** (`k3ui-expressive`).
- **App legacy** déjà sur `K.*` / classes `.btn` → **v1** court terme + migration progressive.
- **Effets** (Chart, Firework, Snow, QR, BarCode…) → rester sur v1 extensions ou libs dédiées ; ne pas regonfler le monolithe v2.

---

## Scores pondérés

Points = (note 0–5 / 5) × poids.

| Critère | Poids | v1 /5 | v2 /5 | Pts v1 | Pts v2 | Justification courte |
|---|---|---|---|---|---|---|
| Architecture & maintenabilité | 15 | 3 | 5 | 9.0 | 15.0 | Lit CE + Shadow DOM + registry unique vs CSS global + 17 managers |
| Parité P0/P1 | 15 | 4 | 4 | 12.0 | 12.0 | P0 37/37 et P1 23/23 portés ; v1 gagne en P2 effets hors-scope |
| Thème M3 Expressive | 12 | 4 | 5 | 9.6 | 12.0 | Les deux MCU ; v2 tokens `--k3-sys-*` + motion expressive + `k3-theme` |
| Accessibilité | 12 | 4 | 5 | 9.6 | 12.0 | v2 formAssociated + FocusTrap + checklist ; v1 Dialog/ARIA solides |
| DX & API | 10 | 3 | 5 | 6.0 | 10.0 | CE standards + playground intégré vs AutoInit / `K.*` |
| Qualité logicielle | 10 | 4 | 4 | 8.0 | 8.0 | v1 ~105 Jest 1:1 sans CI ; v2 70 Vitest + smoke PW, budget JS soft dépassé |
| Distribution & perf | 10 | 3 | 4 | 6.0 | 8.0 | v2 deps légères (lit+MCU) mais monolithe ~304 kB gzip ; v1 deps lourdes |
| Docs & demos | 8 | 4 | 5 | 6.4 | 8.0 | Playground Vite colocaté vs site PHP hors monorepo |
| Extensibilité | 5 | 5 | 3 | 5.0 | 3.0 | v1 deferred + extensions riches |
| Licence & gouvernance | 3 | 3 | 4 | 1.8 | 2.4 | MIT + repo actif v2 ; v1 Apache, 0 workflows CI |
| **Total** | **100** | | | **73.4** | **90.4** | |

---

## Inventaires

| | v1 | v2 |
|---|---|---|
| Modèle | Classes TS + AutoInit (`K.*`) | Lit 3 custom elements (`k3-*`) |
| Catalogue | **106** fichiers `src/components/*.ts` | **87** tags (`src/registry/catalog.ts`) |
| Tests | Jest ~105 composants (seuil couverture 70 %) | Vitest 70 + Playwright smoke |
| Docs | PHP `k3ui-docs.vercel.app` (hors repo) | Playground Vite ~75 pages |
| Licence | Apache-2.0 | MIT |
| Version affichée | 0.1.0 (npm **non publié**) | 0.0.1 |
| Deps runtime | MCU, echarts, gsap, jspdf, QR… | lit, MCU, material-shapes-ts, fontsource |
| Dist JS | Multi-chunk + deferred | Monolithe `dist/k3ui.js` ~304 kB gzip (budget soft 280) |
| Dist CSS | `k3ui(.min\|.core).css` | `k3ui.css` ~12.3 kB gzip (budget 24) |
| CI | 0 workflows sur le miroir OLD | Vercel playground |

---

## Parité composants

Couverture **pondérée** (P0×2 + P1), pas le raw count.

| Priorité | Porté | v2-only | Manquant v2 | Hors-scope effets |
|---|---|---|---|---|
| **P0** (core M3) | **37/37** | 0 | 0 | — |
| **P1** (pickers / nav riche) | **20** | **3** (search, bottom-app-bar, carousel) | 0 | — |
| **P2** (effets / extras) | — | — | — | **20** (Chart, Firework, Snow, QR…) |

Aucun trou P0/P1 critique côté v2.

---

## a11y (échantillon 10 P0)

| Composant | v1 | v2 |
|---|---|---|
| Dialog | FocusTrap + aria-modal / labelledby | FocusTrap + `aria-modal` |
| Button | aria-pressed / roles | aria-pressed / radio group |
| Text field | ARIA limitée (classe) | formAssociated + internals |
| Switch / Radio / Checkbox | ARIA présente | formAssociated |
| Slider / Select | ARIA légère | formAssociated + rich ARIA |
| Tabs / Menu | roles / aria | roles / menu geometry |
| Snackbar | aria limitée | aria + queue |
| Nav bar | aria limitée | structure CE |

**Note moyenne :** v1 ≈ 4/5 · v2 ≈ 5/5 (systématique form-associated + checklist composant).

---

## Thème M3 Expressive

| Capacité | v1 | v2 |
|---|---|---|
| Dynamic Color / MCU | oui (`DynamicColorManager`) | oui (`theme/` + init) |
| Seed / light / dark / auto | oui | oui (`K3UI.init({ theme })`) |
| Motion expressive | partiel (managers) | défaut `motion: 'expressive'` |
| Tokens | `--md-sys-color-*` (+ aliases) | `--k3-sys-*` (7 styles + layout) |
| Theme from image | oui (lazy) | non |
| Privacy / consent helpers | oui | non (hors scope DS) |

---

## Forces / faiblesses

### v1
- **+** Catalogue très large + extensions / deferred  
- **+** Tests composants quasi 1:1, Lighthouse / CSS regression tooling  
- **+** Theme-from-image, PrivacyManager  
- **−** CSS global, collision de classes, API `K.*` datée  
- **−** Deps runtime lourdes, npm non publié, CI absente sur OLD  

### v2
- **+** Architecture Lit moderne, Shadow DOM, lifecycle cancelable  
- **+** Parité P0/P1 complète, playground monorepo, i18n FR/EN  
- **+** Deps légères, checklist qualité composant  
- **−** Bundle JS monolithe au-dessus du budget soft  
- **−** Moins d’extensions / effets ; maturité 0.0.1  

---

## Backlog port prioritaire (v1 → v2)

Aucun P0/P1 manquant. Candidates utiles (pas Firework/Snow) :

1. `collapse` / expand — styles v2 orphelins, CE à finaliser  
2. `upload`  
3. `color-picker`  
4. `toast` (si API distincte du snackbar)  
5. `alert` (bannière inline)  
6. `scroll-spy`  
7. `command` (palette)

---

## Conclusion

Pour un **design system M3 Expressive** maintenable en 2026, **v2 est supérieur** (+17 pts). v1 reste une **réserve de features** (effets, Chart, QR, privacy helpers) et un **pont legacy**, pas la base recommandée pour les nouveaux travaux.
