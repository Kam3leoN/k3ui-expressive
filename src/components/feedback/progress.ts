import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  prefersReducedMotion,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import {
  CIRCULAR_SIZE,
  CIRCULAR_SIZE_WAVY,
  CIRCULAR_WAVE_AMP,
  CIRCULAR_WAVE_LEN,
  DEFAULT_THICKNESS,
  GAP_DP,
  LINEAR_WAVE_AMP,
  LINEAR_WAVE_LEN,
  STOP_DP,
  drawFlatArc,
  drawFlatBar,
  drawStop,
  drawWavyArc,
  drawWavyBar,
} from './progress-draw.js';
import {
  CIRCULAR_CYCLE_MS,
  DETERMINATE_MS,
  LINEAR_INDET_MS,
  circularIndeterminate,
  easeDeterminate,
  linearIndeterminateSegments,
} from './progress-motion.js';
import { progressStyles } from './progress.styles.js';

export type ProgressVariant = 'linear' | 'circular';
export type ProgressShape = 'flat' | 'wavy';
/**
 * Where the percent text renders.
 * - Circular: `inside` · `below`
 * - Linear: `below-start` · `below-end` · `leading` · `trailing`
 * - `below` resolves to circular below / linear below-end
 */
export type PercentPosition =
  | 'inside'
  | 'below'
  | 'below-start'
  | 'below-end'
  | 'leading'
  | 'trailing';

/**
 * M3 / M3 Expressive progress indicator.
 *
 * - Variants: `linear` · `circular`
 * - Behavior: determinate (`value`) · `indeterminate`
 * - Thickness: default 4dp · variable via `thickness`
 * - Shape: `flat` (default) · `wavy` (Expressive)
 * - Percent: `show-percent` + `percent-position`
 * - Optional caption: `label`
 * - Slots: `leading` · `trailing` (linear inline accessories)
 *
 * @see https://m3.material.io/components/progress-indicators/specs
 * @see https://m3.material.io/components/progress-indicators/guidelines
 */
export class K3Progress extends K3Element {
  static override styles = [hostReset, progressStyles];

  /** `linear` (default) · `circular` */
  @property({ reflect: true }) variant: ProgressVariant = 'linear';
  /**
   * Progress 0–1 (preferred). Values &gt; 1 with `max === 1` are treated as
   * percent (legacy `value="72"` → 0.72).
   */
  @property({ type: Number }) value = 0;
  @property({ type: Number }) max = 1;
  @property({ type: Boolean, reflect: true }) indeterminate = false;
  /** `flat` (default) · `wavy` (M3 Expressive) */
  @property({ reflect: true }) shape: ProgressShape = 'flat';
  /** Alias — sets `shape="wavy"` when true. */
  @property({ type: Boolean, reflect: true }) wavy = false;
  /** Active stroke thickness in dp (default 4). */
  @property({ type: Number }) thickness = DEFAULT_THICKNESS;
  /** Circular diameter in dp (0 = default 40 · 48 when wavy). */
  @property({ type: Number }) size = 0;
  /** Linear determinate stop at trailing end (default on). */
  @property({ type: Boolean, attribute: 'show-stop' }) showStop = true;
  /** Show determinate percent text. */
  @property({ type: Boolean, reflect: true, attribute: 'show-percent' })
  showPercent = false;
  /**
   * Percent placement. Circular: `inside` · `below`. Linear: `below-start` ·
   * `below-end` · `leading` · `trailing`. `below` → circular below / linear end.
   */
  @property({ reflect: true, attribute: 'percent-position' })
  percentPosition: PercentPosition = 'below';
  /**
   * Optional visible caption + accessible name. Empty uses i18n `progress.label`
   * for aria only (not shown).
   */
  @property() label = '';
  /**
   * @deprecated Use `show-percent`. Kept so existing markup keeps working.
   */
  @property({ type: Boolean, attribute: 'show-label' }) showLabel = false;

  @query('canvas') private canvas!: HTMLCanvasElement | null;
  @state() private displayProgress = 0;

