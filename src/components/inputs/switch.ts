import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import {
  K3Element,
  attachInternals,
  setFormValue,
  stateLayerStyles,
  selectionThumbStateStyles,
  haptic,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';

/**
 * M3 Switch — track 52×32, handle 16 (off) / 24 (on).
 * 48×48 state layer centered on the thumb (see `selectionThumbStateStyles`).
 * RTL-safe via inset-inline + margin-inline (no translateX).
 *
 * Travel uses FastSpatial spring (same overshoot as menus) + `haptic.selection`
 * on toggle.
 */
export class K3Switch extends K3Element {
  static formAssociated = true;
  static override styles = [
    hostReset,
    stateLayerStyles,
    selectionThumbStateStyles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        /* Menu-matched FastSpatial spring — overshoot at end of travel */
        --k3-switch-travel: var(--k3-sys-motion-duration-spatial-fast)
          var(
            --k3-sys-motion-easing-spatial-fast,
            var(--k3-sys-motion-easing-expressive-spatial-fast)
          );
      }
      .track {
        position: relative;
        width: 3.25rem; /* 52 */
        height: 2rem; /* 32 */
        border-radius: var(--k3-sys-shape-corner-full);
        background: var(--k3-sys-color-surface-container-highest);
        border: 2px solid var(--k3-sys-color-outline);
        box-sizing: border-box;
        padding: 0;
        flex-shrink: 0;
        overflow: visible; /* allow thumb overshoot past resting inset */
        transition:
          background var(--k3-sys-motion-duration-short4)
            var(--k3-sys-motion-easing-expressive-effects),
          border-color var(--k3-sys-motion-duration-short4)
            var(--k3-sys-motion-easing-expressive-effects);
      }
      .track:focus-visible {
        outline: none;
      }
      .track.k3-state-layer::after {
        display: none;
      }
      .handle {
        position: absolute;
        top: 50%;
        inset-inline-start: 0.25rem;
        width: 1rem;
        height: 1rem;
        margin-top: -0.5rem;
        border-radius: var(--k3-sys-shape-corner-full);
        background: var(--k3-sys-color-outline);
        color: var(--k3-sys-color-on-surface);
        display: grid;
        place-items: center;
        overflow: visible;
        transition:
          inset-inline-start var(--k3-switch-travel),
          width var(--k3-switch-travel),
          height var(--k3-switch-travel),
          margin-top var(--k3-switch-travel),
          background var(--k3-sys-motion-duration-short4)
            var(--k3-sys-motion-easing-expressive-effects);
      }
      .track:active .handle {
        width: 1.75rem;
        height: 1.75rem;
        margin-top: -0.875rem;
      }
      :host([selected]) .track {
        background: var(--k3-sys-color-primary);
        border-color: var(--k3-sys-color-primary);
      }
      :host([selected]) .handle {
        width: 1.5rem;
        height: 1.5rem;
        margin-top: -0.75rem;
        inset-inline-start: calc(100% - 1.5rem - 0.25rem);
        background: var(--k3-sys-color-on-primary);
        color: var(--k3-sys-color-primary);
      }
      :host([selected]) .track:active .handle {
        width: 1.75rem;
        height: 1.75rem;
        margin-top: -0.875rem;
        inset-inline-start: calc(100% - 1.75rem - 0.125rem);
      }
      :host([disabled]) {
        opacity: 0.38;
        pointer-events: none;
      }
      [part='label'] {
        font-size: var(--k3-sys-typescale-body-large-size);
        color: var(--k3-sys-color-on-surface);
      }
      @media (forced-colors: active) {
        .track:focus-visible .handle::after {
          outline: 2px solid Highlight;
          outline-offset: 2px;
        }
      }
    `,
  ];

  internals = attachInternals(this);
  @property({ type: Boolean, reflect: true }) selected = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property() name = '';
  @property() value = 'on';

  private toggle = (): void => {
    if (this.disabled) return;
    this.selected = !this.selected;
    setFormValue(this.internals, this.selected ? this.value : null);
    /* Selection tick — on and off (same pattern as sheet / segmented). */
    haptic.selection();
    this.emit('k3-change', { selected: this.selected });
  };

  override render() {
    return html`<button
        type="button"
        class="track k3-state-layer"
        part="track"
        role="switch"
        aria-checked=${String(this.selected)}
        aria-labelledby="label"
        ?disabled=${this.disabled}
        @click=${this.toggle}
      >
        <span class="handle" part="handle"></span>
      </button>
      <span part="label" id="label"><slot></slot></span>`;
  }
}
export default K3Switch;
