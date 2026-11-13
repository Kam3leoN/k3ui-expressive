/** Calendar / date-picker view hierarchy (Matraic / M3). */
export type CalendarView = 'month' | 'year' | 'multi-year';

/**
 * Month presentation.
 * - `paged` — one or more months with prev/next (docked / single)
 * - `scroll` — vertical month list (Noph / M3 range)
 * - `auto` — `scroll` when `range`, else `paged`
 */
export type CalendarLayout = 'paged' | 'scroll' | 'auto';

/**
 * Range tap targeting. Date-picker always uses `auto` (1st=start, 2nd=end).
 * `start` / `end` remain for rare direct calendar control.
 */
export type CalendarSelectionTarget = 'start' | 'end' | 'auto';

/** Docked popover · modal dialog · auto by breakpoint. */
export type {
  SurfaceVariant as DatePickerVariant,
  ResolvedSurfaceVariant as DatePickerResolvedVariant,
} from '../../core/surface-variant.js';

/** Local civil date — no time / timezone (yyyy-MM-dd). */
export interface CivilDate {
  year: number;
  month: number; /* 1–12 */
  day: number; /* 1–31 */
}

export type BlackoutDatesFn = (d: CivilDate) => boolean;
export type SpecialDatesFn = (d: CivilDate) => boolean;

export interface DatePickerValueDetail {
  value: string;
  date: CivilDate | null;
  rangeStart: string;
  rangeEnd: string;
}
