import { describe, expect, it } from 'vitest';
import en from '../../src/i18n/locales/en.json';
import fr from '../../src/i18n/locales/fr.json';

function docKeys(dict: Record<string, string>): string[] {
  return Object.keys(dict).filter((key) => key.startsWith('doc.'));
}

describe('library locale catalogs', () => {
  it('en.json has no doc.* keys (playground owns doc strings)', () => {
    expect(docKeys(en)).toEqual([]);
  });

  it('fr.json has no doc.* keys (playground owns doc strings)', () => {
    expect(docKeys(fr)).toEqual([]);
  });
});