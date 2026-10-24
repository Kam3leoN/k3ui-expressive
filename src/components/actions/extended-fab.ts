import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, stateLayerStyles, emitLifecycle } from '../../core/index.js';
import { hostReset } from '../_shared.js';

/**
 * Extended FAB — icon + label (always expanded).
 * Separate from `k3-fab` (icon-only sizes).
 */
export class K3ExtendedFab extends K3Element {
  static override styles = [
    hostReset,
    stateLayerStyles,
    css`
      :host {
        --k3-efab-h: 3.5rem;
        --k3-efab-icon: 1.5rem;
        /* M3 squircle — same 16dp as k3-fab (not a pill / 50%) */
        --k3-efab-radius: 1rem;
        --k3-efab-radius-pressed: 0.75rem;
        display: inline-flex;
        vertical-align: middle;
        width: fit-content;
        max-width: 100%;
        user-select: none;
        -webkit-user-select: none;
        cursor: pointer;
        /* Shadow on host so overflow:hidden (label morph) never clips it */
        box-shadow: var(--k3-sys-elevation-level3);
        border-radius: var(--k3-efab-radius);
        overflow: hidden;
        transition:
          box-shadow var(--k3-sys-motion-duration-short4)
            var(--k3-sys-motion-easing-expressive-effects),
          border-radius var(--k3-sys-motion-duration-spatial-fast)
            var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1));
      }
      :host([size='small']) {
        --k3-efab-h: 2.5rem;
        --k3-efab-icon: 1.25rem;
        --k3-efab-radius: 0.75rem;
        --k3-efab-radius-pressed: 0.5rem;
      }
      :host([size='large']) {
        --k3-efab-h: 6rem;
        --k3-efab-icon: 2.25rem;
        --k3-efab-radius: 1.75rem;
        --k3-efab-radius-pressed: 1.25rem;
      }
      :host([disabled]) {
        opacity: 0.38;
        pointer-events: none;
      }
      :host([data-pressed]) {
        box-shadow: var(--k3-sys-elevation-level4);
        border-radius: var(--k3-efab-radius-pressed);
      }
      .fab {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem; /* 12 — icon↔label */
        box-sizing: border-box;
        /* Hug content (M3 fixed) — not fluid / full container */
        width: fit-content;
        min-width: var(--k3-efab-h);
        height: var(--k3-efab-h);
        padding-inline: 1rem 1.5rem; /* 16 / 24 */
        border-radius: inherit;
        background: var(--k3-sys-color-primary-container);
        color: var(--k3-sys-color-on-primary-container);
        font: inherit;
        border: 0;
        cursor: pointer;
        box-shadow: none;
        transition:
          width var(--k3-sys-motion-duration-spatial-fast, 350ms)
            var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1)),
          min-width var(--k3-sys-motion-duration-spatial-fast, 350ms)
            var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1)),
          padding var(--k3-sys-motion-duration-spatial-fast, 350ms)
            var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1)),
          gap var(--k3-sys-motion-duration-short4, 200ms)
            var(--k3-sys-motion-easing-expressive-effects),
          border-radius var(--k3-sys-motion-duration-spatial-fast)
            var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1));
      }
      /* Rail morph — square 56dp; radius stays M3 squircle (inherit host) */
      :host([data-rail-collapsed]) .fab {
        width: var(--k3-efab-h);
        min-width: var(--k3-efab-h);
        padding-inline: 0;
        gap: 0;
        justify-content: center;
      }
      :host([data-rail-collapsed]) .label {
        opacity: 0;
        max-width: 0;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      .fab.primary {
        background: var(--k3-sys-color-primary);
        color: var(--k3-sys-color-on-primary);
      }
      .fab.secondary {
        background: var(--k3-sys-color-secondary-container);
        color: var(--k3-sys-color-on-secondary-container);
      }
      .fab.tertiary {
        background: var(--k3-sys-color-tertiary-container);
        color: var(--k3-sys-color-on-tertiary-container);
      }
      .fab.surface {
        background: var(--k3-sys-color-surface-container-high);
        color: var(--k3-sys-color-primary);
      }
      :host([data-pressed]) .fab,
      .fab:active {
        border-radius: inherit;
      }
      .icon {
        display: grid;
        place-items: center;
        place-content: center;
        width: var(--k3-efab-icon);
        height: var(--k3-efab-icon);
        line-height: 0;
        overflow: hidden;
      }
      .label {
        font-size: var(--k3-sys-typescale-label-large-size);
        font-weight: 500;
        white-space: nowrap;
        line-height: 1;
        max-width: 12rem;
        overflow: hidden;
        transition:
          opacity var(--k3-sys-motion-duration-short4, 200ms)
            var(--k3-sys-motion-easing-expressive-effects),
          max-width var(--k3-sys-motion-duration-spatial-fast, 350ms)
            var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1));
      }
      ::slotted([slot='icon']) {
        display: grid !important;
        place-items: center !important;
        place-content: center !important;
        box-sizing: border-box !important;
        width: var(--k3-efab-icon) !important;
        height: var(--k3-efab-icon) !important;
        margin: 0 !important;
        padding: 0 !important;
        font-size: var(--k3-efab-icon) !important;
        line-height: 1 !important;
        text-align: center !important;
        font-family: 'Material Symbols Rounded', sans-serif !important;
      }
    `,
  ];

  @property({ reflect: true }) size: 'small' | 'medium' | 'large' = 'medium';
  @property({ reflect: true }) variant: 'primary' | 'surface' | 'secondary' | 'tertiary' =
    'primary';
  @property({ type: Boolean, reflect: true }) disabled = false;

  override render() {
    return html`
      <button
        part="container"
        type="button"
        class=${classMap({
          fab: true,
          'k3-state-layer': true,
          [this.variant]: true,
        })}
        ?disabled=${this.disabled}
        @pointerdown=${() => {
          if (this.disabled) return;
          this.setAttribute('data-pressed', '');
          emitLifecycle(this, 'press-start', { source: 'user' });
        }}
        @pointerup=${() => {
          this.removeAttribute('data-pressed');
          emitLifecycle(this, 'press-end', { source: 'user' });
        }}
        @pointerleave=${() => this.removeAttribute('data-pressed')}
        @click=${() => this.emit('k3-click')}
      >
        <span part="icon" class="icon"><slot name="icon"></slot></span>
        <span part="label" class="label"><slot></slot></span>
      </button>
    `;
  }
}
export default K3ExtendedFab;
