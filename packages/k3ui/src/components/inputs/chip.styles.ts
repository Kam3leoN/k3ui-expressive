import { css } from 'lit';

/**
 * M3 / M3E chips — assist · filter · input · suggestion (+ status tones).
 *
 * @see https://m3.material.io/components/chips/specs
 */
export const chipStyles = css`
  :host {
    display: inline-flex;
    flex-shrink: 0;
    width: max-content;
    max-width: 100%;
    vertical-align: middle;
  }

  .chip {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    box-sizing: border-box;
    width: max-content;
    max-width: 100%;
    height: 2rem; /* 32 */
    min-height: 2rem;
    margin: 0;
    border: none;
    padding-block: 0;
    padding-inline-start: 1rem; /* 16 */
    padding-inline-end: 1rem;
    gap: 0.5rem; /* 8 */
    user-select: none;
    -webkit-user-select: none;
    appearance: none;
    -webkit-appearance: none;
    font-family: var(--k3-ref-typeface-plain, inherit);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    letter-spacing: var(--k3-sys-typescale-label-large-tracking, 0.00625rem);
    text-align: start;
    color: var(--k3-sys-color-on-surface-variant);
    border-radius: var(--k3-sys-shape-corner-small); /* 8 */
    background: var(--k3-sys-color-surface-container-low);
    box-shadow: inset 0 0 0 1px var(--k3-sys-color-outline-variant);
    cursor: pointer;
    transition:
      border-radius var(--k3-sys-motion-duration-spatial-fast) var(--k3-sys-motion-easing-expressive-spatial),
      background var(--k3-sys-motion-duration-short4) var(--k3-sys-motion-easing-expressive-effects),
      box-shadow var(--k3-sys-motion-duration-short4) var(--k3-sys-motion-easing-expressive-effects),
      opacity var(--k3-sys-motion-duration-short4) var(--k3-sys-motion-easing-expressive-effects);
  }

  .chip:focus {
    outline: none;
  }

  .chip:focus-visible {
    outline: 2px solid var(--k3-sys-color-secondary);
    outline-offset: 2px;
  }

  /* Elevated — assist / filter / suggestion (not input) · level 1 · no outline */
  :host([elevated]:not([variant='input']):not([status])) .chip {
    background: var(--k3-sys-color-surface-container-low);
    box-shadow: var(--k3-sys-elevation-level1);
  }

  :host([elevated][selected]:not([variant='input'])) .chip {
    background: var(--k3-sys-color-secondary-container);
    box-shadow: var(--k3-sys-elevation-level1);
  }

  /* Drop-slot chrome → dropSlotStyles ([part=container]); keep chip radius here */
  :host([drag-handle]) {
    touch-action: none;
  }
  :host([drag-handle]) .chip {
    cursor: grab;
    touch-action: none;
  }

  :host([drag-handle][dragged]) .chip,
  :host([data-k3-dnd-slot]) .chip {
    cursor: grabbing;
  }

  .drag-handle {
    color: var(--k3-sys-color-on-surface-variant);
    opacity: 0.72;
    cursor: inherit;
  }

  :host([has-icon]):not([has-avatar]) .chip,
  :host([drag-handle]):not([has-avatar]) .chip {
    padding-inline-start: 0.5rem; /* 8 */
  }

  :host([removable]):not([has-avatar]):not([has-icon]) .chip,
  :host([variant='input']):not([has-avatar]):not([has-icon]) .chip {
    padding-inline-start: 1rem; /* 16 */
  }

  :host([has-avatar]) .chip {
    padding-inline-start: 0.25rem; /* 4 */
  }

  :host([has-trailing]) .chip,
  :host([removable]) .chip,
  :host([variant='input']) .chip {
    padding-inline-end: 0.5rem; /* 8 */
  }

  .icon {
    display: grid;
    flex: 0 0 auto;
    align-self: center;
    place-items: center;
    place-content: center;
    width: 1.125rem; /* 18 */
    height: 1.125rem;
    overflow: hidden;
    color: var(--k3-sys-color-primary);
    line-height: 0;
  }

  .drag-handle[data-k3-icon]::before,
  .icon[data-k3-icon]::before,
  .icon .ms[data-k3-icon]::before {
    content: attr(data-k3-icon);
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-feature-settings: 'liga';
    text-transform: none !important;
    speak: never;
  }

  .icon .ms,
  .icon ::slotted(.ms),
  .icon ::slotted([class*='ms']),
  .remove .ms,
  .trailing-btn .ms,
  .trailing-btn ::slotted(.ms),
  .drag-handle.ms {
    display: grid !important;
    place-items: center;
    place-content: center;
    box-sizing: border-box;
    width: 1.125rem !important;
    height: 1.125rem !important;
    margin: 0 !important;
    padding: 0 !important;
    font-family: 'Material Symbols Rounded', sans-serif !important;
    font-size: 1.125rem !important;
    font-weight: normal !important;
    font-style: normal;
    line-height: 1 !important;
    letter-spacing: normal !important;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20 !important;
    -webkit-font-smoothing: antialiased;
  }

  .icon .check {
    font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20 !important;
    transition: transform var(--k3-sys-motion-duration-spatial-fast)
      var(--k3-sys-motion-easing-expressive-spatial);
  }

  :host([selected]) .icon .check {
    transform: scale(1);
  }

  .avatar {
    display: grid;
    flex: 0 0 auto;
    align-self: center;
    place-items: center;
    place-content: center;
    width: 1.5rem; /* 24 */
    height: 1.5rem;
    border-radius: 0.75rem; /* 12 */
    overflow: hidden;
    line-height: 0;
  }

  .avatar ::slotted(img),
  .avatar ::slotted(k3-avatar),
  .avatar ::slotted(*) {
    display: block !important;
    width: 1.5rem !important;
    height: 1.5rem !important;
    max-width: 1.5rem !important;
    max-height: 1.5rem !important;
    margin: 0 !important;
    border-radius: 0.75rem !important;
    object-fit: cover;
  }

  .label {
    display: flex;
    flex: 0 1 auto;
    align-items: center;
    align-self: center;
    min-width: 0;
    max-width: 100%;
    height: 1.25rem;
    margin: 0;
    padding: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: start;
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
  }

  :host([selected]) .chip {
    color: var(--k3-sys-color-on-secondary-container);
    background: var(--k3-sys-color-secondary-container);
    box-shadow: none;
  }

  :host([elevated][selected]:not([variant='input'])) .chip {
    box-shadow: var(--k3-sys-elevation-level1);
  }

  :host([selected]) .icon,
  :host([selected]) .icon .ms,
  :host([selected]) .icon ::slotted(.ms) {
    color: var(--k3-sys-color-on-secondary-container);
  }

  /* Disabled — not interactive unless disabled-interactive (still focusable) */
  :host([disabled]) .chip {
    opacity: 0.38;
    pointer-events: none;
    cursor: default;
  }

  :host([disabled][disabled-interactive]) .chip {
    pointer-events: auto;
    cursor: default;
  }

  :host([disabled][disabled-interactive]) .chip:active::after {
    opacity: 0;
  }

  .remove,
  .trailing-btn {
    position: relative;
    display: grid;
    flex: 0 0 auto;
    align-self: center;
    place-items: center;
    place-content: center;
    width: 1.125rem;
    height: 1.125rem;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    border-radius: var(--k3-sys-shape-corner-full);
    color: var(--k3-sys-color-on-surface-variant);
    cursor: pointer;
    appearance: none;
  }

  .remove::before,
  .trailing-btn::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 3rem; /* 48 */
    height: 3rem;
    transform: translate(-50%, -50%);
  }

  .trailing-btn:focus-visible,
  .remove:focus-visible {
    outline: 2px solid var(--k3-sys-color-secondary);
    outline-offset: 1px;
  }

  /* ── Status pills ──────────────────────────────────────────────────────── */
  :host([status]) .chip {
    box-shadow: none;
    cursor: default;
    color: inherit;
  }

  :host([status='available']) .chip {
    background: var(--k3-sys-color-tertiary-container);
    color: var(--k3-sys-color-on-tertiary-container);
  }

  :host([status='unavailable']) .chip {
    background: var(--k3-sys-color-surface-container-highest);
    color: var(--k3-sys-color-on-surface-variant);
  }

  :host([status='success']) .chip {
    background: var(--k3-sys-color-success-container, #c4eed0);
    color: var(--k3-sys-color-on-success-container, #0d3818);
  }

  :host([status='error']) .chip {
    background: var(--k3-sys-color-error-container);
    color: var(--k3-sys-color-on-error-container);
  }

  :host([status='info']) .chip {
    background: var(--k3-sys-color-info-container, var(--k3-sys-color-primary-container));
    color: var(--k3-sys-color-on-info-container, var(--k3-sys-color-on-primary-container));
  }

  :host([status='note']) .chip {
    background: var(--k3-sys-color-note-container);
    color: var(--k3-sys-color-on-note-container);
  }

  :host([status='warning']) .chip {
    background: var(--k3-sys-color-warning-container, #fce3b0);
    color: var(--k3-sys-color-on-warning-container, #3f2e04);
  }
`;
