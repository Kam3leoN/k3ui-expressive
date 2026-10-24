import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing-helpers';
import '../../src/components/containment/list.js';
import '../../src/components/containment/list-item.js';
import type { K3List } from '../../src/components/containment/list.js';
import type { K3ListItem } from '../../src/components/containment/list-item.js';

describe('k3-list segmented gap', () => {
  let el: K3List;

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
    expect(items[0]!.getAttribute('data-seg')).toBe('first');
    expect(items[1]!.getAttribute('data-seg')).toBe('middle');
    expect(items[2]!.getAttribute('data-seg')).toBe('last');
    expect(items[0]!.segGap).toBe(true);
    expect(items[1]!.segGap).toBe(true);
    expect(items[2]!.segGap).toBe(false);
  });

  it('uses 2dp flex gap on .list', () => {
    const list = el.shadowRoot!.querySelector('.list') as HTMLElement;
    const gap = getComputedStyle(list).rowGap || getComputedStyle(list).gap;
    expect(gap === '2px' || gap === '0.125rem').toBe(true);
  });
});
