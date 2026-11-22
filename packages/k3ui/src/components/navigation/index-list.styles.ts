import { css } from 'lit';

export const indexListStyles = css`
  :host {
    display: block;
    position: relative;
    width: 100%;
    min-height: 0;
    --k3-index-list-sticky-offset: 0px;
    --k3-index-list-max-height: 70dvh;
    --k3-index-list-rail-width: 1.5rem;
    --k3-index-list-header-height: 3rem;
    --k3-index-list-item-min-height: 3rem;
    color: var(--k3-sys-color-on-surface);
  }

  .root {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: var(--k3-sys-spacing-space50, 0.25rem);
    min-height: 0;
    height: var(--k3-index-list-max-height);
    max-height: var(--k3-index-list-max-height);
  }

  .content {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--k3-sys-color-surface);
    border-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
    border: 1px solid var(--k3-sys-color-outline-variant);
    --k3-scroll-track-inset: var(--k3-sys-shape-corner-medium, 0.75rem);
  }

  .rail {
    flex: 0 0 var(--k3-index-list-rail-width);
    align-self: stretch;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 0;
    margin: 0;
    padding-block: 0.125rem;
    border: 0;
    background: transparent;
    z-index: 2;
    user-select: none;
    touch-action: none;
    min-height: 0;
    cursor: pointer;
  }

  .rail-item {
    box-sizing: border-box;
    position: relative;
    display: flex;
    flex: 1 1 0;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 0;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 9999px;
    background: transparent;
    color: var(--k3-sys-color-primary);
    font: inherit;
    font-size: 0.625rem;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0;
    text-decoration: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    outline: none;
    appearance: none;
    z-index: 0;
  }

  .rail-item::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 1.125rem;
    height: 1.125rem;
    translate: -50% -50%;
    border-radius: 9999px;
    background: transparent;
    z-index: -1;
    transition: background-color var(--k3-sys-motion-duration-short2, 100ms)
      var(--k3-sys-motion-easing-standard, ease);
  }

  .rail-item:hover:not(.rail-item--empty):not(.rail-item--active)::before {
    background: color-mix(in srgb, var(--k3-sys-color-primary) 14%, transparent);
  }

  .rail-item:focus-visible {
    outline: 2px solid var(--k3-sys-color-primary);
    outline-offset: 1px;
  }

  .rail-item--active {
    color: var(--k3-sys-color-on-primary-container);
  }

  .rail-item--active::before {
    background: var(--k3-sys-color-primary-container);
  }

  .rail-item--empty {
    color: var(--k3-sys-color-outline-variant);
    opacity: 0.38;
    pointer-events: none;
    cursor: default;
  }

  .section {
    margin: 0;
  }

  .header {
    position: sticky;
    top: var(--k3-index-list-sticky-offset);
    z-index: 1;
    display: flex;
    align-items: center;
    min-height: var(--k3-index-list-header-height);
    padding: 0 var(--k3-sys-spacing-space200, 1rem);
    margin: 0;
    background: var(--k3-sys-color-surface-container);
    color: var(--k3-sys-color-on-surface);
    border-block-end: 1px solid var(--k3-sys-color-outline-variant);
    font-size: var(--k3-sys-typescale-title-small-size, 0.875rem);
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  :host(:not([sticky-headers])) .header {
    position: static;
  }

  .items {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .item {
    display: flex;
    align-items: center;
    min-height: var(--k3-index-list-item-min-height);
    padding: var(--k3-sys-spacing-space150, 0.75rem) var(--k3-sys-spacing-space200, 1rem);
    border-block-end: 1px solid var(--k3-sys-color-outline-variant);
    color: var(--k3-sys-color-on-surface);
    font-size: var(--k3-sys-typescale-body-large-size, 1rem);
    line-height: 1.5;
  }

  .slot-source {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .rail-item::before {
      transition: none;
    }
  }
`;
