import { describe, it, expect } from 'vitest';
import { init } from '../../src/index.js';
import type { K3Tree } from '../../src/components/containment/tree.js';
import type { K3TreeItem } from '../../src/components/containment/tree-item.js';

describe('k3-tree', () => {
  it('renders tree role and sets aria-level on items', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-tree', 'k3-tree-item'], theme: { mode: 'light' } });

    const el = document.createElement('k3-tree') as K3Tree;
    el.selection = 'single';
    el.innerHTML = `
      <k3-tree-item label="Root" expanded>
        <k3-tree-item label="Child"></k3-tree-item>
      </k3-tree-item>
    `;
    document.body.appendChild(el);
    await el.updateComplete;
    await Promise.resolve();

    expect(el.shadowRoot!.querySelector('[role="tree"]')).toBeTruthy();
    const child = el.querySelector('k3-tree-item k3-tree-item') as K3TreeItem;
    await child.updateComplete;
    const row = child.shadowRoot!.querySelector('[role="treeitem"]');
    expect(row?.getAttribute('aria-level')).toBe('2');
    el.remove();
  });

  it('cancelable k3-expand-start blocks expand', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-tree', 'k3-tree-item'], theme: { mode: 'light' } });
    const el = document.createElement('k3-tree') as K3Tree;
    el.innerHTML = `<k3-tree-item label="A"><k3-tree-item label="B"></k3-tree-item></k3-tree-item>`;
    document.body.appendChild(el);
    const root = el.querySelector('k3-tree-item') as K3TreeItem;
    await root.updateComplete;
    root.addEventListener('k3-expand-start', (e) => e.preventDefault(), { once: true });
    const ok = await root.requestExpand();
    expect(ok).toBe(false);
    expect(root.expanded).toBe(false);
    el.remove();
  });

  it('ArrowDown via k3-tree-key moves to next row', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-tree', 'k3-tree-item'], theme: { mode: 'light' } });
    const el = document.createElement('k3-tree') as K3Tree;
    el.selection = 'single';
    el.innerHTML = `
      <k3-tree-item label="A" value="a"></k3-tree-item>
      <k3-tree-item label="B" value="b"></k3-tree-item>
    `;
    document.body.appendChild(el);
    const first = el.querySelector('k3-tree-item') as K3TreeItem;
    const second = el.querySelectorAll('k3-tree-item')[1] as K3TreeItem;
    await first.updateComplete;
    await second.updateComplete;
    first.focusRow?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    expect(second.selected).toBe(false);
    second.focusRow?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    expect(second.selected).toBe(true);
    el.remove();
  });

  it('nests children in the group slot (not the label)', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-tree', 'k3-tree-item'], theme: { mode: 'light' } });
    const el = document.createElement('k3-tree') as K3Tree;
    el.innerHTML = `
      <k3-tree-item label="Projects" value="projects" expanded>
        <k3-tree-item label="Design" value="design"></k3-tree-item>
      </k3-tree-item>
    `;
    document.body.appendChild(el);
    const root = el.querySelector(':scope > k3-tree-item') as K3TreeItem;
    const child = root.querySelector(':scope > k3-tree-item') as K3TreeItem;
    await root.updateComplete;
    await child.updateComplete;
    await Promise.resolve();

    const labelSlot = root.shadowRoot!.querySelector('.label slot') as HTMLSlotElement;
    const groupSlot = root.shadowRoot!.querySelector('.children slot') as HTMLSlotElement;
    expect(labelSlot.getAttribute('name')).toBe('label');
    expect(groupSlot.assignedElements()).toContain(child);
    expect(labelSlot.assignedElements()).not.toContain(child);
    expect(root.shadowRoot!.querySelector('.label')?.textContent?.trim()).toBe('Projects');
    expect(root.shadowRoot!.querySelector('.children')?.hasAttribute('hidden')).toBe(false);
    el.remove();
  });
});
