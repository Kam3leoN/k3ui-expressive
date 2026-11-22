import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import {
  fabMenuExpansionZone,
  concealPeersInZone,
  restoreConcealedPeers,
  FAB_MENU_CONCEAL_ATTR,
  fabShow,
  fabHide,
} from '../../src/components/actions/fab-visibility.js';

describe('fabMenuExpansionZone', () => {
  it('covers trigger + pills above when side is above', () => {
    const trigger = new DOMRect(100, 200, 56, 56);
    const zone = fabMenuExpansionZone(trigger, {
      side: 'above',
      menuHeightPx: 176,
      menuWidthPx: 200,
      gapPx: 4,
      trailingRight: true,
    });
    expect(zone.width).toBe(200);
    expect(zone.right).toBe(trigger.right);
    expect(zone.top).toBe(200 - 4 - 176);
    expect(zone.bottom).toBe(trigger.bottom);
  });

  it('extends left from trailing-right trigger', () => {
    const trigger = new DOMRect(300, 100, 56, 56);
    const zone = fabMenuExpansionZone(trigger, {
      side: 'below',
      menuHeightPx: 100,
      menuWidthPx: 180,
      gapPx: 4,
      trailingRight: true,
    });
    expect(zone.left).toBe(300 + 56 - 180);
    expect(zone.top).toBe(100);
  });
});

describe('fabShow / fabHide', () => {
  it('toggles hidden with data-visibility phases', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    try {
      expect(await fabHide(el)).toBe(true);
      expect(el.hasAttribute('hidden')).toBe(true);
      expect(await fabShow(el)).toBe(true);
      expect(el.hasAttribute('hidden')).toBe(false);
    } finally {
      el.remove();
    }
  });
});

describe('concealPeersInZone', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-fab', 'k3-fab-menu', 'k3-fab-menu-item', 'k3-button'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('hides overlapping k3-fab peers and restores them', async () => {
    host.innerHTML = `
      <k3-fab id="peer" style="position:fixed; inset:120px auto auto 100px;"></k3-fab>
      <k3-fab-menu id="menu" style="position:fixed; inset:200px auto auto 100px;">
        <k3-fab-menu-item>One</k3-fab-menu-item>
        <k3-fab-menu-item>Two</k3-fab-menu-item>
      </k3-fab-menu>
    `;
    const menu = host.querySelector('#menu') as HTMLElement;
    const peer = host.querySelector('#peer') as HTMLElement & {
      hide: () => Promise<boolean>;
      show: () => Promise<boolean>;
      updateComplete: Promise<unknown>;
    };
    await peer.updateComplete;

    /* Force geometry — jsdom often returns 0×0 without layout */
    vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(100, 200, 56, 56),
    );
    vi.spyOn(peer, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(100, 80, 56, 56),
    );

    const zone = fabMenuExpansionZone(new DOMRect(100, 200, 56, 56), {
      side: 'above',
      menuHeightPx: 176,
      menuWidthPx: 200,
      gapPx: 4,
      trailingRight: false,
    });
    const peers = concealPeersInZone(menu, zone);
    expect(peers.length).toBeGreaterThanOrEqual(1);
    expect(peer.hasAttribute(FAB_MENU_CONCEAL_ATTR)).toBe(true);

    restoreConcealedPeers(peers);
    expect(peer.hasAttribute(FAB_MENU_CONCEAL_ATTR)).toBe(false);
  });

  it('marks overlapping k3-button with conceal attr', () => {
    host.innerHTML = `
      <k3-button id="btn" style="position:fixed; inset:80px auto auto 100px;">Go</k3-button>
      <div id="menu"></div>
    `;
    const menu = host.querySelector('#menu') as HTMLElement;
    const btn = host.querySelector('#btn') as HTMLElement;
    vi.spyOn(btn, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(100, 80, 80, 40),
    );
    const zone = fabMenuExpansionZone(new DOMRect(100, 200, 56, 56), {
      side: 'above',
      menuHeightPx: 176,
      menuWidthPx: 200,
      gapPx: 4,
      trailingRight: false,
    });
    const peers = concealPeersInZone(menu, zone);
    expect(btn.hasAttribute(FAB_MENU_CONCEAL_ATTR)).toBe(true);
    restoreConcealedPeers(peers);
    expect(btn.hasAttribute(FAB_MENU_CONCEAL_ATTR)).toBe(false);
  });
});
