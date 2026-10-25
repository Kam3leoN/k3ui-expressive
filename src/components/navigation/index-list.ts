import { html, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { K3Element, edgeScrollbarStyles, prefersReducedMotion } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  IndexListSpecs,
  INDEX_LIST_KEY_ORDER,
  groupIndexListItems,
  indexKeyToDisplayLabel,
  indexKeyToSectionId,
  sortIndexKeys,
  type IndexListItem,
} from './index-list.specs.js';
import { indexListStyles } from './index-list.styles.js';

export {
  IndexListSpecs,
  INDEX_LIST_KEY_ORDER,
  groupIndexListItems,
  resolveIndexKeyFromLabel,
  type IndexListItem,
} from './index-list.specs.js';

function parseItemsAttr(value: string | null): IndexListItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row) => {
      if (typeof row === 'string') return { label: row };
      const o = row as IndexListItem;
      return { label: String(o.label ?? ''), key: o.key, html: o.html };
    });
  } catch {
    return [];
  }
}

/**
 * Grouped directory list with optional A–Z rail and sticky section headers.
 *
 * @fires k3-section-change - `{ key }`
 */
export class K3IndexList extends K3Element {
  static override styles = [hostReset, edgeScrollbarStyles, indexListStyles];

  @property({
    attribute: 'items',
    converter: {
      fromAttribute: parseItemsAttr,
      toAttribute: (v: IndexListItem[]) => JSON.stringify(v),
    },
  })
  items: IndexListItem[] = [];

  @property({ reflect: true }) locale = IndexListSpecs.locale;

  @property({ type: Boolean, attribute: 'show-rail', reflect: true })
  showRail = IndexListSpecs.showRail;

  @property({ type: Boolean, attribute: 'sticky-headers', reflect: true })
  stickyHeaders = IndexListSpecs.stickyHeaders;

  @property({ type: Number, attribute: 'sticky-offset' })
  stickyOffset = IndexListSpecs.stickyOffset;

  @property({ type: Boolean, attribute: 'hide-empty-keys', reflect: true })
  hideEmptyKeys = IndexListSpecs.hideEmptyKeys;

  @property({ type: Boolean, attribute: 'rail-scrub', reflect: true })
  railScrub = IndexListSpecs.railScrub;

  @property({ attribute: 'scroll-root' })
  scrollRoot: string | null = null;

  @query('.content') private contentEl!: HTMLElement;
  @query('slot') private sourceSlot!: HTMLSlotElement;

  @state() private activeKey: string | null = null;
  @state() private slotTick = 0;

  private observer: IntersectionObserver | null = null;
  private scrollSpySuspended = false;
  private releaseTimer: number | null = null;

  /** Scroll the list to a section key. */
  scrollToKey(key: string, fromUser = true): void {
    const section = this.shadowRoot?.getElementById(indexKeyToSectionId(key));
    if (!section) return;

    this.scrollSpySuspended = true;
    if (this.releaseTimer != null) {
      window.clearTimeout(this.releaseTimer);
    }

    const behavior =
      fromUser && !prefersReducedMotion() ? ('smooth' as ScrollBehavior) : 'auto';

    this.setActiveKey(key, fromUser);
    this.scrollSectionIntoView(section, behavior);

    this.releaseTimer = window.setTimeout(() => {
      this.scrollSpySuspended = false;
      this.releaseTimer = null;
    }, behavior === 'smooth' ? 480 : 48);
  }

  getActiveKey(): string | null {
    return this.activeKey;
  }

  refresh(): void {
    this.slotTick += 1;
    this.setupObserver();
  }

  private resolvedEntries(): IndexListItem[] {
    void this.slotTick;
    if (this.items.length > 0) return this.items;
    return this.readSlottedEntries();
  }

  private readSlottedEntries(): IndexListItem[] {
    if (!this.sourceSlot) return [];
    const nodes = this.sourceSlot.assignedElements({ flatten: true });
    const out: IndexListItem[] = [];

    for (const node of nodes) {
      if (node.classList.contains('index-list__item')) {
        out.push({
          label: (node.textContent ?? '').trim(),
          html: node.innerHTML,
        });
        continue;
      }
      node.querySelectorAll('.index-list__item').forEach((el) => {
        out.push({
          label: (el.textContent ?? '').trim(),
          html: el.innerHTML,
        });
      });
    }
    return out;
  }

  private onSlotChange(): void {
    this.slotTick += 1;
    queueMicrotask(() => this.setupObserver());
  }

  private setActiveKey(key: string, fromUser: boolean): void {
    const changed = this.activeKey !== key;
    this.activeKey = key;
    if (changed || fromUser) {
      this.emit('k3-section-change', { key });
    }
  }

