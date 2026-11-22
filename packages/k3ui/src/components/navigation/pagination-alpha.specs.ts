export type PaginationAlphaSize = 'sm' | 'md' | 'lg';
export type PaginationAlphaOrientation = 'horizontal' | 'vertical';

export const PaginationAlphaSpecs = {
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  defaultActiveLetter: 'A' as string,
  defaultSize: 'md' as PaginationAlphaSize,
  defaultOrientation: 'horizontal' as PaginationAlphaOrientation,
  showCount: false as boolean,
  showDisabled: true as boolean,
};

/** Count items per letter (first character, A–Z only). */
export function buildLetterCounts(items: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const letter of PaginationAlphaSpecs.alphabet) {
    map[letter] = 0;
  }
  for (const raw of items) {
    const first = raw.trim().charAt(0).toUpperCase();
    if (PaginationAlphaSpecs.alphabet.includes(first)) {
      map[first] += 1;
    }
  }
  return map;
}
