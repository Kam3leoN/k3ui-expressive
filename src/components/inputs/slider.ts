import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  K3Element,
  attachInternals,
  setFormValue,
  hasNamedSlot,
  focusRingStyles,
  haptic,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  SLIDER_HANDLE_GAP,
  SLIDER_HANDLE_GAP_PRESSED,
  SLIDER_HANDLE_WIDTH_PRESSED,
  SLIDER_INNER_CORNER,
  SLIDER_JUMP_MS,
  SLIDER_SIZES,
  SLIDER_STOP,
  SLIDER_STOP_EDGE_INSET,
  SLIDER_VALUE_INDICATOR_GAP,
  SLIDER_VALUE_INDICATOR_H,
  SLIDER_VALUE_INDICATOR_W,
  canInsetIcon,
  resolveSliderSize,
  type SliderColor,
  type SliderOrientation,
  type SliderSize,
  type SliderVariant,
} from './slider-tokens.js';
import { sliderStyles } from './slider.styles.js';

export type {
  SliderColor,
  SliderOrientation,
  SliderSize,
  SliderVariant,
} from './slider-tokens.js';
export {
  SLIDER_ICON_MIN_PAIRS,
  canInsetIcon,
  resolveSliderSize,
  sliderIconAtMin,
} from './slider-tokens.js';

/** Track segment along the value axis (0 = min … 100 = max). */
interface SegDesc {
  start: number;
  end: number;
  lead: boolean;
  trail: boolean;
  /** Inset gap+half-handle from the start edge (toward handle). */
  padStart: boolean;
  /** Inset gap+half-handle from the end edge (toward handle). */
  padEnd: boolean;
  /**
   * Centered origin only — inset `thumbTrackGap` (no half-handle) at start.
   * Mutually exclusive with {@link padStart}.
   */
  originGapStart?: boolean;
  /**
   * Centered origin only — inset `thumbTrackGap` (no half-handle) at end.
   * Mutually exclusive with {@link padEnd}.
   */
  originGapEnd?: boolean;
}

/**
 * M3 / M3 Expressive slider.
 *
 * - Variants: `standard` · `centered` · `range` (range = horizontal only)
 * - Sizes: `xs` · `sm` · `md` · `lg` · `xl`
 * - Orientation: `horizontal` · `vertical` (min at bottom; `top-to-bottom` flips)
 * - Color: `primary` · `secondary` · `tertiary` · `error`
 * - Stops + optional `stop-labels`, value indicator (range: one VI at a time)
 * - Inset icon (standard · md+) via `slot="icon"`; optional `slot="icon-min"`
 *   for any alternate glyph at min (volume_off, mic_off, wifi_off, …) —
 *   see {@link sliderIconAtMin}
 * - Linked fields via `for` / `for-start` / `for-end`
 * - Optional `slot="start"` / `slot="end"` addons (±)
 *
 * @see https://m3.material.io/components/sliders/specs
 * @see https://m3.material.io/components/sliders/guidelines
 */
export class K3Slider extends K3Element {
  static formAssociated = true;
  static override styles = [hostReset, focusRingStyles, sliderStyles];

  internals = attachInternals(this);

