import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import {
  IconButtonMinTargetDp,
  IconButtonSizeDp,
  IconButtonSpecs,
  iconButtonTargetDp,
  iconButtonWidthDp,
} from '../../src/components/actions/icon-button.specs.js';
import type { K3IconButton } from '../../src/components/actions/icon-button.js';

describe('icon-button specs (M3E)', () => {
  it('matches m3.material.io icon-buttons/specs tokens', () => {
    expect(IconButtonSpecs.defaultVariant).toBe('filled');
    expect(IconButtonSpecs.defaultSize).toBe('sm');
    expect(IconButtonSpecs.defaultShape).toBe('round');
    expect(IconButtonSpecs.defaultWidth).toBe('default');
    expect(IconButtonMinTargetDp).toBe(48);

    expect(IconButtonSizeDp.xs).toMatchObject({
      container: 32,
      icon: 20,
      squareRadius: 12,
      pressedRadius: 8,
      narrowWidth: 28,
      wideWidth: 40,
    });
    expect(IconButtonSizeDp.sm).toMatchObject({
      container: 40,
      icon: 24,
      narrowWidth: 32,
      wideWidth: 52,
    });
    expect(IconButtonSizeDp.md).toMatchObject({
      container: 56,
      icon: 24,
      squareRadius: 16,
      narrowWidth: 48,
      wideWidth: 72,
    });
    expect(IconButtonSizeDp.lg).toMatchObject({
      container: 96,
      icon: 32,
      squareRadius: 28,
      narrowWidth: 64,
      wideWidth: 128,
    });
    expect(IconButtonSizeDp.xl).toMatchObject({
      container: 136,
      icon: 40,
      narrowWidth: 104,
      wideWidth: 184,
    });
  });

  it('computes width and ≥48 target for XS/S', () => {
    expect(iconButtonWidthDp('sm', 'default')).toBe(40);
    expect(iconButtonWidthDp('sm', 'narrow')).toBe(32);
    expect(iconButtonWidthDp('sm', 'wide')).toBe(52);
    expect(iconButtonTargetDp('xs', 'narrow')).toEqual({ w: 48, h: 48 });
    expect(iconButtonTargetDp('sm', 'wide')).toEqual({ w: 52, h: 48 });
    expect(iconButtonTargetDp('md', 'wide')).toEqual({ w: 72, h: 56 });
  });
});

describe('k3-icon-button', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-icon-button'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  async function mount(html: string): Promise<K3IconButton> {
    host.innerHTML = html;
    const el = host.querySelector('k3-icon-button') as K3IconButton;
    await el.updateComplete;
    return el;
  }

  it('defaults to filled · sm · round · default width', async () => {
    const el = await mount(
      `<k3-icon-button label="Edit"><span class="ms">edit</span></k3-icon-button>`,
    );
    expect(el.variant).toBe('filled');
    expect(el.size).toBe('sm');
    expect(el.shape).toBe('round');
    expect(el.width).toBe('default');
    const btn = el.shadowRoot!.querySelector('button')!;
    expect(btn.getAttribute('aria-label')).toBe('Edit');
    expect(btn.hasAttribute('aria-pressed')).toBe(false);
  });

  it('action button has no aria-pressed; toggle does', async () => {
    const action = await mount(
      `<k3-icon-button label="Search"><span class="ms">search</span></k3-icon-button>`,
    );
    expect(action.shadowRoot!.querySelector('button')!.hasAttribute('aria-pressed')).toBe(
      false,
    );

    host.innerHTML = `<k3-icon-button toggle label="Favorite"><span class="ms">favorite</span></k3-icon-button>`;
    const toggle = host.querySelector('k3-icon-button') as K3IconButton;
    await toggle.updateComplete;
    const btn = toggle.shadowRoot!.querySelector('button')!;
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('toggle click flips selected and emits k3-change', async () => {
    const el = await mount(
      `<k3-icon-button toggle label="Favorite" value="fav"><span class="ms">favorite</span></k3-icon-button>`,
    );
    const changes: unknown[] = [];
    el.addEventListener('k3-change', ((e: CustomEvent) => {
      changes.push(e.detail);
    }) as EventListener);

    const btn = el.shadowRoot!.querySelector('button')!;
    btn.click();
    await el.updateComplete;

    expect(el.selected).toBe(true);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(changes).toEqual([{ selected: true, value: 'fav' }]);

    btn.click();
    await el.updateComplete;
    expect(el.selected).toBe(false);
    expect(changes).toHaveLength(2);
  });

  it('group data-bg owns selection — click does not self-toggle', async () => {
    const el = await mount(
      `<k3-icon-button toggle label="Bold" selected><span class="ms">format_bold</span></k3-icon-button>`,
    );
    el.setAttribute('data-bg', 'only');
    await el.updateComplete;

    const btn = el.shadowRoot!.querySelector('button')!;
    btn.click();
    await el.updateComplete;
    expect(el.selected).toBe(true);
  });

  it('swaps to selected-icon slot when selected', async () => {
    const el = await mount(`
      <k3-icon-button toggle selected label="Mute">
        <span class="ms">volume_up</span>
        <span class="ms" slot="selected-icon">volume_off</span>
      </k3-icon-button>
    `);
    await el.updateComplete;
    const selected = el.shadowRoot!.querySelector('.selected-icon')!;
    expect(selected.classList.contains('has')).toBe(true);
  });

  it('reflects width / size / shape attributes', async () => {
    const el = await mount(
      `<k3-icon-button label="More" size="md" width="wide" shape="square" variant="tonal"><span class="ms">more_vert</span></k3-icon-button>`,
    );
    expect(el.getAttribute('size')).toBe('md');
    expect(el.getAttribute('width')).toBe('wide');
    expect(el.getAttribute('shape')).toBe('square');
    expect(el.getAttribute('variant')).toBe('tonal');
  });
});
