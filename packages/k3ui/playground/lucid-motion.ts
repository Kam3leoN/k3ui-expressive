/**
 * Motion helpers ported from lucid-clock-m3 (MIT) for PosterClock / WordCycle.
 * Springs use k3ui physics; reduced motion follows OS preference.
 */
import { prefersReducedMotion } from '../src/core/lifecycle.js';
import { springPhysics } from '../src/motion/springs.js';

export { prefersReducedMotion };

export interface SpringSpec {
  readonly dampingRatio: number;
  readonly stiffness: number;
}

/** Resolves when the element's current animation ends, or at once if it has none. */
export function afterAnimation(el: Element): Promise<void> {
  const anims = typeof el.getAnimations === 'function' ? el.getAnimations() : [];
  return anims.length
    ? Promise.all(anims.map((a) => a.finished)).then(
        () => undefined,
        () => undefined,
      )
    : Promise.resolve();
}

class Spring {
  position = 0;
  velocity = 0;
  private readonly omega: number;

  constructor(private readonly spec: SpringSpec) {
    this.omega = Math.sqrt(spec.stiffness);
  }

  impulseFor(amplitude: number): number {
    const { dampingRatio: z } = this.spec;
    const w = this.omega;
    if (z >= 1) return amplitude * w * Math.E;
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
 * Squash-and-stretch when the headline pill lands on a new width
 * (Lucid word-cycle — fast spatial spring).
 */
export function squash(
  el: HTMLElement,
  amplitude = 0.06,
  spec: SpringSpec = springPhysics.expressive.spatial.fast,
): void {
  if (prefersReducedMotion()) return;
  let spring = running.get(el);
  const fresh = !spring;
  spring ??= new Spring(spec);
  spring.velocity = Math.max(spring.velocity, spring.impulseFor(amplitude));
  if (!fresh) return;
  running.set(el, spring);

  const { width, height } = el.getBoundingClientRect();
  const spread = Math.max(0.2, Math.min(0.8, (2 * height) / Math.max(1, width)));
  let last = performance.now();

  const frame = (now: number): void => {
    spring!.step(Math.min(0.05, (now - last) / 1000));
    last = now;
    if (spring!.atRest) {
      el.style.transform = '';
      running.delete(el);
      return;
    }
    const s = spring!.position;
    el.style.transform = `scale(${(1 - s * spread).toFixed(4)}, ${(1 + s).toFixed(4)})`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
