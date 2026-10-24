import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  K3Element,
  attachInternals,
  setFormValue,
  hasNamedSlot,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  SLIDER_HANDLE_GAP,
  SLIDER_HANDLE_WIDTH_PRESSED,
  SLIDER_INNER_CORNER,
  SLIDER_SIZES,
  SLIDER_STOP,
  SLIDER_VALUE_INDICATOR_GAP,
  SLIDER_VALUE_INDICATOR_H,
  SLIDER_VALUE_INDICATOR_W,
  canInsetIcon,
  resolveSliderSize,
  type SliderOrientation,
  type SliderSize,
  type SliderVariant,
} from './slider-tokens.js';
import { sliderStyles } from './slider.styles.js';

export type {
  SliderOrientation,
  SliderSize,
  SliderVariant,
} from './slider-tokens.js';

/**
 * M3 / M3 Expressive slider.
 *
 * - Variants: `standard` · `centered` · `range`
 * - Sizes: `xs` · `sm` · `md` · `lg` · `xl`
 * - Orientation: `horizontal` · `vertical`
 * - Stops (discrete), value indicator, inset icon (standard · md+)
 *
 * @see https://m3.material.io/components/sliders/specs
 * @see https://m3.material.io/components/sliders/guidelines
 */
export class K3Slider extends K3Element {
  static formAssociated = true;
  static override styles = [hostReset, sliderStyles];

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
  /** Show discrete stop indicators (and snap). */
  @property({ type: Boolean, reflect: true }) stops = false;
  /** Show floating value indicator while dragging. */
  @property({ type: Boolean, reflect: true, attribute: 'value-indicator' })
  valueIndicator = false;
  /**
   * Opt-in inset icon (standard · md/lg/xl only). Content via `slot="icon"`.
   */
  @property({ type: Boolean, reflect: true, attribute: 'inset-icon' })
  insetIcon = false;
  /** Optional accessible / visible label. */
  @property() label = '';

  @state() private pressed = false;
  @state() private activeHandle: 'value' | 'start' | 'end' = 'value';
  @state() private showIndicator = false;
  @state() private hasIconSlot = false;
  /** Track length along the value axis (px) — for exact 6dp gaps. */
  @state() private trackLenPx = 200;

  private dragCleanup: (() => void) | null = null;
  private trackRo: ResizeObserver | null = null;
  private trackEl: HTMLElement | null = null;

  private get tokens() {
    return SLIDER_SIZES[resolveSliderSize(this.size)];
  }

  private get vertical(): boolean {
    return this.orientation === 'vertical';
  }

  private get range(): boolean {
    return this.variant === 'range';
  }

  private get centered(): boolean {
    return this.variant === 'centered';
  }

  private clamp(v: number): number {
    const lo = this.min;
    const hi = this.max;
    let x = Math.min(hi, Math.max(lo, v));
    const step = this.step > 0 ? this.step : 1;
    if (this.stops || step !== 1) {
      const n = Math.round((x - lo) / step);
      x = lo + n * step;
      x = Math.min(hi, Math.max(lo, x));
    }
    return x;
  }

