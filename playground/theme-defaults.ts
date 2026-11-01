/**
 * Default playground theme — single source for app.ts (runtime) and
 * vite.config.ts, which prerenders these colours into index.html so the first
 * paint already uses the final theme (no colour flash when the app boots).
 */
export const THEME_SEEDS = ['#6750A4', '#00639B', '#8B1A4A', '#1B6B4A', '#B35C00'] as const;

export const DEFAULT_THEME = {
  seedIdx: 0,
  mode: 'light',
  variant: 'expressive',
  contrast: 'default',
} as const;

/** localStorage prefix of the doc store (docStore keys are `theme.*`). */
export const THEME_STORE_PREFIX = 'k3ui.doc.theme.';

/** Settings that decide the theme — the pre-paint cache is keyed on their raw values. */
export const THEME_STORE_KEYS = ['seed', 'seedIdx', 'mode', 'variant', 'contrast', 'motion'] as const;

/** Last theme the app applied (CSS variables + resolved mode), replayed before first paint. */
export const THEME_CACHE_KEY = `${THEME_STORE_PREFIX}cache`;
