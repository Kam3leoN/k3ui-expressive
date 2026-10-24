import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import type { K3ExpansionPanel } from './expansion-panel.js';
import { expansionGroupStyles } from './expansion-group.styles.js';

export type ExpansionMode = 'multiple' | 'exclusive';

/**
 * Groups expansion panels.
 * - `mode="multiple"` (default) — each panel toggles independently
 * - `mode="exclusive"` / `exclusive` — accordion: opening one collapses the others
 */
export class K3ExpansionGroup extends K3Element {
  static override styles = [hostReset, expansionGroupStyles];

  /** `multiple` = independent · `exclusive` = accordion */
  @property({ reflect: true }) mode: ExpansionMode = 'multiple';
  /** Alias for `mode="exclusive"` */
  @property({ type: Boolean, reflect: true }) exclusive = false;
  @property({ type: Boolean, reflect: true }) flush = false;

  private get isAccordion(): boolean {
    return this.exclusive || this.mode === 'exclusive';
  }

  private panels(): K3ExpansionPanel[] {
    return [...this.querySelectorAll<K3ExpansionPanel>(':scope > k3-expansion-panel')];
  }

  private onExpand = (e: Event): void => {
    if (!this.isAccordion) return;
    const panel = (e.composedPath() as EventTarget[]).find(
      (n): n is K3ExpansionPanel =>
        n instanceof HTMLElement && n.localName === 'k3-expansion-panel',
    );
    if (!panel || panel.parentElement !== this) return;
    for (const p of this.panels()) {
      if (p !== panel) void p.collapse('api');
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('k3-expand', this.onExpand as EventListener);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('k3-expand', this.onExpand as EventListener);
  }

  /** Collapse every panel */
  async collapseAll(): Promise<void> {
    await Promise.all(this.panels().map((p) => p.collapse('api')));
  }

  override render() {
    return html`<div class="container" part="container" role="group"><slot></slot></div>`;
  }
}
export default K3ExpansionGroup;