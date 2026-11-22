import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  attachSortable,
  attachDraggable,
  attachDroppable,
  getActiveDndPayload,
} from '../../src/core/dnd.js';

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

function mockRect(el: HTMLElement, rect: Partial<DOMRect>): void {
  el.getBoundingClientRect = () =>
    ({
      x: rect.left ?? 0,
      y: rect.top ?? 0,
      left: rect.left ?? 0,
      top: rect.top ?? 0,
      right: (rect.left ?? 0) + (rect.width ?? 40),
      bottom: (rect.top ?? 0) + (rect.height ?? 24),
      width: rect.width ?? 40,
      height: rect.height ?? 24,
      toJSON() {
        return this;
      },
    }) as DOMRect;
}

describe('attachSortable', () => {
  let container: HTMLDivElement;
  let a: HTMLDivElement;
  let b: HTMLDivElement;
  let c: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    a = document.createElement('div');
    b = document.createElement('div');
    c = document.createElement('div');
    a.className = 'item';
    b.className = 'item';
    c.className = 'item';
    a.textContent = 'A';
    b.textContent = 'B';
    c.textContent = 'C';
    container.append(a, b, c);
    document.body.appendChild(container);

    for (const el of [container, a, b, c]) {
      el.setPointerCapture = vi.fn();
      el.releasePointerCapture = vi.fn();
      el.hasPointerCapture = vi.fn(() => true);
    }

    /* Horizontal row: A 0–40, B 50–90, C 100–140 */
    mockRect(a, { left: 0, top: 0, width: 40, height: 24 });
    mockRect(b, { left: 50, top: 0, width: 40, height: 24 });
    mockRect(c, { left: 100, top: 0, width: 40, height: 24 });
  });

  afterEach(() => {
    container.remove();
    document.querySelectorAll('.k3-dnd-ghost').forEach((n) => n.remove());
  });

  it('reorders siblings and fires onReorder', () => {
    const onReorder = vi.fn();
    const onActivate = vi.fn();
    const ctrl = attachSortable(container, {
      itemSelector: ':scope > .item',
      axis: 'x',
      threshold: 4,
      ghost: false,
      onActivate,
      onReorder,
    });

    fire(a, 'pointerdown', { clientX: 10, clientY: 10 });
    /* Moves on container (capture target) — mirrors real pointer capture */
    fire(container, 'pointermove', { clientX: 10, clientY: 10 });
    expect(onActivate).not.toHaveBeenCalled();

    /* Cross threshold to the right past B midpoint (70) */
    fire(container, 'pointermove', { clientX: 80, clientY: 10 });
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(container.hasAttribute('sorting')).toBe(true);
    expect(a.hasAttribute('dragging')).toBe(true);

    fire(container, 'pointerup', { clientX: 80, clientY: 10 });

    expect(onReorder).toHaveBeenCalled();
    const detail = onReorder.mock.calls[0]![0];
    expect(detail.from).toBe(0);
    expect(detail.to).toBeGreaterThan(0);
    expect([...container.children].map((n) => n.textContent)).not.toEqual(['A', 'B', 'C']);

    ctrl.destroy();
  });

  it('respects canStart', () => {
    const onActivate = vi.fn();
    attachSortable(container, {
      itemSelector: ':scope > .item',
      threshold: 2,
      ghost: false,
      canStart: (item) => item !== a,
      onActivate,
    });

    fire(a, 'pointerdown', { clientX: 10, clientY: 10 });
    fire(a, 'pointermove', { clientX: 10, clientY: 40 });
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('resolves :scope > itemSelector via closest (WC / slotted hosts)', () => {
    const onActivate = vi.fn();
    const ctrl = attachSortable(container, {
      itemSelector: ':scope > .item',
      axis: 'x',
      threshold: 4,
      ghost: false,
      onActivate,
    });

    /* Same selector chips/cards use — must find the item, not return null */
    fire(b, 'pointerdown', { clientX: 60, clientY: 10 });
    fire(container, 'pointermove', { clientX: 120, clientY: 10 });
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(b.hasAttribute('dragging')).toBe(true);
    fire(container, 'pointerup', { clientX: 120, clientY: 10 });
    ctrl.destroy();
  });
});

describe('attachDraggable + attachDroppable', () => {
  let source: HTMLDivElement;
  let zone: HTMLDivElement;

  beforeEach(() => {
    source = document.createElement('div');
    zone = document.createElement('div');
    document.body.append(source, zone);
    for (const el of [source, zone]) {
      el.setPointerCapture = vi.fn();
      el.releasePointerCapture = vi.fn();
      el.hasPointerCapture = vi.fn(() => true);
    }
    mockRect(source, { left: 0, top: 0, width: 40, height: 40 });
    mockRect(zone, { left: 200, top: 0, width: 100, height: 100 });
  });

  afterEach(() => {
    source.remove();
    zone.remove();
    document.querySelectorAll('.k3-dnd-ghost').forEach((n) => n.remove());
    expect(getActiveDndPayload()).toBeNull();
  });

  it('drops typed payload on accepting zone', () => {
    const onDrop = vi.fn();
    const onEnd = vi.fn();
    const drop = attachDroppable(zone, {
      accept: ['k3/test'],
      onDrop,
    });
    const drag = attachDraggable(source, {
      type: 'k3/test',
      data: { id: 42 },
      threshold: 4,
      ghost: false,
      onEnd,
    });

    fire(source, 'pointerdown', { clientX: 10, clientY: 10 });
    fire(source, 'pointermove', { clientX: 10, clientY: 20 });
    expect(getActiveDndPayload()?.type).toBe('k3/test');
    expect(zone.hasAttribute('drop-target')).toBe(false);

    fire(source, 'pointermove', { clientX: 220, clientY: 20 });
    expect(zone.hasAttribute('drop-target')).toBe(true);

    fire(source, 'pointerup', { clientX: 220, clientY: 20 });
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop.mock.calls[0]![0].payload.data).toEqual({ id: 42 });
    expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ type: 'k3/test' }), true);

    drag.destroy();
    drop.destroy();
  });

  it('rejects non-accepted type', () => {
    const onDrop = vi.fn();
    attachDroppable(zone, { accept: ['k3/other'], onDrop });
    attachDraggable(source, {
      type: 'k3/test',
      threshold: 2,
      ghost: false,
    });

    fire(source, 'pointerdown', { clientX: 10, clientY: 10 });
    fire(source, 'pointermove', { clientX: 220, clientY: 20 });
    fire(source, 'pointerup', { clientX: 220, clientY: 20 });
    expect(onDrop).not.toHaveBeenCalled();
  });
});
