import { css } from 'lit';

/**
 * Alert chrome — M3E Callout layout: leading accent bar + header + content.
 * @see https://matraic.github.io/m3e/#/components/callout.html
 */
export const alertStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    --k3-alert-leading-space: var(--k3-sys-spacing-space200);
    --k3-alert-trailing-space: var(--k3-sys-spacing-space200);
    --k3-alert-top-space: var(--k3-sys-spacing-space150);
    --k3-alert-bottom-space: var(--k3-sys-spacing-space150);
    --k3-alert-leading-accent-size: 4px;
    /* Vertical inset so the accent never fights the container corner radius */
    --k3-alert-accent-inset: var(--k3-sys-spacing-space150);
    --k3-alert-icon-label-space: var(--k3-sys-spacing-space100);
    --k3-alert-icon-size: 24px;
    --k3-alert-label-content-space: var(--k3-sys-spacing-space100);
    --k3-alert-rounded-shape: var(--k3-sys-shape-corner-large);
    --k3-alert-square-shape: var(--k3-sys-shape-corner-none, 0);
    /* Fallback tokens (overridden per variant) */
    --k3-alert-container: var(--k3-sys-color-secondary-container);
    --k3-alert-on-container: var(--k3-sys-color-on-secondary-container);
    --k3-alert-accent: var(--k3-sys-color-secondary);
    --k3-alert-icon: var(--k3-alert-on-container);
    --k3-alert-label: var(--k3-alert-on-container);
    --k3-alert-content: var(--k3-alert-on-container);
  }

  :host([hidden]) {
    display: none !important;
  }

  .base {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: clip;
    box-sizing: border-box;
    padding-inline-start: var(--k3-alert-leading-space);
    padding-inline-end: var(--k3-alert-trailing-space);
    padding-block-start: var(--k3-alert-top-space);
    padding-block-end: var(--k3-alert-bottom-space);
    background: var(--k3-alert-container);
    color: var(--k3-alert-content);
    border-radius: var(--k3-alert-rounded-shape);
  }

  :host([shape='square']) .base {
    border-radius: var(--k3-alert-square-shape);
  }

  /*
   * Leading accent — tabs active-indicator, rotated for a start-edge bar:
   * flush (0) on the outer edge, 3dp on the inner edge toward content.
   * Vertical inset so it never meets the container corner radius.
   * @see --k3-sys-shape-corner-indicator / tabs primary indicator
   */
  .base::before {
    content: '';
    position: absolute;
    inset-block: var(--k3-alert-accent-inset);
    inset-inline-start: 0;
    width: var(--k3-alert-leading-accent-size);
    border-start-start-radius: 0;
    border-end-start-radius: 0;
    border-start-end-radius: var(--k3-sys-shape-corner-indicator-top, 0.1875rem);
    border-end-end-radius: var(--k3-sys-shape-corner-indicator-top, 0.1875rem);
    background: var(--k3-alert-accent);
  }

  /* Square — flush full-bleed, no radius. */
  :host([shape='square']) .base::before {
    inset-block: 0;
    border-radius: 0;
  }

  .base--with-header {
    row-gap: var(--k3-alert-label-content-space);
  }

  .header {
    display: flex;
    align-items: center;
    column-gap: var(--k3-alert-icon-label-space);
    min-width: 0;
  }

  .header[hidden] {
    display: none;
  }

  .icon {
    flex: none;
    display: grid;
    place-items: center;
    width: var(--k3-alert-icon-size);
    height: var(--k3-alert-icon-size);
    color: var(--k3-alert-icon);
    font-family: var(
      --k3-sys-icon-font,
      'Material Symbols Rounded',
      'Material Symbols Outlined',
      sans-serif
    );
    font-size: var(--k3-alert-icon-size);
    font-weight: normal;
    font-style: normal;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    white-space: nowrap;
    font-feature-settings: 'liga';
    /* Filled glyphs — not outline */
    font-variation-settings:
      'FILL' 1,
      'wght' var(--k3-sys-icon-wght, 400),
      'GRAD' var(--k3-sys-icon-grad, 0),
      'opsz' var(--k3-sys-icon-opsz, 24);
  }

  .icon[hidden] {
    display: none;
  }

  .icon[data-k3-icon]::before {
    content: attr(data-k3-icon);
    font-family: inherit;
    font-size: inherit;
    font-variation-settings: inherit;
    font-feature-settings: 'liga';
    line-height: 1;
    speak: never;
  }

  .icon ::slotted(*) {
    font-size: var(--k3-alert-icon-size) !important;
    width: 1em;
    height: 1em;
    color: inherit;
  }

  .icon ::slotted(svg) {
    width: 1em;
    height: 1em;
    fill: currentColor;
  }

  .label {
    flex: 1 1 auto;
    min-width: 0;
    color: var(--k3-alert-label);
    font-family: var(--k3-ref-typeface-plain);
    font-size: var(--k3-sys-typescale-title-medium-size);
    font-weight: var(--k3-sys-typescale-title-medium-weight);
    line-height: var(--k3-sys-typescale-title-medium-line-height);
    letter-spacing: var(--k3-sys-typescale-title-medium-tracking);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .label[hidden] {
    display: none;
  }

  .body-row {
    display: flex;
    align-items: flex-start;
    gap: var(--k3-sys-spacing-space100);
    min-width: 0;
  }

  .content {
    flex: 1 1 auto;
    min-width: 0;
    color: var(--k3-alert-content);
    font-family: var(--k3-ref-typeface-plain);
    font-size: var(--k3-sys-typescale-body-large-size);
    font-weight: var(--k3-sys-typescale-body-large-weight);
    line-height: var(--k3-sys-typescale-body-large-line-height);
    letter-spacing: var(--k3-sys-typescale-body-large-tracking);
  }

  .actions {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--k3-sys-spacing-space50, 4px);
    margin-inline-start: auto;
  }

  .actions:not([data-has-action]):not(:has(.dismiss)) {
    display: none;
  }

  .dismiss {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    margin: -8px;
    margin-inline-end: -12px;
    border: none;
    border-radius: var(--k3-sys-shape-corner-full);
    background: transparent;
    color: var(--k3-alert-on-container);
    cursor: pointer;
    font-family: var(
      --k3-sys-icon-font,
      'Material Symbols Rounded',
      'Material Symbols Outlined',
      sans-serif
    );
    font-size: 20px;
    font-variation-settings:
      'FILL' 1,
      'wght' 400,
      'GRAD' 0,
      'opsz' 20;
    -webkit-tap-highlight-color: transparent;
  }

  .dismiss:focus-visible {
    outline: 2px solid var(--k3-sys-color-secondary);
    outline-offset: 2px;
  }

  .dismiss[data-k3-icon]::before {
    content: attr(data-k3-icon);
    font-family: inherit;
    font-size: inherit;
    font-variation-settings: inherit;
    font-feature-settings: 'liga';
    speak: never;
  }

  /* —— Variants (container + accent) —— */
  :host([variant='primary']) {
    --k3-alert-container: var(--k3-sys-color-primary-container);
    --k3-alert-on-container: var(--k3-sys-color-on-primary-container);
    --k3-alert-accent: var(--k3-sys-color-primary);
  }

  :host([variant='secondary']) {
    --k3-alert-container: var(--k3-sys-color-secondary-container);
    --k3-alert-on-container: var(--k3-sys-color-on-secondary-container);
    --k3-alert-accent: var(--k3-sys-color-secondary);
  }

  :host([variant='tertiary']) {
    --k3-alert-container: var(--k3-sys-color-tertiary-container);
    --k3-alert-on-container: var(--k3-sys-color-on-tertiary-container);
    --k3-alert-accent: var(--k3-sys-color-tertiary);
  }

  :host([variant='error']) {
    --k3-alert-container: var(--k3-sys-color-error-container);
    --k3-alert-on-container: var(--k3-sys-color-on-error-container);
    --k3-alert-accent: var(--k3-sys-color-error);
  }

  :host([variant='surface']) {
    --k3-alert-container: var(--k3-sys-color-surface-container);
    --k3-alert-on-container: var(--k3-sys-color-on-surface);
    --k3-alert-accent: var(--k3-sys-color-outline-variant);
  }

  :host([variant='success']) {
    --k3-alert-container: var(--k3-sys-color-success-container);
    --k3-alert-on-container: var(--k3-sys-color-on-success-container);
    --k3-alert-accent: var(--k3-sys-color-success);
  }

  :host([variant='warning']) {
    --k3-alert-container: var(--k3-sys-color-warning-container);
    --k3-alert-on-container: var(--k3-sys-color-on-warning-container);
    --k3-alert-accent: var(--k3-sys-color-warning);
  }

  :host([variant='info']) {
    --k3-alert-container: var(--k3-sys-color-info-container);
    --k3-alert-on-container: var(--k3-sys-color-on-info-container);
    --k3-alert-accent: var(--k3-sys-color-info);
  }

  :host([variant='note']) {
    --k3-alert-container: var(--k3-sys-color-note-container);
    --k3-alert-on-container: var(--k3-sys-color-on-note-container);
    --k3-alert-accent: var(--k3-sys-color-note);
  }

  @media (forced-colors: active) {
    .base {
      background: transparent !important;
      outline: 1px solid CanvasText;
    }
    .base::before {
      background: CanvasText !important;
    }
    .icon,
    .label,
    .content,
    .dismiss {
      color: CanvasText !important;
    }
  }
`;
