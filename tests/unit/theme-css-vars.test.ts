import { describe, expect, it } from 'vitest';
import { themeApi, themeCssVars } from '../../src/theme/apply.js';

describe('themeCssVars', () => {
  it('returns exactly what themeApi.apply() writes', () => {
    const target = document.createElement('div');
    themeApi.apply({ seed: '#6750A4', mode: 'light', variant: 'expressive', contrast: 'default', target });
    const vars = themeCssVars({ seed: '#6750A4', dark: false, variant: 'expressive', contrast: 'default' });
    expect(Object.keys(vars).length).toBeGreaterThan(40);
    for (const [name, value] of Object.entries(vars)) {
      expect(target.style.getPropertyValue(name), name).toBe(value);
    }
  });

  it('is pure — no DOM writes', () => {
    const before = document.documentElement.getAttribute('style');
    themeCssVars({ seed: '#00639B', dark: true });
    expect(document.documentElement.getAttribute('style')).toBe(before);
  });
});
