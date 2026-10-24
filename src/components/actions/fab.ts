import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, stateLayerStyles, focusRingStyles, emitLifecycle } from '../../core/index.js';
import { hostReset } from '../_shared.js';

/**
 * FAB — M3 Expressive sizes: default 56 / medium 80 / large 96.
 * `small` (40) is deprecated and no longer recommended.
 */
export class K3Fab extends K3Element {
  static override styles = [
    hostReset,
    stateLayerStyles,
    focusRingStyles,
    css`
      :host {
        /* default FAB — 56 dp · corner 16 dp (M3 squircle, not a circle) */
        --k3-fab-size: 3.5rem;
        --k3-fab-icon: 1.5rem;
        --k3-fab-radius: 1rem; /* 16 */
        --k3-fab-radius-pressed: 0.75rem; /* 12 */
        display: inline-flex;
        vertical-align: middle;
        user-select: none;
        -webkit-user-select: none;
        cursor: pointer;
        /* Elevation on host — never clipped by child overflow */
        border-radius: var(--k3-fab-radius);
        box-shadow: var(--k3-sys-elevation-level3);
        transition:
          box-shadow var(--k3-sys-motion-duration-short4)
            var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
          /* No spatial overshoot — undershoot leaves a white crescent beside .fab */
          border-radius var(--k3-sys-motion-duration-short4, 200ms)
            var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
      }
      :host([data-pressed]) {
        border-radius: var(--k3-fab-radius-pressed);
        box-shadow: var(--k3-sys-elevation-level4);
      }
      :host([size='default']) {
        --k3-fab-size: 3.5rem;
        --k3-fab-icon: 1.5rem;
        --k3-fab-radius: 1rem;
        --k3-fab-radius-pressed: 0.75rem;
      }
      /* @deprecated M3e — prefer default / medium / large */
      :host([size='small']) {
        --k3-fab-size: 2.5rem;
        --k3-fab-icon: 1.25rem;
        --k3-fab-radius: 0.75rem; /* 12 */
        --k3-fab-radius-pressed: 0.5rem;
      }
      :host([size='medium']) {
        --k3-fab-size: 5rem;
        --k3-fab-icon: 1.75rem;
        --k3-fab-radius: 1.25rem; /* 20 */
        --k3-fab-radius-pressed: 1rem;
      }
      :host([size='large']) {
        --k3-fab-size: 6rem;
        --k3-fab-icon: 2.25rem;
        --k3-fab-radius: 1.75rem; /* 28 */
        --k3-fab-radius-pressed: 1.25rem;
      }
      :host([disabled]) {
        opacity: 0.38;
        pointer-events: none;
      }
      /* Soft → circle while menu open; spring via [data-spring] (open + close) */
      :host([round]) {
        --k3-fab-radius: 50%;
        border-radius: 50%;
      }
      :host([round][data-pressed]) {
        border-radius: 50%;
      }

      .fab {
        display: grid;
        place-items: center;
        place-content: center;
        box-sizing: border-box;
        width: var(--k3-fab-size);
        height: var(--k3-fab-size);
        padding: 0;
        margin: 0;
        border: 0;
        line-height: 0;
        border-radius: inherit;
        background: var(--k3-sys-color-primary-container);
        color: var(--k3-sys-color-on-primary-container);
        box-shadow: none;
        outline: none;
        /* Visible — overflow:hidden clipped the trigger glyph late during morph. */
        overflow: visible;
        /*
         * Size / radius: effects easing (no overshoot). Spatial on width/height
         * undershoots and flashes page chrome through soft→circle gaps.
         */
        transition:
          width var(--k3-sys-motion-duration-short4, 200ms)
            var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
          height var(--k3-sys-motion-duration-short4, 200ms)
            var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
          border-radius var(--k3-sys-motion-duration-short4, 200ms)
            var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
      }
      /* Soft pulse — uniform scale only (no squash). */
      :host([data-spring]) .fab {
        animation: k3-fab-round-spring var(--k3-sys-motion-duration-spatial-fast)
          var(--k3-sys-motion-easing-spatial-fast, var(--k3-sys-motion-easing-expressive-spatial))
          forwards;
      }
      :host([data-spring='close']) .fab {
        animation-duration: var(--k3-sys-motion-duration-short4, 200ms);
      }
      @keyframes k3-fab-round-spring {
        0% {
          transform: scale(1);
        }
        40% {
          transform: scale(1.06);
        }
        100% {
          transform: scale(1);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        :host([data-spring]) .fab {
          animation: none;
        }
      }
      /* Overridable via --k3-fab-bg / --k3-fab-fg (FAB menu sets solid role colors) */
      .fab.primary {
        background: var(--k3-fab-bg, var(--k3-sys-color-primary));
        color: var(--k3-fab-fg, var(--k3-sys-color-on-primary));
      }
      .fab.secondary {
        background: var(--k3-fab-bg, var(--k3-sys-color-secondary-container));
        color: var(--k3-fab-fg, var(--k3-sys-color-on-secondary-container));
      }
      .fab.tertiary {
        background: var(--k3-fab-bg, var(--k3-sys-color-tertiary-container));
        color: var(--k3-fab-fg, var(--k3-sys-color-on-tertiary-container));
      }
      .fab.surface {
        background: var(--k3-fab-bg, var(--k3-sys-color-surface-container-high));
        color: var(--k3-fab-fg, var(--k3-sys-color-primary));
      }

      /* @deprecated labeled FABs — prefer k3-extended-fab */
      .fab.extended {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        width: auto;
        min-width: var(--k3-fab-size);
        padding-inline: 1rem 1.25rem;
        line-height: 1;
        border-radius: 1rem; /* match M3 FAB squircle — not pill */
      }

      :host([data-pressed]) .fab,
      .fab:active {
        border-radius: inherit;
      }
      :host([data-pressed]) .fab.extended {
        border-radius: inherit;
      }

      .icon {
        display: grid;
        place-items: center;
        place-content: center;
        box-sizing: border-box;
        width: var(--k3-fab-icon);
        height: var(--k3-fab-icon);
        margin: 0;
        padding: 0;
        line-height: 0;
        overflow: hidden;
      }

      /* Slotted Material Symbol / svg — forced optical center */
      ::slotted([slot='icon']) {
        display: grid !important;
        place-items: center !important;
        place-content: center !important;
        box-sizing: border-box !important;
        width: var(--k3-fab-icon) !important;
        height: var(--k3-fab-icon) !important;
        margin: 0 !important;
        padding: 0 !important;
        font-size: var(--k3-fab-icon) !important;
        line-height: 1 !important;
        letter-spacing: normal !important;
        text-align: center !important;
        font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif !important;
        font-weight: normal !important;
        font-style: normal !important;
        font-variation-settings:
          'FILL' 0,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24;
        -webkit-font-smoothing: antialiased;
      }
      ::slotted(svg[slot='icon']) {
        width: var(--k3-fab-icon) !important;
        height: var(--k3-fab-icon) !important;
        fill: currentColor;
      }

      .label:not(.has) {
        display: none;
      }
      .label.has {
        font-size: var(--k3-sys-typescale-label-large-size);
        font-weight: var(--k3-sys-typescale-label-large-weight);
        line-height: 1;
      }
    `,
  ];

  /** M3e: `default` 56 · `medium` 80 · `large` 96 (`small` 40 deprecated). */
  @property({ reflect: true }) size: 'default' | 'small' | 'medium' | 'large' = 'default';
  @property({ reflect: true }) variant: 'primary' | 'surface' | 'secondary' | 'tertiary' =
    'primary';
  /** @deprecated Prefer `k3-extended-fab` for labeled FABs. */
  @property({ type: Boolean, reflect: true }) extended = false;
  /** Soft → circle spring morph (FAB menu open). */
  @property({ type: Boolean, reflect: true }) round = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  override render() {
    const name = this.ariaLabel || this.getAttribute('aria-label') || undefined;
    return html`
      <button
        part="container"
        class=${classMap({
          fab: true,
          'k3-state-layer': true,
          'k3-focus-ring': true,
          [this.variant]: true,
          extended: this.extended,
        })}
        ?disabled=${this.disabled}
        type="button"
        aria-label=${name ?? nothing}
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
        <span part="label" class="label ${this.extended ? 'has' : ''}"><slot></slot></span>
      </button>
    `;
  }
}

export default K3Fab;
