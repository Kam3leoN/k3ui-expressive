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

Hosted separately from the playground docs:

| Site | URL |
| --- | --- |
| Playground / docs | https://k3ui-expressive.vercel.app |
| This QR app | https://k3ui-apps-qr-generator.vercel.app |

Vercel project **`k3ui-apps-qr-generator`** (Root Directory = `apps/qr-generator`, see `vercel.json` here):

- Install: `cd ../.. && npm ci`
- Build: `cd ../.. && npm run build:qr`
- Output: `dist`
- `base: './'` so assets resolve on any path

Icons load from `fonts.googleapis.com` at runtime (online).
