import { describe, it, expect } from 'vitest';
import {
  CIRCULAR_WAVE_AMP,
  CIRCULAR_WAVE_LEN,
  GAP_DP,
  LINEAR_WAVE_AMP,
  LINEAR_WAVE_LEN,
  STOP_DP,
  STOP_INSET_THICK_DP,
  indicatorAmplitudeFactor,
} from '../../src/components/feedback/progress-draw.js';

describe('progress-draw M3E tokens', () => {
  it('matches Compose Linear/CircularProgressIndicatorTokens', () => {
    expect(GAP_DP).toBe(4);
    expect(STOP_DP).toBe(4);
    expect(STOP_INSET_THICK_DP).toBe(2);
    expect(LINEAR_WAVE_AMP).toBe(3);
    expect(LINEAR_WAVE_LEN).toBe(40);
    expect(CIRCULAR_WAVE_AMP).toBe(1.6);
    expect(CIRCULAR_WAVE_LEN).toBe(15);
  });

  it('flattens amplitude near 0% and 100% so ends join', () => {
    expect(indicatorAmplitudeFactor(0)).toBe(0);
    expect(indicatorAmplitudeFactor(0.05)).toBe(0);
    expect(indicatorAmplitudeFactor(0.5)).toBe(1);
    expect(indicatorAmplitudeFactor(0.97)).toBe(0);
    expect(indicatorAmplitudeFactor(1)).toBe(0);
  });
});
