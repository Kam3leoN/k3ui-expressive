import { afterEach, describe, expect, it, vi } from 'vitest';
import { getInitOptions, init } from '../../src/bootstrap/init.js';
import { themeApi } from '../../src/theme/apply.js';
import { i18n, normalizeLocale } from '../../src/i18n/index.js';

describe('configuration matrix', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['fr-FR', 'fr'],
    ['en-US', 'en'],
    ['FR', 'fr'],
    ['en', 'en'],
    ['nl-BE', 'nl'],
    ['de-AT', 'de'],
    ['de-CH', 'de'],
    ['zh-CN', 'zh'],
    ['ja-JP', 'ja'],
    ['he-IL', 'he'],
    ['xx', null],
  ] as const)('normalizeLocale(%s) → %s', (input, expected) => {
    expect(normalizeLocale(input)).toBe(expected);
  });

  it.each([
    ['tonalspot'],
    ['vibrant'],
    ['expressive'],
    ['neutral'],
  ] as const)('theme variant %s applies without throwing', async (variant) => {
    await init({ components: [], theme: { seed: '#6750A4', mode: 'light', variant } });
    expect(themeApi.getLastOptions().variant).toBe(variant);
    expect(getInitOptions().theme?.variant).toBe(variant);
  });

  it.each([
    ['2025'],
    ['2021'],
  ] as const)('specVersion %s is accepted', async (specVersion) => {
    await init({ components: [], theme: { specVersion } });
    expect(themeApi.getLastOptions().specVersion).toBe(specVersion);
  });

  it('rejects polluted / invalid locale without changing the previous one', async () => {
    await init({ locale: 'fr', components: [] });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await init(JSON.parse('{"locale":{"__proto__":{"x":1}}}'));
    expect(i18n.locale).toBe('fr');
    expect(warn).toHaveBeenCalled();
  });

  it('motion.reduce always / system round-trips through getInitOptions', async () => {
    await init({ components: [], motion: { reduce: 'always' } });
    expect(getInitOptions().motion?.reduce).toBe('always');
    await init({ motion: { reduce: 'system' } });
    expect(getInitOptions().motion?.reduce).toBe('system');
  });
});
