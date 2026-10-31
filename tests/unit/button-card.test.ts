import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import '../../src/components/actions/button-card.js';
import type { K3ButtonCard } from '../../src/components/actions/button-card.js';

describe('k3-button-card', () => {
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

  it('renders label and subtitle', async () => {
    host.innerHTML = `<k3-button-card label="Alpha" subtitle="@handle" icon="share"></k3-button-card>`;
    const el = host.querySelector('k3-button-card') as K3ButtonCard;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.label')?.textContent).toBe('Alpha');
    expect(el.shadowRoot!.querySelector('.subtitle')?.textContent).toBe('@handle');
    expect(el.shadowRoot!.querySelector('[data-k3-icon="share"]')).toBeTruthy();
    expect(el.shadowRoot!.querySelector('button.card')).toBeTruthy();
  });

  it('uses an anchor when href is set', async () => {
    host.innerHTML = `<k3-button-card label="Beta" href="https://example.com" external></k3-button-card>`;
    const el = host.querySelector('k3-button-card') as K3ButtonCard;
    await el.updateComplete;
    const a = el.shadowRoot!.querySelector('a.card') as HTMLAnchorElement;
    expect(a).toBeTruthy();
    expect(a.getAttribute('href')).toBe('https://example.com');
    expect(a.getAttribute('target')).toBe('_blank');
  });

  it('emits k3-activate on click', async () => {
    host.innerHTML = `<k3-button-card label="Gamma" subtitle="@x"></k3-button-card>`;
    const el = host.querySelector('k3-button-card') as K3ButtonCard;
    await el.updateComplete;
    const spy = vi.fn();
    el.addEventListener('k3-activate', spy);
    el.shadowRoot!.querySelector('button.card')!.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    expect(spy).toHaveBeenCalled();
    const detail = spy.mock.calls[0]![0].detail;
    expect(detail.label).toBe('Gamma');
    expect(detail.subtitle).toBe('@x');
  });

  it('projects icon slot', async () => {
    host.innerHTML = `<k3-button-card label="Delta">
      <svg slot="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle></svg>
    </k3-button-card>`;
    const el = host.querySelector('k3-button-card') as K3ButtonCard;
    await el.updateComplete;
    await el.updateComplete;
    const iconHost = el.shadowRoot!.querySelector('.icon') as HTMLElement;
    expect(iconHost.hidden).toBe(false);
    expect(el.querySelector('svg[slot="icon"]')).toBeTruthy();
  });
});
