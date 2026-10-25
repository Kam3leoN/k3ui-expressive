import { css } from 'lit';

export const paginationStyles = css`
  :host {
    display: inline-block;
  }

  .inner {
    display: flex;
    justify-content: center;
  }

  .nav {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--k3-sys-spacing-space50, 0.25rem);
  }

  .nav-btn,
  .page-btn {
    display: inline-grid;
    place-items: center;
    min-width: var(--k3-sys-touch-target, 3rem);
    min-height: var(--k3-sys-touch-target, 3rem);
    padding: 0 var(--k3-sys-spacing-space100, 0.5rem);
    border: 0;
    border-radius: var(--k3-sys-shape-corner-full);
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    cursor: pointer;
    transition: background-color var(--k3-sys-motion-duration-effects-short, 150ms)
      var(--k3-sys-motion-easing-effects, ease);
  }

  .nav-btn:not(:disabled):hover,
  .page-btn:not(:disabled):hover {
    background: color-mix(in srgb, var(--k3-sys-color-on-surface) 8%, transparent);
  }

  .nav-btn:disabled,
  .page-btn:disabled {
    opacity: 0.38;
    cursor: default;
  }

  .page-btn--active {
    background: var(--k3-sys-color-secondary-container);
    color: var(--k3-sys-color-on-secondary-container);
    font-weight: var(--k3-sys-typescale-title-small-weight, 600);
  }

  .ellipsis {
    display: inline-grid;
    place-items: center;
    min-width: var(--k3-sys-touch-target, 3rem);
    min-height: var(--k3-sys-touch-target, 3rem);
    color: var(--k3-sys-color-on-surface-variant);
    user-select: none;
  }

  .icon {
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-weight: normal;
    font-style: normal;
    font-size: 1.5rem;
    line-height: 1;
    width: 1.5rem;
    height: 1.5rem;
    font-feature-settings: 'liga';
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }

  .icon[data-k3-icon]::before {
    content: attr(data-k3-icon);
    font-family: inherit;
    font-size: inherit;
    font-feature-settings: 'liga';
    text-transform: none !important;
  }
`;
