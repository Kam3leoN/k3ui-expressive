/**
 * Specs for `k3-button-segmented` — M3 Expressive segmented control.
 */

export type ButtonSegmentedShape = 'rounded' | 'square';

export interface ButtonSegmentedSegment {
  label: string;
  icon?: string;
  value?: string;
  attributes?: Record<string, string>;
}

export const ButtonSegmentedSpecs = {
  defaultShape: 'rounded' as ButtonSegmentedShape,
  defaultMultiSelect: false,
  defaultShowCheck: false,
  defaultSelectedIndices: [0] as number[],
  containerPaddingDp: 4,
  segmentGapDp: 4,
  wrapRadiusRoundedDp: 24,
  wrapRadiusSquareDp: 10,
  segmentRadiusRoundedDp: 20,
  segmentRadiusSquareDp: 6,
  checkIcon: 'check',
  accessibility: {
    roleSingle: 'radiogroup' as const,
    roleMulti: 'group' as const,
    defaultLabel: 'Segmented control',
  },
} as const;

export function parseSegmentsAttr(raw: string | null): ButtonSegmentedSegment[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const o = entry as Record<string, unknown>;
        const label = String(o.label ?? '').trim();
        if (!label) return null;
        const seg: ButtonSegmentedSegment = { label };
        if (typeof o.icon === 'string' && o.icon) seg.icon = o.icon;
        if (typeof o.value === 'string') seg.value = o.value;
        if (o.attributes && typeof o.attributes === 'object' && !Array.isArray(o.attributes)) {
          seg.attributes = Object.fromEntries(
            Object.entries(o.attributes as Record<string, unknown>).map(([k, v]) => [
              k,
              String(v),
            ]),
          );
        }
        return seg;
      })
      .filter((x): x is ButtonSegmentedSegment => x != null);
  } catch {
    return [];
  }
}

export function parseIndicesAttr(raw: string | null): number[] {
  if (raw == null || raw.trim() === '') return [];
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((n) => Number(n))
        .filter((n) => Number.isInteger(n) && n >= 0);
    }
  } catch {
    const n = parseInt(trimmed, 10);
    if (!Number.isNaN(n) && n >= 0) return [n];
  }
  return [];
}

export function clampSelectedIndices(indices: number[], segmentCount: number): number[] {
  const max = segmentCount;
  if (max <= 0) return [];
  const set = new Set<number>();
  for (const i of indices) {
    if (i >= 0 && i < max) set.add(i);
  }
  return [...set].sort((a, b) => a - b);
}
