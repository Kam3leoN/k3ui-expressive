/**
 * Regenerates src/shapes/material-shapes-svg.ts from material-shapes-ts
 * (AndroidX / Compose MaterialShapes geometry — same 35 as the M3 Figma kit).
 *
 * Usage: npm i -D material-shapes-ts && node scripts/export-material-shapes.mjs
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadLib() {
  const candidates = [
    path.join(root, 'node_modules/material-shapes-ts/dist/index.js'),
    path.join(root, '.temp/shapes-export/node_modules/material-shapes-ts/dist/index.js'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return require(c);
  }
  throw new Error('material-shapes-ts not found — install it or use .temp/shapes-export');
}

const { MaterialShapes, roundedPolygonToPath } = loadLib();
const names = MaterialShapes.names;
const out = {};
for (const name of names) {
  out[name] = roundedPolygonToPath(MaterialShapes.byName(name)).toSvgPathData();
}

const dest = path.join(root, 'src/shapes/material-shapes-svg.ts');
const body = `/**
 * Material 3 Expressive — 35 shapes as normalized SVG path \`d\` (viewBox 0 0 1 1).
 * Source geometry: AndroidX Graphics Shapes / Compose MaterialShapes (M3 Figma kit).
 * Regenerate: node scripts/export-material-shapes.mjs
 */

export const MATERIAL_SHAPE_NAMES = ${JSON.stringify(names, null, 2)} as const;

export type MaterialShapeName = (typeof MATERIAL_SHAPE_NAMES)[number];

/** SVG path \`d\` for each shape, coordinates in unit square [0,1]. */
export const MATERIAL_SHAPE_SVG: Record<MaterialShapeName, string> = ${JSON.stringify(out, null, 2)};

export function materialShapeSvg(name: MaterialShapeName): string {
  return MATERIAL_SHAPE_SVG[name];
}
`;

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, body);
console.log(`Wrote ${names.length} shapes → ${dest}`);
