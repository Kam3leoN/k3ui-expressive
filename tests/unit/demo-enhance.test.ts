import { describe, expect, it } from 'vitest';
import {
  enhanceAllDemos,
  enhanceDemoFrame,
  promoteDemoHost,
  promoteGrid,
} from '../../playground/demo-enhance.js';

describe('demo-enhance', () => {
  it('wraps raw frame children into numbered demo-case', () => {
    const frame = document.createElement('div');
    frame.className = 'demo-frame demo-frame--cases';
    frame.innerHTML = `<k3-button>A</k3-button><k3-button>B</k3-button>`;
    document.body.append(frame);
    const n = enhanceDemoFrame(frame);
    expect(n).toBe(2);
    expect(frame.querySelectorAll(':scope > .demo-case')).toHaveLength(2);
    expect(frame.querySelector('.demo-case-num')?.textContent).toBe('1');
    expect(frame.querySelectorAll('.demo-case-num')[1]?.textContent).toBe('2');
    frame.remove();
  });

  it('skips frames that already have demo-case or demo-case-row', () => {
    const frame = document.createElement('div');
    frame.className = 'demo-frame demo-frame--icon-button';
    frame.innerHTML = `<div class="demo-case"><div class="demo-case-stage"><span>x</span></div><span class="demo-case-num">1</span></div>`;
    expect(enhanceDemoFrame(frame)).toBe(0);

    const rows = document.createElement('div');
    rows.className = 'demo-frame demo-frame--cases';
    rows.innerHTML = `<div class="demo-case-row"><div class="demo-case"><span class="demo-case-num">1</span></div></div>`;
    expect(enhanceDemoFrame(rows)).toBe(0);
  });

  it('skips width-matrix and fab-menu frames', () => {
    const matrix = document.createElement('div');
    matrix.className = 'demo-frame demo-frame--width-matrix';
    matrix.innerHTML = `<span>a</span><span>b</span>`;
    expect(enhanceDemoFrame(matrix)).toBe(0);

    const menu = document.createElement('div');
    menu.className = 'demo-frame demo-frame--fab-menu';
    menu.innerHTML = `<span>a</span><span>b</span>`;
    expect(enhanceDemoFrame(menu)).toBe(0);
  });

  it('promotes a bare control row into demo-block + frame', () => {
    const page = document.createElement('div');
    page.className = 'comp-page';
    const row = document.createElement('div');
    row.className = 'surface row wrap gap-lg';
    row.innerHTML = `<k3-checkbox>A</k3-checkbox><k3-checkbox>B</k3-checkbox>`;
    page.append(row);
    document.body.append(page);
    expect(promoteDemoHost(row)).toBe(true);
    expect(page.querySelector('.demo-block .demo-frame--cases')).toBeTruthy();
    expect(page.querySelectorAll('.demo-case')).toHaveLength(2);
    page.remove();
  });

  it('promotes field grid columns into equal cases', () => {
    const page = document.createElement('article');
    page.className = 'comp-page';
    page.setAttribute('data-page', 'text-field');
    page.innerHTML = `
      <div class="surface surface-flush">
        <div class="grid-3">
          <div class="stack gap-md">
            <header class="section-head sub"><h2>Outlined</h2></header>
            <k3-text-field variant="outlined"></k3-text-field>
            <k3-text-field variant="outlined"></k3-text-field>
          </div>
          <div class="stack gap-md">
            <header class="section-head sub"><h2>Filled</h2></header>
            <k3-text-field variant="filled"></k3-text-field>
          </div>
          <div class="stack gap-md">
            <header class="section-head sub"><h2>Standard</h2></header>
            <k3-text-field variant="standard"></k3-text-field>
          </div>
        </div>
      </div>`;
    document.body.append(page);
    const grid = page.querySelector('.grid-3') as HTMLElement;
    expect(promoteGrid(grid)).toBe(true);
    expect(page.querySelectorAll('.demo-case')).toHaveLength(3);
    expect(page.querySelectorAll('.demo-field-col')).toHaveLength(3);
    expect(page.querySelectorAll('header.section-head')).toHaveLength(3);
    page.remove();
  });

  it('enhanceAllDemos frames stack runs with matching guide', () => {
    const page = document.createElement('article');
    page.className = 'comp-page';
    page.setAttribute('data-page', 'list');
    page.innerHTML = `
      <div class="surface stack gap-lg">
        <ol class="variant-guide">
          <li><span class="pill-num">1</span><span class="variant-label">one</span></li>
          <li><span class="pill-num">2</span><span class="variant-label">two</span></li>
        </ol>
        <k3-list></k3-list>
        <k3-list></k3-list>
      </div>`;
    document.body.append(page);
    const stats = enhanceAllDemos(document);
    expect(stats.stacks).toBeGreaterThanOrEqual(1);
    expect(page.querySelector('.demo-block > .variant-guide')).toBeTruthy();
    expect(page.querySelectorAll('.demo-case')).toHaveLength(2);
    expect(page.querySelector('.demo-frame--stack')).toBeTruthy();
    page.remove();
  });

  it('does not attach a 2-pill guide under 5 wide controls (button-group bug)', () => {
    const page = document.createElement('article');
    page.className = 'comp-page';
    page.setAttribute('data-page', 'buttons-group');
    page.innerHTML = `
      <div class="surface stack gap-lg">
        <ol class="variant-guide">
          <li><span class="pill-num">1</span><span class="variant-label">Standard</span></li>
          <li><span class="pill-num">2</span><span class="variant-label">Connected</span></li>
        </ol>
        <k3-button-group></k3-button-group>
        <k3-button-group></k3-button-group>
        <k3-button-group></k3-button-group>
        <k3-button-group></k3-button-group>
        <k3-button-group></k3-button-group>
      </div>`;
    document.body.append(page);
    enhanceAllDemos(document);
    /* Mismatched guide must NOT become the sole legend under one 5-case frame */
    const blocks = page.querySelectorAll('.demo-block');
    for (const b of blocks) {
      const guide = b.querySelector(':scope > .variant-guide');
      const cases = b.querySelectorAll('.demo-case');
      if (guide) expect(guide.children.length).toBe(cases.length);
    }
    expect(page.querySelectorAll('.demo-case')).toHaveLength(5);
    page.remove();
  });
});
