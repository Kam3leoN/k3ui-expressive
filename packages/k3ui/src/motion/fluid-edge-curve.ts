/**
 * Fluid curved edge — opening edge bows with size velocity under
 * `data-k3-motion="fluid"` (nav-rail width, sheet / menu visual box).
 *
 * Spans the full free edge (top→bottom / start→end); middle leads outward while
 * growing and inward while shrinking. Sag = velocity × gain, capped.
 *
 * - outward → `.edge` child (`background: inherit`) clipped to a bulge lens
 * - inward  → `clip-path` on the surface (margin keeps shadow / corners)
 *
 * Host attrs while running:
 * - `data-curve` — styles enable the lens
 * - `data-curve-edge` — free-edge side (`inline-end` | `inline-start` | …)
 * - `data-curve-axis` — `inline` | `block` (legacy helper for CSS)
 */

export const FLUID_EDGE_CURVE = {
  /** px of sag per px/s — layout width (nav-rail) */
  gain: 0.022,
  /** Stronger for CSS scale enter (sheet / menu) — visual Δsize is smaller */
  gainRect: 0.055,
  /** max sag (px) — readable gooey bow */
  max: 28,
  /** …and never more than this share of the curved span (short xr pills) */
  maxRatio: 0.12,
  /** clip margin kept around the surface (shadow room) */
  margin: 48,
  /** room the `.edge` box extends past the free edge (CSS: +3rem) */
  room: 48,
  /** velocity smoothing (EMA factor per frame) */
  smoothing: 0.5,
  /** |bow| below this → treat as flat (no mode flip) */
  epsilon: 0.35,
  /** |bow| to cross before switching outward ↔ inward (anti-flicker) */
  hysteresis: 1.15,
} as const;

/** Free edge that bows (growth direction). */
export type FluidCurveEdge = 'inline-end' | 'inline-start' | 'block-start' | 'block-end';

export interface FluidEdgeCurveOptions {
  /**
   * `offset` — layout size (nav-rail width spring).
   * `rect` — getBoundingClientRect (CSS scale enter on sheets / menus).
   */
  measure?: 'offset' | 'rect';
  /** Which edge bows. Default `inline-end` (rail / start-docked sheet). */
  edge?: FluidCurveEdge;
}

export class FluidEdgeCurve {
  private raf = 0;
  private surface: HTMLElement | null = null;
  private edgeEl: HTMLElement | null = null;
  private readonly measure: 'offset' | 'rect';
  private readonly edge: FluidCurveEdge;
  /** 1 = outward lens, -1 = inward surface clip, 0 = unset */
  private mode = 0;

  constructor(
    private readonly host: HTMLElement,
    private readonly getSurface: () => HTMLElement | null,
    options: FluidEdgeCurveOptions = {},
  ) {
    this.measure = options.measure ?? 'offset';
    this.edge = options.edge ?? 'inline-end';
  }

