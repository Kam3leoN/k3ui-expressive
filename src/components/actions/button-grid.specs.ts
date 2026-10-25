/**
 * Button Grid — 3×3 Material 3 Expressive pad / FAB reveal.
 *
 * Geometry (Small): cell 48 · gap 2 · grid 148×148 · outer-r 24 · inner-r 4.
 *
 * @see https://m3.material.io/components/buttons/overview
 */

/** Cell position in the 3×3 grid (LTR reading order). */
export type ButtonGridPosition =
  | 'tl'
  | 'tc'
  | 'tr'
  | 'ml'
  | 'mc'
  | 'mr'
  | 'bl'
  | 'bc'
  | 'br';

export type ButtonGridVariant = 'filled' | 'tonal' | 'outlined';

/** Cell metadata — stagger open: centre → edges → corners. */
export interface ButtonGridCellDef {
  position: ButtonGridPosition;
  /** 0 = centre, 1 = edge, 2 = corner */
  staggerDistance: 0 | 1 | 2;
}

export const BUTTON_GRID_DEFAULT_LABELS: string[] = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
];

export const BUTTON_GRID_CELLS: ButtonGridCellDef[] = [
  { position: 'tl', staggerDistance: 2 },
  { position: 'tc', staggerDistance: 1 },
  { position: 'tr', staggerDistance: 2 },
  { position: 'ml', staggerDistance: 1 },
  { position: 'mc', staggerDistance: 0 },
  { position: 'mr', staggerDistance: 1 },
  { position: 'bl', staggerDistance: 2 },
  { position: 'bc', staggerDistance: 1 },
  { position: 'br', staggerDistance: 2 },
];

/** Cell size (dp). */
export const ButtonGridCellDp = 48;
/** CSS gap between cells (dp). */
export const ButtonGridGapDp = 2;
/** Total grid size = 3×48 + 2×2 (dp). */
export const ButtonGridSizeDp = 148;
/** Outer corner radius (dp). */
export const ButtonGridOuterRadiusDp = 24;
/** Inner / seam corner radius (dp). */
export const ButtonGridInnerRadiusDp = 4;
/** FAB Material Symbol size (dp). */
export const ButtonGridIconDp = 28;

/** Stagger open delays (ms) — centre → edges → corners. */
export const ButtonGridStaggerMs = {
  0: 40,
  1: 110,
  2: 180,
} as const;

export const ButtonGridSpecs = {
  defaultVariant: 'filled' as ButtonGridVariant,
  defaultTriggerFab: true,
  cellCount: 9,
  cellDp: ButtonGridCellDp,
  gapDp: ButtonGridGapDp,
  sizeDp: ButtonGridSizeDp,
  outerRadiusDp: ButtonGridOuterRadiusDp,
  innerRadiusDp: ButtonGridInnerRadiusDp,
  iconDp: ButtonGridIconDp,
  staggerMs: ButtonGridStaggerMs,
  cells: BUTTON_GRID_CELLS,
  defaultLabels: BUTTON_GRID_DEFAULT_LABELS,
  accessibility: {
    role: 'group',
    fabLabel: 'Open grid',
    autoPadForReducedMotion: true,
  },
  animations: {
    openMs: 500,
    closeMs: 420,
  },
} as const;

/** Normalize labels to exactly 9 entries (pad / truncate from defaults). */
export function normalizeButtonGridLabels(labels: string[] | null | undefined): string[] {
  const base = [...BUTTON_GRID_DEFAULT_LABELS];
  if (!labels?.length) return base;
  for (let i = 0; i < 9; i++) {
    const v = labels[i];
    if (v != null && String(v).trim()) base[i] = String(v).trim();
  }
  return base;
}

/** Parse CSV `labels` attribute → 9 strings. */
export function parseButtonGridLabelsAttr(raw: string | null): string[] {
  if (!raw?.trim()) return [...BUTTON_GRID_DEFAULT_LABELS];
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return normalizeButtonGridLabels(parts);
}
