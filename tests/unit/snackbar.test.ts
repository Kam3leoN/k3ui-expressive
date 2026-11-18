import { describe, expect, it } from 'vitest';
import {
  SNACKBAR_DURATION_MS,
  SNACKBAR_STACK_ACTION_DP,
  resolveSnackbarDuration,
  snackbarShouldStack,
} from '../../src/components/feedback/snackbar.js';

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

/* ── Stack mode (snackbarQueue.setStack) ───────────────────── */

import { snackbarQueue, type SnackbarQueueTarget } from '../../src/components/feedback/snackbar-queue.js';

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
  /** Simulates the end of the intro (fully stretched). */
  finishOpen(): void {
    this.dispatchEvent(new Event('k3-open-end'));
  }
  hide = async (): Promise<boolean> => {
    this.dispatchEvent(new Event('k3-close-start'));
    this.dispatchEvent(new Event('k3-close-end'));
    return true;
  };
}

describe('snackbarQueue stack mode', () => {
  it('shows one at a time by default', async () => {
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

  it('stacks up to 3 (oldest in front), queues the rest, waits for the intro', async () => {
    snackbarQueue.setStack(3);
    const snacks = Array.from({ length: 4 }, () => new FakeSnack());
    snacks.forEach((s) => void snackbarQueue.request(s));
    await Promise.resolve();

    /* Front intro running → the others wait */
    expect(snacks.map((s) => s.opened)).toEqual([true, false, false, false]);
    snacks[0]!.finishOpen();
    expect(snacks.map((s) => s.opened)).toEqual([true, true, true, false]);
    expect(snacks.slice(0, 3).map((s) => s.stackDepth)).toEqual([0, 1, 2]);
    snacks[1]!.finishOpen();
    snacks[2]!.finishOpen();

    /* Front leaves: slide exit (others remain), stack moves forward, 4th enters behind */
    await snacks[0]!.hide();
    expect(snacks[0]!.stackSlideExit).toBe(false); /* reset once removed */
    expect(snacks.slice(1).map((s) => s.stackDepth)).toEqual([0, 1, 2]);
    expect(snacks[3]!.opened).toBe(true);

    for (const s of snacks.slice(1)) {
      s.finishOpen();
      await s.hide();
    }
    snackbarQueue.setStack(1);
  });

  it('clamps the stack size to 1–3', () => {
    snackbarQueue.setStack(10);
    expect(snackbarQueue.stack).toBe(3);
    snackbarQueue.setStack(0);
    expect(snackbarQueue.stack).toBe(1);
  });
});
