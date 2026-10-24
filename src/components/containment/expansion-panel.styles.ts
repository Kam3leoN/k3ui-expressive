import { css } from 'lit';

/**
 * Expansion panel chrome — motion lives in `expand-collapse.styles`.
 * Default surface is transparent (chevron / expand only); `filled` adds card fill.
 */
export const expansionPanelStyles = css`
  :host {
    display: block;
    overflow: hidden;
    border-radius: 0;
    background: transparent;
    color: var(--k3-sys-color-on-surface);
  }
  :host([filled]) {
    border-radius: var(--k3-sys-shape-corner-medium);
    background: var(--k3-sys-color-surface-container-low);
  }
  :host([flush]) {
    border-radius: 0;
    background: transparent;
    overflow: visible;
  }

  .header {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    min-height: 3.5rem; /* 56 */
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
    border-radius: inherit;
  }
  .header:focus-visible {
    outline: 2px solid var(--k3-sys-color-secondary);
    outline-offset: -2px;
  }

  .leading:not(.has) {
    display: none;
  }
  .leading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    width: 1.5rem;
    height: 1.5rem;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--k3-sys-color-on-surface-variant);
    flex-shrink: 0;
  }
  ::slotted([slot='icon']) {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    font-family: var(
      --k3-sys-icon-font-family,
      'Material Symbols Rounded',
      sans-serif
    );
    font-size: 1.5rem;
    line-height: 1;
    font-feature-settings: 'liga';
  }

  .titles {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  .headline {
    font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
    font-weight: 500;
    color: var(--k3-sys-color-on-surface);
  }
  .supporting {
    font-size: var(--k3-sys-typescale-body-medium-size);
    color: var(--k3-sys-color-on-surface-variant);
  }
  .supporting:not(.has) {
    display: none;
  }

  .expand-body {
    padding: 0 1rem 1rem;
    font-size: var(--k3-sys-typescale-body-medium-size);
    color: var(--k3-sys-color-on-surface-variant);
  }
  .expand-body.has-icon {
    padding-inline-start: calc(1rem + 1.5rem + 1rem);
  }
`;