  private raf = 0;
  private startMs = 0;
  private animFrom = 0;
  private animTo = 0;
  private animStart = 0;
  private ro: ResizeObserver | null = null;
  private reduceMotion = false;

  private get isWavy(): boolean {
    return this.wavy || this.shape === 'wavy';
  }

  private get thicknessPx(): number {
    return Math.max(1, this.thickness || DEFAULT_THICKNESS);
  }

  private get circularSizePx(): number {
    if (this.size > 0) return this.size;
    return this.isWavy ? CIRCULAR_SIZE_WAVY : CIRCULAR_SIZE;
  }

  /** Normalized 0–1 progress. */
  private fraction(): number {
    const max = this.max > 0 ? this.max : 1;
    let v = this.value;
    if (v > 1 && max === 1) v = v / 100;
    return Math.min(1, Math.max(0, v / max));
  }

  private percentVisible(): boolean {
    return (this.showPercent || this.showLabel) && !this.indeterminate;
  }

  /** Resolved placement for the current variant. */
  private resolvedPercentPos(): PercentPosition {
    const raw = this.percentPosition || 'below';
    if (this.variant === 'circular') {
      return raw === 'inside' ? 'inside' : 'below';
    }
    if (raw === 'inside' || raw === 'below') return 'below-end';
    if (raw === 'below-start' || raw === 'below-end' || raw === 'leading' || raw === 'trailing') {
      return raw;
    }
    return 'below-end';
  }

  private cssColor(name: string, fallback: string): string {
    const s = getComputedStyle(this).getPropertyValue(name).trim();
    return s || fallback;
  }

  private colors() {
    return {
      active: this.cssColor('--k3-progress-active', '#6750a4'),
      track: this.cssColor('--k3-progress-track', '#e8def8'),
      stop: this.cssColor('--k3-progress-stop', '#6750a4'),
    };
  }

  private linearHeight(): number {
    const th = this.thicknessPx;
    if (!this.isWavy) return Math.max(th, STOP_DP);
    return LINEAR_WAVE_AMP * 2 + th;
  }

  private paint = (now?: number): void => {
    const canvas = this.canvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const t = now ?? performance.now();
    if (!this.startMs) this.startMs = t;

    if (!this.indeterminate && !this.reduceMotion) {
      const target = this.fraction();
      if (Math.abs(target - this.animTo) > 0.0005) {
        this.animFrom = this.displayProgress;
        this.animTo = target;
        this.animStart = t;
      }
      const u = Math.min(1, (t - this.animStart) / DETERMINATE_MS);
      this.displayProgress =
        this.animFrom + (this.animTo - this.animFrom) * easeDeterminate(u);
    } else if (!this.indeterminate) {
      this.displayProgress = this.fraction();
    }

    if (this.variant === 'circular') this.paintCircular(ctx, canvas, dpr, t);
    else this.paintLinear(ctx, canvas, dpr, t);

    if (this.indeterminate && !this.reduceMotion) {
      this.raf = requestAnimationFrame(this.paint);
    } else if (
      !this.indeterminate &&
      !this.reduceMotion &&
      Math.abs(this.displayProgress - this.animTo) > 0.0005
    ) {
      this.raf = requestAnimationFrame(this.paint);
    } else if (this.isWavy && !this.reduceMotion && !this.indeterminate) {
      this.raf = requestAnimationFrame(this.paint);
    }
  };

