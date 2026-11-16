import { describe, it, expect } from 'vitest';
import { init } from '../../src/index.js';

describe('k3-command-palette', () => {
  it('opens with k3-dialog and focuses search', async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-command-palette', 'k3-dialog', 'k3-list-item', 'k3-kbd'],
      theme: { mode: 'light' },
    });

    const el = document.createElement('k3-command-palette') as HTMLElement & {
      show: () => Promise<boolean>;
      hide: () => Promise<boolean>;
      open: boolean;
      items: { value: string; label: string }[] | null;
      updateComplete: Promise<unknown>;
    };
    el.placeholder = 'Jump…';
    document.body.appendChild(el);
    await el.updateComplete;

    el.items = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ];
    await el.updateComplete;

    const dialog = el.shadowRoot?.querySelector('k3-dialog') as HTMLElement & {
      open: boolean;
    };
    expect(dialog).toBeTruthy();

    const opened = await el.show();
    expect(opened).toBe(true);
    expect(el.open).toBe(true);
    expect(dialog.open).toBe(true);
    expect(dialog.querySelector('.k3-cp__input')).toBeTruthy();

    const closed = await el.hide('api');
    expect(closed).toBe(true);
    expect(el.open).toBe(false);
    el.remove();
  });

  it('emits k3-command-select and closes on row activate', async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-command-palette', 'k3-dialog', 'k3-list-item', 'k3-kbd'],
      theme: { mode: 'light' },
    });

    const el = document.createElement('k3-command-palette') as HTMLElement & {
      show: () => Promise<boolean>;
      open: boolean;
      items: { value: string; label: string }[] | null;
      updateComplete: Promise<unknown>;
    };
    document.body.appendChild(el);
    await el.updateComplete;
    el.items = [{ value: 'go', label: 'Go' }];
    await el.updateComplete;

    const dialog = el.shadowRoot?.querySelector('k3-dialog') as HTMLElement;
    await el.show();

    const selected: string[] = [];
    el.addEventListener('k3-command-select', ((e: CustomEvent<{ value: string }>) => {
      selected.push(e.detail.value);
    }) as EventListener);

    const row = dialog
      ?.querySelector('.k3-cp__results')
      ?.querySelector('k3-list-item') as HTMLElement | null;
    expect(row).toBeTruthy();
    row!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await new Promise((r) => setTimeout(r, 400));

    expect(selected).toEqual(['go']);
    expect(el.open).toBe(false);
    el.remove();
  });
});
