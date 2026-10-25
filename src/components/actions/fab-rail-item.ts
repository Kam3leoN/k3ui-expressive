import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';

/**
 * Declarative action for `k3-fab-rail` (light-DOM data source).
 * Hidden when slotted — parent renders shadow actions from these props.
 */
export class K3FabRailItem extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        display: none;
      }
    `,
  ];

  /** Stable action id (falls back to native `id` attribute). */
  @property({ attribute: 'item-id' }) itemId = '';
  @property() label = '';
  @property() icon = 'edit';

  /** Resolved id for parent collection. */
  get actionId(): string {
    return this.itemId || this.id || this.label;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

export default K3FabRailItem;
