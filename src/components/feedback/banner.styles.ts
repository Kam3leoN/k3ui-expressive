import { css } from 'lit';

/**
 * Full-bleed banner strip — fixed layer + in-flow spacer (host height).
 */
export const bannerStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    --k3-banner-z: 40;
    /* 12dp block · 40dp controls → 64dp (same as small top app bar) */
    --k3-banner-pad-block: var(--k3-sys-spacing-space150, 0.75rem);
    --k3-banner-pad-inline: var(--k3-sys-spacing-space200, 1rem);
    --k3-banner-gap: var(--k3-sys-spacing-space100, 0.5rem);
    --k3-banner-icon-size: 1.25rem; /* 20dp */
    --k3-banner-min-height: 4rem; /* 64dp */
    --k3-banner-container: var(--k3-sys-color-primary-container);
    --k3-banner-on-container: var(--k3-sys-color-on-primary-container);
    color: var(--k3-banner-on-container);
  }

  :host([hidden]) {
    display: none !important;
  }

  /*
   * Fixed — host is an in-flow spacer (must not flex-shrink in column shells);
   * .surface paints on the viewport, edge-pinned like a top sheet.
   */
  :host([position='fixed']) {
    width: 100%;
    flex: 0 0 auto;
    flex-shrink: 0;
    pointer-events: none;
    overflow: hidden;
  }

  :host([position='fixed']) .surface {
    position: fixed;
    top: var(--k3-banner-stack-top, 0px);
    inset-inline: 0;
    z-index: var(--k3-banner-z, 30);
    pointer-events: auto;
    /* Add safe-area on top of pad — never replace it (that de-centered the row) */
    padding-top: calc(
      var(--k3-banner-pad-block) + env(safe-area-inset-top, 0px)
    );
    min-height: calc(
      var(--k3-banner-min-height, 4rem) + env(safe-area-inset-top, 0px)
    );
    transform-origin: top center;
    will-change: transform;
  }

  /* Enter / leave — scaleY (sheet) driven by WAAPI */
  :host([data-phase='entering']) .surface,
  :host([data-phase='leaving']) .surface {
    will-change: transform;
  }

  :host([position='static']) .surface {
    position: relative;
  }

  .surface {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: var(--k3-banner-gap);
    box-sizing: border-box;
    width: 100%;
    min-height: var(--k3-banner-min-height, 4rem);
    padding-top: var(--k3-banner-pad-block);
    padding-bottom: var(--k3-banner-pad-block);
    padding-inline: var(--k3-banner-pad-inline);
    background: var(--k3-banner-container);
    color: var(--k3-banner-on-container);
    /*
     * Remap button tokens so slotted text/outlined actions use strip ink
     * (forced color-on / on-container), not theme primary.
     */
    --k3-sys-color-primary: var(--k3-banner-on-container);
    --k3-sys-color-on-primary: var(--k3-banner-container);
    --k3-sys-color-on-surface: var(--k3-banner-on-container);
    --k3-sys-color-on-surface-variant: var(--k3-banner-on-container);
  }

  .icon {
    flex: 0 0 auto;
    align-self: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--k3-banner-icon-size);
    height: var(--k3-banner-icon-size);
    font-size: var(--k3-banner-icon-size);
    font-family: var(--k3-sys-icon-font-family, 'Material Symbols Rounded');
    font-variation-settings:
      'FILL' 1,
      'wght' 500,
      'GRAD' 0,
      'opsz' 20;
    font-feature-settings: 'liga';
    line-height: 1;
    color: inherit;
  }

  .icon[hidden] {
    display: none !important;
  }

  .icon[data-k3-icon]::before {
    content: attr(data-k3-icon);
  }

  .body {
    flex: 1 1 auto;
    align-self: center;
    min-width: 0;
    display: flex;
    align-items: center;
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
  }

  /* Slotted marquee fills the band */
  .body ::slotted(k3-marquee) {
    display: block;
    width: 100%;
    min-width: 0;
  }

  .actions {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    align-self: center;
    gap: var(--k3-sys-spacing-space50, 0.25rem);
  }

  .actions ::slotted(*) {
    align-self: center;
  }

  .actions:not([data-has-action]):not([data-dismiss]) {
    display: none;
  }

  .dismiss {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    width: 2.5rem; /* 40dp touch */
    height: 2.5rem;
    border: 0;
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-family: var(--k3-sys-icon-font-family, 'Material Symbols Rounded');
    font-size: 1.25rem;
    font-variation-settings:
      'FILL' 0,
      'wght' 500,
      'GRAD' 0,
      'opsz' 20;
    font-feature-settings: 'liga';
    line-height: 1;
  }

  .dismiss::before {
    content: attr(data-k3-icon);
  }

  .dismiss:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  /* ── Variants ─────────────────────────────────────────────────────────── */
  :host([variant='primary']) {
    --k3-banner-container: var(--k3-sys-color-primary-container);
    --k3-banner-on-container: var(--k3-sys-color-on-primary-container);
  }
  :host([variant='secondary']) {
    --k3-banner-container: var(--k3-sys-color-secondary-container);
    --k3-banner-on-container: var(--k3-sys-color-on-secondary-container);
  }
  :host([variant='tertiary']) {
    --k3-banner-container: var(--k3-sys-color-tertiary-container);
    --k3-banner-on-container: var(--k3-sys-color-on-tertiary-container);
  }
  :host([variant='error']) {
    --k3-banner-container: var(--k3-sys-color-error-container);
    --k3-banner-on-container: var(--k3-sys-color-on-error-container);
  }
  :host([variant='warning']) {
    --k3-banner-container: var(--k3-sys-color-tertiary-container);
    --k3-banner-on-container: var(--k3-sys-color-on-tertiary-container);
  }
  :host([variant='info']) {
    --k3-banner-container: var(--k3-sys-color-secondary-container);
    --k3-banner-on-container: var(--k3-sys-color-on-secondary-container);
  }
  :host([variant='success']) {
    --k3-banner-container: var(--k3-sys-color-primary-container);
    --k3-banner-on-container: var(--k3-sys-color-on-primary-container);
  }
  :host([variant='inverse']) {
    --k3-banner-container: var(--k3-sys-color-inverse-surface);
    --k3-banner-on-container: var(--k3-sys-color-inverse-on-surface);
  }
`;
