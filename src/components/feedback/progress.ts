import { html, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  devicePixelSnapPx,
  hasLightSlot,
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
  LINEAR_WAVE_HEIGHT,
  LINEAR_WAVE_LEN,
  STOP_DP,
  STOP_INSET_THICK_DP,
  drawFlatArc,
  drawFlatBar,
  drawStop,
  drawWavyArc,
  drawWavyBar,
  indicatorAmplitudeFactor,
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
/** Linear chrome — where leading + trailing sit relative to the bar. */
export type ProgressLayout = 'default' | 'top' | 'bottom';
/**
 * Where the percent value renders.
 * - Circular: `inside` (in ring) · `below` / `trailing` (under ring)
 * - Linear: always `trailing` (layout moves the row)
 */
export type PercentPosition = 'inside' | 'below' | 'trailing';

/**
 * M3 / M3 Expressive progress indicator.
 *
 * Slots: `leading` (label ± icon) · progress middle · `trailing` (value%) ·
 * `supporting` (always under — flush with the bar when there is no label).
 *
 * Linear `layout`: `default` | `top` | `bottom`.
 * Circular: label top · value inside or below · supporting under everything.
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
  /** Show determinate percent in trailing (or inside when circular). */
  @property({ type: Boolean, reflect: true, attribute: 'show-percent' })
  showPercent = false;
  /**
   * Percent placement. Circular: `inside` · `below`/`trailing`.
   * Linear: ignored (value is always trailing; use `layout`).
   */
  @property({ reflect: true, attribute: 'percent-position' })
  percentPosition: PercentPosition = 'trailing';
  /**
   * Linear only — `default` (inline with bar) · `top` · `bottom`.
   */
  @property({ reflect: true }) layout: ProgressLayout = 'default';
  /**
   * Leading caption (also aria name). Empty → i18n `progress.label` for aria only.
   */
  @property() label = '';
  /** Optional supporting text under the chrome. */
  @property({ attribute: 'supporting-text' }) supportingText = '';
  /**
   * @deprecated Use `show-percent`. Kept so existing markup keeps working.
   */
  @property({ type: Boolean, attribute: 'show-label' }) showLabel = false;

  @query('canvas') private canvas!: HTMLCanvasElement | null;
  @state() private displayProgress = 0;
  @state() private hasLeadingSlot = false;
  @state() private hasTrailingSlot = false;
  @state() private hasSupportingSlot = false;

  private raf = 0;
  private startMs = 0;
  private animFrom = 0;
  private animTo = 0;
  private animStart = 0;
  private ro: ResizeObserver | null = null;
  private reduceMotion = false;

  /** Light-DOM only — never treat slot fallback as “has content”. */
  private syncSlots = (): void => {
    this.hasLeadingSlot = hasLightSlot(this, 'leading');
    this.hasTrailingSlot = hasLightSlot(this, 'trailing');
    this.hasSupportingSlot = hasLightSlot(this, 'supporting');
  };

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
    /*
     * Value % from show-percent (or deprecated show-label alias).
     * Never tied to the leading `label` caption string.
     */
    return (this.showPercent || this.showLabel) && !this.indeterminate;
  }

  /** Circular: inside vs below. Linear: always trailing. */
  private percentInside(): boolean {
    if (this.variant !== 'circular' || !this.percentVisible()) return false;
    return this.percentPosition === 'inside';
  }

  private percentTrailing(): boolean {
    return this.percentVisible() && !this.percentInside();
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
    return Math.max(LINEAR_WAVE_HEIGHT, LINEAR_WAVE_AMP * 2 + th);
  }

  /** Clear circular inline canvas size so linear can stretch again. */
  private resetCanvasBox(canvas: HTMLCanvasElement, linear: boolean): void {
    if (linear) {
      canvas.style.width = '100%';
      canvas.style.removeProperty('max-width');
      this.style.removeProperty('--k3-progress-size');
    }
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
    this.resetCanvasBox(canvas, true);
    const hostW =
      (this.shadowRoot?.querySelector('.indicator') as HTMLElement | null)
        ?.clientWidth ||
      this.clientWidth ||
      240;
    const cssW = Math.max(1, hostW);
    const cssH = this.linearHeight();
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = '100%';
    canvas.style.height = `${cssH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const { active, track, stop } = this.colors();
    const th = devicePixelSnapPx(this.thicknessPx, dpr);
    const gap = devicePixelSnapPx(GAP_DP, dpr);
    const stopSize = devicePixelSnapPx(STOP_DP, dpr);
    const waveLen = devicePixelSnapPx(LINEAR_WAVE_LEN, dpr);
    /* Round-cap inset — geometric ends are cap centers. */
    const edge = th / 2;
    const cy = cssH / 2;
    const rtl = getComputedStyle(this).direction === 'rtl';
    /* Logical LTR coords → physical (RTL mirrors progress + stop). */
    const mapX = (x: number) => (rtl ? cssW - x : x);
    const phase =
      ((now - this.startMs) / 1000) * (this.isWavy ? (2 * Math.PI) / 1.2 : 0);
    const ampFactor = this.isWavy
      ? this.indeterminate
        ? 1
        : indicatorAmplitudeFactor(this.displayProgress)
      : 0;
    const amp = devicePixelSnapPx(LINEAR_WAVE_AMP, dpr) * ampFactor;
    /*
     * Visual 4dp gap between round caps ⇒ geometric gap = gap + thickness
     * (each cap extends th/2 past its endpoint).
     */
    const geoGap = gap + th;

    const drawSeg = (
      a: number,
      b: number,
      color: string,
      wavy: boolean,
      stroke = th,
    ) => {
      const x0 = mapX(Math.min(a, b));
      const x1 = mapX(Math.max(a, b));
      const left = Math.min(x0, x1);
      const right = Math.max(x0, x1);
      if (right - left < 0.5) return;
      if (wavy && amp > 0.05) {
        drawWavyBar(ctx, left, right, cy, stroke, amp, waveLen, phase, color);
      } else {
        drawFlatBar(ctx, left, right, cy, stroke, color);
      }
    };

    if (this.indeterminate) {
      /* Track only in gaps between active segments — never under progress. */
      const cycle = this.reduceMotion
        ? 0.35
        : ((now - this.startMs) % LINEAR_INDET_MS) / LINEAR_INDET_MS;
      const span = cssW - edge * 2;
      const segs = linearIndeterminateSegments(cycle).map((s) => ({
        a: edge + s.start * span,
        b: edge + s.end * span,
      }));
      let cursor = edge;
      for (const s of segs) {
        const trackEnd = s.a - geoGap;
        if (trackEnd > cursor) drawSeg(cursor, trackEnd, track, false);
        cursor = s.b + geoGap;
      }
      if (cssW - edge > cursor) drawSeg(cursor, cssW - edge, track, false);
      for (const s of segs) drawSeg(s.a, s.b, active, this.isWavy);
      return;
    }

    const p = this.displayProgress;
    const complete = p >= 0.999;
    const stopOn = this.showStop && !complete;
    /*
     * Stop — always 4dp circle, inside the track (M3 linear specs):
     * - thickness 4dp → flush to trailing edge (inset 0)
     * - thickness 8dp → 2dp inset from trailing edge
     * Logical end = right in LTR (mapX mirrors for RTL).
     */
    const stopInset =
      th >= 8 - 0.01 ? devicePixelSnapPx(STOP_INSET_THICK_DP, dpr) : 0;
    const stopCenter = stopOn
      ? cssW - stopInset - stopSize / 2
      : cssW - edge;
    /*
     * Progress grows up to (stop − gap). Track runs from after progress
     * through to the stop center so the stop sits in the track.
     */
    const endLimit = stopOn ? stopCenter - geoGap : cssW - edge;
    const startLimit = edge;
    const span = Math.max(0, endLimit - startLimit);

    if (complete) {
      drawSeg(startLimit, cssW - edge, active, this.isWavy && amp > 0.05);
      return;
    }

    const activeEnd =
      p <= 0 ? startLimit : startLimit + Math.max(0, p * span);
    const trackStart = activeEnd + (p > 0 ? geoGap : 0);
    const trackEnd = stopOn ? stopCenter : cssW - edge;

    if (trackEnd > trackStart + 0.5) {
      drawSeg(trackStart, trackEnd, track, false);
    }
    if (p <= 0) {
      drawSeg(startLimit, startLimit + 0.01, active, false);
    } else if (activeEnd > startLimit) {
      drawSeg(startLimit, activeEnd, active, this.isWavy);
    }
    if (stopOn) drawStop(ctx, mapX(stopCenter), cy, stopSize, stop);
  }

  private paintCircular(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    dpr: number,
    now: number,
  ): void {
    const size = this.circularSizePx;
    const th = devicePixelSnapPx(this.thicknessPx, dpr);
    const gap = devicePixelSnapPx(GAP_DP, dpr);
    const waveLenPx = devicePixelSnapPx(CIRCULAR_WAVE_LEN, dpr);
    const baseAmp = devicePixelSnapPx(CIRCULAR_WAVE_AMP, dpr);

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
    const ampFactor = this.isWavy
      ? this.indeterminate
        ? 1
        : indicatorAmplitudeFactor(this.displayProgress)
      : 0;
    const amp = baseAmp * ampFactor;
    const radius = Math.max(1, (size - th) / 2 - (this.isWavy ? baseAmp : 0));
    const phase = ((now - this.startMs) / 1000) * ((2 * Math.PI) / 1.5);
    const circ = 2 * Math.PI * radius;
    /* Visual 4dp gap between round caps ⇒ arc gap = gap + stroke. */
    const gapDeg = ((gap + th) / circ) * 360;
    const rtl = getComputedStyle(this).direction === 'rtl';
    /* RTL: mirror sweep direction (grow counter-clockwise from 12 o'clock). */
    const dir = rtl ? -1 : 1;
    const origin = -90;

    /** `sweepMag` is always ≥0; `dir` flips for RTL. */
    const drawActive = (start: number, sweepMag: number, wavyAmp: number) => {
      const sw = sweepMag * dir;
      if (this.isWavy && wavyAmp > 0.05) {
        drawWavyArc(
          ctx,
          cx,
          cy,
          radius,
          start,
          sw,
          th,
          wavyAmp,
          waveLenPx,
          phase,
          active,
        );
      } else {
        drawFlatArc(ctx, cx, cy, radius, start, sw, th, active);
      }
    };

    const drawTrackArc = (start: number, sweepSigned: number) => {
      if (Math.abs(sweepSigned) < 0.5) return;
      drawFlatArc(ctx, cx, cy, radius, start, sweepSigned, th, track);
    };

    if (this.indeterminate) {
      const cycle = this.reduceMotion
        ? 0.2
        : ((now - this.startMs) % CIRCULAR_CYCLE_MS) / CIRCULAR_CYCLE_MS;
      const { startAngle, sweep } = circularIndeterminate(cycle);
      const activeStart = startAngle;
      const trackStart = activeStart + (sweep + gapDeg) * dir;
      const trackSweep = (360 - sweep - gapDeg * 2) * dir;
      drawTrackArc(trackStart, trackSweep);
      drawActive(activeStart, sweep, amp);
      return;
    }

    const p = this.displayProgress;
    const complete = p >= 0.999;

    if (complete) {
      drawActive(origin, 360, amp);
      return;
    }

    const sweep = p * 360;
    if (sweep > 0.5) {
      drawActive(origin, sweep, amp);
    }
    /* Track only on remaining arc — gap after progress and before start. */
    const trackStart = origin + (sweep + gapDeg) * dir;
    const trackSweep = (360 - sweep - gapDeg * 2) * dir;
    if (Math.abs(trackSweep) > 0.5) {
      drawTrackArc(trackStart, trackSweep);
    }
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
    this.addEventListener('slotchange', this.syncSlots, true);
    this.bindRo();
    this.restartLoop();
  }

  override disconnectedCallback(): void {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.ro = null;
    this.removeEventListener('slotchange', this.syncSlots, true);
    super.disconnectedCallback();
  }

  override firstUpdated(): void {
    this.syncSlots();
    this.restartLoop();
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('wavy') && this.wavy && this.shape !== 'wavy') {
      this.shape = 'wavy';
    } else if (changed.has('shape') && this.shape === 'wavy' && !this.wavy) {
      this.wavy = true;
    } else if (changed.has('shape') && this.shape === 'flat' && this.wavy) {
      this.wavy = false;
    }
  }

  override updated(changed: PropertyValues): void {
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
      if (changed.has('variant') && this.variant === 'linear' && this.canvas) {
        this.resetCanvasBox(this.canvas, true);
      }
      if (
        changed.has('indeterminate') ||
        changed.has('variant') ||
        changed.has('shape') ||
        changed.has('wavy') ||
        changed.has('size')
      ) {
        this.restartLoop();
      } else {
        cancelAnimationFrame(this.raf);
        this.raf = requestAnimationFrame(this.paint);
      }
    }
  }

  override render() {
    /* Guard null from attribute removal (Lit string converter). */
    const caption = String(this.label ?? '').trim();
    const support = String(this.supportingText ?? '').trim();
    const ariaName = caption || i18n.t('progress.label');
    const pct = Math.round(this.fraction() * 100);
    const isCirc = this.variant === 'circular';
    const layout: ProgressLayout = isCirc ? 'default' : this.layout;
    const showDefaultLabel = !!caption && !this.hasLeadingSlot;
    const showDefaultPct = this.percentTrailing() && !this.hasTrailingSlot;
    const showDefaultSupport = !!support && !this.hasSupportingSlot;
    const showLead = showDefaultLabel || this.hasLeadingSlot;
    const showTrail = showDefaultPct || this.hasTrailingSlot;
    const showSupport = showDefaultSupport || this.hasSupportingSlot;
    const pctInside = this.percentInside();
    const size = this.circularSizePx;

    const leadPos =
      layout === 'top' ? 'above-start' : layout === 'bottom' ? 'below-start' : 'start';
    const trailPos =
      layout === 'top' ? 'above-end' : layout === 'bottom' ? 'below-end' : 'end';

    return html`
      <div
        class=${classMap({
          root: true,
          linear: !isCirc,
          circular: isCirc,
          [`layout-${layout}`]: !isCirc,
          'has-label': !isCirc && showLead,
          'has-trailing': !isCirc && showTrail,
          'has-below':
            !isCirc && layout === 'bottom' && (showLead || showTrail),
        })}
        part="root"
        role="progressbar"
        aria-label=${ariaName}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${this.indeterminate ? nothing : pct}
        style=${isCirc ? `--k3-progress-size:${size}px` : nothing}
      >
        <div
          class=${classMap({
            cell: true,
            leading: true,
            label: true,
            has: showLead,
            [leadPos]: !isCirc,
          })}
          part="leading"
        >
          <slot name="leading" @slotchange=${this.syncSlots}></slot>
          ${showDefaultLabel
            ? html`<span class="label-text">${caption}</span>`
            : nothing}
        </div>
        <div class="indicator" part="indicator">
          <canvas part="canvas" aria-hidden="true"></canvas>
          <div
            class=${classMap({ percent: true, inside: true, has: pctInside })}
            part="percent"
            aria-hidden="true"
          >
            ${pctInside ? html`${pct}%` : nothing}
          </div>
        </div>
        <div
          class=${classMap({
            cell: true,
            trailing: true,
            percent: true,
            has: showTrail,
            [trailPos]: !isCirc,
          })}
          part="trailing"
        >
          <slot name="trailing" @slotchange=${this.syncSlots}></slot>
          ${showDefaultPct
            ? html`<span class="value-text" aria-hidden="true">${pct}%</span>`
            : nothing}
        </div>
        <div
          class=${classMap({ supporting: true, has: showSupport })}
          part="supporting"
        >
          <slot name="supporting" @slotchange=${this.syncSlots}></slot>
          ${showDefaultSupport
            ? html`<span class="supporting-text">${support}</span>`
            : nothing}
        </div>
      </div>
    `;
  }
}

export default K3Progress;
