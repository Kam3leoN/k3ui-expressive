import { afterEach, describe, expect, it } from 'vitest';
import { HERO_LAYER_START, mountHomeHeroMorph } from '../../playground/hero-morph/mount.js';
import { HOME_SHAPE_NAMES } from '../../playground/home-shapes.js';

describe('home hero morph', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-k3-reduce-motion');
  });

  it('layer starts are in the home allowlist', () => {
    for (const name of Object.values(HERO_LAYER_START)) {
      expect(HOME_SHAPE_NAMES).toContain(name);
    }
  });

  it('depth scales: front < mid < back', () => {
    document.documentElement.setAttribute('data-k3-reduce-motion', '');
    document.body.innerHTML = `
      <style>
        .home-hero-morph__svg { transform: scale(var(--home-hero-morph-scale, 1)); }
        .home-hero-morph__shape--back { --home-hero-morph-scale: 1; }
        .home-hero-morph__shape--mid { --home-hero-morph-scale: 0.9; }
        .home-hero-morph__shape--front { --home-hero-morph-scale: 0.82; }
      </style>
      <div id="home-hero-morph"></div>`;
    mountHomeHeroMorph();
    const host = document.getElementById('home-hero-morph')!;
    const scaleOf = (layer: string) => {
      const el = host.querySelector(`.home-hero-morph__shape--${layer}`) as HTMLElement;
      return Number.parseFloat(getComputedStyle(el).getPropertyValue('--home-hero-morph-scale'));
    };
    expect(scaleOf('front')).toBeLessThan(scaleOf('mid'));
    expect(scaleOf('mid')).toBeLessThan(scaleOf('back'));
  });

  it('mountHomeHeroMorph injects 3 shapes from the allowlist', () => {
    document.documentElement.setAttribute('data-k3-reduce-motion', '');
    document.body.innerHTML = '<div id="home-hero-morph"></div>';
    mountHomeHeroMorph();
    const host = document.getElementById('home-hero-morph')!;
    expect(host.querySelectorAll('.home-hero-morph__shape')).toHaveLength(3);
    expect(host.querySelectorAll('svg.home-hero-morph__svg')).toHaveLength(3);
    expect(host.querySelectorAll('.home-hero-morph__animated')).toHaveLength(3);
    expect(host.querySelector('animate')).toBeNull();
    expect(host.querySelector('.home-hero-morph__k')?.textContent).toBe('K');
    for (const el of host.querySelectorAll<HTMLElement>('.home-hero-morph__shape')) {
      expect(HOME_SHAPE_NAMES).toContain(el.dataset.shape);
    }
    expect(
      (host.querySelector('.home-hero-morph__shape--back') as HTMLElement | null)?.dataset.shape,
    ).toBe(HERO_LAYER_START.back);
    expect(
      (host.querySelector('.home-hero-morph__shape--mid') as HTMLElement | null)?.dataset.shape,
    ).toBe(HERO_LAYER_START.mid);
    expect(
      (host.querySelector('.home-hero-morph__shape--front') as HTMLElement | null)?.dataset.shape,
    ).toBe(HERO_LAYER_START.front);
  });

  it('is idempotent', () => {
    document.documentElement.setAttribute('data-k3-reduce-motion', '');
    document.body.innerHTML = '<div id="home-hero-morph"></div>';
    mountHomeHeroMorph();
    mountHomeHeroMorph();
    expect(document.querySelectorAll('#home-hero-morph .home-hero-morph__shape')).toHaveLength(3);
  });
});
