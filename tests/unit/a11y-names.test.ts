import { beforeAll, describe, expect, it, vi } from 'vitest';
import { init } from '../../src/index.js';
import { themeApi } from '../../src/theme/apply.js';

type LitEl = HTMLElement & { updateComplete: Promise<unknown> };

async function mount<T extends LitEl>(html: string): Promise<T> {
  const box = document.createElement('div');
  box.innerHTML = html;
  document.body.append(box);
  const el = box.firstElementChild as T;
  await el.updateComplete;
  return el;
}

beforeAll(async () => {
  window.K3UI_MANUAL = true;
  await init({
    components: ['k3-button', 'k3-fab', 'k3-icon-button', 'k3-select', 'k3-menu-item', 'k3-list', 'k3-list-item', 'k3-quote', 'k3-text-field', 'k3-slider', 'k3-alert'],
    theme: { mode: 'light' },
  });
});

describe('host ARIA reaches the focusable control', () => {
  it.each(['k3-button', 'k3-fab', 'k3-icon-button'])('%s forwards aria-label / expanded / haspopup, live', async (tag) => {
    const el = await mount<LitEl>(`<${tag} aria-label="Like" aria-haspopup="menu" aria-expanded="false"><span slot="icon">x</span></${tag}>`);
    const btn = el.shadowRoot!.querySelector('button')!;
    expect(btn.getAttribute('aria-label')).toBe('Like');
    expect(btn.getAttribute('aria-haspopup')).toBe('menu');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    el.setAttribute('aria-label', 'Unlike');
    el.setAttribute('aria-expanded', 'true');
    await el.updateComplete;
    expect(btn.getAttribute('aria-label')).toBe('Unlike');
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    el.remove();
  });

  it('k3-slider names its handle from the host aria-label without showing a label', async () => {
    const el = await mount<LitEl>('<k3-slider aria-label="Volume" value="5" min="0" max="10"></k3-slider>');
    expect(el.shadowRoot!.querySelector('[role="slider"]')!.getAttribute('aria-label')).toBe('Volume');
    expect(el.shadowRoot!.querySelector('.label-text')?.textContent?.trim() ?? '').toBe('');
    el.remove();
  });

  it('k3-text-field names its inner input with the label', async () => {
    const el = await mount<LitEl>('<k3-text-field label="Email"></k3-text-field>');
    expect(el.shadowRoot!.querySelector('input')!.getAttribute('aria-label')).toBe('Email');
    el.remove();
  });
});

describe('ARIA structure', () => {
  it('k3-select items are options of its listbox', async () => {
    const el = await mount<LitEl>('<k3-select label="Fruit"><k3-menu-item value="a">A</k3-menu-item></k3-select>');
    const item = el.querySelector('k3-menu-item') as LitEl;
    await item.updateComplete;
    const inner = item.shadowRoot!.querySelector('[part="container"]')!;
    expect(el.shadowRoot!.querySelector('[role="listbox"]')).not.toBeNull();
    expect(inner.getAttribute('role')).toBe('option');
    expect(inner.hasAttribute('aria-checked')).toBe(false);
    expect(inner.getAttribute('aria-selected')).toMatch(/true|false/);
    el.remove();
  });

  it('k3-list carries its role and name on the container that holds the items', async () => {
    const el = await mount<LitEl>('<k3-list label="Tasks" selection="multiple"><k3-list-item>One</k3-list-item></k3-list>');
    const box = el.shadowRoot!.querySelector('[part="container"]')!;
    expect(box.getAttribute('role')).toBe('listbox');
    expect(box.getAttribute('aria-multiselectable')).toBe('true');
    expect(box.getAttribute('aria-label')).toBe('Tasks');
    expect(el.hasAttribute('role')).toBe(false);
    el.remove();
  });

  it('k3-quote accepts job-title (legacy role attribute still works)', async () => {
    const a = await mount<LitEl>('<k3-quote author="A" job-title="Designer">Hi</k3-quote>');
    expect(a.shadowRoot!.textContent).toContain('Designer');
    const b = await mount<LitEl>('<k3-quote author="B" role="Engineer">Hi</k3-quote>');
    expect(b.shadowRoot!.textContent).toContain('Engineer');
    a.remove();
    b.remove();
  });

  it('k3-alert status container is not an <aside> (role not allowed there)', async () => {
    const el = await mount<LitEl>('<k3-alert variant="info" label="Info">Hi</k3-alert>');
    const base = el.shadowRoot!.querySelector('.base')!;
    expect(base.localName).toBe('div');
    expect(base.getAttribute('role')).toBe('status');
    el.remove();
  });

});

describe('startup under fake timers', () => {
  it('init() and theme.prepare() never wait on setTimeout', async () => {
    vi.useFakeTimers();
    try {
      await themeApi.prepare({ seed: '#123456', mode: 'dark' });
      await init({ theme: { seed: '#123456' } });
      expect(themeApi.getLastOptions().seed).toBe('#123456');
    } finally {
      vi.useRealTimers();
    }
  });
});
