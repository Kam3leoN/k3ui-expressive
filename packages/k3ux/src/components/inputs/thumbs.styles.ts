import { css } from 'lit';

/**
 * Thumbs chrome — up · count · down, Material Symbols + M3 tokens.
 */
export const thumbsStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
    box-sizing: border-box;
    --k3-thumbs-icon: 28px;
    --k3-thumbs-target: 48px;
    --k3-thumbs-gap: var(--k3-sys-spacing-space150, 0.75rem);
    /* Idle = filled glyph in light gray (disabled look, still clickable) */
    --k3-thumbs-idle: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface) 28%,
      transparent
    );
    --k3-thumbs-active: var(--k3-sys-color-on-surface);
    --k3-thumbs-count: var(--k3-sys-color-on-surface);
    color: var(--k3-thumbs-idle);
    user-select: none;
    -webkit-user-select: none;
  }

  :host([size='xs']) {
    --k3-thumbs-icon: 20px;
    --k3-thumbs-target: 32px;
    --k3-thumbs-gap: var(--k3-sys-spacing-space100, 0.5rem);
  }
  :host([size='sm']) {
    --k3-thumbs-icon: 24px;
    --k3-thumbs-target: 40px;
    --k3-thumbs-gap: var(--k3-sys-spacing-space100, 0.5rem);
  }
  :host([size='md']) {
    --k3-thumbs-icon: 28px;
    --k3-thumbs-target: 48px;
  }
  :host([size='lg']) {
    --k3-thumbs-icon: 32px;
    --k3-thumbs-target: 48px;
    --k3-thumbs-gap: var(--k3-sys-spacing-space200, 1rem);
  }
  :host([size='xl']) {
    --k3-thumbs-icon: 40px;
    --k3-thumbs-target: 56px;
    --k3-thumbs-gap: var(--k3-sys-spacing-space200, 1rem);
  }

  :host([disabled]) {
    opacity: 0.38;
    pointer-events: none;
  }

  .row {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: var(--k3-thumbs-gap);
    min-height: var(--k3-thumbs-target);
  }

  .btn {
    display: inline-grid;
    place-items: center;
    width: var(--k3-thumbs-target);
    height: var(--k3-thumbs-target);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--k3-sys-shape-corner-full, 9999px);
    background: transparent;
    color: var(--k3-thumbs-idle);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition:
      color var(--k3-sys-motion-duration-short2, 100ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1)),
      background-color var(--k3-sys-motion-duration-short2, 100ms)
        var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
  }

  .btn:hover {
    background: color-mix(in srgb, var(--k3-thumbs-active) 8%, transparent);
  }

  .btn:focus {
    outline: none;
  }

  .btn:focus-visible {
    outline: 2px solid var(--k3-sys-color-secondary);
    outline-offset: 2px;
  }

  .btn[aria-pressed='true'] {
    color: var(--k3-thumbs-active);
  }

  .btn.is-up[aria-pressed='true'] {
    color: var(--k3-sys-color-primary);
  }

  .btn.is-down[aria-pressed='true'] {
    color: var(--k3-sys-color-error);
  }

  :host([readonly]) .btn {
    cursor: default;
    pointer-events: none;
  }

  .glyph {
    display: grid;
    place-items: center;
    width: var(--k3-thumbs-icon);
    height: var(--k3-thumbs-icon);
    font-family: var(
      --k3-sys-icon-font,
      'Material Symbols Rounded',
      'Material Symbols Outlined',
      sans-serif
    );
    font-size: var(--k3-thumbs-icon);
    font-weight: normal;
    font-style: normal;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    white-space: nowrap;
    font-feature-settings: 'liga';
    /* Always filled — idle uses light gray, pressed uses active color */
    font-variation-settings:
      'FILL' 1,
      'wght' var(--k3-sys-icon-wght, 400),
      'GRAD' var(--k3-sys-icon-grad, 0),
      'opsz' var(--k3-sys-icon-opsz, 24);
    color: inherit;
  }

  .glyph[data-k3-icon]::before {
    content: attr(data-k3-icon);
    font-family: inherit;
    font-size: inherit;
    font-variation-settings: inherit;
    font-feature-settings: 'liga';
    line-height: 1;
    speak: never;
  }

  .count {
    margin: 0;
    min-width: 1.5ch;
    font: var(--k3-sys-typescale-title-medium);
    font-size: clamp(0.95rem, calc(var(--k3-thumbs-icon) * 0.72), 1.25rem);
    font-weight: 560;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    letter-spacing: 0.01em;
    color: var(--k3-thumbs-count);
    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    .btn {
      transition: none;
    }
  }
`;
