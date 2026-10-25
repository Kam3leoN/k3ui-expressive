import { describe, expect, it } from 'vitest';
import {
  SLIDER_HANDLE_GAP,
  SLIDER_HANDLE_GAP_PRESSED,
  SLIDER_HANDLE_WIDTH_PRESSED,
  SLIDER_ICON_MIN_PAIRS,
  SLIDER_SIZES,
  SLIDER_STOP,
  SLIDER_STOP_EDGE_INSET,
  SLIDER_VALUE_INDICATOR_GAP,
  canInsetIcon,
  resolveSliderSize,
  sliderIconAtMin,
} from '../../src/components/inputs/slider-tokens.js';

describe('slider tokens (M3 Expressive)', () => {
  it('exposes xs–xl track heights from M3 size table', () => {
    expect(SLIDER_SIZES.xs.track).toBe(16);
    expect(SLIDER_SIZES.sm.track).toBe(24);
    expect(SLIDER_SIZES.md.track).toBe(40);
    expect(SLIDER_SIZES.lg.track).toBe(56);
    expect(SLIDER_SIZES.xl.track).toBe(96);
  });

  it('scales vertical length with size', () => {
    expect(SLIDER_SIZES.xs.verticalLen).toBeLessThan(SLIDER_SIZES.md.verticalLen);
    expect(SLIDER_SIZES.md.verticalLen).toBeLessThan(SLIDER_SIZES.xl.verticalLen);
  });

  it('keeps handle taller than track, 4dp wide, 6dp gaps', () => {
    for (const t of Object.values(SLIDER_SIZES)) {
      expect(t.handle).toBeGreaterThan(t.track);
      expect(t.handleWidth).toBe(4);
    }
    expect(SLIDER_HANDLE_WIDTH_PRESSED).toBe(2);
    /* Gaps are plain dp tokens — layout must not × devicePixelRatio. */
    expect(SLIDER_HANDLE_GAP).toBe(4);
    expect(SLIDER_HANDLE_GAP_PRESSED).toBe(2);
    expect(SLIDER_STOP).toBe(4);
    expect(SLIDER_STOP_EDGE_INSET).toBe(6);
    expect(SLIDER_VALUE_INDICATOR_GAP).toBe(4);
  });

  it('allows inset icon only on standard · md+', () => {
    expect(canInsetIcon('xs', 'standard')).toBe(false);
    expect(canInsetIcon('md', 'standard')).toBe(true);
    expect(canInsetIcon('md', 'centered')).toBe(false);
    expect(canInsetIcon('xl', 'range')).toBe(false);
  });

  it('resolves size aliases and defaults', () => {
    expect(resolveSliderSize('sm')).toBe('sm');
    expect(resolveSliderSize('s')).toBe('sm');
    expect(resolveSliderSize(undefined)).toBe('xs');
  });

  it('maps common on→off inset icons (not volume-only)', () => {
    expect(sliderIconAtMin('volume_up')).toBe('volume_off');
    expect(sliderIconAtMin('mic')).toBe('mic_off');
    expect(sliderIconAtMin('wifi')).toBe('wifi_off');
    expect(sliderIconAtMin('videocam')).toBe('videocam_off');
    expect(sliderIconAtMin('bluetooth')).toBe('bluetooth_disabled');
    expect(sliderIconAtMin('unknown_glyph')).toBeUndefined();
    expect(Object.keys(SLIDER_ICON_MIN_PAIRS).length).toBeGreaterThan(5);
  });
});
