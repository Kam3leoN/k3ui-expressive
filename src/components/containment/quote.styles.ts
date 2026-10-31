import { css } from 'lit';

/**
 * Styles for `k3-quote` — surface card, primary offset, author | quote split.
 * Resting tilt static · hover-only motion · mark top-right (see QuoteSpecs).
 */
export const quoteStyles = css`
  :host {
    display: block;
    position: relative;
    max-inline-size: 100%;
    box-sizing: border-box;
  }

  .wrap {
    position: relative;
    isolation: isolate;
  }

  .motion {
    position: relative;
    transform-origin: 50% 60%;
  }

  .offset {
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: var(--k3-sys-shape-corner-extra-large, 1.75rem);
    background: var(--k3-sys-color-primary);
    transform: translate(0.75rem, 0.75rem);
    pointer-events: none;
    transition: transform var(--k3-sys-motion-duration-medium2, 300ms)
      var(--k3-sys-motion-easing-effects, cubic-bezier(0.2, 0, 0, 1));
  }

  .card {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: var(--k3-sys-spacing-space300, 1.5rem);
    padding-block: var(--k3-sys-spacing-space200, 1rem);
    padding-inline: var(--k3-sys-spacing-space400, 2rem);
    border-radius: var(--k3-sys-shape-corner-extra-large, 1.75rem);
    background: var(--k3-sys-color-surface-container-high);
    color: var(--k3-sys-color-on-surface);
    box-sizing: border-box;
    overflow: visible;
  }

  /* Resting tilt — same ±3° footprint; sense from tilt-dir (ccw|cw) */
  :host([tilt]) .motion {
    transition: transform var(--k3-sys-motion-duration-medium2, 300ms)
      var(--k3-sys-motion-easing-spatial, cubic-bezier(0.38, 1.21, 0.22, 1));
  }

  :host([tilt][tilt-dir='ccw']) .motion,
  :host([tilt]:not([tilt-dir])) .motion {
    transform: rotate(-3deg);
  }

  :host([tilt][tilt-dir='cw']) .motion {
    transform: rotate(3deg);
  }

  :host([tilt][tilt-dir='ccw']:hover) .motion,
  :host([tilt][tilt-dir='ccw']:focus-within) .motion,
  :host([tilt]:not([tilt-dir]):hover) .motion,
  :host([tilt]:not([tilt-dir]):focus-within) .motion {
    transform: rotate(-5deg) translate3d(0, -0.25rem, 0);
  }

  :host([tilt][tilt-dir='cw']:hover) .motion,
  :host([tilt][tilt-dir='cw']:focus-within) .motion {
    transform: rotate(5deg) translate3d(0, -0.25rem, 0);
  }

  :host([tilt]:hover) .offset,
  :host([tilt]:focus-within) .offset {
    transform: translate(1rem, 1rem);
  }

  @media (min-width: 600px) {
    .card {
      flex-direction: row;
      align-items: stretch;
      gap: 0;
    }

    :host([layout='author-end']) .card {
      flex-direction: row-reverse;
    }
  }

  .author {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--k3-sys-spacing-space200, 1rem);
    flex: 0 0 auto;
  }

  @media (min-width: 600px) {
    .author {
      flex: 0 0 auto;
      inline-size: max-content;
      max-inline-size: 42%;
      padding-inline-end: var(--k3-sys-spacing-space400, 2rem);
    }

    :host([layout='author-end']) .author {
      padding-inline-end: 0;
      padding-inline-start: var(--k3-sys-spacing-space400, 2rem);
    }
  }

  .author__avatar {
    display: block;
  }

  .author__avatar[hidden] {
    display: none;
  }

  .author__meta {
    display: flex;
    flex-direction: column;
    gap: var(--k3-sys-spacing-space50, 0.25rem);
    min-inline-size: max-content;
  }

  .author__name {
    margin: 0;
    font-family: var(--k3-sys-typescale-title-medium-font, inherit);
    font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
    font-weight: var(--k3-sys-typescale-title-medium-weight, 500);
    line-height: var(--k3-sys-typescale-title-medium-line-height, 1.5rem);
    letter-spacing: var(--k3-sys-typescale-title-medium-tracking, 0.009375rem);
    color: var(--k3-sys-color-on-surface);
  }

  .author__name:empty,
  .author__name[hidden] {
    display: none;
  }

  .author__role {
    margin: 0;
    font-family: var(--k3-sys-typescale-body-medium-font, inherit);
    font-size: var(--k3-sys-typescale-body-medium-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-body-medium-weight, 400);
    line-height: var(--k3-sys-typescale-body-medium-line-height, 1.25rem);
    letter-spacing: var(--k3-sys-typescale-body-medium-tracking, 0.015625rem);
    color: var(--k3-sys-color-on-surface-variant);
    white-space: nowrap;
  }

  .author__role:empty,
  .author__role[hidden] {
    display: none;
  }

  .divider {
    display: none;
    flex: 0 0 auto;
    inline-size: 1px;
    background: var(--k3-sys-color-outline-variant);
    align-self: stretch;
  }

  @media (min-width: 600px) {
    .divider {
      display: block;
    }
  }

  .quote {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--k3-sys-spacing-space200, 1rem);
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  @media (min-width: 600px) {
    .quote {
      padding-inline-start: var(--k3-sys-spacing-space400, 2rem);
    }

    :host([layout='author-end']) .quote {
      padding-inline-start: 0;
      padding-inline-end: var(--k3-sys-spacing-space400, 2rem);
    }
  }

  /* Quote mark SVG — top-right (~40×40 like snappify); fill follows theme */
  .mark {
    position: absolute;
    z-index: 2;
    inset-block-start: -1.25rem;
    inset-inline-end: 1.25rem;
    inset-inline-start: auto;
    display: block;
    inline-size: 2.5rem;
    block-size: 2.5rem;
    margin: 0;
    color: var(--k3-sys-color-primary);
    fill: currentColor;
    pointer-events: none;
    user-select: none;
    overflow: visible;
  }

  .mark path {
    fill: currentColor;
  }

  .quote__body {
    position: relative;
    z-index: 1;
    margin: 0;
    padding-block-start: var(--k3-sys-spacing-space100, 0.5rem);
    font-family: var(--k3-sys-typescale-body-large-font, inherit);
    font-size: var(--k3-sys-typescale-body-large-size, 1rem);
    font-weight: var(--k3-sys-typescale-body-large-weight, 400);
    line-height: var(--k3-sys-typescale-body-large-line-height, 1.5rem);
    letter-spacing: var(--k3-sys-typescale-body-large-tracking, 0.03125rem);
    color: var(--k3-sys-color-on-surface);
  }

  .quote__action {
    position: relative;
    z-index: 1;
    align-self: flex-start;
  }

  .quote__action[hidden] {
    display: none;
  }

  ::slotted([slot='action']) {
    display: inline-flex;
  }

  @media (prefers-reduced-motion: reduce) {
    :host([tilt]) .motion,
    :host([tilt]:hover) .motion,
    :host([tilt]:focus-within) .motion {
      transition: none;
    }

    :host([tilt][tilt-dir='ccw']) .motion,
    :host([tilt][tilt-dir='ccw']:hover) .motion,
    :host([tilt]:not([tilt-dir])) .motion,
    :host([tilt]:not([tilt-dir]):hover) .motion {
      transform: rotate(-3deg);
    }

    :host([tilt][tilt-dir='cw']) .motion,
    :host([tilt][tilt-dir='cw']:hover) .motion {
      transform: rotate(3deg);
    }

    :host([tilt]:hover) .offset,
    :host([tilt]:focus-within) .offset {
      transform: translate(0.75rem, 0.75rem);
      transition: none;
    }
  }

  :host-context([data-k3-reduce-motion]) .motion,
  :host-context([data-k3-reduce-motion]) .offset {
    transition: none !important;
  }

  :host([tilt][tilt-dir='cw']):host-context([data-k3-reduce-motion]) .motion {
    transform: rotate(3deg) !important;
  }

  :host([tilt][tilt-dir='ccw']):host-context([data-k3-reduce-motion]) .motion,
  :host([tilt]:not([tilt-dir])):host-context([data-k3-reduce-motion]) .motion {
    transform: rotate(-3deg) !important;
  }

  :host-context([data-k3-reduce-motion]) .offset {
    transform: translate(0.75rem, 0.75rem) !important;
  }
`;
