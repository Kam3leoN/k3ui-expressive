import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { fileURLToPath } from 'node:url';

/* Repository root, wherever the clone lives (was hard-coded to D:/K3ui). */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsPath = path.join(root, 'dist/k3ui.js');
const cssPath = path.join(root, 'dist/k3ui.css');

// Soft budgets for early 0.0.x — CSS excludes self-hosted fonts (dist/fonts)
/* Measured: ~604 kB JS (one inlined bundle) incl. the chart engine (~70 kB — candidate for an
 * on-demand pack like dist/k3ui-syntax.js), the syntax core + web grammars (~15 kB) and the
 * card effects (~14 kB: holo, scratch, lenticular + their strings) / ~13 kB CSS.
 * Raise only on purpose — and tighten again once components ship as chunks. */
const LIMITS = {
  /* 610 → 620 with k3-coverflow (+ its doc strings): ≈ +5.8 kB gzip, then
   * its lightbox, side arrows, bullets and full-width fit: ≈ +4.2 kB.
   * 620 → 625: nav-rail modal sheet chrome + menu side-dock / refit. */
  jsGzipKb: Number(process.env.K3UI_BUDGET_JS_KB ?? 625),
  /* Raised with layout helpers (display/flex/spacing/visibility) in k3ui.css */
  cssGzipKb: Number(process.env.K3UI_BUDGET_CSS_KB ?? 28),
  /* dist/lazy/k3ui.js + the chunks it imports statically (no component) — measured ≈ 92 */
  lazyBaseGzipKb: Number(process.env.K3UI_BUDGET_LAZY_BASE_KB ?? 105),
};

function gzipKb(file) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file}`);
    process.exit(1);
  }
  const buf = fs.readFileSync(file);
  return zlib.gzipSync(buf).length / 1024;
}

const js = gzipKb(jsPath);
const css = gzipKb(cssPath);
/* Optional language pack — loaded on demand, never part of k3ui.js */
const syntaxPath = path.join(root, 'dist/k3ui-syntax.js');
const syntaxKb = fs.existsSync(syntaxPath) ? gzipKb(syntaxPath) : 0;
console.log(`Budget: k3ui.js ${js.toFixed(1)} kB gzip (limit ${LIMITS.jsGzipKb})`);
console.log(`Budget: k3ui.css ${css.toFixed(1)} kB gzip (limit ${LIMITS.cssGzipKb})`);
if (syntaxKb) console.log(`Info:   k3ui-syntax.js ${syntaxKb.toFixed(1)} kB gzip (on demand)`);


/* On-demand build: what every page pays before its own components. */
const lazyManifest = path.join(root, 'dist/lazy/components.json');
if (!fs.existsSync(lazyManifest)) {
  console.error('Missing dist/lazy/components.json — run npm run build:lazy');
  process.exit(1);
}
const lazyBase = JSON.parse(fs.readFileSync(lazyManifest, 'utf8')).base.gzip / 1024;
console.log(`Budget: lazy base ${lazyBase.toFixed(1)} kB gzip (limit ${LIMITS.lazyBaseGzipKb})`);

if (js > LIMITS.jsGzipKb || css > LIMITS.cssGzipKb || lazyBase > LIMITS.lazyBaseGzipKb) {
  console.error('Bundle budget exceeded');
  process.exit(1);
}

// Enforce single primary artefacts exist
for (const f of ['k3ui.js', 'k3ui.css', 'tokens.json']) {
  if (!fs.existsSync(path.join(root, 'dist', f))) {
    console.error(`Missing dist/${f}`);
    process.exit(1);
  }
}
console.log('Budget OK — dist artefacts present');
