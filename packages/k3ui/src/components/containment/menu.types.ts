/**
 * Public types + attribute parsers for `k3-menu`.
 *
 * Kept in a tiny module so styles / gaps helpers can import them without
 * pulling the Lit class graph (avoids circular imports with menu-item).
 */

/** Visual chrome. `vertical` = M3 Expressive (default). */
export type MenuVariant = 'baseline' | 'vertical';

/**
 * M3 list density (web) — reduces item block padding / height.
 * `0` = default · `-3` = densest.
 */
export type MenuDensity = 0 | -1 | -2 | -3;

/** Surface tint. `vibrant` uses tertiary container fills. */
export type MenuColor = 'standard' | 'vibrant';

/**
 * How the slotted trigger opens the panel.
 * `hover` requires a fine pointer with hover (`(hover: hover) and (pointer: fine)`);
 * otherwise the menu falls back to click (touch / coarse pointers).
 */
export type MenuOpenOn = 'click' | 'hover';

/** Panel placement relative to the trigger. */
export type MenuPosition =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'top'
  /** Beside trigger — end edge, top-aligned (nav-rail secondary). */
  | 'end-start'
  /** Beside trigger — end edge, bottom-aligned. */
  | 'end-end'
  /** Beside trigger — start edge, top-aligned. */
  | 'start-start'
  /** Beside trigger — start edge, bottom-aligned. */
  | 'start-end';

/** Attribute → density (also accepts legacy `compact` → −2). */
export function parseMenuDensity(value: string | null): MenuDensity {
  if (value === null || value === '' || value === 'default') return 0;
  if (value === 'compact') return -2;
  const n = Number(value);
  if (n === 0 || n === -1 || n === -2 || n === -3) return n;
  return 0;
}

/** Attribute → open-on (`hover` or default `click`). */
export function parseMenuOpenOn(value: string | null): MenuOpenOn {
  return value === 'hover' ? 'hover' : 'click';
}

/** Fine pointer with real hover — touch / coarse fall back to click. */
export function canHoverOpen(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

/** True for side placements (`end-*` / `start-*`). */
export function isSideMenuPosition(position: MenuPosition): boolean {
  return position.startsWith('end') || position.startsWith('start');
}
