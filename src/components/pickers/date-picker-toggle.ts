import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element, resolveIdRef } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import type K3DatePicker from './date-picker.js';
import { syncTriggerAria, TOGGLE_HOST_SELECTOR } from './time-picker.utils.js';

/**
 * Invisible hit-target nested inside a clickable host.
 * Opens the `k3-date-picker` whose `id` matches `for`.
 *
 * For range, one or two fields share the same picker — `edge` is kept for
 * markup compatibility but ignored (Noph: both fields open the same dialog).
 */
export class K3DatePickerToggle extends K3Element {
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

  @property() for = '';
  /** @deprecated Ignored — range uses one shared modal (Noph). */
  @property({ reflect: true }) edge: '' | 'start' | 'end' = '';

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
    if (e.type === 'click' && e.target instanceof Element) {
      if (e.target.tagName.toLowerCase().startsWith('k3-')) return;
    }
    e.preventDefault?.();
    e.stopPropagation();
    void this.openPicker();
  };

  private async openPicker(): Promise<void> {
    if (!this.for) return;
    await customElements.whenDefined('k3-date-picker');
    const picker = resolveIdRef<K3DatePicker>(this, this.for);
    if (!picker || typeof picker.show !== 'function' || picker.disabled) return;
    await picker.show(this.hostEl ?? this.parentElement);
  }

  override render() {
    return html``;
  }
}

export default K3DatePickerToggle;

if (!customElements.get('k3-date-picker-toggle')) {
  customElements.define('k3-date-picker-toggle', K3DatePickerToggle);
}
