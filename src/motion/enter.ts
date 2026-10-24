/**
 * M3 / M3E enter helpers (Lit `css`) — matched to component recipes:
 *
 * | Surface | Motion | Spring / easing |
 * |---|---|---|
 * | Menu / flyout / docked picker | scaleY expand | expressive spatial fast (bounce) |
 * | FAB menu items (separate) | scaleX + stagger | same FastSpatial tokens — not this helper |
 * | Snackbar | scaleY from bottom | standard (no bounce) — M3E |
 * | Dialog | translateY + surface height morph | emphasized — M3E (no uniform scale) |
 * | Sheet | edge slide | standard decelerate — heavy, non-bouncy |
 *
 * @see https://m3.material.io/styles/motion/transitions
 * @see https://m3.material.io/styles/motion/overview/how-it-works
 */

import { css, unsafeCSS, type CSSResult } from 'lit';

/** Spatial fast — duration + easing (scheme-aware aliases). */
export const motionSpatialFast = css`
  var(--k3-sys-motion-duration-spatial-fast)
    var(--k3-sys-motion-easing-spatial-fast, var(--k3-sys-motion-easing-spatial))
`;

/** Spatial default — partial-screen (sheets use decelerate instead). */
export const motionSpatialDefault = css`
  var(--k3-sys-motion-duration-spatial-default)
    var(--k3-sys-motion-easing-spatial, var(--k3-sys-motion-easing-expressive-spatial))
`;

/** Effects fast — opacity / color (no overshoot). */
export const motionEffectsFast = css`
  var(--k3-sys-motion-duration-effects-fast)
    var(--k3-sys-motion-easing-effects-fast, var(--k3-sys-motion-easing-effects))
`;

/** Standard (no bounce) — snackbar transform / sheet slide. */
export const motionStandardMedium = css`
  var(--k3-sys-motion-duration-medium1, 250ms)
    var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1))
`;

/** Sheet enter — heavy surface, non-bouncy decelerate (M3E bottom-sheet). */
export const motionSheetEnter = css`
  var(--k3-sys-motion-duration-medium2, 300ms)
    var(--k3-sys-motion-easing-standard-decelerate, cubic-bezier(0, 0, 0, 1))
`;

/** Sheet / dialog exit — shorter. */
export const motionSheetExit = css`
  var(--k3-sys-motion-duration-short3, 150ms)
    var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1))
`;

/** Dialog enter — emphasized long (M3E dialog). */
export const motionDialogEnter = css`
  var(--k3-sys-motion-duration-long2, 500ms)
    var(--k3-sys-motion-easing-emphasized, cubic-bezier(0.2, 0, 0, 1))
`;

/** Dialog exit — short3 + emphasized (M3E). */
export const motionDialogExit = css`
  var(--k3-sys-motion-duration-short3, 150ms)
    var(--k3-sys-motion-easing-emphasized, cubic-bezier(0.2, 0, 0, 1))
`;

/** Dialog surface height collapse — emphasized accelerate (M3E). */
export const motionDialogSurfaceExit = css`
  var(--k3-sys-motion-duration-short3, 150ms)
    var(--k3-sys-motion-easing-emphasized-accelerate, cubic-bezier(0.3, 0, 0.8, 0.15))
`;

/** Shared keyframe — spring easing supplies the bounce (no mid stops). */
export const enterScaleYKeyframes = css`
  @keyframes k3-enter-scale-y {
    from {
      transform: scaleY(0);
    }
    to {
      transform: scaleY(1);
    }
  }
`;

export interface EnterScaleYOptions {
  /** CSS transform-origin (default `top center`). */
  origin?: string;
  /**
   * Settled open transform. Default `none` so nested `position:fixed`
   * flyouts stay viewport-anchored. Use `scaleY(1)` for popover hosts
   * that are the positioned surface themselves.
   */
  openTransform?: 'none' | 'scaleY(1)';
}

/**
 * Closed → open scaleY enter (menus, flyouts, dropdown panels).
 *
 * @example
 * ```ts
 * static styles = [
 *   enterScaleY('.panel', '.panel.open'),
 *   css`…`,
 * ];
 * ```
 */
export function enterScaleY(
  closedSelector: string,
  openSelector: string,
  options: EnterScaleYOptions = {},
): CSSResult {
  const origin = options.origin ?? 'top center';
  const openTransform = options.openTransform ?? 'none';
  return css`
    ${enterScaleYKeyframes}
    ${unsafeCSS(closedSelector)} {
      opacity: 0;
      transform: scaleY(0.8);
      transform-origin: ${unsafeCSS(origin)};
      transition:
        opacity ${motionEffectsFast},
        transform ${motionSpatialFast};
    }
    ${unsafeCSS(openSelector)} {
      opacity: 1;
      transform: ${unsafeCSS(openTransform)};
      /* Animation owns enter transform — no transition fight / stutter */
      transition: opacity ${motionEffectsFast};
      animation: k3-enter-scale-y ${motionSpatialFast} backwards;
    }
    @media (prefers-reduced-motion: reduce) {
      ${unsafeCSS(closedSelector)},
      ${unsafeCSS(openSelector)} {
        transition: none !important;
        animation: none !important;
      }
      ${unsafeCSS(openSelector)} {
        transform: none;
        opacity: 1;
      }
    }
  `;
}

