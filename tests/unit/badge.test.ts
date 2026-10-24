import { describe, expect, it } from 'vitest';
import { BADGE_DEFAULT_MAX, formatBadgeLabel } from '../../src/components/feedback/badge.js';

describe('formatBadgeLabel', () => {
  it('returns empty for blank', () => {
    expect(formatBadgeLabel('')).toBe('');
    expect(formatBadgeLabel('   ')).toBe('');
  });

  it('keeps small counts as-is', () => {
    expect(formatBadgeLabel(1)).toBe('1');
    expect(formatBadgeLabel('99')).toBe('99');
    expect(formatBadgeLabel(999)).toBe('999');
  });

  it('caps numeric above max as {max}+', () => {
    expect(formatBadgeLabel(1000)).toBe('999+');
    expect(formatBadgeLabel(1200)).toBe(`${BADGE_DEFAULT_MAX}+`);
    expect(formatBadgeLabel(50, 9)).toBe('9+');
  });

  it('truncates non-numeric labels to 4 characters', () => {
    expect(formatBadgeLabel('NEW')).toBe('NEW');
    expect(formatBadgeLabel('ALERT')).toBe('ALE+');
  });
});
