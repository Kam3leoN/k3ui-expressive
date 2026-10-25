/**
 * FAB Rail (speed dial) — linear expansion along an axis.
 *
 * Trigger aligns with `k3-fab` default (56dp); action buttons stay 46dp.
 */

import { springs } from '../../motion/springs.js';
import type { FabCornerPosition } from './fab-dial.geometry.js';

export type { FabCornerPosition } from './fab-dial.geometry.js';
export type { FabRailDirection } from './fab-rail.geometry.js';

export type FabRailPhase = 'closed' | 'opening' | 'open' | 'closing';

export interface FabRailItem {
  id: string;
  label: string;
  icon?: string;
}

const fastSpatial = springs.expressive.spatial.fast;
const fastEffects = springs.expressive.effects.fast;

export const FabRailSpecs = {
  /** Align with `k3-fab` size=`default` (M3 Expressive). */
  triggerSizeDp: 56,
  actionSizeDp: 46,
  gapDp: 14,
  insetDp: 24,
  maxActions: 5,
  defaultPosition: 'bottom-right' as FabCornerPosition,
  defaultFabIcon: 'add',
  autoFit: true,
  staggerEnterMs: 28,
  staggerExitMs: 18,
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

export function fabRailMaxDurationMs(
  phase: 'opening' | 'closing',
  count: number,
): number {
  const n = Math.max(count, 1);
  const step =
    phase === 'opening' ? FabRailSpecs.staggerEnterMs : FabRailSpecs.staggerExitMs;
  const motion =
    phase === 'opening' ? FabRailSpecs.spatialDurationMs : FabRailSpecs.exitDurationMs;
  return (n - 1) * step + Math.max(motion, FabRailSpecs.effectsDurationMs) + 16;
}

export function fabRailClampItems(items: FabRailItem[]): FabRailItem[] {
  if (items.length <= FabRailSpecs.maxActions) return items;
  return items.slice(0, FabRailSpecs.maxActions);
}
