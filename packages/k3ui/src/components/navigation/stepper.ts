import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, emitLifecycle, isRtl } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import K3Step from './step.js';
import type { K3Step as K3StepType } from './step.js';
import { stepperStyles } from './stepper.styles.js';

if (!customElements.get('k3-step')) customElements.define('k3-step', K3Step);

export type StepperOrientation = 'horizontal' | 'vertical';

/**
 * Material-style stepper — linear or free navigation across `k3-step` children.
 *
 * ```html
 * <k3-stepper orientation="horizontal" linear selected-index="0" label="Checkout">
 *   <k3-step label="Cart" completed><p>Review items</p></k3-step>
 *   <k3-step label="Pay"><span slot="supporting">Required</span><p>Payment</p></k3-step>
 * </k3-stepper>
 * ```
 */
export class K3Stepper extends K3Element {
  static override styles = [hostReset, stepperStyles];

  @property({ reflect: true }) orientation: StepperOrientation = 'horizontal';
  @property({ type: Boolean, reflect: true }) linear = false;
  @property({ type: Number, attribute: 'selected-index' }) selectedIndex = 0;
  /** Accessible name for the step tab list. */
  @property() label = '';

  private steps(): K3StepType[] {
    return [
      ...this.querySelectorAll(':scope > k3-step'),
    ].filter((el): el is K3StepType => el instanceof K3Step && el.localName === 'k3-step');
  }

  private supportingText(step: K3StepType): string {
    const el = step.querySelector(':scope > [slot="supporting"]');
    return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  private syncActive(): void {
    const list = this.steps();
    list.forEach((step, i) => {
      step.active = i === this.selectedIndex;
    });
  }

  private canActivate(index: number): boolean {
    const list = this.steps();
    const step = list[index];
    if (!step || step.disabled) return false;
    if (!this.linear || index <= this.selectedIndex) return true;
    for (let i = 0; i < index; i++) {
      const prev = list[i]!;
      if (!prev.disabled && !prev.completed && !prev.optional) return false;
    }
    return true;
  }

  private select(index: number, source: 'user' | 'api' = 'user'): void {
    const list = this.steps();
    const count = list.length;
    if (!count) return;
    const next = Math.max(0, Math.min(index, count - 1));
    if (next === this.selectedIndex) return;
    if (!this.canActivate(next)) return;
    if (source === 'user' && !emitLifecycle(this, 'change-start', { source, index: next })) return;
    this.selectedIndex = next;
    this.syncActive();
    if (source === 'user') {
      emitLifecycle(this, 'change-end', { source, index: next });
    }
    this.emit('k3-change', { index: next });
  }

  /** Advance to the next step when allowed. */
  next(): void {
    this.select(this.selectedIndex + 1, 'api');
  }

  /** Move to the previous step. */
  previous(): void {
    this.select(this.selectedIndex - 1, 'api');
  }

  /** Return to the first step. */
  reset(): void {
    this.select(0, 'api');
  }

  private onTabKeydown(e: KeyboardEvent, i: number, count: number): void {
    const rtl = isRtl(this);
    let next = -1;
    if (this.orientation === 'vertical') {
      if (e.key === 'ArrowDown') next = i + 1;
      else if (e.key === 'ArrowUp') next = i - 1;
    } else {
      if (e.key === 'ArrowRight') next = rtl ? i - 1 : i + 1;
      else if (e.key === 'ArrowLeft') next = rtl ? i + 1 : i - 1;
    }
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = count - 1;
    else if (next < 0) return;
    e.preventDefault();
    next = (next + count) % count;
    const tabs = this.renderRoot.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs[next]?.focus();
    this.select(next);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncActive();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('selectedIndex')) this.syncActive();
  }

  override firstUpdated(): void {
    this.syncActive();
  }

  override render() {
    const list = this.steps();
    const count = list.length;

    return html`
      <div
        class=${classMap({ header: true, vertical: this.orientation === 'vertical' })}
        part="header"
        role="tablist"
        aria-orientation=${this.orientation}
        aria-label=${this.label || nothing}
      >
        ${list.map((step, i) => {
          const supporting = this.supportingText(step);
          const selected = i === this.selectedIndex;
          const disabled = step.disabled || !this.canActivate(i);
          return html`
            ${i > 0 && this.orientation === 'horizontal'
              ? html`<span class="connector" part="connector" aria-hidden="true"></span>`
              : nothing}
            <button
              type="button"
              class="step-btn"
              part="step"
              role="tab"
              aria-selected=${String(selected)}
              tabindex=${selected ? '0' : '-1'}
              ?disabled=${disabled}
              data-completed=${step.completed ? '' : nothing}
              data-error=${step.error ? '' : nothing}
              data-optional=${step.optional ? '' : nothing}
              @click=${() => this.select(i)}
              @keydown=${(e: KeyboardEvent) => this.onTabKeydown(e, i, count)}
            >
              <span class="indicator" part="indicator" aria-hidden="true">${i + 1}</span>
              <span class="text" part="text">
                <span class="label" part="label">${step.label || `Step ${i + 1}`}</span>
                ${supporting
                  ? html`<span class="supporting" part="supporting">${supporting}</span>`
                  : nothing}
              </span>
            </button>
          `;
        })}
      </div>
      <div class="bodies" part="bodies">
        <slot class="steps-slot" @slotchange=${this.syncActive}></slot>
      </div>
    `;
  }
}

export default K3Stepper;

if (!customElements.get('k3-stepper')) {
  customElements.define('k3-stepper', K3Stepper);
}