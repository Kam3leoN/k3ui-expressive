import { describe, it, expect } from 'vitest';
import { init } from '../../src/index.js';
import type { K3Button } from '../../src/components/actions/button.js';

describe('k3-button', () => {
  it('renders slots and emits press lifecycle', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-button'], theme: { mode: 'light' } });
    const el = document.createElement('k3-button') as K3Button;
    el.innerHTML = `<span slot="icon">★</span>Label<span slot="trailing-icon">→</span>`;
    document.body.appendChild(el);
    await el.updateComplete;
    // slotchange → sync
    await el.updateComplete;

    const presses: string[] = [];
    el.addEventListener('k3-press-start', () => presses.push('start'));
    el.addEventListener('k3-press-end', () => presses.push('end'));
    el.addEventListener('k3-click', () => presses.push('click'));

    const btn = el.shadowRoot!.querySelector('button')!;
    btn.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(el.hasAttribute('data-pressed')).toBe(true);
    btn.dispatchEvent(new Event('pointerup', { bubbles: true }));
    btn.click();

    expect(presses).toEqual(['start', 'end', 'click']);
    expect(el.shadowRoot!.querySelector('.icon.has')).toBeTruthy();
    expect(el.shadowRoot!.querySelector('.trailing.has')).toBeTruthy();
    expect(el.shadowRoot!.querySelector('.label.has')).toBeTruthy();
    el.remove();
  });
});
