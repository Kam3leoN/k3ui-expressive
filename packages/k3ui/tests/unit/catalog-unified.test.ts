import { describe, expect, it } from 'vitest';
import {
  catalogEntryProduct,
  componentsInCategory,
  findComponent,
  orderedComponents,
} from '../../playground/catalog.js';

describe('unified docs catalog', () => {
  it('exposes both k3ui and k3ux entries in the same ordered list', () => {
    const ids = orderedComponents().map((c) => c.id);
    expect(ids).toContain('buttons');
    expect(ids).toContain('confetti');
    expect(ids.indexOf('buttons')).toBeLessThan(ids.indexOf('confetti'));
  });

  it('findComponent resolves k3ux pages without a product switch', () => {
    const holo = findComponent('card-holo');
    expect(holo).toBeDefined();
    expect(catalogEntryProduct(holo!)).toBe('k3ux');
  });

  it('Animation category includes k3ux components', () => {
    const anim = componentsInCategory('Animation').map((c) => c.id);
    expect(anim).toContain('confetti');
    expect(anim).toContain('parallax');
  });
});
