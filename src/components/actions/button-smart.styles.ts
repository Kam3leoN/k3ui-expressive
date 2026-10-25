import { css, unsafeCSS } from 'lit';
import {
  ButtonSmartFadeDp,
  ButtonSmartGlyphDp,
  ButtonSmartGridGapDp,
  ButtonSmartHeightDp,
  ButtonSmartIconBoxDp,
  ButtonSmartInsetDp,
  ButtonSmartLabelGapDp,
  ButtonSmartLabelSizeDp,
  ButtonSmartPadInlineEndDp,
  ButtonSmartPadInlineStartDp,
  ButtonSmartRadiusOnDp,
  ButtonSmartSubtitleSizeDp,
} from './button-smart.specs.js';

/** Fallbacks in CSS px (= AOSP dp). Runtime overrides via devicePixelSnap. */
const px = (dp: number) => unsafeCSS(`${dp}px`);

/**
 * Button Smart — shadow styles (tile chrome + marquee).
 *
 * Geometry matches AOSP `qs_tile_*` (height 80 · padding 12 · icon box 56 ·
 * glyph 20 · start pad 16 · grid gap 8). Runtime sets snapped `--k3-button-smart-*`
 * px vars so fractional DPR (Windows 125%) stays integer device pixels.
 *
 * OFF keeps a dark charcoal QS surface for strong contrast on light themes
 * (override via `--k3-button-smart-off-*`). ON uses M3 `primary-container`.
 *
 * Light-DOM 2-col layout: adopt {@link buttonSmartGridStyles} (`.btn-smart-grid`).
 */
