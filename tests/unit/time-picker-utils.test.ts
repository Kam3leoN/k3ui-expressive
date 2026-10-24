import { describe, expect, it } from 'vitest';
import {
  angleFromPointer,
  clampParts,
  displayHour,
  draftToParts,
  emptyDraft,
  hour24FromDisplay,
  hourFromAngle,
  isDraftComplete,
  isPartsDisabled,
  minuteFromAngle,
  parseTimeToParts,
  partsToDaySeconds,
  partsToValue,
  periodOf,
  resolveFormat,
  resolveUiMode,
  resolveVariant,
  resolveOrientation,
  applyPeriod,
  snapToStep,
  steppedRange,
  periodLabels,
  isTimeBlocked,
  nextView,
  draftToDetail,
  pad2,
} from '../../src/components/pickers/time-picker.utils.js';
import { computeDockedPosition } from '../../src/components/pickers/time-picker.position.js';

describe('time-picker utils', () => {
  it('parses HH:mm, meridiem, and ISO', () => {
    expect(parseTimeToParts('14:30')).toEqual({ hour: 14, minute: 30, second: 0 });
    expect(parseTimeToParts('8:15 AM')).toEqual({ hour: 8, minute: 15, second: 0 });
    expect(parseTimeToParts('12:00 PM')).toEqual({ hour: 12, minute: 0, second: 0 });
    expect(parseTimeToParts('12:00 AM')).toEqual({ hour: 0, minute: 0, second: 0 });
    expect(parseTimeToParts('')).toBeNull();
    expect(parseTimeToParts('2026-07-13T23:30:00')).toEqual({
      hour: 23,
      minute: 30,
      second: 0,
    });
  });

  it('rejects invalid minute/second', () => {
    expect(parseTimeToParts('10:60')).toBeNull();
    expect(parseTimeToParts('10:30:99')).toBeNull();
  });

  it('formats parts', () => {
    expect(partsToValue({ hour: 9, minute: 5, second: 7 }, false)).toBe('09:05');
    expect(partsToValue({ hour: 9, minute: 5, second: 7 }, true)).toBe('09:05:07');
  });

  it('maps day-seconds and clamps', () => {
    expect(partsToDaySeconds({ hour: 1, minute: 0, second: 0 })).toBe(3600);
    const mid = { hour: 12, minute: 0, second: 0 };
    expect(clampParts(mid, { hour: 13, minute: 0, second: 0 }, null)).toEqual({
      hour: 13,
      minute: 0,
      second: 0,
    });
    expect(clampParts(mid, null, { hour: 11, minute: 0, second: 0 })).toEqual({
      hour: 11,
      minute: 0,
      second: 0,
    });
  });

  it('detects disabled parts via min/max/blackout', () => {
    const t = { hour: 10, minute: 0, second: 0 };
    expect(isPartsDisabled(t, { hour: 11, minute: 0, second: 0 }, null)).toBe(true);
    expect(isPartsDisabled(t, null, { hour: 9, minute: 0, second: 0 })).toBe(true);
    expect(isPartsDisabled(t, null, null, () => true)).toBe(true);
    expect(isPartsDisabled(t)).toBe(false);
  });

  it('maps display hours and period', () => {
    expect(displayHour(0, '12')).toBe(12);
    expect(displayHour(13, '12')).toBe(1);
    expect(displayHour(13, '24')).toBe(13);
    expect(displayHour(null, '24')).toBeNull();
    expect(periodOf(0)).toBe('am');
    expect(periodOf(13)).toBe('pm');
    expect(periodOf(null)).toBe('am');
  });

  it('converts display hour to 24h storage', () => {
    expect(hour24FromDisplay(12, 'am', '12')).toBe(0);
    expect(hour24FromDisplay(12, 'pm', '12')).toBe(12);
    expect(hour24FromDisplay(1, 'pm', '12')).toBe(13);
    expect(hour24FromDisplay(0, 'am', '24')).toBe(0);
    expect(hour24FromDisplay(24, 'am', '24')).toBe(0);
  });

  it('keeps empty draft incomplete (no now fill-in)', () => {
    const d = emptyDraft();
    expect(d).toEqual({ hour: null, minute: null, second: 0 });
    expect(isDraftComplete(d)).toBe(false);
    expect(draftToParts(d)).toBeNull();
    expect(isDraftComplete({ hour: 14, minute: 30, second: 0 })).toBe(true);
  });

  it('resolves hour/minute from dial angle', () => {
    expect(hourFromAngle(0, false, '12')).toBe(0);
    expect(hourFromAngle(90, false, '12')).toBe(3);
    expect(hourFromAngle(0, false, '24')).toBe(12);
    expect(hourFromAngle(0, true, '24')).toBe(0);
    expect(minuteFromAngle(0, false)).toBe(0);
    expect(minuteFromAngle(30, true)).toBe(5);
    expect(minuteFromAngle(33, false)).toBe(6);
  });

  it('computes angle from pointer', () => {
    const rect = { left: 0, top: 0, width: 100, height: 100 } as DOMRect;
    expect(angleFromPointer(50, 0, rect)).toBeCloseTo(0, 0); /* 12 o'clock */
    expect(angleFromPointer(100, 50, rect)).toBeCloseTo(90, 0); /* 3 o'clock */
  });

  it('resolves format=auto from locale', () => {
    expect(resolveFormat('12')).toBe('12');
    expect(resolveFormat('24')).toBe('24');
    expect(['12', '24']).toContain(resolveFormat('auto', 'en-US'));
  });

  it('snaps minutes/seconds to step', () => {
    expect(snapToStep(7, 5)).toBe(5);
    expect(snapToStep(8, 5)).toBe(10);
    expect(snapToStep(58, 15)).toBe(0);
    expect(snapToStep(14, 1)).toBe(14);
  });

  it('resolves locale period labels', () => {
    const en = periodLabels('en-US');
    expect(en.am.toLowerCase()).toContain('am');
    expect(en.pm.toLowerCase()).toContain('pm');
  });

  it('blocks times via isTimeBlocked', () => {
    expect(
      isTimeBlocked(9, 0, 0, { hour: 10, minute: 0, second: 0 }, null, null),
    ).toBe(true);
    expect(isTimeBlocked(11, 0, 0, null, null, null)).toBe(false);
  });

  it('resolves layout / ui mode helpers', () => {
    expect(resolveUiMode('auto')).toBe('dial');
    expect(resolveUiMode('input')).toBe('input');
    expect(resolveVariant('auto', true)).toBe('modal');
    expect(resolveVariant('auto', false)).toBe('docked');
    expect(resolveOrientation('auto', true)).toBe('vertical');
    expect(resolveOrientation('horizontal', true)).toBe('horizontal');
  });

  it('applies period and advances view', () => {
    expect(applyPeriod(null, 'am')).toBe(0);
    expect(applyPeriod(null, 'pm')).toBe(12);
    expect(applyPeriod(3, 'pm')).toBe(15);
    expect(applyPeriod(15, 'am')).toBe(3);
    expect(nextView('hour', 'hour', false)).toBe('minute');
    expect(nextView('minute', 'minute', true)).toBe('second');
    expect(nextView('minute', 'minute', false)).toBe('minute');
  });

  it('builds draft detail and stepped ranges', () => {
    expect(pad2(5)).toBe('05');
    expect(draftToDetail({ hour: null, minute: null, second: 0 }, false)).toEqual({
      value: '',
      hour: null,
      minute: null,
      second: 0,
    });
    expect(draftToDetail({ hour: 9, minute: 5, second: 0 }, false)).toEqual({
      value: '09:05',
      hour: 9,
      minute: 5,
      second: 0,
    });
    expect(steppedRange(15)).toEqual([0, 15, 30, 45]);
    expect(steppedRange(10, (n) => n !== 20)).toEqual([0, 10, 30, 40, 50]);
  });
});

describe('time-picker docked position', () => {
  it('prefers below when space allows', () => {
    const r = computeDockedPosition(
      { top: 100, bottom: 140, left: 50, right: 250, width: 200, height: 40 } as DOMRect,
      { width: 364, height: 200 },
      { width: 800, height: 600 },
    );
    expect(r.flip).toBe('bottom');
    expect(r.top).toBe(148); /* 140 + 8 */
  });

  it('flips above when below is tight', () => {
    const r = computeDockedPosition(
      { top: 500, bottom: 540, left: 50, right: 250, width: 200, height: 40 } as DOMRect,
      { width: 364, height: 200 },
      { width: 800, height: 600 },
    );
    expect(r.flip).toBe('top');
    expect(r.top).toBeLessThan(500);
  });
});
