import { css } from 'lit';

/**
 * Field group — fieldset + legend (label cuts the top border).
 */
export const fieldGroupStyles = css`
  :host {
    display: block;
    width: 100%;
    max-width: 28rem;
  }

  fieldset {
    box-sizing: border-box;
    margin: 0;
    min-inline-size: 0;
    padding: var(--k3-sys-spacing-space300, 1.5rem) var(--k3-sys-spacing-space300, 1.5rem)
      var(--k3-sys-spacing-space200, 1rem);
    /* 2px — same stroke as outlined text-field */
    border: 2px solid var(--k3-sys-color-outline);
    border-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
    background: transparent;
    box-shadow: none;
  }

  legend {
    float: none;
    width: auto;
    margin: 0;
    padding-inline: var(--k3-sys-spacing-space100, 0.5rem);
    color: var(--k3-sys-color-on-surface);
    font-size: var(--k3-sys-typescale-title-small-size, 0.875rem);
    line-height: var(--k3-sys-typescale-title-small-line-height, 1.25rem);
    font-weight: var(--k3-sys-typescale-title-small-emphasized-weight, 700);
    letter-spacing: var(--k3-sys-typescale-title-small-tracking, 0.00625rem);
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: var(--k3-sys-spacing-space200, 1rem); /* 16 */
    min-width: 0;
    padding-block-start: var(--k3-sys-spacing-space100, 0.5rem);
  }

  /* Children stretch to group width */
  ::slotted(k3-field-row),
  ::slotted(k3-text-field),
  ::slotted(k3-textarea),
  ::slotted(k3-select),
  ::slotted(k3-pin-field),
  ::slotted(k3-checkbox) {
    max-width: none;
    width: 100%;
  }

  .supporting {
    margin-block-start: var(--k3-sys-spacing-space100, 0.5rem);
    padding-inline: var(--k3-sys-spacing-space100, 0.5rem);
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-body-small-size);
    line-height: var(--k3-sys-typescale-body-small-line-height);
  }
  .supporting.error {
    color: var(--k3-sys-color-error);
  }

  :host([data-error]) fieldset {
    border-color: var(--k3-sys-color-error);
  }
  :host([data-error]) legend {
    color: var(--k3-sys-color-error);
  }

  :host([disabled]) {
    opacity: 0.38;
    pointer-events: none;
  }
`;
