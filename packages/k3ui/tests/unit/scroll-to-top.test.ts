import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../src/components/navigation/scroll-to-top.js';
import type { K3ScrollToTop } from '../../src/components/navigation/scroll-to-top.js';

describe('k3-scroll-to-top', () => {
  let el: K3ScrollToTop;

  beforeEach(async () => {
    el = document.createElement('k3-scroll-to-top') as K3ScrollToTop;
    el.threshold = 50;
    el.emitOnComplete = true;
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
    window.scrollTo(0, 0);
  });

  it('renders circular own container with progress ring by default', () => {
    const control = el.shadowRoot!.querySelector('.control') as HTMLButtonElement;
    expect(control).toBeTruthy();
    expect(control.getAttribute('part')).toBe('container');
    expect(el.shadowRoot!.querySelector('.ring-progress')).toBeTruthy();
    expect(el.shadowRoot!.querySelector('[data-k3-icon]')?.getAttribute('data-k3-icon')).toBe(
      'keyboard_arrow_up',
    );
  });

  it('shows when scroll passes threshold', async () => {
    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    await el.updateComplete;
    expect(el.hasAttribute('data-visible')).toBe(true);
  });

  it('scrollToTop dispatches k3-scroll-top when motion reduced', async () => {
    Object.defineProperty(window, 'scrollY', { value: 200, configurable: true });
    document.documentElement.setAttribute('data-k3-reduce-motion', '');

    const onTop = vi.fn();
    el.addEventListener('k3-scroll-top', onTop as EventListener);
    el.scrollToTop();
    expect(onTop).toHaveBeenCalledTimes(1);
    document.documentElement.removeAttribute('data-k3-reduce-motion');
  });

  it('tracks a custom scroll-container element', async () => {
    const box = document.createElement('div');
    box.className = 'test-scroll-root';
    Object.defineProperty(box, 'scrollTop', { value: 0, writable: true, configurable: true });
    Object.defineProperty(box, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(box, 'clientHeight', { value: 400, configurable: true });
    document.body.appendChild(box);

    el.scrollContainer = '.test-scroll-root';
    await el.updateComplete;
    box.scrollTop = 200;
    box.dispatchEvent(new Event('scroll'));
    await el.updateComplete;
    expect(el.hasAttribute('data-visible')).toBe(true);
    box.remove();
  });
});
