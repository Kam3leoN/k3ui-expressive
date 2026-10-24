export type MoodId =
  | 'special'
  | 'excellent'
  | 'good'
  | 'above'
  | 'average'
  | 'below'
  | 'bad'
  | 'awful';

export interface MoodMeta {
  id: MoodId;
  label: string;
  /** Stable hex fill (not a CSS role — independent of theme.apply). */
  color: string;
}

export interface MoodEntry {
  /** YYYY-MM-DD */
  date: string;
  mood: MoodId;
  /** Material Symbols ligature */
  icon?: string;
  title?: string;
  body?: string;
  weather?: string;
}

export const MOOD_ORDER: readonly MoodId[] = [
  'special',
  'excellent',
  'good',
  'above',
  'average',
  'below',
  'bad',
  'awful',
] as const;

/** Default 8-mood legend (Dartegnian palette). */
export const DEFAULT_MOOD_LEGEND: readonly MoodMeta[] = [
  { id: 'special', label: 'Special', color: '#e91e63' },
  { id: 'excellent', label: 'Excellent', color: '#7c4dff' },
  { id: 'good', label: 'Good', color: '#2196f3' },
  { id: 'above', label: 'Above Average', color: '#26a69a' },
  { id: 'average', label: 'Average', color: '#9e9e9e' },
  { id: 'below', label: 'Below Average', color: '#ffb300' },
  { id: 'bad', label: 'Bad', color: '#ff7043' },
  { id: 'awful', label: 'Awful', color: '#5d4037' },
] as const;

/** Current year + previous year (n−1). */
export function defaultMoodYears(now = new Date()): number[] {
  const y = now.getFullYear();
  return [y - 1, y];
}

/** @deprecated Prefer {@link defaultMoodYears} — kept as snapshot for callers that need a const. */
export const DEFAULT_MOOD_YEARS = defaultMoodYears();

export const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;
