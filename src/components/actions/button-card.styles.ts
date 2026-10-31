import { css } from 'lit';

/**
 * Styles for `k3-button-card` — medyamagaza-like row (≈44dp icon well).
 * Tint: `--k3-button-card-icon-bg` / `--k3-button-card-icon-fg`
 * Hover fill: `--k3-button-card-brand` (defaults to primary)
 */
export const buttonCardStyles = css`
  :host {
    display: inline-flex;
    max-inline-size: 100%;
    vertical-align: middle;
    overflow: visible;
    --k3-button-card-icon-bg: var(--k3-sys-color-primary-container);
    --k3-button-card-icon-fg: var(--k3-sys-color-on-primary-container);
    --k3-button-card-brand: var(--k3-sys-color-primary);
  }

  :host([stretch]) {
    display: flex;
    inline-size: 100%;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: 0.38;
  }

  .card {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
    inline-size: 100%;
    margin: 0;
    padding: 0.625rem 0.875rem;
    border: 0;
    border-radius: 0.625rem;
    /* M3 filled card — no elevation shadow */
    background: var(--k3-sys-color-surface-container-highest);
    color: var(--k3-sys-color-on-surface);
    box-shadow: none;
    font: inherit;
    text-align: start;
    text-decoration: none;
    cursor: pointer;
    outline: none;
    transform: scale(1);
    transform-origin: center center;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
      color var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
      transform var(--k3-sys-motion-duration-medium2, 300ms)
        var(--k3-sys-motion-easing-spatial, cubic-bezier(0.38, 1.21, 0.22, 1));
  }

  .card:hover,
  .card:focus-visible {
    background: var(--k3-button-card-brand);
    color: #fff;
    transform: scale(1.03);
    z-index: 1;
  }

  .card:focus-visible {
    outline: 2px solid var(--k3-sys-color-secondary);
    outline-offset: 2px;
  }

  .icon {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    inline-size: 2.75rem;
    block-size: 2.75rem;
    border-radius: 0.5rem;
    background: var(--k3-button-card-icon-bg);
    color: var(--k3-button-card-icon-fg);
    overflow: hidden;
    transition:
      background-color var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
      color var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
  }

  .card:hover .icon,
  .card:focus-visible .icon {
    background: rgb(255 255 255 / 0.22);
    color: #fff;
  }

  .icon__glyph {
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: 1.375rem;
    font-weight: 400;
    font-style: normal;
    line-height: 1;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
    font-feature-settings: 'liga';
    speak: never;
    user-select: none;
  }

  .icon__glyph[data-k3-icon]::before {
    content: attr(data-k3-icon);
  }

  ::slotted([slot='icon']) {
    display: block;
    inline-size: 1.375rem;
    block-size: 1.375rem;
    color: inherit;
    fill: currentColor;
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-inline-size: 0;
    flex: 1 1 auto;
  }

  .label {
    margin: 0;
    font-family: var(--k3-sys-typescale-label-large-font, inherit);
    font-size: 0.8125rem;
    font-weight: 700;
    line-height: 1.125rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--k3-sys-color-on-surface);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color var(--k3-sys-motion-duration-short4, 200ms)
      var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
  }

  .subtitle {
    margin: 0;
    font-family: var(--k3-sys-typescale-body-small-font, inherit);
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1rem;
    letter-spacing: 0.01em;
    color: var(--k3-sys-color-on-surface-variant);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color var(--k3-sys-motion-duration-short4, 200ms)
      var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
  }

  .card:hover .label,
  .card:focus-visible .label,
  .card:hover .subtitle,
  .card:focus-visible .subtitle {
    color: #fff;
  }

  .subtitle:empty {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .card,
    .icon,
    .label,
    .subtitle {
      transition: none;
    }
  }

  :host-context([data-k3-reduce-motion]) .card,
  :host-context([data-k3-reduce-motion]) .icon,
  :host-context([data-k3-reduce-motion]) .label,
  :host-context([data-k3-reduce-motion]) .subtitle {
    transition: none;
  }
`;
