import { afterEach, describe, expect, it } from 'vitest';
import { MATERIAL_SHAPE_SVG } from '../../src/shapes/index.js';

/** Mirrors playground/app.ts mountHomeAmbient orb recipe for unit coverage. */
function mountHomeAmbient(): void {
  const host = document.getElementById('home-ambient');
  if (!host || host.childElementCount) return;
  const slots = [
    { name: 'VerySunny', slot: 'a' },
    { name: 'Clover8Leaf', slot: 'b' },
    { name: 'Pentagon', slot: 'c' },
    { name: 'Cookie9Sided', slot: 'd' },
  ] as const;
  host.replaceChildren(
    ...slots.map(({ name, slot }) => {
      const orb = document.createElement('div');
      orb.className = `home-ambient__orb home-ambient__orb--${slot}`;
      const spin = document.createElement('div');
      spin.className = 'home-ambient__spin';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'home-ambient__shape');
      svg.setAttribute('viewBox', '0 0 1 1');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', MATERIAL_SHAPE_SVG[name]);
      svg.append(path);
      spin.append(svg);
      orb.append(spin);
      return orb;
    }),
  );
}

describe('home-ambient blurred orbs', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('injects four Trainable-style orb layers', () => {
    document.body.innerHTML = '<div id="home-ambient"></div>';
    mountHomeAmbient();
    const host = document.getElementById('home-ambient')!;
    expect(host.querySelectorAll('.home-ambient__orb')).toHaveLength(4);
    expect(host.querySelectorAll('.home-ambient__spin')).toHaveLength(4);
    expect(host.querySelectorAll('.home-ambient__shape')).toHaveLength(4);
    expect(host.querySelector('.home-ambient__orb--a')).toBeTruthy();
    expect(host.querySelector('.home-ambient__orb--d')).toBeTruthy();
  });

  it('is idempotent', () => {
    document.body.innerHTML = '<div id="home-ambient"></div>';
    mountHomeAmbient();
    mountHomeAmbient();
    expect(document.querySelectorAll('#home-ambient .home-ambient__orb')).toHaveLength(4);
  });
});
