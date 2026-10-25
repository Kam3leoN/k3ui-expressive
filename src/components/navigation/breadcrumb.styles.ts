import { css } from 'lit';

export const breadcrumbStyles = css`
  :host {
    display: block;
    position: relative;
    z-index: 1;
  }

  nav {
    display: block;
  }

  .breadcrumb__list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 0;
  }

  .breadcrumb__item {
    display: inline-flex;
    align-items: center;
  }

  .breadcrumb__item--sep {
    pointer-events: none;
  }

  .breadcrumb__link {
    display: inline-flex;
    align-items: center;
    gap: var(--k3-sys-spacing-space75, 0.375rem);
    font-family: var(--k3-ref-typeface-plain);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    transition:
      color var(--k3-sys-motion-duration-effects-short, 200ms)
        var(--k3-sys-motion-easing-effects, ease),
      background-color var(--k3-sys-motion-duration-effects-short, 200ms)
        var(--k3-sys-motion-easing-effects, ease);
    color: var(--k3-sys-color-on-surface);
    text-decoration: none;
    padding: var(--k3-sys-spacing-space75, 0.375rem) var(--k3-sys-spacing-space100, 0.5rem);
    border-radius: var(--k3-sys-shape-corner-extra-small, 4px);
    border: none;
    background: transparent;
    cursor: pointer;
    font: inherit;
  }

  .breadcrumb__link:hover {
    color: var(--k3-sys-color-primary);
  }

  .breadcrumb__link:focus-visible {
    outline: 2px solid var(--k3-sys-color-outline);
    outline-offset: 2px;
  }

  .breadcrumb__link--current {
    color: var(--k3-sys-color-on-primary-container);
    background-color: var(--k3-sys-color-primary-container);
    font-weight: 600;
    cursor: default;
    pointer-events: none;
  }

  :host([variant='filled']) .breadcrumb__link--current {
    color: var(--k3-sys-color-on-primary);
    background-color: var(--k3-sys-color-primary);
  }

  .breadcrumb__icon {
    flex-shrink: 0;
    display: inline-grid;
    place-items: center;
    width: 1rem;
    height: 1rem;
    font-size: 1rem;
    line-height: 1;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 20;
  }

  .breadcrumb__separator {
    display: inline-flex;
    align-items: center;
    color: var(--k3-sys-color-outline-variant);
    padding: 0 var(--k3-sys-spacing-space50, 0.25rem);
    font-size: 0.9em;
  }

  .breadcrumb__ellipsis {
    color: var(--k3-sys-color-on-surface-variant);
    padding: 0 var(--k3-sys-spacing-space50, 0.25rem);
    user-select: none;
  }

  :host([size='sm']) .breadcrumb__link,
  :host([size='sm']) .breadcrumb__link--current {
    padding: var(--k3-sys-spacing-space50, 0.25rem) var(--k3-sys-spacing-space75, 0.375rem);
    font-size: var(--k3-sys-typescale-label-small-size, 0.6875rem);
  }

  :host([size='sm']) .breadcrumb__icon {
    width: 0.875rem;
    height: 0.875rem;
    font-size: 0.875rem;
  }

  :host([size='lg']) .breadcrumb__link,
  :host([size='lg']) .breadcrumb__link--current {
    padding: var(--k3-sys-spacing-space100, 0.5rem) var(--k3-sys-spacing-space150, 0.75rem);
    font-size: var(--k3-sys-typescale-title-small-size, 0.875rem);
  }

  :host([size='lg']) .breadcrumb__icon {
    width: 1.125rem;
    height: 1.125rem;
    font-size: 1.125rem;
  }
`;
