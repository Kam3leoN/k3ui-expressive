import { css } from 'lit';

/**
 * M3 Expressive list container — standard · segmented.
 *
 * Segmented tokens (M3E):
 * - gap 2dp · outer 24 · inner 4 · hover 12 · selected = outer
 * Nested under expandable: embedded — inner corners; last inherits outer bottom.
 *
 * Gap 2dp: margin-bottom on every non-last item (data-seg-gap), snapped to
 * integer device pixels via devicePixelSnapCss(2) — stable at 125% Windows DPI.
 * Fill is on inner .item (host transparent).
 *
 * @see https://m3.material.io/components/lists/specs
 */
export const listStyles = css`
  :host {
    display: block;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    position: relative;
    --k3-segmented-list-segment-gap: 0.125rem; /* 2 */
    --k3-segmented-list-container-shape: 1.5rem; /* 24 */
    --k3-segmented-list-item-shape: var(
      --k3-sys-shape-corner-extra-small,
      0.25rem
    ); /* 4 */
    --k3-segmented-list-item-hover-shape: var(
      --k3-sys-shape-corner-medium,
      0.75rem
    ); /* 12 */
    --k3-segmented-list-item-selected-shape: var(
      --k3-segmented-list-container-shape,
      1.5rem
    );
  }
  .list {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
    background: var(--k3-list-bg, transparent);
    border-radius: var(--k3-sys-shape-corner-large, 1rem);
    max-height: var(--k3-list-max-height, none);
    overflow: auto;
    gap: 0;
  }

  #list-actions-menu {
    position: absolute;
    width: 0;
    height: 0;
    margin: 0;
    overflow: visible;
    pointer-events: none;
  }

  /* Standard — continuous */
  :host([variant='standard']) .list {
    padding-block: 0.5rem;
    gap: 0;
  }
  :host([variant='standard']) ::slotted(k3-list-item) {
    --k3-list-item-radius: 0;
    margin-bottom: 0;
  }

  /*
   * Segmented — gap via item margin-bottom (set in syncChildren, DPR-snapped).
   * Flex gap alone rounds unevenly at fractional devicePixelRatio (e.g. 1.25).
   */
  :host([variant='segmented']) .list,
  :host(:not([variant])) .list {
    gap: 0;
    padding: 0;
  }
  :host([variant='segmented']) ::slotted(k3-list-item),
  :host(:not([variant])) ::slotted(k3-list-item) {
    --k3-list-item-radius-start: var(
      --k3-segmented-list-container-shape,
      1.5rem
    );
    --k3-list-item-radius-inner: var(
      --k3-segmented-list-item-shape,
      0.25rem
    );
    --k3-list-item-radius-hover: var(
      --k3-segmented-list-item-hover-shape,
      0.75rem
    );
    --k3-list-item-radius-selected: var(
      --k3-segmented-list-item-selected-shape,
      1.5rem
    );
  }
  :host([variant='segmented']) ::slotted(k3-list-item[data-seg-gap]),
  :host(:not([variant])) ::slotted(k3-list-item[data-seg-gap]) {
    margin-bottom: var(--k3-segmented-list-segment-gap, 0.125rem) !important;
  }

  :host([embedded]) ::slotted(k3-list-item) {
    --k3-list-item-radius-end: inherit;
  }

  :host([elevated]) .list {
    background: var(--k3-sys-color-surface-container-low);
    box-shadow: var(--k3-sys-elevation-level1);
    padding: 0.5rem;
  }

  :host([sortable]) {
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  :host([sortable]) ::slotted(k3-list-item) {
    cursor: grab;
  }
  :host([sorting]) ::slotted(k3-list-item) {
    cursor: grabbing;
  }
`;
