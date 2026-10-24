import { describe, it, expect, afterEach } from 'vitest';
import { init } from '../../src/index.js';

type RippleEl = HTMLElement & {
  disabled: boolean;
  unbounded: boolean;
  updateComplete: Promise<unknown>;
  shadowRoot: ShadowRoot | null;
};

describe('k3-ripple', () => {
  let host: HTMLElement | null = null;

  afterEach(() => {
    host?.remove();
    host = null;
  });

  it('renders surface and attaches to parent', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-ripple'], theme: { mode: 'light' } });
    host = document.createElement('button');
    host.style.position = 'relative';
    host.style.width = '120px';
    host.style.height = '40px';
    const ripple = document.createElement('k3-ripple') as RippleEl;
    host.appendChild(ripple);
    document.body.appendChild(host);
    await ripple.updateComplete;

    expect(ripple.shadowRoot?.querySelector('.surface')).toBeTruthy();
    expect(ripple.getAttribute('aria-hidden')).toBe('true');
  });
});
