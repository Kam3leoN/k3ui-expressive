import { css, unsafeCSS, type CSSResult } from 'lit';

export const hostReset = css`
  :host {
    display: inline-block;
    box-sizing: border-box;
    font-family: var(--k3-ref-typeface-plain);
    color: var(--k3-sys-color-on-surface);
    -webkit-tap-highlight-color: transparent;
  }

  :host([hidden]) {
    display: none !important;
  }

  /* Explicit direction variants (also inherits from document.dir) */
  :host([dir='rtl']) {
    direction: rtl;
  }
  :host([dir='ltr']) {
    direction: ltr;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  button {
    font: inherit;
    color: inherit;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }

  button:focus-visible {
    outline: none;
  }

  ::slotted(*) {
    max-width: 100%;
  }

  /*
   * Material Symbol from data-k3-icon — keeps glyphs out of text nodes so
   * Chrome / Google Translate cannot rewrite ligature names inside shadow.
   * Host element must set the Material Symbols font-family.
   */
  [data-k3-icon]::before {
    content: attr(data-k3-icon);
    font-family: inherit;
    font-weight: inherit;
    font-style: inherit;
    font-size: inherit;
    line-height: inherit;
    letter-spacing: normal;
    text-transform: none !important;
    white-space: nowrap;
    font-feature-settings: 'liga';
    font-variation-settings: inherit;
    speak: never;
  }
`;

/**
 * Sortable drop-slot for shadow components.
 *
 * Contract (tous les prochains éléments draggables CE) :
 * 1. La surface visible doit avoir `part="container"` (et son border-radius).
 * 2. Inclure `dropSlotStyles` dans `static styles`.
 * 3. Ne jamais peindre le dashed sur `:host` — le host est souvent rectangulaire.
 *
 * `attachSortable` pose `data-k3-dnd-slot` sur le host ; ce bloc réagit dessus.
 */
export const dropSlotStyles = css`
  :host([data-k3-dnd-slot]),
  :host([dragged]) {
    outline: none !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  :host([data-k3-dnd-slot]) [part='container'],
  :host([dragged]) [part='container'] {
    opacity: 1;
    color: transparent;
    background: transparent !important;
    box-shadow: none !important;
    outline: none !important;
    border: 2px dashed var(--k3-sys-color-outline) !important;
    cursor: grabbing;
  }

  :host([data-k3-dnd-slot]) [part='container'] > *,
  :host([dragged]) [part='container'] > * {
    visibility: hidden;
  }
`;

/**
 * Host + slotted item chrome for `attachSortable` sets (`k3-card-set`, `k3-chip-set`).
 * `itemTag` = light-DOM child tag (e.g. `k3-card`, `k3-chip`).
 * touch-action on slotted items — host alone is not enough for hit-testing.
 */
export function sortableSetStyles(itemTag: string): CSSResult {
  const item = unsafeCSS(itemTag);
  return css`
    :host([sortable]) {
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    :host([sortable]) .set,
    :host([sorting]) .set {
      user-select: none;
      -webkit-user-select: none;
    }
    :host([sortable]) ::slotted(${item}) {
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      cursor: grab;
    }
    :host([sorting]) ::slotted(${item}) {
      cursor: grabbing;
    }
  `;
}

export const sizes = {
  xs: css`
    --k3-comp-height: 2rem;
    --k3-comp-pad-inline: 0.75rem;
    --k3-comp-font: var(--k3-sys-typescale-label-medium-size);
  `,
  sm: css`
    --k3-comp-height: 2.5rem;
    --k3-comp-pad-inline: 1rem;
    --k3-comp-font: var(--k3-sys-typescale-label-large-size);
  `,
  md: css`
    --k3-comp-height: 2.75rem;
    --k3-comp-pad-inline: 1.25rem;
    --k3-comp-font: var(--k3-sys-typescale-label-large-size);
  `,
  lg: css`
    --k3-comp-height: 3.5rem;
    --k3-comp-pad-inline: 1.5rem;
    --k3-comp-font: var(--k3-sys-typescale-title-medium-size);
  `,
  xl: css`
    --k3-comp-height: 4.5rem;
    --k3-comp-pad-inline: 2rem;
    --k3-comp-font: var(--k3-sys-typescale-title-large-size);
  `,
};
