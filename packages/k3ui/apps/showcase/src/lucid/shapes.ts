/**
 * Drawing and morphing the M3 Expressive shapes (port of Lucid's lucidui/Shapes.js).
 * A shape is N radii; a morph mixes two radius lists; the outline is a
 * Catmull-Rom curve through the samples, written as SVG cubic segments.
 */
import { N, RADII, type ShapeName } from "./shape-radii.js";
import { ExpressiveSprings, prefersReducedMotion, Spring, type SpringSpec } from "./motion.js";

export type { ShapeName };
export const SHAPES = Object.keys(RADII) as ShapeName[];

export const radii = (name: ShapeName): readonly number[] => RADII[name] ?? RADII.circle;

export function mix(a: readonly number[], b: readonly number[], f: number): number[] {
  return a.map((v, i) => v + (b[i] - v) * f);
}

/** SVG path for radii `r`, in a `size` × `size` box, turned by `rot` radians */
export function shapePath(r: readonly number[], size: number, rot = 0): string {
  const c = size / 2;
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const th = (i / N) * 2 * Math.PI + rot;
    pts.push([c + c * r[i] * Math.cos(th), c + c * r[i] * Math.sin(th)]);
  }
  const f = (n: number): string => n.toFixed(2);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let j = 0; j < N; j++) {
    const p0 = pts[(j - 1 + N) % N], p1 = pts[j], p2 = pts[(j + 1) % N], p3 = pts[(j + 2) % N];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ` +
      `${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

/**
 * One filled shape in an <svg viewBox="0 0 100 100"><path/></svg>. `morphTo`
 * travels on a spring, so the outline overshoots a little and settles, the
 * way Compose's Morph does with the default spatial spring.
 */
export class MaterialShape {
  private current: ShapeName;
  private from: readonly number[];
  private raf = 0;

  constructor(private readonly path: SVGPathElement, shape: ShapeName, private readonly size = 100) {
    this.current = shape;
    this.from = radii(shape);
    path.setAttribute("d", shapePath(this.from, size));
  }

  get shape(): ShapeName {
    return this.current;
  }

  morphTo(next: ShapeName, spec: SpringSpec = ExpressiveSprings.spatial.default): void {
    if (next === this.current) return;
    const start = this.from;
    const target = radii(next);
    this.current = next;
    cancelAnimationFrame(this.raf);

    if (prefersReducedMotion()) {
      this.from = target;
      this.path.setAttribute("d", shapePath(target, this.size));
      return;
    }

    // the spring runs from −1 to 0; progress is 1 + position
    const spring = new Spring(spec);
    spring.position = -1;
    let last = performance.now();
    const frame = (now: number): void => {
      spring.step(Math.min(0.05, (now - last) / 1000));
      last = now;
      const done = spring.atRest;
      this.from = done ? target : mix(start, target, 1 + spring.position);
      this.path.setAttribute("d", shapePath(this.from, this.size));
      if (!done) this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }
}
