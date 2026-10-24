import { K3Sheet } from './sheet.js';

/** @deprecated Prefer `k3-sheet placement="bottom"`. */
export class K3BottomSheet extends K3Sheet {
  override connectedCallback(): void {
    this.placement = 'bottom';
    super.connectedCallback();
  }
}
export default K3BottomSheet;
