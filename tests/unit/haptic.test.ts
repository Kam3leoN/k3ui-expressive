import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { haptic } from '../../src/core/haptic.js';

describe('haptic', () => {
  const vibrate = vi.fn(() => true);

  beforeEach(() => {
    vibrate.mockClear();
    haptic.setEnabled(true);
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: vibrate,
      writable: true,
    });
  });

  afterEach(() => {
    haptic.setEnabled(true);
  });

  it('reports support when vibrate exists', () => {
    expect(haptic.isSupported()).toBe(true);
  });

  it('pulses named patterns', () => {
    expect(haptic.light()).toBe(true);
    expect(vibrate).toHaveBeenCalledWith(10);
    expect(haptic.selection()).toBe(true);
    expect(vibrate).toHaveBeenCalledWith(8);
    expect(haptic.success()).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([12, 40, 18]);
  });

  it('respects setEnabled(false)', () => {
    vibrate.mockClear();
    haptic.setEnabled(false);
    expect(haptic.pulse('medium')).toBe(false);
    expect(vibrate).toHaveBeenCalledWith(0); // cancel on disable
    expect(haptic.isEnabled()).toBe(false);
  });

  it('accepts custom ms patterns', () => {
    haptic.pulse([5, 10, 5]);
    expect(vibrate).toHaveBeenCalledWith([5, 10, 5]);
  });
});
