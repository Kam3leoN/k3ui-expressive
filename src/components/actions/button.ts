import { html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, focusRingStyles, emitLifecycle } from '../../core/index.js';
import { slotHasContent } from '../../core/slots.js';
import { hostReset } from '../_shared.js';
import K3Ripple from './ripple.js';

/* Ensure ripple is defined when button loads (lazy catalog) */
if (!customElements.get('k3-ripple')) {
  customElements.define('k3-ripple', K3Ripple);
}

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'elevated' | 'text';
/** M3 Expressive: xs=32 sm=40(default) md=56 lg=96 xl=136 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonShape = 'round' | 'square';

/**
 * Material 3 Expressive button.
 * Morph: round ↔ square (select) ↔ pressed — always soft corners (never 0°).
 * Round radius = height/2 so CSS can interpolate smoothly (no 9999px jump).
 */
export class K3Button extends K3Element {
  static override styles = [
    hostReset,
    focusRingStyles,
    css`
      :host {
        /* Small (default) — M3 Expressive */
        --k3-btn-height: 2.5rem; /* 40 */
        --k3-btn-pad-inline: 1rem; /* 16 */
        --k3-btn-gap: 0.5rem;
        --k3-btn-icon: 1.25rem; /* 20 */
        --k3-btn-font-size: var(--k3-sys-typescale-label-large-size);
        --k3-btn-font-weight: var(--k3-sys-typescale-label-large-weight);
        /* Pill = half height — interpolates cleanly with square/pressed */
        --k3-btn-radius-round: calc(var(--k3-btn-height) / 2);
        --k3-btn-radius-square: 0.75rem; /* 12 */
        --k3-btn-radius-pressed: 0.5rem; /* 8 — still rounded, never 0 */
        --k3-btn-radius: var(--k3-btn-radius-round);
        /* Alias for connected button-group outer corners */
        --k3-btn-corner: var(--k3-btn-radius);
        position: relative;
        z-index: 0;
        display: inline-flex;
        vertical-align: middle;
        max-width: 100%;
        box-sizing: border-box;
        /* Label is light-DOM — must set on :host (not only shadow button) */
        user-select: none;
        -webkit-user-select: none;
        cursor: pointer;
      }
      /* Focus ring above neighbors (connected 2dp / standard XS–S gaps < ring) */
      :host(:focus-within) {
        z-index: 4;
      }
      /* Group segment — host is the layout slot that press-morphs */
      :host([data-bg]) {
        min-width: 0;
        overflow: visible;
      }
      :host([data-connected]) {
        display: flex;
        flex: 1 1 0;
        width: auto;
      }
      :host([size='xs']) {
        --k3-btn-height: 2rem;
        --k3-btn-pad-inline: 0.75rem;
        --k3-btn-gap: 0.25rem;
        --k3-btn-icon: 1.25rem;
        --k3-btn-radius-square: 0.75rem;
        --k3-btn-radius-pressed: 0.5rem;
      }
      :host([size='md']) {
        --k3-btn-height: 3.5rem; /* 56 */
        --k3-btn-pad-inline: 1.5rem;
        --k3-btn-gap: 0.5rem;
        --k3-btn-icon: 1.5rem;
        --k3-btn-font-size: var(--k3-sys-typescale-title-medium-size);
        --k3-btn-font-weight: var(--k3-sys-typescale-title-medium-weight);
        --k3-btn-radius-square: 1rem; /* 16 */
        --k3-btn-radius-pressed: 0.75rem; /* 12 */
      }
      :host([size='lg']) {
        --k3-btn-height: 6rem; /* 96 */
        --k3-btn-pad-inline: 3rem;
        --k3-btn-gap: 0.75rem;
        --k3-btn-icon: 2rem;
        --k3-btn-font-size: var(--k3-sys-typescale-headline-small-size);
        --k3-btn-font-weight: var(--k3-sys-typescale-headline-medium-emphasized-weight);
        --k3-btn-radius-square: 1.75rem; /* 28 */
        --k3-btn-radius-pressed: 1rem; /* 16 */
      }
      :host([size='xl']) {
        --k3-btn-height: 8.5rem; /* 136 */
        --k3-btn-pad-inline: 4rem;
        --k3-btn-gap: 1rem;
        --k3-btn-icon: 2.5rem;
        --k3-btn-font-size: var(--k3-sys-typescale-headline-large-size);
        --k3-btn-font-weight: var(--k3-sys-typescale-headline-medium-emphasized-weight);
        --k3-btn-radius-square: 1.75rem;
        --k3-btn-radius-pressed: 1rem;
      }

      /* Resting shape from attribute */
      :host([shape='round']) {
        --k3-btn-radius: var(--k3-btn-radius-round);
      }
      :host([shape='square']) {
        --k3-btn-radius: var(--k3-btn-radius-square);
      }
      /* Toggle select: round↔square (soft), NOT pressed — disabled in connected groups */
      :host([shape='round'][selected]:not([data-connected])) {
        --k3-btn-radius: var(--k3-btn-radius-square);
      }
      :host([shape='square'][selected]:not([data-connected])) {
        --k3-btn-radius: var(--k3-btn-radius-round);
      }
      /*
       * Press radius morph — size (H/W) never changes.
       * Skip in groups (data-bg) — avoids flash with select shape morph.
       */
      :host([data-pressed]:not([data-bg])) {
        --k3-btn-radius: var(--k3-btn-radius-pressed);
      }

      :host([disabled]) {
        pointer-events: none;
        opacity: 0.38;
      }

      .container {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--k3-btn-gap);
        box-sizing: border-box;
        height: var(--k3-btn-height);
        min-height: var(--k3-btn-height);
        max-width: 100%;
        padding-inline: var(--k3-btn-pad-inline);
        /* Per-corner overrides for connected button groups (logical) */
        border-start-start-radius: var(--k3-btn-rss, var(--k3-btn-radius));
        border-start-end-radius: var(--k3-btn-rse, var(--k3-btn-radius));
        border-end-end-radius: var(--k3-btn-ree, var(--k3-btn-radius));
        border-end-start-radius: var(--k3-btn-res, var(--k3-btn-radius));
        font-size: var(--k3-btn-font-size);
        font-weight: var(--k3-btn-font-weight);
        letter-spacing: 0.00625rem;
        line-height: 1;
        white-space: nowrap;
        /* Ripple clips itself — content never scales with shell morph */
        overflow: visible;
        user-select: none;
        -webkit-user-select: none;
        /* Shape morph — M3E FastSpatial (scheme-aware aliases) */
        transition:
          border-radius var(--k3-sys-motion-duration-spatial-fast, 350ms)
            var(--k3-sys-motion-easing-spatial-fast, cubic-bezier(0.42, 1.67, 0.21, 0.9)),
          background-color var(--k3-sys-motion-duration-effects-default, 200ms)
            var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
          box-shadow var(--k3-sys-motion-duration-effects-default, 200ms)
            var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
          gap var(--k3-sys-motion-duration-spatial-fast, 350ms)
            var(--k3-sys-motion-easing-spatial-fast, cubic-bezier(0.42, 1.67, 0.21, 0.9));
      }
      /*
       * Standard group press — shell tracks host width; label/icon keep
       * intrinsic size (overflow into the gap, never reflow / shrink).
       */
      :host([data-bg]:not([data-connected])) .container {
        width: 100%;
        max-width: none;
      }
      :host([data-bg]:not([data-connected])) .container > .icon,
      :host([data-bg]:not([data-connected])) .container > .label,
      :host([data-bg]:not([data-connected])) .container > .trailing {
        flex-shrink: 0;
      }
      /* Paint fills the flex segment (hover / selected stay in-bounds) */
      :host([data-connected]) .container {
        display: flex;
        width: 100%;
        flex: 1 1 auto;
      }
      .container > k3-ripple {
        z-index: 0;
      }
      .container > .icon,
      .container > .label,
      .container > .trailing {
        position: relative;
        z-index: 1;
      }

      /*
       * labels=selected — smooth icon↔label (grid 0fr/1fr, not max-width 0→100%).
       * Gap collapses with the label so the morph isn’t snappy.
       */
      :host([data-hide-label]) .container {
        gap: 0;
      }
      .label.has {
        display: grid;
        grid-template-columns: 1fr;
        opacity: 1;
        /* Collapse path needs min-width:0; visible labels must not shrink under glyphs */
        min-width: max-content;
        transition:
          grid-template-columns var(--k3-sys-motion-duration-spatial-fast)
            var(--k3-sys-motion-easing-expressive-spatial),
          opacity var(--k3-sys-motion-duration-effects-fast)
            var(--k3-sys-motion-easing-expressive-effects);
      }
      .label-clip {
        overflow: visible;
        min-width: max-content;
      }
      /* labels=selected morph — clip only while collapsing icon↔label */
      :host([data-hide-label]) .label.has {
        grid-template-columns: 0fr;
        opacity: 0;
        pointer-events: none;
        min-width: 0;
      }
      :host([data-hide-label]) .label-clip {
        overflow: hidden;
        min-width: 0;
      }
      @media (prefers-reduced-motion: reduce) {
        .label.has {
          transition-duration: 0.01ms;
        }
        :host([data-hide-label]) .container {
          transition-duration: 0.01ms;
        }
      }

      .filled {
        background: var(--k3-sys-color-primary);
        color: var(--k3-sys-color-on-primary);
      }
      .tonal {
        background: var(--k3-sys-color-secondary-container);
        color: var(--k3-sys-color-on-secondary-container);
      }
      .outlined {
        background: transparent;
        color: var(--k3-sys-color-primary);
        box-shadow: inset 0 0 0 1px var(--k3-sys-color-outline-variant);
      }
      .elevated {
        background: var(--k3-sys-color-surface-container-low);
        color: var(--k3-sys-color-primary);
        box-shadow:
          0 1px 2px rgb(0 0 0 / 0.3),
          0 1px 3px 1px rgb(0 0 0 / 0.15);
      }
      .text {
        background: transparent;
        color: var(--k3-sys-color-primary);
      }
      :host([variant='text']) {
        --k3-btn-pad-inline: 0.75rem;
      }

      /*
       * ToggleButtonDefaults — groups have no color (data-bg = any group child).
       * Unchecked filled/tonal → secondary-container · outlined → outline
       * Checked → primary / on-primary
       * @see https://m3.material.io/components/button-groups/specs
       */
      :host([data-bg]:not([selected])) .filled,
      :host([data-bg]:not([selected])) .tonal {
        background: var(--k3-sys-color-secondary-container);
        color: var(--k3-sys-color-on-secondary-container);
        box-shadow: none;
      }
      :host([data-bg]:not([selected])) .outlined {
        background: transparent;
        color: var(--k3-sys-color-on-surface-variant);
        box-shadow: inset 0 0 0 1px var(--k3-sys-color-outline-variant);
      }
      :host([selected]) .filled,
      :host([selected]) .tonal,
      :host([selected]) .outlined,
      :host([selected]) .elevated,
      :host([data-connected][selected]) .container {
        background: var(--k3-sys-color-primary);
        color: var(--k3-sys-color-on-primary);
        box-shadow: none;
      }

      .label:not(.has) {
        display: none;
      }
      .label.has .label-clip {
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
      }

      .icon,
      .trailing {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: var(--k3-btn-icon);
        height: var(--k3-btn-icon);
        overflow: hidden;
      }
      .icon:not(.has),
      .trailing:not(.has) {
        display: none;
      }

      /* Slotted icons (Material Symbols, svg, img…) */
      ::slotted([slot='icon']),
      ::slotted([slot='trailing-icon']) {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        width: var(--k3-btn-icon);
        height: var(--k3-btn-icon);
        font-size: var(--k3-btn-icon);
        line-height: 1;
        font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
        font-weight: normal;
        font-style: normal;
        letter-spacing: normal;
        text-transform: none;
        white-space: nowrap;
        speak: never;
        font-variation-settings:
          'FILL' 0,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24;
        -webkit-font-smoothing: antialiased;
      }
      :host([selected]) ::slotted([slot='icon']),
      :host([selected]) ::slotted([slot='trailing-icon']) {
        font-variation-settings:
          'FILL' 1,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24;
      }
      ::slotted(svg[slot='icon']),
      ::slotted(svg[slot='trailing-icon']) {
        width: var(--k3-btn-icon);
        height: var(--k3-btn-icon);
        fill: currentColor;
      }
    `,
  ];

