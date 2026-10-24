import { css } from 'lit';

/**
 * M3 / M3E time picker — docked popover or modal.
 * Horizontal orientation applies to dial layout only; keyboard is always vertical.
 * Field boxes: 96×80 everywhere (dial · keyboard · 12h · 24h · V/H).
 *
 * @see https://m3.material.io/components/time-pickers/specs
 * @see https://matraic.github.io/m3e/components/timepicker.html
 */
export const timePickerStyles = css`
  :host {
    --k3-tp-pad: 1.5rem; /* 24 */
    --k3-tp-dial-size: 16rem; /* 256 */
    --k3-tp-field-h: 5rem; /* 80 */
    --k3-tp-field-w: 6rem; /* 96 */
    --k3-tp-sep-w: 1.5rem; /* 24 */
    --k3-tp-period-w: 3.25rem; /* 52 */
    --k3-tp-label-gap: 0.25rem; /* 4 */
    --k3-tp-shape: var(--k3-sys-shape-corner-extra-large); /* 28 modal */
    --k3-tp-shape-docked: var(--k3-sys-shape-corner-large); /* 16 */

    box-sizing: border-box;
    flex-direction: column;
    /* !important — UA popover attr beats bare :host for padding/margin */
    margin: 0 !important;
    border: 0 !important;
    padding: var(--k3-tp-pad) !important;
    overflow: visible !important;
    color: var(--k3-sys-color-on-surface);
    box-shadow: var(--k3-sys-elevation-level3);
    display: none;
    opacity: 0;
    transform: scaleY(0.8);
    z-index: 200;
  }

  :host([hidden]) {
    display: none !important;
  }

  :host([open]),
  :host(:popover-open) {
    display: flex !important;
    opacity: 1;
    transform: scaleY(1);
    transition:
      opacity var(--k3-sys-motion-duration-short2, 100ms)
        var(--k3-sys-motion-easing-standard, ease),
      transform var(--k3-sys-motion-duration-short2, 100ms)
        var(--k3-sys-motion-easing-standard, ease),
      overlay var(--k3-sys-motion-duration-short2, 100ms)
        var(--k3-sys-motion-easing-standard, ease) allow-discrete,
      display var(--k3-sys-motion-duration-short2, 100ms)
        var(--k3-sys-motion-easing-standard, ease) allow-discrete;
  }

  @starting-style {
    :host([open]),
    :host(:popover-open) {
      opacity: 0;
      transform: scaleY(0.8);
    }
  }

  /* Docked — beat UA popover inset:0 / margin:auto */
  :host([open][data-resolved-variant='docked']),
  :host(:popover-open[data-resolved-variant='docked']) {
    position: fixed !important;
    inset: unset !important;
    margin: 0 !important;
    top: var(--k3-tp-top, 0) !important;
    left: var(--k3-tp-left, 0) !important;
    width: max-content;
    height: max-content;
    min-width: 22.75rem; /* 364 */
    max-width: calc(100vw - 1rem);
    max-height: calc(100vh - 1rem);
    background: var(--k3-sys-color-surface-container);
    border-radius: var(--k3-tp-shape-docked);
    transform-origin: top center;
  }

  :host([open][data-resolved-variant='docked'][data-flip='top']),
  :host(:popover-open[data-resolved-variant='docked'][data-flip='top']) {
    transform-origin: bottom center;
  }

  :host([open][data-resolved-variant='modal']),
  :host(:popover-open[data-resolved-variant='modal']) {
    position: fixed !important;
    inset: 0 !important;
    margin: auto !important;
    width: max-content;
    height: max-content;
    min-width: 22.75rem;
    max-width: calc(100vw - 2rem);
    max-height: calc(100vh - 2rem);
    background: var(--k3-sys-color-surface-container-high);
    border-radius: var(--k3-tp-shape);
    transform-origin: top center;
  }

  :host(:popover-open[data-resolved-variant='docked'])::backdrop {
    background: transparent;
  }
  :host(:popover-open[data-resolved-variant='modal'])::backdrop {
    background: color-mix(in srgb, var(--k3-sys-color-scrim, #000) 32%, transparent);
  }

  .scrim {
    display: none;
  }
  :host([open][data-resolved-variant='modal']:not(:popover-open)) .scrim {
    display: block;
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, var(--k3-sys-color-scrim, #000) 32%, transparent);
    z-index: -1;
  }

  .surface {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
  }

  .headline {
    margin: 0;
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    letter-spacing: var(--k3-sys-typescale-label-large-tracking, 0.00625rem);
    text-align: start;
  }

  .body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.25rem; /* 36 */
    margin-block-start: 1.25rem; /* 20 */
  }

  :host([data-resolved-orientation='horizontal'][data-mode='dial']) .body {
    flex-direction: row;
    align-items: center;
    gap: 1.5rem; /* 24 */
  }

  .fields-col {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    flex: 0 0 auto;
    min-width: 0;
  }

  .fields {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 0;
  }

  .field {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--k3-tp-label-gap);
    min-width: 0;
  }

  .field-btn,
  .field-input {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--k3-tp-field-w);
    height: var(--k3-tp-field-h);
    max-width: var(--k3-tp-field-w);
    flex: 0 0 auto;
    margin: 0;
    border: 0;
    border-radius: var(--k3-sys-shape-corner-small); /* 8 */
    background: var(--k3-sys-color-surface-container-highest);
    color: var(--k3-sys-color-on-surface);
    font-family: var(--k3-ref-typeface-brand, inherit);
    font-size: var(--k3-sys-typescale-display-medium-size, 2.8125rem); /* 45 */
    font-weight: var(--k3-sys-typescale-display-medium-weight, 400);
    line-height: var(--k3-sys-typescale-display-medium-line-height, 3.25rem); /* 52 */
    letter-spacing: var(--k3-sys-typescale-display-medium-tracking, 0);
    font-variant-numeric: tabular-nums;
    text-align: center;
    /* overflow visible — k3-focus-ring outward outline */
    cursor: pointer;
    transition: background-color var(--k3-sys-motion-duration-short4)
      var(--k3-sys-motion-easing-expressive-effects);
  }

  .field-input {
    cursor: text;
    appearance: none;
    -moz-appearance: textfield;
  }
  .field-input::placeholder {
    color: currentColor;
    opacity: 0.38;
  }
  .field-input::-webkit-outer-spin-button,
  .field-input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  .field-btn:hover,
  .field-input:hover {
    background: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface) 8%,
      var(--k3-sys-color-surface-container-highest)
    );
  }
  .field-btn[aria-checked='true'],
  .field-input:focus {
    background: var(--k3-sys-color-primary-container);
    color: var(--k3-sys-color-on-primary-container);
  }

  .field-label {
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-body-small-size, 0.75rem);
    font-weight: var(--k3-sys-typescale-body-small-weight, 400);
    line-height: var(--k3-sys-typescale-body-small-line-height, 1rem);
    letter-spacing: var(--k3-sys-typescale-body-small-tracking, 0.025rem);
    text-align: start;
  }

  .sep {
    box-sizing: border-box;
    width: var(--k3-tp-sep-w);
    height: var(--k3-tp-field-h);
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    font-size: var(--k3-sys-typescale-display-large-size, 3.5625rem); /* 57 */
    font-weight: var(--k3-sys-typescale-display-large-weight, 400);
    line-height: 1;
    color: var(--k3-sys-color-on-surface);
    user-select: none;
  }

  /* Period — 52×80 beside fields (dial vertical · keyboard) */
  .period {
    display: flex;
    flex-direction: column;
    width: var(--k3-tp-period-w);
    height: var(--k3-tp-field-h);
    border-radius: var(--k3-sys-shape-corner-small);
    border: 1px solid var(--k3-sys-color-outline);
    /* visible — period segment k3-focus-ring */
    overflow: visible;
    margin-inline-start: 0.75rem; /* 12 */
    flex: 0 0 auto;
  }
  .period button {
    flex: 1 1 50%;
    border: 0;
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
    font-weight: 500;
    line-height: 1;
    cursor: pointer;
  }
  /* Radius on segments — period keeps overflow:visible for k3-focus-ring */
  .period button:first-child {
    border-start-start-radius: var(--k3-sys-shape-corner-small);
    border-start-end-radius: var(--k3-sys-shape-corner-small);
  }
  .period button:last-child {
    border-end-start-radius: var(--k3-sys-shape-corner-small);
    border-end-end-radius: var(--k3-sys-shape-corner-small);
  }
  .period button + button {
    border-block-start: 1px solid var(--k3-sys-color-outline);
  }
  .period button[aria-checked='true'] {
    background: var(--k3-sys-color-tertiary-container);
    color: var(--k3-sys-color-on-tertiary-container);
  }

  /* Period under — dial horizontal only */
  :host([data-resolved-orientation='horizontal'][data-mode='dial']) .period {
    flex-direction: row;
    width: 100%;
    height: 2.375rem; /* 38 */
    margin-inline-start: 0;
    margin-block-start: 0.75rem; /* 12 */
  }
  :host([data-resolved-orientation='horizontal'][data-mode='dial']) .period button:first-child {
    border-start-end-radius: 0;
    border-end-start-radius: var(--k3-sys-shape-corner-small);
  }
  :host([data-resolved-orientation='horizontal'][data-mode='dial']) .period button:last-child {
    border-end-start-radius: 0;
    border-start-end-radius: var(--k3-sys-shape-corner-small);
  }
  :host([data-resolved-orientation='horizontal'][data-mode='dial']) .period button + button {
    border-block-start: 0;
    border-inline-start: 1px solid var(--k3-sys-color-outline);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.5rem; /* 8 */
    margin-block-start: 1.5rem; /* 24 */
    min-height: 2.5rem;
  }
  .spacer {
    flex: 1 1 auto;
  }

  .ms-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--k3-sys-color-on-surface-variant);
    cursor: pointer;
    speak: never;
  }
  .ms-btn .ms,
  .ms-btn [data-k3-icon] {
    font-family: inherit;
    font-size: inherit;
    line-height: 1;
  }
  .ms-btn:hover {
    background: color-mix(in srgb, var(--k3-sys-color-on-surface) 8%, transparent);
  }

  .fmt-btn {
    font-family: var(--k3-ref-typeface-plain, inherit);
  }
  .fmt-btn .fmt-label {
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    line-height: 1;
    letter-spacing: var(--k3-sys-typescale-label-large-tracking, 0.00625rem);
    font-variant-numeric: tabular-nums;
  }

  .dial-host {
    width: var(--k3-tp-dial-size);
    height: var(--k3-tp-dial-size);
    flex: 0 0 auto;
  }

  :host([data-mode='input']) .dial-host {
    display: none;
  }
  :host([data-mode='input']) .body {
    gap: 0;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: 0.38;
  }
`;
