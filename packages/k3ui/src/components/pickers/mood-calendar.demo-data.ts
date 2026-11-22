import {
  DEFAULT_MOOD_LEGEND,
  MOOD_ORDER,
  type MoodEntry,
  type MoodId,
  type MoodMeta,
} from './mood-calendar.types.js';

const ICONS = [
  'flare',
  'music_note',
  'directions_walk',
  'inbox',
  'directions_car',
  'monitor',
  'two_wheeler',
  'restaurant',
  'laptop_mac',
  'local_cafe',
  'beach_access',
  'flight_takeoff',
  'menu_book',
  'sports_esports',
  'code',
  'pets',
  'sunny',
  'rainy',
  'celebration',
  'train',
] as const;

const SNIPPETS = [
  'Quiet morning, loud ideas.',
  'Shipped a small fix that felt huge.',
  'Coffee, commits, and a long walk.',
  'Nothing noteworthy — and that was fine.',
  'Playlist on repeat while cleaning the desk.',
  'Called a friend, laughed too hard.',
  'Debugged until the lights came on.',
  'Tried a new café; matcha was excellent.',
  'Rainy window, soft focus.',
  'Game night with the usual crew.',
] as const;

function hash(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

function todayKeyLocal(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function formatTitle(iso: string, locale = 'en-US'): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  return dt.toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Deterministic fictional journal for a calendar year (past days only). */
export function generateDemoYear(year: number, locale = 'en-US'): MoodEntry[] {
  const entries: MoodEntry[] = [];
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const todayKey = todayKeyLocal();

  for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const key = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (key > todayKey) continue;

    const h = hash(y * 10000 + m * 100 + day);
    const mood = MOOD_ORDER[h % MOOD_ORDER.length]!;
    const icon = ICONS[h % ICONS.length]!;
    const body = SNIPPETS[h % SNIPPETS.length]!;
    const temp = 12 + (h % 22);
    const weather =
      h % 5 === 0
        ? `rainy ${temp}.0°C Light Rain`
        : h % 3 === 0
          ? `sunny ${temp}.0°C Clear`
          : undefined;

    entries.push({
      date: key,
      mood,
      icon,
      title: formatTitle(key, locale),
      body,
      weather,
    });
  }
  return entries;
}

export function weekdayShort(iso: string, locale = 'en-US'): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  return dt.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' });
}

export function countByMood(
  entries: readonly MoodEntry[],
  legend: readonly MoodMeta[] = DEFAULT_MOOD_LEGEND,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of legend) out[m.id] = 0;
  for (const e of entries) {
    if (out[e.mood] === undefined) out[e.mood] = 0;
    out[e.mood]!++;
  }
  return out;
}

export function moodColor(
  id: MoodId | string,
  legend: readonly MoodMeta[] = DEFAULT_MOOD_LEGEND,
): string {
  return legend.find((m) => m.id === id)?.color ?? '#9e9e9e';
}

export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}
