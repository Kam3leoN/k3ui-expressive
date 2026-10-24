/**
 * Extended semantic color roles (Success / Warning / Info / Note).
 * Not in core MCU MaterialDynamicColors.
 *
 * Seed hex is kept as the main role color (light) so brand accents stay recognizable.
 * `on*` is chosen by WCAG contrast (white vs neutral dark) — never a muddy tinted brown.
 */

import { Hct, TonalPalette, argbFromHex, hexFromArgb } from '@material/material-color-utilities';
import { sysColorCssVars } from './css-vars.js';

export type SemanticName = 'success' | 'warning' | 'info' | 'note';

/** Anchor hues — fixed brand semantics (not derived from primary seed). */
export const SEMANTIC_SEEDS: Record<SemanticName, string> = {
  success: '#146C2E',
  /** Material 2 Orange darken-1 (600) — bright fill; on* is dark (like note). */
  warning: '#FB8C00',
  info: '#0061A4',
  /** Material 2 Amber accent-1 (A100) */
  note: '#FFE57F',
};

export const SEMANTIC_COLOR_ROLES = [
  'success',
  'onSuccess',
  'successContainer',
  'onSuccessContainer',
  'warning',
  'onWarning',
  'warningContainer',
  'onWarningContainer',
  'info',
  'onInfo',
  'infoContainer',
  'onInfoContainer',
  'note',
  'onNote',
  'noteContainer',
  'onNoteContainer',
] as const;

/** Neutral ink when white fails AA on a mid/light brand color (M3 on-surface). */
const ON_DARK = '#1C1B1F';
const ON_LIGHT = '#FFFFFF';

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function normalizeSeed(hex: string): string {
  return hex.startsWith('#') ? hex.toUpperCase() : `#${hex.toUpperCase()}`;
}

function srgbChannel(c: number): number {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m?.[1]) return 0;
  const n = Number.parseInt(m[1], 16);
  return (
    0.2126 * srgbChannel((n >> 16) & 0xff) +
    0.7152 * srgbChannel((n >> 8) & 0xff) +
    0.0722 * srgbChannel(n & 0xff)
  );
}

function contrastRatio(a: string, b: string): number {
  const L1 = relativeLuminance(a);
  const L2 = relativeLuminance(b);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Pick white or neutral dark for content on `bg`.
 * Prefer white only when it meets AA (4.5:1); otherwise dark ink
 * (bright warning / note fills keep their seed and use dark on*).
 */
export function onColorFor(bgHex: string): string {
  const bg = normalizeSeed(bgHex);
  const rWhite = contrastRatio(bg, ON_LIGHT);
  const rDark = contrastRatio(bg, ON_DARK);
  if (rWhite >= 4.5) return ON_LIGHT;
  if (rDark >= 4.5) return ON_DARK;
  return rWhite >= rDark ? ON_LIGHT : ON_DARK;
}

/**
 * Preserve seed as the main role color (light).
 * Containers / dark scheme still use the tonal ladder of that seed.
 */
function rolesFromSeed(
  seedHex: string,
  dark: boolean,
): { color: string; onColor: string; container: string; onContainer: string } {
  const seed = normalizeSeed(seedHex);
  const argb = argbFromHex(seed);
  const palette = TonalPalette.fromInt(argb);
  const seedTone = Hct.fromInt(argb).tone;

  if (!dark) {
    const containerTone = seedTone >= 85 ? 95 : 90;
    const container = hexFromArgb(palette.tone(containerTone));
    return {
      color: seed,
      onColor: onColorFor(seed),
      container,
      onContainer: onColorFor(container),
    };
  }

  /* Dark: keep light seeds visible; lift darker seeds to tone 80 */
  if (seedTone >= 60) {
    const container = hexFromArgb(palette.tone(30));
    return {
      color: seed,
      onColor: onColorFor(seed),
      container,
      onContainer: onColorFor(container),
    };
  }
  const color = hexFromArgb(palette.tone(80));
  const container = hexFromArgb(palette.tone(30));
  return {
    color,
    onColor: onColorFor(color),
    container,
    onContainer: onColorFor(container),
  };
}

/** CSS vars for success / warning / info / note (+ on* / *Container). */
export function buildSemanticCssVars(dark: boolean): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const name of Object.keys(SEMANTIC_SEEDS) as SemanticName[]) {
    const r = rolesFromSeed(SEMANTIC_SEEDS[name], dark);
    const Cap = capitalize(name);
    const map: Record<string, string> = {
      [name]: r.color,
      [`on${Cap}`]: r.onColor,
      [`${name}Container`]: r.container,
      [`on${Cap}Container`]: r.onContainer,
    };
    for (const [key, hex] of Object.entries(map)) {
      Object.assign(vars, sysColorCssVars(key, hex));
    }
  }
  return vars;
}
