import { describe, it, expect } from 'vitest';
import { emitLifecycle } from '../../src/core/lifecycle.js';

describe('emitLifecycle', () => {
  it('cancelable start phases', () => {
    const el = document.createElement('div');
    el.addEventListener('k3-open-start', (e) => e.preventDefault());
    expect(emitLifecycle(el, 'open-start')).toBe(false);
    expect(emitLifecycle(el, 'open-end')).toBe(true);
  });
});
