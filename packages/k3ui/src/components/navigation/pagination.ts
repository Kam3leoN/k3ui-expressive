import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  PaginationSpecs,
  PAGINATION_ELLIPSIS,
  buildPaginationPages,
} from './pagination.specs.js';
import { paginationStyles } from './pagination.styles.js';

export {
  PaginationSpecs,
  PAGINATION_ELLIPSIS,
  buildPaginationPages,
} from './pagination.specs.js';

/**
 * Numeric pagination — page buttons, ellipsis, first/prev/next/last.
 *
 * @fires k3-change - `{ page }` (1-based)
 */
export class K3Pagination extends K3Element {
  static override styles = [hostReset, paginationStyles];

  @property({ type: Number, reflect: true }) page = PaginationSpecs.defaultPage;
  /** Total number of pages (not items). */
  @property({ type: Number, reflect: true }) count = PaginationSpecs.defaultCount;
  @property({ type: Number, attribute: 'sibling-count' })
  siblingCount = PaginationSpecs.defaultSiblingCount;
  @property({ type: Boolean, attribute: 'show-first', reflect: true })
  showFirst = PaginationSpecs.showFirst;
  @property({ type: Boolean, attribute: 'show-last', reflect: true })
  showLast = PaginationSpecs.showLast;
  @property({ type: Boolean, attribute: 'show-prev', reflect: true })
  showPrev = PaginationSpecs.showPrev;
  @property({ type: Boolean, attribute: 'show-next', reflect: true })
  showNext = PaginationSpecs.showNext;
  @property({ type: Boolean, reflect: true }) disabled = PaginationSpecs.disabled;

  /** Navigate to a page (1-based); no-op if out of range or unchanged. */
  goTo(target: number): void {
    if (this.disabled) return;
    const total = Math.max(1, this.count);
    const next = Math.trunc(target);
    if (next < 1 || next > total || next === this.page) return;
    this.page = next;
    this.emit('k3-change', { page: this.page });
  }

  private onNavClick(target: number): void {
    this.goTo(target);
  }

  private renderIcon(name: string) {
    return html`<span
      class="icon ms notranslate"
      translate="no"
      lang="zxx"
      data-k3-icon=${name}
      aria-hidden="true"
    ></span>`;
  }

  private renderNavBtn(
    extraClass: string,
    icon: string,
    isDisabled: boolean,
    onClick: () => void,
    label: string,
  ) {
    return html`<button
      type="button"
      class=${`nav-btn ${extraClass}`}
      ?disabled=${this.disabled || isDisabled}
      aria-label=${label}
      title=${label}
      @click=${onClick}
    >
      ${this.renderIcon(icon)}
    </button>`;
  }

  override render() {
    const total = Math.max(1, this.count);
    const current = Math.min(Math.max(1, this.page), total);
    const pages = buildPaginationPages(current, total, this.siblingCount);
    const isFirst = current <= 1;
    const isLast = current >= total;
    const icons = PaginationSpecs.navIcons;

    return html`
      <div class="inner">
        <nav class="nav" aria-label="Pagination">
          ${this.showFirst
            ? this.renderNavBtn(
                'nav-btn--first',
                icons.first,
                isFirst,
                () => this.onNavClick(1),
                'First page',
              )
            : nothing}
          ${this.showPrev
            ? this.renderNavBtn(
                'nav-btn--prev',
                icons.prev,
                isFirst,
                () => this.onNavClick(current - 1),
                'Previous page',
              )
            : nothing}
          ${pages.map((p) => {
            if (p === PAGINATION_ELLIPSIS) {
              return html`<span class="ellipsis" aria-hidden="true">${PAGINATION_ELLIPSIS}</span>`;
            }
            const num = p as number;
            const active = num === current;
            return html`<button
              type="button"
              class=${classMap({ 'page-btn': true, 'page-btn--active': active })}
              ?disabled=${this.disabled}
              aria-label=${`Page ${num}`}
              aria-current=${active ? 'page' : nothing}
              @click=${() => this.onNavClick(num)}
            >
              ${num}
            </button>`;
          })}
          ${this.showNext
            ? this.renderNavBtn(
                'nav-btn--next',
                icons.next,
                isLast,
                () => this.onNavClick(current + 1),
                'Next page',
              )
            : nothing}
          ${this.showLast
            ? this.renderNavBtn(
                'nav-btn--last',
                icons.last,
                isLast,
                () => this.onNavClick(total),
                'Last page',
              )
            : nothing}
        </nav>
      </div>
    `;
  }
}

export default K3Pagination;

if (!customElements.get('k3-pagination')) {
  customElements.define('k3-pagination', K3Pagination);
}
