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
  drawOscillationBars,
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
import {
  loadWaveformPeaks,
  oscillationBarCount,
  resamplePeaks,
} from '../media/waveform-pcm.js';

export type ProgressVariant = 'linear' | 'circular';
export type ProgressShape = 'flat' | 'wavy' | 'oscillation';
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
 * When `interactive` (linear determinate), pointer drag + keyboard seek like a
 * slider — emits `k3-input` while dragging and `k3-change` on commit.
 *
 * @fires k3-input - `{ value }` while seeking (interactive)
 * @fires k3-change - `{ value }` on seek commit (interactive)
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
  /** `flat` (default) · `wavy` (M3 Expressive) · `oscillation` (PCM bars, linear) */
  @property({ reflect: true }) shape: ProgressShape = 'flat';
  /** Alias — sets `shape="wavy"` when true. */
  @property({ type: Boolean, reflect: true }) wavy = false;
  /**
   * Audio URL for `shape="oscillation"` — real PCM peaks (same cache as audio seek).
   * Same-origin / CORS required. Without `src`, flat placeholder bars only.
   */
  @property() src = '';
  /**
   * Linear determinate only — drag / keyboard to set `value`
   * (media seek, upload scrub, etc.).
   */
  @property({ type: Boolean, reflect: true }) interactive = false;
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
  @query('.indicator') private indicatorEl!: HTMLElement | null;
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
  private dragging = false;
  private seekBound = false;
  /** High-res PCM for oscillation shape. */
  private pcmPeaks: Float32Array = new Float32Array(0);
  private displayPeaks: Float32Array = new Float32Array(0);
  private peaksKey = '';
  private waveAbort: AbortController | null = null;
  private waveToken = 0;

  /** Light-DOM only — never treat slot fallback as “has content”. */
  private syncSlots = (): void => {
    this.hasLeadingSlot = hasLightSlot(this, 'leading');
    this.hasTrailingSlot = hasLightSlot(this, 'trailing');
    this.hasSupportingSlot = hasLightSlot(this, 'supporting');
  };

  private get isWavy(): boolean {
    return this.wavy || this.shape === 'wavy';
  }

  /** Linear oscillation chrome — circular falls back to flat/wavy paint. */
  private get isOscillation(): boolean {
    return this.variant === 'linear' && this.shape === 'oscillation';
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

  private get canSeek(): boolean {
    return (
      this.interactive &&
      !this.indeterminate &&
      this.variant === 'linear' &&
      this.max > 0
    );
  }

  private clampValue(raw: number): number {
    const max = this.max > 0 ? this.max : 1;
    return Math.min(max, Math.max(0, raw));
  }

  private valueFromClientX(clientX: number): number {
    const el = this.indicatorEl ?? this;
    const rect = el.getBoundingClientRect();
    const w = rect.width || 1;
    const f = Math.min(1, Math.max(0, (clientX - rect.left) / w));
    return this.clampValue(f * (this.max > 0 ? this.max : 1));
  }

  private commitSeek(v: number, emitChange: boolean): void {
    const next = this.clampValue(v);
    this.value = next;
    this.displayProgress = this.fraction();
    this.emit('k3-input', { value: next });
    if (emitChange) this.emit('k3-change', { value: next });
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.paint);
  }

  private onSeekPointerDown = (e: PointerEvent): void => {
    if (!this.canSeek || e.button !== 0) return;
    e.preventDefault();
    this.dragging = true;
    this.setAttribute('data-dragging', '');
    this.setPointerCapture(e.pointerId);
    this.commitSeek(this.valueFromClientX(e.clientX), false);
  };

  private onSeekPointerMove = (e: PointerEvent): void => {
    if (!this.dragging) return;
    this.commitSeek(this.valueFromClientX(e.clientX), false);
  };

  private onSeekPointerUp = (e: PointerEvent): void => {
    if (!this.dragging) return;
    this.dragging = false;
    this.removeAttribute('data-dragging');
    try {
      this.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    this.commitSeek(this.valueFromClientX(e.clientX), true);
  };

  private onSeekKeyDown = (e: KeyboardEvent): void => {
    if (!this.canSeek) return;
    const max = this.max > 0 ? this.max : 1;
    const step = max * 0.05;
    const page = max * 0.1;
    let next = this.value;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next -= step;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next += step;
        break;
      case 'PageDown':
        next -= page;
        break;
      case 'PageUp':
        next += page;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    this.commitSeek(next, true);
  };

  private syncSeekBindings(): void {
    if (this.canSeek && !this.seekBound) {
      this.addEventListener('pointerdown', this.onSeekPointerDown);
      this.addEventListener('pointermove', this.onSeekPointerMove);
      this.addEventListener('pointerup', this.onSeekPointerUp);
      this.addEventListener('pointercancel', this.onSeekPointerUp);
      this.addEventListener('keydown', this.onSeekKeyDown);
      this.seekBound = true;
      if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    } else if (!this.canSeek && this.seekBound) {
      this.removeEventListener('pointerdown', this.onSeekPointerDown);
      this.removeEventListener('pointermove', this.onSeekPointerMove);
      this.removeEventListener('pointerup', this.onSeekPointerUp);
      this.removeEventListener('pointercancel', this.onSeekPointerUp);
      this.removeEventListener('keydown', this.onSeekKeyDown);
      this.seekBound = false;
      this.dragging = false;
      this.removeAttribute('data-dragging');
    }
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
    if (this.isOscillation) return Math.max(36, th + 24);
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
        const delta = Math.abs(target - this.displayProgress);
        /*
         * Small / frequent updates (e.g. media timeupdate) — snap.
         * Avoids restarting a 500ms ease every ~250ms → perpetual rAF.
         */
        if (delta < 0.02) {
          this.displayProgress = target;
          this.animFrom = target;
          this.animTo = target;
          this.animStart = t;
        } else {
          this.animFrom = this.displayProgress;
          this.animTo = target;
          this.animStart = t;
        }
      }
      if (Math.abs(this.displayProgress - this.animTo) > 0.0005) {
        const u = Math.min(1, (t - this.animStart) / DETERMINATE_MS);
        this.displayProgress =
          this.animFrom + (this.animTo - this.animFrom) * easeDeterminate(u);
      } else {
        this.displayProgress = this.animTo;
      }
    } else if (!this.indeterminate) {
      this.displayProgress = this.fraction();
    }

    if (this.variant === 'circular') this.paintCircular(ctx, canvas, dpr, t);
    else this.paintLinear(ctx, canvas, dpr, t);

    const oscIndet =
      this.isOscillation && this.indeterminate && !this.reduceMotion;
    if ((this.indeterminate && !this.reduceMotion) || oscIndet) {
      this.raf = requestAnimationFrame(this.paint);
    } else if (
      !this.indeterminate &&
      !this.reduceMotion &&
      Math.abs(this.displayProgress - this.animTo) > 0.0005
    ) {
      this.raf = requestAnimationFrame(this.paint);
    }
    /*
     * Determinate wavy: paint once (static phase). Continuous wave rAF was
     * burning CPU with multiple progress instances (audio player demos).
     * Oscillation indeterminate keeps rAF to scroll the PCM window.
     */
  };

  private ensureOscillationPeaks(width: number): void {
    const n = oscillationBarCount(width);
    const key = `${this.src}|${this.pcmPeaks.length}|${n}`;
    if (key === this.peaksKey && this.displayPeaks.length === n) return;
    this.peaksKey = key;
    if (!this.pcmPeaks.length) {
      this.displayPeaks = new Float32Array(n).fill(0.08);
      return;
    }
    this.displayPeaks = resamplePeaks(this.pcmPeaks, n);
  }

  private async loadOscillationPcm(): Promise<void> {
    const url = this.src.trim();
    if (!this.isOscillation || !url) {
      this.pcmPeaks = new Float32Array(0);
      this.displayPeaks = new Float32Array(0);
      this.peaksKey = '';
      return;
    }
    this.waveAbort?.abort();
    const ac = new AbortController();
    this.waveAbort = ac;
    const token = ++this.waveToken;
    this.pcmPeaks = new Float32Array(0);
    this.displayPeaks = new Float32Array(0);
    this.peaksKey = '';
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.paint);
    try {
      const peaks = await loadWaveformPeaks(url, { signal: ac.signal });
      if (token !== this.waveToken || ac.signal.aborted) return;
      this.pcmPeaks = peaks;
      this.peaksKey = '';
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(this.paint);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      if (token === this.waveToken) {
        this.pcmPeaks = new Float32Array(0);
        cancelAnimationFrame(this.raf);
        this.raf = requestAnimationFrame(this.paint);
      }
    }
  }

  private paintLinearOscillation(
    ctx: CanvasRenderingContext2D,
    cssW: number,
    cssH: number,
    now: number,
    rtl: boolean,
    active: string,
    track: string,
  ): void {
    this.ensureOscillationPeaks(cssW);
    let peaks = this.displayPeaks;
    let frac = this.displayProgress;
    if (this.indeterminate) {
      if (peaks.length && this.pcmPeaks.length) {
        const offset =
          this.reduceMotion
            ? 0
            : Math.floor(((now - this.startMs) / 48) % peaks.length);
        if (offset > 0) {
          const rotated = new Float32Array(peaks.length);
          for (let i = 0; i < peaks.length; i++) {
            rotated[i] = peaks[(i + offset) % peaks.length]!;
          }
          peaks = rotated;
        }
        frac = 0.38;
      } else {
        frac = 0;
      }
    }
    drawOscillationBars(ctx, cssW, cssH, frac, peaks, active, track, rtl);
  }

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
    const rtl = getComputedStyle(this).direction === 'rtl';

    if (this.isOscillation) {
      this.paintLinearOscillation(ctx, cssW, cssH, now, rtl, active, track);
      return;
    }

    const th = devicePixelSnapPx(this.thicknessPx, dpr);
    const gap = devicePixelSnapPx(GAP_DP, dpr);
    const stopSize = devicePixelSnapPx(STOP_DP, dpr);
    const waveLen = devicePixelSnapPx(LINEAR_WAVE_LEN, dpr);
    /* Round-cap inset — geometric ends are cap centers. */
    const edge = th / 2;
    const cy = cssH / 2;
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
    this.waveAbort?.abort();
    this.waveAbort = null;
    this.removeEventListener('slotchange', this.syncSlots, true);
    if (this.seekBound) {
      this.removeEventListener('pointerdown', this.onSeekPointerDown);
      this.removeEventListener('pointermove', this.onSeekPointerMove);
      this.removeEventListener('pointerup', this.onSeekPointerUp);
      this.removeEventListener('pointercancel', this.onSeekPointerUp);
      this.removeEventListener('keydown', this.onSeekKeyDown);
      this.seekBound = false;
    }
    super.disconnectedCallback();
  }

  override firstUpdated(): void {
    this.syncSlots();
    this.syncSeekBindings();
    if (this.isOscillation && this.src.trim()) void this.loadOscillationPcm();
    this.restartLoop();
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('wavy') && this.wavy && this.shape !== 'wavy') {
      this.shape = 'wavy';
    } else if (changed.has('shape') && this.shape === 'wavy' && !this.wavy) {
      this.wavy = true;
    } else if (
      changed.has('shape') &&
      (this.shape === 'flat' || this.shape === 'oscillation') &&
      this.wavy
    ) {
      this.wavy = false;
    }
  }

  override updated(changed: PropertyValues): void {
    if (
      changed.has('interactive') ||
      changed.has('indeterminate') ||
      changed.has('variant') ||
      changed.has('max')
    ) {
      this.syncSeekBindings();
    }
    if (
      (changed.has('shape') || changed.has('src') || changed.has('variant')) &&
      this.isOscillation
    ) {
      void this.loadOscillationPcm();
    }
    if (changed.has('shape') && this.shape !== 'oscillation') {
      this.waveAbort?.abort();
      this.pcmPeaks = new Float32Array(0);
      this.displayPeaks = new Float32Array(0);
      this.peaksKey = '';
    }
    if (this.dragging && changed.has('value')) {
      /* Ignore external value while the user is scrubbing. */
      return;
    }
    if (
      changed.has('value') ||
      changed.has('max') ||
      changed.has('indeterminate') ||
      changed.has('variant') ||
      changed.has('shape') ||
      changed.has('wavy') ||
      changed.has('src') ||
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
        role=${this.canSeek ? 'slider' : 'progressbar'}
        aria-label=${ariaName}
        aria-valuemin="0"
        aria-valuemax=${this.canSeek ? this.max : 100}
        aria-valuenow=${this.indeterminate
          ? nothing
          : this.canSeek
            ? this.value
            : pct}
        aria-disabled=${this.canSeek ? 'false' : nothing}
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

if (!customElements.get('k3-progress')) {
  customElements.define('k3-progress', K3Progress);
}
