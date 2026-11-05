import { afterEach, describe, expect, it, vi } from 'vitest';
import { init, getInitOptions } from '../../src/bootstrap/init.js';
import { themeApi } from '../../src/theme/apply.js';
import { i18n } from '../../src/i18n/index.js';
import { overlayStack } from '../../src/core/overlay-stack.js';
import { watchIconLigatures } from '../../src/icons/ligature.js';

const root = document.documentElement;

describe('K3UI.init() configuration', () => {
  afterEach(() => vi.restoreAllMocks());

  it('deep-merges successive calls (a later theme.mode keeps the seed)', async () => {
    await init({ components: [], theme: { seed: '#00639B', mode: 'light' } });
    await init({ theme: { mode: 'dark' } });
    expect(themeApi.getLastOptions()).toMatchObject({ seed: '#00639B', mode: 'dark' });
    expect(root.dataset.k3ColorMode).toBe('dark');
    expect(getInitOptions().theme).toMatchObject({ seed: '#00639B', mode: 'dark' });
  });

  it('a re-init for another setting does not reset K3UI.theme.apply() changes', async () => {
    await init({ components: [] });
    themeApi.apply({ seed: '#B3261E', variant: 'vibrant' });
    await init({ locale: 'fr-FR' });
    expect(i18n.locale).toBe('fr');
    expect(themeApi.getLastOptions()).toMatchObject({ seed: '#B3261E', variant: 'vibrant' });
  });

  it('serializes concurrent calls — the last one wins', async () => {
    await Promise.all([
      init({ theme: { seed: '#111111' } }),
      init({ theme: { seed: '#222222' } }),
      init({ theme: { seed: '#333333' } }),
    ]);
    expect(themeApi.getLastOptions().seed).toBe('#333333');
  });

  it('warns about unknown keys / invalid values and ignores them (no prototype pollution)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const before = themeApi.getLastOptions().seed;
    await init(JSON.parse('{"__proto__":{"polluted":true},"theme":{"seed":"red","mode":"neon"},"nope":1}'));
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(themeApi.getLastOptions().seed).toBe(before);
    expect(themeApi.getLastOptions().mode).not.toBe('neon');
    const messages = warn.mock.calls.map((c) => String(c[0]));
    expect(messages.some((m) => m.includes('theme.seed'))).toBe(true);
    expect(messages.some((m) => m.includes('theme.mode'))).toBe(true);
    expect(messages.some((m) => m.includes('"nope"'))).toBe(true);
  });

  it('applies direction, reduced motion, ripple and overlay settings', async () => {
    await init({
      direction: 'rtl',
      motion: { reduce: 'always' },
      interaction: { ripple: false },
      overlays: { scrollLock: true },
    });
    expect(root.dir).toBe('rtl');
    expect(root.hasAttribute('data-k3-reduce-motion')).toBe(true);
    expect(root.dataset.k3Ripple).toBe('off');
    expect(overlayStack.scrollLock).toBe(true);

    await init({ direction: 'ltr', motion: { reduce: 'system' }, interaction: { ripple: true }, overlays: { scrollLock: false } });
    expect(root.dir).toBe('ltr');
    expect(root.hasAttribute('data-k3-reduce-motion')).toBe(false);
    expect(root.dataset.k3Ripple).toBeUndefined();
    expect(overlayStack.scrollLock).toBe(false);
  });

  it('keeps a single icon-ligature observer however many times init runs', async () => {
    await init({});
    await init({});
    expect(watchIconLigatures(document)).toBe(watchIconLigatures(document));
  });
});

describe('themeApi targets', () => {
  it('a local target never becomes the default target of later calls', () => {
    const local = document.createElement('section');
    document.body.append(local);
    themeApi.apply({ seed: '#6750A4', mode: 'light', target: local });
    themeApi.apply({ mode: 'dark' });
    expect(root.dataset.k3ColorMode).toBe('dark');
    expect(local.dataset.k3ColorMode).toBe('light');
    expect('target' in themeApi.getLastOptions()).toBe(false);
    themeApi.release(local);
    local.remove();
  });

  it('contrast "auto" follows prefers-contrast', () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) =>
      ({
        matches: q.includes('prefers-contrast: more'),
        media: q,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
    try {
      themeApi.apply({ contrast: 'auto', mode: 'light' });
      expect(root.dataset.k3Contrast).toBe('high');
    } finally {
      window.matchMedia = original;
      themeApi.apply({ contrast: 'default' });
    }
  });
});
