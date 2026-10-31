# K3ui

**Material 3 Expressive** for the web — by **Kam3leoN**.

Greenfield v2 (not a fork of the previous class-based K3ui). Lit custom elements, TypeScript, SCSS design tokens, Tailwind CSS with purge. One JS + one CSS drop-in.

> Not affiliated with Google. “Material Design” and “Material 3” are trademarks of Google LLC.

## Install / use

```html
<link rel="stylesheet" href="dist/k3ui.css" />
<script type="module" src="dist/k3ui.js"></script>

<k3-button variant="filled">Hello</k3-button>
```

```ts
import { K3UI } from 'k3ui';
import 'k3ui/k3ui.css';

await K3UI.init({
  locale: 'fr',
  theme: { seed: '#00639B', mode: 'auto', motion: 'expressive' },
});
```

Manual bootstrap (skip auto-init):

```html
<script>
  window.K3UI_MANUAL = true;
</script>
<script type="module" src="dist/k3ui.js"></script>
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Playground |
| `npm run build` | `dist/k3ui.js` + `dist/k3ui.css` + `tokens.json` + budget check |
| `npm test` | Vitest |
| `npm run test:e2e` | Playwright smoke |
| `npm run version:bump -- patch` | Bump version + CHANGELOG |

## Architecture

- `src/core` — base element, lifecycle, focus trap, state layers
- `src/registry` + `src/bootstrap` — sole registration / `init()` path
- `src/components/{actions,inputs,feedback,containment,navigation,pickers,theme}`
- Lifecycle: `k3-open-start|end`, `k3-close-start|end`, plus press/select/change/morph where relevant (`preventDefault` on `*-start` cancels)

## v1 → v2 mapping (doc only)

| v1 | v2 |
| --- | --- |
| `K.Dialog` / `.dialog` AutoInit | `<k3-dialog>` + `.show()` / `.hide()` |
| `window.K3UI_OPTIONS` | `window.K3UI_OPTIONS` or `K3UI.init(options)` |
| SCSS class `.btn` | `<k3-button variant="…">` |
| Multi-chunk `dist/js` | Single `dist/k3ui.js` |

## Registration

Importing a component module defines its tag (guarded, like Material Web). With the
registry, dependencies come along: `K3UI.init({ components: ['k3-audio-player'] })` also
defines its slider, buttons and progress (`src/registry/deps.ts`, kept in sync by
`tests/unit/registry-deps.test.ts`).

## Theming

`K3UI.init({ theme: { seed: '#00639B', variant } })` — `variant` defaults to `expressive`
(hue-rotated, M3 Expressive). Use `tonalspot` to keep a brand colour recognisable.

## Development

```bash
npm ci
npm run dev           # playground
npm run check         # lint (tsc) + tests + build — same as CI
npm run build:playground
```

The playground self-hosts its Material Symbols subset. To use a new ligature, add it to
`playground/icons.json`, then regenerate the font:

```bash
pip install fonttools brotli
python3 scripts/subset-icons.py path/to/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].woff2
```

## License

MIT © Kam3leoN
