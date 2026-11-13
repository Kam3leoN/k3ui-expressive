/**
 * Component graph read from the sources — shared by the on-demand build
 * (vite.lazy.config.ts) and the custom pack builder (scripts/build-pack.mjs).
 * Single source of truth stays src/registry/{catalog,deps}.ts; the parsing is
 * checked against the real modules by tests/unit/registry-graph.test.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Value exports of `k3ui` that `k3ui/lazy` leaves out (they embed component
 * code — see src/index.ts). Kept in sync by tests/unit/entries.test.ts.
 */
export const LAZY_OMITTED_EXPORTS = [
  'MATERIAL_SHAPE_NAMES',
  'MATERIAL_SHAPE_SVG',
  'materialShapeSvg',
  'morphMaterialShapes',
  'animateMaterialShapeMorph',
  'resolveSnackbarDuration',
  'snackbarShouldStack',
  'SNACKBAR_DURATION_MS',
  'SNACKBAR_STACK_ACTION_DP',
  'K3Coverflow',
  'K3CoverflowItem',
];

/** `[{ tag, file }]` — `file` is relative to src/components, without extension. */
export function readCatalog() {
  const src = fs.readFileSync(path.join(root, 'src/registry/catalog.ts'), 'utf8');
  const re = /tag:\s*'(k3-[a-z0-9-]+)',\s*load:\s*\(\)\s*=>\s*import\('\.\.\/components\/([\w/.-]+?)\.js'\)/g;
  return [...src.matchAll(re)].map((m) => ({ tag: m[1], file: m[2] }));
}

/** `{ tag: [children it renders] }` */
export function readDeps() {
  const src = fs.readFileSync(path.join(root, 'src/registry/deps.ts'), 'utf8');
  const deps = {};
  for (const m of src.matchAll(/^\s*'(k3-[a-z0-9-]+)':\s*\[([^\]]*)\]/gm)) {
    deps[m[1]] = [...m[2].matchAll(/'(k3-[a-z0-9-]+)'/g)].map((d) => d[1]);
  }
  return deps;
}

/** `select` → `k3-select` */
export function normalizeTag(name) {
  const tag = String(name).trim().toLowerCase();
  return tag.startsWith('k3-') ? tag : `k3-${tag}`;
}

/**
 * Tags + everything they need, transitively (a select brings its text field
 * and menu items). Catalog order; throws on unknown tags.
 */
export function closure(tags, catalog = readCatalog(), deps = readDeps()) {
  const known = new Set(catalog.map((c) => c.tag));
  const out = new Set();
  const visit = (tag) => {
    if (out.has(tag)) return;
    if (!known.has(tag)) throw new Error(`Unknown component: ${tag}`);
    out.add(tag);
    for (const dep of deps[tag] ?? []) visit(dep);
  };
  for (const tag of tags) visit(normalizeTag(tag));
  return catalog.map((c) => c.tag).filter((t) => out.has(t));
}

/** Absolute source file of a catalog entry. */
export function sourceFile(entry) {
  return path.join(root, 'src/components', `${entry.file}.ts`);
}
