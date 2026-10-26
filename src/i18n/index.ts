import en from './locales/en.json';
import fr from './locales/fr.json';
import { debug } from '../debug/logger.js';

export type LocaleCode = 'en' | 'fr';

type Dict = Record<string, string>;

const catalogs: Record<LocaleCode, Dict> = { en, fr };
let current: LocaleCode = 'en';

function detectLocale(): LocaleCode {
  if (typeof navigator === 'undefined') return 'en';
  const lang = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return lang === 'fr' ? 'fr' : 'en';
}

export const i18n = {
  get locale(): LocaleCode {
    return current;
  },
  setLocale(locale: LocaleCode): void {
    if (locale !== 'en' && locale !== 'fr') return;
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
    let s = catalogs[current][key] ?? catalogs.en[key] ?? fallback ?? key;
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
    const local = (catalogs[current][key] ?? catalogs.en[key] ?? key).trim();
    const en = (catalogs.en[key] ?? key).trim();
    if (!en) return undefined;
    if (local.localeCompare(en, undefined, { sensitivity: 'accent' }) === 0) {
      return undefined;
    }
    return en;
  },
};
