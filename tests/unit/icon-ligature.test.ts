import { describe, expect, it } from 'vitest';
import { protectIconLigatures, sealIconElement } from '../../src/icons/ligature.js';

describe('icon ligature translate guard', () => {
  it('moves text ligature into data-k3-icon and clears the text node', () => {
    const el = document.createElement('span');
    el.className = 'ms';
    el.textContent = 'home';
    sealIconElement(el);
    expect(el.getAttribute('data-k3-icon')).toBe('home');
    expect(el.textContent).toBe('');
    expect(el.getAttribute('translate')).toBe('no');
    expect(el.classList.contains('notranslate')).toBe(true);
    expect(el.getAttribute('lang')).toBe('zxx');
  });

  it('protectIconLigatures seals all .ms under a root', () => {
    const root = document.createElement('div');
    root.innerHTML = `<span class="ms">palette</span><span class="ms">widgets</span><b>keep</b>`;
    document.body.append(root);
    const n = protectIconLigatures(root);
    expect(n).toBe(2);
    expect(root.querySelectorAll('[data-k3-icon]')).toHaveLength(2);
    expect(root.querySelector('b')?.textContent).toBe('keep');
    root.remove();
  });
});
