import { css, type CSSResultGroup } from 'lit';
import { enterDialogMotion } from '../../motion/enter.js';

/**
 * Styles for `k3-dialog`.
 *
 * Enter motion (M3E within-bounds · expressive overshoot):
 * - Basic: `enterDialogMotion` — scaleY from center + spatial-fast spring
 *   (same bounce as menus). Not uniform scale / z-axis.
 * - Fullscreen: translateY + fade · spatial default (mild overshoot).
 */
export const dialogStyles: CSSResultGroup = [
  enterDialogMotion('.panel.basic', '.panel.basic.open'),
  css`
      :host {
        display: contents;
      }

      .backdrop {
        position: fixed;
        inset: 0;
        background: rgb(0 0 0 / 0.32); /* M3 scrim 32% */
        opacity: 0;
        pointer-events: none;
        /* Same band as k3-sheet — above fixed FAB chrome (≤1100). */
        z-index: 1200;
        transition: opacity var(--k3-sys-motion-duration-effects-fast, 150ms)
          var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
      }
      .backdrop.open {
        opacity: 1;
        pointer-events: auto;
        transition: opacity var(--k3-sys-motion-duration-effects-default, 200ms)
          var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
      }

      .panel {
        position: fixed;
        z-index: 1201;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        overflow: hidden;
        background: var(--k3-sys-color-surface-container-high);
        color: var(--k3-sys-color-on-surface);
        pointer-events: none;
      }
      .panel.open {
        pointer-events: auto;
      }

      /*
       * Layout only — opacity / scaleY owned by enterDialogMotion.
       * Physical left + translate(-50%, -50%): logical inset-inline:50% breaks
       * centering in RTL (over-constrained right wins → panel flies left).
       */
      .panel.basic {
        left: 50%;
        right: auto;
        top: 50%;
        width: min(35rem, calc(100vw - 3rem)); /* max 560 · 24dp*2 inset */
        min-width: min(17.5rem, calc(100vw - 3rem)); /* min 280 */
        max-height: min(80vh, 40rem);
        border-radius: var(--k3-sys-shape-corner-extra-large); /* 28dp */
        --k3-scroll-track-inset: 0.5rem;
      }

      /*
       * Full-screen — Y-axis enter/exit + fade · spatial overshoot (milder
       * than menu fast — large surface).
       */
      .panel.fullscreen {
        inset: 0;
        width: 100%;
        max-width: none;
        min-width: 0;
        height: 100%;
        max-height: none;
        border-radius: 0;
        opacity: 0;
        transform: translateY(1.5rem); /* 24dp */
        --k3-scroll-track-inset: 0;
        transition:
          opacity var(--k3-sys-motion-duration-effects-fast, 150ms)
            var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects)),
          transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
            var(
              --k3-sys-motion-easing-spatial-fast,
              var(--k3-sys-motion-easing-expressive-spatial-fast)
            );
      }
      .panel.fullscreen.open {
        opacity: 1;
        transform: translateY(0);
        transition:
          opacity var(--k3-sys-motion-duration-effects-default, 200ms)
            var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects)),
          transform var(--k3-sys-motion-duration-spatial-default, 500ms)
            var(
              --k3-sys-motion-easing-spatial,
              var(--k3-sys-motion-easing-expressive-spatial)
            );
      }

      /* Header — sticky chrome */
      .header {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 0.75rem; /* 12 */
        box-sizing: border-box;
        min-height: 0;
        padding-block: 1.5rem 0; /* 24 top — basic */
        padding-inline: 1.5rem;
      }
      .panel.fullscreen .header {
        min-height: 3.5rem; /* 56dp */
        padding-block: 0;
        padding-inline: 0.25rem 1rem; /* icon-button breathing room */
        gap: 0.25rem;
      }
      .header-main {
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        gap: 1rem; /* 16 — icon ↔ title */
        min-width: 0;
      }
      .panel.basic.has-icon .header-main {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1rem;
      }
      .panel.basic:not(.has-icon) .header-main {
        justify-content: flex-start;
        text-align: start;
      }

      .icon {
        display: none;
        flex-shrink: 0;
        width: 1.5rem;
        height: 1.5rem;
        font-size: 1.5rem;
        color: var(--k3-sys-color-secondary);
        line-height: 1;
      }
      .panel.has-icon .icon {
        display: grid;
        place-items: center;
      }
      .panel.fullscreen .icon {
        display: none; /* fullscreen uses close affordance, not decorative icon */
      }

      .titles {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;
        flex: 1 1 auto;
      }
      .headline {
        margin: 0;
        font-size: var(--k3-sys-typescale-headline-small-size, 1.5rem);
        font-weight: var(--k3-sys-typescale-headline-medium-emphasized-weight, 400);
        line-height: var(--k3-sys-typescale-headline-small-line-height, 2rem);
        color: var(--k3-sys-color-on-surface);
      }
      .panel.fullscreen .headline {
        font-size: var(--k3-sys-typescale-title-large-size, 1.375rem);
        line-height: var(--k3-sys-typescale-title-large-line-height, 1.75rem);
      }

      .close {
        display: none;
        place-items: center;
        flex-shrink: 0;
        box-sizing: border-box;
        width: var(--k3-sys-touch-target, 3rem);
        height: var(--k3-sys-touch-target, 3rem);
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: var(--k3-sys-shape-corner-full, 999px);
        background: transparent;
        color: var(--k3-sys-color-on-surface-variant);
        cursor: pointer;
        font: inherit;
      }
      .panel.fullscreen .close {
        display: grid;
      }
      .close-glyph {
        display: block;
        font-family: var(--k3-sys-icon-font-family, 'Material Symbols Rounded', sans-serif);
        font-size: 1.5rem;
        line-height: 1;
        font-variation-settings:
          'FILL' 0,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24;
        font-feature-settings: 'liga';
      }
      .close-glyph[data-k3-icon]::before {
        content: attr(data-k3-icon);
      }

      .header-actions {
        display: none;
        flex-shrink: 0;
        align-items: center;
        gap: 0.5rem;
        margin-inline-start: auto;
      }
      .panel.fullscreen .header-actions.has {
        display: inline-flex;
      }
      /* Adapted ≥600: header-actions relocate into footer (M3 basic actions) */
      .panel.basic .footer .header-actions.has {
        display: inline-flex;
        margin-inline-start: 0;
      }

      /* Body — only region that scrolls; scrollbar flush to panel edge */
      .body {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
      }
      .body-inner {
        box-sizing: border-box;
        padding-block: 1rem; /* 16 — title ↔ body */
        padding-inline: 1.5rem; /* 24 */
        font-size: var(--k3-sys-typescale-body-medium-size, 0.875rem);
        color: var(--k3-sys-color-on-surface-variant);
      }
      .panel.fullscreen .body-inner {
        padding-block: 0.5rem 1.5rem;
      }

      /* Dividers — show when content scrolls past header / footer */
      .divider {
        flex: 0 0 auto;
        height: 1px;
        margin: 0;
        background: var(--k3-sys-color-outline-variant);
        opacity: 0;
        transition: opacity var(--k3-sys-motion-duration-effects-fast, 150ms)
          var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
        pointer-events: none;
      }
      .divider.on {
        opacity: 1;
      }

      /* Footer — sticky actions */
      .footer {
        flex: 0 0 auto;
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: center;
        gap: 0.5rem; /* 8 */
        box-sizing: border-box;
        padding: 1.5rem; /* 24 body ↔ actions + bottom */
        padding-block-start: 0;
      }
      .panel.fullscreen .footer {
        min-height: 3.5rem; /* 56dp bottom action bar */
        padding-block: 0.5rem;
        padding-inline: 1.5rem;
        padding-block-end: max(0.5rem, env(safe-area-inset-bottom, 0px));
      }
      .footer:not(.has) {
        display: none;
      }
      .panel.fullscreen .footer:not(.has) {
        display: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .backdrop,
        .panel,
        .panel.fullscreen,
        .divider {
          transition: none !important;
          animation: none !important;
        }
        .panel.fullscreen.open {
          transform: none;
          opacity: 1;
        }
      }
    `,
];
