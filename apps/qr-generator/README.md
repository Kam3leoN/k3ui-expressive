# k3ui QR generator (sample app)

Full content → design → download wizard built **with** k3ui. Not part of the published `k3ui` package.

## Run

Do **not** open `index.html` in the browser (file://) — modules and `@k3ui` aliases need Vite.

From the repo root:

```bash
npm run dev:qr
```

Then open **http://localhost:5174/**

```bash
npm run build:qr
npm run preview:qr
```

## Stack

- Local Lit CE `k3-qr-generator` (this folder)
- Imports `@k3ui/*` via Vite aliases to `../../src`
- Locale strings: `src/i18n/{en,fr}.json` merged with `i18n.extend()`
- Material Symbols: Google Fonts subset in `index.html` (`icon_names=…`) — wizard + child CE (select, password, segmented check, …)

## Deploy (Vercel)

Yes — a static deploy of this app works (unlike opening `index.html` as `file://`).

Example project settings for **this app only**:

- Root / install: repo root (`npm install`)
- Build: `npm run build:qr`
- Output: `apps/qr-generator/dist`
- `base: './'` is set so assets resolve on any path

Icons load from `fonts.googleapis.com` at runtime (online). The main k3ui playground Vercel project does **not** automatically include this app unless you point a project (or rewrite) at `apps/qr-generator`.
