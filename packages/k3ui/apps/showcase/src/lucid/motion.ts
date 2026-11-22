/**
 * M3 Expressive springs (Compose `MotionScheme.expressive()`), and the one
 * physical effect CSS cannot express: a squash-and-stretch driven by a real
 * spring, used when the headline pill lands on a new width.
 */

export interface SpringSpec {
  /** ζ: 1 is critically damped, below 1 overshoots */
  readonly dampingRatio: number;
  /** k, with mass 1 */
  readonly stiffness: number;
}

export const ExpressiveSprings = {
  spatial: {
    fast: { dampingRatio: 0.6, stiffness: 800 },
    default: { dampingRatio: 0.8, stiffness: 380 },
    slow: { dampingRatio: 0.8, stiffness: 200 },
  },
  effects: {
    fast: { dampingRatio: 1, stiffness: 3800 },
    default: { dampingRatio: 1, stiffness: 1600 },
    slow: { dampingRatio: 1, stiffness: 800 },
  },
} as const satisfies Record<"spatial" | "effects", Record<"fast" | "default" | "slow", SpringSpec>>;

export const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A damped harmonic oscillator around 0, stepped with semi-implicit Euler. */
export class Spring {
  position = 0;
  velocity = 0;
  private readonly omega: number;

  constructor(private readonly spec: SpringSpec) {
    this.omega = Math.sqrt(spec.stiffness);
  }

  /** Initial velocity that makes the first excursion peak at `amplitude`. */
  impulseFor(amplitude: number): number {
    const { dampingRatio: z } = this.spec;
    const w = this.omega;
    if (z >= 1) return amplitude * w * Math.E; // peak of t·e^(−ωt) is 1/(ωe)
    const wd = w * Math.sqrt(1 - z * z);
    const tPeak = Math.atan(wd / (z * w)) / wd;
    return (amplitude * wd) / (Math.exp(-z * w * tPeak) * Math.sin(wd * tPeak));
  }

  step(dt: number): void {
    const { dampingRatio: z } = this.spec;
    const w = this.omega;
    const substeps = 4;
    const h = dt / substeps;
    for (let i = 0; i < substeps; i++) {
      this.velocity += (-w * w * this.position - 2 * z * w * this.velocity) * h;
      this.position += this.velocity * h;
    }
  }

  get atRest(): boolean {
    return Math.abs(this.position) < 4e-4 && Math.abs(this.velocity) < 4e-3;
  }
}

const running = new WeakMap<HTMLElement, Spring>();

/**
 * Squash-and-stretch: the element grows taller and narrower, then settles,
 * following the fast spatial spring. Calling it again while it moves adds energy.
 */
export function squash(el: HTMLElement, amplitude = 0.06, spec: SpringSpec = ExpressiveSprings.spatial.fast): void {
  if (prefersReducedMotion()) return;
  let spring = running.get(el);
  const fresh = !spring;
  spring ??= new Spring(spec);
  spring.velocity = Math.max(spring.velocity, spring.impulseFor(amplitude));
  if (!fresh) return;
  running.set(el, spring);

  // wide elements bend less across than along
  const { width, height } = el.getBoundingClientRect();
  const spread = Math.max(0.2, Math.min(0.8, (2 * height) / Math.max(1, width)));
  let last = performance.now();

  const frame = (now: number): void => {
    spring.step(Math.min(0.05, (now - last) / 1000));
    last = now;
    if (spring.atRest) {
      el.style.transform = "";
      running.delete(el);
      return;
    }
    const s = spring.position;
    el.style.transform = `scale(${(1 - s * spread).toFixed(4)}, ${(1 + s).toFixed(4)})`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** Resolves when the element's current animation ends, or at once if it has none. */
export function afterAnimation(el: Element): Promise<void> {
  const anims = el.getAnimations();
  return anims.length ? Promise.all(anims.map((a) => a.finished)).then(() => undefined, () => undefined) : Promise.resolve();
}
