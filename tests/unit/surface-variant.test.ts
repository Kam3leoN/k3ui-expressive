import { describe, expect, it } from 'vitest';
import {
  resolveSurfaceVariant,
  syncResolvedSurface,
} from '../../src/core/surface-variant.js';

describe('resolveSurfaceVariant', () => {
  it('maps auto by compact breakpoint', () => {
    expect(resolveSurfaceVariant('auto', true)).toBe('modal');
    expect(resolveSurfaceVariant('auto', false)).toBe('docked');
    expect(resolveSurfaceVariant('modal', false)).toBe('modal');
    expect(resolveSurfaceVariant('docked', true)).toBe('docked');
  });
});

describe('syncResolvedSurface', () => {
  it('sets dataset and aria-modal', () => {
    const host = document.createElement('div');
    syncResolvedSurface(host, 'modal');
    expect(host.dataset.resolvedVariant).toBe('modal');
    expect(host.hasAttribute('aria-modal')).toBe(true);
    syncResolvedSurface(host, 'docked');
    expect(host.dataset.resolvedVariant).toBe('docked');
    expect(host.hasAttribute('aria-modal')).toBe(false);
  });
});
