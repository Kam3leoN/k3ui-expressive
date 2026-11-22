import { K3FooterBar } from './footer-bar.js';

/**
 * @deprecated M3E — prefer `k3-toolbar variant="docked"` for action strips,
 * or `k3-footer-bar` for sticky form footers. Bottom app bar is not recommended.
 */
export class K3BottomAppBar extends K3FooterBar {}
export default K3BottomAppBar;

if (!customElements.get('k3-bottom-app-bar')) {
  customElements.define('k3-bottom-app-bar', K3BottomAppBar);
}
