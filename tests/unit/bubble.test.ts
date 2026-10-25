import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import '../../src/components/containment/bubble.js';
import type { K3Bubble } from '../../src/components/containment/bubble.js';

describe('k3-bubble', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({ components: [], theme: { mode: 'light' } });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('mounts with placement and body color class', async () => {
    host.innerHTML = `<k3-bubble placement="end" color="primary">Hello</k3-bubble>`;
    const el = host.querySelector('k3-bubble') as K3Bubble;
    await el.updateComplete;
    expect(el.placement).toBe('end');
    const body = el.shadowRoot!.querySelector('.bubble__body--primary');
    expect(body).toBeTruthy();
    expect(el.textContent).toContain('Hello');
  });

  it('setColor updates the body variant', async () => {
    host.innerHTML = `<k3-bubble>Msg</k3-bubble>`;
    const el = host.querySelector('k3-bubble') as K3Bubble;
    await el.updateComplete;
    el.setColor('error');
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.bubble__body--error')).toBeTruthy();
  });
});
