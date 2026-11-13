import { describe, expect, it } from 'vitest';
import { HERO_MORPH } from '../../playground/hero-morph/data.js';
import { mountHomeHeroMorph } from '../../playground/hero-morph/mount.js';

describe('home hero morph', () => {
  it('HERO_MORPH layers have matching path point counts across keyframes', () => {
    for (const layer of ['back', 'mid', 'front'] as const) {
      const frames = HERO_MORPH[layer].values.split(';');
      expect(frames.length).toBe(9);
      const counts = frames.map((f) => (f.match(/L/gi) ?? []).length);
      expect(new Set(counts).size, `${layer} unequal L counts`).toBe(1);
    }
  });

  it('mountHomeHeroMorph injects CSS morph keyframes and shapes', () => {
    document.body.innerHTML = '<div id="home-hero-morph"></div>';
    mountHomeHeroMorph();
    const host = document.getElementById('home-hero-morph')!;
    expect(host.querySelectorAll('.home-hero-morph__shape')).toHaveLength(3);
    expect(host.querySelectorAll('svg.home-hero-morph__svg')).toHaveLength(3);
    expect(host.querySelectorAll('.home-hero-morph__animated')).toHaveLength(3);
    expect(host.querySelector('animate')).toBeNull();
    const style = document.getElementById('home-hero-morph-keyframes');
    expect(style?.textContent).toContain('@keyframes home-hero-morph-d-back');
    expect(style?.textContent).toContain('d: path("M');
    expect(host.querySelector('.home-hero-morph__k')?.textContent).toBe('K');
  });
});
