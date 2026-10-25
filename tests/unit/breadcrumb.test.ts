import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import '../../src/components/navigation/breadcrumb.js';
import type { K3Breadcrumb } from '../../src/components/navigation/breadcrumb.js';

describe('k3-breadcrumb', () => {
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

  it('mounts items from JSON attribute', async () => {
    host.innerHTML = `<k3-breadcrumb
      items='[{"text":"Home","href":"/"},{"text":"Page","current":true}]'
    ></k3-breadcrumb>`;
    const el = host.querySelector('k3-breadcrumb') as K3Breadcrumb;
    await el.updateComplete;
    const links = el.shadowRoot!.querySelectorAll('.breadcrumb__link');
    expect(links.length).toBe(2);
    expect(el.shadowRoot!.querySelector('[aria-current="page"]')?.textContent).toContain(
      'Page',
    );
  });

  it('emits k3-select when a non-current crumb is clicked', async () => {
    host.innerHTML = `<k3-breadcrumb
      items='[{"text":"Home","href":"/"},{"text":"Docs","href":"/docs"},{"text":"Here","current":true}]'
    ></k3-breadcrumb>`;
    const el = host.querySelector('k3-breadcrumb') as K3Breadcrumb;
    await el.updateComplete;
    const onSelect = vi.fn();
    el.addEventListener('k3-select', onSelect as EventListener);
    const anchor = el.shadowRoot!.querySelector(
      'a.breadcrumb__link',
    ) as HTMLAnchorElement;
    anchor.click();
    expect(onSelect).toHaveBeenCalledTimes(1);
    const detail = (onSelect.mock.calls[0][0] as CustomEvent).detail as {
      index: number;
      item: { text: string };
    };
    expect(detail.index).toBe(0);
    expect(detail.item.text).toBe('Home');
  });
});
