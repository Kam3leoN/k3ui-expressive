/**
 * Shared reminders for calendar widgets (month marks · week dots · agenda list).
 */

export interface Reminder {
  id: string;
  year: number;
  /** 0–11 */
  month: number;
  day: number;
  hour: number;
  minute: number;
  name: string;
  repeat?: '' | 'daily' | 'weekdays' | 'weekly';
}

export interface Upcoming {
  item: Reminder;
  at: Date;
}

function dayStart(y: number, m: number, d: number): Date {
  return new Date(y, m, d, 0, 0, 0, 0);
}

export function occursOn(r: Reminder, y: number, m: number, d: number): boolean {
  const day = dayStart(y, m, d);
  const start = dayStart(r.year, r.month, r.day);
  if (day < start) return false;
  switch (r.repeat || '') {
    case 'daily':
      return true;
    case 'weekdays': {
      const wd = day.getDay();
      return wd !== 0 && wd !== 6;
    }
    case 'weekly':
      return day.getDay() === start.getDay();
    default:
      return day.getTime() === start.getTime();
  }
}

export function hasOn(items: readonly Reminder[], y: number, m: number, d: number): boolean {
  return items.some((r) => occursOn(r, y, m, d));
}

export function forDay(
  items: readonly Reminder[],
  y: number,
  m: number,
  d: number,
): Reminder[] {
  return items
    .filter((r) => occursOn(r, y, m, d))
    .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
}

function nextAt(r: Reminder, from: Date): Date | null {
  if (!r.repeat) {
    const at = new Date(r.year, r.month, r.day, r.hour, r.minute, 0, 0);
    return at >= from ? at : null;
  }
  const fromDay = dayStart(from.getFullYear(), from.getMonth(), from.getDate());
  const startDay = dayStart(r.year, r.month, r.day);
  const probe = new Date(startDay > fromDay ? startDay : fromDay);
  for (let i = 0; i < 8; i++) {
    if (occursOn(r, probe.getFullYear(), probe.getMonth(), probe.getDate())) {
      const a = new Date(
        probe.getFullYear(),
        probe.getMonth(),
        probe.getDate(),
        r.hour,
        r.minute,
        0,
        0,
      );
      if (a >= from) return a;
    }
    probe.setDate(probe.getDate() + 1);
  }
  return null;
}

export function upcoming(items: readonly Reminder[], limit = 8, now = new Date()): Upcoming[] {
  const out: Upcoming[] = [];
  for (const item of items) {
    const at = nextAt(item, now);
    if (at) out.push({ item, at });
  }
  out.sort((a, b) => a.at.getTime() - b.at.getTime());
  return out.slice(0, limit);
}

/** 12h clock label like the reference widgets. */
export function timeText(r: Reminder, locale = 'en'): string {
  const d = new Date(2000, 0, 1, r.hour, r.minute);
  return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

/** Demo reminders — always a few upcoming relative to “now”. */
export function demoReminders(now = new Date()): Reminder[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const inDays = (n: number): Date => new Date(y, m, d + n);
  const a = inDays(13);
  const b = inDays(65);
  return [
    {
      id: 'demo-bday',
      year: a.getFullYear(),
      month: a.getMonth(),
      day: a.getDate(),
      hour: 9,
      minute: 0,
      name: "Audreyana's birthday",
    },
    {
      id: 'demo-meetup',
      year: b.getFullYear(),
      month: b.getMonth(),
      day: b.getDate(),
      hour: 9,
      minute: 0,
      name: 'Design sync',
    },
    {
      id: 'demo-standup',
      year: y,
      month: m,
      day: d,
      hour: 10,
      minute: 30,
      name: 'Stand-up',
      repeat: 'weekdays',
    },
  ];
}
