import { describe, expect, it } from 'vitest';
import { wireTextFieldStepperDemo } from '../../playground/text-field-stepper-demo.js';

describe('wireTextFieldStepperDemo', () => {
  it('steps + / − / reset and disables − at the default of 1', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <k3-text-field data-tf-stepper value="1">
        <button type="button" class="tf-step tf-step--reset" hidden></button>
        <button type="button" class="tf-step tf-step--dec" disabled></button>
        <button type="button" class="tf-step tf-step--inc"></button>
      </k3-text-field>
    `;
    const field = root.querySelector('[data-tf-stepper]') as HTMLElement & { value?: string };
    const dec = root.querySelector('.tf-step--dec') as HTMLButtonElement;
    const inc = root.querySelector('.tf-step--inc') as HTMLButtonElement;
    const reset = root.querySelector('.tf-step--reset') as HTMLButtonElement;
    /* Unknown CE in jsdom — mirror the value attribute onto the property */
    field.value = field.getAttribute('value') ?? '1';

    wireTextFieldStepperDemo(root);
    expect(dec.disabled).toBe(true);
    expect(reset.hasAttribute('hidden')).toBe(true);

    inc.dispatchEvent(new Event('k3-click'));
    expect(field.value).toBe('2');
    expect(dec.disabled).toBe(false);
    expect(reset.hasAttribute('hidden')).toBe(false);

    dec.dispatchEvent(new Event('k3-click'));
    expect(field.value).toBe('1');
    expect(dec.disabled).toBe(true);
    expect(reset.hasAttribute('hidden')).toBe(true);

    inc.dispatchEvent(new Event('k3-click'));
    reset.dispatchEvent(new Event('k3-click'));
    expect(field.value).toBe('1');
    expect(reset.hasAttribute('hidden')).toBe(true);

    /* Idempotent */
    wireTextFieldStepperDemo(root);
    expect(field.dataset.stepperWired).toBe('1');
  });
});
