import { describe, expect, it } from 'vitest';
import { FocusTrap, tabbableElements } from '../../src/core/focus-trap.js';
import { deepActiveElement } from '../../src/core/focus-nav.js';

/** Host whose shadow panel slots light-DOM actions — the dialog / sheet shape. */
class TrapHost extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<div class="panel"><button class="close">x</button><slot></slot><button disabled>off</button></div>`;
  }
  get panel(): HTMLElement {
    return this.shadowRoot!.querySelector('.panel')!;
  }
}
customElements.define('trap-host', TrapHost);

/** delegatesFocus component — entered through its inner button. */
class InnerButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true }).innerHTML = '<button>inner</button>';
  }
}
customElements.define('inner-button', InnerButton);

function setup(): { host: TrapHost; outside: HTMLButtonElement } {
  document.body.innerHTML = '';
  const outside = document.createElement('button');
  outside.textContent = 'outside';
  const host = document.createElement('trap-host') as TrapHost;
  host.innerHTML = `<a href="#a" id="link">a</a><span hidden><button id="hidden">h</button></span><inner-button id="ib"></inner-button><input id="last">`;
  document.body.append(outside, host);
  return { host, outside };
}

const tab = (target: Element, shift = false): void => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, composed: true, cancelable: true }));
};

describe('FocusTrap (composed tree)', () => {
  it('lists shadow + slotted tabbables in flat-tree order, skipping hidden / disabled', () => {
    const { host } = setup();
    const names = tabbableElements(host.panel).map((el) => el.id || el.className || el.localName);
    expect(names).toEqual(['close', 'link', 'button', 'last']);
  });

  it('focuses the first tabbable, wraps Tab / Shift+Tab, restores focus on deactivate', () => {
    const { host, outside } = setup();
    outside.focus();
    const trap = new FocusTrap();
    trap.activate(host.panel);
    expect(deepActiveElement()).toBe(host.shadowRoot!.querySelector('.close'));

    const last = document.getElementById('last')!;
    last.focus();
    tab(last);
    expect(deepActiveElement()).toBe(host.shadowRoot!.querySelector('.close'));

    tab(host.shadowRoot!.querySelector('.close')!, true);
    expect(deepActiveElement()).toBe(last);

    trap.deactivate();
    expect(document.activeElement).toBe(outside);
  });

  it('does not steal focus the user moved elsewhere', () => {
    const { host, outside } = setup();
    const other = document.createElement('button');
    document.body.append(other);
    outside.focus();
    const trap = new FocusTrap();
    trap.activate(host.panel);
    other.focus();
    trap.deactivate();
    expect(document.activeElement).toBe(other);
  });
});
