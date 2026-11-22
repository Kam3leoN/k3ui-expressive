/** Appearance — docked popover · modal dialog · auto by breakpoint. */
export type {
  SurfaceVariant as TimePickerVariant,
  ResolvedSurfaceVariant as TimePickerResolvedVariant,
} from '../../core/surface-variant.js';

/** Selection surface — dial clock · keyboard fields · auto. */
export type TimePickerMode = 'dial' | 'input' | 'auto';

/** Dial layout only — keyboard always uses the vertical field layout. */
export type TimePickerOrientation = 'vertical' | 'horizontal' | 'auto';

/** Hour cycle. `auto` follows the active locale. */
export type TimePickerFormat = '12' | '24' | 'auto';

/** Which segment is being edited. */
export type TimePickerView = 'hour' | 'minute' | 'second';

/** 12-hour meridiem. */
export type TimePickerPeriod = 'am' | 'pm';

export type TimePickerUiMode = 'dial' | 'input';

export type TimePickerResolvedOrientation = 'vertical' | 'horizontal';

export interface TimeParts {
  hour: number;
  minute: number;
  second: number;
}

/**
 * In-progress selection — hour/minute may be unset (Matraic / M3 empty start).
 * OK stays disabled until both are set.
 */
export interface TimeDraft {
  hour: number | null;
  minute: number | null;
  second: number;
}

/** Payload for `k3-input` / `k3-change`. */
export interface TimePickerValueDetail {
  value: string;
  hour: number | null;
  minute: number | null;
  second: number;
}

export type BlackoutTimesFn = (t: TimeParts) => boolean;
