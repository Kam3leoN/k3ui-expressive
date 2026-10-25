import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import type { K3Counter } from '../../src/components/inputs/counter.js';

describe('k3-counter', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-counter'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  async function mount(html: string): Promise<K3Counter> {
    host.innerHTML = html;
    const el = host.querySelector('k3-counter') as K3Counter;
    await el.updateComplete;
    return el;
  }

  function buttons(el: K3Counter): { inc: HTMLButtonElement; dec: HTMLButtonElement } {
    const root = el.shadowRoot!;
    return {
      dec: root.querySelector('.btn--decrement') as HTMLButtonElement,
      inc: root.querySelector('.btn--increment') as HTMLButtonElement,
    };
  }

  it('increments / decrements within bounds', async () => {
    const el = await mount(`<k3-counter value="2" min="0" max="5" step="1"></k3-counter>`);
    el.setValue(3);
    expect(el.getValue()).toBe(3);
    el.setValue(10);
    expect(el.getValue()).toBe(5);
  });

  it('respects step palier (10)', async () => {
    const el = await mount(`<k3-counter value="20" min="0" max="100" step="10"></k3-counter>`);
    const { inc, dec } = buttons(el);
    const onInc = vi.fn();
    el.addEventListener('k3-increment', onInc as EventListener);
    inc.click();
    await el.updateComplete;
    expect(el.getValue()).toBe(30);
    expect(onInc).toHaveBeenCalledTimes(1);
    dec.click();
    await el.updateComplete;
    expect(el.getValue()).toBe(20);
  });

  it('allows negatives with allow-negative', async () => {
    const el = await mount(
      `<k3-counter value="0" min="-20" max="20" step="1" allow-negative></k3-counter>`,
    );
    const { dec } = buttons(el);
    expect(dec.disabled).toBe(false);
    dec.click();
    await el.updateComplete;
    expect(el.getValue()).toBe(-1);
    el.setValue(-25);
    expect(el.getValue()).toBe(-20);
  });

  it('allows negatives when min < 0 without allow-negative flag', async () => {
    const el = await mount(`<k3-counter value="0" min="-5" max="5" step="1"></k3-counter>`);
    const { dec } = buttons(el);
    dec.click();
    await el.updateComplete;
    expect(el.getValue()).toBe(-1);
  });

  it('blocks negatives by default', async () => {
    const el = await mount(`<k3-counter value="0" max="5" step="1"></k3-counter>`);
    const { dec } = buttons(el);
    expect(dec.disabled).toBe(true);
    el.setValue(-3);
    expect(el.getValue()).toBe(0);
  });

  it('disabled blocks interaction but setValue still works', async () => {
    const el = await mount(`<k3-counter value="3" min="0" max="9" disabled></k3-counter>`);
    const { inc, dec } = buttons(el);
    expect(inc.disabled).toBe(true);
    expect(dec.disabled).toBe(true);
    const onChange = vi.fn();
    el.addEventListener('k3-change', onChange as EventListener);
    inc.click();
    await el.updateComplete;
    expect(el.getValue()).toBe(3);
    expect(onChange).not.toHaveBeenCalled();
    el.setValue(7);
    expect(el.getValue()).toBe(7);
    expect(onChange).toHaveBeenCalledTimes(1);
    const group = el.shadowRoot!.querySelector('[part="container"]');
    expect(group?.getAttribute('aria-disabled')).toBe('true');
  });
});
