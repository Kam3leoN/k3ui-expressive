import { describe, it, expect } from 'vitest';
import { focusRingStyles } from '../../src/core/focus-ring.js';

describe('focusRingStyles', () => {
  it('exports reusable CSSResult with k3-focus-ring', () => {
    expect(focusRingStyles).toBeTruthy();
    expect(String(focusRingStyles)).toContain('k3-focus-ring');
    expect(String(focusRingStyles)).toContain('k3-focus-ring-grow-shrink');
  });
});
