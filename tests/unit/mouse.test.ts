import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  attachMouse,
  normalizeMouseButton,
  buttonsFromBitfield,
} from '../../src/core/mouse.js';

describe('mouse util', () => {
  const cleanups: Array<() => void> = [];
  let el: HTMLDivElement;

  afterEach(() => {
    cleanups.splice(0).forEach((fn) => fn());
    el?.remove();
  });

  it('maps buttons and bitfields', () => {
    expect(normalizeMouseButton(0)).toBe('left');
    expect(normalizeMouseButton(2)).toBe('right');
    expect([...buttonsFromBitfield(1 | 4)]).toEqual(
      expect.arrayContaining(['left', 'middle']),
    );
  });

  it('emits down / up / click / wheel', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    const m = attachMouse(el, { pointer: false });
    cleanups.push(() => m.destroy());

    const down = vi.fn();
    const up = vi.fn();
    const click = vi.fn();
    const wheel = vi.fn();
    m.on('down', down);
    m.on('up', up);
    m.on('click', click);
    m.on('wheel', wheel);

    el.dispatchEvent(
      new MouseEvent('mousedown', { button: 0, clientX: 10, clientY: 20, bubbles: true }),
    );
    el.dispatchEvent(
      new MouseEvent('mouseup', { button: 0, clientX: 10, clientY: 20, bubbles: true }),
    );
    el.dispatchEvent(
      new MouseEvent('click', { button: 0, clientX: 10, clientY: 20, bubbles: true }),
    );
    el.dispatchEvent(
      new WheelEvent('wheel', { deltaY: 40, clientX: 10, clientY: 20, bubbles: true }),
    );

    expect(down).toHaveBeenCalled();
    expect(down.mock.calls[0][0].button).toBe('left');
    expect(up).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(wheel.mock.calls[0][0].deltaY).toBe(40);
  });

  it('starts drag past threshold', () => {
    el = document.createElement('div');
    document.body.appendChild(el);
    const m = attachMouse(el, { pointer: false, dragThreshold: 4 });
    cleanups.push(() => m.destroy());

    const start = vi.fn();
    const drag = vi.fn();
    const end = vi.fn();
    m.on('dragstart', start);
    m.on('drag', drag);
    m.on('dragend', end);

    el.dispatchEvent(
      new MouseEvent('mousedown', { button: 0, clientX: 0, clientY: 0, bubbles: true }),
    );
    el.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 10, clientY: 0, buttons: 1, bubbles: true }),
    );
    el.dispatchEvent(
      new MouseEvent('mouseup', { button: 0, clientX: 10, clientY: 0, bubbles: true }),
    );

    expect(start).toHaveBeenCalled();
    expect(drag).toHaveBeenCalled();
    expect(end).toHaveBeenCalled();
    expect(m.dragging).toBe(false);
  });
});
