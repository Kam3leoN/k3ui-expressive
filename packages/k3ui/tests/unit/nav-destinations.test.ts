import { describe, expect, it } from 'vitest';
import {
  NAV_DESTINATIONS,
  destinationForPage,
  navDestinationsForProduct,
} from '../../playground/nav-destinations.js';

describe('nav destinations — pack via Démarrage', () => {
  it('keeps Pack off the primary rail', () => {
    expect(NAV_DESTINATIONS.find((d) => d.id === 'pack')).toBeUndefined();
    expect(navDestinationsForProduct('k3ui').map((d) => d.id)).not.toContain('pack');
    expect(navDestinationsForProduct('k3ux').map((d) => d.id)).not.toContain('pack');
  });

  it('lists Démarrage on both product rails', () => {
    expect(navDestinationsForProduct('k3ui').map((d) => d.id)).toEqual([
      'quick-start',
      'components',
      'utilities',
      'styles',
    ]);
    expect(navDestinationsForProduct('k3ux').map((d) => d.id)).toEqual([
      'quick-start',
      'components',
      'animations',
      'resources',
    ]);
  });

  it('highlights Démarrage while on the Pack page', () => {
    const dest = destinationForPage('pack', () => undefined);
    expect(dest?.id).toBe('quick-start');
  });
});
