import { property } from 'lit/decorators.js';
import { K3TextField } from './text-field.js';

/**
 * M3 textarea — multiline `k3-text-field` (filled · outlined · standard).
 * Same API; `multiline` locked on.
 *
 * @see https://m3.material.io/components/text-fields/specs
 */
export class K3TextArea extends K3TextField {
  @property({ type: Boolean, reflect: true })
  override multiline = true;

  @property({ type: Number })
  override rows = 4;
}

export default K3TextArea;

if (!customElements.get('k3-textarea')) {
  customElements.define('k3-textarea', K3TextArea);
}
