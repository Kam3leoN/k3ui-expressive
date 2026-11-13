# Tests — couverture & signalement

## Suites

| Couche | Outil | Emplacement | Bloque le CI |
| --- | --- | --- | --- |
| Unitaire | Vitest | `tests/unit/**` | Oui (`check`) |
| E2E Chromium | Playwright | `tests/e2e/**` | Oui (`e2e`) |
| Mobile (Pixel 5 / iPhone 12 metrics sur Chromium) | Playwright | mêmes specs + `mobile.spec.ts` | Oui (`K3UI_E2E_MOBILE=1`) |
| Firefox / WebKit | Playwright | mêmes specs | Non (`continue-on-error`) |
| Budget bundle | `scripts/budget-bundle.mjs` | via `npm run build` | Oui — **ne pas lever les limites pour faire passer** |

## Catégories couvertes

- Clavier / ARIA — `overlay-a11y`, `keyboard-nav`, `a11y-names`, `a11y-forms-hardening`
- Perf mesurable — `perf.spec.ts` (updates/frame, scriptMs)
- Mémoire — `memory.spec.ts` (heap Chromium + cycles dialog)
- Stress — `stress.spec.ts`
- Visuel — `visual.spec.ts` (snapshots Chromium locaux ; `npm run test:e2e:update-snapshots` ; CI seulement si `K3UI_E2E_VISUAL=1`)
- Sécurité / fuzz — `sanitize*.test.ts`, `sanitize-fuzz.test.ts`
- Config — `init-config*.test.ts`
- Registre / deps / recreate — `registry-deps`, `registry-lifecycle`, `concurrent-components`, `lifecycle-concurrent`
- Régression playground — `playground-load`, `smoke`, `forms`

## Env

```bash
# Mobile emulations (Chromium)
K3UI_E2E_MOBILE=1 npm run test:e2e

# Firefox + WebKit
K3UI_E2E_ALL_BROWSERS=1 npm run test:e2e

# Chromium préinstallé
PW_CHROMIUM_PATH=/path/to/chrome npm run test:e2e
```

## Signalement

Un échec Vitest, e2e Chromium (desktop + mobile), lint ou budget → statut GitHub Actions **rouge**.
Firefox/WebKit restent informatifs jusqu’à stabilisation.