  /** Run for one size flight; stops when still (or after `maxMs`). */
  start(maxMs: number): void {
    this.stop();
    const block = this.edge === 'block-start' || this.edge === 'block-end';
    /* Edge/axis early so CSS room matches; data-curve only once sag appears
     * (avoids isolation / opacity flash on a still surface). */
    this.host.setAttribute('data-curve-edge', this.edge);
    this.host.setAttribute('data-curve-axis', block ? 'block' : 'inline');
    this.mode = 0;
    const t0 = performance.now();
    let last = t0;
    let lastSize = -1;
    let vel = 0;
    let moved = false;
    let still = 0;
    const gain =
      this.measure === 'rect' ? FLUID_EDGE_CURVE.gainRect : FLUID_EDGE_CURVE.gain;

    const tick = (now: number): void => {
      const surface = this.getSurface();
      if (!surface) {
        this.stop();
        return;
      }
      if (surface !== this.surface) this.reset();
      this.surface = surface;
      this.edgeEl = surface.querySelector<HTMLElement>(':scope > .edge');

      const size = this.readSize(surface);
      const dt = (now - last) / 1000;
      const raw = lastSize >= 0 && dt > 0 ? (size - lastSize) / dt : 0;
      if (lastSize >= 0 && size !== lastSize) moved = true;
      vel += (raw - vel) * FLUID_EDGE_CURVE.smoothing;
      last = now;
      lastSize = size;

      const bow = Math.max(
        -FLUID_EDGE_CURVE.max,
        Math.min(FLUID_EDGE_CURVE.max, vel * gain),
      );
      this.draw(surface, bow);
      if (this.mode !== 0) this.host.setAttribute('data-curve', '');

      still =
        Math.abs(bow) < FLUID_EDGE_CURVE.epsilon && Math.abs(raw) < 1
          ? still + 1
          : 0;
      const done = (moved && still > 6) || now - t0 > maxMs;
      if (done) this.stop();
      else this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.reset();
    this.surface = null;
    this.edgeEl = null;
    this.mode = 0;
    this.host.removeAttribute('data-curve');
    this.host.removeAttribute('data-curve-edge');
    this.host.removeAttribute('data-curve-axis');
  }

  private readSize(surface: HTMLElement): number {
    const block = this.edge === 'block-start' || this.edge === 'block-end';
    if (this.measure === 'rect') {
      const r = surface.getBoundingClientRect();
      return block ? r.height : r.width;
    }
    return block ? surface.offsetHeight : surface.offsetWidth;
  }

  private reset(): void {
    if (this.surface) this.surface.style.removeProperty('clip-path');
    if (this.edgeEl) this.edgeEl.style.removeProperty('clip-path');
  }

  /**
   * Resolve outward (+1) / inward (-1) with hysteresis so spring overshoot
   * does not flip lens ↔ surface-clip every frame (nav-rail flicker).
   */
  private resolveMode(bow: number): number {
    const { epsilon, hysteresis } = FLUID_EDGE_CURVE;
    if (this.mode === 0) {
      if (bow > epsilon) this.mode = 1;
      else if (bow < -epsilon) this.mode = -1;
      return this.mode;
    }
    if (this.mode > 0 && bow < -hysteresis) this.mode = -1;
    else if (this.mode < 0 && bow > hysteresis) this.mode = 1;
    return this.mode;
  }

  /** `bow` > 0 = outward (expand), < 0 = inward (collapse). */
  private draw(surface: HTMLElement, bow: number): void {
    if (this.edge === 'block-start' || this.edge === 'block-end') {
      this.drawBlock(surface, bow);
    } else {
      this.drawInline(surface, bow);
    }
  }

  private drawInline(surface: HTMLElement, bow: number): void {
    const edge = this.edgeEl;
    const w = surface.offsetWidth;
    const h = surface.offsetHeight;
    const cs = getComputedStyle(surface);
    const startSide =
      this.edge === 'inline-start' ||
      (this.edge === 'inline-end' && cs.direction === 'rtl');
    /*
     * Full height — do not inset by corner radius. XR pills use ~48dp radii;
     * anchoring at the radii made the bow look like a short middle lobe.
     */
    const y0 = 0;
    const y1 = h;
    const mode = this.resolveMode(bow);

    if (mode === 0 || y1 - y0 < 8) return;

    const cap = (y1 - y0) * FLUID_EDGE_CURVE.maxRatio;
    /* Keep a tiny sag while in a mode so we never hard-clear mid-flight */
    const rawSag = Math.max(-cap, Math.min(cap, bow));
    const sag =
      mode > 0
        ? Math.max(FLUID_EDGE_CURVE.epsilon, rawSag)
        : Math.min(-FLUID_EDGE_CURVE.epsilon, rawSag);
    const out = startSide ? -1 : 1;
    const b = out * Math.abs(sag) * (mode > 0 ? 1 : -1);
    const ym = (y0 + y1) / 2;
    const q = (y1 - y0) * 0.25;
    /* .edge origin matches surface; free edge at x=w (end) or x=room (start). */
    const xEdge = startSide ? FLUID_EDGE_CURVE.room : w;
    const bell = (x: number): string =>
      `C ${f(x)} ${f(y0 + q)} ${f(x + b)} ${f(ym - q)} ${f(x + b)} ${f(ym)} ` +
      `C ${f(x + b)} ${f(ym + q)} ${f(x)} ${f(y1 - q)} ${f(x)} ${f(y1)}`;

    if (mode > 0) {
      surface.style.removeProperty('clip-path');
      if (!edge) return;
      edge.style.clipPath = `path('M ${f(xEdge)} ${f(y0)} ${bell(xEdge)} Z')`;
    } else {
      edge?.style.removeProperty('clip-path');
      const m = FLUID_EDGE_CURVE.margin;
      const x = startSide ? 0 : w;
      const far = x + out * m;
      const back = startSide ? w + m : -m;
      surface.style.clipPath =
        `path('M ${f(back)} ${f(-m)} L ${f(far)} ${f(-m)} L ${f(far)} ${f(y0)} ` +
        `L ${f(x)} ${f(y0)} ${bell(x)} L ${f(far)} ${f(y1)} L ${f(far)} ${f(h + m)} ` +
        `L ${f(back)} ${f(h + m)} Z')`;
    }
  }

  /** Bottom / top free edge (menus, bottom sheets) — full width span. */
  private drawBlock(surface: HTMLElement, bow: number): void {
    const edge = this.edgeEl;
    const w = surface.offsetWidth;
    const h = surface.offsetHeight;
    /* block-end = free bottom (grows down); block-start = free top */
    const freeBottom = this.edge === 'block-end';
    const x0 = 0;
    const x1 = w;
    const mode = this.resolveMode(bow);

    if (mode === 0 || x1 - x0 < 8) return;

    const cap = (x1 - x0) * FLUID_EDGE_CURVE.maxRatio;
    const rawSag = Math.max(-cap, Math.min(cap, bow));
    const sag =
      mode > 0
        ? Math.max(FLUID_EDGE_CURVE.epsilon, rawSag)
        : Math.min(-FLUID_EDGE_CURVE.epsilon, rawSag);
    const out = freeBottom ? 1 : -1;
    const b = out * Math.abs(sag) * (mode > 0 ? 1 : -1);
    const xm = (x0 + x1) / 2;
    const q = (x1 - x0) * 0.25;
    /*
     * .edge is padded only past the free edge:
     * - block-end: top-aligned → free bottom at y = h
     * - block-start: bottom-aligned → free top at y = room
     */
    const yEdge = freeBottom ? h : FLUID_EDGE_CURVE.room;
    const bell = (y: number): string =>
      `C ${f(x0 + q)} ${f(y)} ${f(xm - q)} ${f(y + b)} ${f(xm)} ${f(y + b)} ` +
      `C ${f(xm + q)} ${f(y + b)} ${f(x1 - q)} ${f(y)} ${f(x1)} ${f(y)}`;

    if (mode > 0) {
      surface.style.removeProperty('clip-path');
      if (!edge) return;
      edge.style.clipPath = `path('M ${f(x0)} ${f(yEdge)} ${bell(yEdge)} Z')`;
    } else {
      edge?.style.removeProperty('clip-path');
      const m = FLUID_EDGE_CURVE.margin;
      const y = freeBottom ? h : 0;
      const far = y + out * m;
      const back = freeBottom ? -m : h + m;
      surface.style.clipPath =
        `path('M ${f(-m)} ${f(back)} L ${f(-m)} ${f(far)} L ${f(x0)} ${f(far)} ` +
        `L ${f(x0)} ${f(y)} ${bell(y)} L ${f(x1)} ${f(far)} L ${f(w + m)} ${f(far)} ` +
        `L ${f(w + m)} ${f(back)} Z')`;
    }
  }
}

const f = (n: number): string => n.toFixed(2);
