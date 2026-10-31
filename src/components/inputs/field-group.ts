import { html, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { fieldGroupStyles } from './field-group.styles.js';

/**
 * Form group — fieldset shell with legend cut into the top border.
 *
 * Slot standard K3ui controls (text-field, select, textarea, pin…).
 * Side-label rows (`k3-field-row`) are deferred.
 *
 * @example
 * ```html
 * <k3-field-group label="Form Group">
 *   <k3-text-field variant="outlined" label="Form Field"></k3-text-field>
 *   <k3-select variant="outlined" label="Form Field" value="1">…</k3-select>
 * </k3-field-group>
 * ```
 */
export class K3FieldGroup extends K3Element {
  static override styles = [hostReset, fieldGroupStyles];

  /** Legend text (cuts the top border). */
  @property() label = '';
  @property({ attribute: 'supporting-text' }) supportingText = '';
  @property() error = '';
  @property({ type: Boolean, reflect: true }) disabled = false;

  private get supporting(): string {
    return this.error || this.supportingText;
  }

  private syncDisabled = (): void => {
    if (!this.disabled) return;
    for (const el of this.querySelectorAll(
      'k3-text-field, k3-textarea, k3-select, k3-pin-field, k3-checkbox, k3-switch, k3-field-row',
    )) {
      (el as HTMLElement & { disabled?: boolean }).disabled = true;
    }
  };

  override firstUpdated(): void {
    this.syncDisabled();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.toggleAttribute('data-error', !!this.error);
    if (changed.has('disabled')) this.syncDisabled();
  }

  override render() {
    return html`
      <fieldset part="fieldset" ?disabled=${this.disabled}>
        ${this.label
          ? html`<legend part="legend">${this.label}</legend>`
          : nothing}
        <div class="body" part="body">
          <slot @slotchange=${this.syncDisabled}></slot>
        </div>
        ${this.supporting
          ? html`<div
              class="supporting ${this.error ? 'error' : ''}"
              part="supporting"
              role=${ifDefined(this.error ? 'alert' : undefined)}
            >
              ${this.supporting}
            </div>`
          : nothing}
      </fieldset>
    `;
  }
}

export default K3FieldGroup;

if (!customElements.get('k3-field-group')) {
  customElements.define('k3-field-group', K3FieldGroup);
}
