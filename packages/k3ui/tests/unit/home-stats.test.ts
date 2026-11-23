import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { catalog as k3uiCatalog } from '../../src/registry/catalog.js';
import { HOME_SHAPE_NAMES } from '../../playground/home-shapes.js';
import {
  animateCountUp,
  buildHomeStatDefs,
  mountHomeStats,
  pickRandomShape,
  resolveHomeStatCounts,
  syncHomeStatsI18n,
} from '../../playground/home-stats/mount.js';

/* Optional sibling checkout — see scripts/k3ux-sibling.mjs */
const hasK3ux = existsSync(resolve(__dirname, '../../../k3ux/src/registry/catalog.ts'));

function stubMatchMedia(matchesNarrow: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('600') ? matchesNarrow : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  );
}

describe('home-stats', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-k3-reduce-motion');
    vi.unstubAllGlobals();
  });

  it.skipIf(!hasK3ux)('resolveHomeStatCounts matches both catalogs', async () => {
    const { catalog: k3uxCatalog } = (await import('@k3ux/registry/catalog.js')) as {
      catalog: unknown[];
    };
    const counts = await resolveHomeStatCounts();
    expect(counts.k3ui).toBe(k3uiCatalog.length);
    expect(counts.k3ux).toBe(k3uxCatalog.length);
  });

  it.skipIf(hasK3ux)('resolveHomeStatCounts falls back to 0 without ../k3ux', async () => {
    const counts = await resolveHomeStatCounts();
    expect(counts.k3ui).toBe(k3uiCatalog.length);
    expect(counts.k3ux).toBe(0);
  });

  it('buildHomeStatDefs uses Trainable-style Material shapes + countTo', () => {
    const defs = buildHomeStatDefs({ k3ui: 94, k3ux: 24 });
    expect(defs.map((d) => d.shape)).toEqual([
      'VerySunny',
      'Cookie4Sided',
      'Pill',
      'SoftBurst',
    ]);
    expect(defs[0]?.countTo).toBe(94);
    expect(defs[1]?.countTo).toBe(24);
    expect(defs[2]?.countTo).toBeUndefined();
  });

  it('pickRandomShape stays in the home allowlist and avoids exclude', () => {
    for (const name of HOME_SHAPE_NAMES.slice(0, 8)) {
      for (let i = 0; i < 20; i++) {
        const next = pickRandomShape(name);
        expect(HOME_SHAPE_NAMES).toContain(next);
        expect(next).not.toBe(name);
      }
    }
  });

  it('animateCountUp jumps to target under reduced motion', async () => {
    document.documentElement.setAttribute('data-k3-reduce-motion', '');
    const el = document.createElement('span');
    el.textContent = '0';
    await animateCountUp(el, 42);
    expect(el.textContent).toBe('42');
  });

  it('mountHomeStats injects connected card-set with four spinning stats', async () => {
    document.documentElement.setAttribute('data-k3-reduce-motion', '');
    stubMatchMedia(false);
    document.body.innerHTML = `
      <section id="home-stats">
        <h2 id="home-stats-title" class="visually-hidden">K3ui in numbers</h2>
      </section>`;
    await mountHomeStats();
    const host = document.getElementById('home-stats')!;
    const set = host.querySelector('k3-card-set') as HTMLElement & {
      variant?: string;
      layout?: string;
      columns?: number;
    };
    expect(set).toBeTruthy();
    expect(set.getAttribute('variant') || set.variant).toBe('connected');
    expect(set.getAttribute('layout') || set.layout).toBe('grid');
    expect(set.columns ?? Number(set.getAttribute('columns'))).toBe(4);
    expect(host.querySelectorAll('k3-card.home-stat-card')).toHaveLength(4);
    expect(host.querySelectorAll('.home-stat')).toHaveLength(4);
    expect(host.querySelectorAll('.home-stat__blob')).toHaveLength(4);
    expect(host.querySelectorAll('.home-stat__spin')).toHaveLength(4);
    expect(host.querySelector('.home-stat__blob[data-shape="VerySunny"]')).toBeTruthy();
    /* Value lives in copy — not inside the decorative blob */
    expect(host.querySelector('.home-stat__blob .home-stat__value')).toBeNull();
    expect(host.querySelector('[data-stat="k3ui"] .home-stat__copy .home-stat__value')?.textContent).toBe(
      String(k3uiCatalog.length),
    );
  });

  it('mountHomeStats uses 1 column under 600px', async () => {
    document.documentElement.setAttribute('data-k3-reduce-motion', '');
    stubMatchMedia(true);
    document.body.innerHTML = `<section id="home-stats"></section>`;
    await mountHomeStats();
    const set = document.querySelector('k3-card-set') as HTMLElement & { columns?: number };
    expect(set.columns ?? Number(set.getAttribute('columns'))).toBe(1);
  });

  it('syncHomeStatsI18n refreshes free copy', async () => {
    document.documentElement.setAttribute('data-k3-reduce-motion', '');
    stubMatchMedia(false);
    document.body.innerHTML = `<section id="home-stats"></section>`;
    vi.stubGlobal('K3UI', {
      i18n: {
        t: (key: string) =>
          ({
            'playground.home.stats.title': 'K3ui in numbers',
            'playground.home.stats.k3ui': 'K3ui components',
            'playground.home.stats.k3ux': 'K3ux animations',
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
            'playground.home.stats.k3ux': 'Animations K3ux',
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
    expect(
      document.querySelector('[data-stat="free"] .home-stat__line--num')?.textContent?.trim(),
    ).toBe('100%');
    expect(
      document.querySelector('[data-stat="free"] .home-stat__percent')?.textContent?.trim(),
    ).toBe('%');
  });
});
