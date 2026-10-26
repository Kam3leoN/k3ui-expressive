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
 * M3 Checkbox — 18dp box · Material Symbols check / remove · M3E check-in.
 * 48×48 state target on the control (see `selectionTargetStyles`).
 * Toggle fires `haptic.selection` (Android selection / toggle pattern).
 *
 * @see https://m3.material.io/components/checkbox
 */
export class K3Checkbox extends K3Element {
  static formAssociated = true;
  static override styles = [
    hostReset,
    stateLayerStyles,
    selectionTargetStyles,
    css`
      .box {
        --k3-checkbox-size: 1.125rem; /* 18dp */
        position: relative;
        box-sizing: border-box;
        width: var(--k3-checkbox-size);
        height: var(--k3-checkbox-size);
        border-radius: 0.125rem; /* 2dp */
        background: transparent;
        box-shadow: inset 0 0 0 2px var(--k3-sys-color-on-surface-variant);
        color: var(--k3-sys-color-on-primary);
        transition:
          background var(--k3-sys-motion-duration-effects-fast, 150ms)
            var(--k3-sys-motion-easing-expressive-effects, ease-out),
          box-shadow var(--k3-sys-motion-duration-effects-fast, 150ms)
            var(--k3-sys-motion-easing-expressive-effects, ease-out);
      }
      :host([checked]) .box,
      :host([indeterminate]) .box {
        background: var(--k3-sys-color-primary);
        box-shadow: inset 0 0 0 2px var(--k3-sys-color-primary);
      }
      .icon {
        position: absolute;
        inset: 0;
        margin: auto;
        font-family: var(
          --k3-sys-icon-font-family,
          'Material Symbols Rounded',
          'Material Symbols Outlined',
          sans-serif
        );
        font-weight: 600;
        font-style: normal;
        font-size: var(--k3-checkbox-size);
        line-height: 1;
        width: 1em;
        height: 1em;
        display: grid;
        place-items: center;
        speak: never;
        user-select: none;
        pointer-events: none;
        color: var(--k3-sys-color-on-primary);
        font-variation-settings:
          'FILL' 1,
          'wght' 600,
          'GRAD' 0,
          'opsz' 20;
        opacity: 0;
        transform: scale(0.2);
        clip-path: inset(0 100% 0 0);
        transition:
          opacity var(--k3-sys-motion-duration-short2, 100ms) linear,
          transform var(--k3-sys-motion-duration-short2, 100ms) linear,
          clip-path var(--k3-sys-motion-duration-short2, 100ms) linear;
      }
      :host([checked]) .icon--check,
      :host([indeterminate]) .icon--indeterminate {
        opacity: 1;
        transform: scale(1);
        clip-path: inset(0 0 0 0);
        transition:
          opacity var(--k3-sys-motion-duration-effects-fast, 150ms)
            var(--k3-sys-motion-easing-expressive-effects, ease-out),
          transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
            var(--k3-sys-motion-easing-expressive-spatial, cubic-bezier(0.38, 1.21, 0.22, 1)),
          clip-path var(--k3-sys-motion-duration-spatial-fast, 350ms)
            var(--k3-sys-motion-easing-expressive-spatial, cubic-bezier(0.38, 1.21, 0.22, 1));
      }
    `,
  ];

  internals = attachInternals(this);
  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) indeterminate = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property() name = '';
  @property() value = 'on';

  private toggle = (): void => {
    if (this.disabled) return;
    this.indeterminate = false;
    this.checked = !this.checked;
    setFormValue(this.internals, this.checked ? this.value : null);
    haptic.selection();
    this.emit('k3-change', { checked: this.checked });
  };

  override connectedCallback(): void {
    super.connectedCallback();
    setFormValue(this.internals, this.checked ? this.value : null);
  }

  override render() {
    const ariaChecked = this.indeterminate ? 'mixed' : String(this.checked);
    return html`<button
      type="button"
      part="container"
      role="checkbox"
      aria-checked=${ariaChecked}
      ?disabled=${this.disabled}
      @click=${this.toggle}
    >
      <span class="target k3-state-layer" part="target">
        <span class="box" part="control">
          <span
            class="icon icon--check notranslate"
            part="icon"
            translate="no"
            lang="zxx"
            data-k3-icon="check"
            aria-hidden="true"
          ></span>
          <span
            class="icon icon--indeterminate notranslate"
            part="icon-indeterminate"
            translate="no"
            lang="zxx"
            data-k3-icon="remove"
            aria-hidden="true"
          ></span>
        </span>
      </span>
      <span part="label"><slot></slot></span>
    </button>`;
  }
}
export default K3Checkbox;
