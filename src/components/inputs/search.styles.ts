import { css } from 'lit';

/**
 * Google-style search — pill (corner-full) · leading icon · clearable.
 * Optional trailing slot after a divider (mic / lens / …).
 */
export const searchStyles = css`
  :host {
    display: block;
    position: relative;
    width: 100%;
    max-width: var(--k3-search-max-width, 28rem);
    --k3-search-h: 3rem; /* 48 — Google bar */
    --k3-search-icon: 1.5rem; /* 24 */
    --k3-search-pad: 1rem; /* 16 */
    --k3-search-gap: 0.75rem; /* 12 */
    --k3-search-bg: var(--k3-sys-color-surface-container-highest);
    --k3-search-fg: var(--k3-sys-color-on-surface);
    --k3-search-muted: var(--k3-sys-color-on-surface-variant);
    --k3-search-radius: var(--k3-sys-shape-corner-full, 9999px);
  }

  :host([disabled]) {
    opacity: 0.38;
    pointer-events: none;
  }

  .field {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    height: var(--k3-search-h);
    padding-inline: var(--k3-search-pad);
    gap: var(--k3-search-gap);
    border: 1px solid transparent;
    border-radius: var(--k3-search-radius);
    background: var(--k3-search-bg);
    color: var(--k3-search-fg);
    box-shadow: var(--k3-sys-elevation-level0);
    transition:
      background var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-expressive-effects),
      box-shadow var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-expressive-effects),
      border-color var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-expressive-effects);
  }

  :host(:hover:not([disabled]):not([data-focused])) .field {
    box-shadow: 0 1px 3px 0 color-mix(in srgb, var(--k3-sys-color-shadow, #000) 12%, transparent);
  }

  /* Focus — thin ring + soft even drop (Google), not M3 elevation stacks */
  :host([data-focused]) .field {
    background: var(--k3-sys-color-surface);
    border-color: transparent;
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--k3-sys-color-outline) 55%, transparent),
      0 1px 6px 0 color-mix(in srgb, var(--k3-sys-color-shadow, #000) 22%, transparent);
  }

  .leading,
  .trailing,
  .clear {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: var(--k3-search-icon);
    height: var(--k3-search-icon);
    color: var(--k3-search-muted);
    font-size: var(--k3-search-icon);
    line-height: 1;
  }

  .leading .ms,
  .clear .ms,
  .trailing ::slotted(*) {
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: var(--k3-search-icon);
    line-height: 1;
    width: var(--k3-search-icon);
    text-align: center;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }

  .control {
    display: block;
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    outline: none;
    background: transparent;
    color: var(--k3-search-fg);
    caret-color: var(--k3-sys-color-primary);
    font: inherit;
    font-size: var(--k3-sys-typescale-body-large-size, 1rem);
    line-height: var(--k3-sys-typescale-body-large-line-height, 1.5rem);
    letter-spacing: var(--k3-sys-typescale-body-large-tracking, 0.03125rem);
  }
  .control::placeholder {
    color: var(--k3-search-muted);
    opacity: 1;
  }
  /* Own clear button — hide UA search decoration */
  .control::-webkit-search-decoration,
  .control::-webkit-search-cancel-button,
  .control::-webkit-search-results-button,
  .control::-webkit-search-results-decoration {
    display: none;
    -webkit-appearance: none;
  }

  .clear {
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: transparent;
    color: var(--k3-search-muted);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .clear:hover {
    color: var(--k3-search-fg);
  }
  .clear:focus-visible {
    outline: 2px solid var(--k3-sys-color-primary);
    outline-offset: 2px;
  }
  .clear:not(.has) {
    display: none;
  }

  .divider {
    flex: 0 0 auto;
    align-self: stretch;
    width: 1px;
    margin-block: 0.5rem;
    background: var(--k3-sys-color-outline-variant);
  }
  .divider:not(.has),
  .trailing:not(.has) {
    display: none;
  }

  .trailing {
    gap: 0.5rem;
  }
  .trailing.has {
    display: inline-flex;
  }

  .panel {
    position: absolute;
    inset-inline: 0;
    top: calc(100% + 0.25rem);
    z-index: 30;
    box-sizing: border-box;
    padding: 0.5rem 0;
    border-radius: var(--k3-sys-shape-corner-large);
    background: var(--k3-sys-color-surface-container);
    box-shadow: var(--k3-sys-elevation-level2);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--k3-sys-motion-duration-short4)
      var(--k3-sys-motion-easing-expressive-effects);
  }
  .panel.open {
    opacity: 1;
    pointer-events: auto;
  }
`;
