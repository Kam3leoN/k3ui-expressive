import type {
  TimeDraft,
  TimeParts,
  TimePickerFormat,
  TimePickerMode,
  TimePickerOrientation,
  TimePickerPeriod,
  TimePickerResolvedOrientation,
  TimePickerUiMode,
  TimePickerValueDetail,
  TimePickerView,
} from './time-picker.types.js';

/** Parse "8:15 AM", "17:30", "17:30:45", or ISO datetime → `TimeParts` or null. */
export function parseTimeToParts(raw: string | null | undefined): TimeParts | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();

  const iso = s.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/,
  );
  if (iso) {
    if (iso[4] == null) return null;
    return {
      hour: Number(iso[4]),
      minute: Number(iso[5] ?? 0),
      second: Number(iso[6] ?? 0),
    };
  }

  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?$/);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const second = Number(m[3] ?? 0);
  const period = m[4]?.toLowerCase() as TimePickerPeriod | undefined;
  if (minute > 59 || second > 59) return null;
  if (period) {
    if (hour < 1 || hour > 12) return null;
    if (period === 'am') hour = hour === 12 ? 0 : hour;
    else hour = hour === 12 ? 12 : hour + 12;
  } else if (hour > 23) {
    return null;
  }
  return { hour, minute, second };
}

export function partsToValue(p: TimeParts, showSeconds: boolean): string {
  const hh = pad2(p.hour);
  const mm = pad2(p.minute);
  if (!showSeconds) return `${hh}:${mm}`;
  return `${hh}:${mm}:${pad2(p.second)}`;
}

/** Seconds since midnight — for min/max / blackout compare. */
export function partsToDaySeconds(p: TimeParts): number {
  return p.hour * 3600 + p.minute * 60 + p.second;
}

export function clampParts(
  p: TimeParts,
  min?: TimeParts | null,
  max?: TimeParts | null,
): TimeParts {
  let t = { ...p };
  if (min && partsToDaySeconds(t) < partsToDaySeconds(min)) t = { ...min };
  if (max && partsToDaySeconds(t) > partsToDaySeconds(max)) t = { ...max };
  return t;
}

export function isPartsDisabled(
  p: TimeParts,
  min?: TimeParts | null,
  max?: TimeParts | null,
  blackout?: ((t: TimeParts) => boolean) | null,
): boolean {
  const m = partsToDaySeconds(p);
  if (min && m < partsToDaySeconds(min)) return true;
  if (max && m > partsToDaySeconds(max)) return true;
  if (blackout?.(p)) return true;
  return false;
}

export function isTimeBlocked(
  hour: number,
  minute: number,
  second: number,
  min?: TimeParts | null,
  max?: TimeParts | null,
  blackout?: ((t: TimeParts) => boolean) | null,
): boolean {
  return isPartsDisabled({ hour, minute, second }, min, max, blackout);
}

export function displayHour(hour24: number | null, format: '12' | '24'): number | null {
  if (hour24 == null) return null;
  if (format === '24') return hour24;
  const h = hour24 % 12;
  return h === 0 ? 12 : h;
}

export function periodOf(hour24: number | null): TimePickerPeriod {
  if (hour24 == null) return 'am';
  return hour24 < 12 ? 'am' : 'pm';
}

/** Apply AM/PM to a 24h hour (null → seed 0 / 12). */
export function applyPeriod(hour24: number | null, period: TimePickerPeriod): number {
  if (hour24 == null) return period === 'pm' ? 12 : 0;
  let h = hour24;
  if (period === 'am' && h >= 12) h -= 12;
  if (period === 'pm' && h < 12) h += 12;
  return h;
}

/** Empty draft — no pre-filled “now” (M3 / Matraic: incomplete until user picks). */
export function emptyDraft(): TimeDraft {
  return { hour: null, minute: null, second: 0 };
}

export function isDraftComplete(d: TimeDraft): boolean {
  return d.hour != null && d.minute != null;
}

export function draftToParts(d: TimeDraft): TimeParts | null {
  if (d.hour == null || d.minute == null) return null;
  return { hour: d.hour, minute: d.minute, second: d.second };
}

