import { describe, it, expect, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing-helpers';
import '../../src/components/containment/list-item.js';
import type { K3ListItem } from '../../src/components/containment/list-item.js';

function shadowElementCount(item: K3ListItem): number {
  return item.shadowRoot!.querySelectorAll('*').length;
}

describe('k3-list-item — shadow DOM weight', () => {
  let item: K3ListItem;
  afterEach(() => item?.remove());

  it('simple headline + supporting row uses ≤ 20 shadow elements', async () => {
    item = await fixture<K3ListItem>(html`
      <k3-list-item>
        <span slot="headline">Title</span>
        <span slot="supporting">Subtitle</span>
      </k3-list-item>
    `);
    await item.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await item.updateComplete;

    const count = shadowElementCount(item);
    expect(count).toBeLessThanOrEqual(20);
    expect(item.shadowRoot!.querySelector('[part="leading"]')).toBeNull();
    expect(item.shadowRoot!.querySelector('[part="trailing"]')).toBeNull();
    expect(item.shadowRoot!.querySelector('[part="expand"]')).toBeNull();
    expect(item.shadowRoot!.querySelector('.toggle')).toBeNull();
  });
});