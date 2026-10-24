/**
 * M3 Expressive slider size tokens
 * @see https://m3.material.io/components/sliders/specs
 *
 * K3 API uses `xs`·`sm`·`md`·`lg`·`xl` (convention A).
 */

export type SliderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SliderOrientation = 'horizontal' | 'vertical';
export type SliderVariant = 'standard' | 'centered' | 'range';

export interface SliderSizeTokens {
  /** Track cross-axis thickness (dp). */
  track: number;
  /** Handle length along cross-axis (dp) — taller than track. */
  handle: number;
  /** Handle thickness along track axis (dp); press → 2. */
  handleWidth: number;
  /** Outer corner radius of track ends (dp). */
  corner: number;
  /** Inset icon box (dp); 0 = not allowed. */
  icon: number;
  /** Distance from track trailing edge to stop-indicator center (dp). */
  stopInset: number;
}

/** Common across sizes (M3 Expressive). */
export const SLIDER_HANDLE_GAP = 6;
export const SLIDER_HANDLE_WIDTH_PRESSED = 2;
export const SLIDER_INNER_CORNER = 2;
export const SLIDER_STOP = 4;
export const SLIDER_VALUE_INDICATOR_W = 48;
export const SLIDER_VALUE_INDICATOR_H = 44;
export const SLIDER_VALUE_INDICATOR_GAP = 12;

export const SLIDER_SIZES: Record<SliderSize, SliderSizeTokens> = {
  xs: { track: 16, handle: 44, handleWidth: 4, corner: 8, icon: 0, stopInset: 8 },
  sm: { track: 24, handle: 44, handleWidth: 4, corner: 8, icon: 0, stopInset: 8 },
  md: { track: 40, handle: 52, handleWidth: 4, corner: 12, icon: 24, stopInset: 12 },
  lg: { track: 56, handle: 68, handleWidth: 4, corner: 16, icon: 24, stopInset: 16 },
  xl: { track: 96, handle: 108, handleWidth: 4, corner: 28, icon: 32, stopInset: 28 },
};

export function resolveSliderSize(size: string | undefined): SliderSize {
  if (size === 'xs' || size === 'sm' || size === 'md' || size === 'lg' || size === 'xl') {
    return size;
  }
  /* Legacy aliases */
  if (size === 's') return 'sm';
  if (size === 'm') return 'md';
  if (size === 'l') return 'lg';
  return 'xs';
}

export function canInsetIcon(size: SliderSize, variant: SliderVariant): boolean {
  return variant === 'standard' && SLIDER_SIZES[size].icon > 0;
}