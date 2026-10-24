import { css } from 'lit';

/**
 * PIN / OTP field — one cell per character (filled · outlined · standard).
 */
export const pinFieldStyles = css`
  :host {
    display: block;
    width: fit-content;
    max-width: 100%;
    --k3-pin-cell: 3rem; /* 48 */
    --k3-pin-gap: 0.5rem; /* 8 */
    --k3-pin-radius: var(--k3-sys-shape-corner-extra-small, 0.25rem);
    --k3-pin-outline: var(--k3-sys-color-outline);
    --k3-pin-outline-width: 1px;
    --k3-pin-container: var(--k3-sys-color-surface-container-highest);
    --k3-pin-label: var(--k3-sys-color-on-surface-variant);
    --k3-pin-input: var(--k3-sys-color-on-surface);
    /* Custom role — M3 has no success token; override via --k3-sys-color-success */
    --k3-pin-success: var(--k3-sys-color-success, #146c2e);
  }

  :host-context([data-k3-color-mode='dark']) {
    --k3-pin-success: var(--k3-sys-color-success, #81c995);
  }

  :host([disabled]) {
    opacity: 0.38;
    pointer-events: none;
  }

  :host([data-focused]) {
    --k3-pin-outline: var(--k3-sys-color-primary);
    --k3-pin-outline-width: 2px;
    --k3-pin-label: var(--k3-sys-color-primary);
  }

  :host([data-error]) {
    --k3-pin-outline: var(--k3-sys-color-error);
    --k3-pin-outline-width: 2px;
    --k3-pin-label: var(--k3-sys-color-error);
  }

  :host([data-success]) {
    --k3-pin-outline: var(--k3-pin-success);
    --k3-pin-outline-width: 2px;
    --k3-pin-label: var(--k3-pin-success);
  }

  .static-label {
    display: block;
    margin-block-end: 0.125rem; /* 2 — align with standard text-field */
    color: var(--k3-pin-label);
    font-size: var(--k3-sys-typescale-body-medium-size);
    line-height: var(--k3-sys-typescale-body-medium-line-height);
    font-weight: var(--k3-sys-typescale-body-medium-emphasized-weight, 500);
    pointer-events: none;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--k3-pin-gap);
  }

  .sep {
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
    line-height: 1;
    user-select: none;
    padding-inline: 0.125rem;
  }

  .cell {
    box-sizing: border-box;
    width: var(--k3-pin-cell);
    height: var(--k3-pin-cell);
    margin: 0;
    padding: 0;
    border: none;
    border-radius: var(--k3-pin-radius);
    background: var(--k3-pin-container);
    color: var(--k3-pin-input);
    font: inherit;
    font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
    font-weight: var(--k3-sys-typescale-title-medium-weight, 500);
    line-height: 1;
    text-align: center;
    text-transform: uppercase;
    caret-color: var(--k3-sys-color-primary);
    outline: none;
    box-shadow: inset 0 calc(-1 * var(--k3-pin-outline-width)) 0 var(--k3-pin-outline);
    transition:
      box-shadow var(--k3-sys-motion-duration-short2, 100ms) linear,
      background var(--k3-sys-motion-duration-short2, 100ms) linear;
  }

  /* Outlined — stroke all around */
  :host([variant='outlined']) .cell {
    background: transparent;
    box-shadow: inset 0 0 0 var(--k3-pin-outline-width) var(--k3-pin-outline);
  }

  /* Standard — filled, no indicator bar; success / error via background */
  :host([variant='standard']) .cell {
    box-shadow: none;
  }
  :host([variant='standard'][data-error]) {
    --k3-pin-container: color-mix(
      in srgb,
      var(--k3-sys-color-error) 18%,
      var(--k3-sys-color-surface)
    );
  }
  :host([variant='standard'][data-success]) {
    --k3-pin-container: color-mix(
      in srgb,
      var(--k3-pin-success) 22%,
      var(--k3-sys-color-surface)
    );
  }
  :host([variant='standard'][data-error]) .cell,
  :host([variant='standard'][data-success]) .cell {
    background: var(--k3-pin-container);
  }

  .cell:focus {
    --k3-pin-outline: var(--k3-sys-color-primary);
    --k3-pin-outline-width: 2px;
  }

  :host([data-error]) .cell:focus {
    --k3-pin-outline: var(--k3-sys-color-error);
  }

  :host([data-success]) .cell:focus {
    --k3-pin-outline: var(--k3-pin-success);
  }

  .cell::placeholder {
    color: transparent;
  }

  .supporting {
    display: block;
    margin-block-start: 0.25rem; /* 4 */
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-body-small-size);
    line-height: var(--k3-sys-typescale-body-small-line-height);
  }
  :host([data-error]) .supporting {
    color: var(--k3-sys-color-error);
  }
  :host([data-success]) .supporting {
    color: var(--k3-pin-success);
  }
  .supporting:empty {
    display: none;
  }
`;
