import { html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { K3Element, focusRingStyles } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import { timePickerDialStyles } from './time-picker-dial.styles.js';
import type { TimeParts, TimePickerPeriod, TimePickerView } from './time-picker.types.js';
import {
  angleFromPointer,
  hour24FromDisplay,
  hourFromAngle,
  isTimeBlocked,
  minuteFromAngle,
  pad2,
  snapToStep,
  steppedRange,
} from './time-picker.utils.js';

type DialKind = 'hour' | 'minute' | 'second';

/**
 * Clock-face dial for `k3-time-picker` — hour / minute / second rings.
 * Pointer + keyboard (listbox / options).
 *
 * @fires k3-change — `{ hour?, minute?, second? }` when selection moves
 */
export class K3TimePickerDial extends K3Element {
  static override styles = [hostReset, focusRingStyles, timePickerDialStyles];

  @property({ reflect: true }) view: TimePickerView = 'hour';
  @property({ reflect: true }) format: '12' | '24' = '12';
  @property({ type: Number }) hour: number | null = null;
  @property({ type: Number }) minute: number | null = null;
  @property({ type: Number }) second: number | null = null;
  @property() period: TimePickerPeriod = 'am';
  @property({ type: Boolean, attribute: 'show-seconds', reflect: true }) showSeconds = false;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep = 1;
  @property({ type: Number, attribute: 'second-step' }) secondStep = 1;
  @property({ attribute: false }) minParts: TimeParts | null = null;
  @property({ attribute: false }) maxParts: TimeParts | null = null;
  @property({ attribute: false }) blackoutTimes: ((t: TimeParts) => boolean) | null = null;

  @state() private dragging = false;
  private dragRect: DOMRect | null = null;

  override firstUpdated(): void {
    this.updateHand();
  }

  override updated(changed: Map<string, unknown>): void {
    if (
      changed.has('view') ||
      changed.has('hour') ||
      changed.has('minute') ||
      changed.has('second') ||
      changed.has('format')
    ) {
      this.updateHand();
    }
  }

  private updateHand(): void {
    const hand = this.renderRoot.querySelector<HTMLElement>('.handle');
    if (!hand) return;
    let angle: number | null = null;
    let active = false;
    let inner = false;
    if (this.view === 'hour' && this.hour != null) {
      angle = (this.hour % 12) * 30;
      active = true;
      inner = this.format === '24' && (this.hour < 1 || this.hour > 12);
    } else if (this.view === 'minute' && this.minute != null) {
      angle = this.minute * 6;
      active = this.minute % 5 === 0;
    } else if (this.view === 'second' && this.second != null) {
      angle = this.second * 6;
      active = this.second % 5 === 0;
    }
    hand.classList.toggle('active', active);
    hand.classList.toggle('inner', inner);
    if (angle != null) hand.style.setProperty('--_hand-angle', String(angle));
    else hand.style.removeProperty('--_hand-angle');
  }

  private blocked(hour: number, minute: number, second: number): boolean {
    return isTimeBlocked(hour, minute, second, this.minParts, this.maxParts, this.blackoutTimes);
  }

  private isDisabled(kind: DialKind, value: number): boolean {
    const m = this.minute ?? 0;
    const s = this.second ?? 0;
    if (kind === 'hour') return this.blocked(value, m, s);
    if (this.hour == null) return false;
    if (kind === 'minute') return this.blocked(this.hour, value, s);
    if (this.minute == null) return false;
    return this.blocked(this.hour, this.minute, value);
  }

  private emitPart(kind: DialKind, value: number): void {
    const snapped =
      kind === 'minute'
        ? snapToStep(value, this.minuteStep)
        : kind === 'second'
          ? snapToStep(value, this.secondStep)
          : value;
    if (this.isDisabled(kind, snapped)) return;
    if (kind === 'hour' && this.hour !== snapped) {
      this.hour = snapped;
      this.emit('k3-change', { hour: snapped });
    } else if (kind === 'minute' && this.minute !== snapped) {
      this.minute = snapped;
      this.emit('k3-change', { minute: snapped });
    } else if (kind === 'second' && this.second !== snapped) {
      this.second = snapped;
      this.emit('k3-change', { second: snapped });
    }
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.pointerType === 'mouse' && e.button > 0) return;
    const base = e.currentTarget as HTMLElement;
    base.setPointerCapture(e.pointerId);
    this.dragging = true;
    this.dragRect = base.getBoundingClientRect();
    this.applyPointer(e);
  }

  private onPointerMove(e: PointerEvent): void {
    const base = e.currentTarget as HTMLElement;
    if (!base.hasPointerCapture(e.pointerId) || !this.dragRect) return;
    this.applyPointer(e);
  }

  private onPointerUp(e: PointerEvent): void {
    const base = e.currentTarget as HTMLElement;
    if (base.hasPointerCapture(e.pointerId)) base.releasePointerCapture(e.pointerId);
    this.dragging = false;
    this.dragRect = null;
  }

  private applyPointer(e: PointerEvent): void {
    if (!this.dragRect) return;
    const angle = angleFromPointer(e.clientX, e.clientY, this.dragRect);
    const cx = this.dragRect.left + this.dragRect.width / 2;
    const cy = this.dragRect.top + this.dragRect.height / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    const inner = this.format === '24' && this.view === 'hour' && dist < this.dragRect.width * 0.28;

    if (this.view === 'hour') {
      let h = hourFromAngle(angle, inner, this.format);
      if (this.format === '12') {
        h = hour24FromDisplay(h === 0 ? 12 : h, this.period, '12');
      }
      this.emitPart('hour', h);
    } else if (this.view === 'minute') {
      this.emitPart(
        'minute',
        minuteFromAngle(angle, this.minute == null || this.minuteStep > 1),
      );
    } else {
      this.emitPart(
        'second',
        minuteFromAngle(angle, this.second == null || this.secondStep > 1),
      );
    }
  }

  private enabledValues(): number[] {
    if (this.view === 'hour') {
      if (this.format === '12') {
        return Array.from({ length: 12 }, (_, i) => {
          const h = hour24FromDisplay(i + 1, this.period, '12');
          return this.isDisabled('hour', h) ? -1 : h;
        }).filter((h) => h >= 0);
      }
      return Array.from({ length: 24 }, (_, h) => h).filter((h) => !this.isDisabled('hour', h));
    }
    if (this.view === 'minute') {
      return steppedRange(this.minuteStep, (m) => !this.isDisabled('minute', m));
    }
    return steppedRange(this.secondStep, (s) => !this.isDisabled('second', s));
  }

  private currentValue(): number | null {
    if (this.view === 'hour') return this.hour;
    if (this.view === 'minute') return this.minute;
    return this.second;
  }

  private onListKeydown = (e: KeyboardEvent): void => {
    const values = this.enabledValues();
    if (!values.length) return;
    const cur = this.currentValue();
    let idx = cur == null ? -1 : values.indexOf(cur);
    if (idx < 0) idx = 0;

    let next = idx;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (idx + 1) % values.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (idx - 1 + values.length) % values.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = values.length - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (cur != null) this.emitPart(this.view, cur);
        return;
      default:
        return;
    }
    e.preventDefault();
    this.emitPart(this.view, values[next]!);
  };

  private optionName(value: number, kind: DialKind): string {
    if (kind === 'hour') {
      if (this.format === '12') {
        const d = value % 12 === 0 ? 12 : value % 12;
        return i18n.t('timepicker.hourOption').replace('{n}', String(d));
      }
      return i18n.t('timepicker.hourOption24').replace('{n}', pad2(value));
    }
    const key = kind === 'minute' ? 'timepicker.minuteOption' : 'timepicker.secondOption';
    return i18n.t(key).replace('{n}', String(value));
  }

  private renderNumeral(opts: {
    label: string;
    angle: number;
    value: number;
    kind: DialKind;
    active: boolean;
    disabled: boolean;
    inner?: boolean;
  }): TemplateResult {
    return html`<div
      class=${classMap({
        numeral: true,
        inner: !!opts.inner,
        active: opts.active,
        disabled: opts.disabled,
      })}
      style=${styleMap({ '--_numeral-angle': `${opts.angle}deg` })}
      role="option"
      aria-selected=${opts.active ? 'true' : 'false'}
      aria-disabled=${opts.disabled ? 'true' : 'false'}
      aria-label=${opts.disabled ? nothing : this.optionName(opts.value, opts.kind)}
      data-value=${opts.value}
    >
      ${opts.label}
    </div>`;
  }

  private renderHourFace(): TemplateResult {
    const use24 = this.format === '24';
    const outer = Array.from({ length: 12 }, (_, i) => {
      const hour24 = use24
        ? i === 0
          ? 12
          : i
        : hour24FromDisplay(i === 0 ? 12 : i, this.period, '12');
      const active =
        this.hour != null &&
        (use24
          ? this.hour > 0 && this.hour <= 12 && this.hour % 12 === i
          : this.hour % 12 === i);
      return this.renderNumeral({
        label: i === 0 ? '12' : String(i),
        angle: i * 30,
        value: hour24,
        kind: 'hour',
        active,
        disabled: this.isDisabled('hour', hour24),
      });
    });
    const inner = !use24
      ? nothing
      : Array.from({ length: 12 }, (_, i) => {
          const hour = i === 0 ? 0 : i + 12;
          return this.renderNumeral({
            label: hour === 0 ? '00' : String(hour),
            angle: i * 30,
            value: hour,
            kind: 'hour',
            active: this.hour === hour,
            disabled: this.isDisabled('hour', hour),
            inner: true,
          });
        });
    return html`<div
      class=${classMap({ dial: true, hour: true, hidden: this.view !== 'hour' })}
      aria-hidden=${this.view !== 'hour' ? 'true' : 'false'}
    >
      ${outer}${inner}
    </div>`;
  }

  private renderStepFace(kind: 'minute' | 'second'): TemplateResult {
    const step = Math.max(1, kind === 'minute' ? this.minuteStep : this.secondStep);
    const labelStep = step <= 5 ? 5 : step;
    const current = kind === 'minute' ? this.minute : this.second;
    const hidden = this.view !== kind;
    return html`<div
      class=${classMap({ dial: true, [kind]: true, hidden })}
      aria-hidden=${hidden ? 'true' : 'false'}
    >
      ${Array.from({ length: Math.floor(60 / labelStep) }, (_, i) => {
        const v = i * labelStep;
        return this.renderNumeral({
          label: pad2(v),
          angle: v * 6,
          value: v,
          kind,
          active: current === v,
          disabled: this.isDisabled(kind, v),
        });
      })}
    </div>`;
  }

  override render() {
    const hasValue =
      (this.view === 'hour' && this.hour != null) ||
      (this.view === 'minute' && this.minute != null) ||
      (this.view === 'second' && this.second != null);
    const labelKey =
      this.view === 'hour'
        ? 'timepicker.hour'
        : this.view === 'minute'
          ? 'timepicker.minute'
          : 'timepicker.second';
    return html`
      <div
        class=${classMap({ base: true, dragging: this.dragging, 'k3-focus-ring': true })}
        role="listbox"
        tabindex="0"
        aria-label=${i18n.t(labelKey)}
        @keydown=${this.onListKeydown}
        @pointerdown=${this.onPointerDown}
        @pointermove=${this.onPointerMove}
        @pointerup=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
      >
        ${hasValue ? html`<div class="handle" aria-hidden="true"></div>` : nothing}
        ${this.renderHourFace()}${this.renderStepFace('minute')}${this.showSeconds
          ? this.renderStepFace('second')
          : nothing}
        <div class="center" aria-hidden="true"></div>
      </div>
    `;
  }
}

export default K3TimePickerDial;

if (!customElements.get('k3-time-picker-dial')) {
  customElements.define('k3-time-picker-dial', K3TimePickerDial);
}
