import { css, unsafeCSS } from 'lit';
import {
  IconButtonMinTargetDp,
  IconButtonSizeDp,
  iconButtonTargetDp,
  iconButtonWidthDp,
} from './icon-button.specs.js';

const rem = (dp: number) => unsafeCSS(`${dp / 16}rem`);

const xs = IconButtonSizeDp.xs;
const sm = IconButtonSizeDp.sm;
const md = IconButtonSizeDp.md;
const lg = IconButtonSizeDp.lg;
const xl = IconButtonSizeDp.xl;

/**
 * Styles for `k3-icon-button`.
 *
 * @see ./icon-button.specs.ts
 */
export const iconButtonStyles = css`
  :host {
    /* Small · default width — M3E */
    --k3-ib-h: ${rem(sm.container)};
    --k3-ib-w: ${rem(sm.container)};
    --k3-ib-icon: ${rem(sm.icon)};
    --k3-ib-hit-w: ${rem(IconButtonMinTargetDp)};
    --k3-ib-hit-h: ${rem(IconButtonMinTargetDp)};
    --k3-ib-radius-round: calc(var(--k3-ib-h) / 2);
    --k3-ib-radius-square: ${rem(sm.squareRadius)};
    --k3-ib-radius-pressed: ${rem(sm.pressedRadius)};
    --k3-ib-radius: var(--k3-ib-radius-round);
    /* Aliases for button-group outer corners */
    --k3-btn-corner: var(--k3-ib-radius);
    --k3-btn-radius-square: var(--k3-ib-radius-square);
    position: relative;
    z-index: 0;
    display: inline-grid;
    place-items: center;
    place-content: center;
    vertical-align: middle;
    box-sizing: border-box;
    width: var(--k3-ib-hit-w);
    height: var(--k3-ib-hit-h);
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
  }

  :host(:focus-within) {
    z-index: 4;
  }

  /* Standard group — fixed hit/paint (no width morph) */
  :host([data-bg]:not([data-connected])) {
    flex-shrink: 0;
    align-self: center;
    width: var(--k3-ib-hit-w);
    height: var(--k3-ib-hit-h);
    min-width: var(--k3-ib-hit-w);
    min-height: var(--k3-ib-hit-h);
  }

  /* Connected — host fills flex cell */
  :host([data-connected]) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: auto;
    min-width: 0;
    height: var(--k3-ib-hit-h);
  }

  /* ── Size · height + icon + radii ─────────────────────────────────────── */
  :host([size='xs']) {
    --k3-ib-h: ${rem(xs.container)};
    --k3-ib-icon: ${rem(xs.icon)};
    --k3-ib-radius-square: ${rem(xs.squareRadius)};
    --k3-ib-radius-pressed: ${rem(xs.pressedRadius)};
  }
  :host([size='sm']) {
    --k3-ib-h: ${rem(sm.container)};
    --k3-ib-icon: ${rem(sm.icon)};
    --k3-ib-radius-square: ${rem(sm.squareRadius)};
    --k3-ib-radius-pressed: ${rem(sm.pressedRadius)};
  }
  :host([size='md']) {
    --k3-ib-h: ${rem(md.container)};
    --k3-ib-icon: ${rem(md.icon)};
    --k3-ib-radius-square: ${rem(md.squareRadius)};
    --k3-ib-radius-pressed: ${rem(md.pressedRadius)};
  }
  :host([size='lg']) {
    --k3-ib-h: ${rem(lg.container)};
    --k3-ib-icon: ${rem(lg.icon)};
    --k3-ib-radius-square: ${rem(lg.squareRadius)};
    --k3-ib-radius-pressed: ${rem(lg.pressedRadius)};
  }
  :host([size='xl']) {
    --k3-ib-h: ${rem(xl.container)};
    --k3-ib-icon: ${rem(xl.icon)};
    --k3-ib-radius-square: ${rem(xl.squareRadius)};
    --k3-ib-radius-pressed: ${rem(xl.pressedRadius)};
  }

  /* ── Width · painted W + hit target (XS/S ≥48) ────────────────────────── */
  :host([size='xs']:not([width])),
  :host([size='xs'][width='default']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('xs', 'default'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('xs', 'default').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('xs', 'default').h)};
  }
  :host([size='xs'][width='narrow']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('xs', 'narrow'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('xs', 'narrow').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('xs', 'narrow').h)};
  }
  :host([size='xs'][width='wide']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('xs', 'wide'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('xs', 'wide').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('xs', 'wide').h)};
  }

  :host([size='sm']:not([width])),
  :host([size='sm'][width='default']),
  :host(:not([size]):not([width])),
  :host(:not([size])[width='default']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('sm', 'default'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('sm', 'default').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('sm', 'default').h)};
  }
  :host([size='sm'][width='narrow']),
  :host(:not([size])[width='narrow']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('sm', 'narrow'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('sm', 'narrow').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('sm', 'narrow').h)};
  }
  :host([size='sm'][width='wide']),
  :host(:not([size])[width='wide']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('sm', 'wide'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('sm', 'wide').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('sm', 'wide').h)};
  }

  :host([size='md']:not([width])),
  :host([size='md'][width='default']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('md', 'default'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('md', 'default').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('md', 'default').h)};
  }
  :host([size='md'][width='narrow']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('md', 'narrow'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('md', 'narrow').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('md', 'narrow').h)};
  }
  :host([size='md'][width='wide']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('md', 'wide'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('md', 'wide').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('md', 'wide').h)};
  }

  :host([size='lg']:not([width])),
  :host([size='lg'][width='default']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('lg', 'default'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('lg', 'default').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('lg', 'default').h)};
  }
  :host([size='lg'][width='narrow']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('lg', 'narrow'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('lg', 'narrow').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('lg', 'narrow').h)};
  }
  :host([size='lg'][width='wide']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('lg', 'wide'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('lg', 'wide').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('lg', 'wide').h)};
  }

  :host([size='xl']:not([width])),
  :host([size='xl'][width='default']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('xl', 'default'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('xl', 'default').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('xl', 'default').h)};
  }
  :host([size='xl'][width='narrow']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('xl', 'narrow'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('xl', 'narrow').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('xl', 'narrow').h)};
  }
  :host([size='xl'][width='wide']) {
    --k3-ib-w: ${rem(iconButtonWidthDp('xl', 'wide'))};
    --k3-ib-hit-w: ${rem(iconButtonTargetDp('xl', 'wide').w)};
    --k3-ib-hit-h: ${rem(iconButtonTargetDp('xl', 'wide').h)};
  }

  :host([shape='round']) {
    --k3-ib-radius: var(--k3-ib-radius-round);
  }
  :host([shape='square']) {
    --k3-ib-radius: var(--k3-ib-radius-square);
  }
  /* Toggle select: round ↔ square (soft) — skip in connected groups */
  :host([shape='round'][selected]:not([data-connected])) {
    --k3-ib-radius: var(--k3-ib-radius-square);
  }
  :host([shape='square'][selected]:not([data-connected])) {
    --k3-ib-radius: var(--k3-ib-radius-round);
  }
  /* Press radius — skip in groups to avoid flash with select morph */
  :host([data-pressed]:not([data-connected]):not([data-bg])) {
    --k3-ib-radius: var(--k3-ib-radius-pressed);
  }

  :host([disabled]) {
    opacity: 0.38;
    pointer-events: none;
  }

  .btn {
    position: relative;
    display: grid;
    place-items: center;
    place-content: center;
    box-sizing: border-box;
    width: var(--k3-ib-w);
    height: var(--k3-ib-h);
    padding: 0;
    margin: 0;
    border: 0;
    line-height: 0;
    border-radius: var(--k3-ib-radius);
    color: var(--k3-sys-color-on-surface-variant);
    background: transparent;
    overflow: visible;
    cursor: inherit;
    transition: border-radius var(--k3-sys-motion-duration-spatial-fast)
      var(--k3-sys-motion-easing-expressive-spatial);
  }
  :host([data-connected]) .btn {
    width: 100%;
    height: var(--k3-ib-h);
    flex: 1 1 auto;
  }

  .btn.filled {
    background: var(--k3-sys-color-primary);
    color: var(--k3-sys-color-on-primary);
  }
  .btn.tonal {
    background: var(--k3-sys-color-secondary-container);
    color: var(--k3-sys-color-on-secondary-container);
  }
  .btn.outlined {
    color: var(--k3-sys-color-on-surface-variant);
    box-shadow: inset 0 0 0 1px var(--k3-sys-color-outline-variant);
  }
  .btn.standard {
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
  }

  /*
   * Toggle / group unselected — tonal/filled → secondary-container
   * (ToggleButtonDefaults / button-group).
   */
  :host([toggle]:not([selected])) .btn.filled,
  :host([toggle]:not([selected])) .btn.tonal,
  :host([data-bg]:not([selected])) .btn.filled,
  :host([data-bg]:not([selected])) .btn.tonal {
    background: var(--k3-sys-color-secondary-container);
    color: var(--k3-sys-color-on-secondary-container);
    box-shadow: none;
  }
  :host([toggle]:not([selected])) .btn.outlined,
  :host([data-bg]:not([selected])) .btn.outlined {
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
    box-shadow: inset 0 0 0 1px var(--k3-sys-color-outline-variant);
  }
  :host([toggle]:not([selected])) .btn.standard,
  :host([data-bg]:not([selected])) .btn.standard {
    background: transparent;
    color: var(--k3-sys-color-on-surface-variant);
  }

  /* Selected — primary (toggle + group) */
  :host([selected]) .btn {
    background: var(--k3-sys-color-primary);
    color: var(--k3-sys-color-on-primary);
    box-shadow: none;
  }
  :host([selected]) .btn.standard {
    background: var(--k3-sys-color-primary-container);
    color: var(--k3-sys-color-on-primary-container);
  }

  .icon {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    place-content: center;
    flex-shrink: 0;
    width: var(--k3-ib-icon);
    height: var(--k3-ib-icon);
    line-height: 0;
    overflow: visible;
    pointer-events: none;
  }
  .icon.selected-icon {
    display: none;
  }
  :host([selected]) .icon.default-icon.has-selected {
    display: none;
  }
  :host([selected]) .icon.selected-icon.has {
    display: grid;
  }

  /* Slotted icon — forced optical center */
  ::slotted(*) {
    display: grid !important;
    place-items: center !important;
    place-content: center !important;
    box-sizing: border-box !important;
    width: var(--k3-ib-icon) !important;
    height: var(--k3-ib-icon) !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: var(--k3-ib-icon) !important;
    line-height: 1 !important;
    letter-spacing: normal !important;
    text-align: center !important;
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
  ::slotted(svg) {
    width: var(--k3-ib-icon) !important;
    height: var(--k3-ib-icon) !important;
    fill: currentColor;
  }
  :host([selected]) ::slotted(*) {
    font-variation-settings:
      'FILL' 1,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }

  @media (prefers-reduced-motion: reduce) {
    .btn {
      transition-duration: 0.01ms !important;
    }
  }
  :host-context([data-k3-reduce-motion]) .btn {
    transition-duration: 0.01ms !important;
  }
`;
