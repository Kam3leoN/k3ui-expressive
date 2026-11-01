import { css } from 'lit';

export const lazyStyles = css`
  :host {
    display: block;
    position: relative;
    min-block-size: var(--k3-lazy-min-block-size, auto);
  }
  :host([hidden]) {
    display: none;
  }

  /* Content and fallback share one grid cell: the content keeps its box while
     hidden, so revealing it never shifts the page (CLS). */
  .stack {
    display: grid;
  }
  .stack > * {
    grid-area: 1 / 1;
    min-inline-size: 0;
  }
  .content[data-hidden] {
    visibility: hidden;
  }
  .overlay {
    display: grid;
    place-items: center;
    min-block-size: var(--k3-lazy-fallback-min-block-size, 4rem);
  }

  .error {
    display: grid;
    justify-items: start;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
    padding: var(--k3-sys-spacing-space200, 1rem);
    border-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
    background: var(--k3-sys-color-error-container);
    color: var(--k3-sys-color-on-error-container);
    font-size: var(--k3-sys-typescale-body-medium-size, 0.875rem);
    line-height: var(--k3-sys-typescale-body-medium-line-height, 1.25rem);
  }
  .error-text {
    margin: 0;
  }
  .retry {
    position: relative;
    min-block-size: 2.5rem;
    min-inline-size: 3rem;
    padding-inline: var(--k3-sys-spacing-space150, 0.75rem);
    border: 0;
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: transparent;
    color: var(--k3-sys-color-error);
    font: inherit;
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    cursor: pointer;
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (forced-colors: active) {
    .error {
      border: 1px solid CanvasText;
    }
  }
`;
