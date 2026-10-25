export const INDEX_LIST_SYMBOL_KEYS = ['#', '-', '_', '—', ' '] as const;
export const INDEX_LIST_DIGIT_KEYS = '0123456789'.split('');
export const INDEX_LIST_LETTER_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const INDEX_LIST_KEY_ORDER: readonly string[] = [
  ...INDEX_LIST_SYMBOL_KEYS,
  ...INDEX_LIST_DIGIT_KEYS,
  ...INDEX_LIST_LETTER_KEYS,
];

const KEY_ORDER_MAP = new Map(INDEX_LIST_KEY_ORDER.map((key, index) => [key, index]));

const KEY_TO_SLUG: Readonly<Record<string, string>> = {
  '#': 'hash',
  '-': 'dash',
  _: 'underscore',
  '—': 'emdash',
  ' ': 'space',
};

export type IndexListItem = { label: string; key?: string; html?: string };

export const IndexListSpecs = {
  locale: 'fr-FR',
  showRail: true,
  stickyHeaders: true,
  stickyOffset: 0,
  hideEmptyKeys: true,
  railScrub: true,
  indexKeyAttr: 'data-index-key',
} as const;

export function resolveIndexKeyFromLabel(label: string, locale = IndexListSpecs.locale): string {
  const trimmed = label.trim();
  if (!trimmed) return '#';

  const first = trimmed.charAt(0);
  if (first === '-') return '-';
  if (first === '_') return '_';
  if (first === '—' || first === '–') return '—';
  if (first === ' ') return ' ';

  const upper = first.toLocaleUpperCase(locale);
  if (upper >= 'A' && upper <= 'Z') return upper;
  if (upper >= '0' && upper <= '9') return upper;
  return '#';
}

export function compareIndexKeys(a: string, b: string): number {
  const orderA = KEY_ORDER_MAP.get(a) ?? Number.MAX_SAFE_INTEGER;
  const orderB = KEY_ORDER_MAP.get(b) ?? Number.MAX_SAFE_INTEGER;
  return orderA - orderB;
}

export function sortIndexKeys(keys: string[]): string[] {
  return [...keys].sort(compareIndexKeys);
}

export function indexKeyToSectionId(key: string): string {
  const slug = KEY_TO_SLUG[key] ?? key.toLowerCase();
  return `index-list-${slug}`;
}

export function indexKeyToDisplayLabel(key: string): string {
  if (key === ' ') return '·';
  return key;
}

export function groupIndexListItems(
  entries: IndexListItem[],
  locale = IndexListSpecs.locale,
): Map<string, IndexListItem[]> {
  const groups = new Map<string, IndexListItem[]>();
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });

  for (const entry of entries) {
    const key = entry.key
      ? entry.key.trim() || '#'
      : resolveIndexKeyFromLabel(entry.label, locale);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  for (const list of groups.values()) {
    list.sort((a, b) => collator.compare(a.label, b.label));
  }

  return groups;
}
