import type { CivilDate } from './calendar.types.js';

/** Matraic: 18 years per multi-year page, 3 columns; months 4 per row. */
export const YEARS_PER_PAGE = 18;
export const YEARS_PER_ROW = 3;
export const MONTHS_PER_ROW = 4;

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Parse `yyyy-MM-dd` (or ISO datetime) → local civil date — no UTC drift. */
export function parseCivilDate(raw: string | null | undefined): CivilDate | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!isValidCivil(year, month, day)) return null;
  return { year, month, day };
}

export function civilToValue(d: CivilDate): string {
  return `${d.year}-${pad2(d.month)}-${pad2(d.day)}`;
}

export function isValidCivil(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const dim = daysInMonth(year, month);
  return day <= dim;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function compareCivil(a: CivilDate, b: CivilDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function sameCivil(a: CivilDate | null, b: CivilDate | null): boolean {
  if (a == null || b == null) return a === b;
  return compareCivil(a, b) === 0;
}

export function clampCivil(
  d: CivilDate,
  min?: CivilDate | null,
  max?: CivilDate | null,
): CivilDate {
  let t = d;
  if (min && compareCivil(t, min) < 0) t = min;
  if (max && compareCivil(t, max) > 0) t = max;
  return t;
}

export function addDays(d: CivilDate, days: number): CivilDate {
  const dt = new Date(d.year, d.month - 1, d.day + days);
  return { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() };
}

export function addMonths(d: CivilDate, months: number): CivilDate {
  const dt = new Date(d.year, d.month - 1 + months, 1);
  const dim = daysInMonth(dt.getFullYear(), dt.getMonth() + 1);
  return {
    year: dt.getFullYear(),
    month: dt.getMonth() + 1,
    day: Math.min(d.day, dim),
  };
}

export function addYears(d: CivilDate, years: number): CivilDate {
  return addMonths(d, years * 12);
}

export function todayCivil(): CivilDate {
  const n = new Date();
  return { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate() };
}

/** Weekday 0=Sun … 6=Sat for civil date (local). */
export function weekday(d: CivilDate): number {
  return new Date(d.year, d.month - 1, d.day).getDay();
}

/**
 * First day of week for locale — 0=Sun … 6=Sat.
 * Uses `Intl.Locale.weekInfo` when available (1=Mon … 7=Sun).
 */
export function firstWeekday(locale = 'en'): number {
  try {
    const loc = new Intl.Locale(locale) as Intl.Locale & {
      weekInfo?: { firstDay: number };
    };
    const fd = loc.weekInfo?.firstDay;
    if (fd == null) return locale.toLowerCase().startsWith('en-us') ? 0 : 1;
    return fd === 7 ? 0 : fd; /* 7=Sun → 0 */
  } catch {
    return 1;
  }
}

export function isDisabledCivil(
  d: CivilDate,
  min?: CivilDate | null,
  max?: CivilDate | null,
  blackout?: ((x: CivilDate) => boolean) | null,
): boolean {
  if (min && compareCivil(d, min) < 0) return true;
  if (max && compareCivil(d, max) > 0) return true;
  if (blackout?.(d)) return true;
  return false;
}

export function inRange(
  d: CivilDate,
  start: CivilDate | null,
  end: CivilDate | null,
): boolean {
  if (!start || !end) return false;
  const a = compareCivil(start, end) <= 0 ? start : end;
  const b = compareCivil(start, end) <= 0 ? end : start;
  return compareCivil(d, a) >= 0 && compareCivil(d, b) <= 0;
}

export function isRangeEdge(
  d: CivilDate,
  start: CivilDate | null,
  end: CivilDate | null,
): 'start' | 'end' | 'both' | null {
  if (!start && !end) return null;
  const isS = start ? sameCivil(d, start) : false;
  const isE = end ? sameCivil(d, end) : false;
  if (isS && isE) return 'both';
  if (isS) return 'start';
  if (isE) return 'end';
  return null;
}

/** Build month grid cells (leading/trailing outside days included). */
export function buildMonthGrid(
  year: number,
  month: number,
  weekStart: number,
): CivilDate[] {
  const first: CivilDate = { year, month, day: 1 };
  const firstWd = weekday(first);
  const lead = (firstWd - weekStart + 7) % 7;
  const start = addDays(first, -lead);
  const cells: CivilDate[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(start, i));
  return cells;
}

/** Multi-year page base year containing `year` (aligned to YEARS_PER_PAGE). */
export function multiYearPageStart(year: number): number {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

export function formatPeriodLabel(
  view: 'month' | 'year' | 'multi-year',
  active: CivilDate,
  locale: string,
): string {
  if (view === 'month') {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
      new Date(active.year, active.month - 1, 1),
    );
  }
  if (view === 'year') {
    return String(active.year);
  }
  const start = multiYearPageStart(active.year);
  return `${start} – ${start + YEARS_PER_PAGE - 1}`;
}

export function weekdayLabels(locale: string, weekStart: number): { short: string; long: string }[] {
  const fmtShort = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  const fmtLong = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  /* 2023-01-01 was Sunday */
  const out: { short: string; long: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const dow = (weekStart + i) % 7;
    const d = new Date(2023, 0, 1 + dow);
    out.push({ short: fmtShort.format(d), long: fmtLong.format(d) });
  }
  return out;
}

export function monthLabels(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short' });
  return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2000, i, 1)));
}

