import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';

/**
 * Footer bar (bottom app bar) — actions + optional FAB slot.
 * `sticky` pins to the bottom of the scrollport.
 */
export class K3FooterBar extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        display: block;
        z-index: 10;
      }
      :host([sticky]) {
        position: sticky;
        bottom: 0;
      }
      .bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-height: 5rem;
        padding: 0.75rem 1rem max(0.75rem, env(safe-area-inset-bottom));
        background: var(--k3-sys-color-surface-container);
        border-radius: var(--k3-sys-shape-corner-extra-large)
          var(--k3-sys-shape-corner-extra-large) 0 0;
        box-sizing: border-box;
      }
      :host([elevated]) .bar {
        box-shadow: 0 -1px 3px rgb(0 0 0 / 0.12);
      }
      :host([sticky]) .bar {
        background: color-mix(
          in srgb,
          var(--k3-sys-color-surface-container) 92%,
          transparent
        );
        backdrop-filter: blur(12px);
      }
      .actions {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        flex: 1;
        min-width: 0;
      }
      .fab {
        display: inline-flex;
        flex-shrink: 0;
      }
      .fab:not(.has) {
        display: none;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) elevated = false;
  /** Stick to bottom of nearest scrollport */
  @property({ type: Boolean, reflect: true }) sticky = false;

  override render() {
    return html`<footer class="bar" part="container">
      <div class="actions" part="actions">
        <slot name="actions"></slot><slot></slot>
      </div>
      <div class="fab ${this.hasSlot('fab') ? 'has' : ''}" part="fab">
        <slot name="fab"></slot>
      </div>
    </footer>`;
  }
}
export default K3FooterBar;

if (!customElements.get('k3-footer-bar')) {
  customElements.define('k3-footer-bar', K3FooterBar);
}
