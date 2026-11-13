import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { init } from '../../src/index.js';
import { overlayStack } from '../../src/core/overlay-stack.js';

type LitEl = HTMLElement & {
  updateComplete: Promise<unknown>;
  show?: () => Promise<boolean>;
  hide?: (source?: string) => Promise<boolean>;
  open?: boolean;
};

async function mount(html: string): Promise<LitEl> {
  const box = document.createElement('div');
  box.innerHTML = html;
  document.body.append(box);
  const el = box.firstElementChild as LitEl;
  await el.updateComplete;
  return el;
}

describe('components used simultaneously', () => {
  beforeAll(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-dialog', 'k3-sheet', 'k3-button', 'k3-snackbar', 'k3-tooltip'],
      theme: { mode: 'light' },
    });
  });

  afterEach(() => {
    document.body.querySelectorAll('k3-dialog, k3-sheet, k3-snackbar, k3-tooltip, k3-button').forEach((el) => el.remove());
  });

  it('two dialogs: only the top overlay leaves the stack on Escape', async () => {
    const a = await mount(`<k3-dialog id="dlg-a"><span slot="headline">A</span><k3-button id="ok-a">OK</k3-button></k3-dialog>`);
    const b = await mount(`<k3-dialog id="dlg-b"><span slot="headline">B</span><k3-button id="ok-b">OK</k3-button></k3-dialog>`);
    await a.show?.();
    await b.show?.();
    expect(a.open).toBe(true);
    expect(b.open).toBe(true);

    const esc = (): void => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    };
    esc();
    /* Top-most closes; bottom stays open */
    await vi.waitFor(() => expect(b.open).toBe(false));
    expect(a.open).toBe(true);

    esc();
    await vi.waitFor(() => expect(a.open).toBe(false));
  });

  it('button + tooltip + snackbar can mount together and tear down cleanly', async () => {
    const btn = await mount(`<k3-button id="c-btn">Save</k3-button>`);
    const tip = await mount(`<k3-tooltip for="c-btn" content="Save now"></k3-tooltip>`);
    const snack = await mount(`<k3-snackbar id="c-snack" duration="short">Saved</k3-snackbar>`);
    await snack.show?.();
    expect(btn.isConnected && tip.isConnected && snack.isConnected).toBe(true);
    btn.remove();
    tip.remove();
    await snack.hide?.('api');
    snack.remove();
    expect(document.getElementById('c-btn')).toBeNull();
    expect(document.getElementById('c-snack')).toBeNull();
  });

  it('overlay stack scrollLock toggles under concurrent overlays', async () => {
    const prev = overlayStack.scrollLock;
    overlayStack.setScrollLock(true);
    const dlg = await mount(`<k3-dialog><span slot="headline">Lock</span></k3-dialog>`);
    await dlg.show?.();
    expect(dlg.open).toBe(true);
    await dlg.hide?.('api');
    overlayStack.setScrollLock(prev);
  });
});
