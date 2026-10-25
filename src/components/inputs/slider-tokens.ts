/**
 * M3 Expressive slider size tokens
 * @see https://m3.material.io/components/sliders/specs
 *
 * K3 API uses `xs`·`sm`·`md`·`lg`·`xl` (convention A).
 */

export type SliderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SliderOrientation = 'horizontal' | 'vertical';
export type SliderVariant = 'standard' | 'centered' | 'range';
/** Active / handle color role (track stays secondary-container). */
export type SliderColor = 'primary' | 'secondary' | 'tertiary' | 'error';

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
  /** Default vertical track length (dp) — scales with size like M3 demos. */
  verticalLen: number;
}

/** Common across sizes (M3 Expressive) — rest gap (pressed uses pressed token). */
export const SLIDER_HANDLE_GAP = 4;
/** Gap while pressed / dragging — tracks tighten toward the handle. */
export const SLIDER_HANDLE_GAP_PRESSED = 2;
export const SLIDER_HANDLE_WIDTH_PRESSED = 2;
/** Select-jump animation (track tap away from handle). */
export const SLIDER_JUMP_MS = 280;
export const SLIDER_INNER_CORNER = 2;
export const SLIDER_STOP = 4;
/** First / last stop center inset from track ends (all sizes). */
export const SLIDER_STOP_EDGE_INSET = 6;
export const SLIDER_VALUE_INDICATOR_W = 48;
export const SLIDER_VALUE_INDICATOR_H = 44;
/** Gap between handle tip and value-indicator bubble (all sizes). */
export const SLIDER_VALUE_INDICATOR_GAP = 4;

export const SLIDER_SIZES: Record<SliderSize, SliderSizeTokens> = {
  xs: { track: 16, handle: 44, handleWidth: 4, corner: 8, icon: 0, verticalLen: 192 },
  sm: { track: 24, handle: 44, handleWidth: 4, corner: 8, icon: 0, verticalLen: 208 },
  md: { track: 40, handle: 52, handleWidth: 4, corner: 12, icon: 24, verticalLen: 240 },
  lg: { track: 56, handle: 68, handleWidth: 4, corner: 16, icon: 24, verticalLen: 280 },
  xl: { track: 96, handle: 108, handleWidth: 4, corner: 28, icon: 32, verticalLen: 360 },
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

/**
 * Common Material Symbol “on → off” pairs for `slot="icon-min"`.
 * The slider never hardcodes an icon — consumers slot any glyphs; this map
 * is a convenience when wiring `data-k3-icon` for the min state.
 *
 * @example
 * ```ts
 * const min = sliderIconAtMin('mic'); // 'mic_off'
 * ```
 */
export const SLIDER_ICON_MIN_PAIRS: Readonly<Record<string, string>> = {
  volume_up: 'volume_off',
  volume_down: 'volume_off',
  volume_mute: 'volume_off',
  mic: 'mic_off',
  videocam: 'videocam_off',
  wifi: 'wifi_off',
  bluetooth: 'bluetooth_disabled',
  notifications: 'notifications_off',
  visibility: 'visibility_off',
  location_on: 'location_off',
  hearing: 'hearing_disabled',
  sensors: 'sensors_off',
  cloud: 'cloud_off',
  signal_cellular_alt: 'signal_cellular_off',
};

/** Resolve a typical barred / off glyph for an inset “on” icon name, if known. */
export function sliderIconAtMin(iconName: string): string | undefined {
  const key = iconName.trim();
  if (!key) return undefined;
  return SLIDER_ICON_MIN_PAIRS[key];
}