import { afterEach, describe, expect, it } from 'vitest';
import {
  armNavActive,
  queryNavItems,
  queryNavItemsForLayout,
} from '../../src/components/navigation/nav-selection.js';
import type { K3NavItem } from '../../src/components/navigation/nav-item.js';
import '../../src/components/navigation/nav-item.js';
import '../../src/components/navigation/nav-rail.js';
import type { K3NavRail } from '../../src/components/navigation/nav-rail.js';

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

  it('includes data-nav-aux and trailing items in layout sync list', () => {
    document.body.innerHTML = `
      <div id="host">
        <k3-nav-item id="a"></k3-nav-item>
        <k3-nav-item id="rail-sponsors" data-nav-aux></k3-nav-item>
        <k3-nav-item id="trail" slot="trailing"></k3-nav-item>
      </div>`;
    const host = document.getElementById('host')!;
    expect(queryNavItemsForLayout(host).map((el) => el.id)).toEqual([
      'a',
      'rail-sponsors',
      'trail',
    ]);
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

  it('rail expand sets horizontal layout on Sponsors like peers', async () => {
    document.body.innerHTML = `
      <k3-nav-rail id="rail" size="compact" collapsible>
        <k3-nav-item id="home" label="Home"></k3-nav-item>
        <k3-nav-item id="rail-sponsors" data-nav-aux label="Sponsors"></k3-nav-item>
      </k3-nav-rail>`;
    await customElements.whenDefined('k3-nav-rail');
    await customElements.whenDefined('k3-nav-item');
    const rail = document.getElementById('rail') as K3NavRail;
    const home = document.getElementById('home') as K3NavItem;
    const sponsors = document.getElementById('rail-sponsors') as K3NavItem;
    await rail.updateComplete;
    await home.updateComplete;
    await sponsors.updateComplete;

    expect(home.layout).toBe('vertical');
    expect(sponsors.layout).toBe('vertical');

    rail.size = 'large';
    await rail.updateComplete;
    await home.updateComplete;
    await sponsors.updateComplete;

    expect(home.layout).toBe('horizontal');
    expect(sponsors.layout).toBe('horizontal');
  });
});
