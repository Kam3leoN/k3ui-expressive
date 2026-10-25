/**
 * M3 / M3E enter helpers (Lit `css`) — matched to component recipes:
 *
 * | Surface | Motion | Spring / easing |
 * |---|---|---|
 * | Menu / flyout / docked picker | scaleY expand | expressive spatial fast (bounce) |
 * | FAB menu items (separate) | scaleX + stagger | same FastSpatial tokens — not this helper |
 * | Snackbar | scaleY from bottom | standard (no bounce) — M3E |
 * | Dialog basic | scaleY from center | expressive spatial fast (same bounce as menus) |
 * | Dialog fullscreen | translateY | expressive spatial default (mild overshoot) |
 * | Sheet | scaleY/X from docked edge | expressive spatial fast (bounce, edge-pinned) |
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

/**
 * Sheet enter — same FastSpatial spring as menus (overshoot).
 * Must pair with edge-pinned scale (not translate to 0) or the bounce
 * lifts the sheet off the screen edge.
 */
export const motionSheetEnter = motionSpatialFast;

/** Sheet exit — FastSpatial collapse toward docked edge. */
export const motionSheetExit = motionSpatialFast;

/** Dialog enter — same FastSpatial spring as menus (overshoot). */
export const motionDialogEnter = motionSpatialFast;

/** Dialog exit — FastSpatial (collapse); opacity uses effects separately. */
export const motionDialogExit = motionSpatialFast;

/** Dialog surface height collapse — effects fast (no overshoot). */
export const motionDialogSurfaceExit = motionEffectsFast;

/** Basic dialog — scaleY + centering translate (overshoot from spatial-fast). */
export const enterDialogBasicKeyframes = css`
  @keyframes k3-dialog-enter-basic {
    from {
      transform: translate(-50%, -50%) scaleY(0);
    }
    to {
      transform: translate(-50%, -50%) scaleY(1);
    }
  }
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
 * Dialog basic enter — scaleY from center + expressive spatial-fast overshoot
 * (same spring as `enterScaleY` menus). Axis expand only — not uniform scale /
 * z-axis (M3 Android within-bounds).
 *
 * Closed starts at scaleY(0.8); open runs keyframes 0→1 so the cubic can
 * overshoot past 1 then settle. Centering translate stays in every keyframe.
 *
 * @example
 * ```ts
 * static styles = [
 *   enterDialogMotion('.panel.basic', '.panel.basic.open'),
 *   css`…`,
 * ];
 * ```
 */
export function enterDialogMotion(
  panelSelector: string,
  openSelector: string,
): CSSResult {
  return css`
    ${enterDialogBasicKeyframes}
    ${unsafeCSS(panelSelector)} {
      opacity: 0;
      transform: translate(-50%, -50%) scaleY(0.8);
      transform-origin: center center;
      transition:
        opacity ${motionEffectsFast},
        transform ${motionDialogExit};
    }
    ${unsafeCSS(openSelector)} {
      opacity: 1;
      transform: translate(-50%, -50%) scaleY(1);
      /* Animation owns enter transform — no transition fight / stutter */
      transition: opacity ${motionEffectsFast};
      animation: k3-dialog-enter-basic ${motionDialogEnter} backwards;
    }
    @media (prefers-reduced-motion: reduce) {
      ${unsafeCSS(panelSelector)},
      ${unsafeCSS(openSelector)} {
        transition: none !important;
        animation: none !important;
      }
      ${unsafeCSS(openSelector)} {
        transform: translate(-50%, -50%);
        opacity: 1;
      }
    }
  `;
}

/**
 * Bottom sheet enter — scaleY from bottom + spatial-fast overshoot.
 * Bottom edge stays pinned (unlike translateY→0 + overshoot, which gaps).
 *
 * `base` = e.g. `.sheet.bottom`. Open opacity stays on while `.dragging` /
 * `.settling` (inline translate owns transform during gestures).
 */
export function enterSheetBottom(baseSelector: string): CSSResult {
  const base = unsafeCSS(baseSelector);
  return css`
    ${base}:not(.open) {
      opacity: 0;
      transform: scaleY(0.8);
      transform-origin: bottom center;
      transition:
        opacity ${motionEffectsFast},
        transform ${motionSheetExit};
    }
    ${base}.open {
      opacity: 1;
    }
    ${base}.open:not(.dragging):not(.settling) {
      transform: scaleY(1);
      transform-origin: bottom center;
      transition:
        opacity ${motionEffectsFast},
        transform ${motionSheetEnter};
    }
    @media (prefers-reduced-motion: reduce) {
      ${base}:not(.open),
      ${base}.open:not(.dragging):not(.settling) {
        transition: none !important;
      }
      ${base}.open {
        transform: none;
        opacity: 1;
      }
    }
  `;
}

/**
 * Side sheet enter — scaleX from docked edge + spatial-fast overshoot.
 * Set `transform-origin` on start/end (and RTL flips) in component styles.
 */
export function enterSheetSide(baseSelector: string): CSSResult {
  const base = unsafeCSS(baseSelector);
  return css`
    ${base}:not(.open) {
      opacity: 0;
      transform: scaleX(0.8);
      transition:
        opacity ${motionEffectsFast},
        transform ${motionSheetExit};
    }
    ${base}.open {
      opacity: 1;
    }
    ${base}.open:not(.dragging):not(.settling) {
      transform: scaleX(1);
      transition:
        opacity ${motionEffectsFast},
        transform ${motionSheetEnter};
    }
    @media (prefers-reduced-motion: reduce) {
      ${base}:not(.open),
      ${base}.open:not(.dragging):not(.settling) {
        transition: none !important;
      }
      ${base}.open {
        transform: none;
        opacity: 1;
      }
    }
  `;
}

/**
 * @deprecated Use `enterSheetBottom(base)` (edge-pinned scale).
 * Second arg ignored — kept for older imports.
 */
export function enterSheetSlide(
  sheetSelector: string,
  _openSelector?: string,
): CSSResult {
  return enterSheetBottom(sheetSelector);
}