  /** Current value (standard / centered). */
  @property({ type: Number }) value = 0;
  /** Range start (variant=`range`). */
  @property({ type: Number, attribute: 'value-start' }) valueStart = 0;
  /** Range end (variant=`range`). */
  @property({ type: Number, attribute: 'value-end' }) valueEnd = 100;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) step = 1;
  @property() name = '';
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** `xs` · `sm` · `md` · `lg` · `xl` (default `xs`). */
  @property({ reflect: true }) size: SliderSize = 'xs';
  /** `horizontal` (default) · `vertical`. */
  @property({ reflect: true }) orientation: SliderOrientation = 'horizontal';
  /** `standard` (default) · `centered` · `range`. */
  @property({ reflect: true }) variant: SliderVariant = 'standard';
  /** Active/handle color role (default `primary`). */
  @property({ reflect: true }) color: SliderColor = 'primary';
  /**
   * Vertical only — put min at the top (default is min at bottom).
   */
  @property({ type: Boolean, reflect: true, attribute: 'top-to-bottom' })
  topToBottom = false;
  /** Show discrete stop indicators (and snap). */
  @property({ type: Boolean, reflect: true }) stops = false;
  /**
   * Optional tick labels aligned to stops (comma-separated, same order as stops).
   * Example: `stop-labels="Low,Med,High"` with `stops step="50"`.
   */
  @property({ attribute: 'stop-labels' }) stopLabels = '';
  /** Show floating value indicator while dragging. */
  @property({ type: Boolean, reflect: true, attribute: 'value-indicator' })
  valueIndicator = false;
  /**
   * Opt-in inset icon (standard · md/lg/xl only).
   * `slot="icon"` = default · `slot="icon-min"` = optional alternate at min
   * (any glyph — not volume-specific; see {@link sliderIconAtMin}).
   */
  @property({ type: Boolean, reflect: true, attribute: 'inset-icon' })
  insetIcon = false;
  /** Optional accessible / visible label. */
  @property() label = '';
  /** Linked input / text-field id (standard · centered). */
  @property() for = '';
  /** Range — linked field for the start handle. */
  @property({ attribute: 'for-start' }) forStart = '';
  /** Range — linked field for the end handle. */
  @property({ attribute: 'for-end' }) forEnd = '';

  @state() private pressed = false;
  @state() private activeHandle: 'value' | 'start' | 'end' = 'value';
  @state() private showIndicator = false;
  @state() private hasIconSlot = false;
  @state() private hasIconMinSlot = false;
  /** Optional leading icon in the label row (`slot="label-icon"`). */
  @state() private hasLabelIconSlot = false;
  /** Optional ± / step affordances beside the track (`slot="start"` / `slot="end"`). */
  @state() private hasStartSlot = false;
  @state() private hasEndSlot = false;
  /** Track length along the value axis (px) — for exact 6dp gaps. */
  @state() private trackLenPx = 200;

  private dragCleanup: (() => void) | null = null;
  private trackRo: ResizeObserver | null = null;
  private trackEl: HTMLElement | null = null;
  private jumpRaf = 0;
  private linkedCleanup: (() => void) | null = null;
  private syncingFromField = false;
  /** Last stepped value that fired a CLOCK_TICK-style haptic while dragging. */
  private hapticStepAt: number | null = null;
  private hapticTickAt = 0;

  private get tokens() {
    return SLIDER_SIZES[resolveSliderSize(this.size)];
  }

  private get vertical(): boolean {
    return this.orientation === 'vertical';
  }

  /** Vertical with min at top (attribute `top-to-bottom`). */
  private get minAtTop(): boolean {
    return this.vertical && this.topToBottom;
  }

  /**
   * Range is horizontal-only (M3: vertical range adds too much cognitive load).
   */
  private get range(): boolean {
    return this.variant === 'range' && !this.vertical;
  }

  private get centered(): boolean {
    return this.variant === 'centered';
  }

  private clamp(v: number): number {
    const lo = this.min;
    const hi = this.max;
    let x = Math.min(hi, Math.max(lo, v));
    /* Always snap to step so VI / aria / geometry agree at the ends while dragging. */
    const step = this.step > 0 ? this.step : 1;
    const n = Math.round((x - lo) / step);
    x = lo + n * step;
    return Math.min(hi, Math.max(lo, x));
  }

  private fraction(v: number): number {
    const span = this.max - this.min;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, (v - this.min) / span));
  }

  /** True min — epsilon covers float residue after pointer mapping. */
  private atMin(v: number): boolean {
    return this.fraction(v) <= 1e-6;
  }

  /** True max — epsilon covers float residue after pointer mapping. */
  private atMax(v: number): boolean {
    return this.fraction(v) >= 1 - 1e-6;
  }

  private valueFromFraction(f: number): number {
    return this.clamp(this.min + f * (this.max - this.min));
  }

  private centerFraction(): number {
    /* Midpoint of the numeric range (0 for symmetric −N…N). */
    return this.fraction((this.min + this.max) / 2);
  }

  private syncForm(): void {
    if (this.range) {
      setFormValue(this.internals, `${this.valueStart},${this.valueEnd}`);
    } else {
    setFormValue(this.internals, String(this.value));
    }
  }

  private emitValue(): void {
    if (this.range) {
      this.emit('k3-input', {
        value: this.valueStart,
        valueStart: this.valueStart,
        valueEnd: this.valueEnd,
      });
    } else {
    this.emit('k3-input', { value: this.value });
    }
  }

  private emitChange(): void {
    if (this.range) {
      this.emit('k3-change', {
        value: this.valueStart,
        valueStart: this.valueStart,
        valueEnd: this.valueEnd,
      });
    } else {
      this.emit('k3-change', { value: this.value });
    }
  }

  /** Snap active handle to step grid for tick compare. */
  private steppedActive(): number {
    const raw =
      this.activeHandle === 'start'
        ? this.valueStart
        : this.activeHandle === 'end'
          ? this.valueEnd
          : this.value;
    const step = this.step > 0 ? this.step : 1;
    return Math.round(raw / step) * step;
  }

  /**
   * Android CLOCK_TICK while scrubbing discrete steps — throttled.
   * Release still gets a selection tick via {@link tickHapticCommit}.
   */
  private tickHapticStep(): void {
    const stepped = this.steppedActive();
    if (this.hapticStepAt !== null && stepped === this.hapticStepAt) return;
    const now = performance.now();
    if (now - this.hapticTickAt < 32) return;
    this.hapticStepAt = stepped;
    this.hapticTickAt = now;
    haptic.selection();
  }

  private tickHapticCommit(): void {
    /* Avoid double-pulse when the last drag frame already ticked a step. */
    if (performance.now() - this.hapticTickAt > 48) haptic.selection();
    this.hapticStepAt = null;
  }

  private pointerFraction(e: PointerEvent, area: HTMLElement): number {
    const r = area.getBoundingClientRect();
    if (this.vertical) {
      const y = e.clientY - r.top;
      /* Default: min at bottom. `top-to-bottom`: min at top. */
      const f = this.minAtTop ? y / r.height : 1 - y / r.height;
      return Math.min(1, Math.max(0, f));
    }
    const rtl = getComputedStyle(this).direction === 'rtl';
    const x = e.clientX - r.left;
    const f = Math.min(1, Math.max(0, x / r.width));
    return rtl ? 1 - f : f;
  }

  private setFromFraction(f: number, handle: 'value' | 'start' | 'end'): void {
    const v = this.valueFromFraction(f);
    if (handle === 'start') {
      this.valueStart = Math.min(v, this.valueEnd);
    } else if (handle === 'end') {
      this.valueEnd = Math.max(v, this.valueStart);
    } else {
      this.value = v;
    }
    this.syncForm();
    this.syncLinkedFields();
    this.emitValue();
  }

  private handleFraction(handle: 'value' | 'start' | 'end'): number {
    if (handle === 'start') return this.fraction(this.valueStart);
    if (handle === 'end') return this.fraction(this.valueEnd);
    return this.fraction(this.value);
  }

  private cancelJump(): void {
    if (this.jumpRaf) {
      cancelAnimationFrame(this.jumpRaf);
      this.jumpRaf = 0;
    }
  }

  /** Ease-out cubic — same settle family as determinate progress. */
  private easeJump(t: number): number {
    const x = Math.min(1, Math.max(0, t));
    return 1 - (1 - x) ** 3;
  }

  /** Animate handle to a fraction (select-jump). Cancelled by drag move. */
  private animateToFraction(
    targetF: number,
    handle: 'value' | 'start' | 'end',
  ): void {
    this.cancelJump();
    const from = this.handleFraction(handle);
    const to = Math.min(1, Math.max(0, targetF));
    if (Math.abs(to - from) < 0.0005) {
      this.setFromFraction(to, handle);
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / SLIDER_JUMP_MS);
      this.setFromFraction(from + (to - from) * this.easeJump(t), handle);
      if (t < 1) {
        this.jumpRaf = requestAnimationFrame(tick);
      } else {
        this.jumpRaf = 0;
      }
    };
    this.jumpRaf = requestAnimationFrame(tick);
  }

  private pickHandle(f: number): 'value' | 'start' | 'end' {
    if (!this.range) return 'value';
    const fs = this.fraction(this.valueStart);
    const fe = this.fraction(this.valueEnd);
    return Math.abs(f - fs) <= Math.abs(f - fe) ? 'start' : 'end';
  }

  private onAreaPointerDown = (e: PointerEvent): void => {
    if (this.disabled || e.button !== 0) return;
    const area = e.currentTarget as HTMLElement;
    area.setPointerCapture(e.pointerId);
    const f = this.pointerFraction(e, area);
    const handle = this.pickHandle(f);
    this.activeHandle = handle;
    this.pressed = true;
    this.showIndicator = this.valueIndicator;
    this.hapticStepAt = this.steppedActive();

    /* Select-jump when tap is away from the active handle — animate, don’t snap. */
    const cur = this.handleFraction(handle);
    const jumpThreshold = Math.max(
      0.02,
      (this.handlePadRestPx() * 2) / Math.max(1, this.trackLenPx),
    );
    if (Math.abs(f - cur) > jumpThreshold) {
      this.animateToFraction(f, handle);
    } else {
      this.setFromFraction(f, handle);
    }

    const move = (ev: PointerEvent) => {
      this.cancelJump();
      this.setFromFraction(this.pointerFraction(ev, area), handle);
      this.tickHapticStep();
    };
    const up = () => {
      this.cancelJump();
      this.pressed = false;
      this.showIndicator = false;
      this.tickHapticCommit();
      this.emitChange();
      area.releasePointerCapture(e.pointerId);
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerup', up);
      area.removeEventListener('pointercancel', up);
      this.dragCleanup = null;
    };
    area.addEventListener('pointermove', move);
    area.addEventListener('pointerup', up);
    area.addEventListener('pointercancel', up);
    this.dragCleanup = () => {
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerup', up);
      area.removeEventListener('pointercancel', up);
    };
  };

  private onHandleKey = (e: KeyboardEvent, handle: 'value' | 'start' | 'end'): void => {
    if (this.disabled) return;
    const step = this.step > 0 ? this.step : 1;
    const big = step * 10;
    let delta = 0;
    const vert = this.vertical;
    /* Vertical: ArrowUp moves toward the visual top. */
    const upDelta = this.minAtTop ? -step : step;
    const downDelta = this.minAtTop ? step : -step;
    switch (e.key) {
      case 'ArrowRight':
        if (vert) return;
        delta = step;
        break;
      case 'ArrowLeft':
        if (vert) return;
        delta = -step;
        break;
      case 'ArrowUp':
        delta = vert ? upDelta : step;
        break;
      case 'ArrowDown':
        delta = vert ? downDelta : -step;
        break;
      case 'PageUp':
        delta = this.minAtTop && vert ? -big : big;
        break;
      case 'PageDown':
        delta = this.minAtTop && vert ? big : -big;
        break;
      case 'Home':
        this.activeHandle = handle;
        this.setFromFraction(0, handle);
        this.emitChange();
        e.preventDefault();
        return;
      case 'End':
        this.activeHandle = handle;
        this.setFromFraction(1, handle);
        this.emitChange();
        e.preventDefault();
        return;
      default:
        return;
    }
    e.preventDefault();
    this.activeHandle = handle;
    const cur =
      handle === 'start'
        ? this.valueStart
        : handle === 'end'
          ? this.valueEnd
          : this.value;
    const next = this.clamp(cur + delta);
    const f = this.fraction(next);
    this.setFromFraction(f, handle);
    this.emitChange();
  };

  override disconnectedCallback(): void {
    this.cancelJump();
    this.dragCleanup?.();
    this.unlinkFields();
    this.trackRo?.disconnect();
    this.trackRo = null;
    this.trackEl = null;
    super.disconnectedCallback();
  }

  override willUpdate(): void {
    this.size = resolveSliderSize(this.size);
    if (this.color !== 'primary' && this.color !== 'secondary' && this.color !== 'tertiary' && this.color !== 'error') {
      this.color = 'primary';
    }
    /* M3 guidelines — avoid vertical range (cognitive load). */
    if (this.vertical && this.variant === 'range') {
      this.variant = 'standard';
    }
    /* top-to-bottom only applies to vertical. */
    if (!this.vertical && this.topToBottom) {
      this.topToBottom = false;
    }
    if (this.range && this.valueStart > this.valueEnd) {
      const t = this.valueStart;
      this.valueStart = this.valueEnd;
      this.valueEnd = t;
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    /* Light-DOM slots known before first paint (avoids a second update). */
    this.syncSlots();
  }

  override firstUpdated(): void {
    this.syncForm();
    this.syncSlots();
    this.syncHostMetrics();
    this.bindTrackObserver();
    this.bindLinkedFields();
    this.syncLinkedFields();
  }

  override updated(changed?: Map<string, unknown>): void {
    this.syncHostMetrics();
    this.bindTrackObserver();
    /* Form-associated a11y mirror (jsdom may lack ARIA reflection on internals). */
    try {
      this.internals.ariaDisabled = this.disabled ? 'true' : 'false';
    } catch {
      /* ignore */
    }
    if (
      changed?.has('for') ||
      changed?.has('forStart') ||
      changed?.has('forEnd') ||
      changed?.has('variant')
    ) {
      this.bindLinkedFields();
    }
    if (
      changed?.has('value') ||
      changed?.has('valueStart') ||
      changed?.has('valueEnd') ||
      changed?.has('min') ||
      changed?.has('max')
    ) {
      this.syncLinkedFields();
    }
  }

  /** Fieldset / form disables the control. */
  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  /**
   * Size tokens on the host — inherited by the shadow tree.
   * Vertical track length lives on `.area` via `--k3-slider-vertical-len`
   * (host height stays content-sized so start/end addons fit).
   */
  private syncHostMetrics(): void {
    for (const [k, v] of Object.entries(this.cssVars())) {
      this.style.setProperty(k, v);
    }
    /* Clear legacy inline height from older builds / external demos. */
    this.style.removeProperty('height');
  }

  private bindTrackObserver(): void {
    const el = this.renderRoot?.querySelector('.track') as HTMLElement | null;
    if (!el || el === this.trackEl) return;
    this.trackRo?.disconnect();
    this.trackEl = el;
    const measure = () => {
      const len = this.vertical ? el.clientHeight : el.clientWidth;
      if (len > 0 && Math.abs(len - this.trackLenPx) > 0.5) {
        this.trackLenPx = len;
      }
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      this.trackRo = new ResizeObserver(measure);
      this.trackRo.observe(el);
    }
  }

  private syncSlots = (): void => {
    this.hasIconSlot = hasNamedSlot(this, 'icon');
    this.hasIconMinSlot = hasNamedSlot(this, 'icon-min');
    this.hasLabelIconSlot = hasNamedSlot(this, 'label-icon');
    this.hasStartSlot = hasNamedSlot(this, 'start');
    this.hasEndSlot = hasNamedSlot(this, 'end');
  };

  private resolveField(id: string): (HTMLElement & { value?: string }) | null {
    const t = id.trim();
    if (!t) return null;
    return document.getElementById(t) as (HTMLElement & { value?: string }) | null;
  }

  private unlinkFields(): void {
    this.linkedCleanup?.();
    this.linkedCleanup = null;
  }

  /** Wire `for` / `for-start` / `for-end` to input or k3-text-field. */
  private bindLinkedFields(): void {
    this.unlinkFields();
    const cleanups: Array<() => void> = [];
    const bind = (
      id: string,
      apply: (raw: string) => void,
    ): void => {
      const el = this.resolveField(id);
      if (!el) return;
      const onInput = () => {
        if (this.disabled) return;
        this.syncingFromField = true;
        apply(String(el.value ?? ''));
        this.syncingFromField = false;
        this.syncForm();
        this.emitValue();
        this.emitChange();
      };
      el.addEventListener('input', onInput);
      el.addEventListener('change', onInput);
      cleanups.push(() => {
        el.removeEventListener('input', onInput);
        el.removeEventListener('change', onInput);
      });
    };

    if (this.range) {
      bind(this.forStart || this.for, (raw) => {
        const n = Number.parseFloat(raw);
        if (!Number.isFinite(n)) return;
        this.valueStart = Math.min(this.clamp(n), this.valueEnd);
      });
      bind(this.forEnd, (raw) => {
        const n = Number.parseFloat(raw);
        if (!Number.isFinite(n)) return;
        this.valueEnd = Math.max(this.clamp(n), this.valueStart);
      });
    } else {
      bind(this.for, (raw) => {
        const n = Number.parseFloat(raw);
        if (!Number.isFinite(n)) return;
        this.value = this.clamp(n);
      });
    }
    this.linkedCleanup = () => cleanups.forEach((c) => c());
  }

  /** Push slider values into linked fields (skip while reading from them). */
  private syncLinkedFields(): void {
    if (this.syncingFromField) return;
    const write = (id: string, v: number): void => {
      const el = this.resolveField(id);
      if (!el || el.value === undefined) return;
      const next = String(Math.round(v));
      if (el.value !== next) el.value = next;
    };
    if (this.range) {
      if (this.forStart) write(this.forStart, this.valueStart);
      if (this.forEnd) write(this.forEnd, this.valueEnd);
      /* Single `for` on range → "start–end" when no split fields. */
      if (this.for && !this.forStart && !this.forEnd) {
        const el = this.resolveField(this.for);
        if (el && el.value !== undefined) {
          const next = `${Math.round(this.valueStart)}–${Math.round(this.valueEnd)}`;
          if (el.value !== next) el.value = next;
        }
      }
    } else if (this.for) {
      write(this.for, this.value);
    }
  }

  /** Parsed stop-labels list (aligned to stop indices). */
  private parsedStopLabels(): string[] {
    if (!this.stopLabels.trim()) return [];
    return this.stopLabels.split(',').map((s) => s.trim());
  }

  /**
   * Resting pad (gap + half-handle) in CSS px — for jump threshold / icon fit.
   * Press geometry is animated purely in CSS via `--k3-slider-pad` / `--k3-slider-hw`.
   */
  private handlePadRestPx(): number {
    return SLIDER_HANDLE_GAP + this.tokens.handleWidth / 2;
  }

  private handlePadPressPx(): number {
    return SLIDER_HANDLE_GAP_PRESSED + SLIDER_HANDLE_WIDTH_PRESSED / 2;
  }

  /**
   * Segments along the value axis (0 = min … 100 = max).
   * Handle gap is applied later in {@link segStyle} as absolute CSS px.
   * At true min/max the track is flush (no leftover inactive/progress past the handle).
   */
  private segments(): {
    active: SegDesc[];
    inactive: SegDesc[];
  } {
    const active: SegDesc[] = [];
    const inactive: SegDesc[] = [];

    if (this.range) {
      const a = this.atMin(this.valueStart)
        ? 0
        : this.axisPct(this.fraction(this.valueStart));
      const b = this.atMax(this.valueEnd)
        ? 100
        : this.axisPct(this.fraction(this.valueEnd));
      if (a > 0.5) {
        inactive.push({
          start: 0,
          end: a,
          lead: true,
          trail: false,
          padStart: false,
          padEnd: true,
        });
      }
      if (b - a > 0.5) {
        active.push({
          start: a,
          end: b,
          /* Handle-facing ends stay inner 2dp; always keep the M3 gap to each handle. */
          lead: false,
          trail: false,
          padStart: true,
          padEnd: true,
        });
      }
      if (b < 99.5) {
        inactive.push({
          start: b,
          end: 100,
          lead: false,
          trail: true,
          padStart: true,
          padEnd: false,
        });
      }
      return { active, inactive };
    }

    const raw = this.fraction(this.value);
    /*
     * At true min/max: no inactive/active stub past the handle, but the M3
     * handle gap + inner 2dp corner always remain (never fuse track into handle).
     */
    if (!this.centered && this.atMin(this.value)) {
      inactive.push({
        start: 0,
        end: 100,
        lead: false,
        trail: true,
        padStart: true,
        padEnd: false,
      });
      return { active, inactive };
    }
    if (!this.centered && this.atMax(this.value)) {
      active.push({
        start: 0,
        end: 100,
        lead: true,
        trail: false,
        padStart: false,
        padEnd: true,
      });
      return { active, inactive };
    }

    const f = this.atMin(this.value)
      ? 0
      : this.atMax(this.value)
        ? 100
        : this.axisPct(raw);
    if (this.centered) {
      const c = this.axisPct(this.centerFraction());
      if (Math.abs(f - c) < 0.5) {
        /*
         * Handle rests on the midpoint — one M3 handle-pad each side
         * (same as standard). No active segment.
         */
        inactive.push({
          start: 0,
          end: c,
          lead: true,
          trail: false,
          padStart: false,
          padEnd: true,
        });
        inactive.push({
          start: c,
          end: 100,
          lead: false,
          trail: true,
          padStart: true,
          padEnd: false,
        });
        return { active, inactive };
      }
      /*
       * Active grows from the midpoint toward the handle.
       * M3 thumbTrackGap at the handle (full pad = gap + half-handle) AND a
       * single origin gap at center (gap only — no half-handle, no 2×).
       * Never flush the center join (gap is required by the specs).
       */
      const lo = Math.min(c, f);
      const hi = Math.max(c, f);
      const handleAtHi = f >= c; /* active fills center→handle (or handle→center) */
      if (lo > 0.5) {
        inactive.push({
          start: 0,
          end: lo,
          lead: true,
          trail: false,
          padStart: false,
          padEnd: !handleAtHi, /* handle on lo */
          originGapEnd: handleAtHi, /* center on lo */
        });
      }
      active.push({
        start: lo,
        end: hi,
        lead: false,
        trail: false,
        /* Handle side only — center gap lives on the inactive neighbour. */
        padStart: !handleAtHi,
        padEnd: handleAtHi,
      });
      if (hi < 99.5) {
        inactive.push({
          start: hi,
          end: 100,
          lead: false,
          trail: true,
          padStart: handleAtHi, /* handle on hi */
          originGapStart: !handleAtHi, /* center on hi */
          padEnd: false,
        });
      }
      return { active, inactive };
    }

    /* Standard — active from min → handle */
    if (f > 0.5) {
      active.push({
        start: 0,
        end: f,
        lead: true,
        trail: false,
        padStart: false,
        padEnd: true,
      });
    }
    if (f < 99.5) {
      inactive.push({
        start: f,
        end: 100,
        lead: false,
        trail: true,
        padStart: true,
        padEnd: false,
      });
    }
    return { active, inactive };
  }

  private stopPositions(): number[] {
    if (!this.stops) return [];
    const step = this.step > 0 ? this.step : 1;
    const out: number[] = [];
    const span = this.max - this.min;
    if (span <= 0) return out;
    const n = Math.floor(span / step);
    for (let i = 0; i <= n; i++) {
      out.push(this.fraction(this.min + i * step));
    }
    return out;
  }

  /**
   * Map a 0…1 value fraction onto the track so first/last stops sit
   * {@link SLIDER_STOP_EDGE_INSET} dp inside the ends (all sizes).
   */
  private stopVisualPct(fraction01: number): number {
    const len = Math.max(1, this.trackLenPx);
    const insetPct = (SLIDER_STOP_EDGE_INSET / len) * 100;
    const f = Math.min(1, Math.max(0, fraction01));
    return insetPct + f * (100 - 2 * insetPct);
  }

  /**
   * Inset axis for mid-range handle / stops / segments.
   * True min/max use 0%/100% instead ({@link handlePct}) so the track is flush.
   */
  private axisPct(fraction01: number): number {
    return this.stopVisualPct(fraction01);
  }

  private handlePct(which: 'value' | 'start' | 'end'): number {
    const v =
      which === 'start'
        ? this.valueStart
        : which === 'end'
          ? this.valueEnd
          : this.value;
    if (this.atMin(v)) return 0;
    if (this.atMax(v)) return 100;
    return this.axisPct(this.fraction(v));
  }

  private cssVars(): Record<string, string> {
    const t = this.tokens;
    const padRest = this.handlePadRestPx();
    const padPress = this.handlePadPressPx();
    return {
      '--k3-slider-track-h': `${t.track}px`,
      '--k3-slider-handle-h': `${t.handle}px`,
      '--k3-slider-handle-w': `${t.handleWidth}px`,
      '--k3-slider-hw-rest': `${t.handleWidth}px`,
      '--k3-slider-hw-press': `${SLIDER_HANDLE_WIDTH_PRESSED}px`,
      '--k3-slider-pad-rest': `${padRest}px`,
      '--k3-slider-pad-press': `${padPress}px`,
      /* thumbTrackGap alone — centered origin (no half-handle). */
      '--k3-slider-gap-rest': `${SLIDER_HANDLE_GAP}px`,
      '--k3-slider-gap-press': `${SLIDER_HANDLE_GAP_PRESSED}px`,
      '--k3-slider-vertical-len': `${t.verticalLen}px`,
      '--k3-slider-corner': `${t.corner}px`,
      '--k3-slider-inner-corner': `${SLIDER_INNER_CORNER}px`,
      /* Size only — color stays --k3-slider-stop / --k3-slider-stop-on-active in CSS. */
      '--k3-slider-stop-size': `${SLIDER_STOP}px`,
      '--k3-slider-stop-inset': `${SLIDER_STOP_EDGE_INSET}px`,
      '--k3-slider-icon-size': `${t.icon || 24}px`,
      '--k3-slider-vi-w': `${SLIDER_VALUE_INDICATOR_W}px`,
      '--k3-slider-vi-h': `${SLIDER_VALUE_INDICATOR_H}px`,
      '--k3-slider-vi-gap': `${SLIDER_VALUE_INDICATOR_GAP}px`,
    };
  }

  /** CSS length inset on a segment edge (handle pad or centered origin gap). */
  private edgeInset(handlePad: boolean, originGap: boolean): string {
    if (handlePad) return 'var(--k3-slider-pad)';
    if (originGap) return 'var(--k3-slider-gap)';
    return '0px';
  }

  /**
   * Segment box — insets use `--k3-slider-pad` (handle) and/or
   * `--k3-slider-gap` (centered origin), animated with `--k3-slider-hw`.
   */
  private segStyle(s: SegDesc): Record<string, string> {
    const startInset = this.edgeInset(s.padStart, !!s.originGapStart);
    const endInset = this.edgeInset(s.padEnd, !!s.originGapEnd);
    const span = Math.max(0, s.end - s.start);
    const padSum =
      startInset === '0px' && endInset === '0px'
        ? '0px'
        : startInset === '0px'
          ? endInset
          : endInset === '0px'
            ? startInset
            : `calc(${startInset} + ${endInset})`;
    const len = `max(0px, calc(${span}% - ${padSum}))`;
    if (this.vertical) {
      if (this.minAtTop) {
        return {
          bottom: 'auto',
          top:
            startInset === '0px'
              ? `${s.start}%`
              : `calc(${s.start}% + ${startInset})`,
          height: len,
        };
      }
      return {
        top: 'auto',
        bottom:
          startInset === '0px'
            ? `${s.start}%`
            : `calc(${s.start}% + ${startInset})`,
        height: len,
      };
    }
    return {
      insetInlineStart:
        startInset === '0px'
          ? `${s.start}%`
          : `calc(${s.start}% + ${startInset})`,
      width: len,
    };
  }

  private posStyle(pct: number): Record<string, string> {
    if (this.vertical) {
      if (this.minAtTop) {
        return { top: `${pct}%`, bottom: 'auto' };
      }
      return { bottom: `${pct}%`, top: 'auto' };
    }
    return { insetInlineStart: `${pct}%` };
  }

  private endStopPct(): number {
    return this.stopVisualPct(1);
  }

  /**
   * Contrast tip on the trailing inactive track (M3). Hidden when discrete
   * stops are on, or when the max-side handle sits on that tip:
   * standard/centered → `value` at max · range → `valueEnd` at max.
   */
  private renderEndStop(endStop: number) {
    if (this.stops) return nothing;
    const atEnd = this.range
      ? this.atMax(this.valueEnd)
      : this.atMax(this.value);
    if (atEnd) return nothing;
    return html`
      <div
        class="stop"
        style=${styleMap(this.posStyle(endStop))}
        part="end-stop"
      ></div>
    `;
  }

  /**
   * Inset track icon — `icon` by default, `icon-min` when value is at min
   * (consumer-supplied glyphs; not tied to volume).
   */
  private renderInsetIcon(
    show: boolean,
    onInactive: boolean,
    useMin: boolean,
    pos: Record<string, string> | typeof nothing,
  ) {
    return html`
      <div
        class=${classMap({
          'inset-icon': true,
          has: show,
          'on-inactive': onInactive,
        })}
        style=${pos === nothing ? nothing : styleMap(pos)}
        part="inset-icon"
      >
        <span class="inset-icon-face" ?hidden=${useMin}>
          <slot name="icon" @slotchange=${this.syncSlots}></slot>
        </span>
        <span class="inset-icon-face" ?hidden=${!useMin}>
          <slot name="icon-min" @slotchange=${this.syncSlots}></slot>
        </span>
      </div>
    `;
  }

  /** Single-value bubble text (range uses two separate indicators). */
  private formatValue(n: number): string {
    return String(Math.round(n));
  }

  override render() {
    const { active, inactive } = this.segments();
    const stops = this.stopPositions();
    const tickLabels = this.parsedStopLabels();
    const atValueMin = this.atMin(this.value);
    const useMinIcon = atValueMin && this.hasIconMinSlot;
    const showIcon =
      this.insetIcon &&
      canInsetIcon(resolveSliderSize(this.size), this.variant) &&
      (useMinIcon || this.hasIconSlot);
    /* M3: when active track can’t fit the icon, move it onto the inactive track. */
    const iconNeedPx = (this.tokens.icon || 24) + 8;
    const activePx =
      this.fraction(this.value) * Math.max(1, this.trackLenPx) -
      this.handlePadRestPx();
    const iconOnInactive =
      showIcon && !this.range && !this.centered && activePx < iconNeedPx;
    const endStop = this.endStopPct();
    const label = this.label.trim();
    /* Sticky: active → leading edge · inactive → just past handle (not far end). */
    const iconEdgeKey = this.minAtTop ? 'top' : 'bottom';
    const iconPosStyle = !showIcon
      ? nothing
      : this.vertical
        ? iconOnInactive
          ? {
              [iconEdgeKey]: `calc(${this.handlePct('value')}% + var(--k3-slider-pad) + var(--k3-slider-icon-edge))`,
            }
          : { [iconEdgeKey]: 'var(--k3-slider-icon-edge)' }
        : iconOnInactive
          ? {
              insetInlineStart: `calc(${this.handlePct('value')}% + var(--k3-slider-pad) + var(--k3-slider-icon-edge))`,
            }
          : { insetInlineStart: 'var(--k3-slider-icon-edge)' };

    const ariaValue = this.range ? this.valueStart : this.value;
    const ariaNow = Math.round(ariaValue);

    const showLabel = !!label || this.hasLabelIconSlot;

    return html`
      <div class="root" part="root">
        <div
          class=${classMap({
            rail: true,
            'has-start': this.hasStartSlot,
            'has-end': this.hasEndSlot,
          })}
          part="rail"
        >
          <div
            class=${classMap({ addon: true, start: true, has: this.hasStartSlot })}
            part="start"
          >
            <slot name="start" @slotchange=${this.syncSlots}></slot>
          </div>
          <div class="stack" part="stack">
            <div
              class=${classMap({
                label: true,
                has: showLabel,
                'has-icon': this.hasLabelIconSlot,
              })}
              part="label"
            >
              <span
                class=${classMap({
                  'label-icon': true,
                  has: this.hasLabelIconSlot,
                })}
                part="label-icon"
              >
                <slot name="label-icon" @slotchange=${this.syncSlots}></slot>
              </span>
              <span class="label-text">${label || nothing}</span>
            </div>
            <div
              class=${classMap({ area: true, pressed: this.pressed })}
              part="area"
              @pointerdown=${this.onAreaPointerDown}
            >
              <div class="track" part="track">
            ${inactive.map(
              (s) => html`
                <div
                  class=${classMap({
                    seg: true,
                    inactive: true,
                    'lead-cap': s.lead,
                    'trail-cap': s.trail,
                  })}
                  style=${styleMap(this.segStyle(s))}
                  part="inactive"
                ></div>
              `,
            )}
            ${active.map(
              (s) => html`
                <div
                  class=${classMap({
                    seg: true,
                    active: true,
                    'lead-cap': s.lead,
                    'trail-cap': s.trail,
                  })}
                  style=${styleMap(this.segStyle(s))}
                  part="active"
                ></div>
              `,
            )}

            ${stops.map((f, i) => {
              /*
               * At true min/max the handle is flush (0%/100%) — hide the inset
               * end paliers so they don’t sit beside the handle on the track.
               */
              if (f <= 0 && this.atMin(this.range ? this.valueStart : this.value)) {
                return nothing;
              }
              if (f >= 1 && this.atMax(this.range ? this.valueEnd : this.value)) {
                return nothing;
              }
              /* Color from logical value; position from shared axisPct. */
              let onActive = false;
              if (this.range) {
                onActive =
                  f >= this.fraction(this.valueStart) &&
                  f <= this.fraction(this.valueEnd);
              } else if (this.centered) {
                const c = this.centerFraction();
                const v = this.fraction(this.value);
                onActive = f >= Math.min(c, v) && f <= Math.max(c, v);
              } else {
                onActive = f <= this.fraction(this.value);
              }
              const tick = tickLabels[i] ?? '';
              const pct = this.axisPct(f);
              return html`
                <div
                  class=${classMap({ stop: true, 'on-active': onActive })}
                  style=${styleMap(this.posStyle(pct))}
                  part="stop"
                ></div>
                ${tick
                  ? html`
                      <div
                        class="stop-label"
                        style=${styleMap(this.posStyle(pct))}
                        part="stop-label"
                      >
                        ${tick}
                      </div>
                    `
                  : nothing}
              `;
            })}

            ${this.renderEndStop(endStop)}
            ${this.renderInsetIcon(showIcon, iconOnInactive, useMinIcon, iconPosStyle)}

            ${this.range
              ? html`
                  <div
                    class=${classMap({
                      handle: true,
                      'k3-focus-ring': true,
                      'active-drag': this.activeHandle === 'start',
                    })}
                    style=${styleMap(this.posStyle(this.handlePct('start')))}
                    part="handle"
                    role="slider"
                    tabindex=${this.disabled ? -1 : 0}
                    aria-valuemin=${this.min}
                    aria-valuemax=${this.valueEnd}
                    aria-valuenow=${Math.round(this.valueStart)}
                    aria-orientation=${this.vertical ? 'vertical' : 'horizontal'}
                    aria-disabled=${this.disabled ? 'true' : 'false'}
                    aria-label=${label || 'Minimum'}
                    @keydown=${(e: KeyboardEvent) => this.onHandleKey(e, 'start')}
                  ></div>
                  <div
                    class=${classMap({
                      handle: true,
                      'k3-focus-ring': true,
                      'active-drag': this.activeHandle === 'end',
                    })}
                    style=${styleMap(this.posStyle(this.handlePct('end')))}
                    part="handle"
                    role="slider"
                    tabindex=${this.disabled ? -1 : 0}
                    aria-valuemin=${this.valueStart}
                    aria-valuemax=${this.max}
                    aria-valuenow=${Math.round(this.valueEnd)}
                    aria-orientation=${this.vertical ? 'vertical' : 'horizontal'}
                    aria-disabled=${this.disabled ? 'true' : 'false'}
                    aria-label=${label || 'Maximum'}
                    @keydown=${(e: KeyboardEvent) => this.onHandleKey(e, 'end')}
                  ></div>
                `
              : html`
                  <div
                    class=${classMap({
                      handle: true,
                      'k3-focus-ring': true,
                      'active-drag': true,
                    })}
                    style=${styleMap(this.posStyle(this.handlePct('value')))}
                    part="handle"
                    role="slider"
                    tabindex=${this.disabled ? -1 : 0}
                    aria-valuemin=${this.min}
                    aria-valuemax=${this.max}
                    aria-valuenow=${ariaNow}
                    aria-orientation=${this.vertical ? 'vertical' : 'horizontal'}
                    aria-disabled=${this.disabled ? 'true' : 'false'}
                    aria-label=${label || nothing}
                    @keydown=${(e: KeyboardEvent) => this.onHandleKey(e, 'value')}
                  ></div>
                `}

            ${this.range
              ? html`
                  <div
                    class=${classMap({
                      'value-indicator': true,
                      has:
                        this.showIndicator &&
                        this.valueIndicator &&
                        this.activeHandle === 'start',
                    })}
                    style=${styleMap(this.posStyle(this.handlePct('start')))}
                    part="value-indicator"
                    data-edge="start"
                  >
                    ${this.formatValue(this.valueStart)}
                  </div>
                  <div
                    class=${classMap({
                      'value-indicator': true,
                      has:
                        this.showIndicator &&
                        this.valueIndicator &&
                        this.activeHandle === 'end',
                    })}
                    style=${styleMap(this.posStyle(this.handlePct('end')))}
                    part="value-indicator"
                    data-edge="end"
                  >
                    ${this.formatValue(this.valueEnd)}
                  </div>
                `
              : html`
                  <div
                    class=${classMap({
                      'value-indicator': true,
                      has: this.showIndicator && this.valueIndicator,
                    })}
                    style=${styleMap(this.posStyle(this.handlePct('value')))}
                    part="value-indicator"
                  >
                    ${this.formatValue(this.value)}
                  </div>
                `}
              </div>
            </div>
          </div>
          <div
            class=${classMap({ addon: true, end: true, has: this.hasEndSlot })}
            part="end"
          >
            <slot name="end" @slotchange=${this.syncSlots}></slot>
          </div>
        </div>
      </div>
    `;
  }
}

export default K3Slider;