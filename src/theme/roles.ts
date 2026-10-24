/**
 * M3 / M3E system color roles — groups for docs + Theme Builder parity.
 * Values match {@link themeApi} CSS vars `--k3-sys-color-*`.
 */

export type ColorRoleKey =
  | 'primary'
  | 'onPrimary'
  | 'primaryContainer'
  | 'onPrimaryContainer'
  | 'secondary'
  | 'onSecondary'
  | 'secondaryContainer'
  | 'onSecondaryContainer'
  | 'tertiary'
  | 'onTertiary'
  | 'tertiaryContainer'
  | 'onTertiaryContainer'
  | 'error'
  | 'onError'
  | 'errorContainer'
  | 'onErrorContainer'
  | 'success'
  | 'onSuccess'
  | 'successContainer'
  | 'onSuccessContainer'
  | 'warning'
  | 'onWarning'
  | 'warningContainer'
  | 'onWarningContainer'
  | 'info'
  | 'onInfo'
  | 'infoContainer'
  | 'onInfoContainer'
  | 'note'
  | 'onNote'
  | 'noteContainer'
  | 'onNoteContainer'
  | 'background'
  | 'onBackground'
  | 'surface'
  | 'onSurface'
  | 'surfaceVariant'
  | 'onSurfaceVariant'
  | 'outline'
  | 'outlineVariant'
  | 'shadow'
  | 'scrim'
  | 'inverseSurface'
  | 'inverseOnSurface'
  | 'inversePrimary'
  | 'surfaceDim'
  | 'surfaceBright'
  | 'surfaceContainerLowest'
  | 'surfaceContainerLow'
  | 'surfaceContainer'
  | 'surfaceContainerHigh'
  | 'surfaceContainerHighest'
  | 'surfaceTint'
  | 'primaryFixed'
  | 'primaryFixedDim'
  | 'onPrimaryFixed'
  | 'onPrimaryFixedVariant'
  | 'secondaryFixed'
  | 'secondaryFixedDim'
  | 'onSecondaryFixed'
  | 'onSecondaryFixedVariant'
  | 'tertiaryFixed'
  | 'tertiaryFixedDim'
  | 'onTertiaryFixed'
  | 'onTertiaryFixedVariant'
  | 'primaryPaletteKeyColor'
  | 'secondaryPaletteKeyColor'
  | 'tertiaryPaletteKeyColor'
  | 'neutralPaletteKeyColor'
  | 'neutralVariantPaletteKeyColor';

export interface ColorRoleGroup {
  id: string;
  /** i18n key under doc.colors.group.* */
  labelKey: string;
  roles: readonly ColorRoleKey[];
}

/** Flat list applied by theme.apply (excl. key colors — optional / debug). */
export const COLOR_ROLES = [
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'secondary',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',
  'tertiary',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',
  'error',
  'onError',
  'errorContainer',
  'onErrorContainer',
  'background',
  'onBackground',
  'surface',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'outline',
  'outlineVariant',
  'shadow',
  'scrim',
  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
  'surfaceTint',
  'primaryFixed',
  'primaryFixedDim',
  'onPrimaryFixed',
  'onPrimaryFixedVariant',
  'secondaryFixed',
  'secondaryFixedDim',
  'onSecondaryFixed',
  'onSecondaryFixedVariant',
  'tertiaryFixed',
  'tertiaryFixedDim',
  'onTertiaryFixed',
  'onTertiaryFixedVariant',
] as const satisfies readonly ColorRoleKey[];

/** Docs / playground sections (Material Theme Builder layout). */
export const COLOR_ROLE_GROUPS: readonly ColorRoleGroup[] = [
  {
    id: 'primary',
    labelKey: 'doc.colors.group.primary',
    roles: ['primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer'],
  },
  {
    id: 'secondary',
    labelKey: 'doc.colors.group.secondary',
    roles: ['secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer'],
  },
  {
    id: 'tertiary',
    labelKey: 'doc.colors.group.tertiary',
    roles: ['tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer'],
  },
  {
    id: 'error',
    labelKey: 'doc.colors.group.error',
    roles: ['error', 'onError', 'errorContainer', 'onErrorContainer'],
  },
  {
    id: 'success',
    labelKey: 'doc.colors.group.success',
    roles: ['success', 'onSuccess', 'successContainer', 'onSuccessContainer'],
  },
  {
    id: 'warning',
    labelKey: 'doc.colors.group.warning',
    roles: ['warning', 'onWarning', 'warningContainer', 'onWarningContainer'],
  },
  {
    id: 'info',
    labelKey: 'doc.colors.group.info',
    roles: ['info', 'onInfo', 'infoContainer', 'onInfoContainer'],
  },
  {
    id: 'note',
    labelKey: 'doc.colors.group.note',
    roles: ['note', 'onNote', 'noteContainer', 'onNoteContainer'],
  },
  {
    id: 'surface',
    labelKey: 'doc.colors.group.surface',
    roles: [
      'background',
      'onBackground',
      'surface',
      'onSurface',
      'surfaceVariant',
      'onSurfaceVariant',
      'surfaceDim',
      'surfaceBright',
      'surfaceContainerLowest',
      'surfaceContainerLow',
      'surfaceContainer',
      'surfaceContainerHigh',
      'surfaceContainerHighest',
      'surfaceTint',
    ],
  },
  {
    id: 'outline',
    labelKey: 'doc.colors.group.outline',
    roles: ['outline', 'outlineVariant', 'shadow', 'scrim'],
  },
  {
    id: 'inverse',
    labelKey: 'doc.colors.group.inverse',
    roles: ['inverseSurface', 'inverseOnSurface', 'inversePrimary'],
  },
  {
    id: 'fixed',
    labelKey: 'doc.colors.group.fixed',
    roles: [
      'primaryFixed',
      'primaryFixedDim',
      'onPrimaryFixed',
      'onPrimaryFixedVariant',
      'secondaryFixed',
      'secondaryFixedDim',
      'onSecondaryFixed',
      'onSecondaryFixedVariant',
      'tertiaryFixed',
      'tertiaryFixedDim',
      'onTertiaryFixed',
      'onTertiaryFixedVariant',
    ],
  },
  {
    id: 'key',
    labelKey: 'doc.colors.group.key',
    roles: [
      'primaryPaletteKeyColor',
      'secondaryPaletteKeyColor',
      'tertiaryPaletteKeyColor',
      'neutralPaletteKeyColor',
      'neutralVariantPaletteKeyColor',
    ],
  },
];

export function colorRoleToCssVar(role: string): string {
  const kebab = role.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  return `--k3-sys-color-${kebab}`;
}
