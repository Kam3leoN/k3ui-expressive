import { describe, expect, it } from 'vitest';
import { Hct, argbFromHex } from '@material/material-color-utilities';
import { DEFAULT_COLOR_SPEC, themeApi, themeCssVars } from '../../src/theme/apply.js';
import '../../src/components/theme/theme.js';

const hue = (hex: string): number => Hct.fromInt(argbFromHex(hex)).hue;
const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};
const primary = (vars: Record<string, string>): string => vars['--k3-sys-color-primary']!;

describe('Material color spec', () => {
  it('defaults to the 2025 spec (Material 3 Expressive)', () => {
    expect(DEFAULT_COLOR_SPEC).toBe('2025');
  });

  it('2025 Expressive keeps the seed hue on primary; 2021 rotates it', () => {
    for (const seed of ['#6750A4', '#00639B', '#B35C00']) {
      const v2025 = primary(themeCssVars({ seed, variant: 'expressive' }));
      const v2021 = primary(themeCssVars({ seed, variant: 'expressive', specVersion: '2021' }));
      expect(hueDistance(hue(v2025), hue(seed)), `${seed} 2025`).toBeLessThan(25);
      expect(hueDistance(hue(v2021), hue(seed)), `${seed} 2021`).toBeGreaterThan(60);
    }
  });

  it('specVersion 2021 reproduces the legacy palette exactly', () => {
    const legacy = themeCssVars({ seed: '#6750A4', variant: 'expressive', specVersion: '2021' });
    expect(primary(legacy)).toBe('#006b5a');
  });

  it('themeApi.apply honours specVersion', () => {
    const target = document.createElement('div');
    themeApi.apply({ seed: '#6750A4', mode: 'light', variant: 'expressive', specVersion: '2021', target });
    expect(target.style.getPropertyValue('--k3-sys-color-primary')).toBe('#006b5a');
  });

  it('<k3-theme spec-version> forwards the spec', async () => {
    const el = document.createElement('k3-theme') as HTMLElement & { updateComplete: Promise<unknown> };
    el.setAttribute('primary-seed', '#6750A4');
    el.setAttribute('color-mode', 'light');
    el.setAttribute('spec-version', '2021');
    el.removeAttribute('global');
    (el as unknown as { global: boolean }).global = false;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.style.getPropertyValue('--k3-sys-color-primary')).toBe('#006b5a');
    el.remove();
  });
});
