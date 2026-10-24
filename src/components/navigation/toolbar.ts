import { html, css } from 'lit';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';

export class K3Toolbar extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        display: inline-flex;
        max-width: 100%;
      }
      .bar {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        flex-wrap: wrap;
        min-height: 4rem;
        padding: 0.5rem 0.75rem;
        background: var(--k3-sys-color-surface-container);
        border-radius: var(--k3-sys-shape-corner-full);
        box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
      }
    `,
  ];
  override render() {
    return html`<div class="bar" part="container" role="toolbar"><slot></slot></div>`;
  }
}
export default K3Toolbar;
