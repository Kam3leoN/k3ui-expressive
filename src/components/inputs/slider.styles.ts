import { css } from 'lit';

/**
 * M3 Expressive slider chrome — geometry via CSS vars from size tokens.
 * @see https://m3.material.io/components/sliders/specs
 */
export const sliderStyles = css`
  /* Interpolable press vars — handle width + segment pad share one clock. */
  @property --k3-slider-hw {
    syntax: '<length>';
    inherits: true;
    initial-value: 4px;
  }
  @property --k3-slider-pad {
    syntax: '<length>';
    inherits: true;
    initial-value: 8px;
  }
  /* thumbTrackGap alone — centered midpoint (no half-handle). */
  @property --k3-slider-gap {
    syntax: '<length>';
    inherits: true;
    initial-value: 4px;
  }

  :host {
    display: block;
    position: relative;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    /* Resting — stay in flow; elevated only while the value bubble is shown */
    z-index: 0;
    --k3-slider-track: var(--k3-sys-color-secondary-container);
    --k3-slider-active: var(--k3-sys-color-primary);
    --k3-slider-handle: var(--k3-sys-color-primary);
    /*
     * Stop COLORS (never reuse for size — cssVars sets --k3-slider-stop-size).
     * M3: inactive = on-secondary-container (reads on track);
     *      active = on-primary (reads on progress).
     */
    --k3-slider-stop: var(--k3-sys-color-on-secondary-container);
    --k3-slider-stop-on-active: var(--k3-sys-color-on-primary);
    --k3-slider-stop-size: 4px;
    --k3-slider-icon: var(--k3-sys-color-on-primary);
    --k3-slider-icon-inactive: var(--k3-sys-color-on-secondary-container);
    --k3-slider-icon-edge: calc(
      (var(--k3-slider-track-h, 40px) - var(--k3-slider-icon-size, 24px)) / 2
    );
    --k3-slider-press-dur: var(--k3-sys-motion-duration-spatial-fast, 200ms);
    --k3-slider-press-ease: var(
      --k3-sys-motion-easing-expressive-spatial,
      cubic-bezier(0.2, 0, 0, 1)
    );
    color: var(--k3-sys-color-on-surface);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  /* Temporary elevation while dragging — bubble must clear sibling chrome (FAB play, etc.) */
  :host([data-vi-active]) {
    z-index: var(--k3-slider-vi-elevate-z, 40);
  }
  /* Color roles — active + handle + on-active stops/icon. */
  :host([color='secondary']) {
    --k3-slider-active: var(--k3-sys-color-secondary);
    --k3-slider-handle: var(--k3-sys-color-secondary);
    --k3-slider-stop-on-active: var(--k3-sys-color-on-secondary);
    --k3-slider-icon: var(--k3-sys-color-on-secondary);
  }
  :host([color='tertiary']) {
    --k3-slider-active: var(--k3-sys-color-tertiary);
    --k3-slider-handle: var(--k3-sys-color-tertiary);
    --k3-slider-stop-on-active: var(--k3-sys-color-on-tertiary);
    --k3-slider-icon: var(--k3-sys-color-on-tertiary);
  }
  :host([color='error']) {
    --k3-slider-active: var(--k3-sys-color-error);
    --k3-slider-handle: var(--k3-sys-color-error);
    --k3-slider-stop-on-active: var(--k3-sys-color-on-error);
    --k3-slider-icon: var(--k3-sys-color-on-error);
  }
  /*
   * Disabled — M3 per-token opacities mixed onto surface (opaque).
   * Do NOT mix with transparent: H vs V tracks composite over different
   * backdrops (grid / gaps) and look mismatched.
   * inactive 12% · active + handle 38%.
   */
  :host([disabled]) {
    pointer-events: none;
    --k3-slider-track: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface) 12%,
      var(--k3-sys-color-surface)
    );
    --k3-slider-active: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface) 38%,
      var(--k3-sys-color-surface)
    );
    --k3-slider-handle: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface) 38%,
      var(--k3-sys-color-surface)
    );
    --k3-slider-stop: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface) 38%,
      var(--k3-sys-color-surface)
    );
    --k3-slider-stop-on-active: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface) 38%,
      var(--k3-sys-color-surface)
    );
    --k3-slider-icon: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface) 38%,
      var(--k3-sys-color-surface)
    );
    --k3-slider-icon-inactive: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface) 38%,
      var(--k3-sys-color-surface)
    );
    color: color-mix(
      in srgb,
      var(--k3-sys-color-on-surface) 38%,
      var(--k3-sys-color-surface)
    );
  }
  :host([orientation='vertical']) {
    display: inline-flex;
    width: auto;
    /* Content height = label + ± addons + track (track owns verticalLen). */
    height: auto;
    max-width: none;
  }

  .root {
    display: block;
    width: 100%;
    min-width: 0;
  }
  :host([orientation='vertical']) .root {
    width: auto;
  }

  /*
   * Rail = start · stack(label+area) · end.
   * Label sits in the stack → flush with track start (M3), even when ± show.
   * Vertical: column-reverse → end(+) top, start(−) bottom.
   */
  .rail {
    display: flex;
    flex-direction: row;
    /* flex-end → ± share the area row (below the label), not the label mid. */
    align-items: flex-end;
    gap: var(--k3-sys-spacing-space200, 1rem);
    width: 100%;
    min-width: 0;
  }
  :host([orientation='vertical']) .rail {
    flex-direction: column-reverse;
    /* flex-end = track column (area is last in the stack row), not label mid. */
    align-items: flex-end;
    width: auto;
    height: auto;
  }

  .stack {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    /* M3: 4dp between label and track */
    gap: 4px;
    flex: 1 1 auto;
    min-width: 0;
  }
  :host([orientation='vertical']) .stack {
    flex: 0 0 auto;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    width: auto;
  }

  .label {
    display: none;
    flex-direction: row;
    align-items: center;
    gap: var(--k3-sys-spacing-space100, 0.5rem);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    line-height: var(--k3-sys-typescale-label-large-line-height, 1.25rem);
    font-weight: var(--k3-sys-typescale-label-large-weight, 500);
    color: var(--k3-sys-color-on-surface);
    min-width: 0;
  }
  .label.has {
    display: inline-flex;
  }
  .label-icon {
    display: none;
    flex: 0 0 auto;
    flex-shrink: 0;
    box-sizing: border-box;
    width: 1.25rem;
    height: 1.25rem;
    aspect-ratio: 1 / 1;
    font-size: 1.25rem;
    line-height: 1;
    color: var(--k3-sys-color-on-surface);
    overflow: visible;
  }
  .label-icon.has {
    display: inline-grid;
    place-items: center;
  }
  /* Keep Material Symbol box square — writing-mode / rotate must not squash it. */
  .label-icon ::slotted(*) {
    display: grid !important;
    place-items: center !important;
    box-sizing: border-box !important;
    width: 1.25rem !important;
    height: 1.25rem !important;
    min-width: 1.25rem !important;
    min-height: 1.25rem !important;
    aspect-ratio: 1 / 1 !important;
    flex-shrink: 0 !important;
    font-size: 1.25rem !important;
    line-height: 1 !important;
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
    overflow: visible !important;
  }
  .label-text {
    min-width: 0;
  }
  /*
   * Vertical — rotate −90° (transform, not writing-mode) so ligature icons
   * stay square. Layout slot ≈ line-height; overflow paints along the track.
   */
  :host([orientation='vertical']) .label.has {
    writing-mode: horizontal-tb;
    transform: rotate(-90deg);
    transform-origin: center center;
    white-space: nowrap;
    flex: 0 0 auto;
    width: 1.5rem;
    max-height: none;
    justify-content: flex-start;
    align-self: flex-end; /* flush with track start (min / bottom) */
    overflow: visible;
  }

  .addon {
    display: none;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
  }
  .addon.has {
    display: inline-flex;
  }
  /* Match area cross-size so ± sit on the track centerline. */
  :host(:not([orientation='vertical'])) .addon.has {
    height: var(--k3-slider-handle-h, 44px);
  }
  :host([orientation='vertical']) .addon.has {
    width: var(--k3-slider-handle-h, 44px);
  }
  /* Range already has two handles — no ± step affordances. */
  :host([variant='range']) .addon {
    display: none;
  }

  .area {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    /* ≥ handle / 48dp target so the input hit area isn’t clipped */
    min-height: max(
      var(--k3-slider-handle-h, 44px),
      var(--k3-sys-touch-target, 3rem)
    );
    cursor: pointer;
    /* Single press clock — hw + pad + origin gap lockstep. */
    --k3-slider-hw: var(--k3-slider-hw-rest, 4px);
    --k3-slider-pad: var(--k3-slider-pad-rest, 8px);
    --k3-slider-gap: var(--k3-slider-gap-rest, 4px);
    transition:
      --k3-slider-hw var(--k3-slider-press-dur) var(--k3-slider-press-ease),
      --k3-slider-pad var(--k3-slider-press-dur) var(--k3-slider-press-ease),
      --k3-slider-gap var(--k3-slider-press-dur) var(--k3-slider-press-ease);
  }
  .area.pressed {
    --k3-slider-hw: var(--k3-slider-hw-press, 2px);
    --k3-slider-pad: var(--k3-slider-pad-press, 3px);
    --k3-slider-gap: var(--k3-slider-gap-press, 2px);
  }
  :host([orientation='vertical']) .area {
    flex-direction: column;
    flex: 0 0 auto;
    width: max(
      var(--k3-slider-handle-h, 44px),
      var(--k3-sys-touch-target, 3rem)
    );
    height: var(--k3-slider-vertical-len, 192px);
    min-height: var(--k3-slider-vertical-len, 192px);
    min-width: max(
      var(--k3-slider-handle-h, 44px),
      var(--k3-sys-touch-target, 3rem)
    );
  }

  .track {
    position: relative;
    width: 100%;
    height: var(--k3-slider-track-h, 16px);
    border-radius: var(--k3-slider-corner, 8px);
    background: transparent;
  }
  :host([orientation='vertical']) .track {
    width: var(--k3-slider-track-h, 16px);
    flex: 1 1 auto;
    align-self: center;
    height: 100%;
    min-height: 0;
  }

  .seg {
    position: absolute;
    inset-block: 0;
    border-radius: var(--k3-slider-inner-corner, 2px);
    pointer-events: none;
    z-index: 0;
    /* No own transition — geometry follows --k3-slider-pad on .area. */
  }
  :host([orientation='vertical']) .seg {
    inset-inline: 0;
    inset-block: auto;
  }
  .seg.active {
    background: var(--k3-slider-active);
  }
  .seg.inactive {
    background: var(--k3-slider-track);
  }
  /* Outer ends fully rounded */
  .seg.lead-cap {
    border-start-start-radius: var(--k3-slider-corner, 8px);
    border-end-start-radius: var(--k3-slider-corner, 8px);
  }
  .seg.trail-cap {
    border-start-end-radius: var(--k3-slider-corner, 8px);
    border-end-end-radius: var(--k3-slider-corner, 8px);
  }
  /* Vertical: min at bottom → lead = block-end, trail = block-start */
  :host([orientation='vertical']) .seg.lead-cap {
    border-end-start-radius: var(--k3-slider-corner, 8px);
    border-end-end-radius: var(--k3-slider-corner, 8px);
    border-start-start-radius: var(--k3-slider-inner-corner, 2px);
    border-start-end-radius: var(--k3-slider-inner-corner, 2px);
  }
  :host([orientation='vertical']) .seg.trail-cap {
    border-start-start-radius: var(--k3-slider-corner, 8px);
    border-start-end-radius: var(--k3-slider-corner, 8px);
    border-end-start-radius: var(--k3-slider-inner-corner, 2px);
    border-end-end-radius: var(--k3-slider-inner-corner, 2px);
  }
  /* top-to-bottom: min at top → lead = block-start, trail = block-end */
  :host([orientation='vertical'][top-to-bottom]) .seg.lead-cap {
    border-start-start-radius: var(--k3-slider-corner, 8px);
    border-start-end-radius: var(--k3-slider-corner, 8px);
    border-end-start-radius: var(--k3-slider-inner-corner, 2px);
    border-end-end-radius: var(--k3-slider-inner-corner, 2px);
  }
  :host([orientation='vertical'][top-to-bottom]) .seg.trail-cap {
    border-end-start-radius: var(--k3-slider-corner, 8px);
    border-end-end-radius: var(--k3-slider-corner, 8px);
    border-start-start-radius: var(--k3-slider-inner-corner, 2px);
    border-start-end-radius: var(--k3-slider-inner-corner, 2px);
  }
  /* Vertical flat join — block axis (start = min end when bottom-up). */
  :host([orientation='vertical']) .seg.flat-start {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
    border-start-start-radius: var(--k3-slider-inner-corner, 2px);
    border-start-end-radius: var(--k3-slider-inner-corner, 2px);
  }
  :host([orientation='vertical']) .seg.flat-end {
    border-start-start-radius: 0;
    border-start-end-radius: 0;
    border-end-start-radius: var(--k3-slider-inner-corner, 2px);
    border-end-end-radius: var(--k3-slider-inner-corner, 2px);
  }
  :host([orientation='vertical'][top-to-bottom]) .seg.flat-start {
    border-start-start-radius: 0;
    border-start-end-radius: 0;
    border-end-start-radius: var(--k3-slider-inner-corner, 2px);
    border-end-end-radius: var(--k3-slider-inner-corner, 2px);
  }
  :host([orientation='vertical'][top-to-bottom]) .seg.flat-end {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
    border-start-start-radius: var(--k3-slider-inner-corner, 2px);
    border-start-end-radius: var(--k3-slider-inner-corner, 2px);
  }

  /*
   * Handle = ≥48×48 input target (same idea as switch / radio / checkbox
   * target), with painted thumb inside + k3-state-layer.
   * Box ≥ max(touch-target, handle cross-axis) so md+ thumbs are not clipped.
   */
  .handle {
    --k3-slider-handle-target: max(
      var(--k3-sys-touch-target, 3rem),
      var(--k3-slider-handle-h, 44px)
    );
    position: absolute;
    top: 50%;
    box-sizing: border-box;
    width: var(--k3-slider-handle-target);
    height: var(--k3-slider-handle-target);
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: transparent;
    color: var(--k3-slider-handle);
    display: grid;
    place-items: center;
    z-index: 2;
    touch-action: none;
    transform: translate(-50%, -50%);
    transform-origin: center center;
  }
  .handle .thumb {
    box-sizing: border-box;
    width: var(--k3-slider-hw, 4px);
    height: var(--k3-slider-handle-h, 44px);
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: var(--k3-slider-handle);
    pointer-events: none;
    z-index: 1;
  }
  :host([orientation='vertical']) .handle {
    left: 50%;
    top: auto; /* bottom set inline — min at bottom */
    transform: translate(-50%, 50%);
  }
  :host([orientation='vertical']) .handle .thumb {
    width: var(--k3-slider-handle-h, 44px);
    height: var(--k3-slider-hw, 4px);
  }
  /* top-to-bottom: min at top — position via top %, center on axis. */
  :host([orientation='vertical'][top-to-bottom]) .handle {
    bottom: auto;
    transform: translate(-50%, -50%);
  }
  /* Focus ring = shared k3-focus-ring (3→6→3); keep handle chrome clean. */
  .handle.k3-focus-ring {
    --k3-focus-ring-offset: 3px;
  }

  /*
   * Stops — above segments, under handle.
   * Size = --k3-slider-stop-size · colors = --k3-slider-stop / -on-active
   * (do not overload --k3-slider-stop with a length — that made off-track dots invisible).
   */
  .stop {
    position: absolute;
    top: 50%;
    width: var(--k3-slider-stop-size, 4px);
    height: var(--k3-slider-stop-size, 4px);
    border-radius: 50%;
    background-color: var(--k3-slider-stop);
    pointer-events: none;
    z-index: 1;
    transform: translate(-50%, -50%);
  }
  .stop.on-active {
    background-color: var(--k3-slider-stop-on-active);
  }
  :host([orientation='vertical']) .stop {
    left: 50%;
    top: auto; /* bottom set inline */
    transform: translate(-50%, 50%);
  }
  :host([orientation='vertical'][top-to-bottom]) .stop {
    bottom: auto;
    transform: translate(-50%, -50%);
  }

  /* Tick / stop labels (optional) — outside the track, aligned to stops. */
  .stop-label {
    position: absolute;
    top: calc(100% + 4px);
    transform: translateX(-50%);
    font-size: var(--k3-sys-typescale-label-small-size, 0.6875rem);
    line-height: var(--k3-sys-typescale-label-small-line-height, 1rem);
    font-weight: 500;
    color: var(--k3-sys-color-on-surface-variant);
    white-space: nowrap;
    pointer-events: none;
    z-index: 1;
  }
  :host([orientation='vertical']) .stop-label {
    top: auto;
    left: calc(100% + 4px);
    transform: translateY(50%);
  }
  :host([orientation='vertical'][top-to-bottom]) .stop-label {
    transform: translateY(-50%);
  }

  /*
   * Inset icon — position set inline:
   * · active → leading edge
   * · inactive → sticky just past the handle (not the far track end)
   */
  .inset-icon {
    position: absolute;
    inset-block: 0;
    width: var(--k3-slider-icon-size, 24px);
    height: 100%;
    display: none;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 1;
    color: var(--k3-slider-icon);
    font-size: var(--k3-slider-icon-size, 24px);
    line-height: 1;
    overflow: visible;
    transition:
      inset-inline-start var(--k3-slider-press-dur) var(--k3-slider-press-ease),
      bottom var(--k3-slider-press-dur) var(--k3-slider-press-ease),
      color var(--k3-sys-motion-duration-effects-fast, 100ms)
        var(--k3-sys-motion-easing-standard, ease);
  }
  .inset-icon.has {
    display: flex;
  }
  .inset-icon.on-inactive {
    color: var(--k3-slider-icon-inactive);
  }
  /* Sticky follow while dragging — no lag behind the handle. */
  .area.pressed .inset-icon {
    transition-property: color;
  }
  .inset-icon-face {
    display: contents;
  }
  .inset-icon-face[hidden] {
    display: none !important;
  }
  .inset-icon [data-k3-icon],
  .inset-icon .ms {
    font-size: inherit;
    width: 1em;
    height: 1em;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  :host([orientation='vertical']) .inset-icon {
    inset-inline: 0;
    inset-block-start: auto;
    width: 100%;
    height: var(--k3-slider-icon-size, 24px);
  }

  /*
   * Value indicator — 4dp above the handle tip (all sizes).
   * Anchor = handle top center = track mid − handleH/2.
   */
  .value-indicator {
    position: absolute;
    z-index: 3;
    display: none;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: var(--k3-slider-vi-w, 48px);
    height: var(--k3-slider-vi-h, 44px);
    padding: 12px 16px;
    border-radius: var(--k3-sys-shape-corner-full, 999px);
    background: var(--k3-sys-color-inverse-surface);
    color: var(--k3-sys-color-inverse-on-surface);
    font-size: var(--k3-sys-typescale-label-large-size, 0.875rem);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
    top: calc(50% - var(--k3-slider-handle-h, 44px) / 2);
    transform: translate(
      -50%,
      calc(-100% - var(--k3-slider-vi-gap, 4px))
    );
  }
  .value-indicator.has {
    display: flex;
  }
  :host([orientation='vertical']) .value-indicator {
    top: auto; /* bottom set inline — same as handle */
    left: calc(50% - var(--k3-slider-handle-h, 44px) / 2);
    transform: translate(
      calc(-100% - var(--k3-slider-vi-gap, 4px)),
      50%
    );
  }
  :host([orientation='vertical'][top-to-bottom]) .value-indicator {
    bottom: auto;
    transform: translate(
      calc(-100% - var(--k3-slider-vi-gap, 4px)),
      -50%
    );
  }
`;
