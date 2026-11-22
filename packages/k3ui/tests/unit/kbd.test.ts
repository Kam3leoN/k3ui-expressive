import { describe, expect, it } from 'vitest';
import { parseKbdKeys } from '../../src/components/feedback/kbd.js';
import '../../src/components/feedback/kbd.js';

describe('k3-kbd', () => {
  it('parses chord strings', () => {
    expect(parseKbdKeys('Ctrl+K')).toEqual(['Ctrl', 'K']);
    expect(parseKbdKeys('Shift Enter')).toEqual(['Shift', 'Enter']);
    expect(parseKbdKeys('Esc')).toEqual(['Esc']);
    expect(parseKbdKeys('')).toEqual([]);
  });

  it('renders keycaps from keys attribute', async () => {
    const el = document.createElement('k3-kbd');
    el.setAttribute('keys', 'Ctrl+K');
    document.body.append(el);
    await customElements.whenDefined('k3-kbd');
    await (el as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    const keys = el.shadowRoot?.querySelectorAll('.key') ?? [];
    expect(keys.length).toBe(2);
    expect(keys[0]?.textContent).toBe('Ctrl');
    expect(keys[1]?.textContent).toBe('K');
    el.remove();
  });

  it('keeps plain typeface when slotted as list trailing', async () => {
    await import('../../src/components/containment/list-item.js');
    await customElements.whenDefined('k3-list-item');
    await customElements.whenDefined('k3-kbd');

    const row = document.createElement('k3-list-item');
    row.setAttribute('interactive', '');
    const kbd = document.createElement('k3-kbd');
    kbd.slot = 'trailing';
    kbd.setAttribute('keys', 'Alt+H');
    kbd.setAttribute('size', 'sm');
    row.append(kbd);
    document.body.append(row);
    await (row as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    await (kbd as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;

    const hostFont = getComputedStyle(kbd).fontFamily.toLowerCase();
    expect(hostFont.includes('material symbols')).toBe(false);

    const key = kbd.shadowRoot?.querySelector('.key') as HTMLElement;
    expect(key?.textContent).toBe('Alt');
    const keyFont = getComputedStyle(key).fontFamily.toLowerCase();
    expect(keyFont.includes('material symbols')).toBe(false);

    row.remove();
  });
});
