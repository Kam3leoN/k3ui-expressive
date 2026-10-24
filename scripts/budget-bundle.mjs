import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.resolve('D:/K3ui');
const jsPath = path.join(root, 'dist/k3ui.js');
const cssPath = path.join(root, 'dist/k3ui.css');

// Soft budgets for early 0.0.x — CSS excludes self-hosted fonts (dist/fonts)
const LIMITS = {
  jsGzipKb: 280,
  cssGzipKb: 24,
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
console.log(`Budget: k3ui.js ${js.toFixed(1)} kB gzip (limit ${LIMITS.jsGzipKb})`);
console.log(`Budget: k3ui.css ${css.toFixed(1)} kB gzip (limit ${LIMITS.cssGzipKb})`);

if (js > LIMITS.jsGzipKb || css > LIMITS.cssGzipKb) {
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
