import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { init } from '../../src/index.js';
import {
  PACK_BUILDER_URL,
  isDevHost,
  rebuildUrl,
  resetMissingComponents,
  setMissingComponentsMode,
  type MissingComponentDetail,
} from '../../src/registry/missing.js';
import { observe, register, registerAll, registry } from '../../src/registry/register.js';

const PACK = ['k3-divider', 'k3-badge'];
const settle = async (handle: { ready: Promise<void> }): Promise<void> => {
  await Promise.resolve();
  await handle.ready;
};

describe('custom pack — missing component guard', () => {
  let host: HTMLElement;
  let error: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    window.K3UI_MANUAL = true;
    await init({ components: [], theme: { mode: 'light' } });
  });

  beforeEach(() => {
    globalThis.K3UI_PACK = { name: 'shop', version: '1.0.0', components: PACK };
    error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => {
    host.remove();
    error.mockRestore();
    resetMissingComponents();
    delete globalThis.K3UI_PACK;
  });

  it('a full build has nothing missing', () => {
    delete globalThis.K3UI_PACK;
    expect(registry.isPartial()).toBe(false);
    expect(registry.isKnown('k3-select')).toBe(true);
    expect(registry.isMissing('k3-select')).toBe(false);
  });

  it('knows what the pack holds', () => {
    expect(registry.isPartial()).toBe(true);
    expect(registry.isKnown('k3-divider')).toBe(true);
    expect(registry.isKnown('k3-select')).toBe(false);
    expect(registry.isMissing('k3-select')).toBe(true);
    /* Not a K3UI element at all: neither known nor missing */
    expect(registry.isMissing('x-foreign')).toBe(false);
  });

  it("registerAll('all') defines the pack only — silently", async () => {
    await registerAll('all');
    expect(customElements.get('k3-divider')).toBeTruthy();
    expect(customElements.get('k3-index-list')).toBeUndefined();
    expect(registry.missing).toEqual([]);
    expect(error).not.toHaveBeenCalled();
  });

  it('reports an element used on the page, once, with the rebuild link', async () => {
    const events: MissingComponentDetail[] = [];
    const onMissing = (e: Event): void => void events.push((e as CustomEvent<MissingComponentDetail>).detail);
    document.addEventListener('k3-missing-component', onMissing);
    setMissingComponentsMode('console');

    const handle = observe(host);
    host.innerHTML = '<k3-index-list></k3-index-list><k3-index-list></k3-index-list><x-foreign></x-foreign>';
    await settle(handle);
    host.append(document.createElement('k3-index-list'));
    await settle(handle);
    handle.disconnect();
    document.removeEventListener('k3-missing-component', onMissing);

    expect(customElements.get('k3-index-list')).toBeUndefined();
    expect(registry.missing).toEqual(['k3-index-list']);
    expect(error).toHaveBeenCalledTimes(1);
    const url = `${PACK_BUILDER_URL}?components=divider+badge+index-list#/pack`;
    expect(error.mock.calls[0]![0]).toContain('<k3-index-list>');
    expect(error.mock.calls[0]![0]).toContain(url);
    expect(events).toEqual([{ tag: 'k3-index-list', missing: ['k3-index-list'], rebuildUrl: url }]);
    /* console mode: nothing on the page */
    expect(document.querySelector('[data-k3-missing]')).toBeNull();
  });

  it('an explicit register() of a missing tag reports instead of throwing', async () => {
    setMissingComponentsMode('silent');
    await expect(register('k3-pagination-alpha')).resolves.toBeUndefined();
    expect(registry.missing).toEqual(['k3-pagination-alpha']);
    expect(error).not.toHaveBeenCalled();
  });

  it('overlay mode shows a dismissible banner and outlines the elements', async () => {
    setMissingComponentsMode('overlay');
    const handle = observe(host);
    host.innerHTML = '<k3-footer-bar></k3-footer-bar>';
    await settle(handle);
    host.insertAdjacentHTML('beforeend', '<k3-bottom-app-bar></k3-bottom-app-bar>');
    await settle(handle);
    handle.disconnect();

    const banner = document.querySelector<HTMLElement>('div[data-k3-missing]')!;
    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.textContent).toContain('<k3-footer-bar>, <k3-bottom-app-bar>');
    expect(banner.querySelector('a')!.href).toBe(
      `${PACK_BUILDER_URL}?components=divider+badge+footer-bar+bottom-app-bar#/pack`,
    );
    expect(document.querySelectorAll('div[data-k3-missing]')).toHaveLength(1);
    expect(document.querySelector('style[data-k3-missing]')!.textContent).toContain('k3-footer-bar:not(:defined)');

    banner.querySelector('button')!.click();
    expect(document.querySelector('[data-k3-missing]')).toBeNull();
  });

  it("init({ missingComponents }) switches the mode; 'auto' follows the host", async () => {
    await init({ missingComponents: 'overlay' });
    await register('k3-nav-bar');
    expect(document.querySelector('div[data-k3-missing]')).toBeTruthy();
    await init({ missingComponents: 'console' });
    expect(document.querySelector('div[data-k3-missing]')).toBeNull();

    expect(isDevHost({ hostname: 'localhost', protocol: 'http:' })).toBe(true);
    expect(isDevHost({ hostname: '192.168.1.20', protocol: 'http:' })).toBe(true);
    expect(isDevHost({ hostname: 'shop.test', protocol: 'https:' })).toBe(true);
    expect(isDevHost({ hostname: '', protocol: 'file:' })).toBe(true);
    expect(isDevHost({ hostname: 'k3ui.dev', protocol: 'https:' })).toBe(false);
    expect(isDevHost({ hostname: '172.15.0.1', protocol: 'https:' })).toBe(false);
  });

  it('ignores a hostile pack description', () => {
    globalThis.K3UI_PACK = { components: 'k3-select' } as never;
    expect(registry.isPartial()).toBe(false);
    globalThis.K3UI_PACK = {
      components: ['k3-divider', '<img src=x onerror=alert(1)>', 42 as never],
      builder: 'javascript:alert(1)',
    };
    expect(rebuildUrl(['k3-tabs', '"><script>'])).toBe(
      `${PACK_BUILDER_URL}?components=divider+tabs#/pack`,
    );
    globalThis.K3UI_PACK = { components: ['k3-divider'], builder: 'https://docs.example.org/#old' };
    expect(rebuildUrl([])).toBe('https://docs.example.org/?components=divider#/pack');
  });
});
