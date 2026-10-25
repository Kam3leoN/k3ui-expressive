import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { groupIndexListItems } from '../../src/components/navigation/index-list.specs.js';
import '../../src/components/navigation/index-list.js';
import type { K3IndexList } from '../../src/components/navigation/index-list.js';

describe('k3-index-list', () => {
  let el: K3IndexList;

  beforeEach(async () => {
    el = document.createElement('k3-index-list') as K3IndexList;
    el.items = [
      { label: 'Bob Martin' },
      { label: 'Alice Dupont' },
      { label: 'Zoe Zen' },
    ];
    el.style.maxHeight = '20rem';
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  it('groups items by first letter', () => {
    const groups = groupIndexListItems([
      { label: 'Bob' },
      { label: 'Alice' },
    ]);
    expect([...groups.keys()].sort()).toEqual(['A', 'B']);
  });

  it('renders sections and rail', () => {
    expect(el.shadowRoot!.querySelectorAll('.section').length).toBe(3);
    expect(el.shadowRoot!.querySelector('.rail')).toBeTruthy();
  });

  it('scrollToKey emits k3-section-change', async () => {
    const onSection = vi.fn();
    el.addEventListener('k3-section-change', onSection as EventListener);
    el.scrollToKey('A', true);
    await el.updateComplete;
    expect(onSection).toHaveBeenCalledWith(expect.objectContaining({ detail: { key: 'A' } }));
  });
});
