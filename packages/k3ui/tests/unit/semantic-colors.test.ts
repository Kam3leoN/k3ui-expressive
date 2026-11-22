import { describe, expect, it } from 'vitest';
import {
  buildSemanticCssVars,
  onColorFor,
  SEMANTIC_COLOR_ROLES,
  SEMANTIC_SEEDS,
} from '../../src/theme/semantic.js';

describe('semantic color roles', () => {
  it('emits success / warning / info / note role vars for light and dark', () => {
    for (const dark of [false, true]) {
      const vars = buildSemanticCssVars(dark);
      for (const role of SEMANTIC_COLOR_ROLES) {
        const kebab = role.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
        const key = `--k3-sys-color-${kebab}`;
        expect(vars[key], key).toMatch(/^#[0-9a-f]{6}$/i);
        expect(vars[`--md-sys-color-${kebab}`]).toBe(vars[key]);
      }
    }
  });

  it('keeps warning / note seed hex as the light role color', () => {
    const vars = buildSemanticCssVars(false);
    expect(vars['--k3-sys-color-warning']).toBe(SEMANTIC_SEEDS.warning);
    expect(vars['--k3-sys-color-note']).toBe(SEMANTIC_SEEDS.note);
  });

  it('picks on* — white on success/info, dark on warning/note (AA)', () => {
    expect(onColorFor(SEMANTIC_SEEDS.success)).toBe('#FFFFFF');
    expect(onColorFor(SEMANTIC_SEEDS.info)).toBe('#FFFFFF');
    expect(onColorFor(SEMANTIC_SEEDS.warning)).toBe('#1C1B1F');
    expect(onColorFor(SEMANTIC_SEEDS.note)).toBe('#1C1B1F');

    const vars = buildSemanticCssVars(false);
    expect(vars['--k3-sys-color-warning']).toBe('#FB8C00');
    expect(vars['--k3-sys-color-on-success']).toBe('#FFFFFF');
    expect(vars['--k3-sys-color-on-info']).toBe('#FFFFFF');
    expect(vars['--k3-sys-color-on-warning']).toBe('#1C1B1F');
    expect(vars['--k3-sys-color-on-note']).toBe('#1C1B1F');
  });

  it('warning + dark on* meets WCAG AA (≥4.5:1)', () => {
    const vars = buildSemanticCssVars(false);
    const warn = vars['--k3-sys-color-warning']!;
    const on = vars['--k3-sys-color-on-warning']!;
    const lin = (c: number) => {
      const x = c / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    const L = (hex: string) => {
      const n = Number.parseInt(hex.slice(1), 16);
      return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
    };
    const ratio = (a: string, b: string) => {
      const x = L(a);
      const y = L(b);
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    };
    expect(ratio(warn, on)).toBeGreaterThanOrEqual(4.5);
  });
});



