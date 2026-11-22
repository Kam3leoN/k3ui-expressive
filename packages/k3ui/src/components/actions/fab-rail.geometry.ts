/**
 * FAB Rail geometry — linear offsets along an axis.
 * Ported from v1 `rail-geometry.ts`.
 */

import type { FabCornerPosition, FabOffset } from './fab-dial.geometry.js';

export type FabRailDirection = 'right' | 'left' | 'up' | 'down';

const AXIS: Record<FabRailDirection, FabOffset> = {
  right: { x: 1, y: 0 },
  left: { x: -1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

/** Default expansion axis from corner anchor. */
export const DEFAULT_RAIL_DIRECTION: Record<FabCornerPosition, FabRailDirection> = {
  'top-left': 'right',
  'top-right': 'down',
  'bottom-right': 'left',
  'bottom-left': 'up',
};

export interface FabRailGeometryInput {
  count: number;
  direction: FabRailDirection;
  actionSize: number;
  gap: number;
  triggerSize: number;
}

/** Offset of each action along the rail axis. */
export function computeFabRailOffsets(input: FabRailGeometryInput): FabOffset[] {
  const { count, direction, actionSize, gap, triggerSize } = input;
  if (count <= 0) return [];

  const axis = AXIS[direction] ?? AXIS.up;
  const first = (triggerSize + actionSize) / 2 + gap;
  const step = actionSize + gap;

  return Array.from({ length: count }, (_, i) => {
    const d = first + i * step;
    return { x: axis.x * d, y: axis.y * d };
  });
}

/**
 * Scale factor (0–1) so the rail fits inside the viewport along its axis.
 */
export function computeFabRailFitScale(
  rootRect: DOMRect,
  direction: FabRailDirection,
  count: number,
  actionSize: number,
  gap: number,
  viewportW =
    typeof globalThis !== 'undefined' && 'innerWidth' in globalThis
      ? Number((globalThis as unknown as { innerWidth: number }).innerWidth)
      : 0,
  viewportH =
    typeof globalThis !== 'undefined' && 'innerHeight' in globalThis
      ? Number((globalThis as unknown as { innerHeight: number }).innerHeight)
      : 0,
): number {
  const available = {
    right: viewportW - rootRect.right,
    left: rootRect.left,
    down: viewportH - rootRect.bottom,
    up: rootRect.top,
  }[direction];

  const needed = count * (actionSize + gap);
  if (!needed || !Number.isFinite(available)) return 1;
  return Math.min(1, (available - 8) / needed);
}

/** Trigger icon spin for the open state. */
export function computeFabRailIconRotation(direction: FabRailDirection): string {
  return direction === 'right' || direction === 'down' ? '135deg' : '-135deg';
}
