/**
 * Label / display-text normalization — chips, button-group, snackbar, DnD ghost.
 */

/** Trim + collapse internal whitespace to single spaces. */
export function normalizeLabel(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}