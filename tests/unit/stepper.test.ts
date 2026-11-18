import { describe, it, expect, vi } from 'vitest';
import { init } from '../../src/index.js';
import type { K3Stepper } from '../../src/components/navigation/stepper.js';

describe('k3-stepper', () => {
  it('renders tablist, advances with next(), fires k3-change', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-stepper', 'k3-step'], theme: { mode: 'light' } });

    const el = document.createElement('k3-stepper') as K3Stepper;
    el.linear = true;
    el.innerHTML = `
      <k3-step label="One" completed><p>1</p></k3-step>
      <k3-step label="Two"><p>2</p></k3-step>
    `;
    document.body.appendChild(el);
    await el.updateComplete;
    await el.updateComplete;

    const tablist = el.shadowRoot!.querySelector('[role="tablist"]');
    expect(tablist).toBeTruthy();
    expect(el.shadowRoot!.querySelectorAll('[role="tab"]').length).toBe(2);

    const onChange = vi.fn();
    el.addEventListener('k3-change', onChange);
    el.next();
    await el.updateComplete;
    expect(el.selectedIndex).toBe(1);
    expect(onChange).toHaveBeenCalled();

    const steps = el.querySelectorAll('k3-step');
    expect(steps[1]?.hasAttribute('active')).toBe(true);
    el.remove();
  });

  it('ArrowRight moves focus and selection', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-stepper', 'k3-step'], theme: { mode: 'light' } });
    const el = document.createElement('k3-stepper') as K3Stepper;
    el.innerHTML = `<k3-step label="A"></k3-step><k3-step label="B"></k3-step>`;
    document.body.appendChild(el);
    await el.updateComplete;
    const tab = el.shadowRoot!.querySelector<HTMLButtonElement>('[role="tab"]');
    tab?.focus();
    tab?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    await el.updateComplete;
    expect(el.selectedIndex).toBe(1);
    el.remove();
  });
});