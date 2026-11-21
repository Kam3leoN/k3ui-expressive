import { css } from 'lit';

/**
 * Status chip — tonal pill + overhanging icon circle.
 * Port of `status-chip.component.scss` (Matraic).
 *
 * Visual styles live on an inner `.chip` (not `:host`) so document resets like
 * `* { margin:0; padding:0 }` cannot zero the pill padding / margins.
 * Absolute icon: `inset ±half` from the padding edge → half overhangs, label at
 * `half + gap`. Logical props only → LTR / RTL safe.
 */
export const statusStyles = css`
  :host {
    display: inline-block;
    width: max-content;
    max-width: 100%;
    flex: 0 0 auto;
    vertical-align: middle;
    box-sizing: border-box;
    /* Tokens on host so --k3-status-* set via style= inherit into .chip */
    --k3-status-height: 1.75rem;
    --k3-status-icon-size: 2.25rem;
    --k3-status-radius: 0.5rem;
    --k3-status-gap: 0.625rem;
    --k3-status-padding: 0.75rem;
    --k3-status-font-family: inherit;
    --k3-status-font-size: 0.9375rem;
    --k3-status-font-weight: 700;

    --_success: var(--k3-status-success, #2fc77f);
    --_error: var(--k3-status-error, #ff6b85);
    --_warning: var(--k3-status-warning, #f5a524);
    --_info: var(--k3-status-info, #4c8dff);
    --_neutral: var(--k3-status-neutral, #8a94a6);
    --_text-tint: #000;
    --_text-shift: 6%;
    --_bg-amount: 12%;
    --_c: var(--k3-status-color, var(--_tone));
    --_half: calc(var(--k3-status-icon-size) / 2);
  }

  @media (prefers-color-scheme: dark) {
    :host {
      --_success: var(--k3-status-success-dark, #34d68a);
      --_error: var(--k3-status-error-dark, #ff7a91);
      --_warning: var(--k3-status-warning-dark, #ffb547);
      --_info: var(--k3-status-info-dark, #6aa1ff);
      --_neutral: var(--k3-status-neutral-dark, #9aa3b5);
      --_text-tint: #fff;
      --_text-shift: 28%;
      --_bg-amount: 16%;
    }
  }

  :host-context([data-k3-color-mode='dark']),
  :host-context([data-theme='dark']),
  :host-context(.dark) {
    --_success: var(--k3-status-success-dark, #34d68a);
    --_error: var(--k3-status-error-dark, #ff7a91);
    --_warning: var(--k3-status-warning-dark, #ffb547);
    --_info: var(--k3-status-info-dark, #6aa1ff);
    --_neutral: var(--k3-status-neutral-dark, #9aa3b5);
    --_text-tint: #fff;
    --_text-shift: 28%;
    --_bg-amount: 16%;
  }

  :host-context([data-k3-color-mode='light']),
  :host-context([data-theme='light']) {
    --_success: var(--k3-status-success, #2fc77f);
    --_error: var(--k3-status-error, #ff6b85);
    --_warning: var(--k3-status-warning, #f5a524);
    --_info: var(--k3-status-info, #4c8dff);
    --_neutral: var(--k3-status-neutral, #8a94a6);
    --_text-tint: #000;
    --_text-shift: 6%;
    --_bg-amount: 12%;
  }

  :host([data-variant='success']) {
    --_tone: var(--_success);
  }
  :host([data-variant='error']) {
    --_tone: var(--_error);
  }
  :host([data-variant='warning']) {
    --_tone: var(--_warning);
  }
  :host([data-variant='info']) {
    --_tone: var(--_info);
  }
  :host([data-variant='neutral']) {
    --_tone: var(--_neutral);
  }

  :host([disabled]) {
    opacity: 0.38;
    pointer-events: none;
    cursor: not-allowed;
  }

  .chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    min-height: var(--k3-status-height);
    padding-inline: var(--k3-status-padding);
    border-radius: var(--k3-status-radius);
    background: var(
      --k3-status-bg-color,
      color-mix(in srgb, var(--_c) var(--_bg-amount), transparent)
    );
    color: var(
      --k3-status-text-color,
      color-mix(in srgb, var(--_c), var(--_text-tint) var(--_text-shift))
    );
    font-family: var(--k3-status-font-family);
    font-size: var(--k3-status-font-size);
    font-weight: var(--k3-status-font-weight);
    font-variant-numeric: tabular-nums;
    line-height: 1;
    white-space: nowrap;
    transition:
      background-color var(--k3-sys-motion-duration-short2, 0.2s),
      color var(--k3-sys-motion-duration-short2, 0.2s);
  }

  :host([data-icon='leading']) .chip,
  :host([data-icon='trailing']) .chip {
    margin-block: calc((var(--k3-status-icon-size) - var(--k3-status-height)) / 2);
  }

  :host([data-icon='leading']) .chip {
    margin-inline-start: var(--_half);
    padding-inline-start: calc(var(--_half) + var(--k3-status-gap));
  }

  :host([data-icon='leading']) .icon {
    inset-inline-start: calc(var(--_half) * -1);
  }

  :host([data-icon='trailing']) .chip {
    margin-inline-end: var(--_half);
    padding-inline-end: calc(var(--_half) + var(--k3-status-gap));
  }

  :host([data-icon='trailing']) .icon {
    inset-inline-end: calc(var(--_half) * -1);
  }

  .icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: var(--k3-status-icon-size);
    height: var(--k3-status-icon-size);
    border-radius: 50%;
    background-color: var(--_c);
    background-image: linear-gradient(110deg, rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.1));
    color: var(--k3-status-icon-color, #fff);
    pointer-events: none;
  }

  .icon svg,
  .icon ::slotted(svg),
  .icon ::slotted([statusIcon]),
  .icon ::slotted([data-status-icon]) {
    width: 48%;
    height: 48%;
  }

  .icon svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 4.25;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .icon svg .dot {
    stroke-width: 5;
  }

  /* Material Symbols ligature — FILL for clear glyphs on the solid circle */
  .glyph {
    display: grid;
    place-items: center;
    width: 52%;
    height: 52%;
    font-family: var(--k3-sys-icon-font-family, 'Material Symbols Rounded', sans-serif);
    font-size: calc(var(--k3-status-icon-size) * 0.52);
    font-weight: 500;
    font-style: normal;
    line-height: 1;
    color: inherit;
    -webkit-font-smoothing: antialiased;
    font-feature-settings: 'liga';
    font-variation-settings:
      'FILL' 1,
      'wght' 500,
      'GRAD' 0,
      'opsz' 24;
  }

  .glyph[data-k3-icon]::before {
    content: attr(data-k3-icon);
    font-family: inherit;
    font-weight: inherit;
    font-style: inherit;
    font-size: inherit;
    line-height: inherit;
    letter-spacing: normal;
    text-transform: none !important;
    font-feature-settings: 'liga';
    font-variation-settings: inherit;
  }

  .icon ::slotted([data-k3-icon]),
  .icon ::slotted(.ms) {
    font-family: var(--k3-sys-icon-font-family, 'Material Symbols Rounded', sans-serif);
    font-size: calc(var(--k3-status-icon-size) * 0.52);
    color: inherit;
    font-feature-settings: 'liga';
    font-variation-settings:
      'FILL' 1,
      'wght' 500,
      'GRAD' 0,
      'opsz' 24;
  }

  .label {
    position: relative;
    z-index: 1;
    flex: none;
    overflow: visible;
  }

  @media (prefers-reduced-motion: reduce) {
    .chip {
      transition: none;
    }
  }

  :host-context([data-k3-reduce-motion]) .chip {
    transition: none;
  }
`;
