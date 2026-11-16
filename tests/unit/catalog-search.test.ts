import { describe, expect, it } from 'vitest';
import {
  catalogEntryMatches,
  catalogEntryProduct,
  catalogSearchHits,
  normalizeCatalogQuery,
  setDocProduct,
  stemCatalogQuery,
  type DocComponent,
} from '../../playground/catalog.js';

const t = (key: string) => {
  const map: Record<string, string> = {
    'doc.card.title': 'Cartes',
    'doc.card.blurb': 'Filled · outlined',
    'doc.card-holo.title': 'Carte holographique',
    'doc.card-holo.blurb': 'Effet carte holo',
    'doc.card-scratch.title': 'Carte à gratter',
    'doc.card-scratch.blurb': 'Scratch card',
    'doc.list.title': 'Lists',
    'doc.list.blurb': 'M3 Expressive list',
  };
  return map[key] ?? key;
};

describe('catalog search', () => {
  it('normalizes accents and stems FR plurals', () => {
    expect(normalizeCatalogQuery('Cartés')).toBe('cartes');
    expect(stemCatalogQuery('cartes')).toBe('carte');
  });

  it('matches cartes → carte holographique', () => {
    const c: DocComponent = {
      id: 'card-holo',
      category: 'Containment',
      title: 'Holo card',
      titleKey: 'doc.card-holo.title',
      blurbKey: 'doc.card-holo.blurb',
      product: 'k3ux',
    };
    expect(catalogEntryMatches(c, 'Containment', 'cartes', t)).toBe(true);
    expect(catalogEntryMatches(c, 'Containment', 'xyzzy', t)).toBe(false);
  });

  it('returns hits for list query', () => {
    const hits = catalogSearchHits(t, 'list', 5);
    expect(hits.some((h) => h.id === 'list' || h.id.includes('list'))).toBe(true);
  });

  it('searches both packs so cartes includes k3ui Cards + k3ux holo', () => {
    setDocProduct('k3ui');
    const hits = catalogSearchHits(t, 'cartes', 20, 'all');
    expect(hits.some((h) => h.id === 'card' && catalogEntryProduct(h) === 'k3ui')).toBe(true);
    expect(hits.some((h) => h.id === 'card-holo' && catalogEntryProduct(h) === 'k3ux')).toBe(
      true,
    );
    /* Active pack first */
    const firstPack = catalogEntryProduct(hits[0]!);
    expect(firstPack).toBe('k3ui');
  });
});
