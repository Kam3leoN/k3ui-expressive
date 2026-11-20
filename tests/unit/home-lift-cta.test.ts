import { afterEach, describe, expect, it, vi } from 'vitest';
import { MATERIAL_SHAPE_SVG } from '../../src/shapes/index.js';
import {
  fetchGithubStars,
  mountHomeLiftCta,
  syncHomeLiftCtaI18n,
} from '../../playground/home-lift-cta/mount.js';

const HOST_HTML = `
<section id="home-lift-cta" class="home-lift-cta" data-home-lift-cta>
  <div class="home-lift-cta__blobs" aria-hidden="true"></div>
  <div class="home-lift-cta__inner">
    <h2 data-i18n="playground.home.lift.title">Ready to build?</h2>
    <p data-i18n="playground.home.lift.lead">Free, open source, Material 3 for the web.</p>
    <div class="home-lift-cta__actions">
      <k3-button data-nav="quick-start"><span data-i18n="playground.home.lift.start">Get started</span></k3-button>
      <k3-button data-nav="pack"><span data-i18n="playground.home.lift.pack">Pack Builder</span></k3-button>
      <k3-button>
        <span data-home-lift-star-label data-i18n="playground.home.lift.star">Star on GitHub</span>
        <span class="visually-hidden" data-home-lift-stars hidden></span>
      </k3-button>
    </div>
  </div>
</section>`;

describe('home-lift-cta', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('mounts Sunny + Flower blobs with spin wrappers', async () => {
    document.body.innerHTML = HOST_HTML;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ stargazers_count: 42 }),
      })),
    );
    await mountHomeLiftCta();
    const blobs = [...document.querySelectorAll<HTMLElement>('.home-lift-cta__blob')];
    expect(blobs.map((el) => el.dataset.shape)).toEqual(['Sunny', 'Flower']);
    expect(document.querySelectorAll('.home-lift-cta__spin')).toHaveLength(2);
    const paths = [...document.querySelectorAll('.home-lift-cta__shape path')].map((p) =>
      p.getAttribute('d'),
    );
    expect(paths[0]).toBe(MATERIAL_SHAPE_SVG.Sunny);
    expect(paths[1]).toBe(MATERIAL_SHAPE_SVG.Flower);
  });

  it('paints GitHub star count on the outlined CTA', async () => {
    document.body.innerHTML = HOST_HTML;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ stargazers_count: 42 }),
      })),
    );
    await mountHomeLiftCta();
    expect(document.querySelector('[data-home-lift-star-label]')?.textContent).toBe(
      'Star on GitHub · 42',
    );
    expect(document.querySelector('[data-home-lift-stars]')?.textContent).toBe('42');
  });

  it('fetchGithubStars caches in sessionStorage', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ stargazers_count: 7 }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await fetchGithubStars()).toBe(7);
    expect(await fetchGithubStars()).toBe(7);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('syncHomeLiftCtaI18n refreshes copy', async () => {
    document.body.innerHTML = HOST_HTML;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ stargazers_count: 3 }),
      })),
    );
    await mountHomeLiftCta();
    vi.stubGlobal('K3UI', {
      i18n: {
        t: (key: string) =>
          ({
            'playground.home.lift.title': 'Prêt à créer ?',
            'playground.home.lift.lead': 'Gratuit, open source, Material 3 pour le web.',
            'playground.home.lift.start': 'Commencer',
            'playground.home.lift.pack': 'Pack Builder',
            'playground.home.lift.star': 'Star sur GitHub',
          })[key] ?? key,
      },
    });
    syncHomeLiftCtaI18n();
    expect(document.querySelector('[data-i18n="playground.home.lift.title"]')?.textContent).toBe(
      'Prêt à créer ?',
    );
    expect(document.querySelector('[data-home-lift-star-label]')?.textContent).toBe(
      'Star sur GitHub · 3',
    );
  });
});