/**
 * Popover / `:host([open])` enter — keeps `scaleY(1)` when open + `@starting-style`
 * (date/time docked pickers, M3E popover pattern).
 */
export function enterScaleYPopover(
  openSelector: string,
  options: Pick<EnterScaleYOptions, 'origin'> = {},
): CSSResult {
  const origin = options.origin ?? 'top center';
  return css`
    ${enterScaleYKeyframes}
    ${unsafeCSS(openSelector)} {
      opacity: 1;
      transform: scaleY(1);
      transform-origin: ${unsafeCSS(origin)};
      animation: k3-enter-scale-y ${motionSpatialFast} backwards;
      transition:
        opacity ${motionEffectsFast},
        transform ${motionSpatialFast},
        overlay ${motionEffectsFast} allow-discrete,
        display ${motionEffectsFast} allow-discrete;
    }
    @starting-style {
      ${unsafeCSS(openSelector)} {
        opacity: 0;
        transform: scaleY(0.8);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      ${unsafeCSS(openSelector)} {
        transition: none !important;
        animation: none !important;
        transform: none;
      }
    }
  `;
}

/**
 * Scrim / backdrop fade (effects only — no spatial overshoot).
 */
export function scrimFade(closedSelector: string, openSelector: string): CSSResult {
  return css`
    ${unsafeCSS(closedSelector)} {
      opacity: 0;
      transition: opacity ${motionEffectsFast};
    }
    ${unsafeCSS(openSelector)} {
      opacity: 1;
    }
    @media (prefers-reduced-motion: reduce) {
      ${unsafeCSS(closedSelector)},
      ${unsafeCSS(openSelector)} {
        transition: none !important;
      }
    }
  `;
}

export type SlideAxis = 'Y' | 'X';

/**
 * Snackbar enter — scaleY from bottom, standard easing (M3E, no bounce).
 * @see https://github.com/matraic/m3e/blob/main/packages/web/src/snackbar/SnackbarElement.ts
 */
export function enterSnackbarScaleY(
  closedSelector: string,
  openSelector: string,
): CSSResult {
  return css`
    ${unsafeCSS(closedSelector)} {
      opacity: 0;
      transform: scaleY(0.8);
      transform-origin: bottom center;
      transition:
        opacity var(--k3-sys-motion-duration-short3, 150ms)
          var(--k3-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1)),
        transform ${motionStandardMedium};
    }
    ${unsafeCSS(openSelector)} {
      opacity: 1;
      transform: scaleY(1);
    }
    @media (prefers-reduced-motion: reduce) {
      ${unsafeCSS(closedSelector)},
      ${unsafeCSS(openSelector)} {
        transition: none !important;
      }
      ${unsafeCSS(openSelector)} {
        transform: none;
        opacity: 1;
      }
    }
  `;
}

/**
 * Dialog panel transform only — M3E: translateY(-50px)→0, **no** uniform scale,
 * **no** panel-level opacity (surface height + content fades live in dialog styles).
 *
 * @see https://github.com/matraic/m3e/blob/main/packages/web/src/dialog/DialogElement.ts
 */
export function enterDialogMotion(
  panelSelector: string,
  openSelector: string,
): CSSResult {
  return css`
    ${unsafeCSS(panelSelector)} {
      transform-origin: top center;
      transition:
        transform ${motionDialogExit},
        visibility ${motionDialogExit} allow-discrete;
    }
    ${unsafeCSS(openSelector)} {
      transition:
        transform ${motionDialogEnter},
        visibility ${motionDialogEnter} allow-discrete;
    }
    @media (prefers-reduced-motion: reduce) {
      ${unsafeCSS(panelSelector)},
      ${unsafeCSS(openSelector)} {
        transition: none !important;
      }
    }
  `;
}

/**
 * Sheet edge slide — non-bouncy decelerate enter, faster exit (M3E heavy surface).
 * Component supplies closed translate (e.g. translateY(100%) / translateX).
 */
export function enterSheetSlide(
  sheetSelector: string,
  openSelector: string,
): CSSResult {
  return css`
    ${unsafeCSS(sheetSelector)} {
      /* Exit (when .open removed) — short */
      transition: transform ${motionSheetExit};
    }
    ${unsafeCSS(openSelector)} {
      /* Enter — medium2 + standard decelerate, no overshoot */
      transition: transform ${motionSheetEnter};
    }
    @media (prefers-reduced-motion: reduce) {
      ${unsafeCSS(sheetSelector)},
      ${unsafeCSS(openSelector)} {
        transition: none !important;
      }
    }
  `;
}
