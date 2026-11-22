import { html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, edgeScrollbarStyles, prefersReducedMotion } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import {
  TocSpecs,
  parseTocItems,
  tocHrefToId,
  type TocItem,
} from './toc.specs.js';
import { tocStyles } from './toc.styles.js';

export type { TocItem, TocLevel } from './toc.specs.js';
export { TocSpecs, parseTocItems, tocHrefToId } from './toc.specs.js';

/**
 * Sticky “On this page” table of contents — Pack-rail chrome, scroll-spy.
 *
 * @fires k3-select — `{ item, index }` when an entry is activated
 */
export class K3Toc extends K3Element {
  static override styles = [hostReset, edgeScrollbarStyles, tocStyles];

  @property({
    attribute: 'items',
    converter: {
      fromAttribute: parseTocItems,
      toAttribute: (v: TocItem[]) => (v.length ? JSON.stringify(v) : null),
    },
  })
  items: TocItem[] = [];

  /** Pin to the scrollport top (Pack-side sticky). */
  @property({ type: Boolean, reflect: true })
  sticky = TocSpecs.defaultSticky;

  /** CSS selector for the scroll root; empty = `window` / document. */
  @property({ attribute: 'scroll-root' })
  scrollRoot = '';

  /** Eyebrow above the list; empty → i18n `toc.label`. */
  @property()
  label = '';

  /** Accessible name for the nav landmark. */
  @property({ attribute: 'aria-label' })
  ariaLabel = '';

  @state() private activeHref: string | null = null;

  private observer: IntersectionObserver | null = null;
  private visibleIds = new Map<string, number>();
  private onLocale = (): void => {
    this.requestUpdate();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('k3-locale-change', this.onLocale);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('k3-locale-change', this.onLocale);
    this.teardownObserver();
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('items')) {
      if (!this.activeHref || !this.items.some((i) => i.href === this.activeHref)) {
        this.activeHref = this.items[0]?.href ?? null;
      }
    }
  }

  override updated(changed: PropertyValues): void {
    if (changed.has('items') || changed.has('scrollRoot')) {
      this.setupObserver();
    }
  }

  private resolveScrollRoot(): Element | null {
    const sel = this.scrollRoot?.trim();
    if (!sel) return null;
    try {
      return document.querySelector(sel);
    } catch {
      return null;
    }
  }

  private teardownObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.visibleIds.clear();
  }

  private setupObserver(): void {
    this.teardownObserver();
    if (!this.items.length) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const root = this.resolveScrollRoot();
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (!id) continue;
          if (entry.isIntersecting) {
            this.visibleIds.set(id, entry.intersectionRatio);
          } else {
            this.visibleIds.delete(id);
          }
        }
        this.syncActiveFromVisible();
      },
      {
        root,
        rootMargin: '-12% 0px -55% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 1],
      },
    );

    for (const item of this.items) {
      const id = tocHrefToId(item.href);
      if (!id) continue;
      const el = document.getElementById(id);
      if (el) this.observer.observe(el);
    }
  }

  private syncActiveFromVisible(): void {
    if (!this.visibleIds.size) return;
    /* Prefer the first TOC item that is currently intersecting (document order). */
    for (const item of this.items) {
      const id = tocHrefToId(item.href);
      if (id && this.visibleIds.has(id)) {
        if (this.activeHref !== item.href) this.activeHref = item.href;
        return;
      }
    }
  }

  private onActivate(item: TocItem, index: number, e: Event): void {
    this.activeHref = item.href;
    this.emit('k3-select', { item, index });

    const id = tocHrefToId(item.href);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    const root = this.resolveScrollRoot();
    if (root && typeof (root as HTMLElement).scrollTo === 'function') {
      const rootRect = root.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const nextTop = (root as HTMLElement).scrollTop + (targetRect.top - rootRect.top);
      (root as HTMLElement).scrollTo({ top: Math.max(0, nextTop), behavior });
    } else if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior, block: 'start' });
    }
  }

  private renderItem(item: TocItem, index: number) {
    const level = item.level ?? TocSpecs.defaultLevel;
    const active = this.activeHref === item.href;
    return html`<li>
      <a
        class=${classMap({
          link: true,
          [`link--level-${level}`]: level > 1,
        })}
        part="item"
        href=${item.href}
        aria-current=${active ? 'location' : nothing}
        @click=${(e: Event) => this.onActivate(item, index, e)}
        >${item.text}</a
      >
    </li>`;
  }

  override render() {
    const kicker = this.label || i18n.t('toc.label', TocSpecs.accessibility.defaultLabel);
    const navLabel =
      this.ariaLabel || i18n.t('toc.ariaLabel', TocSpecs.accessibility.defaultAriaLabel);

    return html`
      <nav class="panel" part="container" aria-label=${navLabel}>
        <p class="kicker" part="label">${kicker}</p>
        ${this.items.length
          ? html`<ol class="list k3-scroll" part="list">
              ${this.items.map((item, i) => this.renderItem(item, i))}
            </ol>`
          : html`<p class="empty">${i18n.t('toc.empty', 'No sections')}</p>`}
      </nav>
    `;
  }
}

if (!customElements.get('k3-toc')) {
  customElements.define('k3-toc', K3Toc);
}

export default K3Toc;
