import { stepSpring, type Spring, type SpringState } from '../../motion/spring.js';
import { springPhysics } from '../../motion/springs.js';

/**
 * Fluid gooey snackbar — `data-k3-motion="fluid"` + expressive mode.
 *
 * Metaballs: a few SVG bodies under a blur + alpha-threshold filter merge
 * when close and pinch off when they part. The `.bar` keeps its CSS width
 * spring (content layout untouched) but turns transparent; the goo layer
 * draws the container and tracks the bar box live.
 *
 * Bodies (bar-local px):
 * - puddle — the screen edge swells, then drains
 * - drop   — rises from the puddle (neck → pinch-off), becomes the circle
 * - body   — the bar box itself (full radius)
 * - tips   — bulbs on both ends, swollen while the width springs
 *
 * Viscosity (blur stdDeviation) rises only while moving and falls back to 0;
 * the filter is then removed so the resting bar has crisp native edges.
 */

const SPRINGS = {
  viscIn: { dampingRatio: 1, stiffness: 380 },
  viscOut: { dampingRatio: 1, stiffness: 110 },
  fast: springPhysics.fluid.spatial.fast,
  default: springPhysics.fluid.spatial.default,
  drop: { dampingRatio: 0.55, stiffness: 240 },
  fall: { dampingRatio: 0.7, stiffness: 260 },
} as const satisfies Record<string, Spring>;

/** Blur (px) while liquid. */
const VISCOSITY = 12;
/** Below this blur the filter is removed (crisp edges at rest). */
const SOLID = 0.35;

/** Phase timings (ms) — keep in sync with TIMING in snackbar.ts. */
export const GOO_TIMING = {
  /** Drop has reached the circle (icon phase). */
  arrive: 520,
  /** Drop back in the edge (leaving phase). */
  leave: 560,
} as const;

class Track {
  readonly state: SpringState;
  target: number;
  spring: Spring = SPRINGS.default;

  constructor(value = 0) {
    this.state = { value, velocity: 0 };
    this.target = value;
  }

  get value(): number {
    return this.state.value;
  }

  to(target: number, spring: Spring): void {
    this.target = target;
    this.spring = spring;
  }

  snap(value: number): void {
    this.state.value = value;
    this.state.velocity = 0;
    this.target = value;
  }

  step(dt: number): void {
    stepSpring(this.state, this.target, this.spring, dt);
  }

  get settled(): boolean {
    return (
      Math.abs(this.state.value - this.target) < 0.05 && Math.abs(this.state.velocity) < 0.5
    );
  }
}

type Edge = 'bottom' | 'top';

export class SnackbarGoo {
  private readonly t = {
    visc: new Track(),
    puddleRx: new Track(),
    puddleRy: new Track(),
    /** Drop center offset from the bar center (0 = in place). */
    dropY: new Track(),
    dropR: new Track(),
    /** End bulb swell (0 = flush with the pill caps). */
    tip: new Track(),
  };
  private bodyOn = false;
  private edge: Edge = 'bottom';
  private startOffset = 0;
  private raf = 0;
  private last = 0;
  private timers: number[] = [];

  constructor(
    private readonly getBar: () => HTMLElement | null | undefined,
    private readonly getSvg: () => SVGSVGElement | null | undefined,
  ) {}

  /** Icon phase: edge swells, a drop rises, pinches off and becomes the circle. */
  enter(edge: Edge): void {
    this.reset();
    this.edge = edge;
    const bar = this.getBar();
    if (!bar) return;
    const r0 = bar.offsetHeight / 2;
    const rect = bar.getBoundingClientRect();
    const dir = edge === 'bottom' ? 1 : -1;
    /* Start just beyond the screen edge, in bar-local px from the bar center */
    const edgeY = edge === 'bottom' ? window.innerHeight - rect.top : -rect.top;
    this.startOffset = edgeY + dir * (r0 + 4) - r0;
    const { visc, puddleRx, puddleRy, dropY, dropR } = this.t;
    dropY.snap(this.startOffset);
    this.schedule([
      [0, () => {
        visc.to(VISCOSITY, SPRINGS.viscIn);
        puddleRx.to(r0 * 2.6, SPRINGS.fast);
        puddleRy.to(r0 * 1.1, SPRINGS.fast);
      }],
      [50, () => {
        dropY.to(0, SPRINGS.drop);
        dropR.to(r0, SPRINGS.fast);
      }],
      [170, () => {
        puddleRx.to(0, SPRINGS.default);
        puddleRy.to(0, SPRINGS.default);
      }],
      [GOO_TIMING.arrive, () => (this.bodyOn = true)],
      [600, () => visc.to(0, SPRINGS.viscOut)],
    ]);
  }

