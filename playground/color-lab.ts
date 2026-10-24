/**
 * Playground Color lab helpers — hex normalize, WCAG contrast, role pairs.
 */

export type ContrastGrade = 'AAA' | 'AA' | 'AA Large' | 'fail';

/** Surface / accent pairs used for contrast chips (bg → on*). */
export const ROLE_CONTRAST_PAIRS: readonly (readonly [string, string])[] = [
  ['primary', 'onPrimary'],
  ['primaryContainer', 'onPrimaryContainer'],
  ['secondary', 'onSecondary'],
  ['secondaryContainer', 'onSecondaryContainer'],
  ['tertiary', 'onTertiary'],
  ['tertiaryContainer', 'onTertiaryContainer'],
  ['error', 'onError'],
  ['errorContainer', 'onErrorContainer'],
  ['success', 'onSuccess'],
  ['successContainer', 'onSuccessContainer'],
  ['warning', 'onWarning'],
  ['warningContainer', 'onWarningContainer'],
  ['info', 'onInfo'],
  ['infoContainer', 'onInfoContainer'],
  ['note', 'onNote'],
  ['noteContainer', 'onNoteContainer'],
  ['background', 'onBackground'],
  ['surface', 'onSurface'],
  ['surfaceVariant', 'onSurfaceVariant'],
  ['inverseSurface', 'inverseOnSurface'],
  ['primaryFixed', 'onPrimaryFixed'],
  ['primaryFixedDim', 'onPrimaryFixedVariant'],
  ['secondaryFixed', 'onSecondaryFixed'],
  ['secondaryFixedDim', 'onSecondaryFixedVariant'],
  ['tertiaryFixed', 'onTertiaryFixed'],
  ['tertiaryFixedDim', 'onTertiaryFixedVariant'],
];

const pairByRole = new Map<string, { bg: string; fg: string }>();
for (const [bg, fg] of ROLE_CONTRAST_PAIRS) {
  pairByRole.set(bg, { bg, fg });
  pairByRole.set(fg, { bg, fg });
}

export function contrastPairFor(role: string): { bg: string; fg: string } | undefined {
  return pairByRole.get(role);
}

/** Normalize user HEX (#RGB / #RRGGBB / without #). */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    const [r, g, b] = raw.split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw.toUpperCase()}`;
  return null;
}

function srgbChannel(c: number): number {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m?.[1]) return 0;
  const n = Number.parseInt(m[1], 16);
  const r = srgbChannel((n >> 16) & 0xff);
  const g = srgbChannel((n >> 8) & 0xff);
  const b = srgbChannel(n & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio (1–21). */
export function contrastRatio(hexA: string, hexB: string): number {
  const L1 = relativeLuminance(hexA);
  const L2 = relativeLuminance(hexB);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastGrade(ratio: number): ContrastGrade {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'fail';
}

/** Readable label color on a swatch. */
export function swatchLabelColor(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? '#1d1b20' : '#ffffff';
}
