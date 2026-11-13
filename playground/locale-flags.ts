/**
 * Country flags via `flag-icons` (lipis) — playground only.
 * - `1x1` → icon slots (square + 4dp radius)
 * - `4x3` → wider surfaces elsewhere
 *
 * Menu entries are country / language choices; several share one i18n catalog
 * (e.g. BE → nl, AT/CH → de) until dedicated translations exist.
 */
/// <reference types="vite/client" />

import type { LocaleCode } from '../src/i18n/index.js';

import at1x1 from 'flag-icons/flags/1x1/at.svg?raw';
import at4x3 from 'flag-icons/flags/4x3/at.svg?raw';
import be1x1 from 'flag-icons/flags/1x1/be.svg?raw';
import be4x3 from 'flag-icons/flags/4x3/be.svg?raw';
import ch1x1 from 'flag-icons/flags/1x1/ch.svg?raw';
import ch4x3 from 'flag-icons/flags/4x3/ch.svg?raw';
import cn1x1 from 'flag-icons/flags/1x1/cn.svg?raw';
import cn4x3 from 'flag-icons/flags/4x3/cn.svg?raw';
import cz1x1 from 'flag-icons/flags/1x1/cz.svg?raw';
import cz4x3 from 'flag-icons/flags/4x3/cz.svg?raw';
import en1x1 from 'flag-icons/flags/1x1/gb.svg?raw';
import en4x3 from 'flag-icons/flags/4x3/gb.svg?raw';
import fi1x1 from 'flag-icons/flags/1x1/fi.svg?raw';
import fi4x3 from 'flag-icons/flags/4x3/fi.svg?raw';
import fr1x1 from 'flag-icons/flags/1x1/fr.svg?raw';
import fr4x3 from 'flag-icons/flags/4x3/fr.svg?raw';
import gr1x1 from 'flag-icons/flags/1x1/gr.svg?raw';
import gr4x3 from 'flag-icons/flags/4x3/gr.svg?raw';
import hu1x1 from 'flag-icons/flags/1x1/hu.svg?raw';
import hu4x3 from 'flag-icons/flags/4x3/hu.svg?raw';
import il1x1 from 'flag-icons/flags/1x1/il.svg?raw';
import il4x3 from 'flag-icons/flags/4x3/il.svg?raw';
import it1x1 from 'flag-icons/flags/1x1/it.svg?raw';
import it4x3 from 'flag-icons/flags/4x3/it.svg?raw';
import jp1x1 from 'flag-icons/flags/1x1/jp.svg?raw';
import jp4x3 from 'flag-icons/flags/4x3/jp.svg?raw';
import nl1x1 from 'flag-icons/flags/1x1/nl.svg?raw';
import nl4x3 from 'flag-icons/flags/4x3/nl.svg?raw';
import pl1x1 from 'flag-icons/flags/1x1/pl.svg?raw';
import pl4x3 from 'flag-icons/flags/4x3/pl.svg?raw';
import ro1x1 from 'flag-icons/flags/1x1/ro.svg?raw';
import ro4x3 from 'flag-icons/flags/4x3/ro.svg?raw';
import se1x1 from 'flag-icons/flags/1x1/se.svg?raw';
import se4x3 from 'flag-icons/flags/4x3/se.svg?raw';
import tr1x1 from 'flag-icons/flags/1x1/tr.svg?raw';
import tr4x3 from 'flag-icons/flags/4x3/tr.svg?raw';
import ua1x1 from 'flag-icons/flags/1x1/ua.svg?raw';
import ua4x3 from 'flag-icons/flags/4x3/ua.svg?raw';

export type FlagRatio = '1x1' | '4x3';

/** Playground menu id — may be a region tag (nl-BE) or a language code. */
export type PlaygroundLocale =
  | 'fr'
  | 'en'
  | 'nl'
  | 'nl-BE'
  | 'de-AT'
  | 'sv'
  | 'it'
  | 'de-CH'
  | 'fi'
  | 'pl'
  | 'cs'
  | 'ro'
  | 'hu'
  | 'el'
  | 'uk'
  | 'tr'
  | 'he'
  | 'zh'
  | 'ja';

