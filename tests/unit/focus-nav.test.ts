import { describe, it, expect } from 'vitest';
import {
  resolveFocusNavKey,
  indexOfFocusedItem,
  deepActiveElement,
  isFocusWithinHost,
  buildFocusNavLoop,
  annotateFocusNavResult,
  handleFocusNavKey,
  isFocusOnTrigger,
} from '../../src/core/focus-nav.js';

describe('resolveFocusNavKey', () => {
  it('both orientation — all four arrows step the list with wrap', () => {
    const down = resolveFocusNavKey({ key: 'ArrowDown', shiftKey: false }, 0, 3, {
      orientation: 'both',
      wrap: true,
    });
    expect(down).toMatchObject({ handled: true, kind: 'next', nextIndex: 1 });

    const right = resolveFocusNavKey({ key: 'ArrowRight', shiftKey: false }, 2, 3, {
      orientation: 'both',
      wrap: true,
    });
    expect(right.nextIndex).toBe(0);

    const up = resolveFocusNavKey({ key: 'ArrowUp', shiftKey: false }, 0, 3, {
      orientation: 'both',
      wrap: true,
    });
    expect(up.nextIndex).toBe(2);
  });

  it('horizontal respects RTL', () => {
    const ltr = resolveFocusNavKey({ key: 'ArrowRight', shiftKey: false }, 0, 3, {
      orientation: 'horizontal',
      rtl: false,
    });
    expect(ltr.nextIndex).toBe(1);

    const rtl = resolveFocusNavKey({ key: 'ArrowRight', shiftKey: false }, 0, 3, {
      orientation: 'horizontal',
      rtl: true,
    });
    expect(rtl.nextIndex).toBe(2); /* wrap prev from 0 */
  });

  it('vertical ignores left/right', () => {
    const left = resolveFocusNavKey({ key: 'ArrowLeft', shiftKey: false }, 1, 3, {
      orientation: 'vertical',
    });
    expect(left.handled).toBe(false);

    const down = resolveFocusNavKey({ key: 'ArrowDown', shiftKey: false }, 1, 3, {
      orientation: 'vertical',
    });
    expect(down.nextIndex).toBe(2);
  });

  it('Home / End / Tab', () => {
    expect(
      resolveFocusNavKey({ key: 'Home', shiftKey: false }, 2, 4, { homeEnd: true }).nextIndex,
    ).toBe(0);
    expect(
      resolveFocusNavKey({ key: 'End', shiftKey: false }, 0, 4, { homeEnd: true }).nextIndex,
    ).toBe(3);

    const tab = resolveFocusNavKey({ key: 'Tab', shiftKey: false }, 1, 3, { tab: true });
    expect(tab).toMatchObject({ handled: true, kind: 'next', nextIndex: 2 });

    const shiftTab = resolveFocusNavKey({ key: 'Tab', shiftKey: true }, 0, 3, { tab: true });
    expect(shiftTab.nextIndex).toBe(2);
  });

  it('no wrap clamps at edges and still handles the key', () => {
    const atStart = resolveFocusNavKey({ key: 'ArrowLeft', shiftKey: false }, 0, 3, {
      orientation: 'horizontal',
      wrap: false,
    });
    expect(atStart).toMatchObject({ handled: true, nextIndex: 0 });
  });

  it('unknown current (−1) enters at first / last', () => {
    expect(
      resolveFocusNavKey({ key: 'ArrowDown', shiftKey: false }, -1, 3, {
        orientation: 'vertical',
      }).nextIndex,
    ).toBe(0);
    expect(
      resolveFocusNavKey({ key: 'ArrowUp', shiftKey: false }, -1, 3, {
        orientation: 'vertical',
      }).nextIndex,
    ).toBe(2);
  });
});

describe('buildFocusNavLoop + trigger', () => {
  it('appends trigger at end by default (FAB / menu pattern)', () => {
    const a = document.createElement('button');
    const b = document.createElement('button');
    const trigger = document.createElement('button');
    const loop = buildFocusNavLoop([a, b], trigger, 'end');
    expect(loop.map((e) => e.type)).toEqual(['item', 'item', 'trigger']);
    expect(loop[2]).toMatchObject({ type: 'trigger', el: trigger });
  });

  it('End from first item lands on trigger; next wraps to first item', () => {
    const a = document.createElement('button');
    const b = document.createElement('button');
    const trigger = document.createElement('button');
    const loop = buildFocusNavLoop([a, b], trigger, 'end');
    const end = annotateFocusNavResult(
      resolveFocusNavKey({ key: 'End', shiftKey: false }, 0, loop.length, { homeEnd: true }),
      loop,
    );
    expect(end).toMatchObject({ onTrigger: true, nextIndex: 2, itemIndex: -1 });

    const wrap = annotateFocusNavResult(
      resolveFocusNavKey({ key: 'ArrowDown', shiftKey: false }, 2, loop.length, {
        orientation: 'vertical',
        wrap: true,
      }),
      loop,
    );
    expect(wrap).toMatchObject({ onTrigger: false, nextIndex: 0, itemIndex: 0 });
  });

  it('handleFocusNavKey focuses trigger when looping past last item', () => {
    const a = document.createElement('button');
    const b = document.createElement('button');
    const trigger = document.createElement('button');
    document.body.append(a, b, trigger);
    a.focus();
    let focused: HTMLElement | null = null;
    const ev = new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true });
    const nav = handleFocusNavKey(ev, [a, b], {
      orientation: 'vertical',
      homeEnd: true,
      trigger,
      triggerPosition: 'end',
      currentIndex: 0,
      focusTrigger: (el) => {
        focused = el;
        el.focus();
      },
    });
    expect(nav.onTrigger).toBe(true);
    expect(focused).toBe(trigger);
    expect(isFocusOnTrigger(trigger, deepActiveElement())).toBe(true);
    a.remove();
    b.remove();
    trigger.remove();
  });
});

describe('indexOfFocusedItem / deepActiveElement', () => {
  it('finds host in list via contains', () => {
    const a = document.createElement('button');
    const b = document.createElement('button');
    document.body.append(a, b);
    b.focus();
    expect(deepActiveElement()).toBe(b);
    expect(indexOfFocusedItem([a, b])).toBe(1);
    a.remove();
    b.remove();
  });
});

describe('isFocusWithinHost', () => {
  it('walks nested shadow + light parents to the host', () => {
    const host = document.createElement('div');
    const child = document.createElement('div');
    host.append(child);
    const shadow = child.attachShadow({ mode: 'open' });
    const btn = document.createElement('button');
    shadow.append(btn);
    document.body.append(host);
    btn.focus();
    expect(isFocusWithinHost(host, deepActiveElement())).toBe(true);
    host.remove();
  });
});
