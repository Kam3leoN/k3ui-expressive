import {
  argbFromHex,
  hexFromArgb,
  Hct,
  SchemeTonalSpot,
  SchemeExpressive,
  SchemeVibrant,
  SchemeFidelity,
  SchemeMonochrome,
  SchemeNeutral,
  MaterialDynamicColors,
  DynamicScheme,
  TonalPalette,
  sanitizeDegreesDouble,
  type DynamicColor,
} from '@material/material-color-utilities';
import { debug } from '../debug/logger.js';
import { COLOR_ROLES, type ColorRoleKey } from './roles.js';
import { buildSemanticCssVars } from './semantic.js';
import { sysColorCssVars, applyMotionSchemeVars } from './css-vars.js';

export {
  COLOR_ROLES,
  COLOR_ROLE_GROUPS,
  colorRoleToCssVar,
  type ColorRoleKey,
  type ColorRoleGroup,
} from './roles.js';
export {
  buildSemanticCssVars,
  SEMANTIC_COLOR_ROLES,
  SEMANTIC_SEEDS,
  type SemanticName,
} from './semantic.js';

/**
 * Color scheme preference:
 * - `light` / `dark` — fixed
 * - `auto` — local time 07:00–17:59 light, else dark
 * - `system` — `prefers-color-scheme` (OS)
 */
export type ColorMode = 'light' | 'dark' | 'auto' | 'system';
export type MotionScheme = 'expressive' | 'standard';

/** Auto mode daylight window (local hours, inclusive start / exclusive end). */
const AUTO_LIGHT_START_H = 7;
const AUTO_LIGHT_END_H = 18;

/**
 * MCU scheme variants (Material Theme Builder / m3e).
 * Rainbow & Fruit Salad ship in MCU files but are omitted from the 0.2.7 barrel —
 * rebuilt locally from the same recipes.
 */
export type ColorVariant =
  | 'tonalspot'
  | 'vibrant'
  | 'fidelity'
  | 'expressive'
  | 'monochrome'
  | 'neutral'
  | 'rainbow'
  | 'fruitsalad';

/** Theme Builder contrast — maps to MCU `contrastLevel` −1…1. */
export type ContrastLevel = 'default' | 'medium' | 'high';

export interface ThemeOptions {
  seed?: string;
  mode?: ColorMode;
  motion?: MotionScheme;
  variant?: ColorVariant;
  contrast?: ContrastLevel;
  target?: HTMLElement | Document;
}

/** MCU Variant enum values (not always re-exported from the package barrel). */
const Variant = {
  RAINBOW: 7,
  FRUIT_SALAD: 8,
} as const;

const CONTRAST_LEVEL: Record<ContrastLevel, number> = {
  default: 0,
  medium: 0.5,
  high: 1,
};

/** Key palette colors (Theme Builder) — applied in addition to {@link COLOR_ROLES}. */
const COLOR_KEY_ROLES = [
  'primaryPaletteKeyColor',
  'secondaryPaletteKeyColor',
  'tertiaryPaletteKeyColor',
  'neutralPaletteKeyColor',
  'neutralVariantPaletteKeyColor',
] as const satisfies readonly ColorRoleKey[];

/** `auto`: light from 07:00 inclusive to 18:00 exclusive (local). */
export function resolveAutoByClock(now: Date = new Date()): 'light' | 'dark' {
  const h = now.getHours();
  return h >= AUTO_LIGHT_START_H && h < AUTO_LIGHT_END_H ? 'light' : 'dark';
}

function resolveMode(mode: ColorMode): 'light' | 'dark' {
  if (mode === 'auto') return resolveAutoByClock();
  if (mode === 'system') {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return mode === 'dark' ? 'dark' : 'light';
}

/** ms until next auto light↔dark boundary (07:00 or 18:00 local). */
function msUntilNextAutoSwitch(now: Date = new Date()): number {
  const next = new Date(now.getTime());
  next.setSeconds(0, 0);
  next.setMinutes(0);
  const h = now.getHours();
  if (h < AUTO_LIGHT_START_H) {
    next.setHours(AUTO_LIGHT_START_H);
  } else if (h < AUTO_LIGHT_END_H) {
    next.setHours(AUTO_LIGHT_END_H);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(AUTO_LIGHT_START_H);
  }
  const ms = next.getTime() - now.getTime();
  return ms > 0 ? ms : 60_000;
}

function contrastValue(level: ContrastLevel): number {
  return CONTRAST_LEVEL[level] ?? 0;
}

/** MCU SchemeRainbow recipe (not exported from 0.2.7 barrel). */
function schemeRainbow(source: Hct, dark: boolean, contrast: number): DynamicScheme {
  return new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: Variant.RAINBOW,
    contrastLevel: contrast,
    isDark: dark,
    primaryPalette: TonalPalette.fromHueAndChroma(source.hue, 48),
    secondaryPalette: TonalPalette.fromHueAndChroma(source.hue, 16),
    tertiaryPalette: TonalPalette.fromHueAndChroma(
      sanitizeDegreesDouble(source.hue + 60),
      24,
    ),
    neutralPalette: TonalPalette.fromHueAndChroma(source.hue, 0),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(source.hue, 0),
  });
}

