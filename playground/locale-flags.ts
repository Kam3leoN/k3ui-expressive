/**
 * Country flags via `flag-icons` (lipis) — playground only.
 * - `1x1` → icon slots (square + 4dp radius)
 * - `4x3` → wider surfaces elsewhere
 *
 * Menu entries are language choices; incomplete catalogs fall back to English.
 */
/// <reference types="vite/client" />

import type { LocaleCode } from '../src/i18n/index.js';

import de1x1 from 'flag-icons/flags/1x1/de.svg?raw';
import de4x3 from 'flag-icons/flags/4x3/de.svg?raw';
import en1x1 from 'flag-icons/flags/1x1/gb.svg?raw';
import en4x3 from 'flag-icons/flags/4x3/gb.svg?raw';
import es1x1 from 'flag-icons/flags/1x1/es.svg?raw';
import es4x3 from 'flag-icons/flags/4x3/es.svg?raw';
import fr1x1 from 'flag-icons/flags/1x1/fr.svg?raw';
import fr4x3 from 'flag-icons/flags/4x3/fr.svg?raw';
import it1x1 from 'flag-icons/flags/1x1/it.svg?raw';
import it4x3 from 'flag-icons/flags/4x3/it.svg?raw';
import pt1x1 from 'flag-icons/flags/1x1/pt.svg?raw';
import pt4x3 from 'flag-icons/flags/4x3/pt.svg?raw';

export type FlagRatio = '1x1' | '4x3';

/** Playground menu id — language codes only (short list, no scroll). */
export type PlaygroundLocale = 'fr' | 'en' | 'de' | 'it' | 'es' | 'pt';

export type LocaleMenuEntry = {
  /** `data-locale` / storage key */
  code: PlaygroundLocale;
  /** flag-icons ISO 3166-1 alpha-2 (gb for English) */
  flag: string;
  /** Native endonym in the menu */
  label: string;
  /** Bundled i18n catalog (falls back to English when empty) */
  i18n: LocaleCode;
  /** BCP 47 for `<html lang>` */
  htmlLang: string;
};

/** Ordered locale menu — six languages only. */
export const LOCALE_MENU: readonly LocaleMenuEntry[] = [
  { code: 'fr', flag: 'fr', label: 'Français', i18n: 'fr', htmlLang: 'fr' },
  { code: 'en', flag: 'gb', label: 'English', i18n: 'en', htmlLang: 'en' },
  { code: 'de', flag: 'de', label: 'Deutsch', i18n: 'de', htmlLang: 'de' },
  { code: 'it', flag: 'it', label: 'Italiano', i18n: 'it', htmlLang: 'it' },
  { code: 'es', flag: 'es', label: 'Español', i18n: 'es', htmlLang: 'es' },
  { code: 'pt', flag: 'pt', label: 'Português', i18n: 'pt', htmlLang: 'pt' },
] as const;

const MENU_BY_CODE: Record<PlaygroundLocale, LocaleMenuEntry> = Object.fromEntries(
  LOCALE_MENU.map((e) => [e.code, e]),
) as Record<PlaygroundLocale, LocaleMenuEntry>;

/** Old region tags → current menu codes (stored prefs). */
const LEGACY_LOCALE: Record<string, PlaygroundLocale> = {
  'de-at': 'de',
  'de-ch': 'de',
  'nl-be': 'fr',
  nl: 'fr',
  sv: 'en',
  fi: 'en',
  pl: 'en',
  cs: 'en',
  ro: 'en',
  hu: 'en',
  el: 'en',
  uk: 'en',
  tr: 'en',
  he: 'en',
  zh: 'en',
  ja: 'en',
};

const FLAG_SVG: Record<FlagRatio, Record<string, string>> = {
  '1x1': {
    fr: fr1x1,
    gb: en1x1,
    de: de1x1,
    it: it1x1,
    es: es1x1,
    pt: pt1x1,
  },
  '4x3': {
    fr: fr4x3,
    gb: en4x3,
    de: de4x3,
    it: it4x3,
    es: es4x3,
    pt: pt4x3,
  },
};

export function isPlaygroundLocale(value: string): value is PlaygroundLocale {
  return Object.hasOwn(MENU_BY_CODE, value);
}