  private paintLinear(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    dpr: number,
    now: number,
  ): void {
    const cssW = Math.max(1, canvas.clientWidth || this.clientWidth || 240);
    const cssH = this.linearHeight();
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.height = `${cssH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const { active, track, stop } = this.colors();
    const th = this.thicknessPx;
    const trackTh = this.isWavy ? th : Math.min(DEFAULT_THICKNESS, th);
    const cy = cssH / 2;
    const rtl = getComputedStyle(this).direction === 'rtl';
    const mapX = (x: number) => (rtl ? cssW - x : x);
    const phase =
      ((now - this.startMs) / 1000) * (this.isWavy ? (2 * Math.PI) / 1.2 : 0);

    const drawSeg = (a: number, b: number, color: string, wavy: boolean) => {
      const x0 = mapX(Math.min(a, b));
      const x1 = mapX(Math.max(a, b));
      const left = Math.min(x0, x1);
      const right = Math.max(x0, x1);
      if (wavy) {
        drawWavyBar(
          ctx,
          left,
          right,
          cy,
          th,
          LINEAR_WAVE_AMP,
          LINEAR_WAVE_LEN,
          phase,
          color,
        );
      } else {
        drawFlatBar(ctx, left, right, cy, color === track ? trackTh : th, color);
      }
    };

    if (this.indeterminate) {
      drawSeg(0, cssW, track, false);
      const cycle = this.reduceMotion
        ? 0.35
        : ((now - this.startMs) % LINEAR_INDET_MS) / LINEAR_INDET_MS;
      for (const seg of linearIndeterminateSegments(cycle)) {
        drawSeg(seg.start * cssW, seg.end * cssW, active, this.isWavy);
      }
      return;
    }

    const p = this.displayProgress;
    const stopOn = this.showStop && p < 1;
    const stopX = cssW - STOP_DP / 2;
    const usable = stopOn ? cssW - STOP_DP - GAP_DP : cssW;
    const activeEnd = Math.max(th, p * usable);
    const trackStart = Math.min(cssW, activeEnd + (p > 0 ? GAP_DP : 0));
    const trackEnd = stopOn ? stopX - STOP_DP / 2 - GAP_DP : cssW;

    if (trackEnd > trackStart) drawSeg(trackStart, trackEnd, track, false);
    if (p <= 0) {
      drawFlatBar(ctx, mapX(0), mapX(th), cy, th, active);
    } else {
      drawSeg(0, activeEnd, active, this.isWavy);
    }
    if (stopOn) drawStop(ctx, mapX(stopX), cy, STOP_DP, stop);
  }

  private paintCircular(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    dpr: number,
    now: number,
  ): void {
    const size = this.circularSizePx;
    const th = this.thicknessPx;
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    this.style.setProperty('--k3-progress-size', `${size}px`);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const { active, track } = this.colors();
    const cx = size / 2;
    const cy = size / 2;
    const amp = this.isWavy ? CIRCULAR_WAVE_AMP * (size / CIRCULAR_SIZE) : 0;
    const radius = (size - th) / 2 - amp;
    const phase = ((now - this.startMs) / 1000) * ((2 * Math.PI) / 1.5);
    const waveLen = CIRCULAR_WAVE_LEN * (size / CIRCULAR_SIZE);

    const drawTrackFull = () => {
      if (this.isWavy) {
        drawWavyArc(
          ctx,
          cx,
          cy,
          radius,
          -90,
          360,
          th,
          amp,
          waveLen,
          phase,
          track,
        );
      } else {
        drawFlatArc(ctx, cx, cy, radius, -90, 360, th, track);
      }
    };

    const drawActive = (start: number, sweep: number) => {
      if (this.isWavy) {
        drawWavyArc(
          ctx,
          cx,
          cy,
          radius,
          start,
          sweep,
          th,
          amp,
          waveLen,
          phase,
          active,
        );
      } else {
        drawFlatArc(ctx, cx, cy, radius, start, sweep, th, active);
      }
    };

    if (this.indeterminate) {
      drawTrackFull();
      const cycle = this.reduceMotion
        ? 0.2
        : ((now - this.startMs) % CIRCULAR_CYCLE_MS) / CIRCULAR_CYCLE_MS;
      const { startAngle, sweep } = circularIndeterminate(cycle);
      drawActive(startAngle, sweep);
      return;
    }

    drawTrackFull();
    const sweep = this.displayProgress * 360;
    const gapDeg = (GAP_DP / (radius * 2 * Math.PI)) * 360;
    if (sweep > gapDeg) drawActive(-90, sweep - gapDeg);
    else if (this.displayProgress > 0) drawActive(-90, Math.max(sweep, 0.5));
  }

  private restartLoop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.startMs = performance.now();
    this.raf = requestAnimationFrame(this.paint);
  }

  private bindRo(): void {
    this.ro?.disconnect();
    this.ro = new ResizeObserver(() => {
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(this.paint);
    });
    this.ro.observe(this);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.reduceMotion = prefersReducedMotion();
    this.displayProgress = this.fraction();
    this.animTo = this.displayProgress;
    this.bindRo();
    this.restartLoop();
  }

  override disconnectedCallback(): void {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.ro = null;
    super.disconnectedCallback();
  }

  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('wavy') && this.wavy && this.shape !== 'wavy') {
      this.shape = 'wavy';
    } else if (changed.has('shape') && this.shape === 'wavy' && !this.wavy) {
      this.wavy = true;
    } else if (changed.has('shape') && this.shape === 'flat' && this.wavy) {
      this.wavy = false;
    }
    /* Legacy show-label → show-percent */
    if (changed.has('showLabel') && this.showLabel && !this.showPercent) {
      this.showPercent = true;
    }
  }

  override updated(changed: Map<string, unknown>): void {
    if (
      changed.has('value') ||
      changed.has('max') ||
      changed.has('indeterminate') ||
      changed.has('variant') ||
      changed.has('shape') ||
      changed.has('wavy') ||
      changed.has('thickness') ||
      changed.has('size') ||
      changed.has('showStop')
    ) {
      if (
        changed.has('indeterminate') ||
        changed.has('variant') ||
        changed.has('shape') ||
        changed.has('wavy')
      ) {
        this.restartLoop();
      } else {
        cancelAnimationFrame(this.raf);
        this.raf = requestAnimationFrame(this.paint);
      }
    }
  }

  override firstUpdated(): void {
    this.restartLoop();
  }

  private renderPercent(pos: PercentPosition, pct: number) {
    const on = this.percentVisible() && this.resolvedPercentPos() === pos;
    const belowAlign =
      pos === 'below-start' ? 'start' : pos === 'below-end' || pos === 'below' ? 'end' : '';
    const isInside = pos === 'inside';
    const isBelow = pos === 'below' || pos === 'below-start' || pos === 'below-end';
    return html`
      <div
        class=${classMap({
          percent: true,
          has: on,
          'percent--inside': isInside,
          'percent--below': isBelow,
          start: belowAlign === 'start',
          end: belowAlign === 'end',
        })}
        part="percent"
        aria-hidden="true"
      >
        ${pct}%
      </div>
    `;
  }

  override render() {
    const caption = this.label.trim();
    const ariaName = caption || i18n.t('progress.label');
    const pct = Math.round(this.fraction() * 100);
    const pos = this.resolvedPercentPos();
    const showPct = this.percentVisible();
    const leadingPct = showPct && pos === 'leading';
    const trailingPct = showPct && pos === 'trailing';
    const size = this.circularSizePx;

    return html`
      <div
        class="root"
        part="root"
        role="progressbar"
        aria-label=${ariaName}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${this.indeterminate ? nothing : pct}
        style=${this.variant === 'circular'
          ? `--k3-progress-size:${size}px`
          : nothing}
      >
        <div class="track-row" part="track-row">
          <div
            class=${classMap({ side: true, leading: true, has: leadingPct })}
            part="leading"
          >
            <slot name="leading">${leadingPct ? html`${pct}%` : nothing}</slot>
          </div>
          <div class="indicator" part="indicator">
            <canvas part="canvas" aria-hidden="true"></canvas>
            ${this.renderPercent('inside', pct)}
          </div>
          <div
            class=${classMap({ side: true, trailing: true, has: trailingPct })}
            part="trailing"
          >
            <slot name="trailing"
              >${trailingPct ? html`${pct}%` : nothing}</slot
            >
          </div>
        </div>
        ${this.renderPercent('below', pct)}
        ${this.renderPercent('below-start', pct)}
        ${this.renderPercent('below-end', pct)}
        <div
          class=${classMap({ caption: true, has: !!caption })}
          part="label"
        >
          <slot name="label">${caption}</slot>
        </div>
      </div>
    `;
  }
}

export default K3Progress;