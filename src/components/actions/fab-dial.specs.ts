/**
 * FAB Dial (speed dial) — flower / vertical fan.
 *
 * Trigger aligns with `k3-fab` default (56dp); action buttons stay 46dp.
 * Geometry math uses the same sizes as v1 (radius / clearance).
 */

import { springs } from '../../motion/springs.js';
import type { FabCornerPosition, FabDialLayout } from './fab-dial.geometry.js';

export type { FabCornerPosition, FabDialLayout } from './fab-dial.geometry.js';

export type FabDialPhase = 'closed' | 'opening' | 'open' | 'closing';

export interface FabDialItem {
  id: string;
  label: string;
  icon?: string;
}

const fastSpatial = springs.expressive.spatial.fast;
const fastEffects = springs.expressive.effects.fast;

export const FabDialSpecs = {
  /** Align with `k3-fab` size=`default` (M3 Expressive). */
  triggerSizeDp: 56,
  actionSizeDp: 46,
  minGapDp: 14,
  /** Vertical layout step between action centers. */
  gapDp: 60,
  spreadDeg: [0, 90] as [number, number],
  insetDp: 24,
  maxFlowerActions: 4,
  defaultPosition: 'bottom-right' as FabCornerPosition,
  defaultLayout: 'flower' as FabDialLayout,
  defaultFabIcon: 'add',
  staggerEnterMs: 32,
  staggerExitMs: 22,
  spatialDurationMs: fastSpatial.durationMs,
  spatialEasing: fastSpatial.easing,
  exitDurationMs: 200,
  exitEasing: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  effectsDurationMs: fastEffects.durationMs,
  effectsEasing: fastEffects.easing,
  pressRadius: '34%',
  zIndex: 1050,
  scrimZ: -1,
  iconPlusDurationMs: 200,
  iconPlusEasing: fastSpatial.easing,
} as const;

export function fabDialMaxDurationMs(
  phase: 'opening' | 'closing',
  count: number,
): number {
  const n = Math.max(count, 1);
  const step =
    phase === 'opening' ? FabDialSpecs.staggerEnterMs : FabDialSpecs.staggerExitMs;
  const motion =
    phase === 'opening' ? FabDialSpecs.spatialDurationMs : FabDialSpecs.exitDurationMs;
  return (n - 1) * step + Math.max(motion, FabDialSpecs.effectsDurationMs) + 16;
}

export function fabDialClampItems(
  items: FabDialItem[],
  layout: FabDialLayout,
): FabDialItem[] {
  const max =
    layout === 'flower' ? FabDialSpecs.maxFlowerActions : Number.POSITIVE_INFINITY;
  if (items.length <= max) return items;
  return items.slice(0, max);
}
