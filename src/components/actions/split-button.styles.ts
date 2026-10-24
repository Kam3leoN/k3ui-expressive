import { css, unsafeCSS } from 'lit';
import {
  SplitButtonGapDp,
  SplitButtonSizeDp,
  splitButtonTrailPadDp,
} from './split-button.specs.js';

const rem = (dp: number) => unsafeCSS(`${dp / 16}rem`);

const xs = SplitButtonSizeDp.xs;
const sm = SplitButtonSizeDp.sm;
const md = SplitButtonSizeDp.md;
const lg = SplitButtonSizeDp.lg;
const xl = SplitButtonSizeDp.xl;

/**
 * Styles for `k3-split-button`.
 *
 * @see ./split-button.specs.ts
 * @see https://m3.material.io/components/split-button/specs
 */
export const splitButtonStyles = css`
  :host {
    /* Small (default) — M3E Size · Small */
    --k3-sb-h: ${rem(sm.height)};
    --k3-sb-gap: ${rem(SplitButtonGapDp)};
    /* Outer = half height (true pill). CSS 50% = ellipse on wide segments. */
    --k3-sb-outer-r: calc(var(--k3-sb-h) / 2);
    --k3-sb-inner-r: ${rem(sm.inner)};
    --k3-sb-inner-r-hover: ${rem(sm.innerHover)};
    --k3-sb-inner-r-pressed: ${rem(sm.innerPressed)};
    --k3-sb-lead-pad-start: ${rem(sm.leadPadStart)};
    --k3-sb-lead-pad-end: ${rem(sm.leadPadEnd)};
    --k3-sb-lead-icon: ${rem(sm.leadIcon)};
    --k3-sb-lead-icon-gap: ${rem(sm.leadIconGap)};
    --k3-sb-trail-icon: ${rem(sm.trailIcon)};
    --k3-sb-trail-pad-start: ${rem(splitButtonTrailPadDp('sm'))};
    --k3-sb-trail-pad-end: ${rem(splitButtonTrailPadDp('sm'))};
    --k3-sb-chev-shift: ${rem(sm.chevShift)};
    --k3-sb-font-size: var(--k3-sys-typescale-label-large-size);
    --k3-sb-font-weight: var(--k3-sys-typescale-label-large-weight);
    /* Trailing = square H×H (true circle when selected) */
    --k3-sb-trail-w: var(--k3-sb-h);
    display: inline-flex;
    vertical-align: middle;
    /* XS/S visual < 48 — expand host hit area (M3 a11y) */
    min-height: max(var(--k3-sb-h), var(--k3-sys-touch-target, 3rem));
    align-items: center;
    position: relative;
    user-select: none;
    -webkit-user-select: none;
    cursor: default;
  }

  :host([size='xs']) {
    --k3-sb-h: ${rem(xs.height)};
    --k3-sb-inner-r: ${rem(xs.inner)};
    --k3-sb-inner-r-hover: ${rem(xs.innerHover)};
    --k3-sb-inner-r-pressed: ${rem(xs.innerPressed)};
    --k3-sb-lead-pad-start: ${rem(xs.leadPadStart)};
    --k3-sb-lead-pad-end: ${rem(xs.leadPadEnd)};
    --k3-sb-lead-icon: ${rem(xs.leadIcon)};
    --k3-sb-lead-icon-gap: ${rem(xs.leadIconGap)};
    --k3-sb-trail-icon: ${rem(xs.trailIcon)};
    --k3-sb-trail-pad-start: ${rem(splitButtonTrailPadDp('xs'))};
    --k3-sb-trail-pad-end: ${rem(splitButtonTrailPadDp('xs'))};
    --k3-sb-chev-shift: ${rem(xs.chevShift)};
  }

  :host([size='sm']) {
    --k3-sb-h: ${rem(sm.height)};
    --k3-sb-inner-r: ${rem(sm.inner)};
    --k3-sb-inner-r-hover: ${rem(sm.innerHover)};
    --k3-sb-inner-r-pressed: ${rem(sm.innerPressed)};
    --k3-sb-lead-pad-start: ${rem(sm.leadPadStart)};
    --k3-sb-lead-pad-end: ${rem(sm.leadPadEnd)};
    --k3-sb-lead-icon: ${rem(sm.leadIcon)};
    --k3-sb-lead-icon-gap: ${rem(sm.leadIconGap)};
    --k3-sb-trail-icon: ${rem(sm.trailIcon)};
    --k3-sb-trail-pad-start: ${rem(splitButtonTrailPadDp('sm'))};
    --k3-sb-trail-pad-end: ${rem(splitButtonTrailPadDp('sm'))};
    --k3-sb-chev-shift: ${rem(sm.chevShift)};
  }

  :host([size='md']) {
    --k3-sb-h: ${rem(md.height)};
    --k3-sb-inner-r: ${rem(md.inner)};
    --k3-sb-inner-r-hover: ${rem(md.innerHover)};
    --k3-sb-inner-r-pressed: ${rem(md.innerPressed)};
    --k3-sb-lead-pad-start: ${rem(md.leadPadStart)};
    --k3-sb-lead-pad-end: ${rem(md.leadPadEnd)};
    --k3-sb-lead-icon: ${rem(md.leadIcon)};
    --k3-sb-lead-icon-gap: ${rem(md.leadIconGap)};
    --k3-sb-trail-icon: ${rem(md.trailIcon)};
    --k3-sb-trail-pad-start: ${rem(splitButtonTrailPadDp('md'))};
    --k3-sb-trail-pad-end: ${rem(splitButtonTrailPadDp('md'))};
    --k3-sb-chev-shift: ${rem(md.chevShift)};
    --k3-sb-font-size: var(--k3-sys-typescale-title-medium-size);
    --k3-sb-font-weight: var(--k3-sys-typescale-title-medium-weight);
  }

  :host([size='lg']) {
    --k3-sb-h: ${rem(lg.height)};
    --k3-sb-inner-r: ${rem(lg.inner)};
    --k3-sb-inner-r-hover: ${rem(lg.innerHover)};
    --k3-sb-inner-r-pressed: ${rem(lg.innerPressed)};
    --k3-sb-lead-pad-start: ${rem(lg.leadPadStart)};
    --k3-sb-lead-pad-end: ${rem(lg.leadPadEnd)};
    --k3-sb-lead-icon: ${rem(lg.leadIcon)};
    --k3-sb-lead-icon-gap: ${rem(lg.leadIconGap)};
    --k3-sb-trail-icon: ${rem(lg.trailIcon)};
    --k3-sb-trail-pad-start: ${rem(splitButtonTrailPadDp('lg'))};
    --k3-sb-trail-pad-end: ${rem(splitButtonTrailPadDp('lg'))};
    --k3-sb-chev-shift: ${rem(lg.chevShift)};
    --k3-sb-font-size: var(--k3-sys-typescale-headline-small-size);
    --k3-sb-font-weight: var(--k3-sys-typescale-headline-medium-emphasized-weight);
  }

  :host([size='xl']) {
    --k3-sb-h: ${rem(xl.height)};
    --k3-sb-inner-r: ${rem(xl.inner)};
    --k3-sb-inner-r-hover: ${rem(xl.innerHover)};
    --k3-sb-inner-r-pressed: ${rem(xl.innerPressed)};
    --k3-sb-lead-pad-start: ${rem(xl.leadPadStart)};
    --k3-sb-lead-pad-end: ${rem(xl.leadPadEnd)};
    --k3-sb-lead-icon: ${rem(xl.leadIcon)};
    --k3-sb-lead-icon-gap: ${rem(xl.leadIconGap)};
    --k3-sb-trail-icon: ${rem(xl.trailIcon)};
    --k3-sb-trail-pad-start: ${rem(splitButtonTrailPadDp('xl'))};
    --k3-sb-trail-pad-end: ${rem(splitButtonTrailPadDp('xl'))};
    --k3-sb-chev-shift: ${rem(xl.chevShift)};
    --k3-sb-font-size: var(--k3-sys-typescale-headline-large-size);
    --k3-sb-font-weight: var(--k3-sys-typescale-headline-medium-emphasized-weight);
  }

  :host([disabled]) {
    opacity: 0.38;
    pointer-events: none;
  }

  .row {
    display: inline-flex;
    align-items: stretch;
    gap: var(--k3-sb-gap);
    height: var(--k3-sb-h);
  }

  .leading,
  .trailing {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    border: 0;
    height: 100%;
    font: inherit;
    font-size: var(--k3-sb-font-size);
    font-weight: var(--k3-sb-font-weight);
    letter-spacing: 0.00625rem;
    line-height: 1;
    white-space: nowrap;
    color: inherit;
  }

  /*
   * Leading — label surface (not a control).
   * Inner corners morph when trailing is hovered / focused / pressed.
   */
  .leading {
    gap: var(--k3-sb-lead-icon-gap);
    padding-inline-start: var(--k3-sb-lead-pad-start);
    padding-inline-end: var(--k3-sb-lead-pad-end);
    border-start-start-radius: var(--k3-sb-outer-r);
    border-end-start-radius: var(--k3-sb-outer-r);
    border-start-end-radius: var(--k3-sb-inner-r);
    border-end-end-radius: var(--k3-sb-inner-r);
    outline: none;
    pointer-events: none;
    cursor: default;
    user-select: none;
    transition:
      border-radius var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }
  .row:has(.trailing:hover) .leading,
  .row:has(.trailing:focus-visible) .leading {
    border-start-end-radius: var(--k3-sb-inner-r-hover);
    border-end-end-radius: var(--k3-sb-inner-r-hover);
  }
  .row:has(.trailing[data-pressed]) .leading,
  .row:has(.trailing:active) .leading {
    border-start-end-radius: var(--k3-sb-inner-r-pressed);
    border-end-end-radius: var(--k3-sb-inner-r-pressed);
  }

  /* Icon-only leading — centered · square-ish (M3 anatomy “Icon”) */
  :host([data-leading='icon']) .leading {
    padding-inline-start: var(--k3-sb-lead-pad-start);
    padding-inline-end: var(--k3-sb-lead-pad-start);
    min-width: var(--k3-sb-h);
    justify-content: center;
  }
  :host([data-leading='icon']) .label,
  .label:not(.has) {
    display: none;
  }

  /*
   * Trailing — guidelines: standard motion · shape morph + icon rotate
   * when selected (menu open) · k3-focus-ring on keyboard focus.
   */
  .trailing {
    position: relative;
    flex: 0 0 auto;
    width: var(--k3-sb-trail-w);
    min-width: var(--k3-sb-trail-w);
    padding-inline-start: var(--k3-sb-trail-pad-start);
    padding-inline-end: var(--k3-sb-trail-pad-end);
    border-start-start-radius: var(--k3-sb-inner-r);
    border-end-start-radius: var(--k3-sb-inner-r);
    border-start-end-radius: var(--k3-sb-outer-r);
    border-end-end-radius: var(--k3-sb-outer-r);
    /* Focus ring must not be clipped by state-layer */
    overflow: visible;
    cursor: pointer;
    transition:
      border-radius var(--k3-sys-motion-duration-medium2, 300ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      width var(--k3-sys-motion-duration-medium2, 300ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      min-width var(--k3-sys-motion-duration-medium2, 300ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      padding var(--k3-sys-motion-duration-medium2, 300ms)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      background-color var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
      box-shadow var(--k3-sys-motion-duration-short4)
        var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }
  /* XS/S — expand hit via ::before (keep ::after for state-layer) */
  :host([size='xs']) .trailing::before,
  :host([size='sm']) .trailing::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 3rem;
    height: 3rem;
    transform: translate(-50%, -50%);
  }
  .trailing:hover,
  .trailing:focus-visible {
    border-start-start-radius: var(--k3-sb-inner-r-hover);
    border-end-start-radius: var(--k3-sb-inner-r-hover);
  }
  .trailing[data-pressed],
  .trailing:active {
    border-start-start-radius: var(--k3-sb-inner-r-pressed);
    border-end-start-radius: var(--k3-sb-inner-r-pressed);
  }

  /*
   * Selected — drive off k3-menu[open] (authoritative) + host [open].
   * Morph to circle: all corners → H/2.
   */
  k3-menu.trail-menu[open] .trailing,
  k3-menu.trail-menu[open] .trailing:hover,
  k3-menu.trail-menu[open] .trailing:focus-visible,
  k3-menu.trail-menu[open] .trailing[data-pressed],
  k3-menu.trail-menu[open] .trailing:active,
  :host([open]) .trailing,
  :host([open]) .trailing:hover,
  :host([open]) .trailing:focus-visible,
  :host([open]) .trailing[data-pressed],
  :host([open]) .trailing:active {
    width: var(--k3-sb-h);
    min-width: var(--k3-sb-h);
    padding-inline: 0;
    border-start-start-radius: var(--k3-sb-outer-r);
    border-end-start-radius: var(--k3-sb-outer-r);
    border-start-end-radius: var(--k3-sb-outer-r);
    border-end-end-radius: var(--k3-sb-outer-r);
  }

  .filled {
    background: var(--k3-sys-color-primary);
    color: var(--k3-sys-color-on-primary);
  }
  .tonal {
    background: var(--k3-sys-color-secondary-container);
    color: var(--k3-sys-color-on-secondary-container);
  }
  .outlined {
    background: transparent;
    color: var(--k3-sys-color-primary);
    box-shadow: inset 0 0 0 1px var(--k3-sys-color-outline-variant);
  }
  .elevated {
    background: var(--k3-sys-color-surface-container-low);
    color: var(--k3-sys-color-primary);
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.3),
      0 1px 3px 1px rgb(0 0 0 / 0.15);
  }

  .icon {
    display: inline-grid;
    place-items: center;
    width: var(--k3-sb-lead-icon);
    height: var(--k3-sb-lead-icon);
    flex-shrink: 0;
  }
  .icon:not(.has) {
    display: none;
  }
  .label {
    display: inline-flex;
    align-items: center;
  }

  /*
   * Chevron — M3: standard motion (not expressive), rotate inwards 180°.
   * Resting: optical translateX offset · open: centered + rotate.
   */
  .chev {
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif;
    font-size: var(--k3-sb-trail-icon);
    width: var(--k3-sb-trail-icon);
    height: var(--k3-sb-trail-icon);
    line-height: 1;
    display: inline-grid;
    place-items: center;
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
    transform-origin: center center;
    transform: translateX(var(--k3-sb-chev-shift)) rotate(0deg);
    transition: transform
      var(--k3-sys-motion-duration-medium2, 300ms)
      var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }
  :host(:dir(rtl)) .chev {
    transform: translateX(calc(var(--k3-sb-chev-shift) * -1)) rotate(0deg);
  }
  k3-menu.trail-menu[open] .chev,
  :host([open]) .chev {
    transform: translateX(0) rotate(180deg);
  }
  :host(:dir(rtl)) k3-menu.trail-menu[open] .chev,
  :host(:dir(rtl)[open]) .chev {
    transform: translateX(0) rotate(-180deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .leading,
    .trailing,
    .chev {
      transition-duration: 0.01ms !important;
    }
  }
  :host-context([data-k3-reduce-motion]) .leading,
  :host-context([data-k3-reduce-motion]) .trailing,
  :host-context([data-k3-reduce-motion]) .chev {
    transition-duration: 0.01ms !important;
  }

  ::slotted([slot='icon']) {
    display: grid !important;
    place-items: center !important;
    width: var(--k3-sb-lead-icon) !important;
    height: var(--k3-sb-lead-icon) !important;
    font-size: var(--k3-sb-lead-icon) !important;
    line-height: 1 !important;
    font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif !important;
  }
  ::slotted(img[slot='icon']),
  ::slotted(.flag-icon) {
    display: block !important;
    object-fit: cover !important;
    overflow: hidden !important;
    border-radius: 0.25rem !important;
    font-family: inherit !important;
    font-size: 0 !important;
    color: transparent !important;
    line-height: 0 !important;
  }

  k3-menu.trail-menu {
    display: inline-flex;
    align-items: stretch;
    height: 100%;
  }
  k3-menu.trail-menu::part(trigger) {
    display: inline-flex;
    height: 100%;
  }
`;
