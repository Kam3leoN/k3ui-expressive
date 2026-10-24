import { describe, it, expect, beforeEach } from 'vitest';
import { themeApi } from '../../src/theme/apply.js';

describe('theme dark surfaces', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = '';
  });

  it('applies surface-container tokens in dark mode', () => {
    themeApi.apply({ seed: '#6750A4', mode: 'dark', motion: 'expressive' });
    const lowest = getComputedStyle(document.documentElement).getPropertyValue(
      '--k3-sys-color-surface-container-lowest',
    );
    const low = getComputedStyle(document.documentElement).getPropertyValue(
      '--k3-sys-color-surface-container-low',
    );
    // Inline styles are readable via style API
    expect(document.documentElement.style.getPropertyValue('--k3-sys-color-surface-container-lowest')).toMatch(
      /^#/,
    );
    expect(document.documentElement.style.getPropertyValue('--k3-sys-color-surface-container-low')).toMatch(
      /^#/,
    );
    expect(lowest || document.documentElement.style.getPropertyValue('--k3-sys-color-surface-container-lowest')).toBeTruthy();
    expect(low || document.documentElement.style.getPropertyValue('--k3-sys-color-surface-container-low')).toBeTruthy();
    // Dark lowest should not be pure white
    expect(
      document.documentElement.style.getPropertyValue('--k3-sys-color-surface-container-lowest').toLowerCase(),
    ).not.toBe('#ffffff');
  });
});
