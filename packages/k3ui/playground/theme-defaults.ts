/**
 * Default playground theme — single source for app.ts (runtime) and
 * vite.config.ts, which prerenders these colours into index.html so the first
 * paint already uses the final theme (no colour flash when the app boots).
 *
 * Defaults: MD2 Indigo 500 · tonal spot · light · spec 2025.
 * User choices in localStorage (`k3ui.doc.theme.*`) always win when present.
 */
export const THEME_SEEDS = ['#3F51B5', '#00639B', '#8B1A4A', '#1B6B4A', '#B35C00'] as const;

export const DEFAULT_THEME = {
  seedIdx: 0,
  mode: 'light',
  variant: 'tonalspot',
  contrast: 'default',
  spec: '2025',
  amoled: false,
} as const;

/** Snapshot used to detect “theme away from K3ui defaults” (settings reset). */
export type ThemeSnapshot = {
  seed: string;
  mode: string;
  variant: string;
  contrast: string;
  spec: string;
  /** Pure black dark theme — omitted = off. */
  amoled?: boolean;
};

export function defaultThemeSeed(): string {
  return THEME_SEEDS[DEFAULT_THEME.seedIdx]!;
}

/** True when colorimetry differs from native K3ui defaults (seed / mode / variant / contrast / spec). */
export function isThemeAwayFromDefaults(state: ThemeSnapshot): boolean {
  const seed = state.seed.trim().toUpperCase();
  const def = defaultThemeSeed().toUpperCase();
  return (
    seed !== def ||
    state.mode !== DEFAULT_THEME.mode ||
    state.variant !== DEFAULT_THEME.variant ||
    state.contrast !== DEFAULT_THEME.contrast ||
    state.spec !== DEFAULT_THEME.spec ||
    Boolean(state.amoled) !== DEFAULT_THEME.amoled
  );
}

/** localStorage prefix of the doc store (docStore keys are `theme.*`). */
export const THEME_STORE_PREFIX = 'k3ui.doc.theme.';

/** Settings that decide the theme — the pre-paint cache is keyed on their raw values. */
export const THEME_STORE_KEYS = [
  'seed',
  'secondarySeed',
  'seedIdx',
  'mode',
  'variant',
  'contrast',
  'motion',
  'spec',
  'amoled',
] as const;

/** Last theme the app applied (CSS variables + resolved mode), replayed before first paint. */
export const THEME_CACHE_KEY = `${THEME_STORE_PREFIX}cache`;
