import { describe, it, expect } from 'vitest';
import {
  MATERIAL_SHAPE_NAMES,
  MATERIAL_SHAPE_SVG,
  morphMaterialShapes,
} from '../../src/shapes/index.js';

describe('Material 3 Expressive shapes', () => {
  it('embeds all 35 SVG paths', () => {
    expect(MATERIAL_SHAPE_NAMES).toHaveLength(35);
    for (const name of MATERIAL_SHAPE_NAMES) {
      const d = MATERIAL_SHAPE_SVG[name];
      expect(d.startsWith('M')).toBe(true);
      expect(d.toUpperCase().includes('Z')).toBe(true);
    }
  });

  it('morphs between Circle and Heart', () => {
    const mid = morphMaterialShapes({ from: 'Circle', to: 'Heart', progress: 0.5 });
    expect(mid.startsWith('M')).toBe(true);
    expect(mid).not.toBe(MATERIAL_SHAPE_SVG.Circle);
    expect(mid).not.toBe(MATERIAL_SHAPE_SVG.Heart);
  });
});