  /** Expanded / collapsing: the width springs in CSS, the ends lead as bulbs. */
  stretch(swell = 0.22): void {
    this.clearTimers();
    this.bodyOn = true;
    const { visc, tip } = this.t;
    this.schedule([
      [0, () => {
        visc.to(VISCOSITY * 0.85, SPRINGS.viscIn);
        tip.to(swell, SPRINGS.fast);
      }],
      [260, () => tip.to(0, SPRINGS.default)],
      [420, () => visc.to(0, SPRINGS.viscOut)],
    ]);
  }

  /** Leaving: the circle drops back, the edge swells to catch it. */
  leave(): void {
    this.clearTimers();
    const bar = this.getBar();
    if (!bar) return;
    const r0 = bar.offsetHeight / 2;
    const { visc, puddleRx, puddleRy, dropY, dropR, tip } = this.t;
    this.bodyOn = false;
    dropY.snap(0);
    dropR.snap(r0);
    tip.snap(0);
    this.schedule([
      [0, () => {
        visc.to(VISCOSITY, SPRINGS.viscIn);
        dropY.to(this.startOffset, SPRINGS.fall);
        dropR.to(r0 * 0.75, SPRINGS.fast);
      }],
      [120, () => {
        puddleRx.to(r0 * 2.3, SPRINGS.fast);
        puddleRy.to(r0 * 0.95, SPRINGS.fast);
      }],
      [300, () => {
        puddleRx.to(0, SPRINGS.default);
        puddleRy.to(0, SPRINGS.default);
        dropR.to(0, SPRINGS.default);
      }],
      [GOO_TIMING.leave, () => visc.to(0, SPRINGS.viscOut)],
    ]);
  }

  stop(): void {
    this.clearTimers();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private reset(): void {
    this.stop();
    this.bodyOn = false;
    for (const track of Object.values(this.t)) track.snap(0);
  }

  private clearTimers(): void {
    for (const id of this.timers) window.clearTimeout(id);
    this.timers = [];
  }

  private schedule(steps: Array<[number, () => void]>): void {
    for (const [at, fn] of steps) {
      if (at <= 0) {
        fn();
        continue;
      }
      const id = window.setTimeout(() => {
        this.timers = this.timers.filter((t) => t !== id);
        fn();
        this.loop();
      }, at);
      this.timers.push(id);
    }
    this.loop();
  }

  private loop(): void {
    if (this.raf) return;
    this.last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      const tracks = Object.values(this.t);
      for (const track of tracks) track.step(dt);
      this.draw();
      const busy = this.timers.length > 0 || tracks.some((track) => !track.settled);
      if (busy) {
        this.raf = requestAnimationFrame(tick);
      } else {
        this.raf = 0;
        for (const track of tracks) track.snap(track.target);
        this.draw();
      }
    };
    this.raf = requestAnimationFrame(tick);
  }

  private draw(): void {
    const bar = this.getBar();
    const svg = this.getSvg();
    if (!bar || !svg) return;
    const group = svg.querySelector<SVGGElement>('.goo-bodies');
    const blur = svg.querySelector('feGaussianBlur');
    if (!group || !blur) return;

    const w = bar.offsetWidth;
    const h = bar.offsetHeight;
    const r0 = h / 2;
    const { visc, puddleRx, puddleRy, dropY, dropR, tip } = this.t;

    if (visc.value < SOLID) {
      group.removeAttribute('filter');
    } else {
      group.setAttribute('filter', 'url(#k3-snackbar-goo)');
      blur.setAttribute('stdDeviation', visc.value.toFixed(2));
    }

    const rect = bar.getBoundingClientRect();
    const dir = this.edge === 'bottom' ? 1 : -1;
    const edgeY = this.edge === 'bottom' ? window.innerHeight - rect.top : -rect.top;

    const puddle = group.querySelector('.puddle');
    const drop = group.querySelector('.drop');
    const body = group.querySelector('.body');
    const tips = group.querySelectorAll('.tip');

    setAttrs(puddle, {
      cx: w / 2,
      cy: edgeY + dir * 6,
      rx: Math.max(0, puddleRx.value),
      ry: Math.max(0, puddleRy.value),
    });
    setAttrs(drop, { cx: w / 2, cy: r0 + dropY.value, r: Math.max(0, dropR.value) });
    setAttrs(body, {
      x: 0,
      y: 0,
      width: this.bodyOn ? w : 0,
      height: this.bodyOn ? h : 0,
      rx: r0,
    });
    const tipR = this.bodyOn ? r0 * (1 + Math.max(-0.5, tip.value)) : 0;
    setAttrs(tips[0] ?? null, { cx: r0, cy: r0, r: tipR });
    setAttrs(tips[1] ?? null, { cx: w - r0, cy: r0, r: tipR });
  }
}

function setAttrs(el: Element | null, attrs: Record<string, number>): void {
  if (!el) return;
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value.toFixed(2));
}
