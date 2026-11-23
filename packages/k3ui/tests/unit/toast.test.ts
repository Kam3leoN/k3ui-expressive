import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  toastManager,
  toast,
  type ToastRecord,
} from '../../src/components/feedback/toast-manager.js';
import {
  measureScrollbarInlineGutter,
  applyToastChromeInsets,
} from '../../src/components/feedback/toast-chrome.js';
import '../../src/components/feedback/toast.js';

describe('toast-manager', () => {
  beforeEach(() => {
    toastManager.dismiss();
    toastManager.configure({ limit: 3, timeout: 5000, position: 'bottom-right' });
  });

  afterEach(() => {
    toastManager.dismiss();
  });

  it('show / typed helpers push newest first', () => {
    const a = toast.success('Saved');
    const b = toast.info('Hello');
    expect(toastManager.toasts.map((t) => t.id)).toEqual([b, a]);
    expect(toastManager.toasts[0]?.type).toBe('info');
    expect(toastManager.toasts[1]?.type).toBe('success');
  });

  it('limit stays configurable (default 3)', () => {
    expect(toastManager.limit).toBe(3);
    toastManager.configure({ limit: 2 });
    expect(toastManager.limit).toBe(2);
  });

  it('dismiss one or all', () => {
    const a = toast.show({ title: 'A' });
    toast.show({ title: 'B' });
    expect(toastManager.toasts).toHaveLength(2);
    toast.dismiss(a);
    expect(toastManager.toasts).toHaveLength(1);
    expect(toastManager.toasts[0]?.title).toBe('B');
    toast.dismiss();
    expect(toastManager.toasts).toHaveLength(0);
  });

  it('loading timeout defaults to indefinite; update restores default timeout', () => {
    const id = toast.show({ title: '…', type: 'loading' });
    expect(toastManager.toasts[0]?.timeout).toBe(0);
    toastManager.update(id, { title: 'Done', type: 'success' });
    expect(toastManager.toasts[0]?.type).toBe('success');
    expect(toastManager.toasts[0]?.timeout).toBe(5000);
  });

  it('promise swaps loading → success', async () => {
    const p = Promise.resolve({ name: 'a.png' });
    const id = toast.promise(p, {
      loading: 'Uploading…',
      success: (r) => `Uploaded ${r.name}`,
      error: 'Failed',
    });
    expect(toastManager.toasts[0]?.id).toBe(id);
    expect(toastManager.toasts[0]?.type).toBe('loading');
    await p;
    await Promise.resolve();
    expect(toastManager.toasts[0]?.type).toBe('success');
    expect(toastManager.toasts[0]?.title).toBe('Uploaded a.png');
  });

  it('promise swaps loading → error', async () => {
    const p = Promise.reject(new Error('x'));
    toast.promise(p, {
      loading: 'Uploading…',
      success: 'OK',
      error: 'Failed',
    });
    await p.catch(() => undefined);
    await Promise.resolve();
    expect(toastManager.toasts[0]?.type).toBe('error');
    expect(toastManager.toasts[0]?.title).toBe('Failed');
  });

  it('notifies subscribers', () => {
    const spy = vi.fn();
    const off = toastManager.subscribe(spy);
    toast.info('Hi');
    expect(spy).toHaveBeenCalled();
    off();
    toast.info('Bye');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('k3-toast host', () => {
  let host: HTMLElement;

  beforeEach(() => {
    toastManager.dismiss();
    host = document.createElement('k3-toast');
    document.body.append(host);
  });

  afterEach(() => {
    toastManager.dismiss();
    host.remove();
  });

  it('renders stacked cards and marks overflow as limited', async () => {
    await customElements.whenDefined('k3-toast');
    const el = host as HTMLElement & { updateComplete: Promise<unknown>; limit: number };
    el.limit = 3;
    toast.success('1');
    toast.info('2');
    toast.warning('3');
    toast.error('4');
    await el.updateComplete;
    await el.updateComplete;
    const cards = el.shadowRoot?.querySelectorAll('.toast') ?? [];
    expect(cards.length).toBe(4);
    const limited = [...cards].filter((n) => (n as HTMLElement).hasAttribute('data-limited'));
    expect(limited).toHaveLength(1);
    expect(el.shadowRoot?.querySelector('[data-type="success"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[data-k3-icon="close"]')).toBeTruthy();
  });

  it('close button dismisses the toast', async () => {
    await customElements.whenDefined('k3-toast');
    const el = host as HTMLElement & { updateComplete: Promise<unknown> };
    toast.info('Closeable');
    await el.updateComplete;
    const close = el.shadowRoot?.querySelector('.close') as HTMLButtonElement;
    expect(close).toBeTruthy();
    close.click();
    await new Promise((r) => setTimeout(r, 520));
    expect(toastManager.toasts).toHaveLength(0);
  });

  it('reindexes peers immediately on leave so stack can settle smoothly', async () => {
    await customElements.whenDefined('k3-toast');
    const el = host as HTMLElement & { updateComplete: Promise<unknown> };
    toast.success('Front');
    toast.info('Mid');
    toast.warning('Back');
    await el.updateComplete;
    const frontClose = el.shadowRoot?.querySelector(
      '.toast[data-index="0"] .close',
    ) as HTMLButtonElement;
    frontClose.click();
    await el.updateComplete;
    const leaving = el.shadowRoot?.querySelector('.toast[data-leaving]');
    expect(leaving).toBeTruthy();
    /* Peers already at stack slots 0 and 1 while front exits */
    const mid = el.shadowRoot?.querySelector('.toast:not([data-leaving])[data-index="0"]');
    const back = el.shadowRoot?.querySelector('.toast:not([data-leaving])[data-index="1"]');
    expect(mid).toBeTruthy();
    expect(back).toBeTruthy();
  });

  it('type icons use data-k3-icon ligatures (check_circle · info · warning · error · close)', async () => {
    await customElements.whenDefined('k3-toast');
    const el = host as HTMLElement & { updateComplete: Promise<unknown> };
    toast.success('Ok');
    toast.info('Info');
    toast.warning('Warn');
    toast.error('Err');
    await el.updateComplete;
    const root = el.shadowRoot!;
    expect(root.querySelector('[data-k3-icon="check_circle"]')).toBeTruthy();
    expect(root.querySelector('[data-k3-icon="info"]')).toBeTruthy();
    expect(root.querySelector('[data-k3-icon="warning"]')).toBeTruthy();
    expect(root.querySelector('[data-k3-icon="error"]')).toBeTruthy();
    expect(root.querySelectorAll('[data-k3-icon="close"]').length).toBeGreaterThan(0);
  });
});

describe('toast records shape', () => {
  it('keeps action payload', () => {
    toastManager.dismiss();
    const onClick = vi.fn();
    toast.error('Fail', { action: { label: 'Retry', onClick } });
    const rec = toastManager.toasts[0] as ToastRecord;
    expect(rec.action?.label).toBe('Retry');
    rec.action?.onClick();
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('toast-chrome insets', () => {
  it('writes logical chrome CSS vars (RTL-safe) including scrollbar gutter', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const m = applyToastChromeInsets(host);
    expect(host.style.getPropertyValue('--k3-toast-chrome-inset-inline-end')).toMatch(/px$/);
    expect(host.style.getPropertyValue('--k3-toast-chrome-inset-inline-start')).toMatch(/px$/);
    expect(host.style.getPropertyValue('--k3-toast-chrome-inset-block-end')).toMatch(/px$/);
    expect(host.style.getPropertyValue('--k3-toast-scrollbar-inline')).toBe(`${m.scrollbar}px`);
    expect(measureScrollbarInlineGutter()).toBeGreaterThanOrEqual(0);
    host.remove();
  });
});
