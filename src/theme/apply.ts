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
import { yieldToMain } from '../core/yield.js';
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
/** `auto` mode: light from 07:00 (inclusive) to 18:00 (exclusive), local time. */
export const AUTO_LIGHT_START_H = 7;
export const AUTO_LIGHT_END_H = 18;

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

/** {@link ContrastLevel} or `auto` — OS `prefers-contrast` decides. */
export type ContrastPreference = ContrastLevel | 'auto';

/**
 * Material color spec. `2025` = Material 3 Expressive: the Expressive variant
 * keeps the seed hue on primary (2021 rotated it by +240°). Variants without a
 * 2025 recipe (fidelity, monochrome, rainbow, fruit salad) use 2021 either way.
 */
export type ColorSpecVersion = '2021' | '2025';

export const DEFAULT_COLOR_SPEC: ColorSpecVersion = '2025';

export interface ThemeOptions {
  seed?: string;
  mode?: ColorMode;
  motion?: MotionScheme;
  variant?: ColorVariant;
  /** `auto` follows `prefers-contrast: more` (→ `high`) and updates live. */
  contrast?: ContrastPreference;
  /** Material color spec (default `2025`). */
  specVersion?: ColorSpecVersion;
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
    sourceColorHct: source,
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
    sourceColorHct: source,
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
  spec: ColorSpecVersion = DEFAULT_COLOR_SPEC,
): DynamicScheme {
  const source = Hct.fromInt(argbFromHex(seed));
  const c = contrastValue(contrast);
  switch (variant) {
    case 'expressive':
      return new SchemeExpressive(source, dark, c, spec, 'phone');
    case 'vibrant':
      return new SchemeVibrant(source, dark, c, spec, 'phone');
    case 'fidelity':
      return new SchemeFidelity(source, dark, c, spec, 'phone');
    case 'monochrome':
      return new SchemeMonochrome(source, dark, c, spec, 'phone');
    case 'neutral':
      return new SchemeNeutral(source, dark, c, spec, 'phone');
    case 'rainbow':
      return schemeRainbow(source, dark, c);
    case 'fruitsalad':
      return schemeFruitSalad(source, dark, c);
    case 'tonalspot':
    default:
      return new SchemeTonalSpot(source, dark, c, spec, 'phone');
  }
}

type SchemeArgs = [seed: string, dark: boolean, variant: ColorVariant, contrast: ContrastLevel, spec: ColorSpecVersion];

/** Recently computed schemes — re-applying a theme (or a prepared one) is free. */
const schemeCache = new Map<string, Record<string, string>>();
const SCHEME_CACHE_MAX = 8;

function cacheScheme(key: string, vars: Record<string, string>): Record<string, string> {
  schemeCache.delete(key);
  schemeCache.set(key, vars);
  if (schemeCache.size > SCHEME_CACHE_MAX) schemeCache.delete(schemeCache.keys().next().value!);
  return vars;
}

/**
 * Computes the scheme role by role. `pause` (async callers) runs between
 * batches so a first, cold computation never becomes one long task.
 */
function* schemeVarsSteps(...[seed, dark, variant, contrast, spec]: SchemeArgs): Generator<void, Record<string, string>> {
  const scheme = buildScheme(seed, dark, variant, contrast, spec);
  yield;
  const vars: Record<string, string> = {};
  const colors = MaterialDynamicColors as unknown as Record<string, DynamicColor | undefined>;
  let n = 0;
  for (const key of [...COLOR_ROLES, ...COLOR_KEY_ROLES]) {
    const dc = colors[key];
    if (!dc) continue;
    const hex = hexFromArgb(dc.getArgb(scheme));
    Object.assign(vars, sysColorCssVars(key, hex));
    if (++n % 4 === 0) yield;
  }
  yield;
  /* Extended semantics — same tone recipe as Error, fixed hue anchors */
  Object.assign(vars, buildSemanticCssVars(dark));
  return vars;
}

function schemeToCssVars(
  seed: string,
  dark: boolean,
  variant: ColorVariant,
  contrast: ContrastLevel,
  spec: ColorSpecVersion = DEFAULT_COLOR_SPEC,
): Record<string, string> {
  const args: SchemeArgs = [seed, dark, variant, contrast, spec];
  const key = args.join('|');
  const hit = schemeCache.get(key);
  if (hit) return hit;
  const steps = schemeVarsSteps(...args);
  let r = steps.next();
  while (!r.done) r = steps.next();
  return cacheScheme(key, r.value);
}

async function schemeToCssVarsAsync(args: SchemeArgs, pause: () => Promise<void>): Promise<void> {
  const key = args.join('|');
  if (schemeCache.has(key)) return;
  const steps = schemeVarsSteps(...args);
  let r: IteratorResult<void, Record<string, string>>;
  do {
    await pause();
    r = steps.next();
  } while (!r.done);
  cacheScheme(key, r.value);
}

/**
 * CSS custom properties of a resolved scheme — pure (no DOM), e.g. to
 * prerender the default theme at build time or on the server. Same values
 * `themeApi.apply()` writes for that seed / mode / variant / contrast.
 */
