/**
 * Playground / docs persistence — any key under `k3ui.doc.*`.
 *
 * ```ts
 * docStore.set('theme.seed', '#6750A4');
 * docStore.get('theme.mode', 'light');
 * ```
 */
const PREFIX = 'k3ui.doc.';

function fullKey(key: string): string {
  return key.startsWith(PREFIX) ? key : PREFIX + key;
}

export const docStore = {
  /** Read JSON value or fallback */
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(fullKey(key));
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  /** Persist JSON-serializable value */
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(fullKey(key), JSON.stringify(value));
    } catch {
      /* quota / private mode */
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(fullKey(key));
    } catch {
      /* ignore */
    }
  },

  /** All keys without prefix */
  keys(): string[] {
    const out: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
      }
    } catch {
      /* ignore */
    }
    return out;
  },
};

/** Well-known doc keys */
export const DocKeys = {
  themeSeed: 'theme.seed',
  themeMode: 'theme.mode',
  themeMotion: 'theme.motion',
  themeVariant: 'theme.variant',
  themeContrast: 'theme.contrast',
  themeSeedIdx: 'theme.seedIdx',
  uiDir: 'ui.dir',
  uiLocale: 'ui.locale',
  uiContainer: 'ui.container',
  uiGrid: 'ui.grid',
  /** Animations enabled (default true). false → data-k3-reduce-motion */
  uiAnimations: 'ui.animations',
} as const;
