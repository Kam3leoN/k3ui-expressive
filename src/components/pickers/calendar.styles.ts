import { css } from 'lit';

/**
 * M3 calendar — month / year / multi-year · paged multi-month (default) · scroll opt-in.
 * @see https://m3.material.io/components/date-pickers/guidelines
 * @see https://matraic.github.io/m3e/components/calendar.html
 */
export const calendarStyles = css`
  :host {
    display: block;
    /*
     * Noph / M3 docked ≈ 360dp wide → day track ~48dp fills the body.
     * Cells stretch to the track (not a fixed 40dp island in a wide column).
     */
    --k3-cal-width: 22.5rem; /* 360 */
    --k3-cal-cell: 3rem; /* 48 — min hit; grows with track */
    box-sizing: border-box;
    width: 100%;
    max-width: var(--k3-cal-width);
    color: var(--k3-sys-color-on-surface);
    font-family: var(--k3-ref-typeface-plain, inherit);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
    min-height: 2.5rem; /* compact vs day grid (Noph) */
    padding-inline: 0;
  }

  /* Month left · year right (Noph split) */
  .period {
    display: inline-flex;
    align-items: center;
    gap: 0;
    min-width: 0;
  }
  .period--month {
    justify-content: flex-start;
    flex: 1 1 auto;
  }
  .period--year {
    justify-content: flex-end;
    flex: 0 1 auto;
  }

  /* Range scroll — month subheads carry navigation; hide split period chrome */
  :host([data-layout='scroll']) .header {
    display: none;
  }

  .period-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
    flex: 0 1 auto;
    min-width: 0;
    height: 2.25rem;
    padding-inline: 0.375rem;
    border-radius: var(--k3-sys-shape-corner-full);
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    letter-spacing: var(--k3-sys-typescale-label-large-tracking, 0.00625rem);
    text-align: start;
    cursor: pointer;
  }
  .period-btn:hover,
  .period-btn[aria-expanded='true'] {
    background: color-mix(in srgb, var(--k3-sys-color-on-surface) 8%, transparent);
  }
  .period-btn .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .period-btn .chev {
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: 1.25rem;
    line-height: 1;
    flex: 0 0 auto;
    transition: transform var(--k3-sys-motion-duration-short4, 200ms)
      var(--k3-sys-motion-easing-emphasized, cubic-bezier(0.2, 0, 0, 1));
  }
  .period-btn[aria-expanded='true'] .chev {
    transform: rotate(180deg);
  }

  .nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem; /* 36 — header chrome < day grid */
    height: 2.25rem;
    border-radius: 50%;
    color: var(--k3-sys-color-on-surface-variant);
    cursor: pointer;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: 1.375rem;
    line-height: 1;
    flex: 0 0 auto;
  }
  .nav-btn:hover:not([disabled]) {
    background: color-mix(in srgb, var(--k3-sys-color-on-surface) 8%, transparent);
  }
  .nav-btn[disabled] {
    opacity: 0.38;
    cursor: default;
  }

  .body {
    padding-block-start: 0.25rem;
    overflow: hidden;
  }
  .body-inner {
    will-change: transform, opacity;
  }
  .body[data-slide='next'] .body-inner {
    animation: k3-cal-slide-next var(--k3-sys-motion-duration-spatial-fast, 350ms)
      var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1)) both;
  }
  .body[data-slide='prev'] .body-inner {
    animation: k3-cal-slide-prev var(--k3-sys-motion-duration-spatial-fast, 350ms)
      var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1)) both;
  }
  @keyframes k3-cal-slide-next {
    from {
      opacity: 0.35;
      transform: translateX(10%);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes k3-cal-slide-prev {
    from {
      opacity: 0.35;
      transform: translateX(-10%);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  /* Year menu — continuous slide (k3-scroll), not paginated pages */
  .years-scroll {
    max-height: calc(6 * var(--k3-cal-cell) + 2rem);
    --k3-scroll-size: 0.375rem;
    --k3-scroll-track-inset: 0;
    scroll-snap-type: y proximity;
  }
  .years-scroll .cell {
    scroll-snap-align: center;
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
    min-width: 0;
    width: 100%;
  }
  .months-row .month-pane {
    flex: 0 0 auto;
    width: var(--k3-cal-width);
    max-width: var(--k3-cal-width);
  }
  .month-subhead {
    margin: 0 0 0.5rem;
    padding-inline: 0.5rem;
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-title-small-size, 0.875rem);
    font-weight: 500;
    line-height: 1.25rem;
  }

  /*
   * Range months — stack only. Scroll lives on the picker modal
   * .surface-scroll.k3-scroll (edge-sticky, like timepicker) — never a
   * nested UA scrollbar inset inside the calendar.
   */
  .months-scroll {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-width: 0;
    overflow: visible;
  }

  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    width: 100%;
    margin-block-end: 0.125rem;
  }
  .weekday {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2rem; /* align with day track rhythm */
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
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
  .grid.year {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem 0;
  }
  .grid.multi-year {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem 0;
  }

  /* Day slot — square track; bubble fills it (Noph proportions) */
  .day {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1;
    height: auto;
    min-height: var(--k3-cal-cell);
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
    width: 100%;
    height: 100%;
    flex: 1 1 auto;
    border-radius: 50%;
    color: var(--k3-sys-color-on-surface);
    font-size: var(--k3-sys-typescale-body-large-size, 1rem);
    font-weight: 400;
    line-height: 1;
    cursor: pointer;
    background: transparent;
  }
  .grid.month .cell {
    /* Keep circle inside square track with a slight inset like Noph */
    width: calc(100% - 0.25rem);
    height: calc(100% - 0.25rem);
    max-width: 3.5rem; /* 56 */
    max-height: 3.5rem;
  }
  .grid.year .cell,
  .grid.multi-year .cell {
    width: 100%;
    height: 2.25rem; /* 36 */
    max-width: none;
    max-height: none;
    border-radius: var(--k3-sys-shape-corner-full);
    font-size: var(--k3-sys-typescale-body-large-size, 1rem);
    aspect-ratio: auto;
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
  .cell[aria-pressed='true'][data-value-anim] {
    animation: k3-cal-value-pop var(--k3-sys-motion-duration-spatial-fast, 350ms)
      var(--k3-sys-motion-easing-expressive-spatial-fast, cubic-bezier(0.42, 1.67, 0.21, 0.9)) both;
  }
  @keyframes k3-cal-value-pop {
    from {
      transform: scale(0.72);
    }
    to {
      transform: scale(1);
    }
  }
  .cell[disabled] {
    color: var(--k3-sys-color-on-surface);
    opacity: 0.38;
    cursor: default;
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .body[data-slide] .body-inner,
    .cell[aria-pressed='true'][data-value-anim],
    .period-btn .chev {
      animation: none !important;
      transition: none !important;
      transform: none !important;
    }
  }
`;
