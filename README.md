# k3-expressive

Monorepo for **Material 3 Expressive** web components by Kam3leoN. It uses npm workspaces,
and each package is versioned and published on its own:

| Package | Folder | npm | Description |
| --- | --- | --- | --- |
| **k3ui** | [`packages/k3ui`](packages/k3ui) | `npm i k3ui` | Material 3 Expressive web components (Lit + TypeScript) |
| **k3ux** | [`packages/k3ux`](packages/k3ux) | `npm i k3ux` | Optional UX companion: animations, media, charts. Peer: `k3ui` |

> Not affiliated with Google. “Material Design” and “Material 3” are trademarks of Google LLC.

## Development

```bash
npm ci                 # one install for both packages (k3ui ↔ k3ux linked)
npm run dev            # k3ui playground (k3ux docs included)
npm run dev:k3ux       # k3ux standalone playground
npm run lint           # tsc --noEmit in each package
npm run build          # k3ui then k3ux
npm test               # Vitest in each package (run after build: some tests read dist/lazy)
npm run test:e2e       # Playwright (k3ui playground)
npm run check          # lint + test + build — same as CI
```

Package-specific scripts: `npm run <script> -w k3ui` or `-w k3ux`.

## Releases

Each package is released separately. Bump the version in `packages/<name>/package.json`,
then push a tag named `<name>@<version>`:

```bash
git tag k3ui@1.2.8 && git push origin k3ui@1.2.8
git tag k3ux@0.2.3 && git push origin k3ux@0.2.3
```

`.github/workflows/release.yml` checks that the tag matches the version, runs lint, build
and tests, then runs `npm publish -w <name>` (secret `NPM_TOKEN`).

## License

k3ui: MIT. k3ux: MIT, except `addons/holo-effects` (GPL-3.0-only), which ships as a separate
optional CSS file. See each package's `LICENSE`.