export function draftToDetail(d: TimeDraft, showSeconds: boolean): TimePickerValueDetail {
  const parts = draftToParts(d);
  if (!parts) {
    return { value: '', hour: d.hour, minute: d.minute, second: d.second };
  }
  return {
    value: partsToValue(parts, showSeconds),
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

/** Convert dial/field display hour → 24h storage. */
export function hour24FromDisplay(
  display: number,
  period: TimePickerPeriod,
  format: '12' | '24',
): number {
  if (format === '24') return display === 24 ? 0 : display;
  if (period === 'am') return display === 12 ? 0 : display;
  return display === 12 ? 12 : display + 12;
}

export function resolveFormat(format: TimePickerFormat, locale = 'en'): '12' | '24' {
  if (format === '12' || format === '24') return format;
  try {
    const opts = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions();
    return opts.hourCycle === 'h23' || opts.hourCycle === 'h24' ? '24' : '12';
  } catch {
    return '12';
  }
}

/** `mode` prop → runtime surface (`auto` → dial). */
export function resolveUiMode(mode: TimePickerMode): TimePickerUiMode {
  return mode === 'input' ? 'input' : 'dial';
}

export {
  resolveSurfaceVariant as resolveVariant,
  SURFACE_COMPACT_MQ as TIME_PICKER_COMPACT_MQ,
} from '../../core/surface-variant.js';

export function resolveOrientation(
  orientation: TimePickerOrientation,
  compact: boolean,
): TimePickerResolvedOrientation {
  if (orientation === 'auto') return compact ? 'vertical' : 'horizontal';
  return orientation === 'horizontal' ? 'horizontal' : 'vertical';
}

/** Advance hour → minute → second after a segment is set. */
export function nextView(
  current: TimePickerView,
  changed: 'hour' | 'minute' | 'second',
  showSeconds: boolean,
): TimePickerView {
  if (changed === 'hour' && current === 'hour') return 'minute';
  if (changed === 'minute' && current === 'minute' && showSeconds) return 'second';
  return current;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatSegment(value: number | null): string {
  return value == null ? '' : pad2(value);
}

/** Angle (0° = 12 o'clock, clockwise) from pointer relative to dial center. */
export function angleFromPointer(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): number {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (deg < 0) deg += 360;
  return deg;
}

export function hourFromAngle(angle: number, inner: boolean, format: '12' | '24'): number {
  const slot = Math.round(angle / 30) % 12;
  if (format === '12') return slot;
  if (inner) return slot === 0 ? 0 : slot + 12;
  return slot === 0 ? 12 : slot;
}

export function minuteFromAngle(angle: number, snap5: boolean): number {
  const raw = Math.round(angle / 6) % 60;
  if (!snap5) return raw;
  return (Math.round(raw / 5) * 5) % 60;
}

/** Snap 0–59 to step (default 1). */
export function snapToStep(value: number, step: number): number {
  const s = Math.max(1, Math.floor(step) || 1);
  return (Math.round(value / s) * s) % 60;
}

/** Values 0…59 at `step`, filtered by predicate. */
export function steppedRange(
  step: number,
  accept: (n: number) => boolean = () => true,
): number[] {
  const s = Math.max(1, Math.floor(step) || 1);
  const out: number[] = [];
  for (let n = 0; n < 60; n += s) {
    if (accept(n)) out.push(n);
  }
  return out;
}

/** Locale AM/PM (or equivalent) labels via Intl. */
export function periodLabels(locale = 'en'): { am: string; pm: string } {
  try {
    const fmt = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true });
    const am = fmt.formatToParts(new Date(2000, 0, 1, 9)).find((p) => p.type === 'dayPeriod')?.value;
    const pm = fmt.formatToParts(new Date(2000, 0, 1, 15)).find((p) => p.type === 'dayPeriod')?.value;
    return { am: am || 'AM', pm: pm || 'PM' };
  } catch {
    return { am: 'AM', pm: 'PM' };
  }
}

/** Sync aria on a toggle host (icon-button / button). */
export function syncTriggerAria(
  host: HTMLElement | null | undefined,
  opts: { open: boolean; controls?: string; disabled?: boolean },
): void {
  if (!host) return;
  host.setAttribute('aria-haspopup', 'dialog');
  host.setAttribute('aria-expanded', opts.open ? 'true' : 'false');
  if (opts.controls) host.setAttribute('aria-controls', opts.controls);
  if (opts.disabled) host.setAttribute('aria-disabled', 'true');
  else host.removeAttribute('aria-disabled');
}

export const TOGGLE_HOST_SELECTOR = 'k3-icon-button, k3-button, button';