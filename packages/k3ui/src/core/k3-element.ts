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
/**
 * ARIA attributes authors put on a host that belong on its inner native
 * control: `<k3-button aria-label="Like">` (icon only) must name the
 * shadow `<button>` the user actually focuses. Hosts keep the attribute;
 * components that render a control mirror it ({@link K3Element.forwardedAria}).
 */
export const FORWARDED_ARIA = ['aria-label', 'aria-expanded', 'aria-haspopup', 'aria-controls'] as const;
export type ForwardedAria = (typeof FORWARDED_ARIA)[number];

export class K3Element extends LitElement {
  @property({ reflect: true })
  density: Density = 'default';

  static override get observedAttributes(): string[] {
    return [...new Set([...super.observedAttributes, ...FORWARDED_ARIA])];
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    /* Re-render so the inner control picks the new value up (components that
       declare the attribute as a property still get it through super). */
    if (old !== value && (FORWARDED_ARIA as readonly string[]).includes(name)) this.requestUpdate();
    super.attributeChangedCallback(name, old, value);
  }

  /** Host value of a forwarded ARIA attribute (`undefined` when absent or empty). */
  protected forwardedAria(name: ForwardedAria): string | undefined {
    return this.getAttribute(name) || undefined;
  }

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
