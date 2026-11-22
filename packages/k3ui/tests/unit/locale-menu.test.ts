import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeLocale, LOCALE_CODES } from '../../src/i18n/index.js';
import {
  LOCALE_MENU,
  coercePlaygroundLocale,
  isPlaygroundLocale,
  localeFlagCode,
  playgroundToI18n,
} from '../../playground/locale-flags.js';

const root = path.resolve(__dirname, '../..');

describe('playground locale menu', () => {
  it('lists exactly the six kept languages once', () => {
    const codes = LOCALE_MENU.map((e) => e.code);
    expect(codes).toEqual(['fr', 'en', 'de', 'it', 'es', 'pt']);
    expect(codes).toEqual([...new Set(codes)]);
    for (const entry of LOCALE_MENU) {
      expect(entry.label.trim().length).toBeGreaterThan(0);
      expect(entry.flag.trim().length).toBe(2);
      expect(LOCALE_CODES).toContain(entry.i18n);
      expect(playgroundToI18n(entry.code)).toBe(entry.i18n);
      expect(localeFlagCode(entry.code)).toBe(entry.flag);
    }
  });

  it('covers Français · English · Deutsch · Italiano · Español · Português', () => {
    const labels = LOCALE_MENU.map((e) => e.label);
    expect(labels).toEqual([
      'Français',
      'English',
      'Deutsch',
      'Italiano',
      'Español',
      'Português',
    ]);
    const flags = new Set(LOCALE_MENU.map((e) => e.flag));
    for (const flag of ['fr', 'gb', 'de', 'it', 'es', 'pt']) {
      expect(flags.has(flag), `missing flag ${flag}`).toBe(true);
    }
  });

  it('rejects removed playground locales', () => {
    expect(isPlaygroundLocale('nl-BE')).toBe(false);
    expect(isPlaygroundLocale('de-AT')).toBe(false);
    expect(isPlaygroundLocale('de-CH')).toBe(false);
    expect(isPlaygroundLocale('ja')).toBe(false);
    expect(isPlaygroundLocale('xx')).toBe(false);
  });

  it('coerces legacy region tags to the short menu', () => {
    expect(coercePlaygroundLocale('de-AT')).toBe('de');
    expect(coercePlaygroundLocale('de-CH')).toBe('de');
    expect(coercePlaygroundLocale('nl-BE')).toBe('fr');
    expect(coercePlaygroundLocale('es')).toBe('es');
    expect(coercePlaygroundLocale('pt-BR')).toBe('pt');
    expect(coercePlaygroundLocale('xx')).toBeNull();
  });

  it('maps language tags to catalogs including es / pt', () => {
    expect(normalizeLocale('de-AT')).toBe('de');
    expect(normalizeLocale('es-ES')).toBe('es');
    expect(normalizeLocale('pt-BR')).toBe('pt');
    expect(playgroundToI18n('de')).toBe('de');
    expect(playgroundToI18n('es')).toBe('es');
    expect(playgroundToI18n('pt')).toBe('pt');
  });

  it('keeps six menu items in index.html and disables list max-height', () => {
    const html = fs.readFileSync(path.join(root, 'playground/index.html'), 'utf8');
    const items = [...html.matchAll(/data-locale="([a-z-]+)"/g)].map((m) => m[1]);
    expect(items).toEqual(['fr', 'en', 'de', 'it', 'es', 'pt']);
    const css = fs.readFileSync(path.join(root, 'playground/playground.css'), 'utf8');
    expect(css).toMatch(/#locale-menu::part\(menu\)[\s\S]*?--k3-menu-list-max-h:\s*none/);
  });

  it('puts menu pad on the scroll list so the thumb hugs the panel edge', () => {
    const styles = fs.readFileSync(
      path.join(root, 'src/components/containment/menu.styles.ts'),
      'utf8',
    );
    expect(styles).toMatch(/\.panel\s*\{[\s\S]*?padding:\s*0\s*!important/);
    expect(styles).toMatch(/\.list\s*\{[\s\S]*?padding:\s*var\(--k3-menu-pad\)/);
    expect(styles).toContain('--k3-scroll-track-inset: var(--k3-menu-radius)');
  });
});
