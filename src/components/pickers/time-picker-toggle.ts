import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element, resolveIdRef } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import type K3TimePicker from './time-picker.js';
import { TOGGLE_HOST_SELECTOR, syncTriggerAria } from './time-picker.utils.js';

/**
 * Invisible hit-target nested inside a clickable host (icon-button, button).
 * Opens the `k3-time-picker` whose `id` matches `for`.
 * Host aria (`expanded` / `controls` / `haspopup`) is owned by the picker.
 *
 * @example
 * ```html
 * <k3-icon-button label="Open time picker">
 *   <span class="ms" data-k3-icon="schedule"></span>
 *   <k3-time-picker-toggle for="tp"></k3-time-picker-toggle>
 * </k3-icon-button>
 * <k3-time-picker id="tp"></k3-time-picker>
 * ```
 */
export class K3TimePickerToggle extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        position: absolute;
        inset: 0;
        display: block;
        pointer-events: none;
      }
    `,
  ];

  /** Id of the `k3-time-picker` to open. */
  @property() for = '';

  private hostEl: HTMLElement | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.hostEl =
      (this.closest(TOGGLE_HOST_SELECTOR) as HTMLElement | null) ?? this.parentElement;
    if (this.hostEl) {
      syncTriggerAria(this.hostEl, { open: false });
      this.hostEl.addEventListener('k3-click', this.onHostActivate);
      this.hostEl.addEventListener('click', this.onHostActivate);
    }
  }

  disconnectedCallback(): void {
    this.hostEl?.removeEventListener('k3-click', this.onHostActivate);
    this.hostEl?.removeEventListener('click', this.onHostActivate);
    this.hostEl = null;
    super.disconnectedCallback();
  }

  private onHostActivate = (e: Event): void => {
    /* Avoid double-fire (k3-click then bubbled click) */
    if (e.type === 'click' && e.target instanceof Element) {
      if (e.target.tagName.toLowerCase().startsWith('k3-')) return;
    }
    e.preventDefault?.();
    e.stopPropagation();
    void this.openPicker();
  };

  private async openPicker(): Promise<void> {
    if (!this.for) return;
    await customElements.whenDefined('k3-time-picker');
    const picker = resolveIdRef<K3TimePicker>(this, this.for);
    if (!picker || typeof picker.show !== 'function' || picker.disabled) return;
    await picker.show(this.hostEl ?? this.parentElement);
  }

  override render() {
    return html``;
  }
}

export default K3TimePickerToggle;

if (!customElements.get('k3-time-picker-toggle')) {
  customElements.define('k3-time-picker-toggle', K3TimePickerToggle);
}
