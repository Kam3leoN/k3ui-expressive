import { css } from 'lit';

export const tocStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    min-width: 0;
    --k3-toc-sticky-offset: 1rem;
    --k3-toc-max-height: min(70dvh, 32rem);
  }

  :host([sticky]) {
    position: sticky;
    inset-block-start: var(--k3-toc-sticky-offset);
    align-self: start;
  }

  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
    box-sizing: border-box;
    padding: 1.25rem;
    border-radius: var(--k3-sys-shape-corner-extra-large, 1.75rem);
    background: var(--k3-sys-color-surface-container-high);
    color: var(--k3-sys-color-on-surface);
  }

  .kicker {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--k3-sys-color-on-surface-variant);
    opacity: 0.85;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    list-style: none;
    margin: 0;
    padding: 0;
    max-block-size: var(--k3-toc-max-height);
    overflow-y: auto;
  }

  .link {
    display: block;
    box-sizing: border-box;
    width: 100%;
    margin: 0;
    padding: 0.4rem 0.65rem;
    border: 0;
    border-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
    font-family: var(--k3-ref-typeface-plain);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    text-align: start;
    text-decoration: none;
    cursor: pointer;
    transition:
      background-color var(--k3-sys-motion-duration-effects-short, 200ms)
        var(--k3-sys-motion-easing-effects, ease),
      color var(--k3-sys-motion-duration-effects-short, 200ms)
        var(--k3-sys-motion-easing-effects, ease);
  }

  .link:hover {
    color: var(--k3-sys-color-on-surface);
    background: color-mix(in srgb, var(--k3-sys-color-on-surface) 6%, transparent);
  }

  .link:focus-visible {
    outline: 2px solid var(--k3-sys-color-primary);
    outline-offset: 1px;
  }

  .link[aria-current='location'] {
    color: var(--k3-sys-color-on-secondary-container);
    background: var(--k3-sys-color-secondary-container);
  }

  .link--level-2 {
    padding-inline-start: 1.15rem;
    font-weight: 400;
  }

  .link--level-3 {
    padding-inline-start: 1.65rem;
    font-size: 0.8125rem;
    font-weight: 400;
  }

  .empty {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--k3-sys-color-on-surface-variant);
  }
`;
