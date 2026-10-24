import { html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { K3Element, runOpenClose } from '../../core/index.js';
import { hostReset } from '../_shared.js';

export class K3Autocomplete extends K3Element {
  static override styles = [hostReset, css`
    :host { display: block; position: relative; max-width: 20rem; }
    .panel {
      position: absolute; inset-inline: 0; top: calc(100% + 0.25rem); z-index: 30;
      background: var(--k3-sys-color-surface-container); border-radius: var(--k3-sys-shape-corner-medium);
      box-shadow: 0 4px 12px rgb(0 0 0 / 0.2); max-height: 14rem; overflow: auto;
      opacity: 0; pointer-events: none;
      transition: opacity var(--k3-sys-motion-duration-short4) var(--k3-sys-motion-easing-expressive-effects);
    }
    .panel.open { opacity: 1; pointer-events: auto; }
    button[data-value] { display: block; width: 100%; text-align: start; padding: 0.75rem 1rem; }
  `];
  @property() value = '';
  @property({ type: Array }) options: string[] = [];
  @state() private open = false;

  private filtered(): string[] {
    const q = this.value.trim().toLowerCase();
    return this.options.filter((o) => !q || o.toLowerCase().includes(q));
  }

  private async onInput(e: CustomEvent<{ value: string }>): Promise<void> {
    this.value = e.detail.value;
    this.emit('k3-input', { value: this.value });
    if (!this.open) await runOpenClose(this, 'open', async () => { this.open = true; }, { source: 'user' });
  }

  override render() {
    return html`
      <k3-text-field part="field" .value=${this.value} @k3-input=${(e: CustomEvent<{value:string}>) => this.onInput(e)}>
        <slot name="leading-icon" slot="leading-icon"></slot>
      </k3-text-field>
      <div class="panel ${this.open ? 'open' : ''}" part="menu" role="listbox">
        ${this.filtered().map((o) => html`<button type="button" data-value=${o} part="option"
          @click=${() => { this.value = o; this.emit('k3-change', { value: o }); void runOpenClose(this, 'close', async () => { this.open = false; }, { source: 'user' }); }}>${o}</button>`)}
        <slot></slot>
      </div>
    `;
  }
}
export default K3Autocomplete;
