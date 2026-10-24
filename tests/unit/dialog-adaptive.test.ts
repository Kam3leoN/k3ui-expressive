import { describe, it, expect, afterEach } from 'vitest';
import { init } from '../../src/index.js';

type DialogEl = HTMLElement & {
  variant: 'basic' | 'fullscreen';
  adaptive: boolean;
  show: () => Promise<boolean>;
  hide: () => Promise<boolean>;
  updateComplete: Promise<unknown>;
  shadowRoot: ShadowRoot | null;
};

describe('k3-dialog adaptive fullscreen', () => {
  let el: DialogEl | null = null;

  afterEach(async () => {
    if (el) {
      if (el.isConnected) await el.hide().catch(() => undefined);
      el.remove();
      el = null;
    }
  });

  it('elevates to document.body while open (above shell stacking)', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-dialog', 'k3-button'], theme: { mode: 'light' } });
    const home = document.createElement('div');
    document.body.appendChild(home);
    el = document.createElement('k3-dialog') as DialogEl;
    el.innerHTML = `<span slot="headline">Hi</span><p>Body</p>`;
    home.appendChild(el);
    await el.updateComplete;

    await el.show();
    expect(el.parentNode).toBe(document.body);

    await el.hide();
    expect(el.parentNode).toBe(home);
    home.remove();
  });

  it('swaps fullscreen → basic when not compact (adaptive default)', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-dialog', 'k3-button'], theme: { mode: 'light' } });
    el = document.createElement('k3-dialog') as DialogEl;
    el.variant = 'fullscreen';
    el.adaptive = true;
    el.innerHTML = `
      <span slot="headline">Event</span>
      <k3-button slot="header-actions" variant="text">Save</k3-button>
      <p>Form</p>
    `;
    document.body.appendChild(el);
    await el.updateComplete;

    /* Force non-compact path via adaptive=false check first with compact override:
       property compact is private — assert via panel class after matchMedia. */
    const mq = window.matchMedia('(max-width: 599.98px)');
    await el.show();
    await el.updateComplete;
    const panel = el.shadowRoot?.querySelector('.panel');
    expect(panel).toBeTruthy();
    if (mq.matches) {
      expect(panel!.classList.contains('fullscreen')).toBe(true);
      expect(panel!.classList.contains('basic')).toBe(false);
    } else {
      expect(panel!.classList.contains('basic')).toBe(true);
      expect(panel!.classList.contains('fullscreen')).toBe(false);
      /* header-actions relocated to footer */
      const footerSlot = el.shadowRoot?.querySelector('.footer [part="header-actions"]');
      expect(footerSlot).toBeTruthy();
    }
    await el.hide();
  });

  it('keeps fullscreen when adaptive=false', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-dialog', 'k3-button'], theme: { mode: 'light' } });
    el = document.createElement('k3-dialog') as DialogEl;
    el.variant = 'fullscreen';
    el.adaptive = false;
    el.innerHTML = `<span slot="headline">Force FS</span>`;
    document.body.appendChild(el);
    await el.updateComplete;
    await el.show();
    await el.updateComplete;
    const panel = el.shadowRoot?.querySelector('.panel');
    expect(panel!.classList.contains('fullscreen')).toBe(true);
    await el.hide();
  });
});
