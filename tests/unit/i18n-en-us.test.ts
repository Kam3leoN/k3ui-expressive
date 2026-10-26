import { describe, expect, it, afterEach } from 'vitest';
import { i18n } from '../../src/i18n/index.js';

describe('i18n.enUs', () => {
  afterEach(() => {
    i18n.setLocale('en');
  });

  it('returns undefined when locale is English', () => {
    i18n.setLocale('en');
    expect(i18n.enUs('doc.tooltip.title')).toBeUndefined();
  });

  it('returns en-US when FR differs', () => {
    i18n.setLocale('fr');
    expect(i18n.t('doc.tooltip.title')).toBe('Infobulle');
    expect(i18n.enUs('doc.tooltip.title')).toBe('Tooltip');
  });

  it('skips when FR equals EN (no redundant L2)', () => {
    i18n.setLocale('fr');
    expect(i18n.enUs('doc.badge.title')).toBeUndefined();
    expect(i18n.enUs('doc.fab.title')).toBeUndefined();
    expect(i18n.enUs('doc.nav.navigation')).toBeUndefined();
  });
});
