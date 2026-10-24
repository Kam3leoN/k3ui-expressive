import { css } from 'lit';

/**
 * M3 calendar — month / year / multi-year · paged multi-month (default) · scroll opt-in.
 * @see https://m3.material.io/components/date-pickers/guidelines
 * @see https://matraic.github.io/m3e/components/calendar.html
 */
export const calendarStyles = css`
  :host {
    display: block;
    --k3-cal-cell: 2.5rem; /* 40 */
    --k3-cal-scroll-max-h: 22rem; /* ~2 months visible */
    box-sizing: border-box;
    color: var(--k3-sys-color-on-surface);
    font-family: var(--k3-ref-typeface-plain, inherit);
  }

  .header {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-height: 3rem;
    padding-inline: 0.25rem;
  }

  :host([data-layout='scroll']) .header .nav {
    display: none;
  }

  .period-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    flex: 1 1 auto;
    min-width: 0;
    height: 2.5rem;
    padding-inline: 0.5rem;
    border-radius: var(--k3-sys-shape-corner-full);
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    letter-spacing: var(--k3-sys-typescale-label-large-tracking, 0.00625rem);
    text-align: start;
    cursor: pointer;
  }
  .period-btn:hover {
    background: color-mix(in srgb, var(--k3-sys-color-on-surface) 8%, transparent);
  }
  .period-btn .chev {
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: 1.25rem;
    line-height: 1;
  }

  .nav {
    display: inline-flex;
    flex: 0 0 auto;
    gap: 0;
  }
  .nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    color: var(--k3-sys-color-on-surface-variant);
    cursor: pointer;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: 1.5rem;
    line-height: 1;
  }
  .nav-btn:hover:not([disabled]) {
    background: color-mix(in srgb, var(--k3-sys-color-on-surface) 8%, transparent);
  }
  .nav-btn[disabled] {
    opacity: 0.38;
    cursor: default;
  }

  .body {
    padding-block-start: 0.5rem;
  }

  /* Paged multi-month — side by side */
  .months-row {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 1.5rem; /* 24 */
    align-items: flex-start;
  }
  .month-pane {
    flex: 1 1 auto;
    min-width: calc(7 * var(--k3-cal-cell));
    width: calc(7 * var(--k3-cal-cell));
  }
  .month-subhead {
    margin: 0 0 0.5rem;
    padding-inline: 0.5rem;
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-title-small-size, 0.875rem);
    font-weight: 500;
    line-height: 1.25rem;
  }

  /* M3 range — vertical scroll through months */
  .months-scroll {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-height: var(--k3-cal-scroll-max-h);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-inline-end: 0.25rem;
    scroll-snap-type: y proximity;
  }
  .months-scroll .month-pane {
    scroll-snap-align: start;
  }

  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    width: 100%;
    margin-block-end: 0.25rem;
  }
  .weekday {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1.5rem;
    color: var(--k3-sys-color-on-surface);
    font-size: var(--k3-sys-typescale-body-small-size, 0.75rem);
    font-weight: 400;
    line-height: 1;
  }
  .visually-hidden {
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

  .grid {
    display: grid;
    width: 100%;
  }
  .grid.month {
    /* Contiguous columns so range track abuts (M3 in-range indicator) */
    grid-template-columns: repeat(7, 1fr);
  }
  .grid.year {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem 0;
  }
  .grid.multi-year {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem 0;
  }

  /* Day slot — track lives here, under the bubble + digit */
  .day {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: var(--k3-cal-cell);
    isolation: isolate;
  }
  .day.placeholder {
    visibility: hidden;
    pointer-events: none;
  }

  /*
   * M3 in-range active indicator — full cell height (= bubble), continuous band,
   * painted under .cell (z-index 0 vs 1).
   */
  .day.in-range::before,
  .day.range-start::before,
  .day.range-end::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline: 0;
    background: var(--k3-sys-color-secondary-container);
    z-index: 0;
    pointer-events: none;
  }
  .day.range-start:not(.range-end)::before {
    inset-inline-start: 50%;
  }
  .day.range-end:not(.range-start)::before {
    inset-inline-end: 50%;
  }
  .day.range-start.range-end::before {
    display: none;
  }

  .cell {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--k3-cal-cell);
    height: var(--k3-cal-cell);
    flex: 0 0 auto;
    border-radius: 50%;
    color: var(--k3-sys-color-on-surface);
    font-size: var(--k3-sys-typescale-body-large-size, 1rem);
    font-weight: 400;
    line-height: 1;
    cursor: pointer;
    background: transparent;
  }
  .grid.year .cell,
  .grid.multi-year .cell {
    width: 4.5rem; /* 72 */
    height: 2.25rem; /* 36 */
    border-radius: var(--k3-sys-shape-corner-full);
    font-size: var(--k3-sys-typescale-body-large-size, 1rem);
  }

  .cell:hover:not([disabled]):not([aria-pressed='true']) {
    background: color-mix(in srgb, var(--k3-sys-color-on-surface) 8%, transparent);
  }
  .cell.outside {
    color: var(--k3-sys-color-on-surface-variant);
    opacity: 0.38;
  }
  .cell.today:not([aria-pressed='true']) {
    box-shadow: inset 0 0 0 1px var(--k3-sys-color-primary);
  }
  .cell.special:not([aria-pressed='true']) {
    background: var(--k3-sys-color-secondary-container);
    color: var(--k3-sys-color-on-secondary-container);
  }
  .cell[aria-pressed='true'] {
    background: var(--k3-sys-color-primary);
    color: var(--k3-sys-color-on-primary);
  }
  .cell[disabled] {
    color: var(--k3-sys-color-on-surface);
    opacity: 0.38;
    cursor: default;
    box-shadow: none;
  }
`;
