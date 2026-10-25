import { css } from 'lit';

export const indexListStyles = css`
  :host {
    display: block;
    position: relative;
    --k3-index-list-sticky-offset: 0px;
  }

  .root {
    display: flex;
    align-items: stretch;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
    min-height: 0;
  }

  .rail {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.125rem;
    padding: var(--k3-sys-spacing-space50, 0.25rem);
    user-select: none;
  }

  .rail-item {
    display: grid;
    place-items: center;
    min-width: 1.75rem;
    min-height: 1.5rem;
    padding: 0 0.25rem;
    border-radius: var(--k3-sys-shape-corner-small);
    color: var(--k3-sys-color-primary);
    font-size: var(--k3-sys-typescale-label-small-size, 0.6875rem);
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }

  .rail-item--active {
    background: var(--k3-sys-color-primary-container);
    color: var(--k3-sys-color-on-primary-container);
  }

  .rail-item--empty {
    opacity: 0.35;
    pointer-events: none;
  }

  .content {
    flex: 1 1 auto;
    min-height: 0;
    max-height: inherit;
    overflow-y: auto;
  }

  .section + .section {
    margin-top: var(--k3-sys-spacing-space200, 1rem);
  }

  .header {
    position: sticky;
    top: var(--k3-index-list-sticky-offset);
    z-index: 1;
    padding: var(--k3-sys-spacing-space100, 0.5rem) var(--k3-sys-spacing-space200, 1rem);
    background: var(--k3-sys-color-surface-container);
    color: var(--k3-sys-color-primary);
    font-size: var(--k3-sys-typescale-title-small-size, 0.875rem);
    font-weight: 600;
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
    padding: var(--k3-sys-spacing-space150, 0.75rem) var(--k3-sys-spacing-space200, 1rem);
    border-block-end: 1px solid var(--k3-sys-color-outline-variant);
    color: var(--k3-sys-color-on-surface);
    font-size: var(--k3-sys-typescale-body-large-size, 1rem);
  }

  .slot-source {
    display: none;
  }
`;