export function formatFullDate(d: CivilDate, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(d.year, d.month - 1, d.day));
}

export function formatHeadline(
  d: CivilDate | null,
  locale: string,
  opts?: { withYear?: boolean },
): string {
  if (!d) return '';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(opts?.withYear ? { year: 'numeric' } : {}),
  }).format(new Date(d.year, d.month - 1, d.day));
}

/**
 * Range headline — includes years when the span crosses a year boundary (M3 yMMMd).
 * @example "Wed, Oct 21, 2026 – Sun, Sep 26, 2027"
 */
export function formatRangeHeadline(
  start: CivilDate | null,
  end: CivilDate | null,
  locale: string,
): string {
  const crossYear = !!(start && end && start.year !== end.year);
  const fa = formatHeadline(start, locale, { withYear: crossYear }) || '–';
  const fb = formatHeadline(end, locale, { withYear: crossYear }) || '–';
  return `${fa} – ${fb}`;
}

/** First `yyyy-MM-dd` in a string (dual Start/End fields: one date only). */
export function extractSingleIsoDate(raw: string): string {
  const m = raw.match(/\d{4}-\d{2}-\d{2}/);
  if (m) return m[0]!;
  const trimmed = raw.trim();
  return parseCivilDate(trimmed) ? trimmed : '';
}

/**
 * Single-field range — **exactly two lines** (no soft wrap):
 * ```
 * Du: 2026-10-21
 * Au: 2026-11-30
 * ```
 * Host must be `multiline rows="2"`. Use NBSP after `:` so label+date stay one line.
 */
export function formatRangeFieldValue(
  start: string,
  end: string,
  labels: { from: string; to: string } = { from: 'From', to: 'To' },
): string {
  const a = extractSingleIsoDate(start);
  const b = extractSingleIsoDate(end);
  const nbsp = '\u00a0';
  if (!a && !b) return '';
  if (a && !b) return `${labels.from}:${nbsp}${a}`;
  if (!a && b) return `${labels.to}:${nbsp}${b}`;
  return `${labels.from}:${nbsp}${a}\n${labels.to}:${nbsp}${b}`;
}

/** Parse single-field range (two-line Du/Au, ` – `, `/`, ` · `, or embedded ISO dates). */
export function parseRangeFieldValue(raw: string): { start: string; end: string } {
  const s = raw.trim();
  if (!s) return { start: '', end: '' };
  const isos = s.match(/\d{4}-\d{2}-\d{2}/g);
  if (isos && isos.length >= 2) return { start: isos[0]!, end: isos[1]! };
  if (isos && isos.length === 1) return { start: isos[0]!, end: '' };
  const parts = s.split(/\s*[–/·]\s*|\s+-\s+/);
  if (parts.length >= 2) {
    return {
      start: extractSingleIsoDate(parts[0]!) || parts[0]!.trim(),
      end: extractSingleIsoDate(parts[1]!) || parts[1]!.trim(),
    };
  }
  return { start: extractSingleIsoDate(s) || s, end: '' };
}

/** Consecutive month anchors starting at `{year,month,1}`. */
export function monthSpan(start: CivilDate, count: number): CivilDate[] {
  const n = Math.max(1, Math.floor(count));
  const base = { year: start.year, month: start.month, day: 1 };
  return Array.from({ length: n }, (_, i) => addMonths(base, i));
}

/** Months needed to cover a range (inclusive), at least `minCount`. */
export function monthsToCoverRange(
  start: CivilDate | null,
  end: CivilDate | null,
  minCount = 2,
): number {
  if (!start || !end) return minCount;
  const a = compareCivil(start, end) <= 0 ? start : end;
  const b = compareCivil(start, end) <= 0 ? end : start;
  const months = (b.year - a.year) * 12 + (b.month - a.month) + 1;
  return Math.max(minCount, months);
}
