import { css } from 'lit';

/**
 * Host chrome for `k3-progress` — drawing is canvas (M3E flat / wavy / oscillation).
 *
 * Slot contract:
 * - `leading` → label (± icon)
 * - middle / indicator → progress (always)
 * - `trailing` → value percent
 * - `supporting` → always under the chrome (never beside the bar)
 *
 * Linear grid uses named lines (`lead` · `bar` · `trail`) so columns
 * collapse cleanly when label / trailing are off — no orphan gaps, and
 * supporting locks to the bar when there is no leading label.
 *
 * Linear `layout`: `default` (inline) · `top` · `bottom`.
 */
export const progressStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    color: var(--k3-sys-color-primary);
    --k3-progress-active: var(--k3-sys-color-primary);
    --k3-progress-track: var(--k3-sys-color-secondary-container);
    --k3-progress-stop: var(--k3-sys-color-primary);
    --k3-progress-size: 40px;
  }

  :host([interactive]:not([indeterminate])) {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
  }

  :host([interactive]:not([indeterminate]):focus-visible) {
    outline: 2px solid var(--k3-sys-color-primary);
    outline-offset: 2px;
    border-radius: var(--k3-sys-shape-corner-extra-small, 0.25rem);
  }

  :host([interactive][data-dragging]) {
    cursor: grabbing;
  }
  :host([variant='circular']) {
    display: inline-block;
    width: auto;
    vertical-align: middle;
  }

  .root {
    width: 100%;
    position: relative;
  }

  /* ── Linear: named tracks — lead | bar | trail ── */
  .root.linear {
    display: grid;
    column-gap: var(--k3-sys-spacing-space200, 1rem); /* 16 */
    row-gap: var(--k3-sys-spacing-space100, 0.5rem); /* 8 */
    align-items: center;
    grid-template-rows:
      [above] auto
      [bar] auto
      [below] auto
      [support] auto;
  }

  /* Column recipes — only emit tracks that are in use (no orphan gaps). */
  .root.linear.has-label.has-trailing {
    grid-template-columns:
      [chrome-start lead-start] auto
      [lead-end bar-start] minmax(0, 1fr)
      [bar-end trail-start] auto
      [trail-end chrome-end];
  }
  .root.linear.has-label:not(.has-trailing) {
    grid-template-columns:
      [chrome-start lead-start] auto
      [lead-end bar-start] minmax(0, 1fr)
      [bar-end chrome-end];
  }
  .root.linear:not(.has-label).has-trailing {
    grid-template-columns:
      [chrome-start bar-start] minmax(0, 1fr)
      [bar-end trail-start] auto
      [trail-end chrome-end];
  }
  .root.linear:not(.has-label):not(.has-trailing) {
    grid-template-columns:
      [chrome-start bar-start] minmax(0, 1fr)
      [bar-end chrome-end];
  }

  .root.linear .indicator {
    grid-column: bar-start / bar-end;
    grid-row: bar;
    width: 100%;
  }
  /* top / bottom — bar spans full chrome width */
  .root.linear.layout-top .indicator,
  .root.linear.layout-bottom .indicator {
    grid-column: chrome-start / chrome-end;
  }

  /* default — label + value flanking the bar */
  .root.linear .leading.start {
    grid-column: lead-start / lead-end;
    grid-row: bar;
    justify-self: start;
  }
  .root.linear .trailing.end {
    grid-column: trail-start / trail-end;
    grid-row: bar;
    justify-self: end;
  }
  /* top — label + value above the bar */
  .root.linear .leading.above-start {
    grid-column: lead-start / lead-end;
    grid-row: above;
    justify-self: start;
  }
  .root.linear .trailing.above-end {
    grid-column: trail-start / trail-end;
    grid-row: above;
    justify-self: end;
  }
  /* bottom — label + value under the bar */
  .root.linear .leading.below-start {
    grid-column: lead-start / lead-end;
    grid-row: below;
    justify-self: start;
  }
  .root.linear .trailing.below-end {
    grid-column: trail-start / trail-end;
    grid-row: below;
    justify-self: end;
  }

  /*
   * Supporting — always under the chrome (never beside).
   * With label → full chrome. Without → flush with the bar track.
   * layout=bottom + label/value → row under that pair.
   */
  .root.linear .supporting {
    grid-column: chrome-start / chrome-end;
    grid-row: below;
    justify-self: start;
    align-self: start;
  }
  .root.linear:not(.has-label) .supporting {
    grid-column: bar-start / bar-end;
  }
  .root.linear.layout-top:not(.has-label) .supporting,
  .root.linear.layout-bottom:not(.has-label) .supporting {
    /* full-bleed bar → supporting matches full chrome */
    grid-column: chrome-start / chrome-end;
  }
  .root.linear.layout-bottom.has-below .supporting {
    grid-row: support;
  }

  /* ── Circular: label top · ring · value · supporting ── */
  .root.circular {
    width: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
  }
  .root.circular .leading,
  .root.circular .trailing,
  .root.circular .supporting {
    text-align: center;
  }

  .cell {
    min-width: 0;
    white-space: nowrap;
  }
  .cell:not(.has) {
    display: none;
  }

  .label,
  .label-text,
  .value-text {
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    color: var(--k3-sys-color-on-surface);
  }
  .leading {
    display: inline-flex;
    align-items: center;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
  }
  .percent,
  .trailing,
  .value-text {
    font-variant-numeric: tabular-nums;
  }
  .trailing.has {
    display: inline-flex;
    align-items: center;
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    color: var(--k3-sys-color-on-surface);
  }

  .indicator {
    position: relative;
    min-width: 0;
    display: grid;
    place-items: center;
  }
  :host([variant='circular']) .indicator {
    width: var(--k3-progress-size);
    height: var(--k3-progress-size);
    flex: 0 0 auto;
  }
  canvas {
    display: block;
    width: 100%;
    max-width: 100%;
    height: auto;
    grid-area: 1 / 1;
  }
  :host([variant='linear']) .indicator {
    width: 100%;
  }
  :host([variant='linear'][shape='oscillation']) .indicator {
    min-height: 2.25rem;
  }
  :host([variant='linear']) canvas {
    width: 100% !important; /* override leftover circular inline size */
  }
  :host([variant='circular']) canvas {
    width: var(--k3-progress-size);
    height: var(--k3-progress-size);
    max-width: none;
  }

  /* Circular value centered in the ring */
  .percent.inside {
    display: none;
    grid-area: 1 / 1;
    z-index: 1;
    place-items: center;
    width: 100%;
    height: 100%;
    pointer-events: none;
    font-size: clamp(
      0.5rem,
      calc(var(--k3-progress-size) * 0.2),
      0.875rem
    );
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .percent.inside.has {
    display: grid;
  }

  .supporting {
    font-size: var(--k3-sys-typescale-body-small-size, 0.75rem);
    line-height: var(--k3-sys-typescale-body-small-line-height, 1rem);
    color: var(--k3-sys-color-on-surface-variant);
  }
  .supporting:not(.has) {
    display: none;
  }
`;
