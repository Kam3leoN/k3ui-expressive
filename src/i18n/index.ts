import en from './locales/en.json';
import fr from './locales/fr.json';
import { debug } from '../debug/logger.js';

export type LocaleCode = 'en' | 'fr';

type Dict = Record<string, string>;

const catalogs: Record<LocaleCode, Dict> = { en, fr };
let current: LocaleCode = 'en';

/**
 * Map a BCP 47 tag (`fr-FR`, `en_US`, `FR`) to a bundled catalog, or `null`
 * when the language has no catalog.
 */
export function normalizeLocale(tag: string | null | undefined): LocaleCode | null {
  const lang = String(tag ?? '').trim().toLowerCase().split(/[-_]/)[0];
  return lang === 'en' || lang === 'fr' ? lang : null;
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
    const en = (own(catalogs.en, key) ?? key).trim();
    if (!en) return undefined;
    if (local.localeCompare(en, undefined, { sensitivity: 'accent' }) === 0) {
      return undefined;
    }
    return en;
  },
  /**
   * Merge extra keys into locale catalogs (apps / demos that ship their own strings).
   * Existing keys are overwritten by the extension.
   */
  extend(partial: Partial<Record<LocaleCode, Dict>>): void {
    for (const loc of ['en', 'fr'] as const) {
      const dict = partial[loc];
      if (dict) Object.assign(catalogs[loc], dict);
    }
  },
};