export function themeCssVars(
  options: {
    seed?: string;
    dark?: boolean;
    variant?: ColorVariant;
    contrast?: ContrastLevel;
    specVersion?: ColorSpecVersion;
  } = {},
): Record<string, string> {
  return { ...schemeToCssVars(
    options.seed ?? '#6750A4',
    options.dark ?? false,
    options.variant ?? 'expressive',
    options.contrast ?? 'default',
    options.specVersion ?? DEFAULT_COLOR_SPEC,
  ) };
}

/** Per-target live listeners (OS colour / contrast changes, `auto` clock). */
interface TargetBinding {
  cleanup: () => void;
  /** Last written scheme — skips identical re-applies (e.g. k3-theme connect + first update). */
  signature: string;
}

const bindings = new WeakMap<HTMLElement, TargetBinding>();
/** Options of the document-level theme only — a local target never leaks into it. */
let lastOptions: ThemeOptions = {};

function resolveContrast(contrast: ContrastPreference): ContrastLevel {
  if (contrast !== 'auto') return contrast in CONTRAST_LEVEL ? contrast : 'default';
  if (typeof matchMedia === 'function' && matchMedia('(prefers-contrast: more)').matches) return 'high';
  return 'default';
}

function bindListeners(target: HTMLElement, merged: ThemeOptions, signature: string): void {
  bindings.get(target)?.cleanup();
  const mode = merged.mode ?? 'auto';
  const contrast = merged.contrast ?? 'default';
  const cleanups: Array<() => void> = [];
  const reapply = (): void => themeApi.apply({ ...merged, target });

  const watch = (query: string): void => {
    if (typeof matchMedia !== 'function') return;
    const mql = matchMedia(query);
    if (typeof mql.addEventListener !== 'function') return;
    mql.addEventListener('change', reapply);
    cleanups.push(() => mql.removeEventListener('change', reapply));
  };
  if (mode === 'system') watch('(prefers-color-scheme: dark)');
  if (contrast === 'auto') watch('(prefers-contrast: more)');
  if (mode === 'auto' && typeof setTimeout === 'function') {
    const timer = setTimeout(reapply, msUntilNextAutoSwitch());
    cleanups.push(() => clearTimeout(timer));
  }
  bindings.set(target, { signature, cleanup: () => cleanups.forEach((fn) => fn()) });
}

function resolveTarget(target: ThemeOptions['target']): HTMLElement | null {
  if (typeof HTMLElement !== 'undefined' && target instanceof HTMLElement) return target;
  return typeof document !== 'undefined' ? document.documentElement : null;
}

export const themeApi = {
  /**
   * Write the colour scheme (CSS custom properties) and motion scheme on
   * `target` — `<html>` by default. Document-level calls merge with the
   * previous ones; a local `target` (e.g. `<k3-theme global="false">`) inherits
   * them without becoming the default target of later calls.
   */
  apply(options: ThemeOptions = {}): void {
    const { target: requested, ...rest } = options;
    const target = resolveTarget(requested);
    if (!target) return;
    const isDocument = typeof document !== 'undefined' && target === document.documentElement;
    const merged: ThemeOptions = { ...lastOptions, ...rest };
    if (isDocument) lastOptions = merged;

    const seed = merged.seed ?? '#6750A4';
    const mode = merged.mode ?? 'auto';
    const motion = merged.motion ?? 'expressive';
    const variant = merged.variant ?? 'expressive';
    const contrastPref = merged.contrast ?? 'default';
    const contrast = resolveContrast(contrastPref);
    const spec = merged.specVersion ?? DEFAULT_COLOR_SPEC;
    const resolved = resolveMode(mode);
    const signature = [seed, mode, resolved, motion, variant, contrastPref, contrast, spec].join('|');

    try {
      if (bindings.get(target)?.signature === signature) return;
      const vars = schemeToCssVars(seed, resolved === 'dark', variant, contrast, spec);
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

      bindListeners(target, { ...merged, target: undefined }, signature);

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

  /**
   * Compute the scheme `apply(options)` would write, in short slices between
   * which `pause()` runs (default: `yieldToMain`). The following `apply()` with
   * the same options reuses it — no long task on a cold start (`K3UI.init()`).
   */
  async prepare(
    options: ThemeOptions = {},
    pause: () => Promise<void> = yieldToMain,
  ): Promise<void> {
    const { target: _target, ...rest } = options;
    const merged: ThemeOptions = { ...lastOptions, ...rest };
    const contrast = resolveContrast(merged.contrast ?? 'default');
    const args: SchemeArgs = [
      merged.seed ?? '#6750A4',
      resolveMode(merged.mode ?? 'auto') === 'dark',
      merged.variant ?? 'expressive',
      contrast,
      merged.specVersion ?? DEFAULT_COLOR_SPEC,
    ];
    try {
      await schemeToCssVarsAsync(args, pause);
    } catch (err) {
      debug.error('theme', err);
    }
  },

  /** Stop live updates (OS / clock) of a local `target` — e.g. a removed `<k3-theme>`. */
  release(target: HTMLElement): void {
    bindings.get(target)?.cleanup();
    bindings.delete(target);
  },

  /** Options of the document-level theme (local targets excluded). */
  getLastOptions(): ThemeOptions {
    return { ...lastOptions };
  },
};
