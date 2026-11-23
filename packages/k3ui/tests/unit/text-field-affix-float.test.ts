import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../../src/index.js';
import type { K3TextField } from '../../src/components/inputs/text-field.js';

beforeAll(async () => {
  window.K3UI_MANUAL = true;
  await init({ components: ['k3-text-field'], theme: { mode: 'light' } });
});

describe('k3-text-field affix float', () => {
  it('floats the label when suffix-text is set even if empty (no label/suffix overlap)', async () => {
    const el = document.createElement('k3-text-field') as K3TextField;
    el.variant = 'outlined';
    el.label = 'Concentration';
    el.suffixText = 'min';
    document.body.append(el);
    await el.updateComplete;

    expect(el.hasAttribute('data-floated')).toBe(true);
    expect(el.shadowRoot!.querySelector('[part="suffix"]')?.textContent?.trim()).toBe('min');

    el.remove();
  });

  it('does not float an empty outlined field without affix', async () => {
    const el = document.createElement('k3-text-field') as K3TextField;
    el.variant = 'outlined';
    el.label = 'Pause';
    document.body.append(el);
    await el.updateComplete;

    expect(el.hasAttribute('data-floated')).toBe(false);

    el.remove();
  });
});
