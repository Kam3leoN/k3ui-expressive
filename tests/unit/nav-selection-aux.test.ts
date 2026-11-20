import { afterEach, describe, expect, it } from 'vitest';
import { armNavActive, queryNavItems } from '../../src/components/navigation/nav-selection.js';
import type { K3NavItem } from '../../src/components/navigation/nav-item.js';
import '../../src/components/navigation/nav-item.js';

describe('queryNavItems + data-nav-aux', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('excludes data-nav-aux items from host.active destinations', () => {
    document.body.innerHTML = `
      <div id="host">
        <k3-nav-item id="a"></k3-nav-item>
        <k3-nav-item id="rail-sponsors" data-nav-aux></k3-nav-item>
        <k3-nav-item id="b"></k3-nav-item>
      </div>`;
    const host = document.getElementById('host')!;
    expect(queryNavItems(host).map((el) => el.id)).toEqual(['a', 'b']);
  });

  it('arms aux Sponsors with the same clear-then-arm path', async () => {
    document.body.innerHTML = `
      <div id="host">
        <k3-nav-item id="a"></k3-nav-item>
        <k3-nav-item id="rail-sponsors" data-nav-aux></k3-nav-item>
      </div>`;
    await customElements.whenDefined('k3-nav-item');
    const a = document.getElementById('a') as K3NavItem;
    const sponsors = document.getElementById('rail-sponsors') as K3NavItem;
    a.active = true;
    armNavActive([a, sponsors], 1, false);
    expect(a.active).toBe(false);
    expect(sponsors.active).toBe(true);
  });
});
