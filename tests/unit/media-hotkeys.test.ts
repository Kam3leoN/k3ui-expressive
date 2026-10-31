import { describe, it, expect, afterEach, vi } from 'vitest';
import { bindMediaHotkeys } from '../../src/core/media-hotkeys.js';

describe('bindMediaHotkeys', () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    cleanups.splice(0).forEach((fn) => fn());
  });

  it('toggles on Space and seeks on arrows', () => {
    const toggle = vi.fn();
    const seekBy = vi.fn();
    cleanups.push(bindMediaHotkeys({ toggle, seekBy }));

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );

    expect(toggle).toHaveBeenCalledTimes(1);
    expect(seekBy).toHaveBeenCalledWith(5);
    expect(seekBy).toHaveBeenCalledWith(-5);
  });

  it('ignores keys inside inputs', () => {
    const toggle = vi.fn();
    cleanups.push(bindMediaHotkeys({ toggle }));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    expect(toggle).not.toHaveBeenCalled();
    input.remove();
  });
});
