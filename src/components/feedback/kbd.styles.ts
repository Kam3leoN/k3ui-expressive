import { css } from 'lit';

/**
 * Keyboard keycaps — quiet chrome for shortcuts (menus, command palette, docs).
 * Aligns with M3 label typescale; not a full hardware keyboard widget.
 *
 * Font is forced to the plain typeface: `k3-list-item` / menus often set
 * Material Symbols on `::slotted([slot=trailing])`, which would otherwise
 * paint key labels as icon-font glyphs (wide caps, false underlines).
 */
export const kbdStyles = css`
  :host {
    display: inline-flex;
    vertical-align: middle;
    color: var(--k3-sys-color-on-surface-variant);
    /* Beat ::slotted(trailing) icon font from list-item / menus */
    font-family: var(
      --k3-ref-typeface-plain,
      system-ui,
      -apple-system,
      'Segoe UI',
      Roboto,
      sans-serif
    ) !important;
    font-size: var(--k3-kbd-size, 0.6875rem);
    font-weight: var(--k3-kbd-weight, 600);
    font-feature-settings: normal;
    font-variation-settings: normal;
    text-transform: none;
    letter-spacing: var(--k3-sys-typescale-label-small-tracking, 0.03rem);
    --k3-kbd-h: 1.25rem; /* 20 */
    --k3-kbd-pad: 0.25rem; /* 4 */
    --k3-kbd-min: 1.25rem;
    --k3-kbd-radius: var(--k3-sys-shape-corner-extra-small, 0.25rem);
    --k3-kbd-size: var(--k3-sys-typescale-label-small-size, 0.6875rem);
    --k3-kbd-weight: var(--k3-sys-typescale-label-small-emphasized-weight, 600);
  }

  :host([size='sm']) {
    --k3-kbd-h: 1.125rem;
    --k3-kbd-pad: 0.1875rem;
    --k3-kbd-min: 1.125rem;
    --k3-kbd-size: 0.625rem;
  }

  :host([size='lg']) {
    --k3-kbd-h: 1.5rem;
    --k3-kbd-pad: 0.375rem;
    --k3-kbd-min: 1.5rem;
    --k3-kbd-size: var(--k3-sys-typescale-label-medium-size, 0.75rem);
  }

  .chord {
    display: inline-flex;
    align-items: center;
    gap: 0.1875rem; /* 3 */
    flex-wrap: wrap;
    font: inherit;
  }

  .sep {
    opacity: 0.55;
    font: inherit;
    font-size: var(--k3-kbd-size);
    line-height: 1;
    user-select: none;
  }

  .key {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: var(--k3-kbd-min);
    min-height: var(--k3-kbd-h);
    padding-inline: var(--k3-kbd-pad);
    margin: 0;
    border: 1px solid var(--k3-sys-color-outline-variant);
    border-radius: var(--k3-kbd-radius);
    background: var(--k3-sys-color-surface-container-highest);
    color: inherit;
    font: inherit;
    font-size: var(--k3-kbd-size);
    font-weight: var(--k3-kbd-weight);
    font-family: inherit;
    font-feature-settings: normal;
    font-variation-settings: normal;
    text-transform: none;
    text-decoration: none;
    letter-spacing: var(--k3-sys-typescale-label-small-tracking, 0.03rem);
    line-height: 1;
    white-space: nowrap;
    box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--k3-sys-color-outline) 35%, transparent);
  }
`;
