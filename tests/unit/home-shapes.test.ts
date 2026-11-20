import { describe, expect, it } from 'vitest';
import { MATERIAL_SHAPE_NAMES } from '../../src/shapes/index.js';
import { HOME_SHAPE_NAMES, pickRandomHomeShape } from '../../playground/home-shapes.js';

const EXPECTED = [
  'Circle',
  'Square',
  'Slanted',
  'Arch',
  'Pill',
  'Diamond',
  'Pentagon',
  'Gem',
  'VerySunny',
  'Sunny',
  'Cookie4Sided',
  'Cookie6Sided',
  'Cookie7Sided',
  'Cookie9Sided',
  'Cookie12Sided',
  'Clover4Leaf',
  'Clover8Leaf',
  'SoftBurst',
  'Flower',
] as const;

describe('home-shapes allowlist', () => {
  it('matches the curated home set (cookies + clovers expanded)', () => {
    expect([...HOME_SHAPE_NAMES].sort()).toEqual([...EXPECTED].sort());
  });

  it('excludes catalog shapes outside the allowlist', () => {
    for (const banned of ['Heart', 'Boom', 'Ghostish', 'Triangle', 'Bun', 'SemiCircle']) {
      expect(HOME_SHAPE_NAMES).not.toContain(banned);
      expect(MATERIAL_SHAPE_NAMES).toContain(banned);
    }
  });

  it('pickRandomHomeShape stays in the allowlist and avoids exclude', () => {
    for (const name of HOME_SHAPE_NAMES) {
      for (let i = 0; i < 30; i++) {
        const next = pickRandomHomeShape(name);
        expect(HOME_SHAPE_NAMES).toContain(next);
        expect(next).not.toBe(name);
      }
    }
  });
});
