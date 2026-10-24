import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import {
  ShapeChipDefaultShape,
  ShapeChipDefaultSize,
  ShapeChipIconSizeDp,
  ShapeChipPillHeightDp,
  ShapeChipRefPillDp,
  ShapeChipShapeBaseDp,
  ShapeChipShapeOverPill,
  ShapeChipShapeSizeDp,
  shapeChipMetrics,
} from '../../src/components/actions/shape-chip.specs.js';
import { IconButtonSizeDp } from '../../src/components/actions/icon-button.specs.js';
import type { K3ShapeChip } from '../../src/components/actions/shape-chip.js';

describe('shape-chip specs', () => {
  it('keeps ref proportions and button-aligned size ladder', () => {
    expect(ShapeChipDefaultShape).toBe('Cookie7Sided');
    expect(ShapeChipDefaultSize).toBe('sm');
    expect(ShapeChipRefPillDp).toBe(28);
    expect(ShapeChipShapeBaseDp).toBe(36);
    expect(ShapeChipShapeSizeDp).toBe(36 * 1.1);
    expect(ShapeChipShapeOverPill).toBeCloseTo(39.6 / 28);

    expect(ShapeChipPillHeightDp).toEqual({
      xs: 32,
      sm: 40,
      md: 56,
      lg: 96,
      xl: 136,
    });
  });

  it('icon sizes match M3 icon-button specs', () => {
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      expect(ShapeChipIconSizeDp[size]).toBe(IconButtonSizeDp[size].icon);
    }
  });

  it('scales shape with pill; icon follows M3 table', () => {
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      const m = shapeChipMetrics(size);
      expect(m.pill).toBe(ShapeChipPillHeightDp[size]);
      expect(m.shape / m.pill).toBeCloseTo(ShapeChipShapeOverPill);
      expect(m.icon).toBe(ShapeChipIconSizeDp[size]);
    }
  });
});

describe('k3-shape-chip', () => {
  beforeEach(async () => {
    await init({ components: ['k3-shape-chip'] });
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('renders leading Material shape path', async () => {
    const el = document.createElement('k3-shape-chip') as K3ShapeChip;
    el.shape = 'Cookie7Sided';
    el.textContent = 'Special';
    document.body.append(el);
    await el.updateComplete;

    const path = el.shadowRoot?.querySelector('.shape path');
    expect(path?.getAttribute('d')?.length).toBeGreaterThan(20);
  });

  it('is static by default (no button / no focus)', async () => {
    const el = document.createElement('k3-shape-chip') as K3ShapeChip;
    el.textContent = 'Special';
    document.body.append(el);
    await el.updateComplete;

    expect(el.shadowRoot?.querySelector('button')).toBeNull();
    expect(el.shadowRoot?.querySelector('div.pill')).toBeTruthy();
  });

  it('shows icon slot inside the shape', async () => {
    const el = document.createElement('k3-shape-chip') as K3ShapeChip;
    const icon = document.createElement('span');
    icon.slot = 'icon';
    icon.setAttribute('data-k3-icon', 'favorite');
    el.append(icon, document.createTextNode('Favorite'));
    document.body.append(el);
    await el.updateComplete;

    expect(el.hasIcon).toBe(true);
    expect(el.shadowRoot?.querySelector('.shape-icon slot')).toBeTruthy();
  });

  it('mirrors shape when placement is trailing', async () => {
    const el = document.createElement('k3-shape-chip') as K3ShapeChip;
    el.placement = 'trailing';
    el.textContent = 'Bookmark';
    document.body.append(el);
    await el.updateComplete;

    expect(el.getAttribute('placement')).toBe('trailing');
  });

  it('reflects size xs–xl', async () => {
    const el = document.createElement('k3-shape-chip') as K3ShapeChip;
    el.size = 'lg';
    el.textContent = 'Large';
    document.body.append(el);
    await el.updateComplete;

    expect(el.getAttribute('size')).toBe('lg');
  });

  it('toggles selected when toggle is set', async () => {
    const el = document.createElement('k3-shape-chip') as K3ShapeChip;
    el.toggle = true;
    el.textContent = 'Good';
    document.body.append(el);
    await el.updateComplete;

    const btn = el.shadowRoot?.querySelector('button');
    btn?.click();
    await el.updateComplete;
    expect(el.selected).toBe(true);
  });
});
