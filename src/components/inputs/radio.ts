import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import {
  K3Element,
  attachInternals,
  setFormValue,
  stateLayerStyles,
  selectionTargetStyles,
  haptic,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';

/**
 * Radio — outer 20dp / inner 12dp · stroke 2px (= checkbox).
 * 48×48 state target on the control (see `selectionTargetStyles`).
 * Selecting a new option fires `haptic.selection` (not when already checked).
 */
export class K3Radio extends K3Element {
  static formAssociated = true;
  static override styles = [
    hostReset,
    stateLayerStyles,
    selectionTargetStyles,
    css`
      .dot {
        --k3-radio-size: 1.25rem; /* 20dp */
        --k3-radio-inner: 0.75rem; /* 12dp */
        position: relative;
        box-sizing: border-box;
        width: var(--k3-radio-size);
        height: var(--k3-radio-size);
        border-radius: 50%;
        border: 2px solid var(--k3-sys-color-on-surface-variant);
        background: transparent;
        overflow: hidden;
      }
      .inner {
        position: absolute;
        inset: 0;
        width: var(--k3-radio-inner);
        height: var(--k3-radio-inner);
        margin: auto;
        box-sizing: border-box;
        border-radius: 50%;
        background: var(--k3-sys-color-primary);
        transform: scale(0);
        transform-origin: center center;
        transition: transform var(--k3-sys-motion-duration-spatial-fast)
          var(--k3-sys-motion-easing-expressive-spatial);
        will-change: transform;
      }
      :host([checked]) .dot {
        border-color: var(--k3-sys-color-primary);
      }
      :host([checked]) .inner {
        transform: scale(1);
      }
    `,
  ];

  internals = attachInternals(this);
  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property() name = '';
  @property() value = '';

  /** Scope exclusive group to fieldset / form — never the whole document. */
  private groupScope(): ParentNode {
    return (
      this.closest('fieldset') ??
      this.closest('form') ??
      (this.parentElement as ParentNode | null) ??
      (this.getRootNode() as unknown as ParentNode)
    );
  }

  private select = (): void => {
    if (this.disabled) return;
    const already = this.checked;
    if (this.name) {
      const scope = this.groupScope();
      scope.querySelectorAll(`k3-radio[name="${CSS.escape(this.name)}"]`).forEach((el) => {
        (el as K3Radio).checked = el === this;
      });
    } else {
      this.checked = true;
    }
    setFormValue(this.internals, this.checked ? this.value : null);
    if (!already) haptic.selection();
    this.emit('k3-change', { value: this.value, checked: true });
  };

  override render() {
    return html`<button
      type="button"
      part="container"
      role="radio"
      aria-checked=${String(this.checked)}
      ?disabled=${this.disabled}
      @click=${this.select}
    >
      <span class="target k3-state-layer" part="target">
        <span class="dot" part="control"
          ><span class="inner" part="inner" aria-hidden="true"></span
        ></span>
      </span>
      <span part="label"><slot></slot></span>
    </button>`;
  }
}
export default K3Radio;
