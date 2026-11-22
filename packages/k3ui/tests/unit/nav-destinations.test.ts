import { describe, expect, it } from 'vitest';
import {
  NAV_DESTINATIONS,
  START_HUB_PAGES,
  destinationForPage,
  isStartHubPage,
  navDestinationsForProduct,
} from '../../playground/nav-destinations.js';

describe('nav destinations — unified catalog', () => {
  it('keeps Pack off the primary rail (hub leaf only)', () => {
    expect(NAV_DESTINATIONS.find((d) => d.id === 'pack')).toBeUndefined();
    expect(START_HUB_PAGES.some((p) => p.id === 'pack')).toBe(true);
    expect(navDestinationsForProduct('k3ui').map((d) => d.id)).not.toContain('pack');
    expect(navDestinationsForProduct('k3ux').map((d) => d.id)).not.toContain('pack');
  });

  it('lists five primary destinations (M3 nav-bar max)', () => {
    const ids = ['quick-start', 'components', 'utilities', 'animations', 'styles'];
    expect(navDestinationsForProduct('k3ui').map((d) => d.id)).toEqual(ids);
    expect(navDestinationsForProduct('k3ux').map((d) => d.id)).toEqual(ids);
    expect(navDestinationsForProduct().map((d) => d.id)).toEqual(ids);
    expect(NAV_DESTINATIONS.find((d) => d.id === 'quick-start')?.href).toBe('');
  });

  it('exposes Démarrage hub leaves: Accueil · Quick Start · Pack · Showcase · Symbols · Sponsors', () => {
    expect(START_HUB_PAGES.map((p) => p.id)).toEqual([
      'home',
      'quick-start',
      'pack',
      'showcase',
      'material-symbols',
      'sponsors',
    ]);
    expect(START_HUB_PAGES.find((p) => p.id === 'showcase')?.dividerBefore).toBe(true);
    expect(isStartHubPage('home')).toBe(false);
    /* Accueil leaf matches pageId home even when URL was historically `#/`. */
    expect(START_HUB_PAGES[0]?.id).toBe('home');
  });

  it('highlights Démarrage for hub pages (pack · showcase · sponsors · symbols)', () => {
    expect(destinationForPage('pack', () => undefined)?.id).toBe('quick-start');
    expect(destinationForPage('showcase', () => undefined)?.id).toBe('quick-start');
    expect(destinationForPage('showcase-pricing', () => undefined)?.id).toBe('quick-start');
    expect(destinationForPage('sponsors', () => undefined)?.id).toBe('quick-start');
    expect(destinationForPage('material-symbols', () => undefined)?.id).toBe('quick-start');
    expect(isStartHubPage('sponsors')).toBe(true);
    expect(isStartHubPage('buttons')).toBe(false);
  });
});
