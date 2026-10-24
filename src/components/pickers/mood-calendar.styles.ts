import { css } from 'lit';

export const moodCalendarStyles = css`
  :host {
    display: block;
    color: var(--k3-sys-color-on-surface);
  }

  .years {
    display: flex;
    flex-wrap: wrap;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
    margin-block-end: var(--k3-sys-spacing-space200, 1rem);
  }

  .section-label {
    margin: 0 0 var(--k3-sys-spacing-space100, 0.5rem);
    font-size: var(--k3-sys-typescale-title-small-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-title-small-weight, 500);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
    margin-block-end: var(--k3-sys-spacing-space300, 1.5rem);
  }

  .legend k3-shape-chip {
    cursor: pointer;
  }

  .layout {
    display: block;
  }

  .grid-wrap {
    overflow: auto;
    max-width: 100%;
  }

  .year-grid {
    display: grid;
    grid-template-columns: 2.5rem repeat(31, minmax(1.75rem, 1fr));
    gap: 0.2rem;
    min-width: 40rem;
    align-items: center;
  }

  .corner {
    min-height: 1.25rem;
  }

  .day-head {
    text-align: center;
    font-size: 0.65rem;
    opacity: 0.7;
    line-height: 1;
  }

  .month-label {
    font-size: 0.75rem;
    font-weight: 500;
    opacity: 0.85;
  }

  .day {
    --day-bg: var(--k3-sys-color-surface-container-high);
    box-sizing: border-box;
    display: grid;
    place-items: center;
    width: 100%;
    aspect-ratio: 1;
    min-height: 1.75rem;
    padding: 0;
    margin: 0;
    border: 2px solid transparent;
    border-radius: 999px;
    background: var(--day-bg);
    color: #fff;
    cursor: pointer;
    font: inherit;
    transition:
      transform var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-expressive-spatial, ease-out),
      border-color var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-expressive-effects, ease-out),
      opacity var(--k3-sys-motion-duration-short4, 200ms)
        var(--k3-sys-motion-easing-expressive-effects, ease-out);
  }

  .day:hover:not(:disabled) {
    transform: scale(1.08);
  }

  .day:focus-visible {
    outline: 2px solid var(--k3-sys-color-secondary);
    outline-offset: 2px;
  }

  .day.is-selected {
    border-color: var(--k3-sys-color-on-surface);
  }

  .day.is-dim {
    opacity: 0.28;
  }

  .day.is-empty {
    color: var(--k3-sys-color-on-surface-variant);
    background: var(--k3-sys-color-surface-container);
    cursor: default;
  }

  .day.is-pad {
    opacity: 0.35;
  }

  .day .ms {
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: 0.95rem;
    line-height: 1;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 20;
  }

  .panel {
    box-sizing: border-box;
    padding: var(--k3-sys-spacing-space200, 1rem);
    border-radius: var(--k3-sys-shape-corner-large, 1rem);
    background: var(--k3-sys-color-surface-container-low);
    color: var(--k3-sys-color-on-surface);
  }

  .panel h3 {
    margin: 0.15rem 0 0.75rem;
    font-size: 1.05rem;
    font-weight: 600;
  }

  .panel .weekday {
    font-size: 0.75rem;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .mood-tag,
  .weather {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-block: 0.35rem;
    font-size: 0.875rem;
  }

  .mood-tag .ms,
  .weather .ms,
  .panel-actions .ms {
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: 1.1rem;
    line-height: 1;
  }

  .body {
    margin: 0.75rem 0 0;
    font-size: 0.9rem;
    line-height: 1.45;
    opacity: 0.9;
  }

  .panel-actions {
    margin-top: 0.85rem;
  }

  .stats-title {
    margin: var(--k3-sys-spacing-space400, 2rem) 0 var(--k3-sys-spacing-space200, 1rem);
    font-size: var(--k3-sys-typescale-title-small-size, 0.875rem);
    font-weight: 500;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
    gap: var(--k3-sys-spacing-space100, 0.5rem);
  }

  .stat {
    padding: var(--k3-sys-spacing-space200, 1rem);
    border-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
    background: var(--k3-sys-color-surface-container-low);
  }

  .stat .n {
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.1;
  }

  .stat .l {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    opacity: 0.75;
  }

  .dialog-panel {
    min-width: min(100%, 20rem);
  }
`;
