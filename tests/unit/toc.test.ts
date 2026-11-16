import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import '../../src/components/navigation/toc.js';
import type { K3Toc } from '../../src/components/navigation/toc.js';
import { parseTocItems, tocHrefToId } from '../../src/components/navigation/toc.specs.js';

describe('toc.specs', () => {
  it('parses items JSON with levels', () => {
    const items = parseTocItems(
      '[{"text":"A","href":"#a"},{"text":"B","href":"#b","level":2}]',
    );
    expect(items).toEqual([
      { text: 'A', href: '#a' },
      { text: 'B', href: '#b', level: 2 },
    ]);
  });

  it('tocHrefToId reads hash targets', () => {
    expect(tocHrefToId('#examples')).toBe('examples');
    expect(tocHrefToId('/docs#states')).toBe('states');
    expect(tocHrefToId('')).toBeNull();
  });
});

describe('k3-toc', () => {
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

  it('mounts items from JSON and marks sticky', async () => {
    host.innerHTML = `<k3-toc
      sticky
      items='[{"text":"Examples","href":"#ex"},{"text":"States","href":"#st","level":2}]'
    ></k3-toc>`;
    const el = host.querySelector('k3-toc') as K3Toc;
    await el.updateComplete;
    expect(el.hasAttribute('sticky')).toBe(true);
    const links = el.shadowRoot!.querySelectorAll('a.link');
    expect(links.length).toBe(2);
    expect(links[0]!.textContent).toContain('Examples');
    expect(links[1]!.classList.contains('link--level-2')).toBe(true);
  });

  it('sets aria-current on the first item by default', async () => {
    host.innerHTML = `<k3-toc
      items='[{"text":"One","href":"#one"},{"text":"Two","href":"#two"}]'
    ></k3-toc>`;
    const el = host.querySelector('k3-toc') as K3Toc;
    await el.updateComplete;
    const current = el.shadowRoot!.querySelector('[aria-current="location"]');
    expect(current?.textContent).toContain('One');
  });

  it('emits k3-select when an entry is clicked', async () => {
    host.innerHTML = `<div>
      <h2 id="two">Two</h2>
      <k3-toc
        items='[{"text":"One","href":"#one"},{"text":"Two","href":"#two"}]'
      ></k3-toc>
    </div>`;
    const el = host.querySelector('k3-toc') as K3Toc;
    await el.updateComplete;
    const onSelect = vi.fn();
    el.addEventListener('k3-select', onSelect as EventListener);
    const anchors = el.shadowRoot!.querySelectorAll('a.link');
    (anchors[1] as HTMLAnchorElement).click();
    await el.updateComplete;
    expect(onSelect).toHaveBeenCalledTimes(1);
    const detail = (onSelect.mock.calls[0][0] as CustomEvent).detail as {
      index: number;
      item: { text: string };
    };
    expect(detail.index).toBe(1);
    expect(detail.item.text).toBe('Two');
    expect(
      el.shadowRoot!.querySelector('[aria-current="location"]')?.textContent,
    ).toContain('Two');
  });
});
