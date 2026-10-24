import { describe, expect, it } from 'vitest';
import {
  SLIDER_HANDLE_GAP,
  SLIDER_HANDLE_WIDTH_PRESSED,
  SLIDER_SIZES,
  SLIDER_STOP,
  canInsetIcon,
  resolveSliderSize,
} from '../../src/components/inputs/slider-tokens.js';

describe('slider tokens (M3 Expressive)', () => {
  it('exposes xs–xl track heights from M3 size table', () => {
    expect(SLIDER_SIZES.xs.track).toBe(16);
    expect(SLIDER_SIZES.sm.track).toBe(24);
    expect(SLIDER_SIZES.md.track).toBe(40);
    expect(SLIDER_SIZES.lg.track).toBe(56);
    expect(SLIDER_SIZES.xl.track).toBe(96);
  });

  it('keeps handle taller than track, 4dp wide, 6dp gap', () => {
    for (const t of Object.values(SLIDER_SIZES)) {
      expect(t.handle).toBeGreaterThan(t.track);
      expect(t.handleWidth).toBe(4);
    }
    expect(SLIDER_HANDLE_WIDTH_PRESSED).toBe(2);
    expect(SLIDER_HANDLE_GAP).toBe(6);
    expect(SLIDER_STOP).toBe(4);
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
});
