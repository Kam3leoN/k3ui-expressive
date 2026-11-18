import { describe, expect, it, vi } from 'vitest';
import {
  SNACKBAR_DURATION_MS,
  SNACKBAR_STACK_ACTION_DP,
  resolveSnackbarDuration,
  snackbarShouldStack,
} from '../../src/components/feedback/snackbar.js';
import {
  snackbarQueue,
  SNACKBAR_STACK_MAX,
  type SnackbarQueueTarget,
} from '../../src/components/feedback/snackbar-queue.js';

describe('resolveSnackbarDuration', () => {
  it('defaults to short without action', () => {
    expect(resolveSnackbarDuration(undefined, false)).toBe(SNACKBAR_DURATION_MS.short);
  });

  it('defaults to indefinite with action', () => {
    expect(resolveSnackbarDuration(undefined, true)).toBe(SNACKBAR_DURATION_MS.indefinite);
  });

  it('maps named tokens', () => {
    expect(resolveSnackbarDuration('short', false)).toBe(4000);
    expect(resolveSnackbarDuration('long', false)).toBe(10000);
    expect(resolveSnackbarDuration('indefinite', true)).toBe(0);
  });

  it('keeps numeric ms', () => {
    expect(resolveSnackbarDuration(2500, false)).toBe(2500);
    expect(resolveSnackbarDuration(0, true)).toBe(0);
  });
});

describe('snackbarShouldStack', () => {
  it('stacks when forced', () => {
    expect(snackbarShouldStack(0, true)).toBe(true);
    expect(snackbarShouldStack(10, true)).toBe(true);
  });

  it('stacks when action wider than 128 dp', () => {
    const rem = 16;
    const threshold = (SNACKBAR_STACK_ACTION_DP / 16) * rem;
    expect(snackbarShouldStack(threshold, false, rem)).toBe(false);
    expect(snackbarShouldStack(threshold + 1, false, rem)).toBe(true);
  });

  it('keeps short actions inline', () => {
    expect(snackbarShouldStack(48, false, 16)).toBe(false);
    expect(snackbarShouldStack(100, false, 16)).toBe(false);
  });
});

/** Fake snackbar: opens / closes on demand and emits the lifecycle events. */
class FakeSnack extends EventTarget implements SnackbarQueueTarget {
  stackDepth: number | null = null;
  stackSlideExit = false;
  opened = false;
  showNow = async (): Promise<boolean> => {
    this.opened = true;
    this.dispatchEvent(new Event('k3-open-start'));
    return true;
  };
  finishOpen(): void {
    this.dispatchEvent(new Event('k3-open-end'));
  }
  hide = async (): Promise<boolean> => {
    this.dispatchEvent(new Event('k3-close-start'));
    this.dispatchEvent(new Event('k3-close-end'));
    return true;
  };
}

describe('snackbarQueue (M3 one-at-a-time)', () => {
  it('shows one at a time and queues the rest', async () => {
    snackbarQueue.setStack(1);
    const a = new FakeSnack();
    const b = new FakeSnack();
    void snackbarQueue.request(a);
    void snackbarQueue.request(b);
    await Promise.resolve();
    a.finishOpen();
    expect(a.opened).toBe(true);
    expect(b.opened).toBe(false);
    expect(a.stackDepth).toBeNull();
    await a.hide();
    expect(b.opened).toBe(true);
    b.finishOpen();
    await b.hide();
  });

  it('clamps setStack to 1 (Material 3 — no multi-visible stack)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    snackbarQueue.setStack(3);
    expect(snackbarQueue.stack).toBe(1);
    expect(SNACKBAR_STACK_MAX).toBe(1);
    expect(warn).toHaveBeenCalled();
    snackbarQueue.setStack(0);
    expect(snackbarQueue.stack).toBe(1);
    warn.mockRestore();
  });
});
