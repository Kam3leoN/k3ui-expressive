import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { markMenuItemEdges } from './menu-edges.js';
import { menuGroupStyles } from './menu-group.styles.js';

/**
 * One elevated plate inside a gap stack (`divider="gap"` → auto groups).
 *
 * Authors can also write groups manually:
 * ```html
 * <k3-menu-group>
 *   <k3-menu-item>…</k3-menu-item>
 * </k3-menu-group>
 * ```
 *
 * Pad 4 · outer corner 16 · gap-facing radius via `--k3-menu-group-radius`.
 */
export class K3MenuGroup extends K3Element {
  static override styles = [hostReset, menuGroupStyles];

  /** Join items into one continuous shape (0 inter-item gap). */
  @property({ type: Boolean, reflect: true }) connected = false;

  override firstUpdated(): void {
    markMenuItemEdges(this);
    const slot = this.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    slot?.addEventListener('slotchange', () => markMenuItemEdges(this));
  }

  override render() {
    return html`<div class="inner" part="container" role="group"><slot></slot></div>`;
  }
}

export default K3MenuGroup;

if (!customElements.get('k3-menu-group')) {
  customElements.define('k3-menu-group', K3MenuGroup);
}
