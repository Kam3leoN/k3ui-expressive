import { beforeAll, describe, expect, it } from 'vitest';
import { init } from '../../src/index.js';
import { syntax } from '../../src/syntax/index.js';
import { registerWhen } from '../../src/registry/register.js';
import type { K3Tabs } from '../../src/components/navigation/tabs.js';
import type { K3TextField } from '../../src/components/inputs/text-field.js';

beforeAll(async () => {
  window.K3UI_MANUAL = true;
  await init({ components: ['k3-tabs', 'k3-text-field', 'k3-select', 'k3-menu-item'], theme: { mode: 'light' } });
});

describe('k3-tabs hardening', () => {
  it('renders SVG icons through sanitizeSVG (no handlers, no scripts)', async () => {
    const tabs = document.createElement('k3-tabs') as K3Tabs;
    tabs.variant = 'primary';
    tabs.labels = 'A,B';
    tabs.customIcons = [
      '<svg viewBox="0 0 24 24" onload="alert(1)"><script>alert(2)</script><path d="M0 0h24v24H0z"/></svg>',
      '<svg><foreignObject><img src=x onerror=alert(3)></foreignObject><circle r="3"/></svg>',
    ];
    document.body.append(tabs);
    await tabs.updateComplete;
    const icons = tabs.shadowRoot!.querySelectorAll('.icon--svg svg');
    expect(icons.length).toBe(2);
    expect(tabs.shadowRoot!.querySelector('script, foreignObject, img, [onload], [onerror]')).toBeNull();
    expect(icons[0]!.querySelector('path')!.getAttribute('d')).toBe('M0 0h24v24H0z');
    /* Same markup on re-render → same node (no re-parse) */
    tabs.requestUpdate();
    await tabs.updateComplete;
    expect(tabs.shadowRoot!.querySelectorAll('.icon--svg svg')[0]).toBe(icons[0]);
    tabs.remove();
  });

  it('roving tabindex + arrow / Home / End keys (APG tabs)', async () => {
    const tabs = document.createElement('k3-tabs') as K3Tabs;
    tabs.labels = 'One,Two,Three';
    document.body.append(tabs);
    await tabs.updateComplete;
    const buttons = () => [...tabs.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    expect(buttons().map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    const changes: number[] = [];
    const nextChange = () =>
      new Promise<number>((resolve) => {
        tabs.addEventListener(
          'k3-change',
          (e) => {
            const index = (e as CustomEvent<{ index: number }>).detail.index;
            changes.push(index);
            resolve(index);
          },
          { once: true },
        );
      });
    const press = async (from: number, key: string): Promise<void> => {
      const pending = nextChange();
      buttons()[from]!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      await pending;
      await tabs.updateComplete;
    };
    await press(0, 'ArrowRight');
    expect(buttons().map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
    await press(1, 'End');
    expect(buttons()[2]!.tabIndex).toBe(0);
    await press(2, 'ArrowRight');
    expect(buttons()[0]!.tabIndex).toBe(0); /* wraps */
    expect(changes).toEqual([1, 2, 0]);
    tabs.remove();
  });
});

/* jsdom has no ElementInternals.setValidity — covered in a real browser by tests/e2e/forms.spec.ts */
const internalsValidation = typeof (HTMLElement.prototype.attachInternals as unknown) === 'function' &&
  'setValidity' in (globalThis.ElementInternals?.prototype ?? {});

describe('form validation', () => {
  it.skipIf(!internalsValidation)('k3-text-field reports required / pattern to its form', async () => {
    const form = document.createElement('form');
    form.innerHTML = `<k3-text-field name="email" required pattern="[a-z]+@x\\.io" value=""></k3-text-field>`;
    document.body.append(form);
    const tf = form.querySelector('k3-text-field') as K3TextField;
    await tf.updateComplete;
    expect(tf.checkValidity()).toBe(false);
    expect(tf.validity.valueMissing).toBe(true);
    expect(form.checkValidity()).toBe(false);

    tf.value = 'nope';
    await tf.updateComplete;
    expect(tf.validity.patternMismatch).toBe(true);

    tf.value = 'me@x.io';
    await tf.updateComplete;
    expect(tf.checkValidity()).toBe(true);
    expect(form.checkValidity()).toBe(true);

    tf.setCustomValidity('Taken');
    expect(tf.checkValidity()).toBe(false);
    expect(tf.validationMessage).toBe('Taken');
    tf.setCustomValidity('');
    expect(tf.checkValidity()).toBe(true);
    form.remove();
  });

  it('k3-text-field resets to its value attribute and follows a disabled fieldset', async () => {
    const tf = document.createElement('k3-text-field') as K3TextField;
    tf.setAttribute('value', 'start');
    document.body.append(tf);
    await tf.updateComplete;
    tf.value = 'typed';
    tf.formResetCallback();
    expect(tf.value).toBe('start');
    tf.formDisabledCallback(true);
    expect(tf.disabled).toBe(true);
    tf.remove();
  });

  it.skipIf(!internalsValidation)('k3-select required without value is invalid', async () => {
    const sel = document.createElement('k3-select') as HTMLElement & {
      required: boolean;
      value: string;
      checkValidity(): boolean;
      internals: ElementInternals;
      updateComplete: Promise<unknown>;
    };
    sel.required = true;
    sel.innerHTML = '<k3-menu-item value="a">A</k3-menu-item>';
    document.body.append(sel);
    await sel.updateComplete;
    expect(sel.checkValidity()).toBe(false);
    sel.value = 'a';
    await sel.updateComplete;
    expect(sel.checkValidity()).toBe(true);
    sel.remove();
  });
});

describe('robustness', () => {
  it('syntax: prototype keys are plain unknown languages (escaped output)', () => {
    expect(syntax.resolve('constructor')).toBe('constructor');
    expect(syntax.resolve('__proto__')).toBe('__proto__');
    expect(syntax.highlight('<img src=x onerror=alert(1)>', 'constructor')).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(syntax.isKnown('toString')).toBe(false);
  });

  it('registerWhen() also defines the root element itself', async () => {
    const el = document.createElement('k3-badge');
    document.body.append(el);
    const tags = await registerWhen(el, 'eager');
    expect(tags).toContain('k3-badge');
    expect(customElements.get('k3-badge')).toBeDefined();
    el.remove();
  });
});
