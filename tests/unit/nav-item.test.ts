import { describe, expect, it, beforeAll } from 'vitest';
import { K3NavItem } from '../../src/components/navigation/nav-item.js';

beforeAll(() => {
  if (!customElements.get('k3-nav-item')) {
    customElements.define('k3-nav-item', K3NavItem);
  }
});

describe('k3-nav-item badge', () => {
  it('hides badge when empty', async () => {
    const el = document.createElement('k3-nav-item') as K3NavItem;
    el.icon = 'widgets';
    el.label = 'Components';
    document.body.appendChild(el);
    await el.updateComplete;
    const badge = el.shadowRoot?.querySelector('.badge');
    expect(badge?.hasAttribute('hidden')).toBe(true);
    el.remove();
  });

  it('shows count badge on the indicator pill', async () => {
    const el = document.createElement('k3-nav-item') as K3NavItem;
    el.icon = 'widgets';
    el.label = 'Components';
    el.badge = '42';
    document.body.appendChild(el);
    await el.updateComplete;
    const shell = el.shadowRoot?.querySelector('.shell');
    const badge = el.shadowRoot?.querySelector('.badge');
    expect(badge?.hasAttribute('hidden')).toBe(false);
    expect(badge?.textContent).toBe('42');
    expect(badge?.parentElement).toBe(shell);
    /* Name comes from the visible content (badge + label), not an aria-label in
       another order — WCAG 2.5.3 "label in name" (axe label-content-name-mismatch). */
    const item = el.shadowRoot?.querySelector('.item');
    expect(item?.hasAttribute('aria-label')).toBe(false);
    const visible = (item?.textContent ?? '').replace(/\s+/g, ' ');
    expect(visible).toContain('42');
    expect(visible).toContain('Components');
    el.remove();
  });

  it('caps numeric badge above 999', async () => {
    const el = document.createElement('k3-nav-item') as K3NavItem;
    el.badge = '1200';
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('.badge')?.textContent).toBe('999+');
    el.remove();
  });
});
