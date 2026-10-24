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

## License

MIT © Kam3leoN
