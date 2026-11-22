import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildLetterCounts } from '../../src/components/navigation/pagination-alpha.specs.js';
import '../../src/components/navigation/pagination-alpha.js';
import type { K3PaginationAlpha } from '../../src/components/navigation/pagination-alpha.js';

describe('k3-pagination-alpha', () => {
  let el: K3PaginationAlpha;

  beforeEach(async () => {
    el = document.createElement('k3-pagination-alpha') as K3PaginationAlpha;
    el.items = ['Alice', 'Anna', 'Bob', 'Canada'];
    el.showCount = true;
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  it('derives letter counts from items', () => {
    const counts = buildLetterCounts(['Alice', 'Bob', 'Bob']);
    expect(counts.A).toBe(1);
    expect(counts.B).toBe(2);
    expect(counts.C).toBe(0);
  });

  it('fires k3-select when a letter is clicked', async () => {
    const onSelect = vi.fn();
    el.addEventListener('k3-select', onSelect as EventListener);
    const btnB = el.shadowRoot!.querySelector('[data-letter="B"]') as HTMLButtonElement;
    btnB.click();
    await el.updateComplete;
    expect(el.activeLetter).toBe('B');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ detail: { letter: 'B' } }));
  });
});
