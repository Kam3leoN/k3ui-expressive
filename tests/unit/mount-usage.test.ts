import { describe, expect, it } from 'vitest';
import { createUsageSection, mountUsageIfNeeded } from '../../playground/mount-usage.js';
import { USAGE_BY_PAGE } from '../../playground/usage-snippets.js';

describe('mount-usage', () => {
  it('createUsageSection builds HTML/CSS/JS panels', () => {
    const snip = USAGE_BY_PAGE.buttons!;
    const el = createUsageSection(snip);
    expect(el.classList.contains('doc-usage')).toBe(true);
    expect(el.querySelectorAll('[data-code-panel]')).toHaveLength(3);
    expect(el.querySelector('[data-code-panel="html"]')?.textContent).toContain('k3-button');
  });

  it('mountUsageIfNeeded skips when .doc-usage already present', () => {
    const page = document.createElement('div');
    page.className = 'comp-page';
    page.innerHTML = `<section class="doc-usage"></section>`;
    mountUsageIfNeeded(page, 'checkbox');
    expect(page.querySelectorAll('.doc-usage')).toHaveLength(1);
  });

  it('mountUsageIfNeeded inserts before .doc-tables', () => {
    const page = document.createElement('div');
    page.className = 'comp-page';
    const tables = document.createElement('div');
    tables.className = 'doc-tables';
    page.append(tables);
    document.body.append(page);
    mountUsageIfNeeded(page, 'checkbox');
    expect(page.children[0]?.classList.contains('doc-usage')).toBe(true);
    expect(page.children[1]).toBe(tables);
    page.remove();
  });

  it('covers every Buttons / Actions catalog snippet', () => {
    for (const id of [
      'buttons',
      'buttons-icon',
      'buttons-group',
      'buttons-split',
      'buttons-menu',
      'fab',
      'fab-extended',
      'fab-menu',
      'ripple',
    ]) {
      expect(USAGE_BY_PAGE[id], id).toBeTruthy();
    }
  });
});
