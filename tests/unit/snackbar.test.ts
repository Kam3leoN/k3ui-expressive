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