export type LocaleMenuEntry = {
  /** `data-locale` / storage key */
  code: PlaygroundLocale;
  /** flag-icons ISO 3166-1 alpha-2 (or gb for English) */
  flag: string;
  /** Native endonym in the menu */
  label: string;
  /** Bundled i18n catalog (falls back to English when empty) */
  i18n: LocaleCode;
  /** BCP 47 for `<html lang>` */
  htmlLang: string;
};

/** Ordered locale menu — FR / EN first, then requested countries. */
export const LOCALE_MENU: readonly LocaleMenuEntry[] = [
  { code: 'fr', flag: 'fr', label: 'Français', i18n: 'fr', htmlLang: 'fr' },
  { code: 'en', flag: 'gb', label: 'English', i18n: 'en', htmlLang: 'en' },
  { code: 'nl', flag: 'nl', label: 'Nederlands', i18n: 'nl', htmlLang: 'nl' },
  { code: 'nl-BE', flag: 'be', label: 'België', i18n: 'nl', htmlLang: 'nl-BE' },
  { code: 'de-AT', flag: 'at', label: 'Deutsch', i18n: 'de', htmlLang: 'de-AT' },
  { code: 'sv', flag: 'se', label: 'Svenska', i18n: 'sv', htmlLang: 'sv' },
  { code: 'it', flag: 'it', label: 'Italiano', i18n: 'it', htmlLang: 'it' },
  { code: 'de-CH', flag: 'ch', label: 'Deutsch (CH)', i18n: 'de', htmlLang: 'de-CH' },
  { code: 'fi', flag: 'fi', label: 'Suomi', i18n: 'fi', htmlLang: 'fi' },
  { code: 'pl', flag: 'pl', label: 'Polski', i18n: 'pl', htmlLang: 'pl' },
  { code: 'cs', flag: 'cz', label: 'Čeština', i18n: 'cs', htmlLang: 'cs' },
  { code: 'ro', flag: 'ro', label: 'Română', i18n: 'ro', htmlLang: 'ro' },
  { code: 'hu', flag: 'hu', label: 'Magyar', i18n: 'hu', htmlLang: 'hu' },
  { code: 'el', flag: 'gr', label: 'Ελληνικά', i18n: 'el', htmlLang: 'el' },
  { code: 'uk', flag: 'ua', label: 'Українська', i18n: 'uk', htmlLang: 'uk' },
  { code: 'tr', flag: 'tr', label: 'Türkçe', i18n: 'tr', htmlLang: 'tr' },
  { code: 'he', flag: 'il', label: 'עברית', i18n: 'he', htmlLang: 'he' },
  { code: 'zh', flag: 'cn', label: '中文', i18n: 'zh', htmlLang: 'zh-CN' },
  { code: 'ja', flag: 'jp', label: '日本語', i18n: 'ja', htmlLang: 'ja' },
] as const;

const MENU_BY_CODE: Record<PlaygroundLocale, LocaleMenuEntry> = Object.fromEntries(
  LOCALE_MENU.map((e) => [e.code, e]),
) as Record<PlaygroundLocale, LocaleMenuEntry>;

const FLAG_SVG: Record<FlagRatio, Record<string, string>> = {
  '1x1': {
    fr: fr1x1,
    gb: en1x1,
    nl: nl1x1,
    be: be1x1,
    at: at1x1,
    se: se1x1,
    it: it1x1,
    ch: ch1x1,
    fi: fi1x1,
    pl: pl1x1,
    cz: cz1x1,
    ro: ro1x1,
    hu: hu1x1,
    gr: gr1x1,
    ua: ua1x1,
    tr: tr1x1,
    il: il1x1,
    cn: cn1x1,
    jp: jp1x1,
  },
  '4x3': {
    fr: fr4x3,
    gb: en4x3,
    nl: nl4x3,
    be: be4x3,
    at: at4x3,
    se: se4x3,
    it: it4x3,
    ch: ch4x3,
    fi: fi4x3,
    pl: pl4x3,
    cz: cz4x3,
    ro: ro4x3,
    hu: hu4x3,
    gr: gr4x3,
    ua: ua4x3,
    tr: tr4x3,
    il: il4x3,
    cn: cn4x3,
    jp: jp4x3,
  },
};

export function isPlaygroundLocale(value: string): value is PlaygroundLocale {
  return Object.hasOwn(MENU_BY_CODE, value);
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
    /* data-locale-flag holds the ISO flag code (fr, gb, nl, be, …) */
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
