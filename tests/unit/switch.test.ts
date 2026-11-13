import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../src/components/inputs/switch.js';
import type { K3Switch } from '../../src/components/inputs/switch.js';

describe('k3-switch', () => {
  let el: K3Switch;

  beforeEach(async () => {
    el = document.createElement('k3-switch') as K3Switch;
    el.textContent = 'Wi‑Fi';
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  it('registers and toggles selected', async () => {
    expect(customElements.get('k3-switch')).toBeTruthy();
    expect(el.selected).toBe(false);
    el.shadowRoot?.querySelector<HTMLButtonElement>('.track')?.click();
    await el.updateComplete;
    expect(el.selected).toBe(true);
    expect(el.getAttribute('selected')).toBe('');
  });

  it('icons shows close when off and check when on', async () => {
    el.icons = true;
    await el.updateComplete;
    const icon = el.shadowRoot?.querySelector('[part="icon"]');
    expect(icon?.getAttribute('data-k3-icon')).toBe('close');
    el.selected = true;
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('[part="icon"]')?.getAttribute('data-k3-icon')).toBe(
      'check',
    );
  });

  it('variant=status reflects on the host', async () => {
    el.variant = 'status';
    await el.updateComplete;
    expect(el.getAttribute('variant')).toBe('status');
    el.selected = true;
    await el.updateComplete;
    expect(el.hasAttribute('selected')).toBe(true);
  });

  it('does not render a handle icon without icons', async () => {
    expect(el.shadowRoot?.querySelector('[part="icon"]')).toBeNull();
  });
});
