/**
 * M3 Expressive circular progress, wavy (port of Lucid's lucidui/CircularProgress.qml).
 * The active arc waves, the track stays flat, a gap parts them. Tokens from
 * CircularProgressIndicatorTokens: wavelength = 3.75 × stroke, amplitude = 0.4 × stroke.
 *
 * <svg class="wavy-progress" viewBox="0 0 200 200">
 *   <path class="wavy-progress__track"/><path class="wavy-progress__active"/>
 * </svg>
 */
export interface WavyProgressOptions {
  /** stroke width in viewBox units */
  thickness?: number;
  /** let the wave travel along the arc */
  travel?: boolean;
}

export class WavyProgress {
  private readonly track: SVGPathElement;
  private readonly active: SVGPathElement;
  private readonly size: number;
  private readonly thickness: number;
  private value = 0;
  private phase = 0;
  private raf = 0;
  private moving = false;

  constructor(private readonly svg: SVGSVGElement, options: WavyProgressOptions = {}) {
    this.track = svg.querySelector(".wavy-progress__track")!;
    this.active = svg.querySelector(".wavy-progress__active")!;
    this.size = svg.viewBox.baseVal.width || 200;
    this.thickness = options.thickness ?? 8;
    svg.style.setProperty("--stroke", String(this.thickness));
    if (options.travel) this.setMoving(true);
  }

  /** 0…1 */
  set(value: number): void {
    this.value = Math.max(0, Math.min(1, value));
    if (!this.moving) this.draw();
  }

  /** the wave travels while something runs, and holds still when paused */
  setMoving(on: boolean): void {
    if (on === this.moving) return;
    this.moving = on && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cancelAnimationFrame(this.raf);
    if (!this.moving) return this.draw();
    const loop = (): void => {
      this.phase -= 0.06;
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private draw(): void {
    const v = this.value;
    const t = this.thickness;
    const c = this.size / 2;
    const r = c - t; // room for the wave
    const circumference = 2 * Math.PI * r;
    const waves = Math.max(6, Math.min(14, Math.round(circumference / (t * 3.75))));
    const amp = t * 0.4;
    // gap between active arc and track, in turns; none at 0 or 1
    const gap = v <= 0.001 || v >= 0.999 ? 0 : (t * 2 + 4) / circumference;

    // active: whole steps of a fixed table, so a shrinking arc doesn't shimmer
    const steps = waves * 14;
    let d = "";
    if (v > 0.001) {
      const n = Math.max(2, Math.ceil(v * steps));
      for (let i = 0; i <= n; i++) {
        const u = Math.min(v, i / steps); // fraction of the turn
        const ang = -Math.PI / 2 + u * 2 * Math.PI;
        // the wave fades in and out at the ends, so the caps stay round
        const k = u / v;
        const ease = Math.min(1, k * 6, (1 - k) * 6);
        const rr = r + amp * ease * Math.sin(waves * (ang + Math.PI / 2) + this.phase);
        d += `${i ? "L" : "M"}${(c + rr * Math.cos(ang)).toFixed(2)} ${(c + rr * Math.sin(ang)).toFixed(2)}`;
      }
    }
    this.active.setAttribute("d", d);

    // track: a plain arc from the end of the active one, gaps on both sides
    const from = v + gap;
    const to = 1 - gap;
    if (to - from > 0.002) {
      const p = (u: number): string => {
        const a = -Math.PI / 2 + u * 2 * Math.PI;
        return `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
      };
      // two halves, so a full turn (nothing done yet) still draws
      const mid = (from + to) / 2;
      this.track.setAttribute("d", `M${p(from)}A${r} ${r} 0 0 1 ${p(mid)}A${r} ${r} 0 0 1 ${p(to)}`);
    } else {
      this.track.setAttribute("d", "");
    }
  }
}
