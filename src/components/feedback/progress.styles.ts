import { css } from 'lit';

/**
 * Host chrome for `k3-progress` — drawing is canvas (M3E flat / wavy).
 *
 * Slot contract:
 * - `leading` → label only
 * - `trailing` → percent only
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
  :host([variant='circular']) {
    display: inline-block;
    width: auto;
    vertical-align: middle;
  }

  .root {
    width: 100%;
    position: relative;
  }
  .root.circular {
    width: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
  }

  /* Linear: 3 columns × 3 rows — label start-side, percent end-side */
  .root.linear {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows: auto auto auto;
    column-gap: var(--k3-sys-spacing-space200, 1rem);
    row-gap: var(--k3-sys-spacing-space100, 0.5rem);
    align-items: center;
  }
  .root.linear .indicator {
    grid-column: 2;
    grid-row: 2;
  }
  .root.linear .above-start {
    grid-column: 1;
    grid-row: 1;
    justify-self: start;
  }
  .root.linear .above-end {
    grid-column: 3;
    grid-row: 1;
    justify-self: end;
  }
  .root.linear .start {
    grid-column: 1;
    grid-row: 2;
    justify-self: start;
  }
  .root.linear .end {
    grid-column: 3;
    grid-row: 2;
    justify-self: end;
  }
  .root.linear .below-start {
    grid-column: 1;
    grid-row: 3;
    justify-self: start;
  }
  .root.linear .below-end {
    grid-column: 3;
    grid-row: 3;
    justify-self: end;
  }
  .root.linear .spacer {
    display: none;
  }
  .root.linear .supporting {
    grid-column: 1 / -1;
    grid-row: 4;
  }

  .cell {
    min-width: 0;
    white-space: nowrap;
  }
  .cell:not(.has) {
    display: none;
  }

  .label {
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    color: var(--k3-sys-color-on-surface);
  }
  .percent {
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    font-variant-numeric: tabular-nums;
    color: var(--k3-sys-color-on-surface);
  }

  .indicator {
    position: relative;
    min-width: 0;
    width: 100%;
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
    height: auto;
    grid-area: 1 / 1;
  }
  :host([variant='circular']) canvas {
    width: var(--k3-progress-size);
    height: var(--k3-progress-size);
  }

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

  /* Circular below stack — label always above percent */
  .stack {
    display: none;
    flex-direction: column;
    align-items: center;
    gap: var(--k3-sys-spacing-space50, 0.25rem);
  }
  .stack.has {
    display: flex;
  }
  .stack .cell.has {
    display: block;
    text-align: center;
  }

  .supporting {
    font-size: var(--k3-sys-typescale-body-small-size, 0.75rem);
    line-height: var(--k3-sys-typescale-body-small-line-height, 1rem);
    color: var(--k3-sys-color-on-surface-variant);
  }
  .supporting:not(.has) {
    display: none;
  }
  .root.circular .supporting {
    text-align: center;
  }
  .root.linear .supporting {
    justify-self: start;
  }
`;