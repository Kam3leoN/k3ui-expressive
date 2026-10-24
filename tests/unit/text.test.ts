import { describe, expect, it } from 'vitest';
import { normalizeLabel } from '../../src/core/text.js';

describe('normalizeLabel', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeLabel('  hello   world\n')).toBe('hello world');
    expect(normalizeLabel('\t')).toBe('');
  });
});
