import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  buildPaginationPages,
  PAGINATION_ELLIPSIS,
} from '../../src/components/navigation/pagination.specs.js';
import '../../src/components/navigation/pagination.js';
import type { K3Pagination } from '../../src/components/navigation/pagination.js';

describe('k3-pagination', () => {
  let el: K3Pagination;

  beforeEach(async () => {
    el = document.createElement('k3-pagination') as K3Pagination;
    el.page = 6;
    el.count = 11;
    el.siblingCount = 2;
    document.body.appendChild(el);
    await el.updateComplete;
  });

  afterEach(() => {
    el.remove();
  });

  it('buildPages inserts ellipsis for large ranges', () => {
    expect(buildPaginationPages(6, 11, 2)).toEqual([1, PAGINATION_ELLIPSIS, 4, 5, 6, 7, 8, PAGINATION_ELLIPSIS, 11]);
  });

  it('goTo updates page and fires k3-change', async () => {
    const onChange = vi.fn();
    el.addEventListener('k3-change', onChange as EventListener);
    el.goTo(7);
    await el.updateComplete;
    expect(el.page).toBe(7);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ detail: { page: 7 } }));
  });

  it('renders nav buttons with material icons', () => {
    const icons = el.shadowRoot!.querySelectorAll('[data-k3-icon]');
    expect(icons.length).toBeGreaterThanOrEqual(4);
    expect(icons[0]?.getAttribute('data-k3-icon')).toBe('first_page');
  });
});