/** Resolve a stored / legacy tag to a menu locale (or null). */
export function coercePlaygroundLocale(value: string): PlaygroundLocale | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (isPlaygroundLocale(raw)) return raw;
  const key = raw.toLowerCase();
  if (Object.hasOwn(LEGACY_LOCALE, key)) return LEGACY_LOCALE[key]!;
  const lang = key.split(/[-_]/)[0] ?? '';
  return isPlaygroundLocale(lang) ? lang : null;
}

export function localeMenuEntry(locale: PlaygroundLocale): LocaleMenuEntry {
  return MENU_BY_CODE[locale];
}

/** Map a playground selection to its i18n catalog code. */
export function playgroundToI18n(locale: PlaygroundLocale): LocaleCode {
  return MENU_BY_CODE[locale].i18n;
}

/** Flag ISO code for a playground locale. */
export function localeFlagCode(locale: PlaygroundLocale): string {
  return MENU_BY_CODE[locale].flag;
}

/** Raw SVG markup for a flag ISO code + ratio. */
export function flagSvg(flag: string, ratio: FlagRatio = '1x1'): string {
  return FLAG_SVG[ratio][flag] ?? FLAG_SVG[ratio].gb;
}

/** Raw SVG markup for a locale + ratio. */
export function localeFlagSvg(locale: PlaygroundLocale, ratio: FlagRatio = '1x1'): string {
  return flagSvg(localeFlagCode(locale), ratio);
}

/** Data-URI (img / CSS background) for a locale + ratio. */
export function localeFlagDataUri(
  locale: PlaygroundLocale,
  ratio: FlagRatio = '1x1',
): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(localeFlagSvg(locale, ratio))}`;
}

/** Paint a host element with an inline SVG flag (slot-safe, no broken `<img>`). */
export function setLocaleFlagEl(
  el: HTMLElement | null,
  localeOrFlag: PlaygroundLocale | string,
  ratio: FlagRatio = '1x1',
): void {
  if (!el) return;
  const flag = isPlaygroundLocale(localeOrFlag)
    ? localeFlagCode(localeOrFlag)
    : localeOrFlag;
  el.classList.add('flag-icon', `flag-icon--${ratio}`);
  el.classList.remove(ratio === '1x1' ? 'flag-icon--4x3' : 'flag-icon--1x1');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('translate', 'no');
  /* Trusted package SVG — inline so slotted styles cannot break URL loads */
  el.innerHTML = flagSvg(flag, ratio);
}

/**
 * Flag hosts — light DOM + items adopted into `k3-split-button` shadow menus
 * (`adoptMenuItems` moves `slot="menu"` out of `document` reach).
 */
function localeFlagHosts(): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const add = (el: HTMLElement): void => {
    if (!seen.has(el)) seen.add(el);
  };
  document.querySelectorAll<HTMLElement>('[data-locale-flag]').forEach(add);
  document.querySelectorAll('k3-split-button').forEach((split) => {
    const menu = split.shadowRoot?.querySelector('k3-menu');
    menu?.querySelectorAll<HTMLElement>('[data-locale-flag]').forEach(add);
  });
  return [...seen];
}

/** Wire menu item flags + leading split icon. */
export function mountLocaleFlags(locale: PlaygroundLocale): void {
  for (const el of localeFlagHosts()) {
    const code = el.getAttribute('data-locale-flag');
    if (!code) continue;
    const ratioAttr = el.getAttribute('data-flag-ratio');
    const ratio: FlagRatio = ratioAttr === '4x3' ? '4x3' : '1x1';
    /* data-locale-flag holds the ISO flag code (fr, gb, de, …) */
    setLocaleFlagEl(el, code, ratio);
    const item = el.closest('k3-menu-item') as { syncSlots?: () => void } | null;
    item?.syncSlots?.();
  }
  syncLocaleLeadingFlag(locale);
}

/** Update the split-button leading flag to the active locale (1×1 icon). */
export function syncLocaleLeadingFlag(locale: PlaygroundLocale): void {
  setLocaleFlagEl(document.getElementById('locale-menu-flag'), locale, '1x1');
}
