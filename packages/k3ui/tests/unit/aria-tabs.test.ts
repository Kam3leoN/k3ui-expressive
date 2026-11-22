import { describe, expect, it } from 'vitest';
import { ariaTabs, installTabKeyboard, selectTab } from '../../playground/aria-tabs.js';

const markup = `
  <div class="code-sample">
    <div class="qs-tabs" role="tablist" aria-label="HTML CSS JS">
      <button class="qs-tab is-active" data-code-tab="html">HTML</button>
      <button class="qs-tab" data-code-tab="css">CSS</button>
      <button class="qs-tab" data-code-tab="js">JS</button>
    </div>
    <pre data-code-panel="html"></pre>
    <pre data-code-panel="css" hidden></pre>
    <pre data-code-panel="js" hidden></pre>
  </div>`;

describe('playground aria tabs', () => {
  it('adds tab / tabpanel semantics and roving tabindex', () => {
    document.body.innerHTML = markup;
    ariaTabs();
    const tabs = [...document.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(tabs).toHaveLength(3);
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1]);
    const panel = document.getElementById(tabs[1]!.getAttribute('aria-controls')!)!;
    expect(panel.getAttribute('role')).toBe('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[1]!.id);
  });

  it('keeps selection in sync and moves with the arrow keys', () => {
    document.body.innerHTML = markup;
    ariaTabs();
    installTabKeyboard();
    const list = document.querySelector('.qs-tabs')!;
    const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
    tabs.forEach((t) => t.addEventListener('click', () => selectTab(list, t)));
    selectTab(list, tabs[2]!);
    expect(tabs[2]!.getAttribute('aria-selected')).toBe('true');
    tabs[2]!.focus();
    tabs[2]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(tabs[0]);
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('true');
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1]);
  });
});
