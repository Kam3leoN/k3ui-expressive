import { describe, expect, it } from 'vitest';
import { Hct, argbFromHex } from '@material/material-color-utilities';
import { AMOLED_SURFACE_TONES, themeApi, themeCssVars } from '../../src/theme/apply.js';
import '../../src/components/theme/theme.js';

const v = (vars: Record<string, string>, role: string): string =>
  vars[`--k3-sys-color-${role}`]!;
const tone = (hex: string): number => Hct.fromInt(argbFromHex(hex)).tone;

describe('AMOLED (pure black) dark theme', () => {
  it('turns background and base surfaces pure black in dark', () => {
    const vars = themeCssVars({ seed: '#3F51B5', dark: true, amoled: true });
    for (const role of ['background', 'surface', 'surface-dim', 'surface-container-lowest']) {
      expect(v(vars, role), role).toBe('#000000');
      expect(vars[`--md-sys-color-${role}`], `md ${role}`).toBe('#000000');
    }
  });

  it('keeps containers strictly above black, in elevation order', () => {
    const vars = themeCssVars({ seed: '#3F51B5', dark: true, amoled: true });
    const ladder = [
      'surface-container-low',
      'surface-container',
      'surface-container-high',
      'surface-container-highest',
    ].map((r) => tone(v(vars, r)));
    expect(ladder[0]).toBeGreaterThan(0);
    for (let i = 1; i < ladder.length; i++) expect(ladder[i]).toBeGreaterThan(ladder[i - 1]!);
    expect(Object.keys(AMOLED_SURFACE_TONES)).toContain('surfaceBright');
  });

  it('is darker than the standard dark scheme and leaves accents untouched', () => {
    const dark = themeCssVars({ seed: '#3F51B5', dark: true });
    const amoled = themeCssVars({ seed: '#3F51B5', dark: true, amoled: true });
    expect(v(dark, 'surface')).not.toBe('#000000');
    expect(tone(v(amoled, 'surface-container'))).toBeLessThan(tone(v(dark, 'surface-container')));
    for (const role of ['primary', 'on-primary', 'secondary', 'tertiary', 'error', 'on-surface', 'outline']) {
      expect(v(amoled, role), role).toBe(v(dark, role));
    }
  });

  it('is ignored in light mode', () => {
    expect(themeCssVars({ seed: '#3F51B5', amoled: true })).toEqual(themeCssVars({ seed: '#3F51B5' }));
    const target = document.createElement('div');
    themeApi.apply({ seed: '#3F51B5', mode: 'light', amoled: true, target });
    expect(target.style.getPropertyValue('--k3-sys-color-surface')).not.toBe('#000000');
    expect('k3Amoled' in target.dataset).toBe(false);
  });

  it('themeApi.apply writes black surfaces and data-k3-amoled, then reverts', () => {
    const target = document.createElement('div');
    themeApi.apply({ seed: '#3F51B5', mode: 'dark', amoled: true, target });
    expect(target.style.getPropertyValue('--k3-sys-color-surface')).toBe('#000000');
    expect('k3Amoled' in target.dataset).toBe(true);
    themeApi.apply({ seed: '#3F51B5', mode: 'dark', amoled: false, target });
    expect(target.style.getPropertyValue('--k3-sys-color-surface')).not.toBe('#000000');
    expect('k3Amoled' in target.dataset).toBe(false);
  });

  it('<k3-theme amoled> forwards the option', async () => {
    const el = document.createElement('k3-theme') as HTMLElement & {
      updateComplete: Promise<unknown>;
      global: boolean;
    };
    el.global = false;
    el.setAttribute('color-mode', 'dark');
    el.setAttribute('amoled', '');
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.style.getPropertyValue('--k3-sys-color-background')).toBe('#000000');
    el.remove();
  });
});
