/**
 * Haptic feedback — `navigator.vibrate` with named patterns.
 * Safe no-op when unsupported (desktop / iOS Safari) or disabled.
 *
 * ```ts
 * import { haptic } from 'k3ui';
 * haptic.selection();
 * haptic.pulse('medium');
 * ```
 */

export type HapticNamed =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error'
  | 'rigid'
  | 'soft';

export type HapticPattern = HapticNamed | number | number[];

const PATTERNS: Record<HapticNamed, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  selection: 8,
  rigid: 12,
  soft: [8, 20, 12],
  success: [12, 40, 18],
  warning: [28, 36, 28],
  error: [40, 28, 40, 28, 50],
};

let enabled = true;

function canVibrate(): boolean {
  return (
    enabled &&
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  );
}

export const haptic = {
  /** Feature detect */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  },

  isEnabled(): boolean {
    return enabled;
  },

  /** Global kill-switch (persists in-memory only) */
  setEnabled(value: boolean): void {
    const was = enabled;
    enabled = value;
    if (was && !value && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(0);
      } catch {
        /* ignore */
      }
    }
  },

  /**
   * Fire a named or custom vibration pattern.
   * @returns true if the browser accepted the call
   */
  pulse(pattern: HapticPattern = 'light'): boolean {
    if (!canVibrate()) return false;
    const resolved =
      typeof pattern === 'string' ? (PATTERNS[pattern] ?? PATTERNS.light) : pattern;
    try {
      return navigator.vibrate(resolved);
    } catch {
      return false;
    }
  },

  light(): boolean {
    return haptic.pulse('light');
  },
  medium(): boolean {
    return haptic.pulse('medium');
  },
  heavy(): boolean {
    return haptic.pulse('heavy');
  },
  selection(): boolean {
    return haptic.pulse('selection');
  },
  success(): boolean {
    return haptic.pulse('success');
  },
  warning(): boolean {
    return haptic.pulse('warning');
  },
  error(): boolean {
    return haptic.pulse('error');
  },
};

export default haptic;
