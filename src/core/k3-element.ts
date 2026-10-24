import { LitElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { hasSlot } from './slots.js';
import { debug } from '../debug/logger.js';

/**
 * Spacing density.
 * - `default` / `compact` — generic components
 * - `0` · `-1` · `-2` · `-3` — M3 list/menu density (0 = roomiest)
 */
export type Density = 'default' | 'compact' | 0 | -1 | -2 | -3;

/**
 * Base Lit element for all K3ui components.
 * Provides density, slot helpers, locale refresh, and debug hooks.
 */
export class K3Element extends LitElement {
  @property({ reflect: true })
  density: Density = 'default';

  private onLocaleChange = (): void => {
    /* Defer so playground / host can rewrite light-DOM i18n first */
    queueMicrotask(() => this.requestUpdate());
  };

  protected hasSlot(name?: string): boolean {
    return hasSlot(this, name);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof document !== 'undefined') {
      document.addEventListener('k3-locale-change', this.onLocaleChange);
    }
  }

  override disconnectedCallback(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('k3-locale-change', this.onLocaleChange);
    }
    super.disconnectedCallback();
  }

  protected updated(changed: PropertyValues): void {
    super.updated(changed);
    if (import.meta.env?.DEV) {
      debug.verbose(this.localName, 'updated', [...changed.keys()]);
    }
  }

  protected emit<T>(name: string, detail?: T, cancelable = false): boolean {
    return this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
        cancelable,
      }),
    );
  }
}
