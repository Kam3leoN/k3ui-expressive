import { describe, expect, it } from 'vitest';
import { normalizeLocale, LOCALE_CODES } from '../../src/i18n/index.js';
import {
  LOCALE_MENU,
  isPlaygroundLocale,
  localeFlagCode,
  playgroundToI18n,
} from '../../playground/locale-flags.js';

describe('playground locale menu', () => {
  it('lists each locale once with a flag and i18n catalog', () => {
    const codes = LOCALE_MENU.map((e) => e.code);
    expect(codes).toEqual([...new Set(codes)]);
    for (const entry of LOCALE_MENU) {
      expect(entry.label.trim().length).toBeGreaterThan(0);
      expect(entry.flag.trim().length).toBe(2);
      expect(LOCALE_CODES).toContain(entry.i18n);
      expect(playgroundToI18n(entry.code)).toBe(entry.i18n);
      expect(localeFlagCode(entry.code)).toBe(entry.flag);
    }
  });

  it('covers the requested countries / languages', () => {
    const flags = new Set(LOCALE_MENU.map((e) => e.flag));
    for (const flag of [
      'nl',
      'be',
      'at',
      'se',
      'it',
      'ch',
      'fi',
      'pl',
      'cz',
      'ro',
      'hu',
      'gr',
      'ua',
      'tr',
      'il',
      'cn',
      'jp',
    ]) {
      expect(flags.has(flag), `missing flag ${flag}`).toBe(true);
    }
  });

  it('accepts region tags as playground locales', () => {
    expect(isPlaygroundLocale('nl-BE')).toBe(true);
    expect(isPlaygroundLocale('de-AT')).toBe(true);
    expect(isPlaygroundLocale('de-CH')).toBe(true);
    expect(isPlaygroundLocale('xx')).toBe(false);
  });

  it('maps region tags to language catalogs', () => {
    expect(normalizeLocale('nl-BE')).toBe('nl');
    expect(normalizeLocale('de-AT')).toBe('de');
    expect(normalizeLocale('de-CH')).toBe('de');
    expect(playgroundToI18n('nl-BE')).toBe('nl');
    expect(playgroundToI18n('de-AT')).toBe('de');
  });
});
