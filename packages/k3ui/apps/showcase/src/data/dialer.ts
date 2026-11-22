/**
 * T9 dialer demo data — contact set & combos inspired by the public
 * Rivo playground (https://rivophone.pages.dev/).
 */

import avatarSophia from '../assets/dialer/sophia.jpg';
import avatarAlex from '../assets/dialer/alex.jpg';
import avatarEmma from '../assets/dialer/emma.jpg';
import avatarLiam from '../assets/dialer/liam.jpg';
import avatarAva from '../assets/dialer/ava.jpg';
import avatarBenjamin from '../assets/dialer/benjamin.jpg';

export type DialContactShape =
  | 'Cookie12Sided'
  | 'Cookie9Sided'
  | 'Flower'
  | 'Sunny'
  | 'Pill'
  | 'Gem'
  | 'Pentagon';

export interface DialContactRow {
  id: string;
  name: string;
  phone: string;
  /** Digits only for number matching. */
  phoneDigits: string;
  /** Accent hue for avatar (CSS color). */
  accent: string;
  shape: DialContactShape;
  /** Portrait URL (Vite-bundled). */
  avatar: string;
}

export const T9_LETTER_MAP: Readonly<Record<string, string>> = {
  '2': 'abc',
  '3': 'def',
  '4': 'ghi',
  '5': 'jkl',
  '6': 'mno',
  '7': 'pqrs',
  '8': 'tuv',
  '9': 'wxyz',
};

export interface DialKey {
  digit: string;
  letters: string;
}

/** Standard phone pad order (left→right, top→bottom). */
export const DIAL_KEYS: readonly DialKey[] = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: ',' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: ';' },
] as const;

export const DIAL_CONTACTS: readonly DialContactRow[] = [
  {
    id: 'sophia',
    name: 'Sophia Martinez',
    phone: '+1 (212) 555-0198',
    phoneDigits: '12125550198',
    accent: '#4F6BED',
    shape: 'Cookie12Sided',
    avatar: avatarSophia,
  },
  {
    id: 'alex',
    name: 'Alex Morgan',
    phone: '+1 (415) 555-0142',
    phoneDigits: '14155550142',
    accent: '#00897B',
    shape: 'Sunny',
    avatar: avatarAlex,
  },
  {
    id: 'emma',
    name: 'Emma Watson',
    phone: '+1 (312) 555-0177',
    phoneDigits: '13125550177',
    accent: '#8E24AA',
    shape: 'Flower',
    avatar: avatarEmma,
  },
  {
    id: 'liam',
    name: 'Liam Chen',
    phone: '+1 (650) 555-0123',
    phoneDigits: '16505550123',
    accent: '#EF6C00',
    shape: 'Gem',
    avatar: avatarLiam,
  },
  {
    id: 'ava',
    name: 'Ava Johnson',
    phone: '+1 (415) 555-0189',
    phoneDigits: '14155550189',
    accent: '#C62828',
    shape: 'Pill',
    avatar: avatarAva,
  },
  {
    id: 'benjamin',
    name: 'Benjamin Clark',
    phone: '+1 (555) 016-3351',
    phoneDigits: '15550163351',
    accent: '#1565C0',
    shape: 'Pentagon',
    avatar: avatarBenjamin,
  },
] as const;

export interface T9Combo {
  digits: string;
  hintName: string;
}

export const T9_COMBOS: readonly T9Combo[] = [
  { digits: '7674', hintName: 'Sophia' },
  { digits: '2539', hintName: 'Alex' },
  { digits: '3662', hintName: 'Emma' },
  { digits: '5426', hintName: 'Liam' },
] as const;

export function lettersToDigit(ch: string): string {
  const c = ch.toLowerCase();
  for (const [digit, letters] of Object.entries(T9_LETTER_MAP)) {
    if (letters.includes(c)) return digit;
  }
  return '';
}

/** Map A–Z letters in a name to their T9 digit string. */
export function nameToT9(name: string): string {
  let out = '';
  for (const ch of name) {
    const d = lettersToDigit(ch);
    if (d) out += d;
  }
  return out;
}

export function normalizeDialQuery(raw: string): string {
  return raw.replace(/[^\d*#]/g, '');
}

/**
 * Match contacts by phone digits and/or T9 name sequence
 * (same idea as Rivo’s live playground).
 */
export function filterContactsByT9(
  query: string,
  contacts: readonly DialContactRow[] = DIAL_CONTACTS,
): DialContactRow[] {
  const q = normalizeDialQuery(query);
  if (!q) return [...contacts];

  const digitOnly = q.replace(/[^\d]/g, '');

  return contacts.filter((c) => {
    if (digitOnly && c.phoneDigits.includes(digitOnly)) return true;
    if (!digitOnly) return false;
    const full = nameToT9(c.name);
    if (full.startsWith(digitOnly) || full.includes(digitOnly)) return true;
    for (const part of c.name.split(/\s+/)) {
      const pt = nameToT9(part);
      if (pt.startsWith(digitOnly) || pt.includes(digitOnly)) return true;
    }
    return false;
  });
}

/** Highlight the T9-matched prefix of a name when possible. */
export function splitT9Highlight(
  name: string,
  query: string,
): { head: string; rest: string } | null {
  const q = normalizeDialQuery(query).replace(/[^\d]/g, '');
  if (!q) return null;
  const letters = name.replace(/[^A-Za-z]/g, '');
  if (letters.length < q.length) return null;
  const prefix = letters.slice(0, q.length);
  if (nameToT9(prefix) !== q) return null;
  /* Map letter prefix back onto the original name (keep spaces). */
  let taken = 0;
  let end = 0;
  for (let i = 0; i < name.length && taken < q.length; i++) {
    if (/[A-Za-z]/.test(name[i]!)) taken++;
    end = i + 1;
  }
  return { head: name.slice(0, end), rest: name.slice(end) };
}
