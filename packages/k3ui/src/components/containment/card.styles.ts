import { css } from 'lit';

/**
 * Styles for `k3-card` — variants · orientation · media · tariff · interactive states.
 * @see https://m3.material.io/components/cards/specs
 */
export const cardStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    /* Host keeps ring outward; .card clips bleed media */
    border-radius: var(--k3-sys-shape-corner-medium);
  }
  :host([dismissible]) {
    touch-action: pan-y;
  }
  :host([dismissing]) {
    pointer-events: none;
    transition:
      opacity var(--k3-sys-motion-duration-medium2, 300ms)
        var(--k3-sys-motion-easing-expressive-effects, ease),
      transform var(--k3-sys-motion-duration-medium2, 300ms)
        var(--k3-sys-motion-easing-expressive-spatial, ease);
  }

  .card {
    --k3-card-radius: var(--k3-sys-shape-corner-medium); /* 12 — morphs on interaction */
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    border-radius: var(--k3-card-radius);
    background: var(--k3-sys-color-surface-container-highest);
    color: var(--k3-sys-color-on-surface);
    box-shadow: none;
    outline: none;
    /* overflow visible — k3-focus-ring outward; media self-clips via radius */
    overflow: visible;
    transition:
      border-radius var(--k3-sys-motion-duration-spatial-fast)
        var(
          --k3-sys-motion-easing-spatial-fast,
          var(--k3-sys-motion-easing-expressive-spatial)
        ),
      box-shadow var(--k3-sys-motion-duration-spatial-fast)
        var(
          --k3-sys-motion-easing-spatial-fast,
          var(--k3-sys-motion-easing-expressive-spatial)
        ),
      background-color var(--k3-sys-motion-duration-effects-fast)
        var(
          --k3-sys-motion-easing-effects-fast,
          var(--k3-sys-motion-easing-expressive-effects)
        );
  }

  /* —— Variants —— */
  :host([variant='filled']) .card,
  :host(:not([variant])) .card {
    background: var(--k3-sys-color-surface-container-highest);
  }
  :host([variant='outlined']) .card {
    background: var(--k3-sys-color-surface);
    box-shadow: inset 0 0 0 1px var(--k3-sys-color-outline-variant);
  }
  :host([variant='elevated']) .card {
    background: var(--k3-sys-color-surface-container-low);
    box-shadow: var(--k3-sys-elevation-level1);
  }

  /* —— Orientation —— */
  .card.horizontal {
    flex-direction: row;
    align-items: stretch;
    min-height: 15rem; /* 240dp */
    /* Shrink in grid tracks — never force parent overflow */
    min-width: 0;
    max-width: 100%;
  }
  .card.horizontal .body {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* —— Body —— */
  .body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem 1rem 0.75rem; /* 16 · 12 bottom */
    box-sizing: border-box;
    min-width: 0;
  }
  .card.vertical.has-media.media-inset.media-start .body {
    padding-block-start: 0.75rem;
  }

  /* Header row: drag-handle · avatar · titles · header-actions (overflow) */
  .header {
    display: flex;
    align-items: flex-start;
    gap: 1rem; /* 16 */
    min-width: 0;
  }
  .header:not(.has-avatar):not(.has-titles):not(.has-header-actions):not(
      .has-drag-handle
    ) {
    display: none;
  }
  .drag-handle {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    margin-block-start: 0.125rem;
    color: var(--k3-sys-color-on-surface-variant);
    cursor: grab;
    font-size: 1.25rem;
    line-height: 1;
    user-select: none;
    -webkit-user-select: none;
  }
  :host([dragged]) .drag-handle {
    cursor: grabbing;
  }
  .drag-handle[data-k3-icon]::before {
    content: attr(data-k3-icon);
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined',
      sans-serif;
    font-weight: normal;
    font-style: normal;
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    -webkit-font-smoothing: antialiased;
  }
  .avatar {
    flex: 0 0 auto;
    width: 2.5rem; /* 40 */
    height: 2.5rem;
    border-radius: var(--k3-sys-shape-corner-full, 9999px);
    overflow: hidden;
  }
  .avatar:not(.has) {
    display: none;
  }
  .avatar.has ::slotted(*) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .titles {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  .titles:not(.has) {
    display: none;
  }
  .header-actions {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-inline-start: auto;
  }
  .header-actions:not(.has) {
    display: none;
  }

  .headline {
    font-size: var(--k3-sys-typescale-title-medium-size);
    font-weight: var(--k3-sys-typescale-title-medium-emphasized-weight, 500);
    line-height: var(--k3-sys-typescale-title-medium-line-height);
    color: var(--k3-sys-color-on-surface);
  }
  .subhead {
    font-size: var(--k3-sys-typescale-title-small-size, 0.875rem);
    font-weight: var(--k3-sys-typescale-title-small-weight, 500);
    line-height: var(--k3-sys-typescale-title-small-line-height, 1.25rem);
    color: var(--k3-sys-color-on-surface);
  }
  .subhead:not(.has) {
    display: none;
  }
  .content {
    font-size: var(--k3-sys-typescale-body-medium-size);
    color: var(--k3-sys-color-on-surface-variant);
  }
  .content:empty {
    display: none;
  }

  /* —— Tariff / pricing (price · reduction · percent chip) —— */
  .tariff:not(.has) {
    display: none;
  }
  .tariff.has {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem; /* 8 */
    min-width: 0;
  }
  .price {
    font-size: var(--k3-sys-typescale-headline-small-size, 1.5rem);
    font-weight: var(--k3-sys-typescale-headline-small-emphasized-weight, 500);
    line-height: var(--k3-sys-typescale-headline-small-line-height, 2rem);
    letter-spacing: var(--k3-sys-typescale-headline-small-tracking, 0);
    color: var(--k3-sys-color-primary);
  }
  .price:not(.has) {
    display: none;
  }
  .price-was {
    font-size: var(--k3-sys-typescale-body-medium-size);
    font-weight: var(--k3-sys-typescale-body-medium-weight, 400);
    line-height: var(--k3-sys-typescale-body-medium-line-height, 1.25rem);
    color: var(--k3-sys-color-on-surface-variant);
    text-decoration: line-through;
    text-decoration-thickness: 1px;
  }
  .price-was:not(.has) {
    display: none;
  }
  .price-percent {
    display: inline-flex;
    align-items: center;
    align-self: center;
    min-width: 0;
  }
  .price-percent:not(.has) {
    display: none;
  }
  .price-percent ::slotted(k3-chip),
  .price-percent k3-chip {
    pointer-events: none; /* decorative discount chip */
  }
  /* Default percent chip — primary-container (sale badge) */
  .price-percent k3-chip::part(container) {
    background: var(--k3-sys-color-primary-container);
    color: var(--k3-sys-color-on-primary-container);
    box-shadow: none;
    cursor: default;
  }

  /* —— Interactive states (hovered · focused · pressed · dragged · disabled) —— */
  :host([interactive]) .card {
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  :host([interactive][disabled]) .card {
    cursor: not-allowed;
    opacity: var(--k3-sys-state-disabled-opacity, 0.38);
    pointer-events: none;
    box-shadow: none !important;
  }

  /* Hover — corner morph + elevation bump (filled/outlined → 1, elevated → 2) */
  :host([interactive]:not([disabled])) {
    border-radius: var(--k3-sys-shape-corner-medium);
  }
  :host([interactive]:not([disabled])) .card:hover,
  :host([interactive]:not([disabled])) .card:focus-visible {
    --k3-card-radius: var(--k3-sys-shape-corner-large);
    border-radius: var(--k3-card-radius);
  }
  :host([interactive]:not([disabled]):has(.card:hover)),
  :host([interactive]:not([disabled]):has(.card:focus-visible)) {
    border-radius: var(--k3-sys-shape-corner-large);
  }
  :host([interactive]:not([disabled]):has(.card[data-pressed])),
  :host([interactive]:not([disabled]):has(.card:active)) {
    border-radius: var(--k3-sys-shape-corner-large-increased);
  }

  :host([interactive][variant='filled']:not([disabled])) .card:hover,
  :host([interactive][variant='filled']:not([disabled])) .card:focus-visible,
  :host([interactive]:not([variant]):not([disabled])) .card:hover,
  :host([interactive]:not([variant]):not([disabled])) .card:focus-visible {
    box-shadow: var(--k3-sys-elevation-level1);
  }
  :host([interactive][variant='outlined']:not([disabled])) .card:hover,
  :host([interactive][variant='outlined']:not([disabled])) .card:focus-visible {
    box-shadow:
      inset 0 0 0 1px var(--k3-sys-color-outline),
      var(--k3-sys-elevation-level1);
  }
  :host([interactive][variant='elevated']:not([disabled])) .card:hover,
  :host([interactive][variant='elevated']:not([disabled])) .card:focus-visible {
    box-shadow: var(--k3-sys-elevation-level2);
  }

  /* Pressed — large-increased corners */
  :host([interactive]:not([disabled])) .card[data-pressed],
  :host([interactive]:not([disabled])) .card:active {
    --k3-card-radius: var(--k3-sys-shape-corner-large-increased);
    border-radius: var(--k3-card-radius);
  }
  :host([interactive][variant='elevated']:not([disabled])) .card[data-pressed],
  :host([interactive][variant='elevated']:not([disabled])) .card:active {
    box-shadow: var(--k3-sys-elevation-level1);
  }

  /* Dragged — lift + 16% state layer */
  :host([dragged]) .card,
  :host([interactive][dragged]:not([disabled])) .card {
    --k3-card-radius: var(--k3-sys-shape-corner-large);
    box-shadow: var(--k3-sys-elevation-level3);
    border-radius: var(--k3-card-radius);
  }
  :host([dragged][variant='elevated']) .card,
  :host([interactive][dragged][variant='elevated']:not([disabled])) .card {
    box-shadow: var(--k3-sys-elevation-level4);
  }
  :host([dragged]) .card.k3-state-layer::after,
  :host([interactive][dragged]:not([disabled])) .card.k3-state-layer::after {
    opacity: var(--k3-sys-state-dragged-opacity, 0.16);
  }
  :host([dragged]) {
    border-radius: var(--k3-sys-shape-corner-large);
  }

  /* —— Media — all 4 corners rounded (bleed + inset), tracks --k3-card-radius —— */
  .media:not(.has) {
    display: none;
  }
  .media.has {
    flex: 0 0 auto;
    overflow: hidden;
    background: var(--k3-sys-color-surface-container-highest);
    border-radius: var(--k3-card-radius);
    transition: border-radius var(--k3-sys-motion-duration-spatial-fast)
      var(
        --k3-sys-motion-easing-spatial-fast,
        var(--k3-sys-motion-easing-expressive-spatial)
      );
  }
  .media.has ::slotted(img),
  .media.has ::slotted(video),
  .media.has ::slotted(*) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }

  /* Vertical bleed — full width, 4 corners */
  .card.vertical .media.has.bleed {
    width: 100%;
    min-height: 8rem;
    max-height: 12rem;
    aspect-ratio: 16 / 9;
  }
  .card.vertical .media.has.bleed ::slotted(img),
  .card.vertical .media.has.bleed ::slotted(video) {
    min-height: 8rem;
    max-height: 12rem;
  }

  /* Vertical inset — 16dp offset, 4 corners */
  .card.vertical .media.has.inset {
    margin-block-start: 1rem;
    margin-inline: 1rem;
    min-height: 7rem;
    max-height: 11rem;
    aspect-ratio: 16 / 9;
  }
  /* Mid-card inset (after-header): body already pads */
  .card.vertical.media-after .media.has.inset {
    margin: 0.25rem 0 0;
    margin-inline: 0;
    width: 100%;
  }

  /* Horizontal bleed — start edge flush, 4 corners */
  .card.horizontal .media.has.bleed {
    flex: 0 1 auto;
    width: min(40%, 12rem);
    min-width: 0; /* allow shrink in narrow grid tracks */
    max-width: 12rem;
    align-self: stretch;
  }
  .card.horizontal .media.has.bleed ::slotted(img),
  .card.horizontal .media.has.bleed ::slotted(video) {
    min-height: 100%;
    aspect-ratio: auto;
  }

  /* Horizontal inset — 16dp pad, 4 corners */
  .card.horizontal .media.has.inset {
    flex: 0 1 auto;
    width: min(36%, 11rem);
    min-width: 0;
    max-width: 11rem;
    margin-block: 1rem;
    margin-inline-start: 1rem;
    align-self: stretch;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-block-start: 0.5rem;
    padding-block-end: 0.25rem;
    justify-content: flex-end;
  }
  .actions.align-start {
    justify-content: flex-start;
  }
  .actions:not(.has) {
    display: none;
  }

  @media (max-width: 599.98px) {
    .card.horizontal {
      flex-direction: column;
      min-height: 0;
    }
    .card.horizontal .media.has.bleed {
      width: 100%;
      min-width: 0;
      min-height: 8rem;
      max-height: 12rem;
      aspect-ratio: 16 / 9;
    }
    .card.horizontal .media.has.inset {
      width: auto;
      min-width: 0;
      margin-block: 1rem 0;
      margin-inline: 1rem;
      min-height: 7rem;
      max-height: 11rem;
      aspect-ratio: 16 / 9;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card,
    .media.has {
      transition: none !important;
    }
  }
`;