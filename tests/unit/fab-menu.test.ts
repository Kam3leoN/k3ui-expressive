import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import {
  FabMenuSpecs,
  fabMenuItemDelayMs,
  fabMenuMaxDurationMs,
  fabMenuIsTrailingRight,
  fabMenuResolveSide,
  fabMenuEstimateHeightDp,
  fabMenuClampMaxHeightPx,
  fabMenuClipBounds,
  fabMenuFindClipElement,
  fabMenuViewportChromeBounds,
} from '../../src/components/actions/fab-menu.specs.js';

describe('fab-menu specs', () => {
  it('uses Compose stagger + FastSpatial / FastEffects durations', () => {
    expect(FabMenuSpecs.staggerEnterMs).toBe(35);
    expect(FabMenuSpecs.staggerExitMs).toBe(25);
    expect(FabMenuSpecs.spatialEnterMs).toBe(350);
    expect(FabMenuSpecs.effectsMs).toBe(150);
    expect(FabMenuSpecs.itemMaxWidthDp).toBe(280);
    expect(FabMenuSpecs.gapDp).toBe(4);
    expect(FabMenuSpecs.fabGapDp).toBe(4); /* M3 web recommended */
    expect(FabMenuSpecs.spatialEnterEasing).toContain('0.42');
    expect(FabMenuSpecs.spatialEnterEasing).toContain('1.67');
    expect(FabMenuSpecs.minItems).toBe(2);
    expect(FabMenuSpecs.maxItems).toBe(6);
  });

  it('staggers from FAB on open (menu above)', () => {
    /* 3 items above FAB: nearest FAB (index 2) delay 0, then 35, 70 */
    expect(fabMenuItemDelayMs('opening', 2, 3, true)).toBe(0);
    expect(fabMenuItemDelayMs('opening', 1, 3, true)).toBe(35);
    expect(fabMenuItemDelayMs('opening', 0, 3, true)).toBe(70);
  });

  it('waits max(spatial, effects) + stagger + 1 frame', () => {
    const ms = fabMenuMaxDurationMs('opening', 3);
    expect(ms).toBe(2 * 35 + 350 + 16);
  });

  it('close uses FastSpatial like menus (not short effects-only exit)', () => {
    expect(FabMenuSpecs.spatialExitMs).toBe(FabMenuSpecs.spatialEnterMs);
    expect(FabMenuSpecs.spatialExitEasing).toBe(FabMenuSpecs.spatialEnterEasing);
    const itemsOnly = 2 * 25 + Math.max(FabMenuSpecs.spatialExitMs, FabMenuSpecs.effectsMs) + 16;
    const ms = fabMenuMaxDurationMs('closing', 3);
    expect(ms).toBe(Math.max(itemsOnly, FabMenuSpecs.closeTriggerMs + 16));
  });

  it('maps trailing edge for LTR / RTL', () => {
    expect(fabMenuIsTrailingRight('bottom-end', false)).toBe(true);
    expect(fabMenuIsTrailingRight('bottom-start', false)).toBe(false);
    expect(fabMenuIsTrailingRight('bottom-end', true)).toBe(false);
  });

  it('flips below when preferred above lacks room', () => {
    const menuH = fabMenuEstimateHeightDp(3); /* 56*3 + 4*2 = 176 */
    const need = menuH + FabMenuSpecs.edgeSafetyDp; /* +56 early flip */
    expect(menuH).toBe(176);
    expect(FabMenuSpecs.edgeSafetyDp).toBe(56);
    /* host near top of clip: little space above, lots below */
    expect(fabMenuResolveSide(true, 20, 76, menuH, 4, 0, 400)).toBe('below');
    /* plenty above (clear of menu + one pill safety) */
    expect(fabMenuResolveSide(true, 300, 356, menuH, 4, 0, 800)).toBe('above');
    /* within safety band of the edge → flip when below has room */
    const hostTop = need + 4; /* spaceAbove === need → not `>` → flip */
    expect(fabMenuResolveSide(true, hostTop, hostTop + 56, menuH, 4, 0, 800)).toBe(
      'below',
    );
  });

  it('clamps max-height to whole pills + clip inset so edges never shear', () => {
    /* Helper kept for callers; runtime menu no longer applies it (FAB overlap). */
    const maxH = fabMenuClampMaxHeightPx('above', 100, 156, 4, 0, 200);
    expect(maxH).toBe(72);
    expect(maxH).toBeLessThan(fabMenuEstimateHeightDp(3));
  });

  it('uses demo-frame as logical collision bounds before overflow ancestors', () => {
    const outer = document.createElement('div');
    outer.style.overflow = 'auto';
    const frame = document.createElement('div');
    frame.className = 'demo-frame demo-frame--fab-menu';
    const host = document.createElement('div');
    frame.appendChild(host);
    outer.appendChild(frame);
    document.body.appendChild(outer);
    try {
      expect(fabMenuFindClipElement(host)).toBe(frame);
    } finally {
      outer.remove();
    }
  });

  it('intersects clip with viewport so off-screen edges flip', () => {
    /* Frame extends above the fold (top=-80); visible band starts at 0. */
    const el = {
      getBoundingClientRect: () =>
        ({ top: -80, bottom: 200, left: 0, right: 100, width: 100, height: 280 }) as DOMRect,
    } as HTMLElement;
    const band = fabMenuClipBounds(el, 0, 800, { top: 0, bottom: 800 });
    expect(band.top).toBe(0);
    expect(band.bottom).toBe(200);
    const menuH = fabMenuEstimateHeightDp(3);
    expect(fabMenuResolveSide(true, 40, 96, menuH, 4, band.top, band.bottom)).toBe(
      'below',
    );
  });

  it('treats top app bar as the top screen edge', () => {
    const bar = document.createElement('k3-top-app-bar');
    Object.defineProperty(bar, 'getBoundingClientRect', {
      value: () =>
        ({ top: 0, bottom: 64, left: 0, right: 400, width: 400, height: 64 }) as DOMRect,
    });
    document.body.appendChild(bar);
    try {
      const chrome = fabMenuViewportChromeBounds(document, 0, 800);
      expect(chrome.top).toBe(64);
      const menuH = fabMenuEstimateHeightDp(3);
      /* FAB just under app bar — menu above would hit the bar on first pill */
      expect(fabMenuResolveSide(true, 80, 136, menuH, 4, chrome.top, chrome.bottom)).toBe(
        'below',
      );
    } finally {
      bar.remove();
    }
  });
});

