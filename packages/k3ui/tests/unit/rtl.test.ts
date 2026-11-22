import { describe, expect, it, afterEach } from 'vitest';
import { isRtl } from '../../src/core/rtl.js';

describe('isRtl', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('dir');
  });

  it('reads document dir when no element', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    expect(isRtl()).toBe(true);
    document.documentElement.setAttribute('dir', 'ltr');
    expect(isRtl()).toBe(false);
  });

  it('reads computed direction on an element', () => {
    const el = document.createElement('div');
    el.style.direction = 'rtl';
    document.body.append(el);
    expect(isRtl(el)).toBe(true);
    el.remove();
  });
});
