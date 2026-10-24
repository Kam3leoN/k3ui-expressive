import { describe, expect, it } from 'vitest';
import { hasLightSlot, hasNamedSlot, hasSlot } from '../../src/core/slots.js';

describe('hasLightSlot / hasNamedSlot', () => {
  it('detects named light-DOM children before shadow upgrade', () => {
    const host = document.createElement('div');
    const icon = document.createElement('span');
    icon.slot = 'icon';
    host.append(icon, document.createTextNode('Label'));
    expect(hasLightSlot(host, 'icon')).toBe(true);
    expect(hasLightSlot(host, 'submenu')).toBe(false);
    expect(hasNamedSlot(host, 'icon')).toBe(true);
    /* No shadow root yet */
    expect(hasSlot(host, 'icon')).toBe(false);
  });

  it('ignores nested descendants (direct children only)', () => {
    const host = document.createElement('div');
    const wrap = document.createElement('div');
    const icon = document.createElement('span');
    icon.slot = 'icon';
    wrap.append(icon);
    host.append(wrap);
    expect(hasLightSlot(host, 'icon')).toBe(false);
  });
});
