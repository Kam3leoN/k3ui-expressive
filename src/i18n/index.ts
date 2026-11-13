import en from './locales/en.json';
import fr from './locales/fr.json';
import { debug } from '../debug/logger.js';

/**
 * Bundled catalogs. `en` + `fr` are complete; other codes exist so the
 * playground can select them (UI falls back to English via `t()`).
 */
export type LocaleCode =
  | 'en'
  | 'fr'
  | 'nl'
  | 'de'
  | 'sv'
  | 'it'
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

type Dict = Record<string, string>;

/** Language tags that have a catalog entry (empty → English fallback). */
export const LOCALE_CODES: readonly LocaleCode[] = [
  'en',
  'fr',
  'nl',
  'de',
  'sv',
  'it',
  'fi',
  'pl',
  'cs',
  'ro',
  'hu',
  'el',
  'uk',
  'tr',
  'he',
  'zh',
  'ja',
] as const;

const empty = (): Dict => ({});

const catalogs: Record<LocaleCode, Dict> = {
  en,
  fr,
  nl: empty(),
  de: empty(),
  sv: empty(),
  it: empty(),
  fi: empty(),
  pl: empty(),
  cs: empty(),
  ro: empty(),
  hu: empty(),
  el: empty(),
  uk: empty(),
  tr: empty(),
  he: empty(),
  zh: empty(),
  ja: empty(),
};

let current: LocaleCode = 'en';

const LOCALE_SET = new Set<string>(LOCALE_CODES);

/**
 * Map a BCP 47 tag (`fr-FR`, `en_US`, `nl-BE`, `de-AT`) to a bundled catalog,
 * or `null` when the language has no catalog.
 */
export function normalizeLocale(tag: string | null | undefined): LocaleCode | null {
  const lang = String(tag ?? '').trim().toLowerCase().split(/[-_]/)[0];
  return LOCALE_SET.has(lang) ? (lang as LocaleCode) : null;
}

function detectLocale(): LocaleCode {
  if (typeof navigator === 'undefined') return 'en';
  return normalizeLocale(navigator.language) ?? 'en';
}

const own = (dict: Dict, key: string): string | undefined =>
  Object.hasOwn(dict, key) ? dict[key] : undefined;

export const i18n = {
  get locale(): LocaleCode {
    return current;
  },
  /** Accepts a catalog code or any BCP 47 tag of it (`fr-FR` → `fr`). Unknown languages are ignored. */
  setLocale(tag: LocaleCode | (string & {})): void {
    const locale = normalizeLocale(tag);
    if (!locale) {
      debug.warn('i18n', `no catalog for locale "${String(tag)}" — keeping ${current}`);
      return;
    }
    current = locale;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.dispatchEvent(
        new CustomEvent('k3-locale-change', {
          bubbles: true,
          detail: { locale },
        }),
      );
    }
    debug.info('i18n', `locale=${locale}`);
  },
  detect(): LocaleCode {
    const loc = detectLocale();
    i18n.setLocale(loc);
    return loc;
  },
  /**
   * Resolve a key — current locale → English default → optional fallback → key.
   * Optional `{name}` placeholders via `vars`.
   */
  t(key: string, fallback?: string, vars?: Record<string, string | number>): string {
    let s = own(catalogs[current], key) ?? own(catalogs.en, key) ?? fallback ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        s = s.replaceAll(`{${name}}`, String(value));
      }
    }
    return s;
  },
  /**
   * en-US gloss for dual-line nav (L1 localized · L2 English).
   * Returns `undefined` when locale is already English, or when EN equals L1
   * (no redundant second line — e.g. Badge, FAB, Navigation).
   */
  enUs(key: string): string | undefined {
    if (current === 'en') return undefined;
    const local = (own(catalogs[current], key) ?? own(catalogs.en, key) ?? key).trim();
    const enStr = (own(catalogs.en, key) ?? key).trim();
    if (!enStr) return undefined;
    if (local.localeCompare(enStr, undefined, { sensitivity: 'accent' }) === 0) {
      return undefined;
    }
    return enStr;
  },
  /**
   * Merge extra keys into locale catalogs (apps / demos that ship their own strings).
   * Existing keys are overwritten by the extension.
   */
  extend(partial: Partial<Record<LocaleCode, Dict>>): void {
    for (const loc of LOCALE_CODES) {
      const dict = partial[loc];
      if (dict) Object.assign(catalogs[loc], dict);
    }
  },
};
