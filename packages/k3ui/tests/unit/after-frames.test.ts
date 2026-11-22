import { describe, expect, it, vi } from 'vitest';
import { afterFrames, afterPaint } from '../../src/core/lifecycle.js';

describe('afterFrames', () => {
  it('resolves immediately for 0 frames', async () => {
    await expect(afterFrames(0)).resolves.toBeUndefined();
  });

  it('waits N animation frames', async () => {
    let frames = 0;
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: FrameRequestCallback) => {
        frames += 1;
        queueMicrotask(() => cb(frames));
        return frames;
      },
    );
    await afterFrames(3);
    expect(frames).toBe(3);
    vi.unstubAllGlobals();
  });

  it('afterPaint waits 2 frames', async () => {
    let frames = 0;
    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: FrameRequestCallback) => {
        frames += 1;
        queueMicrotask(() => cb(frames));
        return frames;
      },
    );
    await afterPaint();
    expect(frames).toBe(2);
    vi.unstubAllGlobals();
  });
});
