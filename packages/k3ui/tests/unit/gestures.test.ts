import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectGesture, phase, tap, longPress, swipe } from '../../src/core/gestures/index.js';

class TestPointerEvent extends Event {
  pointerId: number;
  pointerType: string;
  clientX: number;
  clientY: number;
  button: number;
  buttons: number;
  constructor(type: string, init: Record<string, unknown> = {}) {
    super(type, { bubbles: true, cancelable: true, ...init });
    this.pointerId = (init.pointerId as number) ?? 1;
    this.pointerType = (init.pointerType as string) ?? 'touch';
    this.clientX = (init.clientX as number) ?? 0;
    this.clientY = (init.clientY as number) ?? 0;
    this.button = (init.button as number) ?? 0;
    this.buttons = (init.buttons as number) ?? 1;
  }
}

if (typeof globalThis.PointerEvent === 'undefined') {
  (globalThis as unknown as { PointerEvent: typeof TestPointerEvent }).PointerEvent =
    TestPointerEvent;
}

function fire(el: EventTarget, type: string, init: Record<string, unknown> = {}): void {
  el.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'touch',
      clientX: 0,
      clientY: 0,
      button: 0,
      buttons: 1,
      ...init,
    }),
  );
}

describe('gestures', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.setPointerCapture = vi.fn();
    el.releasePointerCapture = vi.fn();
    el.hasPointerCapture = vi.fn(() => true);
    el.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        toJSON() {
          return this;
        },
      }) as DOMRect;
  });

  afterEach(() => el.remove());

  it('tap fires onEnd for short press', () => {
    const onEnd = vi.fn();
    const ctrl = detectGesture(el, tap(phase({ onEnd })));
    fire(el, 'pointerdown', { clientX: 10, clientY: 10 });
    fire(el, 'pointerup', { clientX: 12, clientY: 11 });
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd.mock.calls[0]![0].gestureName).toBe('tap');
    ctrl.destroy();
  });

  it('tap cancels when moved too far', () => {
    const onEnd = vi.fn();
    const onCancel = vi.fn();
    detectGesture(el, tap(phase({ onEnd, onCancel }), { maxDisplacement: 8 }));
    fire(el, 'pointerdown', { clientX: 10, clientY: 10 });
    fire(el, 'pointermove', { clientX: 40, clientY: 10 });
    fire(el, 'pointerup', { clientX: 40, clientY: 10 });
    expect(onEnd).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it('longPress ends after minDuration', async () => {
    vi.useFakeTimers();
    const onEnd = vi.fn();
    detectGesture(el, longPress(phase({ onEnd }), { minDuration: 100 }));
    fire(el, 'pointerdown', { clientX: 5, clientY: 5 });
    expect(onEnd).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(120);
    expect(onEnd).toHaveBeenCalledTimes(1);
    fire(el, 'pointerup', { clientX: 5, clientY: 5 });
    vi.useRealTimers();
  });

  it('swipe recognizes fast horizontal flick', () => {
    const onEnd = vi.fn();
    detectGesture(
      el,
      swipe(phase({ onEnd }), { minVelocity: 0.1, minDisplacement: 20, startThreshold: 2 }),
    );
    fire(el, 'pointerdown', { clientX: 0, clientY: 50 });
    fire(el, 'pointermove', { clientX: 10, clientY: 50 });
    fire(el, 'pointermove', { clientX: 80, clientY: 50 });
    fire(el, 'pointerup', { clientX: 90, clientY: 50 });
    expect(onEnd).toHaveBeenCalled();
    expect(onEnd.mock.calls[0]![0].direction).toBe('right');
  });
});
