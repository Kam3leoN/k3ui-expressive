import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import type { K3Autocomplete } from '../../src/components/inputs/autocomplete.js';

describe('k3-autocomplete', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-autocomplete', 'k3-text-field'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  async function mount(html: string): Promise<K3Autocomplete> {
    host.innerHTML = html;
    const el = host.querySelector('k3-autocomplete') as K3Autocomplete;
    await el.updateComplete;
    return el;
  }

  function field(el: K3Autocomplete): HTMLElement {
    return el.shadowRoot!.querySelector('k3-text-field') as HTMLElement;
  }

  async function type(el: K3Autocomplete, text: string): Promise<void> {
    field(el).dispatchEvent(
      new CustomEvent('k3-input', {
        detail: { value: text },
        bubbles: true,
        composed: true,
      }),
    );
    await el.updateComplete;
  }

  it('filters options (contains) and commits on click', async () => {
    const el = await mount(`<k3-autocomplete label="Fruit"></k3-autocomplete>`);
    el.setOptions(['Apple', 'Apricot', 'Banana']);
    await el.updateComplete;

    const onChange = vi.fn();
    el.addEventListener('k3-change', onChange as EventListener);

    await type(el, 'Ap');

    const opt = el.shadowRoot!.querySelector('.option:not(.meta)') as HTMLButtonElement;
    expect(opt?.textContent?.trim()).toBe('Apple');
    opt.click();
    await el.updateComplete;

    expect(el.value).toBe('Apple');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { value: 'Apple', label: 'Apple' } }),
    );
  });

  it('supports starts-with filter and k3-query', async () => {
    const el = await mount(`<k3-autocomplete filter="starts-with"></k3-autocomplete>`);
    el.setOptions([
      { value: '1', label: 'Beta' },
      { value: '2', label: 'Alpha' },
    ]);
    const onQuery = vi.fn();
    el.addEventListener('k3-query', onQuery as EventListener);

    await type(el, 'Be');
    expect(onQuery).toHaveBeenCalled();

    const labels = [...el.shadowRoot!.querySelectorAll('.option:not(.meta)')].map((n) =>
      n.textContent?.trim(),
    );
    expect(labels).toEqual(['Beta']);
  });

  it('openPanel / closePanel emit k3-toggle', async () => {
    const el = await mount(`<k3-autocomplete></k3-autocomplete>`);
    el.setOptions(['One', 'Two']);
    const toggles: boolean[] = [];
    el.addEventListener('k3-toggle', ((e: CustomEvent<{ open: boolean }>) => {
      toggles.push(e.detail.open);
    }) as EventListener);

    await el.openPanel();
    await el.updateComplete;
    expect(toggles).toContain(true);

    await el.closePanel();
    await el.updateComplete;
    expect(toggles[toggles.length - 1]).toBe(false);
  });

  it('clear() resets value', async () => {
    const el = await mount(`<k3-autocomplete value="X"></k3-autocomplete>`);
    el.setOptions(['X']);
    el.clear();
    await el.updateComplete;
    expect(el.value).toBe('');
  });

  it('ArrowDown + Enter selects highlighted option', async () => {
    const el = await mount(`<k3-autocomplete></k3-autocomplete>`);
    el.setOptions(['A', 'B', 'C']);
    await el.openPanel();
    await el.updateComplete;

    const tf = field(el);
    tf.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await el.updateComplete;
    tf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await el.updateComplete;

    expect(el.value).toBe('A');
  });
});
