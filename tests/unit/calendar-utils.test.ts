import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  buildMonthGrid,
  civilToValue,
  clampCivil,
  compareCivil,
  daysInMonth,
  DEFAULT_YEAR_MAX,
  DEFAULT_YEAR_MIN,
  formatMonthName,
  inRange,
  isDisabledCivil,
  multiYearPageStart,
  parseCivilDate,
  sameCivil,
  YEARS_PER_PAGE,
  monthSpan,
  monthsToCoverRange,
  extractSingleIsoDate,
  formatHeadline,
  formatLocaleInputDate,
  formatRangeFieldValue,
  formatRangeHeadline,
  localeDatePlaceholder,
  parseLocaleInputDate,
  parseRangeFieldValue,
  yearBounds,
} from '../../src/components/pickers/calendar.utils.js';

describe('calendar utils', () => {
  it('parses yyyy-MM-dd without UTC drift', () => {
    expect(parseCivilDate('2026-01-15')).toEqual({ year: 2026, month: 1, day: 15 });
    expect(parseCivilDate('2026-01-15T00:00:00Z')).toEqual({ year: 2026, month: 1, day: 15 });
    expect(parseCivilDate('')).toBeNull();
    expect(parseCivilDate('2026-02-30')).toBeNull();
  });

  it('formats and compares', () => {
    expect(civilToValue({ year: 2026, month: 3, day: 5 })).toBe('2026-03-05');
    expect(compareCivil({ year: 2026, month: 1, day: 1 }, { year: 2026, month: 1, day: 2 })).toBe(
      -1,
    );
    expect(sameCivil({ year: 2026, month: 1, day: 1 }, { year: 2026, month: 1, day: 1 })).toBe(
      true,
    );
  });

  it('adds days/months and days-in-month', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(addDays({ year: 2026, month: 1, day: 31 }, 1)).toEqual({
      year: 2026,
      month: 2,
      day: 1,
    });
    expect(addMonths({ year: 2026, month: 1, day: 31 }, 1)).toEqual({
      year: 2026,
      month: 2,
      day: 28,
    });
  });

  it('clamps and disables', () => {
    const min = { year: 2026, month: 1, day: 10 };
    const max = { year: 2026, month: 1, day: 20 };
    expect(clampCivil({ year: 2026, month: 1, day: 1 }, min, max)).toEqual(min);
    expect(isDisabledCivil({ year: 2026, month: 1, day: 5 }, min, max)).toBe(true);
    expect(isDisabledCivil({ year: 2026, month: 1, day: 15 }, min, max, () => true)).toBe(true);
  });

  it('builds month grid and multi-year page', () => {
    const grid = buildMonthGrid(2026, 1, 1); /* Mon start */
    expect(grid).toHaveLength(42);
    expect(multiYearPageStart(2026)).toBe(Math.floor(2026 / YEARS_PER_PAGE) * YEARS_PER_PAGE);
  });

  it('formats month name and year bounds for split header', () => {
    expect(formatMonthName({ year: 2026, month: 11, day: 1 }, 'fr-FR').toLowerCase()).toContain(
      'novembre',
    );
    expect(yearBounds(null, null)).toEqual([DEFAULT_YEAR_MIN, DEFAULT_YEAR_MAX]);
    expect(
      yearBounds({ year: 2000, month: 1, day: 1 }, { year: 2030, month: 12, day: 31 }),
    ).toEqual([2000, 2030]);
  });

  it('detects in-range', () => {
    const a = { year: 2026, month: 1, day: 5 };
    const b = { year: 2026, month: 1, day: 10 };
    expect(inRange({ year: 2026, month: 1, day: 7 }, a, b)).toBe(true);
    expect(inRange({ year: 2026, month: 1, day: 11 }, a, b)).toBe(false);
  });

  it('spans months for multi-month / range cover', () => {
    expect(monthSpan({ year: 2027, month: 1, day: 1 }, 4).map((d) => d.month)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(
      monthsToCoverRange(
        { year: 2027, month: 1, day: 1 },
        { year: 2027, month: 4, day: 30 },
        2,
      ),
    ).toBe(4);
  });

  it('range headline always includes 4-digit years on both ends', () => {
    const same = formatRangeHeadline(
      { year: 2026, month: 11, day: 24 },
      { year: 2026, month: 11, day: 27 },
      'en-US',
    );
    expect(same).toMatch(/2026/);
    expect(same).toMatch(/24/);
    expect(same).toMatch(/27/);
    expect(same).not.toMatch(/Wed|Tue|Mon|Sun/i); /* no weekday — keeps years readable */
    const fr = formatRangeHeadline(
      { year: 2026, month: 12, day: 22 },
      { year: 2027, month: 1, day: 16 },
      'fr-FR',
    );
    expect(fr).toMatch(/2026/);
    expect(fr).toMatch(/2027/);
    expect(fr).toMatch(/22/);
    expect(fr).toMatch(/16/);
    const cross = formatRangeHeadline(
      { year: 2026, month: 10, day: 21 },
      { year: 2027, month: 9, day: 26 },
      'en-US',
    );
    expect(cross).toMatch(/2026/);
    expect(cross).toMatch(/2027/);
    expect(formatHeadline({ year: 2026, month: 1, day: 5 }, 'en-US', { withYear: true })).toMatch(
      /2026/,
    );
  });

  it('formats and parses compact range field values', () => {
    expect(formatRangeFieldValue('2026-11-24', '2026-11-27')).toBe('2026-11-24 - 2026-11-27');
    expect(formatRangeFieldValue('2027-01-01', '2027-02-15')).toBe('2027-01-01 - 2027-02-15');
    expect(parseRangeFieldValue('Du : 2027-01-01\nAu : 2027-02-15')).toEqual({
      start: '2027-01-01',
      end: '2027-02-15',
    });
    expect(parseRangeFieldValue('2027-01-01 - 2027-02-15')).toEqual({
      start: '2027-01-01',
      end: '2027-02-15',
    });
    expect(parseRangeFieldValue('2027-01-01/2027-02-15')).toEqual({
      start: '2027-01-01',
      end: '2027-02-15',
    });
    expect(extractSingleIsoDate('Du : 2026-10-21 – 2026-11-30')).toBe('2026-10-21');
  });

  it('formats and parses locale-typed dates for modal input', () => {
    expect(localeDatePlaceholder('fr-FR')).toMatch(/DD/);
    expect(localeDatePlaceholder('fr-FR')).toMatch(/MM/);
    expect(localeDatePlaceholder('fr-FR')).toMatch(/YYYY/);
    const d = { year: 2026, month: 11, day: 18 };
    const fr = formatLocaleInputDate(d, 'fr-FR');
    expect(parseLocaleInputDate(fr, 'fr-FR')).toEqual(d);
    expect(parseLocaleInputDate('2026-11-18', 'fr-FR')).toEqual(d);
  });
});
