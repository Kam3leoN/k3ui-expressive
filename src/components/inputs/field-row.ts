import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';

/**
 * Horizontal form row — side label (+ optional supporting) + control.
 * Use inside `k3-field-group`; omit the control’s own `label`.
 */
export class K3FieldRow extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        display: grid;
        grid-template-columns: minmax(6.5rem, 9rem) minmax(0, 1fr);
        align-items: center;
        gap: var(--k3-sys-spacing-space200, 1rem); /* 16 — meta ↔ control */
        width: 100%;
      }

      :host([disabled]) {
        opacity: 0.38;
        pointer-events: none;
      }

      .meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end; /* flush against the control */
        gap: 0.125rem; /* 2 */
        text-align: end;
        min-width: 0;
      }

      :host(:dir(rtl)) .meta {
        align-items: flex-start;
        text-align: start;
      }

      .label {
        color: var(--k3-sys-color-on-surface);
        font-size: var(--k3-sys-typescale-body-medium-size);
        line-height: var(--k3-sys-typescale-body-medium-line-height);
        font-weight: var(--k3-sys-typescale-body-medium-emphasized-weight, 500);
      }

      .supporting {
        color: var(--k3-sys-color-on-surface-variant);
        font-size: var(--k3-sys-typescale-body-small-size);
        line-height: var(--k3-sys-typescale-body-small-line-height);
        font-weight: var(--k3-sys-typescale-body-small-weight, 400);
      }

      .control {
        min-width: 0;
      }

      ::slotted(k3-text-field),
      ::slotted(k3-textarea),
      ::slotted(k3-select),
      ::slotted(k3-pin-field) {
        display: block;
        width: 100%;
        max-width: none;
      }
    `,
  ];

  @property() label = '';
  /** Helper under the side label (e.g. “Ajoutez votre nom”). */
  @property({ attribute: 'supporting-text' }) supportingText = '';
  @property({ type: Boolean, reflect: true }) disabled = false;

  override render() {
    const hasMeta = !!(this.label || this.supportingText);
    return html`
      ${hasMeta
        ? html`<div class="meta" part="meta">
            ${this.label
              ? html`<span class="label" part="label" id="fr-label">${this.label}</span>`
              : nothing}
            ${this.supportingText
              ? html`<span class="supporting" part="supporting" id="fr-supporting"
                  >${this.supportingText}</span
                >`
              : nothing}
          </div>`
        : nothing}
      <div
        class="control"
        part="control"
        aria-labelledby=${ifDefined(this.label ? 'fr-label' : undefined)}
        aria-describedby=${ifDefined(this.supportingText ? 'fr-supporting' : undefined)}
      >
        <slot></slot>
      </div>
    `;
  }
}

export default K3FieldRow;
