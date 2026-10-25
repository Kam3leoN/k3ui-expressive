import { css } from 'lit';

/**
 * Styles for `k3-autocomplete` — text field + anchored listbox panel.
 *
 * @see ./autocomplete.specs.ts
 */
export const autocompleteStyles = css`
  :host {
    display: block;
    position: relative;
    width: 100%;
    max-width: 22rem;
    overflow: visible;
  }

  :host([disabled]) {
    pointer-events: none;
  }

  .field {
    display: block;
    width: 100%;
    max-width: none;
  }

  .panel {
    position: absolute;
    z-index: 50;
    inset-inline: 0;
    top: calc(100% + 0.25rem);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.125rem;
    width: 100%;
    min-width: 7rem;
    max-width: min(17.5rem, 100%);
    padding: 0.25rem;
    background: var(--k3-sys-color-surface-container-low);
    color: var(--k3-sys-color-on-surface);
    border-radius: var(--k3-sys-shape-corner-large);
    box-shadow: var(
      --k3-sys-elevation-level2,
      0 1px 2px rgb(0 0 0 / 0.3),
      0 2px 6px 2px rgb(0 0 0 / 0.15)
    );
    opacity: 0;
    pointer-events: none;
    transform: scale(0.96);
    transform-origin: top center;
    transition:
      opacity var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-expressive-effects),
      transform var(--k3-sys-motion-duration-spatial-fast)
        var(--k3-sys-motion-easing-expressive-spatial);
  }

  .panel.open {
    opacity: 1;
    pointer-events: auto;
    transform: none;
  }

  .option {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    min-height: 3rem;
    padding: 0.625rem 1rem;
    border: none;
    border-radius: var(--k3-sys-shape-corner-small);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }

  .option:hover:not(:disabled) {
    background: color-mix(in srgb, var(--k3-sys-color-on-surface) 8%, transparent);
  }

  .option.active:not(:disabled) {
    background: color-mix(in srgb, var(--k3-sys-color-primary) 12%, transparent);
  }

  .option:disabled {
    opacity: 0.38;
    cursor: default;
  }

  .option.meta {
    cursor: default;
    font-style: italic;
    opacity: 0.72;
  }

  .status {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;
