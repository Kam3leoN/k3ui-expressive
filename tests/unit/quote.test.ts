import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import '../../src/components/containment/quote.js';
import type { K3Quote } from '../../src/components/containment/quote.js';

describe('k3-quote', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({ components: [], theme: { mode: 'light' } });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('defaults tilt on and reflects the attribute', async () => {
    host.innerHTML = `<k3-quote author="Alex">Hello</k3-quote>`;
    const el = host.querySelector('k3-quote') as K3Quote;
    await el.updateComplete;
    expect(el.tilt).toBe(true);
    expect(el.hasAttribute('tilt')).toBe(true);
    expect(el.shadowRoot!.querySelector('.wrap')?.getAttribute('role')).toBe('figure');
  });

  it('disables tilt with tilt="false"', async () => {
    host.innerHTML = `<k3-quote tilt="false" author="Sam">Flat</k3-quote>`;
    const el = host.querySelector('k3-quote') as K3Quote;
    await el.updateComplete;
    expect(el.tilt).toBe(false);
    expect(el.getAttribute('tilt')).toBe('false');
  });

  it('renders author and role (job) from attributes', async () => {
    host.innerHTML = `<k3-quote author="Rodrigo" role="Python educator">Cite me</k3-quote>`;
    const el = host.querySelector('k3-quote') as K3Quote;
    await el.updateComplete;
    expect(el.job).toBe('Python educator');
    const name = el.shadowRoot!.querySelector('.author__name');
    const jobEl = el.shadowRoot!.querySelector('.author__role');
    expect(name?.textContent?.trim()).toBe('Rodrigo');
    expect(jobEl?.textContent?.trim()).toBe('Python educator');
    expect(el.textContent).toContain('Cite me');
  });

  it('prefers author and role slots over properties', async () => {
    host.innerHTML = `<k3-quote author="Prop" role="PropRole">
      <span slot="author">Slot Author</span>
      <span slot="role">Slot Role</span>
      Body
    </k3-quote>`;
    const el = host.querySelector('k3-quote') as K3Quote;
    await el.updateComplete;
    await el.updateComplete;
    const nameSlot = el.shadowRoot!.querySelector(
      'slot[name="author"]',
    ) as HTMLSlotElement;
    const roleSlot = el.shadowRoot!.querySelector(
      'slot[name="role"]',
    ) as HTMLSlotElement;
    expect(
      nameSlot
        .assignedNodes({ flatten: true })
        .some((n) => n.textContent?.includes('Slot Author')),
    ).toBe(true);
    expect(
      roleSlot
        .assignedNodes({ flatten: true })
        .some((n) => n.textContent?.includes('Slot Role')),
    ).toBe(true);
  });

  it('shows action slot and avatar slot hosts', async () => {
    host.innerHTML = `<k3-quote author="A">
      <span slot="avatar">🙂</span>
      Quote text
      <k3-button slot="action" variant="text" size="sm">Read more</k3-button>
    </k3-quote>`;
    const el = host.querySelector('k3-quote') as K3Quote;
    await el.updateComplete;
    await el.updateComplete;
    const avatarHost = el.shadowRoot!.querySelector('.author__avatar') as HTMLElement;
    const actionHost = el.shadowRoot!.querySelector('.quote__action') as HTMLElement;
    expect(avatarHost.hidden).toBe(false);
    expect(actionHost.hidden).toBe(false);
    expect(el.querySelector('k3-button[slot="action"]')?.textContent).toContain('Read more');
  });

  it('setTilt updates reflection', async () => {
    host.innerHTML = `<k3-quote>Hi</k3-quote>`;
    const el = host.querySelector('k3-quote') as K3Quote;
    await el.updateComplete;
    el.setTilt(false);
    await el.updateComplete;
    expect(el.tilt).toBe(false);
    expect(el.getAttribute('tilt')).toBe('false');
  });

  it('exposes motion layer and SVG mark with currentColor fill', async () => {
    host.innerHTML = `<k3-quote author="A">Hi</k3-quote>`;
    const el = host.querySelector('k3-quote') as K3Quote;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.motion')).toBeTruthy();
    const mark = el.shadowRoot!.querySelector('.card > svg.mark') as SVGElement | null;
    expect(mark).toBeTruthy();
    expect(mark?.getAttribute('viewBox')).toBe('0 0 46 38');
    const path = mark?.querySelector('path');
    expect(path?.getAttribute('fill')).toBe('currentColor');
  });

  it('defaults layout author-start and supports author-end', async () => {
    host.innerHTML = `<k3-quote author="A">Hi</k3-quote>`;
    const el = host.querySelector('k3-quote') as K3Quote;
    await el.updateComplete;
    expect(el.layout).toBe('author-start');
    el.setLayout('author-end');
    await el.updateComplete;
    expect(el.layout).toBe('author-end');
    expect(el.getAttribute('layout')).toBe('author-end');
  });

  it('resolves tilt-dir auto to ccw or cw without changing magnitude', async () => {
    host.innerHTML = `<k3-quote author="A" tilt>Hi</k3-quote>`;
    const el = host.querySelector('k3-quote') as K3Quote;
    await el.updateComplete;
    expect(['ccw', 'cw']).toContain(el.tiltDir);
    expect(el.getAttribute('tilt-dir')).toMatch(/^(ccw|cw)$/);
  });

  it('honors explicit tilt-dir', async () => {
    host.innerHTML = `<k3-quote author="A" tilt tilt-dir="cw">Hi</k3-quote>`;
    const el = host.querySelector('k3-quote') as K3Quote;
    await el.updateComplete;
    expect(el.tiltDir).toBe('cw');
  });
});
