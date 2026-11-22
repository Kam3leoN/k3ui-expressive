import { html, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  K3Element,
  edgeScrollbarStyles,
  haptic,
  prefersReducedMotion,
} from '../../core/index.js';
import { i18n } from '../../i18n/index.js';
import { hostReset } from '../_shared.js';
import {
  IndexListSpecs,
  INDEX_LIST_KEY_ORDER,
  groupIndexListItems,
  indexKeyToAriaLabel,
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
  indexKeyToAriaLabel,
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

  /** Per-index haptic on rail select / scrub — respects global `haptic.setEnabled`. */
  @property({ type: Boolean, reflect: true })
  haptic = IndexListSpecs.haptic;

  @property({ attribute: 'scroll-root' })
  scrollRoot: string | null = null;

  @query('.content') private contentEl!: HTMLElement;
  @query('.rail') private railEl!: HTMLElement | null;
  @query('slot') private sourceSlot!: HTMLSlotElement;

  @state() private activeKey: string | null = null;
  @state() private slotTick = 0;

  private scrollSpySuspended = false;
  private releaseTimer: number | null = null;
  private railPointerId: number | null = null;
  private lastScrubKey: string | null = null;
  private hapticTickAt = 0;
  private boundContentScroll = (): void => this.syncActiveFromScroll();

  /** Replace the data-driven directory and rebuild sections / rail. */
  setItems(items: IndexListItem[]): void {
    this.items = items.map((row) =>
      typeof row === 'string'
        ? { label: row }
        : { label: String(row.label ?? ''), key: row.key, html: row.html },
    );
  }

  /** Scroll the list to a section key. */
  scrollToKey(key: string, fromUser = true): void {
    this.jumpToKey(key, {
      fromUser,
      haptic: fromUser,
      behavior:
        fromUser && !prefersReducedMotion() ? ('smooth' as ScrollBehavior) : 'auto',
    });
  }

  getActiveKey(): string | null {
    return this.activeKey;
  }

  refresh(): void {
    this.slotTick += 1;
    queueMicrotask(() => {
      this.bindScrollSpy();
      this.syncActiveFromScroll();
    });
  }

  private jumpToKey(
    key: string,
    opts: { fromUser: boolean; haptic: boolean; behavior: ScrollBehavior },
  ): void {
    const section = this.shadowRoot?.getElementById(indexKeyToSectionId(key));
    if (!section) return;

    this.scrollSpySuspended = true;
    if (this.releaseTimer != null) {
      window.clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }

    const changed = this.activeKey !== key;
    this.setActiveKey(key, opts.fromUser);
    if (opts.haptic && changed) this.tickRailHaptic();
    this.scrollSectionIntoView(section, opts.behavior);

    const delay = opts.behavior === 'smooth' ? 480 : 64;
    this.releaseTimer = window.setTimeout(() => {
      this.scrollSpySuspended = false;
      this.releaseTimer = null;
      this.syncActiveFromScroll();
    }, delay);
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
    queueMicrotask(() => {
      this.bindScrollSpy();
      this.syncActiveFromScroll();
    });
  }

  private setActiveKey(key: string, fromUser: boolean): void {
    const changed = this.activeKey !== key;
    this.activeKey = key;
    if (changed || fromUser) {
      this.emit('k3-section-change', { key });
    }
  }

  private tickRailHaptic(): void {
    if (!this.haptic || !haptic.isEnabled()) return;
    const now = performance.now();
    if (now - this.hapticTickAt < 28) return;
    this.hapticTickAt = now;
    haptic.selection();
  }

  private handleRailClick(key: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    /* With scrub on, pointerdown already jumps + haptics — skip the trailing click. */
    if (this.railScrub) return;
    this.lastScrubKey = key;
    this.jumpToKey(key, {
      fromUser: true,
      haptic: true,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  private handleRailPointerDown(event: PointerEvent): void {
    if (!this.railScrub || event.button !== 0) return;
    const rail = this.railEl;
    if (!rail) return;

    this.railPointerId = event.pointerId;
    try {
      rail.setPointerCapture(event.pointerId);
    } catch {
      /* ignore — capture optional */
    }

    const key = this.keyFromRailPoint(event.clientY);
    if (!key) return;
    this.lastScrubKey = key;
    this.jumpToKey(key, { fromUser: true, haptic: true, behavior: 'auto' });
  }

  private handleRailPointerMove(event: PointerEvent): void {
    if (!this.railScrub) return;
    if (this.railPointerId == null || event.pointerId !== this.railPointerId) return;

    const key = this.keyFromRailPoint(event.clientY);
    if (!key || key === this.lastScrubKey) return;
    this.lastScrubKey = key;
    this.jumpToKey(key, { fromUser: true, haptic: true, behavior: 'auto' });
  }

  private handleRailPointerUp(event: PointerEvent): void {
    if (this.railPointerId == null || event.pointerId !== this.railPointerId) return;
    const rail = this.railEl;
    if (rail?.hasPointerCapture?.(event.pointerId)) {
      try {
        rail.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
    this.railPointerId = null;
  }

  /**
   * Resolve rail key from Y — hit-test first, then nearest center.
   * Works across flex gaps / empty keys without relying on elementFromPoint alone.
   */
  private keyFromRailPoint(clientY: number): string | null {
    const rail = this.railEl;
    if (!rail) return null;

    const items = [
      ...rail.querySelectorAll<HTMLElement>('.rail-item:not(.rail-item--empty)'),
    ];
    if (!items.length) return null;

    const railRect = rail.getBoundingClientRect();
    const y = Math.min(Math.max(clientY, railRect.top + 0.5), railRect.bottom - 0.5);

    for (const item of items) {
      const r = item.getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) {
        return item.dataset.indexKey ?? null;
      }
    }

    let best: HTMLElement = items[0];
    let bestDist = Number.POSITIVE_INFINITY;
    for (const item of items) {
      const r = item.getBoundingClientRect();
      const mid = (r.top + r.bottom) / 2;
      const dist = Math.abs(y - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = item;
      }
    }
    return best.dataset.indexKey ?? null;
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

  /** Sticky-header style spy — section whose top is at / above the sticky line. */
  private syncActiveFromScroll(): void {
    if (this.scrollSpySuspended) return;
    const root = this.resolveScrollRoot() ?? this.contentEl;
    if (!root || !this.shadowRoot) return;

    const sections = [
      ...this.shadowRoot.querySelectorAll<HTMLElement>('.section[data-index-key]'),
    ];
    if (!sections.length) return;

    const marker =
      root === this.contentEl
        ? root.scrollTop + this.stickyOffset + 1
        : root.getBoundingClientRect().top + this.stickyOffset + 1;

    let active = sections[0].dataset.indexKey ?? null;
    if (root === this.contentEl) {
      for (const sec of sections) {
        if (sec.offsetTop <= marker) active = sec.dataset.indexKey ?? active;
        else break;
      }
    } else {
      for (const sec of sections) {
        const top = sec.getBoundingClientRect().top;
        if (top <= marker) active = sec.dataset.indexKey ?? active;
        else break;
      }
    }

    if (active && active !== this.activeKey) {
      this.setActiveKey(active, false);
    }
  }

  private bindScrollSpy(): void {
    const root = this.contentEl;
    if (!root) return;
    root.removeEventListener('scroll', this.boundContentScroll);
    root.addEventListener('scroll', this.boundContentScroll, { passive: true });
  }

  private resolveScrollRoot(): Element | null {
    if (!this.scrollRoot) return this.contentEl ?? null;
    if (this.scrollRoot === 'host') return this;
    const found = document.querySelector(this.scrollRoot);
    return found instanceof Element ? found : this.contentEl ?? null;
  }

  override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    this.style.setProperty('--k3-index-list-sticky-offset', `${this.stickyOffset}px`);
    this.bindScrollSpy();
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
      queueMicrotask(() => {
        this.bindScrollSpy();
        if (!this.scrollSpySuspended) this.syncActiveFromScroll();
      });
    }
  }

  override disconnectedCallback(): void {
    this.contentEl?.removeEventListener('scroll', this.boundContentScroll);
    if (this.releaseTimer != null) window.clearTimeout(this.releaseTimer);
    this.railPointerId = null;
    super.disconnectedCallback();
  }

  override render() {
    const groups = groupIndexListItems(this.resolvedEntries(), this.locale);
    const presentKeys = sortIndexKeys([...groups.keys()]);
    const railKeys = this.hideEmptyKeys ? presentKeys : [...INDEX_LIST_KEY_ORDER];
    const active = this.activeKey ?? presentKeys[0] ?? null;

    const rail = this.showRail
      ? html`<nav
          class="rail"
          aria-label=${i18n.t('indexList.railLabel', 'Index alphabétique')}
          @pointerdown=${this.handleRailPointerDown}
          @pointermove=${this.handleRailPointerMove}
          @pointerup=${this.handleRailPointerUp}
          @pointercancel=${this.handleRailPointerUp}
        >
          ${railKeys.map((key) => {
            const hasSection = groups.has(key);
            if (this.hideEmptyKeys && !hasSection) return nothing;
            const isActive = key === active;
            return html`<button
              type="button"
              class=${classMap({
                'rail-item': true,
                'rail-item--active': isActive,
                'rail-item--empty': !hasSection,
              })}
              data-index-key=${key}
              tabindex=${hasSection ? 0 : -1}
              aria-label=${indexKeyToAriaLabel(
                key,
                i18n.t('indexList.sectionLabel', 'Section {key}'),
              )}
              aria-current=${isActive ? 'true' : nothing}
              ?disabled=${!hasSection}
              @click=${(e: Event) => this.handleRailClick(key, e)}
            >
              ${indexKeyToDisplayLabel(key)}
            </button>`;
          })}
        </nav>`
      : nothing;

    return html`
      <slot class="slot-source" @slotchange=${this.onSlotChange}></slot>
      <div class="root">
        <div class="content k3-scroll">
          ${presentKeys.map((key, index) => {
            const sectionItems = groups.get(key) ?? [];
            /* Sticky push — later sections sit under earlier ones (K3ui v1). */
            const headerZ = presentKeys.length - index;
            return html`<section
              class="section"
              id=${indexKeyToSectionId(key)}
              data-index-key=${key}
              style=${`scroll-margin-top: ${this.stickyOffset}px`}
            >
              <header class="header" style=${`z-index: ${headerZ}`}>
                ${indexKeyToDisplayLabel(key)}
              </header>
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
        ${rail}
      </div>
    `;
  }
}

export default K3IndexList;

if (!customElements.get('k3-index-list')) {
  customElements.define('k3-index-list', K3IndexList);
}
