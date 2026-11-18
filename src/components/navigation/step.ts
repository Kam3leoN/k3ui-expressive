import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { stepStyles } from './step.styles.js';

/**
 * Single step body for `k3-stepper` — label and state live on the host;
 * default slot is the step panel shown when `active`.
 */
export class K3Step extends K3Element {
  static override styles = [hostReset, stepStyles];

  @property({ reflect: true }) label = '';
  @property({ type: Boolean, reflect: true }) optional = false;
  @property({ type: Boolean, reflect: true }) completed = false;
  @property({ type: Boolean, reflect: true }) error = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** Set by the parent stepper — do not set manually. */
  @property({ type: Boolean, reflect: true }) active = false;

  override render() {
    return html`
      <div
        class="panel"
        part="panel"
        role="tabpanel"
        aria-hidden=${this.active ? 'false' : 'true'}
        ?hidden=${!this.active}
      >
        <slot></slot>
      </div>
    `;
  }
}

export default K3Step;

if (!customElements.get('k3-step')) {
  customElements.define('k3-step', K3Step);
}