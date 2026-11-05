import { afterEach, describe, expect, it, vi } from 'vitest';
import { overlayStack } from '../../src/core/overlay-stack.js';

const esc = (): KeyboardEvent => {
  const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  document.body.dispatchEvent(e);
  return e;
};

describe('overlayStack', () => {
  const a = document.createElement('div');
  const b = document.createElement('div');
  afterEach(() => {
    overlayStack.remove(a);
    overlayStack.remove(b);
    overlayStack.setScrollLock(false);
  });

  it('routes Escape to the top-most overlay only', () => {
    const onA = vi.fn();
    const onB = vi.fn();
    overlayStack.push(a, onA);
    overlayStack.push(b, onB);
    expect(overlayStack.isTop(b)).toBe(true);
    const e = esc();
    expect(onB).toHaveBeenCalledTimes(1);
    expect(onA).not.toHaveBeenCalled();
    expect(e.defaultPrevented).toBe(true);
    overlayStack.remove(b);
    esc();
    expect(onA).toHaveBeenCalledTimes(1);
  });

  it('ignores an Escape already consumed by an inner widget', () => {
    const onA = vi.fn();
    overlayStack.push(a, onA);
    const consume = (e: Event): void => e.preventDefault();
    document.body.addEventListener('keydown', consume, { once: true });
    esc();
    expect(onA).not.toHaveBeenCalled();
  });

  it('detaches its document listener when the stack empties', () => {
    const onA = vi.fn();
    overlayStack.push(a, onA);
    overlayStack.remove(a);
    esc();
    expect(onA).not.toHaveBeenCalled();
    expect(overlayStack.size).toBe(0);
  });

  it('locks scroll (opt-in) while at least one modal is open, then restores', () => {
    const root = document.documentElement;
    root.style.overflow = 'clip';
    overlayStack.setScrollLock(true);
    overlayStack.push(a, () => undefined);
    overlayStack.push(b, () => undefined);
    expect(root.style.overflow).toBe('hidden');
    expect(root.hasAttribute('data-k3-scroll-locked')).toBe(true);
    overlayStack.remove(a);
    expect(root.style.overflow).toBe('hidden');
    overlayStack.remove(b);
    expect(root.style.overflow).toBe('clip');
    expect(root.hasAttribute('data-k3-scroll-locked')).toBe(false);
    root.style.overflow = '';
  });
});