  private fraction(v: number): number {
    const span = this.max - this.min;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, (v - this.min) / span));
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

  private pointerFraction(e: PointerEvent, area: HTMLElement): number {
    const r = area.getBoundingClientRect();
    if (this.vertical) {
      /* Min at top · max at bottom — active grows downward (inverted vs prior). */
      const y = e.clientY - r.top;
      return Math.min(1, Math.max(0, y / r.height));
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
    this.emitValue();
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
    this.setFromFraction(f, handle);

    const move = (ev: PointerEvent) => {
      this.setFromFraction(this.pointerFraction(ev, area), handle);
    };
    const up = () => {
      this.pressed = false;
      this.showIndicator = false;
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
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        delta = vert && e.key === 'ArrowUp' ? step : e.key === 'ArrowRight' ? step : step;
        if (vert && e.key === 'ArrowUp') delta = step;
        if (!vert && e.key === 'ArrowUp') delta = step;
        if (vert && e.key === 'ArrowRight') delta = 0;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        delta = -step;
        break;
      case 'PageUp':
        delta = big;
        break;
      case 'PageDown':
        delta = -big;
        break;
      case 'Home':
        this.setFromFraction(0, handle);
        this.emitChange();
        e.preventDefault();
        return;
      case 'End':
        this.setFromFraction(1, handle);
        this.emitChange();
        e.preventDefault();
        return;
      default:
        return;
    }
    if (vert && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
    e.preventDefault();
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
    this.dragCleanup?.();
    this.trackRo?.disconnect();
    this.trackRo = null;
    this.trackEl = null;
    super.disconnectedCallback();
  }

  override willUpdate(): void {
    this.size = resolveSliderSize(this.size);
    if (this.range) {
      if (this.valueStart > this.valueEnd) {
        const t = this.valueStart;
        this.valueStart = this.valueEnd;
        this.valueEnd = t;
      }
    }
  }

  override firstUpdated(): void {
    this.syncForm();
    this.syncIconSlot();
    this.bindTrackObserver();
  }

  override updated(): void {
    this.bindTrackObserver();
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

  private syncIconSlot = (): void => {
    this.hasIconSlot = hasNamedSlot(this, 'icon');
  };

  /**
   * Distance from handle center to segment edge as % of track.
   * Gap between handle *edge* and track is always 6dp (pressed or not).
   */
  private handlePadPct(): number {
    const tok = this.tokens;
    const hw = this.pressed ? SLIDER_HANDLE_WIDTH_PRESSED : tok.handleWidth;
    const len = Math.max(1, this.trackLenPx);
    return ((SLIDER_HANDLE_GAP + hw / 2) / len) * 100;
  }

  /** Segment layout in % along the track axis. */
  private segments(): {
    active: { start: number; end: number; lead: boolean; trail: boolean }[];
    inactive: { start: number; end: number; lead: boolean; trail: boolean }[];
  } {
    const pad = this.handlePadPct();

    const active: { start: number; end: number; lead: boolean; trail: boolean }[] =
      [];
    const inactive: {
      start: number;
      end: number;
      lead: boolean;
      trail: boolean;
    }[] = [];

    if (this.range) {
      const a = this.fraction(this.valueStart) * 100;
      const b = this.fraction(this.valueEnd) * 100;
      const a0 = Math.max(0, a - pad);
      const b1 = Math.min(100, b + pad);
      if (a0 > 0.5) {
        inactive.push({ start: 0, end: a0, lead: true, trail: false });
      }
      if (b - a > pad * 2) {
        active.push({
          start: a + pad,
          end: b - pad,
          lead: false,
          trail: false,
        });
      }
      if (b1 < 99.5) {
        inactive.push({ start: b1, end: 100, lead: false, trail: true });
      }
      return { active, inactive };
    }

    const f = this.fraction(this.value) * 100;
    if (this.centered) {
      const c = this.centerFraction() * 100;
      const lo = Math.min(c, f);
      const hi = Math.max(c, f);
      if (lo > 0.5) {
        inactive.push({ start: 0, end: Math.max(0, lo - pad), lead: true, trail: false });
      }
      if (hi - lo > pad) {
        active.push({
          start: lo + (f < c ? 0 : pad),
          end: hi - (f > c ? 0 : pad),
          lead: f < c,
          trail: f > c,
        });
      }
      if (hi < 99.5) {
        inactive.push({
          start: Math.min(100, hi + pad),
          end: 100,
          lead: false,
          trail: true,
        });
      }
      /* Ensure inactive covers both sides when value ≈ center */
      if (Math.abs(f - c) < 0.5) {
        inactive.length = 0;
        inactive.push({ start: 0, end: Math.max(0, c - pad), lead: true, trail: false });
        inactive.push({
          start: Math.min(100, c + pad),
          end: 100,
          lead: false,
          trail: true,
        });
      }
      return { active, inactive };
    }

    /* Standard */
    if (f > pad) {
      active.push({
        start: 0,
        end: Math.max(0, f - pad),
        lead: true,
        trail: false,
      });
    }
    if (f < 100 - pad) {
      inactive.push({
        start: Math.min(100, f + pad),
        end: 100,
        lead: false,
        trail: true,
      });
    } else if (f >= 100 - pad) {
      /* Near max — tiny inactive omitted; end stop still drawn */
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

  private handlePct(which: 'value' | 'start' | 'end'): number {
    const v =
      which === 'start'
        ? this.valueStart
        : which === 'end'
          ? this.valueEnd
          : this.value;
    return this.fraction(v) * 100;
  }

  private cssVars(): Record<string, string> {
    const t = this.tokens;
    return {
      '--k3-slider-track-h': `${t.track}px`,
      '--k3-slider-handle-h': `${t.handle}px`,
      '--k3-slider-handle-w': `${t.handleWidth}px`,
      '--k3-slider-handle-w-pressed': `${SLIDER_HANDLE_WIDTH_PRESSED}px`,
      '--k3-slider-corner': `${t.corner}px`,
      '--k3-slider-inner-corner': `${SLIDER_INNER_CORNER}px`,
      '--k3-slider-stop': `${SLIDER_STOP}px`,
      '--k3-slider-stop-inset': `${t.stopInset}px`,
      '--k3-slider-icon-size': `${t.icon || 24}px`,
      '--k3-slider-vi-w': `${SLIDER_VALUE_INDICATOR_W}px`,
      '--k3-slider-vi-h': `${SLIDER_VALUE_INDICATOR_H}px`,
      '--k3-slider-vi-gap': `${SLIDER_VALUE_INDICATOR_GAP}px`,
    };
  }

  private segStyle(
    start: number,
    end: number,
  ): Record<string, string> {
    if (this.vertical) {
      return {
        top: `${start}%`,
        height: `${Math.max(0, end - start)}%`,
      };
    }
    return {
      insetInlineStart: `${start}%`,
      width: `${Math.max(0, end - start)}%`,
    };
  }

  private posStyle(pct: number): Record<string, string> {
    if (this.vertical) {
      return { top: `${pct}%` };
    }
    return { insetInlineStart: `${pct}%` };
  }

  private stopInsetPct(): number {
    const len = Math.max(1, this.trackLenPx);
    return (this.tokens.stopInset / len) * 100;
  }

  private endStopPct(): number {
    return 100 - this.stopInsetPct();
  }

  private displayValue(): string {
    if (this.range) {
      return `${Math.round(this.valueStart)}–${Math.round(this.valueEnd)}`;
    }
    return String(Math.round(this.value));
  }

  private indicatorPct(): number {
    if (this.range) {
      return this.handlePct(this.activeHandle === 'start' ? 'start' : 'end');
    }
    return this.handlePct('value');
  }

  override render() {
    const tok = this.tokens;
    const { active, inactive } = this.segments();
    const stops = this.stopPositions();
    const showIcon =
      this.insetIcon &&
      canInsetIcon(resolveSliderSize(this.size), this.variant) &&
      this.hasIconSlot;
    const iconOnInactive =
      showIcon && !this.range && !this.centered && this.fraction(this.value) < 0.2;
    const endStop = this.endStopPct();
    const label = this.label.trim();

    const ariaValue = this.range ? this.valueStart : this.value;
    const ariaNow = Math.round(ariaValue);

    return html`
      <div class="root" style=${styleMap(this.cssVars())} part="root">
        <div class=${classMap({ label: true, has: !!label })} part="label">
          ${label || nothing}
        </div>
        <div
          class="area"
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
                  style=${styleMap(this.segStyle(s.start, s.end))}
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
                  style=${styleMap(this.segStyle(s.start, s.end))}
                  part="active"
                ></div>
              `,
            )}

            ${stops.map((f) => {
              const pct = f * 100;
              let onActive = false;
              if (this.range) {
                onActive =
                  pct >= this.handlePct('start') && pct <= this.handlePct('end');
              } else if (this.centered) {
                const c = this.centerFraction() * 100;
                const v = this.handlePct('value');
                onActive = pct >= Math.min(c, v) && pct <= Math.max(c, v);
              } else {
                onActive = pct <= this.handlePct('value');
              }
              return html`
                <div
                  class=${classMap({ stop: true, 'on-active': onActive })}
                  style=${styleMap(this.posStyle(pct))}
                  part="stop"
                ></div>
              `;
            })}

            ${!this.stops
              ? html`
                  <div
                    class="stop"
                    style=${styleMap(this.posStyle(endStop))}
                    part="end-stop"
                  ></div>
                `
              : nothing}

            <div
              class=${classMap({
                'inset-icon': true,
                has: showIcon,
                'on-inactive': iconOnInactive,
              })}
              part="inset-icon"
              style=${showIcon && iconOnInactive
                ? this.vertical
                  ? 'inset-block-end:auto;inset-block-start:0'
                  : 'inset-inline-start:auto;inset-inline-end:0'
                : nothing}
            >
              <slot name="icon" @slotchange=${this.syncIconSlot}></slot>
            </div>

            ${this.range
              ? html`
                  <div
                    class=${classMap({
                      handle: true,
                      pressed: this.pressed && this.activeHandle === 'start',
                      'active-drag': this.activeHandle === 'start',
                    })}
                    style=${styleMap(this.posStyle(this.handlePct('start')))}
                    part="handle"
                    role="slider"
                    tabindex=${this.disabled ? -1 : 0}
                    aria-valuemin=${this.min}
                    aria-valuemax=${this.valueEnd}
                    aria-valuenow=${Math.round(this.valueStart)}
                    aria-label=${label || 'Minimum'}
                    @keydown=${(e: KeyboardEvent) => this.onHandleKey(e, 'start')}
                  ></div>
                  <div
                    class=${classMap({
                      handle: true,
                      pressed: this.pressed && this.activeHandle === 'end',
                      'active-drag': this.activeHandle === 'end',
                    })}
                    style=${styleMap(this.posStyle(this.handlePct('end')))}
                    part="handle"
                    role="slider"
                    tabindex=${this.disabled ? -1 : 0}
                    aria-valuemin=${this.valueStart}
                    aria-valuemax=${this.max}
                    aria-valuenow=${Math.round(this.valueEnd)}
                    aria-label=${label || 'Maximum'}
                    @keydown=${(e: KeyboardEvent) => this.onHandleKey(e, 'end')}
                  ></div>
                `
              : html`
                  <div
                    class=${classMap({
                      handle: true,
                      pressed: this.pressed,
                      'active-drag': true,
                    })}
                    style=${styleMap(this.posStyle(this.handlePct('value')))}
                    part="handle"
                    role="slider"
                    tabindex=${this.disabled ? -1 : 0}
                    aria-valuemin=${this.min}
                    aria-valuemax=${this.max}
                    aria-valuenow=${ariaNow}
                    aria-label=${label || nothing}
                    @keydown=${(e: KeyboardEvent) => this.onHandleKey(e, 'value')}
                  ></div>
                `}

            <div
              class=${classMap({
                'value-indicator': true,
                has: this.showIndicator && this.valueIndicator,
              })}
              style=${styleMap(this.posStyle(this.indicatorPct()))}
              part="value-indicator"
            >
              ${this.displayValue()}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

export default K3Slider;