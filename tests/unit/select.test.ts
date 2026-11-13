import { describe, expect, it } from 'vitest';
import { init } from '../../src/index.js';

type LitEl = HTMLElement & { updateComplete: Promise<unknown> };

async function mount<T extends LitEl>(html: string): Promise<T> {
  await init({
    components: ['k3-select', 'k3-menu', 'k3-menu-item', 'k3-text-field'],
    theme: { mode: 'light' },
  });
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  const el = wrap.firstElementChild as T;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

describe('k3-select + k3-menu', () => {
  it('hosts a match-width listbox menu flush with the field', async () => {
    const el = await mount<
      LitEl & { open: boolean; show: () => Promise<boolean>; value: string }
    >(
      `<k3-select label="Fruit" value="a" style="width: 280px">
        <k3-menu-item value="a">Apple</k3-menu-item>
        <k3-menu-item value="b">Banana</k3-menu-item>
      </k3-select>`,
    );
    const menu = el.shadowRoot!.querySelector('k3-menu') as LitEl & {
      matchWidth: boolean;
      panelRole: string;
      open: boolean;
    };
    await menu.updateComplete;
    expect(menu.matchWidth).toBe(true);
    expect(menu.panelRole).toBe('listbox');
    expect(menu.hasAttribute('match-width')).toBe(true);

    await el.show();
    await menu.updateComplete;
    expect(el.open).toBe(true);
    expect(menu.open).toBe(true);

    const panel = menu.shadowRoot!.querySelector('.panel') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('listbox');
    expect(panel.hasAttribute('data-fitted')).toBe(true);
    /* match-width writes inline width/minWidth from the trigger rect */
    expect(panel.style.width).toMatch(/^\d+px$/);
    expect(panel.style.minWidth).toBe(panel.style.width);

    el.remove();
  });

  it('flips the open attribute (chevron) on open-start, not after motion', async () => {
    const el = await mount<
      LitEl & { open: boolean; show: () => Promise<boolean> }
    >(
      `<k3-select label="Fruit" value="a">
        <k3-menu-item value="a">Apple</k3-menu-item>
        <k3-menu-item value="b">Banana</k3-menu-item>
      </k3-select>`,
    );
    const menu = el.shadowRoot!.querySelector('k3-menu') as LitEl;
    let sawOpenAttr = false;
    menu.addEventListener('k3-open-start', () => {
      /* Same turn as open-start — attribute must already be on for CSS rotate */
      sawOpenAttr = el.hasAttribute('open');
    });
    const showPromise = el.show();
    await Promise.resolve();
    expect(sawOpenAttr || el.hasAttribute('open')).toBe(true);
    await showPromise;
    expect(el.open).toBe(true);
    expect(el.hasAttribute('open')).toBe(true);
    el.remove();
  });

  it('updates value from menu item select', async () => {
    const el = await mount<LitEl & { value: string; open: boolean }>(
      `<k3-select label="Fruit" value="a">
        <k3-menu-item value="a">Apple</k3-menu-item>
        <k3-menu-item value="b">Banana</k3-menu-item>
      </k3-select>`,
    );
    const banana = el.querySelector('k3-menu-item[value="b"]') as LitEl & {
      clickItem?: () => void;
    };
    await banana.updateComplete;
    const btn = banana.shadowRoot!.querySelector('[part="container"]') as HTMLElement;
    btn.click();
    await el.updateComplete;
    expect(el.value).toBe('b');
    el.remove();
  });
});
