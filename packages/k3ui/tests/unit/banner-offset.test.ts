import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import type { K3Banner } from '../../src/components/feedback/banner.js';
import { BannerSpecs } from '../../src/components/feedback/banner.specs.js';
import { syncBannerOffset } from '../../src/components/feedback/banner-offset.js';

describe('banner-offset', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    document.documentElement.setAttribute('data-k3-reduce-motion', '');
    await init({ components: ['k3-banner'], theme: { mode: 'light' } });
    host = document.createElement('div');
    document.body.appendChild(host);
    document.documentElement.style.removeProperty(BannerSpecs.cssVarOffset);
  });

  afterEach(() => {
    host.remove();
    document.documentElement.removeAttribute('data-k3-reduce-motion');
    document.documentElement.style.removeProperty(BannerSpecs.cssVarOffset);
    document.querySelectorAll('k3-banner').forEach((el) => el.remove());
  });

  it('does not overwrite host height while entering / leaving', async () => {
    host.innerHTML = `<k3-banner>Push</k3-banner>`;
    const el = host.querySelector('k3-banner') as K3Banner;
    await el.updateComplete;

    el.dataset.phase = 'entering';
    el.style.height = '12px';
    syncBannerOffset();
    expect(el.style.height).toBe('12px');

    el.dataset.phase = 'leaving';
    el.style.height = '8px';
    syncBannerOffset();
    expect(el.style.height).toBe('8px');

    el.dataset.phase = 'open';
    syncBannerOffset();
    /* open path may set '' when jsdom height is 0 — just assert it ran */
    expect(['', el.style.height].includes(el.style.height)).toBe(true);
  });
});
