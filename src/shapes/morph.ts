import { MaterialShapes, Morph, morphToPath } from 'material-shapes-ts';
import type { MaterialShapeName } from './material-shapes-svg.js';
import { MATERIAL_SHAPE_SVG } from './material-shapes-svg.js';

export interface MorphShapeOptions {
  from: MaterialShapeName;
  to: MaterialShapeName;
  /** 0..1 */
  progress: number;
}

const morphCache = new Map<string, Morph>();

function getMorph(from: MaterialShapeName, to: MaterialShapeName): Morph {
  const key = `${from}->${to}`;
  let m = morphCache.get(key);
  if (!m) {
    const a = MaterialShapes.byName(from);
    const b = MaterialShapes.byName(to);
    m = new Morph(a, b);
    morphCache.set(key, m);
  }
  return m;
}

/**
 * Feature-matched Material morph → SVG `d` (unit square).
 * Catalog paths in material-shapes-svg.ts remain the static source of truth.
 */
export function morphMaterialShapes(options: MorphShapeOptions): string {
  const t = Math.min(1, Math.max(0, options.progress));
  if (t <= 0) return MATERIAL_SHAPE_SVG[options.from];
  if (t >= 1) return MATERIAL_SHAPE_SVG[options.to];
  try {
    return morphToPath(getMorph(options.from, options.to), t).toSvgPathData();
  } catch {
    return t < 0.5 ? MATERIAL_SHAPE_SVG[options.from] : MATERIAL_SHAPE_SVG[options.to];
  }
}

export interface AnimateMorphOptions {
  from: MaterialShapeName;
  to: MaterialShapeName;
  duration?: number;
  onFrame: (d: string) => void;
  signal?: AbortSignal;
}

/** RAF morph between two catalog shapes (expressive spatial easing). */
export function animateMaterialShapeMorph(options: AnimateMorphOptions): Promise<void> {
  const duration = options.duration ?? 500;
  const morph = getMorph(options.from, options.to);
  const start = performance.now();

  return new Promise((resolve) => {
    const tick = (now: number): void => {
      if (options.signal?.aborted) {
        resolve();
        return;
      }
      const u = Math.min(1, (now - start) / duration);
      const e = u === 1 ? 1 : 1 - Math.pow(2, -10 * u);
      options.onFrame(morphToPath(morph, e).toSvgPathData());
      if (u < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}
