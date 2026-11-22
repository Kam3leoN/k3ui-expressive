/**
 * Home page Material shapes — allowlist for hero morph (3 coupled) + stats counters.
 * Cookie*Sided / Clover*Leaf expand to every matching catalog name.
 */
import {
  MATERIAL_SHAPE_NAMES,
  type MaterialShapeName,
} from '../src/shapes/index.js';

const HOME_SHAPE_ALLOW = new Set<string>([
  'Circle',
  'Square',
  'Slanted',
  'Arch',
  'Pill',
  'Diamond',
  'Pentagon',
  'Gem',
  'VerySunny',
  'Sunny',
  'SoftBurst',
  'Flower',
  ...MATERIAL_SHAPE_NAMES.filter(
    (n) => n.startsWith('Cookie') && n.endsWith('Sided'),
  ),
  ...MATERIAL_SHAPE_NAMES.filter(
    (n) => n.startsWith('Clover') && n.endsWith('Leaf'),
  ),
]);

/** Catalog subset used on the home page (hero morph + stats). */
export const HOME_SHAPE_NAMES = MATERIAL_SHAPE_NAMES.filter((n) =>
  HOME_SHAPE_ALLOW.has(n),
) as MaterialShapeName[];

/** Pick a random home-allowlisted shape different from `exclude`. */
export function pickRandomHomeShape(exclude: MaterialShapeName): MaterialShapeName {
  const pool = HOME_SHAPE_NAMES;
  if (pool.length < 2) return exclude;
  let next = pool[Math.floor(Math.random() * pool.length)]!;
  for (let i = 0; i < 8 && next === exclude; i++) {
    next = pool[Math.floor(Math.random() * pool.length)]!;
  }
  if (next === exclude) {
    const idx = pool.indexOf(exclude);
    next = pool[(idx + 1) % pool.length]!;
  }
  return next;
}
