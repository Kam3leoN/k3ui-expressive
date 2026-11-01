import { afterEach, describe, expect, it } from 'vitest';
import { pendingCustomElements, whenTriggered } from '../../src/core/lazy.js';
import { isKnown, registerWhen } from '../../src/registry/register.js';
import '../../src/components/feedback/lazy.js';
import type { K3Lazy } from '../../src/components/feedback/lazy.js';

const tick = (ms = 0): Promise<void> => new Promise((r) => setTimeout(r, ms));

describe('lazy utilities', () => {
  it('lists undefined custom elements once (light DOM)', () => {
    const root = document.createElement('div');
    root.innerHTML = '<x-later></x-later><x-later></x-later><span><x-other></x-other></span><p></p>';
    expect(pendingCustomElements(root).sort()).toEqual(['x-later', 'x-other']);
  });

  it('resolves eager, idle and visible (no IntersectionObserver) triggers', async () => {
    const el = document.createElement('div');
    await expect(whenTriggered(el, 'eager')).resolves.toBeUndefined();
    await expect(whenTriggered(el, 'idle')).resolves.toBeUndefined();
    await expect(whenTriggered(el, 'visible')).resolves.toBeUndefined();
  });

  it('waits for intent with the interaction trigger', async () => {
    const el = document.createElement('button');
    document.body.append(el);
    let done = false;
    const pending = whenTriggered(el, 'interaction').then(() => {
      done = true;
    });
    await tick(5);
    expect(done).toBe(false);
    el.dispatchEvent(new Event('pointerdown'));
    await pending;
    expect(done).toBe(true);
    el.remove();
  });

  it('rejects with an AbortError when aborted', async () => {
    const ctrl = new AbortController();
    const pending = whenTriggered(document.createElement('div'), 'manual', { signal: ctrl.signal });
    ctrl.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('registerWhen defines the k3 tags used under a root', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<k3-badge></k3-badge><x-not-k3></x-not-k3>';
    document.body.append(root);
    expect(customElements.get('k3-badge')).toBeUndefined();
    const tags = await registerWhen(root, 'eager');
    expect(tags).toEqual(['k3-badge']);
    expect(customElements.get('k3-badge')).toBeTruthy();
    expect(isKnown('x-not-k3')).toBe(false);
    root.remove();
  });
});

describe('k3-lazy', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const mount = async (markup: string): Promise<K3Lazy> => {
    document.body.innerHTML = markup;
    const el = document.querySelector('k3-lazy') as K3Lazy;
    await el.updateComplete;
    return el;
  };

  it('wraps the content in a skeleton, then registers and reveals it', async () => {
    const el = await mount('<k3-lazy trigger="manual"><k3-divider></k3-divider><p>Hello</p></k3-lazy>');
    expect(el.state).toBe('idle');
    expect(el.hasAttribute('aria-busy')).toBe(true);
    const skeleton = el.shadowRoot!.querySelector('k3-skeleton') as HTMLElement & { loaded: boolean };
    expect(skeleton.loaded).toBe(false);

    const events: string[] = [];
    el.addEventListener('k3-load-start', () => events.push('start'));
    el.addEventListener('k3-load-end', (e) => events.push(`end:${String((e as CustomEvent).detail.ok)}`));
    await el.load();
    await el.updateComplete;

    expect(el.state).toBe('ready');
    expect(skeleton.loaded).toBe(true);
    expect(el.hasAttribute('aria-busy')).toBe(false);
    expect(customElements.get('k3-divider')).toBeTruthy();
    expect(events).toEqual(['start', 'end:true']);
  });

  it('loads by itself with a non-manual trigger', async () => {
    const el = await mount('<k3-lazy trigger="eager"><p>Hi</p></k3-lazy>');
    await tick(10);
    await el.updateComplete;
    expect(el.state).toBe('ready');
  });

  it('awaits the loader and recovers from errors with Retry', async () => {
    const el = await mount('<k3-lazy trigger="manual"><p>Data</p></k3-lazy>');
    let fail = true;
    el.loader = async () => {
      if (fail) throw new Error('offline');
    };
    const errors: unknown[] = [];
    el.addEventListener('k3-error', (e) => errors.push((e as CustomEvent).detail.error));

    await el.load();
    await el.updateComplete;
    expect(el.state).toBe('error');
    expect(el.shadowRoot!.querySelector('[role="alert"]')).toBeTruthy();
    expect(errors).toHaveLength(1);

    fail = false;
    (el.shadowRoot!.querySelector('.retry') as HTMLButtonElement).click();
    await tick(10);
    await el.updateComplete;
    expect(el.state).toBe('ready');
  });

  it('shows the loading indicator only for slow loads', async () => {
    const fast = await mount(
      '<k3-lazy trigger="manual" fallback="indicator" delay="40" min-duration="0"><p>x</p></k3-lazy>',
    );
    fast.loader = () => tick(5);
    await fast.load();
    await fast.updateComplete;
    expect(fast.shadowRoot!.querySelector('k3-loading-indicator')).toBeNull();

    const slow = await mount(
      '<k3-lazy trigger="manual" fallback="indicator" delay="10" min-duration="0"><p>y</p></k3-lazy>',
    );
    slow.loader = () => tick(80);
    const pending = slow.load();
    await tick(40);
    await slow.updateComplete;
    expect(slow.shadowRoot!.querySelector('k3-loading-indicator')).toBeTruthy();
    await pending;
    await slow.updateComplete;
    expect(slow.shadowRoot!.querySelector('k3-loading-indicator')).toBeNull();
  });

  it('uses a slotted fallback instead of the skeleton', async () => {
    const el = await mount('<k3-lazy trigger="manual"><p slot="fallback">Wait…</p><p>Done</p></k3-lazy>');
    expect(el.shadowRoot!.querySelector('k3-skeleton')).toBeNull();
    expect(el.shadowRoot!.querySelector('slot[name="fallback"]')).toBeTruthy();
    await el.load();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('slot[name="fallback"]')).toBeNull();
  });
});
