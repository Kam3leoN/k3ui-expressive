/**
 * Spécifications `k3-lazy` — région chargée à la demande, avec squelette ou
 * indicateur de chargement pendant l’attente (M3 Expressive).
 */
import type { LazyTrigger } from '../../core/lazy.js';

/** skeleton (default) · indicator · none — a `slot="fallback"` child overrides both */
export type LazyFallback = 'skeleton' | 'indicator' | 'none';

/** idle → loading → ready | error */
export type LazyState = 'idle' | 'loading' | 'ready' | 'error';

export const LAZY_FALLBACKS: readonly LazyFallback[] = ['skeleton', 'indicator', 'none'];

export const LazySpecs = {
  defaultTrigger: 'visible' as LazyTrigger,
  defaultFallback: 'skeleton' as LazyFallback,
  /** Start loading slightly before the region scrolls into view. */
  defaultRootMargin: '200px',
  /** The indicator only appears for loads longer than this (anti-flicker), in ms. */
  indicatorDelay: 150,
  /** Once visible, the indicator stays at least this long (no blink), in ms. */
  indicatorMinDuration: 300,
  accessibility: {
    loadingLabel: 'Loading…',
    errorLabel: 'This content couldn’t load',
    retryLabel: 'Retry',
  },
} as const;
