/**
 * Alert — M3E Callout–inspired supporting container for contextual info.
 *
 * @see https://matraic.github.io/m3e/#/components/callout.html
 */

export type AlertVariant =
  | 'secondary'
  | 'primary'
  | 'tertiary'
  | 'error'
  | 'surface'
  | 'success'
  | 'warning'
  | 'info'
  | 'note';

export type AlertShape = 'rounded' | 'square';

export const ALERT_VARIANTS: readonly AlertVariant[] = [
  'secondary',
  'primary',
  'tertiary',
  'error',
  'surface',
  'success',
  'warning',
  'info',
  'note',
] as const;

export const ALERT_SHAPES: readonly AlertShape[] = ['rounded', 'square'] as const;

/** Default Material Symbol (filled) per variant when no icon slot / icon attr. */
export const AlertDefaultIcon: Record<AlertVariant, string> = {
  secondary: 'info',
  primary: 'info',
  tertiary: 'info',
  error: 'error',
  surface: 'info',
  success: 'check_circle',
  warning: 'warning',
  info: 'info',
  note: 'info',
};

export const AlertSpecs = {
  defaultVariant: 'secondary' as AlertVariant,
  defaultShape: 'rounded' as AlertShape,
  iconSizeDp: 24,
  accentSizeDp: 4,
  defaultIcons: AlertDefaultIcon,
  accessibility: {
    /** Live region role — assertive for critical, polite otherwise. */
    roleFor(variant: AlertVariant): 'alert' | 'status' {
      return variant === 'error' || variant === 'warning' ? 'alert' : 'status';
    },
  },
} as const;

export function resolveAlertVariant(v: string | null | undefined): AlertVariant {
  if (v && (ALERT_VARIANTS as readonly string[]).includes(v)) {
    return v as AlertVariant;
  }
  return AlertSpecs.defaultVariant;
}

export function resolveAlertShape(s: string | null | undefined): AlertShape {
  if (s === 'rounded' || s === 'square') return s;
  return AlertSpecs.defaultShape;
}
