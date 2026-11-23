import { describe, expect, it } from 'vitest';
import { textFieldStyles } from '../../src/components/inputs/text-field.styles.js';

describe('k3-text-field number / tel input min-width', () => {
  it('keeps 26ch floor for text and a smaller floor for number/tel', () => {
    const css = String(textFieldStyles);
    expect(css).toMatch(/input\.control\s*\{[^}]*min-width:\s*var\(--k3-text-field-input-min-width,\s*26ch\)/s);
    expect(css).toMatch(
      /:host\(\[type='number'\]\)\s*input\.control\s*,\s*:host\(\[type='tel'\]\)\s*input\.control\s*\{[^}]*min-width:\s*var\(--k3-text-field-input-min-width,\s*3ch\)/s,
    );
  });

  it('hides native number spinners so trailing ± controls can replace them', () => {
    const css = String(textFieldStyles);
    expect(css).toMatch(/::-webkit-inner-spin-button/);
    expect(css).toMatch(/appearance:\s*textfield/);
  });
});