export const buttonSmartStyles = css`
  :host {
    /* OFF — charcoal QS (theme-independent contrast; override with M3 if desired) */
    --k3-button-smart-off-bg: #37343a;
    --k3-button-smart-off-icon-bg: #48454c;
    --k3-button-smart-off-fg: #e7e2ea;
    /* ON — M3 primary container (Material You QS tile) */
    --k3-button-smart-on-bg: var(--k3-sys-color-primary-container);
    --k3-button-smart-on-icon-bg: var(--k3-sys-color-primary);
    --k3-button-smart-on-icon-fg: var(--k3-sys-color-on-primary);
    --k3-button-smart-on-fg: var(--k3-sys-color-on-primary-container);

    --k3-button-smart-height: ${px(ButtonSmartHeightDp)};
    --k3-button-smart-inset: ${px(ButtonSmartInsetDp)};
    --k3-button-smart-pad-inline-start: ${px(ButtonSmartPadInlineStartDp)};
    --k3-button-smart-pad-inline-end: ${px(ButtonSmartPadInlineEndDp)};
    --k3-button-smart-icon-size: ${px(ButtonSmartIconBoxDp)};
    --k3-button-smart-glyph: ${px(ButtonSmartGlyphDp)};
    --k3-button-smart-radius-off: calc(var(--k3-button-smart-height) / 2);
    --k3-button-smart-radius-on: ${px(ButtonSmartRadiusOnDp)};
    --k3-button-smart-fade: ${px(ButtonSmartFadeDp)};
    --k3-button-smart-label-gap: ${px(ButtonSmartLabelGapDp)};
    --k3-button-smart-label-size: ${px(ButtonSmartLabelSizeDp)};
    --k3-button-smart-subtitle-size: ${px(ButtonSmartSubtitleSizeDp)};
    --k3-button-smart-duration: var(
      --k3-sys-motion-duration-spatial-fast,
      350ms
    );
    --k3-button-smart-ease: var(
      --k3-sys-motion-easing-emphasized,
      var(--k3-sys-motion-easing-spatial-fast, cubic-bezier(0.2, 0, 0, 1))
    );
    --k3-button-smart-marquee-gap: 0px;

    display: block;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    vertical-align: middle;
  }

  :host([disabled]) {
    pointer-events: none;
    opacity: 0.38;
  }

  .tile {
    display: flex;
    align-items: center;
    gap: var(--k3-button-smart-label-gap);
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    height: var(--k3-button-smart-height);
    padding-block: var(--k3-button-smart-inset);
    padding-inline-start: var(--k3-button-smart-pad-inline-start);
    padding-inline-end: var(--k3-button-smart-pad-inline-end);
    border: none;
    margin: 0;
    cursor: pointer;
    font: inherit;
    text-align: start;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
    background-color: var(--k3-button-smart-off-bg);
    color: var(--k3-button-smart-off-fg);
    border-radius: var(--k3-button-smart-radius-off);
    transition:
      border-radius var(--k3-button-smart-duration) var(--k3-button-smart-ease),
      background-color var(--k3-button-smart-duration) var(--k3-button-smart-ease),
      color var(--k3-button-smart-duration) var(--k3-button-smart-ease);
  }

  .tile:focus,
  .tile:focus-visible {
    outline: none;
  }

  :host([active]) .tile {
    background-color: var(--k3-button-smart-on-bg);
    color: var(--k3-button-smart-on-fg);
    border-radius: var(--k3-button-smart-radius-on);
  }

  .icon {
    flex: none;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    width: var(--k3-button-smart-icon-size);
    height: var(--k3-button-smart-icon-size);
    border-radius: 50%;
    background-color: var(--k3-button-smart-off-icon-bg);
    color: var(--k3-button-smart-off-fg);
    font-family: 'Material Symbols Rounded', sans-serif;
    font-size: var(--k3-button-smart-glyph);
    line-height: 1;
    font-weight: normal;
    speak: never;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
    overflow: hidden;
    transition:
      border-radius var(--k3-button-smart-duration) var(--k3-button-smart-ease),
      background-color var(--k3-button-smart-duration) var(--k3-button-smart-ease),
      color var(--k3-button-smart-duration) var(--k3-button-smart-ease),
      font-variation-settings var(--k3-button-smart-duration)
        var(--k3-button-smart-ease);
  }

  :host([active]) .icon {
    border-radius: calc(
      var(--k3-button-smart-radius-on) - var(--k3-button-smart-inset) * 0.35
    );
    background-color: var(--k3-button-smart-on-icon-bg);
    color: var(--k3-button-smart-on-icon-fg);
    font-variation-settings:
      'FILL' 1,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }

  .icon ::slotted(*),
  .icon svg,
  .icon img,
  .icon .ms,
  .icon i {
    width: var(--k3-button-smart-glyph);
    height: var(--k3-button-smart-glyph);
    display: block;
    fill: currentColor;
    color: inherit;
    font-size: var(--k3-button-smart-glyph);
    line-height: 1;
  }

  .text {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .marquee {
    overflow: hidden;
    white-space: nowrap;
  }

  .marquee.scrolling {
    -webkit-mask-image: linear-gradient(
      to right,
      #000 0,
      #000 calc(100% - var(--k3-button-smart-fade)),
      transparent 100%
    );
    mask-image: linear-gradient(
      to right,
      #000 0,
      #000 calc(100% - var(--k3-button-smart-fade)),
      transparent 100%
    );
  }

  :host([dir='rtl']) .marquee.scrolling,
  .marquee.scrolling:dir(rtl) {
    -webkit-mask-image: linear-gradient(
      to left,
      #000 0,
      #000 calc(100% - var(--k3-button-smart-fade)),
      transparent 100%
    );
    mask-image: linear-gradient(
      to left,
      #000 0,
      #000 calc(100% - var(--k3-button-smart-fade)),
      transparent 100%
    );
  }

  .track {
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    max-width: none;
    gap: var(--k3-button-smart-marquee-gap, 0px);
    will-change: transform;
  }

  .label {
    max-width: none;
    flex: 0 0 auto;
    font-size: var(--k3-button-smart-label-size);
    font-weight: 500;
    line-height: 1.25;
    white-space: nowrap;
  }

  .label.ghost {
    display: none;
  }

  .marquee.scrolling .label.ghost {
    display: block;
    max-width: none;
    flex: 0 0 auto;
  }

  .subtitle {
    font-size: var(--k3-button-smart-subtitle-size);
    font-weight: 400;
    line-height: 1.3;
    opacity: 0.85;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .subtitle[hidden] {
    display: none !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .tile,
    .icon {
      transition: none;
    }

    .marquee:not(.scrolling) .label,
    .marquee {
      text-overflow: ellipsis;
    }
  }
`;

/**
 * Light-DOM helper — 2-column Quick Settings grid.
 *
 * Gap fallback 8dp (`qs_tile_margin_horizontal`). Prefer runtime snap via
 * `k3-button-smart` (sets `gap` on a parent `.btn-smart-grid`).
 *
 * ```html
 * <div class="btn-smart-grid">
 *   <k3-button-smart label="Wi‑Fi" active></k3-button-smart>
 *   <k3-button-smart label="Bluetooth"></k3-button-smart>
 *   <k3-button-smart class="btn-smart--span-2" label="Hotspot"></k3-button-smart>
 * </div>
 * ```
 */
export const buttonSmartGridStyles = css`
  .btn-smart-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${px(ButtonSmartGridGapDp)};
  }

  .btn-smart-grid--4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .btn-smart-grid > .btn-smart--span-2,
  .btn-smart-grid > [span-2],
  .btn-smart-grid > [span='2'] {
    grid-column: span 2;
  }
`;
