import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attachDrag } from '../../src/core/drag.js';

/** jsdom may lack PointerEvent — minimal polyfill for unit tests */
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

function fire(el: HTMLElement, type: string, init: Record<string, unknown> = {}): void {
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

describe('attachDrag', () => {
  let el: HTMLDivElement;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.appendChild(el);
    el.setPointerCapture = vi.fn();
    el.releasePointerCapture = vi.fn();
    el.hasPointerCapture = vi.fn(() => true);
  });

  afterEach(() => {
    el.remove();
  });

  it('emits onActivate after threshold then onMove/onEnd', () => {
    const onActivate = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();
    const drag = attachDrag(el, {
      axis: 'y',
      threshold: 4,
      touchAction: null,
      onActivate,
      onMove,
      onEnd,
    });

    fire(el, 'pointerdown', { clientX: 10, clientY: 20 });
    fire(el, 'pointermove', { clientX: 10, clientY: 22 });
    expect(onActivate).not.toHaveBeenCalled();

    fire(el, 'pointermove', { clientX: 10, clientY: 30 });
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalled();
    expect(onMove.mock.calls.at(-1)?.[0].dy).toBe(10);

    fire(el, 'pointerup', { clientX: 10, clientY: 40 });
    expect(onEnd).toHaveBeenCalled();
    expect(onEnd.mock.calls[0]?.[0].dy).toBe(10);

    drag.destroy();
  });

  it('clamps to axis y', () => {
    const onMove = vi.fn();
    const drag = attachDrag(el, { axis: 'y', threshold: 0, onMove, touchAction: null });
    fire(el, 'pointerdown', { clientX: 0, clientY: 0 });
    fire(el, 'pointermove', { clientX: 50, clientY: 20 });
    expect(onMove.mock.calls.at(-1)?.[0].dx).toBe(0);
    expect(onMove.mock.calls.at(-1)?.[0].dy).toBe(20);
    drag.destroy();
  });

  it('respects canStart false', () => {
    const onStart = vi.fn();
    const drag = attachDrag(el, {
      canStart: () => false,
      onStart,
      touchAction: null,
    });
    fire(el, 'pointerdown', { clientX: 0, clientY: 0 });
    expect(onStart).not.toHaveBeenCalled();
    drag.destroy();
  });
});
