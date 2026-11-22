import { css } from 'lit';

/**
 * M3 Expressive list container — standard · segmented.
 *
 * Segmented tokens (M3E):
 * - gap 2dp · container (outer) large 16 · item 4 · hover 12 · focus 16 ·
 *   selected 16 · item spacing 12 · media shape 8
 * Nested under expandable: embedded — free inner corners; terminal child
 * closes the island with the container shape.
 *
 * Gap 2dp: margin-bottom on every non-last item (data-seg-gap), snapped to
 * integer device pixels via devicePixelSnapCss(2) — stable at 125% Windows DPI.
 * Fill is on inner .item (host transparent).
 *
 * Dividers (`k3-divider` / `hr`) render in standard lists only.
 * Leading alignment: when any item carries leading media, items without
 * leading content reserve the same width (data-leading-reserve).
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
    --k3-segmented-list-container-shape: var(
      --k3-sys-shape-corner-large,
      1rem
    ); /* 16 */
    --k3-segmented-list-item-shape: var(
      --k3-sys-shape-corner-extra-small,
      0.25rem
    ); /* 4 — legacy alias of --k3-segmented-list-item-container-shape */
    --k3-segmented-list-item-hover-shape: var(
      --k3-sys-shape-corner-medium,
      0.75rem
    ); /* 12 — legacy alias of --k3-segmented-list-item-hover-container-shape */
    --k3-segmented-list-item-selected-shape: var(
      --k3-segmented-list-container-shape,
      1rem
    ); /* legacy alias of --k3-segmented-list-item-selected-container-shape */
    /* Leading reservation — per list (never inherited by nested lists) */
    --_k3-list-leading-reserve-display: none;
    --_k3-list-leading-reserve: 0px;
    --_k3-list-leading-reserve-outset: 0px;
    --_k3-list-video-outset: 0px;
  }
  :host([hidden]) {
    display: none;
  }

  /* Density — 4 dp shorter rows per step (floor -3) */
  :host([density='-1']),
  :host([density='compact']) {
    --k3-list-density-scale: -1;
  }
  :host([density='-2']) {
    --k3-list-density-scale: -2;
  }
  :host([density='-3']) {
    --k3-list-density-scale: -3;
  }

  .list {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    padding-block: var(--k3-list-padding-block, 0px);
    list-style: none;
    background: var(--k3-list-bg, transparent);
    border-radius: var(--k3-sys-shape-corner-large, 1rem);
    max-height: var(--k3-list-max-height, none);
    /* Edge scrollbar via .k3-scroll — never Windows native arrows. */
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
  :host([variant='standard']) {
    --_k3-list-video-outset: var(
      --k3-list-item-leading-space,
      var(--k3-list-item-padding-inline, 1rem)
    );
  }
  :host([variant='standard']) .list {
    gap: 0;
  }
  :host([variant='standard']) ::slotted(k3-list-item) {
    --k3-list-item-radius: 0;
    margin-bottom: 0;
  }

  /* Dividers — standard only; inset via list tokens */
  :host([variant='standard']) ::slotted(k3-divider) {
    --k3-divider-space: 0;
    --k3-divider-inset-start-size: var(--k3-list-divider-inset-start-size, 1rem);
    --k3-divider-inset-end-size: var(--k3-list-divider-inset-end-size, 1.5rem);
  }
  :host([variant='standard']) ::slotted(hr) {
    box-sizing: border-box;
    width: 100%;
    margin: 0;
    border: 0;
    border-block-start: 1px solid var(--k3-sys-color-outline-variant);
  }
  :host([variant='standard']) ::slotted(hr[data-inset]),
  :host([variant='standard']) ::slotted(hr.inset) {
    width: auto;
    margin-inline: var(--k3-list-divider-inset-start-size, 1rem)
      var(--k3-list-divider-inset-end-size, 1.5rem);
  }
  :host([variant='segmented']) ::slotted(k3-divider),
  :host(:not([variant])) ::slotted(k3-divider),
  :host([variant='segmented']) ::slotted(hr),
  :host(:not([variant])) ::slotted(hr) {
    display: none;
  }

  /*
   * Segmented — gap via item margin-bottom (set in syncChildren, DPR-snapped).
   * Flex gap alone rounds unevenly at fractional devicePixelRatio (e.g. 1.25).
   */
  :host([variant='segmented']) .list,
  :host(:not([variant])) .list {
    gap: 0;
  }
  :host([variant='segmented']) ::slotted(k3-list-item),
  :host(:not([variant])) ::slotted(k3-list-item) {
    --k3-list-item-container-color: var(
      --k3-segmented-list-item-container-color,
      var(
        --k3-sys-color-surface-container-high,
        var(--k3-sys-color-surface-bright)
      )
    );
    --k3-list-item-disabled-container-color: var(
      --k3-segmented-list-item-disabled-container-color,
      var(
        --k3-segmented-list-item-container-color,
        var(
          --k3-sys-color-surface-container-high,
          var(--k3-sys-color-surface-bright)
        )
      )
    );
    --k3-list-item-radius-start: var(
      --k3-segmented-list-container-shape,
      1rem
    );
    --k3-list-item-radius-inner: var(
      --k3-segmented-list-item-container-shape,
      var(--k3-segmented-list-item-shape, 0.25rem)
    );
    --k3-list-item-radius-hover: var(
      --k3-segmented-list-item-hover-container-shape,
      var(--k3-segmented-list-item-hover-shape, 0.75rem)
    );
    --k3-list-item-radius-focus: var(
      --k3-segmented-list-item-focus-container-shape,
      var(--k3-sys-shape-corner-large, 1rem)
    );
    --k3-list-item-radius-selected: var(
      --k3-segmented-list-item-selected-container-shape,
      var(--k3-segmented-list-item-selected-shape, 1rem)
    );
    --k3-list-item-between-space: var(
      --k3-segmented-list-item-spacing,
      0.75rem
    ); /* 12 */
    --k3-list-item-image-shape: var(
      --k3-segmented-list-item-image-shape,
      var(--k3-sys-shape-corner-small, 0.5rem)
    );
    --k3-list-item-video-shape: var(
      --k3-segmented-list-item-video-shape,
      var(--k3-sys-shape-corner-small, 0.5rem)
    );
  }
  :host([variant='segmented']) ::slotted(k3-list-item[data-seg-gap]),
  :host(:not([variant])) ::slotted(k3-list-item[data-seg-gap]) {
    margin-bottom: var(--k3-segmented-list-segment-gap, 0.125rem) !important;
  }

  :host([embedded]) ::slotted(k3-list-item) {
    --k3-list-item-radius-end: inherit;
  }

  /*
   * Leading alignment — items without leading content reserve the width of
   * the widest media kind present (video › image › avatar › icon).
   */
  :host([data-leading-reserve]) {
    --_k3-list-leading-reserve-display: block;
  }
  :host([data-leading-reserve='video']) {
    --_k3-list-leading-reserve: var(--k3-list-item-video-width, 6.25rem);
  }
  :host([variant='standard'][data-leading-reserve='video']) {
    --_k3-list-leading-reserve-outset: var(
      --k3-list-item-leading-space,
      var(--k3-list-item-padding-inline, 1rem)
    );
  }
  :host([data-leading-reserve='image']) {
    --_k3-list-leading-reserve: var(--k3-list-item-image-width, 3.5rem);
  }
  :host([data-leading-reserve='avatar']) {
    --_k3-list-leading-reserve: var(--k3-list-item-avatar-size, 2.5rem);
  }
  :host([data-leading-reserve='icon']) {
    --_k3-list-leading-reserve: var(--k3-list-item-icon-size, 1.5rem);
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
