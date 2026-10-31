/**
 * Build playground/public/json/material-symbols.json from Google Fonts metadata.
 *
 * Usage:
 *   node scripts/build-material-symbols-catalog.mjs
 *
 * Downloads https://fonts.google.com/metadata/icons?incomplete=true&key=material_symbols
 * and keeps names grouped like Sober’s Resources → Material Symbols browser.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'playground/public/json/material-symbols.json');
const META_URL =
  'https://fonts.google.com/metadata/icons?incomplete=true&key=material_symbols';

const GROUPS = [
  'Actions',
  'Activities',
  'Android',
  'Audio & Video',
  'Business',
  'Communicate',
  'Hardware',
  'Home',
  'Household',
  'Images',
  'Maps',
  'Privacy',
  'Social',
  'Text',
  'Transit',
  'Travel',
  'UI actions',
];

const CAT_MAP = {
  Actions: 'Actions',
  Activities: 'Activities',
  Android: 'Android',
  'Audio&Video': 'Audio & Video',
  Business: 'Business',
  Communicate: 'Communicate',
  Hardware: 'Hardware',
  Home: 'Home',
  Household: 'Household',
  Images: 'Images',
  Maps: 'Maps',
  Privacy: 'Privacy',
  Social: 'Social',
  Text: 'Text',
  Transit: 'Transit',
  Travel: 'Travel',
  'UI actions': 'UI actions',
};

const res = await fetch(META_URL);
if (!res.ok) throw new Error(`metadata fetch failed: ${res.status}`);
let raw = await res.text();
if (raw.startsWith(")]}'")) raw = raw.slice(4);
const meta = JSON.parse(raw);

const byGroup = Object.fromEntries(GROUPS.map((g) => [g, []]));

for (const icon of meta.icons || []) {
  const unsupported = icon.unsupported_families || [];
  if (unsupported.some((f) => /Material Symbols/i.test(f))) continue;
  const mapped = (icon.categories || []).map((c) => CAT_MAP[c]).filter(Boolean);
  if (!mapped.length) continue;
  byGroup[mapped[0]].push({
    name: icon.name,
    popularity: icon.popularity ?? 0,
  });
}

for (const g of GROUPS) {
  byGroup[g].sort(
    (a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name),
  );
}

const out = {
  groups: GROUPS,
  icons: Object.fromEntries(
    GROUPS.map((g) => [g, byGroup[g].map(({ name }) => name)]),
  ),
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
const total = GROUPS.reduce((n, g) => n + byGroup[g].length, 0);
console.log(`wrote ${OUT} (${total} icons, ${fs.statSync(OUT).size} bytes)`);