/** MCU SchemeFruitSalad recipe (not exported from 0.2.7 barrel). */
function schemeFruitSalad(source: Hct, dark: boolean, contrast: number): DynamicScheme {
  return new DynamicScheme({
    sourceColorArgb: source.toInt(),
    variant: Variant.FRUIT_SALAD,
    contrastLevel: contrast,
    isDark: dark,
    primaryPalette: TonalPalette.fromHueAndChroma(
      sanitizeDegreesDouble(source.hue - 50),
      48,
    ),
    secondaryPalette: TonalPalette.fromHueAndChroma(
      sanitizeDegreesDouble(source.hue - 50),
      36,
    ),
    tertiaryPalette: TonalPalette.fromHueAndChroma(source.hue, 36),
    neutralPalette: TonalPalette.fromHueAndChroma(source.hue, 10),
    neutralVariantPalette: TonalPalette.fromHueAndChroma(source.hue, 16),
  });
}

function buildScheme(
  seed: string,
  dark: boolean,
  variant: ColorVariant,
  contrast: ContrastLevel,
): DynamicScheme {
  const source = Hct.fromInt(argbFromHex(seed));
  const c = contrastValue(contrast);
  switch (variant) {
    case 'expressive':
      return new SchemeExpressive(source, dark, c);
    case 'vibrant':
      return new SchemeVibrant(source, dark, c);
    case 'fidelity':
      return new SchemeFidelity(source, dark, c);
    case 'monochrome':
      return new SchemeMonochrome(source, dark, c);
    case 'neutral':
      return new SchemeNeutral(source, dark, c);
    case 'rainbow':
      return schemeRainbow(source, dark, c);
    case 'fruitsalad':
      return schemeFruitSalad(source, dark, c);
    case 'tonalspot':
    default:
      return new SchemeTonalSpot(source, dark, c);
  }
}

function schemeToCssVars(
  seed: string,
  dark: boolean,
  variant: ColorVariant,
  contrast: ContrastLevel,
): Record<string, string> {
  const scheme = buildScheme(seed, dark, variant, contrast);
  const vars: Record<string, string> = {};

  const colors = MaterialDynamicColors as unknown as Record<string, DynamicColor | undefined>;
  for (const key of [...COLOR_ROLES, ...COLOR_KEY_ROLES]) {
    const dc = colors[key];
    if (!dc) continue;
    const hex = hexFromArgb(dc.getArgb(scheme));
    Object.assign(vars, sysColorCssVars(key, hex));
  }
  /* Extended semantics — same tone recipe as Error, fixed hue anchors */
  Object.assign(vars, buildSemanticCssVars(dark));
  return vars;
}

let mediaListener: ((e: MediaQueryListEvent) => void) | null = null;
let autoTimer: ReturnType<typeof setTimeout> | null = null;
let lastOptions: ThemeOptions = {};

function clearModeListeners(): void {
  if (mediaListener && typeof matchMedia === 'function') {
    matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', mediaListener);
    mediaListener = null;
  }
  if (autoTimer != null) {
    clearTimeout(autoTimer);
    autoTimer = null;
  }
}

function bindModeListeners(mode: ColorMode, merged: ThemeOptions): void {
  clearModeListeners();
  if (mode === 'system' && typeof matchMedia === 'function') {
    mediaListener = () => themeApi.apply({ ...merged, mode });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', mediaListener);
    return;
  }
  if (mode === 'auto' && typeof setTimeout === 'function') {
    const schedule = (): void => {
      autoTimer = setTimeout(() => {
        themeApi.apply({ ...merged, mode: 'auto' });
      }, msUntilNextAutoSwitch());
    };
    schedule();
  }
}

export const themeApi = {
  apply(options: ThemeOptions = {}): void {
    const merged = { ...lastOptions, ...options };
    lastOptions = merged;
    const seed = merged.seed ?? '#6750A4';
    const mode = merged.mode ?? 'auto';
    const motion = merged.motion ?? 'expressive';
    const variant = merged.variant ?? 'expressive';
    const contrast = merged.contrast ?? 'default';
    const resolved = resolveMode(mode);
    const target =
      merged.target instanceof HTMLElement
        ? merged.target
        : typeof document !== 'undefined'
          ? document.documentElement
          : null;

    if (!target) return;

    try {
      const vars = schemeToCssVars(seed, resolved === 'dark', variant, contrast);
      for (const [k, v] of Object.entries(vars)) {
        target.style.setProperty(k, v);
      }
      /* Motion scheme → data-k3-motion; inline aliases for non-root targets */
      applyMotionSchemeVars(target.style, motion);
      target.dataset.k3ColorMode = resolved;
      target.dataset.k3ColorModePref = mode;
      target.dataset.k3Motion = motion;
      target.dataset.k3ColorVariant = variant;
      target.dataset.k3Contrast = contrast;
      target.style.colorScheme = resolved;

      bindModeListeners(mode, merged);

      target.dispatchEvent(
        new CustomEvent('k3-theme-change', {
          bubbles: true,
          detail: { seed, mode, resolved, motion, variant, contrast },
        }),
      );
      debug.info(
        'theme',
        `seed=${seed} mode=${mode}→${resolved} motion=${motion} variant=${variant} contrast=${contrast}`,
      );
    } catch (err) {
      debug.error('theme', err);
    }
  },

  getLastOptions(): ThemeOptions {
    return { ...lastOptions };
  },
};
