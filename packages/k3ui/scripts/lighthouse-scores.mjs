/**
 * Audit the playground with Lighthouse (Chromium, desktop + mobile) and store
 * the scores shown on its home page.
 *
 *   npm run build:playground && npm run preview      # other terminal
 *   npm run lighthouse [-- http://127.0.0.1:4173/]
 *
 * Writes playground/public/lighthouse.json (and playground/dist/ when built).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FORM_FACTORS, runLighthouse } from './lighthouse-runner.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = process.argv[2] || process.env.LIGHTHOUSE_URL || 'http://127.0.0.1:4173/';

const result = { date: new Date().toISOString(), source: 'chromium', url: new URL(url).pathname };
for (const form of FORM_FACTORS) {
  console.log(`[lighthouse] ${form} — ${url}`);
  const { summary } = await runLighthouse(url, form);
  result[form] = { scores: summary.scores, metrics: summary.metrics };
  result.lighthouse = summary.lighthouse;
  const s = summary.scores;
  console.log(`[lighthouse] ${form}: perf ${s.performance} · a11y ${s.accessibility} · bp ${s['best-practices']} · seo ${s.seo}`);
}

const json = `${JSON.stringify(result, null, 2)}\n`;
const targets = [path.join(root, 'playground/public/lighthouse.json')];
try {
  await fs.access(path.join(root, 'playground/dist'));
  targets.push(path.join(root, 'playground/dist/lighthouse.json'));
} catch {
  /* playground not built */
}
for (const t of targets) {
  await fs.writeFile(t, json);
  console.log(`[lighthouse] wrote ${path.relative(root, t)}`);
}
