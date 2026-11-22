import { describe, expect, it } from 'vitest';
import {
  NAV_DESTINATIONS,
  destinationForPage,
  navDestinationsForProduct,
} from '../../playground/nav-destinations.js';

describe('nav destinations — unified catalog', () => {
  it('keeps Pack off the primary rail', () => {
    expect(NAV_DESTINATIONS.find((d) => d.id === 'pack')).toBeUndefined();
    expect(navDestinationsForProduct('k3ui').map((d) => d.id)).not.toContain('pack');
    expect(navDestinationsForProduct('k3ux').map((d) => d.id)).not.toContain('pack');
  });

  it('lists the full rail for both legacy product args', () => {
    const ids = [
      'quick-start',
      'components',
      'utilities',
      'animations',
      'styles',
      'showcase',
      'resources',
    ];
    expect(navDestinationsForProduct('k3ui').map((d) => d.id)).toEqual(ids);
    expect(navDestinationsForProduct('k3ux').map((d) => d.id)).toEqual(ids);
    expect(navDestinationsForProduct().map((d) => d.id)).toEqual(ids);
  });

  it('highlights Démarrage while on the Pack page', () => {
    const dest = destinationForPage('pack', () => undefined);
    expect(dest?.id).toBe('quick-start');
  });
});
