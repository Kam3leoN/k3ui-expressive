import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing-helpers';
import '../../src/components/containment/list.js';
import '../../src/components/containment/list-item.js';
import type { K3List } from '../../src/components/containment/list.js';
import type { K3ListItem } from '../../src/components/containment/list-item.js';
import { devicePixelSnapCss } from '../../src/core/css-length.js';

describe('k3-list segmented gap', () => {
  let el: K3List;
  const expectedGap = devicePixelSnapCss(2);

  beforeEach(async () => {
    el = await fixture<K3List>(html`
      <k3-list variant="segmented">
        <k3-list-item interactive><span slot="headline">A</span></k3-list-item>
        <k3-list-item interactive><span slot="headline">B</span></k3-list-item>
        <k3-list-item interactive><span slot="headline">C</span></k3-list-item>
      </k3-list>
    `);
    await el.updateComplete;
    for (const item of el.querySelectorAll('k3-list-item')) {
      await (item as K3ListItem).updateComplete;
    }
    await new Promise((r) => requestAnimationFrame(r));
  });

  afterEach(() => el.remove());

  it('marks every item except last with data-seg-gap', () => {
    const items = [...el.querySelectorAll('k3-list-item')] as K3ListItem[];
    expect(items).toHaveLength(3);
    expect(items[0]!.segGap).toBe(true);
    expect(items[1]!.segGap).toBe(true);
    expect(items[2]!.segGap).toBe(false);
  });

  it('applies DPR-snapped margin-bottom on first and middle', () => {
    const items = [...el.querySelectorAll('k3-list-item')] as K3ListItem[];
    expect(items[0]!.style.getPropertyValue('margin-bottom')).toBe(expectedGap);
    expect(items[0]!.style.getPropertyPriority('margin-bottom')).toBe('important');
    expect(items[1]!.style.getPropertyValue('margin-bottom')).toBe(expectedGap);
    expect(items[1]!.style.getPropertyPriority('margin-bottom')).toBe('important');
    expect(items[2]!.style.getPropertyValue('margin-bottom')).toBe('');
  });

  it('sets host --k3-segmented-list-segment-gap to snapped value', () => {
    expect(
      el.style.getPropertyValue('--k3-segmented-list-segment-gap').trim(),
    ).toBe(expectedGap);
  });
});
