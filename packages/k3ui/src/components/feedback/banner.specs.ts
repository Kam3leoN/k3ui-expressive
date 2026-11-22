/**
 * Banner — full-bleed announcement strip above sticky app bars.
 * Promo / alert / status. Optional slotted `k3-marquee` (k3ux) — not required.
 */

export type BannerVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'error'
  | 'warning'
  | 'info'
  | 'success'
  | 'inverse';

/** `fixed` pins to the viewport and publishes `--k3-banner-offset`. */
export type BannerPosition = 'fixed' | 'static';

export const BANNER_VARIANTS: readonly BannerVariant[] = [
  'primary',
  'secondary',
  'tertiary',
  'error',
  'warning',
  'info',
  'success',
  'inverse',
] as const;

export const BANNER_POSITIONS: readonly BannerPosition[] = ['fixed', 'static'] as const;

/** Default Material Symbol per variant when no icon slot / icon attr. */
export const BannerDefaultIcon: Record<BannerVariant, string> = {
  primary: 'celebration',
  secondary: 'notifications',
  tertiary: 'notifications',
  error: 'error',
  warning: 'warning',
  info: 'info',
  success: 'check_circle',
  inverse: 'celebration',
};

export const BannerSpecs = {
  defaultVariant: 'primary' as BannerVariant,
  defaultPosition: 'fixed' as BannerPosition,
  /** Above sticky app bars (10) + nav rail (30); below menus (50). */
  zIndex: 40,
  /** Single-line strip: 12dp pad + 40dp controls + 12dp pad (= small app bar). */
  minHeightDp: 64,
  padBlockDp: 12,
  cssVarOffset: '--k3-banner-offset',
  cssVarStackTop: '--k3-banner-stack-top',
  defaultIcons: BannerDefaultIcon,
  accessibility: {
    roleFor(variant: BannerVariant): 'alert' | 'status' {
      return variant === 'error' || variant === 'warning' ? 'alert' : 'status';
    },
  },
} as const;

export function resolveBannerVariant(v: string | null | undefined): BannerVariant {
  if (v && (BANNER_VARIANTS as readonly string[]).includes(v)) {
    return v as BannerVariant;
  }
  return BannerSpecs.defaultVariant;
}

export function resolveBannerPosition(p: string | null | undefined): BannerPosition {
  if (p === 'fixed' || p === 'static') return p;
  return BannerSpecs.defaultPosition;
}