describe('k3-fab-menu lifecycle', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-fab-menu', 'k3-fab-menu-item', 'k3-fab'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('opens and closes with lifecycle events', async () => {
    host.innerHTML = `
      <k3-fab-menu>
        <k3-fab-menu-item icon="reply">Reply</k3-fab-menu-item>
        <k3-fab-menu-item icon="forward">Forward</k3-fab-menu-item>
      </k3-fab-menu>
    `;
    const el = host.querySelector('k3-fab-menu') as HTMLElement & {
      show: () => Promise<boolean>;
      hide: () => Promise<boolean>;
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;

    const events: string[] = [];
    for (const name of ['k3-open-start', 'k3-open-end', 'k3-close-start', 'k3-close-end']) {
      el.addEventListener(name, () => events.push(name));
    }

    expect(await el.show()).toBe(true);
    expect(events.slice(0, 2)).toEqual(['k3-open-start', 'k3-open-end']);

    expect(await el.hide()).toBe(true);
    expect(events).toContain('k3-close-start');
    expect(events).toContain('k3-close-end');
  });

  it('sets data-phase open on items after show settles', async () => {
    host.innerHTML = `
      <k3-fab-menu>
        <k3-fab-menu-item>One</k3-fab-menu-item>
        <k3-fab-menu-item>Two</k3-fab-menu-item>
      </k3-fab-menu>
    `;
    const el = host.querySelector('k3-fab-menu') as HTMLElement & {
      show: () => Promise<boolean>;
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    await el.show();
    const items = [...el.querySelectorAll('k3-fab-menu-item')];
    expect(items.every((i) => i.getAttribute('data-phase') === 'open')).toBe(true);
  }, 10_000);

  it('puts icons at end of line for start-edge placement (M3 / RTL mirror)', async () => {
    host.innerHTML = `
      <k3-fab-menu placement="bottom-end">
        <k3-fab-menu-item icon="reply">Reply</k3-fab-menu-item>
        <k3-fab-menu-item icon="forward">Forward</k3-fab-menu-item>
      </k3-fab-menu>
      <k3-fab-menu placement="top-start">
        <k3-fab-menu-item icon="reply">Reply</k3-fab-menu-item>
        <k3-fab-menu-item icon="forward">Forward</k3-fab-menu-item>
      </k3-fab-menu>
    `;
    const [endMenu, startMenu] = [...host.querySelectorAll('k3-fab-menu')] as Array<
      HTMLElement & { updateComplete: Promise<unknown> }
    >;
    await endMenu.updateComplete;
    await startMenu.updateComplete;
    await Promise.resolve(); /* microtask resync */

    const endItems = [...endMenu.querySelectorAll('k3-fab-menu-item')];
    const startItems = [...startMenu.querySelectorAll('k3-fab-menu-item')];
    expect(endItems.every((i) => !i.hasAttribute('data-icon-end'))).toBe(true);
    expect(startItems.every((i) => i.hasAttribute('data-icon-end'))).toBe(true);
  });

  it('conceals overlapping peer FABs while open and restores on hide', async () => {
    host.innerHTML = `
      <k3-fab id="peer"></k3-fab>
      <k3-fab-menu id="menu">
        <k3-fab-menu-item>One</k3-fab-menu-item>
        <k3-fab-menu-item>Two</k3-fab-menu-item>
      </k3-fab-menu>
    `;
    const menu = host.querySelector('#menu') as HTMLElement & {
      show: () => Promise<boolean>;
      hide: () => Promise<boolean>;
      updateComplete: Promise<unknown>;
    };
    const peer = host.querySelector('#peer') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await menu.updateComplete;
    await peer.updateComplete;

    vi.spyOn(menu, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(100, 300, 56, 56),
    );
    vi.spyOn(peer, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(100, 120, 56, 56),
    );

    await menu.show();
    expect(peer.hasAttribute('data-k3-fab-menu-concealed') || peer.hasAttribute('hidden')).toBe(
      true,
    );

    await menu.hide();
    expect(peer.hasAttribute('data-k3-fab-menu-concealed')).toBe(false);
  }, 10_000);

  it('ArrowDown / ArrowRight move focus through items then close FAB', async () => {
    host.innerHTML = `
      <k3-fab-menu>
        <k3-fab-menu-item>One</k3-fab-menu-item>
        <k3-fab-menu-item>Two</k3-fab-menu-item>
      </k3-fab-menu>
    `;
    const el = host.querySelector('k3-fab-menu') as HTMLElement & {
      show: () => Promise<boolean>;
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    await el.show();

    const fabHost = el.shadowRoot?.querySelector('k3-fab') as HTMLElement | null;
    const fabBtn = fabHost?.shadowRoot?.querySelector('button') ?? null;
    expect(fabBtn).toBeTruthy();
    fabBtn!.focus();

    const itemAt = (i: number) => el.querySelectorAll('k3-fab-menu-item')[i] as HTMLElement | undefined;
    const deepActive = (): Element | null => {
      let a: Element | null = document.activeElement;
      while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
      return a;
    };

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(deepActive()).toBe(itemAt(0)?.shadowRoot?.querySelector('button'));

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    expect(deepActive()).toBe(itemAt(1)?.shadowRoot?.querySelector('button'));

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(deepActive()).toBe(fabBtn);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect(deepActive()).toBe(itemAt(1)?.shadowRoot?.querySelector('button'));
  }, 10_000);
});