  private handleRailClick(key: string, event: Event): void {
    event.preventDefault();
    this.scrollToKey(key, true);
  }

  private handleRailScrub(event: PointerEvent): void {
    if (!this.railScrub) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const link = target?.closest('.rail-item:not(.rail-item--empty)') as HTMLElement | null;
    const key = link?.dataset.indexKey;
    if (key) this.scrollToKey(key, false);
  }

  private scrollSectionIntoView(section: HTMLElement, behavior: ScrollBehavior): void {
    const root = this.contentEl;
    if (root) {
      const top = section.offsetTop - this.stickyOffset;
      if (typeof root.scrollTo === 'function') {
        root.scrollTo({ top: Math.max(0, top), behavior });
      } else {
        root.scrollTop = Math.max(0, top);
      }
      return;
    }
    section.scrollIntoView?.({ behavior, block: 'start' });
  }

  private setupObserver(): void {
    this.observer?.disconnect();
    this.observer = null;

    if (typeof IntersectionObserver === 'undefined') return;

    const root = this.resolveScrollRoot();
    const sections = this.shadowRoot?.querySelectorAll<HTMLElement>('.section');
    if (!sections?.length) return;

    const offset = this.stickyOffset;
    this.observer = new IntersectionObserver(
      (entries) => {
        if (this.scrollSpySuspended) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({
            key: (e.target as HTMLElement).dataset.indexKey ?? '',
            top: e.boundingClientRect.top,
          }))
          .filter((v) => v.key);
        if (!visible.length) return;
        visible.sort((a, b) => a.top - b.top);
        this.setActiveKey(visible[0].key, false);
      },
      { root, rootMargin: `-${offset + 1}px 0px -60% 0px`, threshold: [0, 0.01, 0.25] },
    );

    sections.forEach((sec) => this.observer!.observe(sec));
  }

  private resolveScrollRoot(): Element | null {
    if (!this.scrollRoot) return this.contentEl ?? null;
    if (this.scrollRoot === 'host') return this;
    const found = document.querySelector(this.scrollRoot);
    return found instanceof Element ? found : this.contentEl ?? null;
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (
      changed.has('stickyOffset') ||
      changed.has('stickyHeaders') ||
      changed.has('items') ||
      changed.has('locale')
    ) {
      this.style.setProperty('--k3-index-list-sticky-offset', `${this.stickyOffset}px`);
    }
    if (changed.has('items') || changed.has('slotTick') || changed.has('locale')) {
      queueMicrotask(() => this.setupObserver());
    }
  }

  override disconnectedCallback(): void {
    this.observer?.disconnect();
    if (this.releaseTimer != null) window.clearTimeout(this.releaseTimer);
    super.disconnectedCallback();
  }

  override render() {
    const groups = groupIndexListItems(this.resolvedEntries(), this.locale);
    const presentKeys = sortIndexKeys([...groups.keys()]);
    const railKeys = this.hideEmptyKeys ? presentKeys : [...INDEX_LIST_KEY_ORDER];
    const active = this.activeKey ?? presentKeys[0] ?? null;

    return html`
      <slot class="slot-source" @slotchange=${this.onSlotChange}></slot>
      <div class="root">
        ${this.showRail
          ? html`<nav
              class="rail"
              aria-label="Section index"
              @pointermove=${this.handleRailScrub}
            >
              ${railKeys.map((key) => {
                const hasSection = groups.has(key);
                if (this.hideEmptyKeys && !hasSection) return nothing;
                const isActive = key === active;
                return html`<a
                  class=${classMap({
                    'rail-item': true,
                    'rail-item--active': isActive,
                    'rail-item--empty': !hasSection,
                  })}
                  href="#${indexKeyToSectionId(key)}"
                  data-index-key=${key}
                  aria-current=${isActive ? 'true' : nothing}
                  @click=${(e: Event) => this.handleRailClick(key, e)}
                  >${indexKeyToDisplayLabel(key)}</a
                >`;
              })}
            </nav>`
          : nothing}
        <div class="content k3-scroll">
          ${presentKeys.map((key) => {
            const sectionItems = groups.get(key) ?? [];
            return html`<section
              class="section"
              id=${indexKeyToSectionId(key)}
              data-index-key=${key}
              style=${`scroll-margin-top: ${this.stickyOffset}px`}
            >
              <header class="header">${indexKeyToDisplayLabel(key)}</header>
              <ul class="items" role="list">
                ${sectionItems.map(
                  (item) => html`<li class="item index-list__item">
                    ${item.html ? unsafeHTML(item.html) : item.label}
                  </li>`,
                )}
              </ul>
            </section>`;
          })}
        </div>
      </div>
    `;
  }
}

export default K3IndexList;

if (!customElements.get('k3-index-list')) {
  customElements.define('k3-index-list', K3IndexList);
}
