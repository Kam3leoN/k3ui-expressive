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
});
