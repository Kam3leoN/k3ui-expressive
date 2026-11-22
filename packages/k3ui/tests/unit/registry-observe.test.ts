import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { init } from '../../src/index.js';
import { COMPONENT_DEPS } from '../../src/registry/deps.js';
import { observe, registerPresent, registry } from '../../src/registry/register.js';

/** MutationObserver callbacks are microtasks — let them and the loaders run. */
const settle = async (handle: { ready: Promise<void> }): Promise<void> => {
  await Promise.resolve();
  await handle.ready;
};

describe('registry — on-demand registration', () => {
  let host: HTMLElement;

  beforeAll(async () => {
    window.K3UI_MANUAL = true;
    await init({ components: [], theme: { mode: 'light' } });
  });

  afterEach(() => {
    host?.remove();
  });

  const mount = (html: string): HTMLElement => {
    host = document.createElement('div');
    host.innerHTML = html;
    document.body.append(host);
    return host;
  };

  it('registerPresent defines what the subtree uses — and nothing else', async () => {
    mount('<k3-divider></k3-divider><x-foreign></x-foreign>');
    const tags = await registerPresent(host);
    expect(tags).toEqual(['k3-divider']);
    expect(customElements.get('k3-divider')).toBeTruthy();
    expect(customElements.get('k3-pagination')).toBeUndefined();
    expect(customElements.get('x-foreign')).toBeUndefined();
  });

  it('observe defines present elements, then the ones added later', async () => {
    mount('<k3-badge>1</k3-badge>');
    const handle = observe(host);
    await handle.ready;
    expect(customElements.get('k3-badge')).toBeTruthy();

    expect(customElements.get('k3-breadcrumb')).toBeUndefined();
    host.insertAdjacentHTML('beforeend', '<section><k3-breadcrumb></k3-breadcrumb></section>');
    await settle(handle);
    expect(customElements.get('k3-breadcrumb')).toBeTruthy();
    handle.disconnect();
  });

  it('brings the children a component renders (select → text field + menu)', async () => {
    mount('');
    const handle = observe(host);
    host.append(document.createElement('k3-select'));
    await settle(handle);
    for (const dep of COMPONENT_DEPS['k3-select']!) {
      expect(customElements.get(dep), dep).toBeTruthy();
    }
    expect(customElements.get('k3-select')).toBeTruthy();
    handle.disconnect();
  });

  it('returns the same handle for a root and stops after disconnect', async () => {
    mount('');
    const handle = observe(host);
    expect(observe(host)).toBe(handle);
    handle.disconnect();
    host.append(document.createElement('k3-scroll-to-top'));
    await settle(handle);
    expect(customElements.get('k3-scroll-to-top')).toBeUndefined();
    /* A new observer picks up what was missed. */
    const again = observe(host);
    expect(again).not.toBe(handle);
    await again.ready;
    expect(customElements.get('k3-scroll-to-top')).toBeTruthy();
    again.disconnect();
  });

  it('ignores unknown tags, text nodes and hostile markup', async () => {
    mount('');
    const handle = observe(host);
    host.append('plain text', document.createComment('k3-dialog'));
    host.insertAdjacentHTML('beforeend', '<k3-not-a-thing></k3-not-a-thing><constructor-x></constructor-x>');
    await settle(handle);
    expect(customElements.get('k3-not-a-thing')).toBeUndefined();
    expect(customElements.get('constructor-x')).toBeUndefined();
    handle.disconnect();
  });

  it('handles a burst of insertions and remounts (stress)', async () => {
    mount('');
    const handle = observe(host);
    for (let i = 0; i < 200; i++) {
      const el = document.createElement(i % 2 ? 'k3-alert' : 'k3-avatar');
      host.append(el);
      if (i % 3 === 0) el.remove();
    }
    await settle(handle);
    expect(customElements.get('k3-alert')).toBeTruthy();
    expect(customElements.get('k3-avatar')).toBeTruthy();
    host.replaceChildren();
    host.append(document.createElement('k3-alert'));
    await settle(handle);
    expect(host.querySelector('k3-alert')!.shadowRoot).toBeTruthy();
    handle.disconnect();
  });

  it("init({ components: 'auto' }) defines the page's elements and keeps watching", async () => {
    mount('<k3-counter></k3-counter>');
    await init({ components: 'auto' });
    expect(customElements.get('k3-counter')).toBeTruthy();
    expect(registry.tags).toContain('k3-counter');

    const handle = registry.observe(document);
    host.append(document.createElement('k3-pin-field'));
    await settle(handle);
    expect(customElements.get('k3-pin-field')).toBeTruthy();
    handle.disconnect();
  });

  it('rejects an invalid components mode with a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await init({ components: 'automatic' as unknown as 'auto' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"components"'));
    warn.mockRestore();
  });
});
