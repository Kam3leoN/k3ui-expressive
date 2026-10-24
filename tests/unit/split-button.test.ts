import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import {
  SplitButtonGapDp,
  SplitButtonSizeDp,
  SplitButtonSpecs,
  splitButtonTrailPadDp,
} from '../../src/components/actions/split-button.specs.js';
import type { K3SplitButton } from '../../src/components/actions/split-button.js';

describe('split-button specs (M3E)', () => {
  it('matches m3.material.io split-button/specs tokens', () => {
    expect(SplitButtonGapDp).toBe(2);
    expect(SplitButtonSpecs.defaultSize).toBe('sm');
    expect(SplitButtonSpecs.defaultVariant).toBe('filled');
    expect(SplitButtonSizeDp.xs.height).toBe(32);
    expect(SplitButtonSizeDp.sm.height).toBe(40);
    expect(SplitButtonSizeDp.md.height).toBe(56);
    expect(SplitButtonSizeDp.lg.height).toBe(96);
    expect(SplitButtonSizeDp.xl.height).toBe(136);
    expect(SplitButtonSizeDp.xs.inner).toBe(4);
    expect(SplitButtonSizeDp.xs.innerHover).toBe(8);
    expect(SplitButtonSizeDp.sm.innerHover).toBe(12);
    expect(SplitButtonSizeDp.lg.inner).toBe(8);
    expect(SplitButtonSizeDp.xl.inner).toBe(12);
    expect(SplitButtonSizeDp.xl.innerHover).toBe(20);
  });

  it('centers trail icon pad = (H − trailIcon) / 2', () => {
    expect(splitButtonTrailPadDp('xs')).toBe(5);
    expect(splitButtonTrailPadDp('sm')).toBe(9);
    expect(splitButtonTrailPadDp('md')).toBe(15);
    expect(splitButtonTrailPadDp('lg')).toBe(29);
    expect(splitButtonTrailPadDp('xl')).toBe(43);
  });
});

describe('k3-split-button', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-split-button', 'k3-menu-item'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  async function mount(html: string): Promise<K3SplitButton> {
    host.innerHTML = html;
    const el = host.querySelector('k3-split-button') as K3SplitButton;
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    return el;
  }

  it('renders leading label + trailing menu trigger', async () => {
    const el = await mount(`
      <k3-split-button label="More">
        Save
        <k3-menu-item slot="menu" value="a">A</k3-menu-item>
        <k3-menu-item slot="menu" value="b">B</k3-menu-item>
      </k3-split-button>
    `);
    const root = el.shadowRoot!;
    const leading = root.querySelector('.leading') as HTMLElement;
    const trailing = root.querySelector('.trailing') as HTMLButtonElement;
    expect(leading).toBeTruthy();
    expect(leading.getAttribute('aria-hidden')).toBe('true');
    expect(trailing).toBeTruthy();
    expect(trailing.getAttribute('aria-haspopup')).toBe('menu');
    expect(trailing.getAttribute('aria-expanded')).toBe('false');
    expect(trailing.getAttribute('aria-label')).toBe('More');
    expect(el.getAttribute('data-leading')).toBe('label');
  });

  it('adopts slot=menu items into nested k3-menu', async () => {
    const el = await mount(`
      <k3-split-button>
        Edit
        <k3-menu-item slot="menu" value="cut">Cut</k3-menu-item>
        <k3-menu-item slot="menu" value="copy">Copy</k3-menu-item>
      </k3-split-button>
    `);
    const menu = el.shadowRoot!.querySelector('k3-menu')!;
    const items = menu.querySelectorAll('k3-menu-item');
    expect(items.length).toBe(2);
    expect(el.querySelectorAll(':scope > [slot="menu"]').length).toBe(0);
  });

  it('sets data-leading=icon when only icon slot is present', async () => {
    const el = await mount(`
      <k3-split-button label="Actions">
        <span slot="icon" class="ms">save</span>
        <k3-menu-item slot="menu" value="a">A</k3-menu-item>
        <k3-menu-item slot="menu" value="b">B</k3-menu-item>
      </k3-split-button>
    `);
    expect(el.getAttribute('data-leading')).toBe('icon');
  });

  it('leading is not a button / not focusable', async () => {
    const el = await mount(`
      <k3-split-button>
        Label
        <k3-menu-item slot="menu" value="a">A</k3-menu-item>
        <k3-menu-item slot="menu" value="b">B</k3-menu-item>
      </k3-split-button>
    `);
    const leading = el.shadowRoot!.querySelector('.leading')!;
    expect(leading.tagName).toBe('DIV');
    expect(leading.hasAttribute('tabindex')).toBe(false);
  });
});
