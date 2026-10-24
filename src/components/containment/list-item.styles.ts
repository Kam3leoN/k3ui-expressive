import { css } from 'lit';
import { expandCollapseStyles } from './expand-collapse.styles.js';

/**
 * M3 Expressive list item styles.
 * @see https://m3.material.io/components/lists/specs
 */
export const listItemStyles = css`
  ${expandCollapseStyles}

  :host {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    /*
     * M3E segmented radii — parent k3-list sets tokens + data-seg.
     * Outer 24 · inner 4 · hover 12 · selected = outer.
     * Top/bottom tracked separately so expand / adjacent-open can morph one edge.
     */
    --k3-list-item-radius-start: 1.5rem; /* 24 — fallback if not under list */
    --k3-list-item-radius-end: var(--k3-list-item-radius-start);
    --k3-list-item-radius-inner: var(--k3-sys-shape-corner-extra-small, 0.25rem);
    --k3-list-item-radius-hover: var(--k3-sys-shape-corner-medium, 0.75rem);
    --k3-list-item-radius-selected: var(--k3-list-item-radius-start);
    --_seg-top: var(--k3-list-item-radius-inner);
    --_seg-bottom: var(--k3-list-item-radius-inner);
    --k3-list-item-radius: var(--_seg-top) var(--_seg-top) var(--_seg-bottom)
      var(--_seg-bottom);
    border-radius: var(--k3-list-item-radius);
    color: var(--k3-sys-color-on-surface);
    transition:
      border-radius var(--k3-sys-motion-duration-spatial-fast, 200ms)
        var(
          --k3-sys-motion-easing-spatial-fast,
          var(--k3-sys-motion-easing-expressive-spatial)
        ),
      background-color var(--k3-sys-motion-duration-effects-fast, 150ms)
        var(
          --k3-sys-motion-easing-effects-fast,
          var(--k3-sys-motion-easing-expressive-effects)
        ),
      box-shadow var(--k3-sys-motion-duration-spatial-fast, 200ms)
        var(
          --k3-sys-motion-easing-spatial-fast,
          var(--k3-sys-motion-easing-expressive-spatial)
        ),
      margin-bottom var(--k3-sys-motion-duration-spatial-fast, 200ms)
        var(
          --k3-sys-motion-easing-spatial-fast,
          var(--k3-sys-motion-easing-expressive-spatial)
        );
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

  .item {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 1rem; /* 16 */
    box-sizing: border-box;
    width: 100%;
    min-height: 3.5rem; /* 56 — one line */
    padding: 0.5rem 1rem; /* 8 · 16 */
    margin: 0;
    border: 0;
    border-radius: var(--k3-list-item-radius);
    /* M3E standard = transparent; segmented fill overrides below */
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: default;
    outline: none;
    overflow: visible;
    transition:
      border-radius var(--k3-sys-motion-duration-spatial-fast, 200ms)
        var(
          --k3-sys-motion-easing-spatial-fast,
          var(--k3-sys-motion-easing-expressive-spatial)
        ),
      background-color var(--k3-sys-motion-duration-effects-fast, 150ms)
        var(
          --k3-sys-motion-easing-effects-fast,
          var(--k3-sys-motion-easing-expressive-effects)
        ),
      box-shadow var(--k3-sys-motion-duration-spatial-fast, 200ms)
        var(
          --k3-sys-motion-easing-spatial-fast,
          var(--k3-sys-motion-easing-expressive-spatial)
        );
  }
  :host([interactive]) .item,
  :host([expandable]) .item {
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  /* —— Density (M3: 56 / 72 / 88) — lines attr or data-lines (auto) —— */
  :host([lines='two']) .item,
  :host([data-lines='two']) .item {
    min-height: 4.5rem; /* 72 */
    padding-block: 0.75rem; /* 12 */
  }
  :host([lines='three']) .item,
  :host([data-lines='three']) .item {
    min-height: 5.5rem; /* 88 */
    align-items: flex-start;
    padding-block: 0.75rem;
  }

  /*
   * Segmented (M3E) — fill + radius on .item; host stays transparent.
   * Inter-item 2dp = parent .list flex gap (equal for every pair).
   */
  :host([data-seg]) {
    display: block;
    background: transparent;
    overflow: visible;
    border-radius: 0;
    margin: 0;
    padding: 0;
  }
  :host([data-seg]) .item {
    background: var(
      --k3-sys-color-surface-container-high,
      var(--k3-sys-color-surface-bright)
    );
    border-radius: var(--k3-list-item-radius);
    overflow: hidden;
  }

  /*
   * Position — rest shape when not selected.
   * Selected uses full outer (below); :not([selected]) restores correctly on deselect.
   */
  :host([data-seg='first']:not([selected])) {
    --_seg-top: var(--k3-list-item-radius-start);
    --_seg-bottom: var(--k3-list-item-radius-inner);
    --k3-list-item-radius-end: var(--k3-list-item-radius-inner);
  }
  :host([data-seg='middle']:not([selected])) {
    --_seg-top: var(--k3-list-item-radius-inner);
    --_seg-bottom: var(--k3-list-item-radius-inner);
    --k3-list-item-radius-end: var(--k3-list-item-radius-inner);
  }
  :host([data-seg='last']:not([selected])) {
    --_seg-top: var(--k3-list-item-radius-inner);
    --_seg-bottom: var(--k3-list-item-radius-start);
    --k3-list-item-radius-end: var(--k3-list-item-radius-start);
  }
  :host([data-seg='only']:not([selected])) {
    --_seg-top: var(--k3-list-item-radius-start);
    --_seg-bottom: var(--k3-list-item-radius-start);
    --k3-list-item-radius-end: var(--k3-list-item-radius-start);
  }

  /* Embedded nested list — all inner; last/only bottom inherits end */
  :host([data-seg='embedded-first']:not([selected])),
  :host([data-seg='embedded-middle']:not([selected])) {
    --_seg-top: var(--k3-list-item-radius-inner);
    --_seg-bottom: var(--k3-list-item-radius-inner);
  }
  :host([data-seg='embedded-last']:not([selected])) {
    --_seg-top: var(--k3-list-item-radius-inner);
    --_seg-bottom: var(--k3-list-item-radius-end);
  }
  :host([data-seg='embedded-only']:not([selected])) {
    --_seg-top: var(--k3-list-item-radius-inner);
    --_seg-bottom: var(--k3-list-item-radius-end);
  }

  /* Closed sibling next to an open expandable — outer edge toward the gap */
  :host([data-seg][data-after-open]:not([expanded]):not([selected])) {
    --_seg-top: var(--k3-list-item-radius-start);
  }
  :host([data-seg][data-before-open]:not([expanded]):not([selected])) {
    --_seg-bottom: var(--k3-list-item-radius-start);
  }

  /* Expanded header — bottom → inner; top keeps position */
  :host([data-seg][expanded]:not([selected])) {
    --_seg-bottom: var(--k3-list-item-radius-inner);
    z-index: 1;
  }
  /* Gap header → expand body (same 2dp as inter-item spacer) */
  :host([data-seg][expandable][expanded]) .item {
    margin-bottom: 0.125rem;
  }

  /*
   * Selected — secondary-container on the surface (.item when segmented).
   * Full outer radius (selectedRadius = outerRadius).
   */
  :host([selected]:not([data-seg])) {
    background: var(--k3-sys-color-secondary-container);
    color: var(--k3-sys-color-on-secondary-container);
  }
  :host([selected]:not([data-seg])) .item {
    background: transparent;
    color: inherit;
  }
  :host([data-seg][selected]) {
    --_seg-top: var(--k3-list-item-radius-selected);
    --_seg-bottom: var(--k3-list-item-radius-selected);
    background: transparent;
    color: var(--k3-sys-color-on-secondary-container);
  }
  :host([data-seg][selected]) .item {
    background: var(--k3-sys-color-secondary-container);
    color: inherit;
  }

  /*
   * Hover / focus — morph free edges to medium; extremities keep outer.
   * Press uses data-pressed only (:active can stick after deselect).
   */
  :host([data-seg][interactive]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg][interactive]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)),
  :host([data-seg][expandable]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg][expandable]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)) {
    --_seg-top: var(--k3-list-item-radius-hover);
    --_seg-bottom: var(--k3-list-item-radius-hover);
  }
  :host([data-seg='first'][interactive]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg='first'][interactive]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)),
  :host([data-seg='first'][expandable]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg='first'][expandable]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)),
  :host([data-seg][data-after-open][interactive]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg][data-after-open][interactive]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)),
  :host([data-seg][data-after-open][expandable]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg][data-after-open][expandable]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)),
  :host([data-seg='only'][interactive]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg='only'][interactive]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)),
  :host([data-seg='only'][expandable]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg='only'][expandable]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)) {
    --_seg-top: var(--k3-list-item-radius-start);
  }
  :host([data-seg='last'][interactive]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg='last'][interactive]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)),
  :host([data-seg='last'][expandable]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg='last'][expandable]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)),
  :host([data-seg][data-before-open][interactive]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg][data-before-open][interactive]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)),
  :host([data-seg][data-before-open][expandable]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg][data-before-open][expandable]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)),
  :host([data-seg='only'][interactive]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg='only'][interactive]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)),
  :host([data-seg='only'][expandable]:not([disabled]):not([selected]):not([expanded]):hover),
  :host([data-seg='only'][expandable]:not([disabled]):not([selected]):not([expanded]):has(.item:focus-visible)) {
    --_seg-bottom: var(--k3-list-item-radius-start);
  }
  :host([data-seg][interactive]:not([disabled]):not([selected]):has(.item[data-pressed])),
  :host([data-seg][expandable]:not([disabled]):not([selected]):has(.item[data-pressed])) {
    --_seg-top: var(--k3-list-item-radius-selected);
    --_seg-bottom: var(--k3-list-item-radius-selected);
  }

  :host([interactive]:not([data-seg]):not([disabled]):not([selected])) .item:hover,
  :host([interactive]:not([data-seg]):not([disabled]):not([selected])) .item:focus-visible,
  :host([expandable]:not([data-seg]):not([disabled]):not([selected])) .item:hover,
  :host([expandable]:not([data-seg]):not([disabled]):not([selected])) .item:focus-visible {
    --k3-list-item-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
  }
  :host([interactive]:not([data-seg]):not([disabled]):not([selected])) .item[data-pressed],
  :host([expandable]:not([data-seg]):not([disabled]):not([selected])) .item[data-pressed] {
    --k3-list-item-radius: var(--k3-sys-shape-corner-large, 1rem);
  }

  :host([dragged]),
  :host([interactive][dragged]:not([disabled])) {
    --_seg-top: var(--k3-list-item-radius-selected);
    --_seg-bottom: var(--k3-list-item-radius-selected);
    --k3-list-item-radius: var(--k3-list-item-radius-selected);
    z-index: 2;
  }
  :host([dragged]:not([data-seg])) {
    background: var(
      --k3-sys-color-tertiary-container,
      var(--k3-sys-color-secondary-container)
    );
    color: var(
      --k3-sys-color-on-tertiary-container,
      var(--k3-sys-color-on-secondary-container)
    );
    box-shadow: var(--k3-sys-elevation-level4);
  }
  :host([dragged]:not([data-seg])) .item {
    background: transparent;
    color: inherit;
    box-shadow: none;
  }
  :host([dragged][data-seg]) {
    background: transparent;
    color: var(
      --k3-sys-color-on-tertiary-container,
      var(--k3-sys-color-on-secondary-container)
    );
  }
  :host([dragged][data-seg]) .item {
    background: var(
      --k3-sys-color-tertiary-container,
      var(--k3-sys-color-secondary-container)
    );
    color: inherit;
    box-shadow: var(--k3-sys-elevation-level4);
  }

  :host([disabled]) .item {
    opacity: var(--k3-sys-state-disabled-opacity, 0.38);
    pointer-events: none;
    cursor: not-allowed;
  }

  /* —— Leading —— */
  .leading:not(.has) {
    display: none;
  }
  .leading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-width: 1.5rem; /* 24 icon */
    min-height: 1.5rem;
    color: var(--k3-sys-color-on-surface-variant);
  }
  :host([selected]) .leading {
    color: inherit;
  }
  :host([lines='three']) .leading,
  :host([data-lines='three']) .leading {
    align-self: flex-start;
    margin-block-start: 0.125rem;
  }
  :host([leading='icon']) .leading {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 1.5rem;
  }
  :host([leading='avatar']) .leading {
    width: 2.5rem; /* 40 */
    height: 2.5rem;
    border-radius: var(--k3-sys-shape-corner-full, 9999px);
    overflow: hidden;
  }
  :host([leading='image']) .leading {
    width: 3.5rem; /* 56 */
    height: 3.5rem;
    border-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
    overflow: hidden;
  }
  :host([leading='video']) .leading {
    width: 6.25rem; /* 100 */
    height: 3.5rem; /* 56 */
    border-radius: var(--k3-sys-shape-corner-medium, 0.75rem);
    overflow: hidden;
  }
  :host([leading='video'][lines='three']) .leading,
  :host([leading='video'][data-lines='three']) .leading {
    width: 7.125rem; /* 114 */
    height: 4rem; /* 64 */
  }
  .leading.has ::slotted(img),
  .leading.has ::slotted(video),
  .leading.has ::slotted(*) {
    display: block;
    max-width: 100%;
    max-height: 100%;
  }
  :host([leading='avatar']) .leading ::slotted(*),
  :host([leading='image']) .leading ::slotted(*),
  :host([leading='video']) .leading ::slotted(*) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
  ::slotted([slot='leading']),
  ::slotted([slot='start']),
  ::slotted([slot='icon']) {
    font-family: var(
      --k3-sys-icon-font-family,
      'Material Symbols Rounded',
      sans-serif
    );
    font-size: 1.5rem;
    line-height: 1;
    display: inline-flex;
  }

  /* Auto selection indicator (radio / checkbox) */
  .sel-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    pointer-events: none;
  }
  .sel-indicator:not(.has) {
    display: none;
  }
  :host([hide-selection-indicator]) .sel-indicator {
    display: none !important;
  }

  /* —— Content —— */
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }
  .overline {
    font-size: var(--k3-sys-typescale-label-small-size, 0.6875rem);
    font-weight: var(--k3-sys-typescale-label-small-weight, 500);
    line-height: var(--k3-sys-typescale-label-small-line-height, 1rem);
    letter-spacing: var(--k3-sys-typescale-label-small-tracking, 0.03125rem);
    color: var(--k3-sys-color-on-surface-variant);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .overline:not(.has) {
    display: none;
  }
  .headline {
    font-size: var(--k3-sys-typescale-body-large-size, 1rem);
    font-weight: var(--k3-sys-typescale-body-large-weight, 400);
    line-height: var(--k3-sys-typescale-body-large-line-height, 1.5rem);
    color: var(--k3-sys-color-on-surface);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  :host([selected]) .headline {
    color: inherit;
  }
  .supporting {
    font-size: var(--k3-sys-typescale-body-medium-size, 0.875rem);
    line-height: var(--k3-sys-typescale-body-medium-line-height, 1.25rem);
    color: var(--k3-sys-color-on-surface-variant);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
  }
  :host([lines='three']) .supporting,
  :host([data-lines='three']) .supporting {
    -webkit-line-clamp: 2;
  }
  .supporting:not(.has) {
    display: none;
  }
  :host([selected]) .supporting,
  :host([selected]) .overline {
    color: inherit;
    opacity: 0.85;
  }

  /* —— Trailing —— */
  .trailing:not(.has) {
    display: none;
  }
  .trailing {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem; /* 12 */
    flex-shrink: 0;
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-label-small-size, 0.6875rem);
  }
  :host([lines='three']) .trailing,
  :host([data-lines='three']) .trailing {
    align-self: flex-start;
    margin-block-start: 0.125rem;
  }
  :host([selected]) .trailing {
    color: inherit;
  }
  .meta {
    white-space: nowrap;
    font-size: var(--k3-sys-typescale-label-small-size, 0.6875rem);
  }
  ::slotted([slot='trailing']),
  ::slotted([slot='end']) {
    font-family: var(
      --k3-sys-icon-font-family,
      'Material Symbols Rounded',
      sans-serif
    );
    font-size: 1.5rem;
    line-height: 1;
    display: inline-flex;
  }
  ::slotted([slot='meta']) {
    font-family: inherit;
    font-size: var(--k3-sys-typescale-label-small-size, 0.6875rem);
    white-space: nowrap;
  }

  /* Expand chevron — glyph via data-k3-icon ::before (no FOUC ligature text) */
  .chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    font-family: var(
      --k3-sys-icon-font-family,
      'Material Symbols Rounded',
      sans-serif
    );
    font-size: 1.5rem;
    line-height: 1;
    font-feature-settings: 'liga';
    font-variation-settings:
      'FILL' 0,
      'wght' 300,
      'GRAD' 0,
      'opsz' 24;
    color: var(--k3-sys-color-on-surface-variant);
    transition: transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
      var(--k3-sys-motion-easing-expressive-spatial);
    transform: rotate(0deg);
  }
  .chevron.open {
    transform: rotate(180deg);
  }
  .chevron:not(.has) {
    display: none;
  }

  /* Accordion body — shared expandCollapseStyles (.expand / .expand-inner) */
  .expand-body {
    padding: 0 1rem 1rem;
    color: var(--k3-sys-color-on-surface-variant);
    font-size: var(--k3-sys-typescale-body-medium-size);
  }
  /* Segmented expandable — nested list is its own segment stack (no pad) */
  :host([data-seg][expandable]) .expand-body {
    padding: 0;
  }
  :host([data-seg][expandable]) .expand-body ::slotted(k3-list) {
    display: block;
    width: 100%;
  }
  /* Plain text / non-list expand content — own inner segment surface */
  :host([data-seg][expandable]) .expand-body ::slotted(:not(k3-list)) {
    display: block;
    box-sizing: border-box;
    padding: 0.75rem 1rem;
    background: var(--k3-sys-color-surface-bright, var(--k3-sys-color-surface));
    border-radius: var(--k3-list-item-radius-inner)
      var(--k3-list-item-radius-inner) var(--k3-list-item-radius-end)
      var(--k3-list-item-radius-end);
    color: var(--k3-sys-color-on-surface-variant);
  }
  .expand:not(.has) {
    display: none;
  }

  /* Standard — square rest (no segment radii); select still morphs large */
  :host(:not([data-seg])) .item {
    --k3-list-item-radius: 0;
  }
  :host(:not([data-seg])[selected]) .item,
  :host(:not([data-seg])[interactive]:not([disabled])) .item:hover,
  :host(:not([data-seg])[interactive]:not([disabled])) .item:focus-visible,
  :host(:not([data-seg])[interactive]:not([disabled])) .item[data-pressed],
  :host(:not([data-seg])[interactive]:not([disabled])) .item:active,
  :host(:not([data-seg])[expandable]:not([disabled])) .item:hover,
  :host(:not([data-seg])[expandable]:not([disabled])) .item:focus-visible,
  :host(:not([data-seg])[expandable]:not([disabled])) .item[data-pressed],
  :host(:not([data-seg])[expandable]:not([disabled])) .item:active {
    --k3-list-item-radius: var(--k3-sys-shape-corner-large, 1rem);
  }

  /* Menu embedding — flatten expressive chrome */
  :host([style*='--k3-list-menu-reset']) .item,
  :host(.menu-item) .item {
    background: transparent;
    min-height: 3rem;
    border-radius: var(--k3-sys-shape-corner-medium);
  }

  @media (prefers-reduced-motion: reduce) {
    :host,
    .item,
    .chevron {
      transition: none !important;
    }
  }
`;