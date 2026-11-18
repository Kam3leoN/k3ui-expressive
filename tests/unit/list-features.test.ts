import { describe, it, expect, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing-helpers';
import '../../src/components/containment/list.js';
import '../../src/components/containment/list-item.js';
import '../../src/components/containment/divider.js';
import type { K3List } from '../../src/components/containment/list.js';
import type { K3ListItem } from '../../src/components/containment/list-item.js';

const items = (el: Element) => [...el.querySelectorAll(':scope > k3-list-item')] as K3ListItem[];

async function settle(el: K3List): Promise<void> {
  await el.updateComplete;
  for (const item of el.querySelectorAll('k3-list-item')) {
    await (item as K3ListItem).updateComplete;
  }
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  for (const item of el.querySelectorAll('k3-list-item')) {
    await (item as K3ListItem).updateComplete;
  }
}

const container = (item: K3ListItem) =>
  item.shadowRoot!.querySelector('[part="container"]') as HTMLElement;

describe('k3-list — selection', () => {
  let el: K3List;
  afterEach(() => el?.remove());

  it('multi promotes single / none to multiple', async () => {
    el = await fixture<K3List>(html`
      <k3-list multi>
        <k3-list-item value="a"><span slot="headline">A</span></k3-list-item>
        <k3-list-item value="b"><span slot="headline">B</span></k3-list-item>
      </k3-list>
    `);
    await settle(el);
    expect(el.resolvedSelection).toBe('multiple');
    expect(items(el).every((i) => i.selection === 'multiple')).toBe(true);
    const box = el.shadowRoot!.querySelector('[part="container"]')!;
    expect(box.getAttribute('role')).toBe('listbox');
    expect(box.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('value is null · string · string[]', async () => {
    el = await fixture<K3List>(html`
      <k3-list selection="multiple">
        <k3-list-item value="a"><span slot="headline">A</span></k3-list-item>
        <k3-list-item value="b"><span slot="headline">B</span></k3-list-item>
        <k3-list-item value="c" selected disabled><span slot="headline">C</span></k3-list-item>
      </k3-list>
    `);
    await settle(el);
    expect(el.value).toBeNull();
    container(items(el)[0]!).click();
    await settle(el);
    expect(el.value).toBe('a');
    container(items(el)[1]!).click();
    await settle(el);
    expect(el.value).toEqual(['a', 'b']);
  });

  it('k3-select-start is cancelable and fires select-end after the change', async () => {
    el = await fixture<K3List>(html`
      <k3-list selection="single">
        <k3-list-item value="a"><span slot="headline">A</span></k3-list-item>
        <k3-list-item value="b"><span slot="headline">B</span></k3-list-item>
      </k3-list>
    `);
    await settle(el);
    const cancel = (e: Event) => e.preventDefault();
    el.addEventListener('k3-select-start', cancel);
    container(items(el)[0]!).click();
    await settle(el);
    expect(items(el)[0]!.selected).toBe(false);
    el.removeEventListener('k3-select-start', cancel);

    const seen: string[] = [];
    for (const t of ['k3-select-start', 'k3-select', 'k3-change', 'k3-select-end']) {
      el.addEventListener(t, () => seen.push(t));
    }
    container(items(el)[1]!).click();
    await settle(el);
    expect(items(el)[1]!.selected).toBe(true);
    expect(seen).toEqual(['k3-select-start', 'k3-select', 'k3-change', 'k3-select-end']);
  });

  it('single: re-activating the selected row is not a change', async () => {
    el = await fixture<K3List>(html`
      <k3-list selection="single">
        <k3-list-item value="a" selected><span slot="headline">A</span></k3-list-item>
        <k3-list-item value="b"><span slot="headline">B</span></k3-list-item>
      </k3-list>
    `);
    await settle(el);
    let changes = 0;
    el.addEventListener('k3-change', () => changes++);
    container(items(el)[0]!).click();
    await settle(el);
    expect(items(el)[0]!.selected).toBe(true);
    expect(changes).toBe(0);
  });

  it('indicator replaces trailing content unless hidden or a control is slotted', async () => {
    el = await fixture<K3List>(html`
      <k3-list selection="multiple">
        <k3-list-item value="a">
          <span slot="headline">A</span>
          <span slot="trailing" class="ms" data-k3-icon="bookmark"></span>
        </k3-list-item>
      </k3-list>
    `);
    await settle(el);
    const item = items(el)[0]!;
    const trailing = item.shadowRoot!.querySelector('[part="trailing"]')!;
    expect(trailing.classList.contains('sel-replaces')).toBe(true);
    expect(item.shadowRoot!.querySelector('[part="selection-indicator"]')).not.toBeNull();

    el.hideSelectionIndicator = true;
    await settle(el);
    expect(trailing.classList.contains('sel-replaces')).toBe(false);
  });
});

describe('k3-list-item — action rows (href)', () => {
  let el: K3List;
  afterEach(() => el?.remove());

  it('renders a labelled link surface; the row is not a tab stop', async () => {
    el = await fixture<K3List>(html`
      <k3-list>
        <k3-list-item href="https://example.com" target="_blank" rel="noopener" download="f.txt">
          <span slot="headline">Example</span>
        </k3-list-item>
      </k3-list>
    `);
    await settle(el);
    const item = items(el)[0]!;
    const link = item.shadowRoot!.querySelector('[part="link"]') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
    expect(link.getAttribute('download')).toBe('f.txt');
    expect(link.getAttribute('aria-labelledby')).toBe('content');
    expect(container(item).hasAttribute('tabindex')).toBe(false);
    expect(item.hasAttribute('data-actionable')).toBe(true);
  });

  it('disabled link drops href', async () => {
    el = await fixture<K3List>(html`
      <k3-list>
        <k3-list-item href="/x" disabled><span slot="headline">X</span></k3-list-item>
      </k3-list>
    `);
    await settle(el);
    const link = items(el)[0]!.shadowRoot!.querySelector('[part="link"]')!;
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('aria-disabled')).toBe('true');
  });

  it('rows without href keep the previous focus model', async () => {
    el = await fixture<K3List>(html`
      <k3-list>
        <k3-list-item interactive><span slot="headline">A</span></k3-list-item>
        <k3-list-item><span slot="headline">B</span></k3-list-item>
      </k3-list>
    `);
    await settle(el);
    expect(container(items(el)[0]!).getAttribute('tabindex')).toBe('0');
    expect(container(items(el)[1]!).getAttribute('tabindex')).toBe('-1');
    expect(items(el)[0]!.shadowRoot!.querySelector('[part="link"]')).toBeNull();
  });
});

describe('k3-list-item — expand', () => {
  let el: K3List;
  afterEach(() => el?.remove());

  it('open and expanded stay in sync', async () => {
    el = await fixture<K3List>(html`
      <k3-list>
        <k3-list-item open>
          <span slot="headline">A</span>
          <div slot="expand">Body</div>
        </k3-list-item>
      </k3-list>
    `);
    await settle(el);
    const item = items(el)[0]!;
    expect(item.expanded).toBe(true);
    expect(item.hasAttribute('expanded')).toBe(true);
    item.expanded = false;
    await settle(el);
    expect(item.open).toBe(false);
    expect(item.hasAttribute('open')).toBe(false);
    item.open = true;
    await settle(el);
    expect(item.expanded).toBe(true);
  });

  it('expand-start is cancelable on user toggle; expand-end follows', async () => {
    el = await fixture<K3List>(html`
      <k3-list>
        <k3-list-item expandable>
          <span slot="headline">A</span>
          <div slot="expand">Body</div>
        </k3-list-item>
      </k3-list>
    `);
    await settle(el);
    const item = items(el)[0]!;
    const cancel = (e: Event) => e.preventDefault();
    item.addEventListener('k3-expand-start', cancel);
    container(item).click();
    await settle(el);
    expect(item.expanded).toBe(false);
    item.removeEventListener('k3-expand-start', cancel);

    const ended = new Promise<CustomEvent>((resolve) =>
      item.addEventListener('k3-expand-end', (e) => resolve(e as CustomEvent), { once: true }),
    );
    container(item).click();
    await settle(el);
    expect(item.expanded).toBe(true);
    const end = await ended;
    expect(end.detail.source).toBe('user');
  });

  it('slot items with a nested k3-list is a folder; toggle-icon slot exists', async () => {
    el = await fixture<K3List>(html`
      <k3-list>
        <k3-list-item expanded>
          <span slot="headline">Folder</span>
          <k3-list slot="items">
            <k3-list-item><span slot="headline">Child</span></k3-list-item>
          </k3-list>
        </k3-list-item>
      </k3-list>
    `);
    await settle(el);
    const item = items(el)[0]!;
    const nested = item.querySelector('k3-list') as K3List;
    await settle(nested);
    expect(item.expandable).toBe(true);
    expect(item.hasAttribute('data-expand-folder')).toBe(true);
    expect(nested.embedded).toBe(true);
    expect(item.shadowRoot!.querySelector('slot[name="toggle-icon"]')).not.toBeNull();
    expect(container(item).getAttribute('aria-controls')).toBe('expand');
  });
});

describe('k3-list — media, alignment, dividers', () => {
  let el: K3List;
  afterEach(() => el?.remove());

  it('detects leading media and reserves alignment width on the list', async () => {
    el = await fixture<K3List>(html`
      <k3-list variant="standard">
        <k3-list-item>
          <img slot="leading" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
          <span slot="headline">Image</span>
        </k3-list-item>
        <k3-list-item>
          <span slot="leading" class="ms" data-k3-icon="star"></span>
          <span slot="headline">Icon</span>
        </k3-list-item>
        <k3-list-item leading="avatar">
          <img slot="leading" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
          <span slot="headline">Explicit avatar</span>
        </k3-list-item>
        <k3-list-item><span slot="headline">Text only</span></k3-list-item>
      </k3-list>
    `);
    await settle(el);
    const [img, icon, avatar, text] = items(el);
    expect(img!.leadingContentType).toBe('image');
    expect(img!.getAttribute('data-leading')).toBe('image');
    expect(icon!.getAttribute('data-leading')).toBe('icon');
    expect(avatar!.getAttribute('data-leading')).toBe('avatar');
    expect(text!.hasAttribute('data-leading')).toBe(false);
    expect(el.getAttribute('data-leading-reserve')).toBe('image');
  });

  it('reserve follows slot changes', async () => {
    el = await fixture<K3List>(html`
      <k3-list>
        <k3-list-item><span slot="headline">A</span></k3-list-item>
        <k3-list-item><span slot="headline">B</span></k3-list-item>
      </k3-list>
    `);
    await settle(el);
    expect(el.hasAttribute('data-leading-reserve')).toBe(false);
    const video = document.createElement('video');
    video.slot = 'leading';
    items(el)[0]!.append(video);
    await settle(el);
    await new Promise((r) => setTimeout(r, 0));
    expect(el.getAttribute('data-leading-reserve')).toBe('video');
  });

  it('dividers do not count as segments', async () => {
    el = await fixture<K3List>(html`
      <k3-list variant="segmented">
        <k3-list-item><span slot="headline">A</span></k3-list-item>
        <k3-divider></k3-divider>
        <k3-list-item><span slot="headline">B</span></k3-list-item>
      </k3-list>
    `);
    await settle(el);
    expect(items(el).map((i) => i.getAttribute('data-seg'))).toEqual(['first', 'last']);
    expect(el.querySelector('k3-divider')!.hasAttribute('data-seg')).toBe(false);
  });
});
