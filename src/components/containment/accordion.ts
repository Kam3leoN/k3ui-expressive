import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import K3ExpansionPanel from './expansion-panel.js';
import type { K3ExpansionPanel as K3ExpansionPanelType } from './expansion-panel.js';
import { accordionStyles } from './accordion.styles.js';

if (!customElements.get('k3-expansion-panel')) {
  customElements.define('k3-expansion-panel', K3ExpansionPanel);
}

/**
 * Groups `k3-expansion-panel` children — exclusive unless `multi`.
 */
export class K3Accordion extends K3Element {
  static override styles = [hostReset, accordionStyles];

  /** Allow more than one open panel. */
  @property({ type: Boolean, reflect: true }) multi = false;

  private panels(): K3ExpansionPanelType[] {
    return [...this.querySelectorAll(':scope > k3-expansion-panel')] as K3ExpansionPanelType[];
  }

  private onPanelToggle = (e: Event) => {
    const panel = e.target as K3ExpansionPanelType;
    if (!(panel instanceof K3ExpansionPanel) || panel.localName !== 'k3-expansion-panel') return;
    if (!panel.open || this.multi) return;
    this.panels().forEach((p) => {
      if (p !== panel && p.open) {
        p.open = false;
      }
    });
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('k3-toggle', this.onPanelToggle);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('k3-toggle', this.onPanelToggle);
    super.disconnectedCallback();
  }

  override render() {
    return html`<div part="accordion" class="accordion"><slot></slot></div>`;
  }
}

export default K3Accordion;

if (!customElements.get('k3-accordion')) {
  customElements.define('k3-accordion', K3Accordion);
}