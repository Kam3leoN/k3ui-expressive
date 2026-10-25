/**
 * Spécifications `k3-button-pad` — pad 4 directions M3 Expressive.
 *
 * Géométrie Small (S) : cellules 48 · gap 2 · grille 98×98 · outer-r 24 ·
 * inner-r 4 · icon 28. Cardinal = host 45° · icônes contre-rotées −45°.
 *
 * @see https://m3.material.io/components/buttons/overview
 */

export type ButtonPadMode = 'diagonal' | 'cardinal';
export type ButtonPadVariant = 'filled' | 'tonal' | 'outlined';

/** Direction émise par `k3-navigate`. */
export type ButtonPadDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se';

/** Position dans la grille 2×2. */
export type ButtonPadPosition = 'tl' | 'tr' | 'bl' | 'br';

/** Définition d'une cellule. */
export interface ButtonPadCellDef {
  position: ButtonPadPosition;
  /** Material Symbol ligature. */
  icon: string;
  direction: ButtonPadDirection;
  label: string;
}

/** Tokens géométrie (dp). */
export const ButtonPadSizeDp = {
  cell: 48,
  gap: 2,
  /** 48 + 2 + 48 */
  grid: 98,
  outerRadius: 24,
  innerRadius: 4,
  icon: 28,
} as const;

/** Cellules mode diagonal (0°) — ↖ ↗ ↙ ↘ */
export const ButtonPadDiagonalCells: ButtonPadCellDef[] = [
  {
    position: 'tl',
    icon: 'north_west',
    direction: 'nw',
    label: 'Nord-Ouest',
  },
  {
    position: 'tr',
    icon: 'north_east',
    direction: 'ne',
    label: 'Nord-Est',
  },
  {
    position: 'bl',
    icon: 'south_west',
    direction: 'sw',
    label: 'Sud-Ouest',
  },
  {
    position: 'br',
    icon: 'south_east',
    direction: 'se',
    label: 'Sud-Est',
  },
];

/** Cellules mode cardinal (grille rotée 45°) — ↑ → ↓ ← */
export const ButtonPadCardinalCells: ButtonPadCellDef[] = [
  { position: 'tl', icon: 'north', direction: 'up', label: 'Nord' },
  { position: 'tr', icon: 'east', direction: 'right', label: 'Est' },
  { position: 'bl', icon: 'west', direction: 'left', label: 'Ouest' },
  { position: 'br', icon: 'south', direction: 'down', label: 'Sud' },
];

export const ButtonPadSpecs = {
  sizeDp: ButtonPadSizeDp,
  diagonalCells: ButtonPadDiagonalCells,
  cardinalCells: ButtonPadCardinalCells,
  defaultMode: 'diagonal' as ButtonPadMode,
  defaultVariant: 'filled' as ButtonPadVariant,
  accessibility: {
    role: 'group' as const,
  },
} as const;

/** Cellules pour un mode donné. */
export function buttonPadCellsFor(mode: ButtonPadMode): ButtonPadCellDef[] {
  return mode === 'cardinal'
    ? ButtonPadCardinalCells
    : ButtonPadDiagonalCells;
}
