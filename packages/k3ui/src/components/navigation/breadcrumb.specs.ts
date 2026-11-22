/**
 * Specs for `k3-breadcrumb` — M3 Expressive breadcrumb trail.
 */

export type BreadcrumbVariant = 'plain' | 'tonal' | 'filled';
export type BreadcrumbSeparator = 'chevron' | 'slash' | 'dot' | 'arrow';
export type BreadcrumbSize = 'sm' | 'md' | 'lg';

export interface BreadcrumbItem {
  text: string;
  href?: string;
  icon?: string;
  current?: boolean;
}

export const BreadcrumbSpecs = {
  defaultVariant: 'plain' as BreadcrumbVariant,
  defaultSeparator: 'chevron' as BreadcrumbSeparator,
  defaultSize: 'md' as BreadcrumbSize,
  defaultShowIcons: true,
  defaultCollapseAfter: null as number | null,
  separators: {
    chevron: '›',
    slash: '/',
    dot: '•',
    arrow: '→',
  } as Record<BreadcrumbSeparator, string>,
  separatorIcons: {
    chevron: 'chevron_right',
  } as Partial<Record<BreadcrumbSeparator, string>>,
  accessibility: {
    defaultLabel: 'Breadcrumb',
  },
} as const;

export function parseBreadcrumbSize(raw: string | null): BreadcrumbSize {
  if (raw === 'small' || raw === 'sm') return 'sm';
  if (raw === 'large' || raw === 'lg') return 'lg';
  if (raw === 'medium' || raw === 'md') return 'md';
  return BreadcrumbSpecs.defaultSize;
}

export function parseBreadcrumbItems(raw: string | null): BreadcrumbItem[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const o = entry as Record<string, unknown>;
        const text = String(o.text ?? '').trim();
        if (!text) return null;
        const item: BreadcrumbItem = { text };
        if (typeof o.href === 'string' && o.href) item.href = o.href;
        if (typeof o.icon === 'string' && o.icon) item.icon = o.icon;
        if (o.current === true) item.current = true;
        return item;
      })
      .filter((x): x is BreadcrumbItem => x != null);
  } catch {
    return [];
  }
}

export type BreadcrumbVisibleEntry =
  | { kind: 'item'; item: BreadcrumbItem; index: number }
  | { kind: 'ellipsis' };

/** Collapse middle segments when `collapseAfter` is exceeded (v1 behaviour). */
export function buildVisibleBreadcrumbItems(
  items: BreadcrumbItem[],
  collapseAfter: number | null,
): BreadcrumbVisibleEntry[] {
  if (items.length === 0) return [];
  if (collapseAfter == null || items.length <= collapseAfter) {
    return items.map((item, index) => ({ kind: 'item', item, index }));
  }
  if (collapseAfter <= 1) {
    if (items.length <= 1) return [{ kind: 'item', item: items[0], index: 0 }];
    return [
      { kind: 'item', item: items[0], index: 0 },
      { kind: 'ellipsis' },
      { kind: 'item', item: items[items.length - 1], index: items.length - 1 },
    ];
  }
  return [
    { kind: 'item', item: items[0], index: 0 },
    { kind: 'ellipsis' },
    { kind: 'item', item: items[items.length - 1], index: items.length - 1 },
  ];
}
