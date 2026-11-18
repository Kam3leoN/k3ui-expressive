import { describe, expect, it } from 'vitest';
import { themeCssVars } from '../../src/theme/apply.js';
import { K3Theme } from '../../src/components/theme/theme.js';
import {
  DEFAULT_THEME,
  THEME_SEEDS,
  defaultThemeSeed,
  isThemeAwayFromDefaults,
} from '../../playground/theme-defaults.js';

describe('default theme — Indigo · 2025 · tonalspot', () => {
  it('playground DEFAULT_THEME uses indigo seed, tonalspot, spec 2025', () => {
    expect(THEME_SEEDS[DEFAULT_THEME.seedIdx]).toBe('#3F51B5');
    expect(DEFAULT_THEME.variant).toBe('tonalspot');
    expect(DEFAULT_THEME.spec).toBe('2025');
    expect(DEFAULT_THEME.mode).toBe('light');
  });

  it('themeCssVars() with no args matches indigo tonalspot 2025 light', () => {
    const defaults = themeCssVars();
    const explicit = themeCssVars({
      seed: '#3F51B5',
      dark: false,
      variant: 'tonalspot',
      contrast: 'default',
      specVersion: '2025',
    });
    expect(defaults).toEqual(explicit);
    expect(defaults['--k3-sys-color-primary']).toBe('#545c8c');
    expect(defaults['--k3-sys-color-surface']).toBe('#fbf8fe');
  });

  it('k3-theme element properties default to indigo tonalspot', () => {
    const el = new K3Theme();
    expect(el.primarySeed).toBe('#3F51B5');
    expect(el.colorVariant).toBe('tonalspot');
    expect(el.specVersion).toBe('2025');
  });

  it('isThemeAwayFromDefaults is false for native defaults', () => {
    expect(
      isThemeAwayFromDefaults({
        seed: defaultThemeSeed(),
        mode: DEFAULT_THEME.mode,
        variant: DEFAULT_THEME.variant,
        contrast: DEFAULT_THEME.contrast,
        spec: DEFAULT_THEME.spec,
      }),
    ).toBe(false);
    expect(
      isThemeAwayFromDefaults({
        seed: '#3f51b5',
        mode: DEFAULT_THEME.mode,
        variant: DEFAULT_THEME.variant,
        contrast: DEFAULT_THEME.contrast,
        spec: DEFAULT_THEME.spec,
      }),
    ).toBe(false);
  });

  it('isThemeAwayFromDefaults is true when seed / variant / mode / spec diverge', () => {
    const base = {
      seed: defaultThemeSeed(),
      mode: DEFAULT_THEME.mode,
      variant: DEFAULT_THEME.variant,
      contrast: DEFAULT_THEME.contrast,
      spec: DEFAULT_THEME.spec,
    };
    expect(isThemeAwayFromDefaults({ ...base, seed: '#6750A4' })).toBe(true);
    expect(isThemeAwayFromDefaults({ ...base, variant: 'expressive' })).toBe(true);
    expect(isThemeAwayFromDefaults({ ...base, mode: 'dark' })).toBe(true);
    expect(isThemeAwayFromDefaults({ ...base, contrast: 'high' })).toBe(true);
    expect(isThemeAwayFromDefaults({ ...base, spec: '2021' })).toBe(true);
  });
});
