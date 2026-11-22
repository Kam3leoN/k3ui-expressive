import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import {
  ButtonPillDefaultLayout,
  ButtonPillIconDp,
  ButtonPillIndicatorHDp,
  ButtonPillIndicatorWDp,
  ButtonPillRowHDp,
} from '../../src/components/actions/button-pill.specs.js';
import type { K3ButtonPill } from '../../src/components/actions/button-pill.js';

describe('button-pill specs', () => {
  it('keeps M3 nav destination metrics', () => {
    expect(ButtonPillDefaultLayout).toBe('vertical');
    expect(ButtonPillIndicatorWDp).toBe(56);
    expect(ButtonPillIndicatorHDp).toBe(32);
    expect(ButtonPillRowHDp).toBe(56);
    expect(ButtonPillIconDp).toBe(24);
  });
});

describe('k3-button-pill', () => {
  beforeEach(async () => {
    await init({ components: ['k3-button-pill'] });
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('renders vertical: icon shell + label below', async () => {
    const el = document.createElement('k3-button-pill') as K3ButtonPill;
    el.icon = 'home';
    el.label = 'Home';
    document.body.append(el);
    await el.updateComplete;

    const shell = el.shadowRoot?.querySelector('.shell');
    const label = el.shadowRoot?.querySelector('.label');
    const icon = el.shadowRoot?.querySelector('.icon');
    expect(shell).toBeTruthy();
    expect(label?.textContent).toContain('Home');
    expect(icon?.getAttribute('data-k3-icon')).toBe('home');
    /* Label outside shell in vertical layout */
    expect(shell?.contains(label!)).toBe(false);
  });

  it('renders horizontal: label inside shell', async () => {
    const el = document.createElement('k3-button-pill') as K3ButtonPill;
    el.layout = 'horizontal';
    el.icon = 'explore';
    el.label = 'Explore';
    document.body.append(el);
    await el.updateComplete;

    const shell = el.shadowRoot?.querySelector('.shell');
    const label = el.shadowRoot?.querySelector('.label');
    expect(shell?.contains(label!)).toBe(true);
  });

  it('arms selected class on selected', async () => {
    const el = document.createElement('k3-button-pill') as K3ButtonPill;
    el.icon = 'star';
    el.label = 'Star';
    el.selected = true;
    document.body.append(el);
    await el.updateComplete;
    /* Wait microtask + rAF arm cycle */
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    await el.updateComplete;

    expect(el.shadowRoot?.querySelector('.shell.selected')).toBeTruthy();
  });

  it('emits k3-activate on click', async () => {
    const el = document.createElement('k3-button-pill') as K3ButtonPill;
    el.icon = 'home';
    el.label = 'Home';
    document.body.append(el);
    await el.updateComplete;

    const spy = vi.fn();
    el.addEventListener('k3-activate', spy);
    el.shadowRoot?.querySelector('button')?.click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('uses anchor when href is set', async () => {
    const el = document.createElement('k3-button-pill') as K3ButtonPill;
    el.icon = 'link';
    el.label = 'Link';
    el.href = '#demo';
    document.body.append(el);
    await el.updateComplete;

    expect(el.shadowRoot?.querySelector('a.item')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('button')).toBeNull();
  });
});
