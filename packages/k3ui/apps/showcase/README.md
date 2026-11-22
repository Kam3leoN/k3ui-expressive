# k3ui Showcase (sample app)

Live UI patterns — **pricing**, **login**, and more — composed with k3ui.
Not part of the published `k3ui` package.

## Run

From the repo root:

```bash
npm run dev:showcase
```

Open **http://localhost:5175/**

```bash
npm run build:showcase
npm run preview:showcase
```

## Docs

Playground rail **Showcase** (between Styles and Sponsors) → hub `#/showcase`
with nav cards, then `#/showcase-pricing` / `#/showcase-login` for the live
pages.

## Stack

- Hash routes: `#/pricing` · `#/login`
- Imports `@k3ui/*` via Vite aliases to `../../src`
- Locale strings: `src/i18n/{en,fr}.json` via `i18n.extend()`
- Material Symbols: Google Fonts subset in `index.html`
- Shared page CSS: `src/pages.css` (imported by the docs mount too)
