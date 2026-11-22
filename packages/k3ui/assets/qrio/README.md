# qr.io design assets (scraped from https://qr.io)

Source: API documentation icons (`pattern` / `marker` / `marker_in`) + homepage frame / logo assets.
API reference: https://qr.io/api-documentation

## Layout

| Folder | API param | Count | Role |
| --- | --- | ---: | --- |
| `patterns/` | `pattern` | **19** | Module / body shapes |
| `markers/` | `marker` | **15** (API) / **12** in UI | Finder outer rings |
| `marker_in/` | `marker_in` | **16** | Finder centres |
| `frames/` | `outer_frame` | — | Call-to-action silhouettes |
| `logos/` | — | — | Watermark / logo PNGs |

Canonical id lists live in `catalog.json` → `api_docs` (full API) and `markers` (UI subset).

## Wired into K3ui

- Renderer: `src/components/media/qr-code.qrio-shapes.ts` + `qr-code.render.ts` (`k3-qr-code`)
- Full wizard (content · design · download): **`apps/qr-generator`** — not part of the published package (`npm run dev:qr`)
- Omitted marker near-duplicates in UI: `drop_in`, `flower_in`, `dropeyeright` (aliased → `drop` / `flower` / `dropeye`)
- Legacy attribute aliases still work (`square`→`default`, `dots`→`circle`, …)

## Notes

- The public homepage picker only shows a subset; the API docs list the full enums mirrored here.
- `frames/new-frame-9.svg` is the circular frame (circle + SCAN ME).
