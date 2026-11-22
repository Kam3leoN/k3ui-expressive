import { describe, it, expect, afterEach } from 'vitest';
import { init } from '../../src/index.js';

type SkeletonEl = HTMLElement & {
  animation: string;
  shape: string;
  loaded: boolean;
  updateComplete: Promise<unknown>;
  shadowRoot: ShadowRoot | null;
};

describe('k3-skeleton', () => {
  let el: SkeletonEl | null = null;

  afterEach(() => {
    el?.remove();
    el = null;
  });

  it('renders wave bone by default and fades when loaded', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-skeleton'], theme: { mode: 'light' } });
    el = document.createElement('k3-skeleton') as SkeletonEl;
    el.style.width = '8rem';
    el.style.height = '1rem';
    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.animation).toBe('wave');
    expect(el.getAttribute('aria-busy')).toBe('true');
    const bone = el.shadowRoot?.querySelector('.bone');
    expect(bone?.classList.contains('wave')).toBe(true);

    el.loaded = true;
    await el.updateComplete;
    expect(el.getAttribute('aria-busy')).toBe('false');
    expect(el.hasAttribute('loaded')).toBe(true);
  });

  it('covers slotted content until loaded', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-skeleton'], theme: { mode: 'light' } });
    el = document.createElement('k3-skeleton') as SkeletonEl;
    el.innerHTML = `<p id="skel-body">Hello</p>`;
    document.body.appendChild(el);
    await el.updateComplete;
    await el.updateComplete;

    expect(el.hasAttribute('has-content')).toBe(true);
    const slot = el.shadowRoot?.querySelector('slot');
    expect(slot?.hasAttribute('inert')).toBe(true);

    el.loaded = true;
    await el.updateComplete;
    expect(slot?.hasAttribute('inert')).toBe(false);
  });
});
