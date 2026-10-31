/**
 * Per-finder orientation for eye frame / eye ball stamps.
 * Patterns are authored for bottom-right; `mirror` maps each corner from that ref.
 */

export const QR_FINDER_CORNERS = ['tl', 'tr', 'bl'] as const;
export type QrFinderCorner = (typeof QR_FINDER_CORNERS)[number];

/** Absolute or corner-aware transforms. */
export const QR_FINDER_ROTATE_IDS = [
  'mirror',
  'none',
  '90',
  '180',
  '270',
  'flip-h',
  'flip-v',
  'flip-both',
] as const;
export type QrFinderRotate = (typeof QR_FINDER_ROTATE_IDS)[number];

export type QrFinderRotateMap = Record<QrFinderCorner, QrFinderRotate>;

export const QR_FINDER_ROTATE_DEFAULT: QrFinderRotateMap = {
  tl: 'mirror',
  tr: 'mirror',
  bl: 'mirror',
};

export function isQrFinderRotate(v: string | null | undefined): v is QrFinderRotate {
  return !!v && (QR_FINDER_ROTATE_IDS as readonly string[]).includes(v);
}

export function resolveQrFinderRotate(v: string | null | undefined): QrFinderRotate {
  return isQrFinderRotate(v) ? v : 'mirror';
}

/** Parse `corners-*-rotate` — single value or `tl,tr,bl` / space-separated. */
export function parseQrFinderRotateMap(
  v: string | null | undefined,
  fallback: QrFinderRotateMap = QR_FINDER_ROTATE_DEFAULT,
): QrFinderRotateMap {
  const raw = (v ?? '').trim();
  if (!raw) return { ...fallback };
  const parts = raw.split(/[\s,;]+/).filter(Boolean);
  if (parts.length === 1) {
    const all = resolveQrFinderRotate(parts[0]);
    return { tl: all, tr: all, bl: all };
  }
  return {
    tl: resolveQrFinderRotate(parts[0] ?? fallback.tl),
    tr: resolveQrFinderRotate(parts[1] ?? fallback.tr),
    bl: resolveQrFinderRotate(parts[2] ?? fallback.bl),
  };
}

/**
 * SVG transform fragment in pattern cell space (applied after translate+scale to px).
 * `mirror` uses the BR-authored reference → TL/TR/BL flips.
 */
export function finderRotateTransform(
  mode: QrFinderRotate,
  corner: QrFinderCorner,
  cell: number,
): string {
  const c = cell / 2;
  const effective: QrFinderRotate =
    mode === 'mirror'
      ? corner === 'tl'
        ? 'flip-both'
        : corner === 'tr'
          ? 'flip-v'
          : 'flip-h'
      : mode;

  switch (effective) {
    case 'none':
    case 'mirror':
      return '';
    case '90':
      return `rotate(90 ${c} ${c})`;
    case '180':
      return `rotate(180 ${c} ${c})`;
    case '270':
      return `rotate(270 ${c} ${c})`;
    case 'flip-h':
      return `translate(${cell},0) scale(-1,1)`;
    case 'flip-v':
      return `translate(0,${cell}) scale(1,-1)`;
    case 'flip-both':
      return `translate(${cell},${cell}) scale(-1,-1)`;
  }
}
