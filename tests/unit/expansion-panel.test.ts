import { describe, it, expect, vi } from 'vitest';
import { init } from '../../src/index.js';
import type { K3ExpansionPanel } from '../../src/components/containment/expansion-panel.js';
import type { K3Accordion } from '../../src/components/containment/accordion.js';

describe('k3-expansion-panel', () => {
  it('toggles open with aria-expanded and lifecycle', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-expansion-panel'], theme: { mode: 'light' } });

    const el = document.createElement('k3-expansion-panel') as K3ExpansionPanel;
    el.innerHTML = `<span slot="header">Title</span><p slot="content">Body</p>`;
    document.body.appendChild(el);
    await el.updateComplete;

    const header = el.shadowRoot!.querySelector('.header') as HTMLButtonElement;
    expect(header.getAttribute('aria-expanded')).toBe('false');

    const start = vi.fn();
    el.addEventListener('k3-expand-start', start);
    header.click();
    await el.updateComplete;
    expect(el.open).toBe(true);
    expect(header.getAttribute('aria-expanded')).toBe('true');
    expect(start).toHaveBeenCalled();
    el.remove();
  });
});

describe('k3-accordion', () => {
  it('keeps one panel open when multi is false', async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-accordion', 'k3-expansion-panel'], theme: { mode: 'light' } });

    const acc = document.createElement('k3-accordion') as K3Accordion;
    acc.innerHTML = `
      <k3-expansion-panel open><span slot="header">1</span><p slot="content">a</p></k3-expansion-panel>
      <k3-expansion-panel><span slot="header">2</span><p slot="content">b</p></k3-expansion-panel>
    `;
    document.body.appendChild(acc);
    const panels = acc.querySelectorAll('k3-expansion-panel') as NodeListOf<K3ExpansionPanel>;
    await panels[0]!.updateComplete;
    await panels[1]!.updateComplete;

    const btn = panels[1]!.shadowRoot!.querySelector('.header') as HTMLButtonElement;
    btn.click();
    await panels[1]!.updateComplete;
    expect(panels[1]!.open).toBe(true);
    expect(panels[0]!.open).toBe(false);
    acc.remove();
  });
});