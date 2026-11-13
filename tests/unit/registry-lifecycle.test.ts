import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { init } from '../../src/index.js';
import { catalog } from '../../src/registry/catalog.js';
import { COMPONENT_DEPS } from '../../src/registry/deps.js';
import { isKnown, isRegistered, register, registerAll, registry } from '../../src/registry/register.js';

describe('registry lifecycle — destroy / recreate', () => {
  beforeAll(async () => {
    window.K3UI_MANUAL = true;
    await init({ components: [], theme: { mode: 'light' } });
  });

  afterEach(() => {
    document.getElementById('reg-life-host')?.remove();
  });

  it('register → mount → remove → remount keeps a working custom element', async () => {
    await register('k3-badge');
    expect(isRegistered('k3-badge')).toBe(true);

    const host = document.createElement('div');
    host.id = 'reg-life-host';
    document.body.append(host);

    const mount = async () => {
      const el = document.createElement('k3-badge') as HTMLElement & { updateComplete: Promise<unknown> };
      el.textContent = '3';
      host.replaceChildren(el);
      await el.updateComplete;
      return el;
    };

    const a = await mount();
    expect(a.isConnected).toBe(true);
    expect(a.shadowRoot).toBeTruthy();
    a.remove();
    expect(host.childElementCount).toBe(0);

    const b = await mount();
    expect(b.isConnected).toBe(true);
    expect(b.shadowRoot).toBeTruthy();
    expect(b.textContent).toBe('3');
  });

  it('registerAll(deps graph) defines every listed child tag', async () => {
    const parent = 'k3-dialog';
    await registerAll([parent]);
    for (const dep of COMPONENT_DEPS[parent] ?? []) {
      expect(customElements.get(dep), dep).toBeTruthy();
      expect(isKnown(dep)).toBe(true);
    }
  });

  it('registry.tags grows monotonically as components are defined', async () => {
    const before = registry.tags.length;
    await register('k3-divider');
    expect(registry.tags.length).toBeGreaterThanOrEqual(before);
    expect(registry.tags).toContain('k3-divider');
  });

  it('every catalog tag is known to the registry', () => {
    for (const { tag } of catalog) {
      expect(isKnown(tag), tag).toBe(true);
    }
  });
});
