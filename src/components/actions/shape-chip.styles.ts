import { css, unsafeCSS } from 'lit';
import {
  ShapeChipGapOverPill,
  ShapeChipIconSizeDp,
  ShapeChipPadEndOverPill,
  ShapeChipPillHeightDp,
  ShapeChipShapeOverPill,
} from './shape-chip.specs.js';

const rem = (dp: number) => unsafeCSS(`${dp / 16}rem`);

/**
 * Shape Chip — pill with a Material shape on leading or trailing edge.
 * Shape/pad scale with pill; icon follows M3 Icon Button sizes.
 */
export const shapeChipStyles = css`
  :host {
    /* Small (default) — same height ladder as Buttons */
    --k3-shape-chip-pill-h: ${rem(ShapeChipPillHeightDp.sm)};
    --k3-shape-chip-shape: calc(
      var(--k3-shape-chip-pill-h) * ${unsafeCSS(String(ShapeChipShapeOverPill))}
    );
    --k3-shape-chip-icon: ${rem(ShapeChipIconSizeDp.sm)};
    --k3-shape-chip-label-inset: calc(
      var(--k3-shape-chip-shape) / 2 + var(--k3-shape-chip-pill-h) *
        ${unsafeCSS(String(ShapeChipGapOverPill))}
    );
    --k3-shape-chip-pad-end: calc(
      var(--k3-shape-chip-pill-h) * ${unsafeCSS(String(ShapeChipPadEndOverPill))}
    );
    --k3-shape-chip-font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    --k3-shape-chip-font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    --k3-shape-chip-color: var(--k3-sys-color-primary);
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    width: max-content;
    max-width: 100%;
    vertical-align: middle;
    /* Half-shape sticks out past the pill (leading default) */
    padding-inline-start: calc(var(--k3-shape-chip-shape) / 2);
    padding-inline-end: 0;
    box-sizing: border-box;
  }

  :host([size='xs']) {
    --k3-shape-chip-pill-h: ${rem(ShapeChipPillHeightDp.xs)};
    --k3-shape-chip-icon: ${rem(ShapeChipIconSizeDp.xs)};
    --k3-shape-chip-font-size: var(--k3-sys-typescale-label-medium-size, 0.75rem);
  }

  :host([size='sm']) {
    --k3-shape-chip-pill-h: ${rem(ShapeChipPillHeightDp.sm)};
    --k3-shape-chip-icon: ${rem(ShapeChipIconSizeDp.sm)};
  }

  :host([size='md']) {
    --k3-shape-chip-pill-h: ${rem(ShapeChipPillHeightDp.md)};
    --k3-shape-chip-icon: ${rem(ShapeChipIconSizeDp.md)};
    --k3-shape-chip-font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
    --k3-shape-chip-font-weight: var(--k3-sys-typescale-title-medium-weight, 500);
  }

  :host([size='lg']) {
    --k3-shape-chip-pill-h: ${rem(ShapeChipPillHeightDp.lg)};
    --k3-shape-chip-icon: ${rem(ShapeChipIconSizeDp.lg)};
    --k3-shape-chip-font-size: var(--k3-sys-typescale-headline-small-size, 1.5rem);
    --k3-shape-chip-font-weight: var(
      --k3-sys-typescale-headline-medium-emphasized-weight,
      500
    );
  }

  :host([size='xl']) {
    --k3-shape-chip-pill-h: ${rem(ShapeChipPillHeightDp.xl)};
    --k3-shape-chip-icon: ${rem(ShapeChipIconSizeDp.xl)};
    --k3-shape-chip-font-size: var(--k3-sys-typescale-headline-large-size, 2rem);
    --k3-shape-chip-font-weight: var(
      --k3-sys-typescale-headline-medium-emphasized-weight,
      500
    );
  }

  :host([placement='trailing']) {
    padding-inline-start: 0;
    padding-inline-end: calc(var(--k3-shape-chip-shape) / 2);
  }

  .pill {
    position: relative;
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    width: max-content;
    max-width: 100%;
    min-width: 0;
    height: var(--k3-shape-chip-pill-h);
    min-height: var(--k3-shape-chip-pill-h);
    margin: 0;
    border: 0;
    /* Leading shape: 2dp on shape edge · full on opposite */
    border-start-start-radius: 0.125rem; /* 2dp */
    border-end-start-radius: 0.125rem;
    border-start-end-radius: 999px;
    border-end-end-radius: 999px;
    padding: 0 var(--k3-shape-chip-pad-end) 0 var(--k3-shape-chip-label-inset);
    font-family: var(--k3-ref-typeface-plain, inherit);
    font-size: var(--k3-shape-chip-font-size);
    font-weight: var(--k3-shape-chip-font-weight);
    letter-spacing: var(--k3-sys-typescale-label-large-tracking, 0.01em);
    line-height: 1;
    cursor: default;
    appearance: none;
    -webkit-appearance: none;
    user-select: none;
    -webkit-user-select: none;
    color: var(--k3-sys-color-on-surface);
    background: var(--k3-sys-color-surface-container-lowest, #fff);
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.1),
      0 1px 3px 1px rgb(0 0 0 / 0.06);
  }

  :host([placement='trailing']) .pill {
    padding: 0 var(--k3-shape-chip-label-inset) 0 var(--k3-shape-chip-pad-end);
    /* Trailing shape: full on start · 2dp on shape edge */
    border-start-start-radius: 999px;
    border-end-start-radius: 999px;
    border-start-end-radius: 0.125rem;
    border-end-end-radius: 0.125rem;
  }

  /* Interactive only when toggle attr is set */
  :host([toggle]) .pill {
    cursor: pointer;
    transition:
      color var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-expressive-effects),
      box-shadow 120ms ease,
      background var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-expressive-effects);
  }

  :host([toggle]) .pill:hover {
    box-shadow:
      0 1px 3px rgb(0 0 0 / 0.14),
      0 2px 4px 1px rgb(0 0 0 / 0.08);
  }

  /* Selected → filled with shape color */
  :host([toggle][selected]) .pill {
    background: var(--k3-shape-chip-color);
    color: #fff;
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.14),
      0 1px 3px 1px rgb(0 0 0 / 0.1);
  }

  :host([disabled]) {
    opacity: 0.38;
    pointer-events: none;
  }

  .shape {
    position: absolute;
    /* Center of the shape = exact leading edge of the pill */
    inset-inline-start: calc(var(--k3-shape-chip-shape) / -2);
    inset-inline-end: auto;
    top: 50%;
    translate: 0 -50%;
    width: var(--k3-shape-chip-shape);
    height: var(--k3-shape-chip-shape);
    z-index: 1;
    pointer-events: none;
    line-height: 0;
    color: var(--k3-shape-chip-color);
    filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.12));
  }

  :host([placement='trailing']) .shape {
    inset-inline-start: auto;
    inset-inline-end: calc(var(--k3-shape-chip-shape) / -2);
  }

  .shape > svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .shape-icon {
    position: absolute;
    inset: 0;
    display: none;
    place-items: center;
    place-content: center;
    color: #fff;
    line-height: 0;
  }

  :host([has-icon]) .shape-icon {
    display: grid;
  }

  /* Slotted Material Symbol — same force as k3-icon-button (beat light-DOM .ms) */
  .shape-icon ::slotted(*) {
    display: grid !important;
    place-items: center !important;
    place-content: center !important;
    box-sizing: border-box !important;
    width: var(--k3-shape-chip-icon) !important;
    height: var(--k3-shape-chip-icon) !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: var(--k3-shape-chip-icon) !important;
    line-height: 1 !important;
    letter-spacing: normal !important;
    text-align: center !important;
    color: inherit !important;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif !important;
    font-weight: normal !important;
    font-style: normal !important;
    font-feature-settings: 'liga';
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
    -webkit-font-smoothing: antialiased;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-transform: none !important;
    direction: ltr !important;
  }

  .shape-icon ::slotted(svg) {
    width: var(--k3-shape-chip-icon) !important;
    height: var(--k3-shape-chip-icon) !important;
    fill: currentColor;
  }

  .label {
    position: relative;
    z-index: 0;
    white-space: nowrap;
  }
`;
