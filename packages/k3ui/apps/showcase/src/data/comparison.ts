/**
 * Feature comparison matrix — adapted from the Material Expressive pricing draft.
 * Column order matches {@link PLANS}: free · essential · pro · enterprise.
 */

export type CompareCell = boolean | string;

export interface CompareRow {
  labelKey: string;
  /** One value per plan column. */
  values: readonly [CompareCell, CompareCell, CompareCell, CompareCell];
}

export interface CompareCategory {
  titleKey: string;
  rows: readonly CompareRow[];
}

export const COMPARE_CATEGORIES: readonly CompareCategory[] = [
  {
    titleKey: 'showcase.pricing.compare.cat.general',
    rows: [
      {
        labelKey: 'showcase.pricing.compare.row.users',
        /** `@u` / `@uf` / `@un` → i18n unlimited (masc. / fém. / neutre). */
        values: ['1', '3', '10', '@u'],
      },
      {
        labelKey: 'showcase.pricing.compare.row.storage',
        values: ['5 Go', '100 Go', '1 To', '5 To'],
      },
      {
        labelKey: 'showcase.pricing.compare.row.projects',
        values: ['3', '20', '@u', '@u'],
      },
      {
        labelKey: 'showcase.pricing.compare.row.history',
        values: ['7 jours', '30 jours', '1 an', '@un'],
      },
    ],
  },
  {
    titleKey: 'showcase.pricing.compare.cat.collab',
    rows: [
      {
        labelKey: 'showcase.pricing.compare.row.comments',
        values: [true, true, true, true],
      },
      {
        labelKey: 'showcase.pricing.compare.row.spaces',
        values: [false, true, true, true],
      },
      {
        labelKey: 'showcase.pricing.compare.row.guests',
        values: [false, '5', '50', '@u'],
      },
      {
        labelKey: 'showcase.pricing.compare.row.roles',
        values: [false, false, true, true],
      },
    ],
  },
  {
    titleKey: 'showcase.pricing.compare.cat.security',
    rows: [
      {
        labelKey: 'showcase.pricing.compare.row.encryption',
        values: [true, true, true, true],
      },
      {
        labelKey: 'showcase.pricing.compare.row.2fa',
        values: [true, true, true, true],
      },
      {
        labelKey: 'showcase.pricing.compare.row.audit',
        values: [false, false, true, true],
      },
      {
        labelKey: 'showcase.pricing.compare.row.sso',
        values: [false, false, false, true],
      },
    ],
  },
  {
    titleKey: 'showcase.pricing.compare.cat.integrations',
    rows: [
      {
        labelKey: 'showcase.pricing.compare.row.natives',
        values: ['3', '20', '@uf', '@uf'],
      },
      {
        labelKey: 'showcase.pricing.compare.row.api',
        values: [false, true, true, true],
      },
      {
        labelKey: 'showcase.pricing.compare.row.webhooks',
        values: [false, false, true, true],
      },
    ],
  },
  {
    titleKey: 'showcase.pricing.compare.cat.support',
    rows: [
      {
        labelKey: 'showcase.pricing.compare.row.help',
        values: [true, true, true, true],
      },
      {
        labelKey: 'showcase.pricing.compare.row.slaResponse',
        values: [false, '48 h', '24 h', '4 h'],
      },
      {
        labelKey: 'showcase.pricing.compare.row.accountManager',
        values: [false, false, false, true],
      },
      {
        labelKey: 'showcase.pricing.compare.row.uptime',
        values: [false, false, '99,9 %', '99,99 %'],
      },
    ],
  },
] as const;

const UNLIMITED_KEYS: Record<string, string> = {
  '@u': 'showcase.pricing.compare.unlimited',
  '@uf': 'showcase.pricing.compare.unlimited.f',
  '@un': 'showcase.pricing.compare.unlimited.n',
};

/** Resolve a cell for display (`true`/`false` stay as-is; tokens → i18n keys). */
export function resolveCompareCell(
  cell: CompareCell,
  translate: (key: string) => string,
): CompareCell {
  if (typeof cell !== 'string') return cell;
  const key = UNLIMITED_KEYS[cell];
  return key ? translate(key) : cell;
}

/** True when not every cell equals the first (for “differences only”). */
export function rowHasDifference(row: CompareRow): boolean {
  const [a, b, c, d] = row.values;
  return !(a === b && b === c && c === d);
}

export function filterCompareCategories(
  cats: readonly CompareCategory[],
  diffsOnly: boolean,
): CompareCategory[] {
  if (!diffsOnly) return [...cats];
  return cats
    .map((cat) => ({
      ...cat,
      rows: cat.rows.filter(rowHasDifference),
    }))
    .filter((cat) => cat.rows.length > 0);
}
