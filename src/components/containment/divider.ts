import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';

export class K3Divider extends K3Element {
  static override styles = [hostReset, css`
    :host { display: block; }
    hr { border: 0; border-block-start: 1px solid var(--k3-sys-color-outline-variant); margin: 0.5rem 0; }
    :host([inset]) hr { margin-inline-start: 1rem; }
    :host([vertical]) { display: inline-block; height: 100%; }
    :host([vertical]) hr { height: 100%; width: 0; border-inline-start: 1px solid var(--k3-sys-color-outline-variant); border-block-start: 0; margin: 0 0.5rem; }
  `];
  @property({ type: Boolean, reflect: true }) inset = false;
  @property({ type: Boolean, reflect: true }) vertical = false;
  override render() { return html`<hr part="line" />`; }
}
export default K3Divider;

if (!customElements.get('k3-divider')) {
  customElements.define('k3-divider', K3Divider);
}
