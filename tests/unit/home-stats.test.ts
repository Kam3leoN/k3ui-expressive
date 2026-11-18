import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalog as k3uiCatalog } from '../../src/registry/catalog.js';
import { catalog as k3uxCatalog } from '../../../k3ux/src/registry/catalog.js';
import { MATERIAL_SHAPE_NAMES } from '../../src/shapes/index.js';
import {
  buildHomeStatDefs,
  mountHomeStats,
  pickRandomShape,
  resolveHomeStatCounts,
  syncHomeStatsI18n,
} from '../../playground/home-stats/mount.js';

describe('home-stats', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-k3-reduce-motion');
    vi.unstubAllGlobals();
  });

  it('resolveHomeStatCounts matches both catalogs', async () => {
    const counts = await resolveHomeStatCounts();
    expect(counts.k3ui).toBe(k3uiCatalog.length);
    expect(counts.k3ux).toBe(k3uxCatalog.length);
  });

  it('buildHomeStatDefs uses Trainable-style Material shapes', () => {
    const defs = buildHomeStatDefs({ k3ui: 94, k3ux: 24 });
    expect(defs.map((d) => d.shape)).toEqual([
      'VerySunny',
      'Cookie4Sided',
      'Pill',
      'SoftBurst',
    ]);
  });

  it('pickRandomShape never returns the excluded shape', () => {
    for (const name of MATERIAL_SHAPE_NAMES.slice(0, 8)) {
      for (let i = 0; i < 20; i++) {
        expect(pickRandomShape(name)).not.toBe(name);
      }
    }
  });

  it('mountHomeStats injects four shape stats', async () => {
    document.documentElement.setAttribute('data-k3-reduce-motion', '');
    document.body.innerHTML = `
      <section id="home-stats">
        <h2 id="home-stats-title" class="visually-hidden">K3ui in numbers</h2>
      </section>`;
    await mountHomeStats();
    const host = document.getElementById('home-stats')!;
    expect(host.querySelectorAll('.home-stat')).toHaveLength(4);
    expect(host.querySelector('[data-shape="VerySunny"]')).toBeTruthy();
    expect(host.querySelector('[data-stat="k3ui"] .home-stat__value')?.textContent).toBe(
      String(k3uiCatalog.length),
    );
  });

  it('syncHomeStatsI18n refreshes free copy', async () => {
    document.documentElement.setAttribute('data-k3-reduce-motion', '');
    document.body.innerHTML = `<section id="home-stats"></section>`;
    vi.stubGlobal('K3UI', {
      i18n: {
        t: (key: string) =>
          ({
            'playground.home.stats.title': 'K3ui in numbers',
            'playground.home.stats.k3ui': 'K3ui components',
            'playground.home.stats.k3ux': 'K3ux components & animations',
            'playground.home.stats.openSource': 'Open source',
            'playground.home.stats.openSourceLabel': 'MIT license',
            'playground.home.stats.free': '100% free No ads',
            'playground.home.stats.freeLabel': 'Forever',
          })[key] ?? key,
      },
    });
    await mountHomeStats();
    vi.stubGlobal('K3UI', {
      i18n: {
        t: (key: string) =>
          ({
            'playground.home.stats.title': 'K3ui en chiffres',
            'playground.home.stats.k3ui': 'Composants K3ui',
            'playground.home.stats.k3ux': 'Composants & animations K3ux',
            'playground.home.stats.openSource': 'Open source',
            'playground.home.stats.openSourceLabel': 'Licence MIT',
            'playground.home.stats.free': '100% gratuit No ADS',
            'playground.home.stats.freeLabel': 'Pour toujours',
          })[key] ?? key,
      },
    });
    syncHomeStatsI18n();
    expect(document.querySelector('[data-stat="free"] .home-stat__label')?.textContent).toBe(
      'Pour toujours',
    );
    const freeLines = [...document.querySelectorAll('[data-stat="free"] .home-stat__line')].map(
      (el) => el.textContent?.trim(),
    );
    expect(freeLines).toEqual(['100%', 'gratuit', 'No ADS']);
  });
});
