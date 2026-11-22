/**
 * Specs for `k3-toc` — sticky “On this page” table of contents.
 */

export type TocLevel = 1 | 2 | 3;

export interface TocItem {
  text: string;
  href: string;
  level?: TocLevel;
}

export const TocSpecs = {
  defaultSticky: true,
  defaultLevel: 1 as TocLevel,
  stickyOffset: '1rem',
  accessibility: {
    defaultLabel: 'On this page',
    defaultAriaLabel: 'Table of contents',
  },
} as const;

export function parseTocLevel(raw: unknown): TocLevel {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (n === 2) return 2;
  if (n === 3) return 3;
  return TocSpecs.defaultLevel;
}

export function parseTocItems(raw: string | null): TocItem[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const o = entry as Record<string, unknown>;
        const text = String(o.text ?? '').trim();
        const href = String(o.href ?? '').trim();
        if (!text || !href) return null;
        const item: TocItem = { text, href };
        if (o.level != null) item.level = parseTocLevel(o.level);
        return item;
      })
      .filter((x): x is TocItem => x != null);
  } catch {
    return [];
  }
}

/** Resolve `#id` / `url#id` → element id, or null. */
export function tocHrefToId(href: string): string | null {
  const hash = href.includes('#') ? href.slice(href.indexOf('#') + 1) : href.replace(/^#/, '');
  const id = hash.trim();
  return id || null;
}
