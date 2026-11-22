import { describe, it, expect } from 'vitest';
import { init } from '../../src/index.js';

describe('k3-dialog lifecycle', () => {
  it('emits open/close start-end and supports cancel', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-dialog', 'k3-button'], theme: { mode: 'light' } });
    const el = document.createElement('k3-dialog') as HTMLElement & {
      show: () => Promise<boolean>;
      hide: () => Promise<boolean>;
      updateComplete: Promise<unknown>;
    };
    el.innerHTML = `<span slot="headline">Hi</span><p>Body</p>`;
    document.body.appendChild(el);
    await el.updateComplete;

    const events: string[] = [];
    for (const name of ['k3-open-start', 'k3-open-end', 'k3-close-start', 'k3-close-end']) {
      el.addEventListener(name, () => events.push(name));
    }

    const opened = await el.show();
    expect(opened).toBe(true);
    expect(events.slice(0, 2)).toEqual(['k3-open-start', 'k3-open-end']);

    const closed = await el.hide();
    expect(closed).toBe(true);
    expect(events).toContain('k3-close-start');
    expect(events).toContain('k3-close-end');

    el.addEventListener('k3-open-start', (e) => e.preventDefault(), { once: true });
    const canceled = await el.show();
    expect(canceled).toBe(false);
    el.remove();
  });

  it('closes on backdrop / outside pointerdown', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-dialog'], theme: { mode: 'light' } });
    const el = document.createElement('k3-dialog') as HTMLElement & {
      show: () => Promise<boolean>;
      open: boolean;
      updateComplete: Promise<unknown>;
    };
    el.innerHTML = `<span slot="headline">Hi</span><p>Body</p>`;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(await el.show()).toBe(true);
    await el.updateComplete;
    /* Settle outside-dismiss microtask from activateModal */
    await Promise.resolve();
    await Promise.resolve();

    const backdrop = el.shadowRoot?.querySelector('.backdrop') as HTMLElement;
    expect(backdrop).toBeTruthy();
    backdrop.dispatchEvent(new Event('pointerdown', { bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 400));
    expect(el.open).toBe(false);
    el.remove();
  });
});
