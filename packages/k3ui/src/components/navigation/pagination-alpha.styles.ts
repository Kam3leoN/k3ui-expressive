import { css } from 'lit';

export const paginationAlphaStyles = css`
  :host {
    display: block;
  }

  :host([orientation='vertical']) .nav {
    flex-direction: column;
    align-items: stretch;
  }

  .nav {
    display: inline-flex;
    flex-wrap: wrap;
    gap: var(--k3-sys-spacing-space50, 0.25rem);
    justify-content: center;
  }

  .letter-btn {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: var(--k3-sys-touch-target, 3rem);
    min-height: var(--k3-sys-touch-target, 3rem);
    padding: var(--k3-sys-spacing-space50, 0.25rem);
    border: 0;
    border-radius: var(--k3-sys-shape-corner-medium);
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
    cursor: pointer;
    transition:
      background-color var(--k3-sys-motion-duration-effects-short, 150ms)
        var(--k3-sys-motion-easing-effects, ease),
      color var(--k3-sys-motion-duration-effects-short, 150ms)
        var(--k3-sys-motion-easing-effects, ease);
  }

  :host([size='sm']) .letter-btn {
    min-width: 2rem;
    min-height: 2rem;
    font-size: var(--k3-sys-typescale-label-small-size, 0.75rem);
  }

  :host([size='lg']) .letter-btn {
    min-width: 3.5rem;
    min-height: 3.5rem;
    font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
  }

  .letter-btn:not(:disabled):hover {
    background: color-mix(in srgb, var(--k3-sys-color-on-surface) 8%, transparent);
  }

  .letter-btn--active {
    background: var(--k3-sys-color-primary-container);
    color: var(--k3-sys-color-on-primary-container);
    font-weight: 600;
  }

  .letter-btn:disabled {
    opacity: 0.38;
    cursor: default;
  }

  .count {
    font-size: var(--k3-sys-typescale-label-small-size, 0.6875rem);
    line-height: 1;
    color: var(--k3-sys-color-outline);
  }

  :host(:not([show-count])) .count {
    display: none;
  }
`;
