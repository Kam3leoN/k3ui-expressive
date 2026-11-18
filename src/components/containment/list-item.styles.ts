import { css } from 'lit';
import { expandCollapseStyles } from './expand-collapse.styles.js';

/**
 * M3 Expressive list item styles.
 *
 * Every visual decision goes through a `--k3-list-item-*` token whose
 * fallback is the default value — set the token on the item, the list or
 * any ancestor to theme it. Segmented lists remap the container / shape
 * tokens through `--k3-segmented-list-*` (see `list.styles.ts`).
 *
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
     * Segmented radii — parent k3-list sets tokens + data-seg.
     * Outer (start) · inner · hover · focus · selected.
     * Top/bottom tracked separately so expand / adjacent-open can morph one edge.
     * Free edges (not facing the list outline) follow the interaction state.
     */
    --k3-list-item-radius-start: 1.5rem; /* fallback if not under list */
    --k3-list-item-radius-end: var(--k3-list-item-radius-start);
    --k3-list-item-radius-inner: var(--k3-sys-shape-corner-extra-small, 0.25rem);
    --k3-list-item-radius-hover: var(--k3-sys-shape-corner-medium, 0.75rem);
    --k3-list-item-radius-focus: var(--k3-list-item-radius-hover);
    --k3-list-item-radius-selected: var(--k3-list-item-radius-start);
    /* Not inherited from an outer (folder) item */
    --_seg-state: initial;
    --_seg-free: var(--_seg-state, var(--k3-list-item-radius-inner));
    --_seg-top: var(--_seg-free);
    --_seg-bottom: var(--_seg-free);
    --k3-list-item-radius: var(--_seg-top) var(--_seg-top) var(--_seg-bottom)
      var(--_seg-bottom);
    /* Density — 4 dp per step, floor -3 (0 = roomiest). */
    --_density: calc(
      max(-3, var(--k3-list-density-scale, var(--k3-sys-density-scale, 0))) *
        var(--k3-sys-density-size, 0.25rem)
    );
    /* State layers */
    --_sl-hover-color: var(
      --k3-list-item-hover-state-layer-color,
      var(--k3-sys-color-on-surface)
    );
    --_sl-hover-opacity: var(
      --k3-list-item-hover-state-layer-opacity,
      var(--k3-sys-state-hover-opacity, 0.08)
    );
    --_sl-focus-color: var(
      --k3-list-item-focus-state-layer-color,
      var(--k3-sys-color-on-surface)
    );
    --_sl-focus-opacity: var(
      --k3-list-item-focus-state-layer-opacity,
      var(--k3-sys-state-focus-opacity, 0.1)
    );
    --_sl-pressed-color: var(
      --k3-list-item-pressed-state-layer-color,
      var(--k3-sys-color-on-surface)
    );
    --_sl-pressed-opacity: var(
      --k3-list-item-pressed-state-layer-opacity,
      var(--k3-sys-state-pressed-opacity, 0.1)
    );
    border-radius: var(--k3-list-item-radius);
    color: var(--k3-list-item-label-text-color, var(--k3-sys-color-on-surface));
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
  :host([hidden]) {
    display: none;
  }
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
  :host([selected]) {
    --_sl-hover-color: var(
      --k3-list-item-selected-hover-state-layer-color,
      var(--k3-sys-color-on-surface)
    );
    --_sl-hover-opacity: var(
      --k3-list-item-selected-hover-state-layer-opacity,
      var(--k3-sys-state-hover-opacity, 0.08)
    );
    --_sl-focus-color: var(
      --k3-list-item-selected-focus-state-layer-color,
      var(--k3-sys-color-on-surface)
    );
    --_sl-focus-opacity: var(
      --k3-list-item-selected-focus-state-layer-opacity,
      var(--k3-sys-state-focus-opacity, 0.1)
    );
    --_sl-pressed-color: var(
      --k3-list-item-selected-pressed-state-layer-color,
      var(--k3-sys-color-on-surface)
    );
    --_sl-pressed-opacity: var(
      --k3-list-item-selected-pressed-state-layer-opacity,
      var(--k3-sys-state-pressed-opacity, 0.1)
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
    /* Flex — trailing stays at the end even when leading is absent.
     * (Grid + display:none on .leading collapsed tracks → control sat mid-row.) */
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--k3-list-item-between-space, 1rem); /* 16 */
    box-sizing: border-box;
    width: 100%;
    min-height: calc(
      var(--k3-list-item-one-line-height, var(--k3-list-item-height, 3.5rem)) +
        var(--_density)
    ); /* 56 — one line */
    padding-block: var(
        --k3-list-item-one-line-top-space,
        var(--k3-list-item-padding-block, 0.5rem)
      )
      var(
        --k3-list-item-one-line-bottom-space,
        var(--k3-list-item-padding-block, 0.5rem)
      );
    padding-inline: var(
        --k3-list-item-leading-space,
        var(--k3-list-item-padding-inline, 1rem)
      )
      var(
        --k3-list-item-trailing-space,
        var(--k3-list-item-padding-inline, 1rem)
      );
    margin: 0;
    border: 0;
    border-radius: var(--k3-list-item-radius);
    background: var(--k3-list-item-container-color, transparent);
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: default;
    outline: none;
    /* visible — 48dp selection focus target must not clip */
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
  :host([data-actionable]) .item,
  :host([interactive]) .item,
  :host([expandable]) .item {
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  /* —— State layer tokens (hover · focus · pressed) —— */
  .item.k3-state-layer::after {
    background: var(--_sl-hover-color);
  }
  .item.k3-state-layer:hover::after {
    opacity: var(--_sl-hover-opacity);
  }
  :host([data-focus-visible]) .item.k3-state-layer:not(:hover)::after {
    background: var(--_sl-focus-color);
    opacity: var(--_sl-focus-opacity);
  }
  .item.k3-state-layer:active::after,
  .item.k3-state-layer[data-pressed]::after {
    background: var(--_sl-pressed-color);
    opacity: var(--_sl-pressed-opacity);
  }

  /* —— Action row (href) — full-surface link, row stays a list item —— */
  .link {
    all: unset;
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: inherit;
    cursor: pointer;
  }
  .link:focus-visible {
    outline: var(--k3-focus-ring-width, 3px) solid
      var(--k3-focus-ring-color, var(--k3-sys-color-secondary));
    outline-offset: var(--k3-focus-ring-offset, 2px);
  }
  :host([disabled]) .link {
    cursor: not-allowed;
  }

  /* —— Density (M3: 56 / 72 / 88) — lines attr or data-lines (auto) —— */
  :host([lines='two']) .item,
  :host([data-lines='two']) .item {
    min-height: calc(var(--k3-list-item-two-line-height, 4.5rem) + var(--_density)); /* 72 */
    padding-block: var(
        --k3-list-item-two-line-top-space,
        var(--k3-list-item-padding-block, 0.5rem)
      )
      var(
        --k3-list-item-two-line-bottom-space,
        var(--k3-list-item-padding-block, 0.5rem)
      );
  }
  :host([lines='three']) .item,
  :host([data-lines='three']) .item {
    min-height: calc(var(--k3-list-item-three-line-height, 5.5rem) + var(--_density)); /* 88 */
    align-items: flex-start;
    padding-block: var(--k3-list-item-three-line-top-space, 0.75rem)
      var(--k3-list-item-three-line-bottom-space, 0.75rem);
  }

  /*
   * Segmented (M3E) — default: fill + radius on .item; host transparent.
   * Expandable plain body: fill on HOST (revealed content lives in the same
   * surface as the trigger — M3 expansion / list guidelines).
   * Expandable + nested k3-list: folder pattern — header segment + 2dp gap +
   * child segments (terminal child closes the island).
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
    border-radius: var(--k3-list-item-radius);
    overflow: visible;
  }

  /*
   * Unified expandable (no nested k3-list) — one body, one shape.
   * Host owns fill + radii; .item is transparent row chrome.
   */
  :host([data-seg][expandable]:not([data-expand-folder])) {
    display: flex;
    flex-direction: column;
    background: var(--k3-list-item-container-color, transparent);
    border-radius: var(--k3-list-item-radius);
    overflow: hidden;
  }
  :host([data-seg][expandable]:not([data-expand-folder])) .item {
    background: transparent;
    border-radius: 0;
  }
  :host([data-seg][expandable][expanded]:not([data-expand-folder])) {
    background: var(
      --k3-list-item-expanded-container-color,
      var(--k3-list-item-container-color, transparent)
    );
  }

  /*
   * Position — rest shape when not selected.
   * Edges facing the list outline use the container shape (start); the
   * others are free and follow the interaction state (--_seg-state).
   */
  :host([data-seg='first']:not([selected])) {
    --_seg-top: var(--k3-list-item-radius-start);
    --_seg-bottom: var(--_seg-free);
    --k3-list-item-radius-end: var(--k3-list-item-radius-inner);
  }
  :host([data-seg='middle']:not([selected])) {
    --_seg-top: var(--_seg-free);
    --_seg-bottom: var(--_seg-free);
    --k3-list-item-radius-end: var(--k3-list-item-radius-inner);
  }
  :host([data-seg='last']:not([selected])) {
    --_seg-top: var(--_seg-free);
    --_seg-bottom: var(--k3-list-item-radius-start);
    --k3-list-item-radius-end: var(--k3-list-item-radius-start);
  }
  :host([data-seg='only']:not([selected])) {
    --_seg-top: var(--k3-list-item-radius-start);
    --_seg-bottom: var(--k3-list-item-radius-start);
    --k3-list-item-radius-end: var(--k3-list-item-radius-start);
  }

  /* Embedded nested list — free corners; terminal child closes the island */
  :host([data-seg='embedded-first']:not([selected])),
  :host([data-seg='embedded-middle']:not([selected])) {
    --_seg-top: var(--_seg-free);
    --_seg-bottom: var(--_seg-free);
  }
  :host([data-seg='embedded-last']:not([selected])),
  :host([data-seg='embedded-only']:not([selected])) {
    --_seg-top: var(--_seg-free);
    --_seg-bottom: var(--k3-list-item-radius-start);
  }

  /* Closed sibling next to an open expandable — outer edge toward the gap */
  :host([data-seg][data-after-open]:not([expanded]):not([selected])) {
    --_seg-top: var(--k3-list-item-radius-start);
  }
  :host([data-seg][data-before-open]:not([expanded]):not([selected])) {
    --_seg-bottom: var(--k3-list-item-radius-start);
  }

  /*
   * Expanded:
   * - Unified (plain expand): one surface for trigger + revealed body.
   *   Open item = island → uniform outer radius on all corners.
   * - Folder (nested k3-list): header top → outer, bottom free; 2dp gap;
   *   the nested terminal child closes the island with the outer radius.
   */
  :host([data-seg][expandable][expanded]:not([data-expand-folder]):not([selected])) {
    --_seg-top: var(--k3-list-item-radius-start);
    --_seg-bottom: var(--k3-list-item-radius-start);
    z-index: 1;
  }
  :host([data-seg][expandable][expanded][data-expand-folder]:not([selected])) {
    --_seg-top: var(--k3-list-item-radius-start);
    --_seg-bottom: var(--_seg-free);
    z-index: 1;
  }
  /* Folder only — 2dp between header segment and nested list */
  :host([data-seg][expandable][expanded][data-expand-folder]) .item {
    margin-bottom: var(--k3-segmented-list-segment-gap, 0.125rem);
  }
  :host([data-seg][expandable][expanded]:not([data-expand-folder])) .item {
    margin-bottom: 0;
  }

  /*
   * Interaction — free edges morph: focus → focus shape, hover / press →
   * hover shape (hover wins over focus). Extremities keep the outer radius.
   * Host attrs (data-focus-visible / data-pressed) are set from JS —
   * :host(:has()) does not see the shadow tree.
   */
  :host([data-seg][data-actionable]:not([selected]):not([expanded]:not([data-expand-folder]))[data-focus-visible]) {
    --_seg-state: var(--k3-list-item-radius-focus);
  }
  :host([data-seg][data-actionable]:not([selected]):not([expanded]:not([data-expand-folder])):hover),
  :host([data-seg][data-actionable]:not([selected]):not([expanded]:not([data-expand-folder]))[data-pressed]) {
    --_seg-state: var(--k3-list-item-radius-hover);
  }

  /*
   * Selected — full selected shape (all corners).
   */
  :host([data-seg][selected]) {
    --_seg-top: var(--k3-list-item-radius-selected);
    --_seg-bottom: var(--k3-list-item-radius-selected);
    background: transparent;
  }
  /* Unified expandable selected — fill stays on host */
  :host([data-seg][expandable][selected]:not([data-expand-folder])) {
    background: var(
      --k3-list-item-selected-container-color,
      var(--k3-sys-color-secondary-container)
    );
  }
  :host([data-seg][expandable][selected]:not([data-expand-folder])) .item {
    background: transparent;
  }

  /*
   * Selected surface (both variants) — secondary-container on .item.
   */
  :host([selected]:not([disabled])) .item {
    background: var(
      --k3-list-item-selected-container-color,
      var(--k3-sys-color-secondary-container)
    );
    color: var(
      --k3-list-item-selected-label-text-color,
      var(--k3-sys-color-on-secondary-container)
    );
  }
  :host([selected]:not([disabled])) {
    color: var(
      --k3-list-item-selected-label-text-color,
      var(--k3-sys-color-on-secondary-container)
    );
  }

  /* Standard — square rest; state shapes on the row */
  :host(:not([data-seg])) .item {
    --k3-list-item-radius: var(--k3-list-item-container-shape, 0);
  }
  :host(:not([data-seg])[data-actionable]:not([selected])[data-focus-visible]) .item:not(:hover):not([data-pressed]) {
    --k3-list-item-radius: var(
      --k3-list-item-focus-container-shape,
      var(--k3-sys-shape-corner-large, 1rem)
    );
  }
  :host(:not([data-seg])[data-actionable]:not([selected])) .item:hover,
  :host(:not([data-seg])[data-actionable]:not([selected])) .item[data-pressed] {
    --k3-list-item-radius: var(
      --k3-list-item-hover-container-shape,
      var(--k3-sys-shape-corner-medium, 0.75rem)
    );
  }
  :host(:not([data-seg])[selected]) .item {
    --k3-list-item-radius: var(
      --k3-list-item-selected-container-shape,
      var(--k3-sys-shape-corner-large, 1rem)
    );
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

  /*
   * Disabled — content at 38 % on-surface, media dimmed; the container keeps
   * its own (disabled) color so segmented rows stay readable as segments.
   */
  :host([disabled]) .item {
    pointer-events: none;
    cursor: not-allowed;
    background: var(--k3-list-item-disabled-container-color, transparent);
    color: color-mix(
      in srgb,
      var(--k3-list-item-disabled-label-text-color, var(--k3-sys-color-on-surface))
        var(--k3-list-item-disabled-label-text-opacity, 38%),
      transparent
    );
  }
  :host([data-seg][expandable][disabled]:not([data-expand-folder])) {
    background: var(--k3-list-item-disabled-container-color, transparent);
  }
  :host([selected][disabled]) .item,
  :host([data-seg][expandable][selected][disabled]:not([data-expand-folder])) {
    background: color-mix(
      in srgb,
      var(
          --k3-list-item-selected-disabled-container-color,
          var(--k3-sys-color-on-surface)
        )
        var(--k3-list-item-selected-disabled-container-opacity, 10%),
      transparent
    );
  }
  :host([data-seg][expandable][selected][disabled]:not([data-expand-folder])) .item {
    background: transparent;
  }
  :host([disabled]) .headline {
    color: color-mix(
      in srgb,
      var(--k3-list-item-disabled-label-text-color, var(--k3-sys-color-on-surface))
        var(--k3-list-item-disabled-label-text-opacity, 38%),
      transparent
    );
  }
  :host([disabled]) .overline {
    color: color-mix(
      in srgb,
      var(--k3-list-item-disabled-overline-color, var(--k3-sys-color-on-surface))
        var(--k3-list-item-disabled-overline-opacity, 38%),
      transparent
    );
  }
  :host([disabled]) .supporting {
    color: color-mix(
      in srgb,
      var(
          --k3-list-item-disabled-supporting-text-color,
          var(--k3-sys-color-on-surface)
        )
        var(--k3-list-item-disabled-supporting-text-opacity, 38%),
      transparent
    );
  }
  :host([disabled]) .leading {
    color: color-mix(
      in srgb,
      var(--k3-list-item-disabled-leading-color, var(--k3-sys-color-on-surface))
        var(--k3-list-item-disabled-leading-opacity, 38%),
      transparent
    );
  }
  :host([disabled]) .trailing {
    color: color-mix(
      in srgb,
      var(--k3-list-item-disabled-trailing-color, var(--k3-sys-color-on-surface))
        var(--k3-list-item-disabled-trailing-opacity, 38%),
      transparent
    );
  }
  :host([disabled]) ::slotted(img),
  :host([disabled]) ::slotted(picture),
  :host([disabled]) ::slotted(video),
  :host([disabled]) ::slotted(k3-avatar),
  :host([disabled]) ::slotted(k3-checkbox),
  :host([disabled]) ::slotted(k3-radio),
  :host([disabled]) ::slotted(k3-switch),
  :host([disabled]) ::slotted(k3-icon-button),
  :host([disabled]) ::slotted(k3-button) {
    opacity: var(--k3-list-item-disabled-media-opacity, 38%);
  }

  /* —— Leading —— */
  .leading:not(.has) {
    /*
     * Reserved by the parent list when siblings carry leading media, so
     * headlines stay aligned (display / size inherited from k3-list).
     */
    display: var(--_k3-list-leading-reserve-display, none);
    min-width: var(--_k3-list-leading-reserve, 0px);
    min-height: 0;
    margin-inline-start: calc(0px - var(--_k3-list-leading-reserve-outset, 0px));
  }
  .leading {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-width: var(--k3-list-item-icon-size, 1.5rem); /* 24 icon */
    min-height: var(--k3-list-item-icon-size, 1.5rem);
    color: var(--k3-list-item-leading-color, var(--k3-sys-color-on-surface-variant));
  }
  :host([selected]:not([disabled])) .leading {
    color: var(
      --k3-list-item-selected-leading-color,
      var(--k3-sys-color-on-secondary-container)
    );
  }
  :host([lines='three']) .leading,
  :host([data-lines='three']) .leading {
    align-self: flex-start;
    margin-block-start: var(--k3-list-item-three-line-top-offset, 0.25rem);
  }
  :host([lines='three'][data-leading='image']) .leading,
  :host([data-lines='three'][data-leading='image']) .leading,
  :host([lines='three'][data-leading='video']) .leading,
  :host([data-lines='three'][data-leading='video']) .leading {
    margin-block-start: 0;
  }
  :host([data-leading='icon']) .leading {
    width: var(--k3-list-item-icon-size, 1.5rem);
    height: var(--k3-list-item-icon-size, 1.5rem);
    font-size: var(--k3-list-item-icon-size, 1.5rem);
  }
  :host([data-leading='avatar']) .leading {
    width: var(--k3-list-item-avatar-size, 2.5rem); /* 40 */
    height: var(--k3-list-item-avatar-size, 2.5rem);
    border-radius: var(--k3-list-item-avatar-shape, var(--k3-sys-shape-corner-full, 9999px));
    overflow: hidden;
  }
  :host([data-leading='image']) .leading {
    width: var(--k3-list-item-image-width, 3.5rem); /* 56 */
    height: var(--k3-list-item-image-height, 3.5rem);
    border-radius: var(--k3-list-item-image-shape, 0);
    overflow: hidden;
  }
  :host([data-leading='video']) .leading {
    width: var(--k3-list-item-video-width, 6.25rem); /* 100 */
    height: var(--k3-list-item-video-height, 3.5rem); /* 56 */
    border-radius: var(--k3-list-item-video-shape, 0);
    overflow: hidden;
    /* Standard list: video bleeds to the leading edge */
    margin-inline-start: calc(0px - var(--_k3-list-video-outset, 0px));
  }
  .leading.has ::slotted(img),
  .leading.has ::slotted(video),
  .leading.has ::slotted(*) {
    display: block;
    max-width: 100%;
    max-height: 100%;
  }
  :host([data-leading='avatar']) .leading ::slotted(*),
  :host([data-leading='image']) .leading ::slotted(*),
  :host([data-leading='video']) .leading ::slotted(*) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
  ::slotted(img) {
    user-select: none;
    -webkit-user-drag: none;
    pointer-events: none;
  }
  ::slotted(k3-avatar[slot='leading']),
  ::slotted(k3-avatar[slot='start']) {
    font-size: var(--k3-list-item-avatar-font-size, inherit);
    font-weight: var(--k3-list-item-avatar-font-weight, inherit);
    line-height: var(--k3-list-item-avatar-line-height, inherit);
    letter-spacing: var(--k3-list-item-avatar-tracking, inherit);
  }
  :host([data-leading='avatar']) .leading {
    background: var(--k3-list-item-avatar-color, transparent);
    color: var(--k3-list-item-avatar-label-color, inherit);
  }
  ::slotted([slot='leading']),
  ::slotted([slot='start']),
  ::slotted([slot='icon']),
  ::slotted([slot='leading-icon']) {
    font-family: var(
      --k3-sys-icon-font-family,
      'Material Symbols Rounded',
      sans-serif
    );
    font-size: var(--k3-list-item-icon-size, 1.5rem);
    line-height: 1;
    display: inline-flex;
  }

  /* Selected option — filled icon glyphs */
  :host([selected]:not([selection='none'])) ::slotted(.ms),
  :host([selected]:not([selection='none'])) ::slotted([data-k3-icon]),
  :host([selected]:not([selection='none'])) ::slotted(.k3-icon) {
    font-variation-settings:
      'FILL' 1,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24 !important;
  }

  /*
   * Auto selection indicator — trailing end (M3).
   * pointer-events none: row click toggles; keep 48dp focus target visible.
   */
  .sel-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-width: 1.5rem;
    /* 24 dp layout box — the 48 dp target overflows instead of growing the row */
    height: 1.5rem;
    overflow: visible;
    pointer-events: none;
  }
  .sel-indicator:not(.has) {
    display: none;
  }
  :host([hide-selection-indicator]) .sel-indicator {
    display: none !important;
  }
  /* Indicator shown → it replaces the other trailing content */
  .trailing.sel-replaces > slot,
  .trailing.sel-replaces > .meta {
    display: none;
  }
  /* Icon-only control — hide empty label; keep 48dp .target / thumb target */
  .sel-indicator k3-checkbox::part(label),
  .sel-indicator k3-radio::part(label),
  .sel-indicator k3-switch::part(label) {
    display: none;
  }
  .sel-indicator k3-checkbox,
  .sel-indicator k3-radio,
  .sel-indicator k3-switch {
    flex-shrink: 0;
  }

  /* —— Content —— grows so trailing sits at the end */
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    flex: 1 1 auto;
    min-width: 0;
  }
  .overline {
    font-size: var(
      --k3-list-item-overline-font-size,
      var(--k3-sys-typescale-label-small-size, 0.6875rem)
    );
    font-weight: var(
      --k3-list-item-overline-font-weight,
      var(--k3-sys-typescale-label-small-weight, 500)
    );
    line-height: var(
      --k3-list-item-overline-line-height,
      var(--k3-sys-typescale-label-small-line-height, 1rem)
    );
    letter-spacing: var(
      --k3-list-item-overline-tracking,
      var(--k3-sys-typescale-label-small-tracking, 0.03125rem)
    );
    color: var(--k3-list-item-overline-color, var(--k3-sys-color-on-surface-variant));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .overline:not(.has) {
    display: none;
  }
  .headline {
    font-size: var(
      --k3-list-item-font-size,
      var(--k3-sys-typescale-body-large-size, 1rem)
    );
    font-weight: var(
      --k3-list-item-font-weight,
      var(--k3-sys-typescale-body-large-weight, 400)
    );
    line-height: var(
      --k3-list-item-line-height,
      var(--k3-sys-typescale-body-large-line-height, 1.5rem)
    );
    letter-spacing: var(
      --k3-list-item-tracking,
      var(--k3-sys-typescale-body-large-tracking, normal)
    );
    color: var(--k3-list-item-label-text-color, var(--k3-sys-color-on-surface));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* M3 Expressive / emphasized — title-medium emphasized weight */
  :host([emphasized]) .headline {
    font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
    font-weight: var(--k3-sys-typescale-title-medium-emphasized-weight, 600);
    line-height: var(--k3-sys-typescale-title-medium-line-height, 1.5rem);
    letter-spacing: var(--k3-sys-typescale-title-medium-tracking, 0.01rem);
  }
  :host([selected]:not([disabled])) .headline {
    color: var(
      --k3-list-item-selected-label-text-color,
      var(--k3-sys-color-on-secondary-container)
    );
  }
  .supporting {
    font-size: var(
      --k3-list-item-supporting-text-font-size,
      var(--k3-sys-typescale-body-medium-size, 0.875rem)
    );
    font-weight: var(
      --k3-list-item-supporting-text-font-weight,
      var(--k3-sys-typescale-body-medium-weight, 400)
    );
    line-height: var(
      --k3-list-item-supporting-text-line-height,
      var(--k3-sys-typescale-body-medium-line-height, 1.25rem)
    );
    letter-spacing: var(
      --k3-list-item-supporting-text-tracking,
      var(--k3-sys-typescale-body-medium-tracking, normal)
    );
    color: var(
      --k3-list-item-supporting-text-color,
      var(--k3-sys-color-on-surface-variant)
    );
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
  }
  :host([emphasized]) .supporting {
    font-weight: var(--k3-sys-typescale-body-medium-emphasized-weight, 500);
  }
  :host([lines='three']) .supporting,
  :host([data-lines='three']) .supporting {
    -webkit-line-clamp: 2;
  }
  .supporting:not(.has) {
    display: none;
  }
  :host([selected]:not([disabled])) .supporting {
    color: var(
      --k3-list-item-selected-supporting-text-color,
      var(--k3-sys-color-on-secondary-container)
    );
  }
  :host([selected]:not([disabled])) .overline {
    color: var(
      --k3-list-item-selected-overline-color,
      var(--k3-sys-color-on-secondary-container)
    );
  }

  /* —— Trailing (end of row) —— */
  .trailing:not(.has) {
    display: none;
  }
  .trailing {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem; /* 12 */
    flex: 0 0 auto;
    margin-inline-start: auto;
    color: var(--k3-list-item-trailing-color, var(--k3-sys-color-on-surface-variant));
    font-size: var(
      --k3-list-item-trailing-text-font-size,
      var(--k3-sys-typescale-label-small-size, 0.6875rem)
    );
    font-weight: var(
      --k3-list-item-trailing-text-font-weight,
      var(--k3-sys-typescale-label-small-weight, 500)
    );
    line-height: var(
      --k3-list-item-trailing-text-line-height,
      var(--k3-sys-typescale-label-small-line-height, 1rem)
    );
    letter-spacing: var(
      --k3-list-item-trailing-text-tracking,
      var(--k3-sys-typescale-label-small-tracking, normal)
    );
  }
  :host([lines='three']) .trailing,
  :host([data-lines='three']) .trailing {
    align-self: flex-start;
    margin-block-start: var(--k3-list-item-three-line-top-offset, 0.25rem);
  }
  :host([selected]:not([disabled])) .trailing {
    color: var(
      --k3-list-item-selected-trailing-color,
      var(--k3-sys-color-on-secondary-container)
    );
  }
  .meta {
    white-space: nowrap;
    font-size: inherit;
  }
  /*
   * Icon font only for icon trailing — not k3-kbd / chips / text
   * (Material Symbols on Latin labels → wide caps + false underlines).
   */
  ::slotted([slot='trailing'].ms),
  ::slotted([slot='trailing'][data-k3-icon]),
  ::slotted([slot='end'].ms),
  ::slotted([slot='end'][data-k3-icon]),
  ::slotted([slot='trailing-icon']) {
    font-family: var(
      --k3-sys-icon-font-family,
      'Material Symbols Rounded',
      sans-serif
    );
    font-size: var(--k3-list-item-icon-size, 1.5rem);
    line-height: 1;
    display: inline-flex;
  }
  ::slotted([slot='trailing']),
  ::slotted([slot='end']) {
    display: inline-flex;
    line-height: 1;
  }
  ::slotted([slot='meta']),
  ::slotted([slot='trailing-supporting-text']) {
    font-family: inherit;
    font-size: inherit;
    white-space: nowrap;
  }
  ::slotted(img[slot='trailing']),
  ::slotted(img[slot='end']) {
    width: var(--k3-list-item-image-width, 3.5rem);
    height: var(--k3-list-item-image-height, 3.5rem);
    border-radius: var(--k3-list-item-image-shape, 0);
    object-fit: cover;
  }
  ::slotted(video[slot='trailing']),
  ::slotted(video[slot='end']) {
    width: var(--k3-list-item-video-width, 6.25rem);
    height: var(--k3-list-item-video-height, 3.5rem);
    border-radius: var(--k3-list-item-video-shape, 0);
    object-fit: cover;
    margin-inline-end: calc(0px - var(--_k3-list-video-outset, 0px));
  }

  /*
   * Expand toggle — chevron (or slot toggle-icon) in a pill container.
   * Segmented: the container fills while open; standard stays transparent.
   */
  .toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    flex-shrink: 0;
    min-width: var(--k3-list-item-toggle-icon-container-width, 2rem); /* 32 */
    border-radius: var(
      --k3-list-item-toggle-icon-container-shape,
      var(--k3-sys-shape-corner-full, 9999px)
    );
    font-size: var(--k3-list-item-toggle-icon-size, 1.5rem);
    transition: background-color var(--k3-sys-motion-duration-short4, 200ms)
      var(--k3-sys-motion-easing-standard, ease);
  }
  .toggle:not(.has) {
    display: none;
  }
  :host([expandable]) .trailing {
    align-self: stretch;
  }
  :host([data-seg][expanded]) .toggle {
    background: var(
      --k3-list-item-expanded-toggle-icon-container-color,
      var(--k3-sys-color-surface-container-highest)
    );
  }
  ::slotted([slot='toggle-icon']) {
    display: inline-flex;
    font-size: inherit;
    line-height: 1;
    transition: transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
      var(--k3-sys-motion-easing-expressive-spatial);
  }
  :host([expanded]) ::slotted([slot='toggle-icon']) {
    transform: rotate(180deg);
  }

  /* Expand chevron — glyph via data-k3-icon ::before (no FOUC ligature text) */
  .chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--k3-list-item-toggle-icon-size, 1.5rem);
    height: var(--k3-list-item-toggle-icon-size, 1.5rem);
    font-family: var(
      --k3-sys-icon-font-family,
      'Material Symbols Rounded',
      sans-serif
    );
    font-size: var(--k3-list-item-toggle-icon-size, 1.5rem);
    line-height: 1;
    font-feature-settings: 'liga';
    font-variation-settings:
      'FILL' 0,
      'wght' 300,
      'GRAD' 0,
      'opsz' 24;
    color: var(--k3-list-item-trailing-color, var(--k3-sys-color-on-surface-variant));
    transition: transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
      var(--k3-sys-motion-easing-expressive-spatial);
    transform: rotate(0deg);
  }
  :host([selected]:not([disabled])) .chevron {
    color: inherit;
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
    color: var(--k3-list-item-supporting-text-color, var(--k3-sys-color-on-surface-variant));
    font-size: var(--k3-sys-typescale-body-medium-size);
  }
  /*
   * Segmented expandable:
   * - Nested k3-list → own segment stack (no pad on body)
   * - Plain content → inside host surface (padding only, no second fill)
   */
  :host([data-seg][expandable][data-expand-folder]) .expand-body {
    padding: 0;
  }
  :host([data-seg][expandable]:not([data-expand-folder])) .expand-body {
    padding: 0 1rem 1rem;
  }
  :host([data-seg][expandable]) .expand-body ::slotted(k3-list) {
    display: block;
    width: 100%;
  }
  :host([data-seg][expandable]:not([data-expand-folder])) .expand-body ::slotted(*) {
    display: block;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    background: transparent;
    border-radius: 0;
    color: inherit;
  }
  .expand:not(.has) {
    display: none;
  }

  /* Menu embedding — flatten expressive chrome */
  :host([style*='--k3-list-menu-reset']) .item,
  :host(.menu-item) .item {
    background: transparent;
    min-height: 3rem;
    border-radius: var(--k3-sys-shape-corner-medium);
  }

  @media (forced-colors: active) {
    :host([selected]:not([disabled])) .item {
      background: Highlight;
      color: HighlightText;
      forced-color-adjust: none;
    }
    :host([disabled]) .item,
    :host([disabled]) .headline,
    :host([disabled]) .overline,
    :host([disabled]) .supporting,
    :host([disabled]) .leading,
    :host([disabled]) .trailing {
      color: GrayText;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host,
    .item,
    .chevron,
    .toggle,
    ::slotted([slot='toggle-icon']) {
      transition: none !important;
    }
  }
`;
