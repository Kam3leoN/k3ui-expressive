/** Shared chrome variants for text-field · textarea · select · pin-field. */
export type TextFieldVariant = 'filled' | 'outlined' | 'standard';

export type TextFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'search'
  | 'tel'
  | 'url'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime-local';

/** Native temporal inputs always show a format mask — label stays floated. */
export const TEMPORAL_FIELD_TYPES: ReadonlySet<TextFieldType> = new Set([
  'date',
  'time',
  'datetime-local',
]);

export type PinCharset = 'numeric' | 'alpha' | 'alphanumeric';