  @property({ reflect: true }) variant: ButtonVariant = 'filled';
  @property({ reflect: true }) size: ButtonSize = 'sm';
  @property({ reflect: true }) shape: ButtonShape = 'round';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) selected = false;
  /** Single-select button group — exposes `role=radio` + `aria-checked`. */
  @property({ type: Boolean, reflect: true, attribute: 'data-radio' }) radio = false;
  @property() type: 'button' | 'submit' | 'reset' = 'button';

  @state() private pressed = false;
  @state() private hasIcon = false;
  @state() private hasTrailing = false;
  @state() private hasLabel = false;

  override firstUpdated(): void {
    queueMicrotask(() => this.syncSlots());
  }

  private syncSlots(): void {
    const root = this.shadowRoot;
    if (!root) return;
    const icon = root.querySelector<HTMLSlotElement>('slot[name="icon"]');
    const trailing = root.querySelector<HTMLSlotElement>('slot[name="trailing-icon"]');
    const label = root.querySelector<HTMLSlotElement>('slot:not([name])');
    const nextIcon = !!icon && slotHasContent(icon);
    const nextTrailing = !!trailing && slotHasContent(trailing);
    const nextLabel = !!label && slotHasContent(label);
    if (
      nextIcon === this.hasIcon &&
      nextTrailing === this.hasTrailing &&
      nextLabel === this.hasLabel
    ) {
      return;
    }
    this.hasIcon = nextIcon;
    this.hasTrailing = nextTrailing;
    this.hasLabel = nextLabel;
  }

  private onSlotChange = (): void => {
    queueMicrotask(() => this.syncSlots());
  };

  private onPointerDown = (): void => {
    if (this.disabled) return;
    this.pressed = true;
    this.setAttribute('data-pressed', '');
    emitLifecycle(this, 'press-start', { source: 'user' });
  };

  private onPointerUp = (): void => {
    if (!this.pressed) return;
    this.pressed = false;
    this.removeAttribute('data-pressed');
    emitLifecycle(this, 'press-end', { source: 'user' });
  };

  private onClick = (e: Event): void => {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    this.emit('k3-click', { source: 'user' });
  };

  override render() {
    return html`
      <button
        part="container"
        class=${classMap({
          container: true,
          'k3-focus-ring': true,
          [this.variant]: true,
        })}
        ?disabled=${this.disabled}
        type=${this.type}
        role=${this.radio ? 'radio' : nothing}
        aria-checked=${this.radio ? (this.selected ? 'true' : 'false') : nothing}
        aria-pressed=${this.radio ? nothing : this.selected ? 'true' : 'false'}
        @pointerdown=${this.onPointerDown}
        @pointerup=${this.onPointerUp}
        @pointerleave=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
        @click=${this.onClick}
      >
        <k3-ripple ?disabled=${this.disabled}></k3-ripple>
        <span part="icon" class="icon ${this.hasIcon ? 'has' : ''}">
          <slot name="icon" @slotchange=${this.onSlotChange}></slot>
        </span>
        <span part="label" class="label ${this.hasLabel ? 'has' : ''}">
          <span class="label-clip">
            <slot @slotchange=${this.onSlotChange}></slot>
          </span>
        </span>
        <span part="trailing-icon" class="trailing ${this.hasTrailing ? 'has' : ''}">
          <slot name="trailing-icon" @slotchange=${this.onSlotChange}></slot>
        </span>
      </button>
    `;
  }
}

export default K3Button;

if (!customElements.get('k3-button')) {
  customElements.define('k3-button', K3Button);
}
