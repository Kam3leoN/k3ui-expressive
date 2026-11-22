import { html, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import {
  K3Element,
  stateLayerStyles,
  focusRingStyles,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import {
  CounterSpecs,
  resolveCounterSize,
  type CounterSize,
} from './counter.specs.js';
import { counterStyles } from './counter.styles.js';

export type { CounterSize } from './counter.specs.js';
export {
  CounterSpecs,
  CounterCircleDp,
  CounterMinWidthDp,
  resolveCounterSize,
} from './counter.specs.js';

/**
 * Material 3 Expressive counter — primary pill with − / tonal value / +.
 *
 * The centre spinbutton supports pointer drag: drag past half the value
 * width toward a side to increment or decrement (v1 behaviour).
 *
 * @fires k3-change - `{ value }` after the value changes
 * @fires k3-increment - `{ value }` after an increment
 * @fires k3-decrement - `{ value }` after a decrement
 *
 * @see ./counter.specs.ts
 */
export class K3Counter extends K3Element {
  static override styles = [
    hostReset,
    stateLayerStyles,
    focusRingStyles,
    counterStyles,
  ];

  @property({ type: Number }) value: number = CounterSpecs.defaultValue;
  @property({ type: Number }) min: number | undefined;
  @property({ type: Number }) max: number | undefined;
  @property({ type: Number }) step: number = CounterSpecs.defaultStep;
  @property({ type: Number }) decimals: number = CounterSpecs.defaultDecimals;
  @property({ type: Boolean, reflect: true, attribute: 'allow-negative' })
  allowNegative: boolean = CounterSpecs.allowNegative;
  @property({ reflect: true }) size: CounterSize = CounterSpecs.defaultSize;
  @property({ type: Boolean, reflect: true }) readonly = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  private dragOffset = 0;
  private dragCleanup: (() => void) | null = null;

  /** Current numeric value (alias for {@link value}). */
  getValue(): number {
    return this.value;
  }

  /**
   * Set the value, clamp / round, update UI, and emit `k3-change`.
   * Programmatic sets work even when `disabled` / `readonly`.
   */
  setValue(next: number): void {
    const v = this.clampValue(next);
    if (v === this.value) {
      this.requestUpdate();
      return;
    }
    this.value = v;
    this.emit('k3-change', { value: this.value });
  }

  /** Negatives when `allow-negative` or an explicit `min < 0`. */
  private negativesAllowed(): boolean {
    return this.allowNegative || (this.min !== undefined && this.min < 0);
  }

  private clampValue(raw: number): number {
    let v = this.roundValue(raw);
    if (!this.negativesAllowed() && v < 0) v = 0;
    if (this.min !== undefined && v < this.min) v = this.min;
    if (this.max !== undefined && v > this.max) v = this.max;
    return this.roundValue(v);
  }

  private roundValue(v: number): number {
    const decimals = this.decimals >= 0 ? this.decimals : 0;
    if (decimals <= 0) return Math.round(v);
    const factor = 10 ** decimals;
    return Math.round(v * factor) / factor;
  }

  private formatDisplay(v: number): string {
    const decimals = this.decimals >= 0 ? this.decimals : 0;
    if (decimals <= 0) return String(Math.round(v));
    return v.toFixed(decimals);
  }

  private canEdit(): boolean {
    return !this.disabled && !this.readonly;
  }

  private canDecrement(): boolean {
    if (!this.canEdit()) return false;
    const next = this.roundValue(this.value - this.resolvedStep());
    if (!this.negativesAllowed() && next < 0) return false;
    if (this.min !== undefined && next < this.min) return false;
    return true;
  }

  private canIncrement(): boolean {
    if (!this.canEdit()) return false;
    const next = this.roundValue(this.value + this.resolvedStep());
    if (this.max !== undefined && next > this.max) return false;
    return true;
  }

  private resolvedStep(): number {
    return this.step > 0 ? this.step : CounterSpecs.defaultStep;
  }

  private applyValue(next: number, direction: 'increment' | 'decrement'): void {
    if (!this.canEdit()) return;
    const v = this.roundValue(next);
    if (!this.negativesAllowed() && v < 0) return;
    if (this.min !== undefined && v < this.min) return;
    if (this.max !== undefined && v > this.max) return;
    if (v === this.value) return;
    this.value = v;
    this.emit('k3-change', { value: this.value });
    if (direction === 'increment') {
      this.emit('k3-increment', { value: this.value });
    } else {
      this.emit('k3-decrement', { value: this.value });
    }
  }

  private handleDecrement = (): void => {
    if (!this.canDecrement()) return;
    this.applyValue(this.value - this.resolvedStep(), 'decrement');
  };

  private handleIncrement = (): void => {
    if (!this.canIncrement()) return;
    this.applyValue(this.value + this.resolvedStep(), 'increment');
  };

  private numberEl(): HTMLElement | null {
    return this.renderRoot.querySelector('.number') as HTMLElement | null;
  }

  private wrapperEl(): HTMLElement | null {
    return this.renderRoot.querySelector('.wrapper') as HTMLElement | null;
  }

  private centerNumber(): void {
    this.dragOffset = 0;
    const num = this.numberEl();
    if (!num) return;
    num.style.transition = 'transform 0.3s ease';
    num.style.transform = '';
    num.removeAttribute('data-dragging');
  }

  /**
   * Commit drag: compare offset (before spring-back) to half the value width.
   * Must run before {@link centerNumber} — v1 cleared transform first and the
   * threshold never fired.
   */
  private commitDrag(): void {
    const num = this.numberEl();
    const threshold = (num?.offsetWidth ?? 0) * 0.5;
    const offset = this.dragOffset;
    this.centerNumber();
    if (offset <= -threshold) this.handleDecrement();
    else if (offset >= threshold) this.handleIncrement();
  }

  private onNumberPointerDown = (e: PointerEvent): void => {
    if (!this.canEdit()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();

    const num = this.numberEl();
    const wrapper = this.wrapperEl();
    if (!num || !wrapper) return;

    this.dragCleanup?.();
    this.dragOffset = 0;
    num.setAttribute('data-dragging', '');
    num.style.transition = 'none';
    num.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent): void => {
      const wr = wrapper.getBoundingClientRect();
      const numW = num.offsetWidth;
      const maxOffset = (wr.width - numW) / 2;
      this.dragOffset = Math.min(
        maxOffset,
        Math.max(-maxOffset, this.dragOffset + ev.movementX),
      );
      num.style.transform = `translateX(${this.dragOffset}px)`;
    };

    const onEnd = (): void => {
      num.removeEventListener('pointermove', onMove);
      num.removeEventListener('pointerup', onEnd);
      num.removeEventListener('pointercancel', onEnd);
      try {
        num.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      this.dragCleanup = null;
      this.commitDrag();
    };

    num.addEventListener('pointermove', onMove);
    num.addEventListener('pointerup', onEnd);
    num.addEventListener('pointercancel', onEnd);
    this.dragCleanup = () => {
      num.removeEventListener('pointermove', onMove);
      num.removeEventListener('pointerup', onEnd);
      num.removeEventListener('pointercancel', onEnd);
    };
  };

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('size')) {
      this.size = resolveCounterSize(this.size);
    }
    if (changed.has('step') && !(this.step > 0)) {
      this.step = CounterSpecs.defaultStep;
    }
    if (
      changed.has('value') ||
      changed.has('decimals') ||
      changed.has('min') ||
      changed.has('max') ||
      changed.has('allowNegative')
    ) {
      this.value = this.clampValue(this.value);
    }
  }

  override disconnectedCallback(): void {
    this.dragCleanup?.();
    this.dragCleanup = null;
    super.disconnectedCallback();
  }

  override render() {
    const decDisabled = !this.canDecrement();
    const incDisabled = !this.canIncrement();
    const display = this.formatDisplay(this.value);

    return html`
      <div
        class=${classMap({
          wrapper: true,
          [`wrapper--${this.size}`]: true,
        })}
        part="container"
        role=${CounterSpecs.accessibility.role}
        aria-disabled=${this.disabled ? 'true' : 'false'}
      >
        <button
          type="button"
          class="btn btn--decrement k3-state-layer k3-focus-ring"
          part="decrement"
          aria-label=${i18n.t('counter.decrement', CounterSpecs.accessibility.ariaLabelDecrement)}
          ?disabled=${decDisabled}
          @click=${this.handleDecrement}
        >
          <span
            class="glyph notranslate"
            translate="no"
            lang="zxx"
            data-k3-icon="remove"
            aria-hidden="true"
          ></span>
        </button>

        <div
          class="number"
          part="value"
          role="spinbutton"
          tabindex=${this.canEdit() ? '0' : '-1'}
          aria-label=${i18n.t('counter.value', CounterSpecs.accessibility.ariaLabelValue)}
          aria-valuenow=${this.value}
          aria-valuetext=${display}
          aria-valuemin=${ifDefined(this.min)}
          aria-valuemax=${ifDefined(this.max)}
          aria-disabled=${this.disabled || this.readonly ? 'true' : 'false'}
          @pointerdown=${this.onNumberPointerDown}
          @keydown=${this.onNumberKeyDown}
        >
          ${display}
        </div>

        <button
          type="button"
          class="btn btn--increment k3-state-layer k3-focus-ring"
          part="increment"
          aria-label=${i18n.t('counter.increment', CounterSpecs.accessibility.ariaLabelIncrement)}
          ?disabled=${incDisabled}
          @click=${this.handleIncrement}
        >
          <span
            class="glyph notranslate"
            translate="no"
            lang="zxx"
            data-k3-icon="add"
            aria-hidden="true"
          ></span>
        </button>
      </div>
    `;
  }

  private onNumberKeyDown = (e: KeyboardEvent): void => {
    if (!this.canEdit()) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      this.handleIncrement();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      this.handleDecrement();
    } else if (e.key === 'Home' && this.min !== undefined) {
      e.preventDefault();
      this.setValue(this.min);
    } else if (e.key === 'End' && this.max !== undefined) {
      e.preventDefault();
      this.setValue(this.max);
    }
  };
}

export default K3Counter;

if (!customElements.get('k3-counter')) {
  customElements.define('k3-counter', K3Counter);
}
