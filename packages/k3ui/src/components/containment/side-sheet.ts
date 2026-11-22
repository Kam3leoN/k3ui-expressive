import { K3Sheet } from './sheet.js';

/** @deprecated Prefer `k3-sheet placement="side"`. */
export class K3SideSheet extends K3Sheet {
  override connectedCallback(): void {
    this.placement = 'side';
    super.connectedCallback();
  }
}
export default K3SideSheet;

if (!customElements.get('k3-side-sheet')) {
  customElements.define('k3-side-sheet', K3SideSheet);
}
