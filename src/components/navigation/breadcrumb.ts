import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  BreadcrumbSpecs,
  buildVisibleBreadcrumbItems,
  parseBreadcrumbItems,
  parseBreadcrumbSize,
  type BreadcrumbItem,
  type BreadcrumbSeparator,
  type BreadcrumbSize,
  type BreadcrumbVariant,
} from './breadcrumb.specs.js';
import { breadcrumbStyles } from './breadcrumb.styles.js';

export type {
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbSize,
  BreadcrumbVariant,
} from './breadcrumb.specs.js';
export {
  BreadcrumbSpecs,
  buildVisibleBreadcrumbItems,
  parseBreadcrumbItems,
} from './breadcrumb.specs.js';

/**
 * M3 Expressive breadcrumb — items via property or `items` JSON attribute.
 *
 * @fires k3-select — `{ item, index }` when a non-current crumb is activated
 */
export class K3Breadcrumb extends K3Element {
  static override styles = [hostReset, breadcrumbStyles];

  @property({
    attribute: 'items',
    converter: {
      fromAttribute: parseBreadcrumbItems,
      toAttribute: (v: BreadcrumbItem[]) => (v.length ? JSON.stringify(v) : null),
    },
  })
  items: BreadcrumbItem[] = [];

  @property({ reflect: true })
  variant: BreadcrumbVariant = BreadcrumbSpecs.defaultVariant;

  @property({ reflect: true })
  separator: BreadcrumbSeparator = BreadcrumbSpecs.defaultSeparator;

  @property({
    reflect: true,
    converter: {
      fromAttribute: parseBreadcrumbSize,
      toAttribute: (v: BreadcrumbSize) => v,
    },
  })
  size: BreadcrumbSize = BreadcrumbSpecs.defaultSize;

  @property({ type: Boolean, attribute: 'show-icons', reflect: true })
  showIcons = BreadcrumbSpecs.defaultShowIcons;

  @property({
    type: Number,
    attribute: 'collapse-after',
    converter: {
      fromAttribute: (v: string | null) => {
        if (v == null || v === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      },
      toAttribute: (v: number | null) => (v == null ? null : String(v)),
    },
  })
  collapseAfter: number | null = BreadcrumbSpecs.defaultCollapseAfter;

  /** Accessible name for the navigation landmark. */
  @property({ attribute: 'aria-label' })
  ariaLabel = BreadcrumbSpecs.accessibility.defaultLabel;

  private onItemClick(item: BreadcrumbItem, index: number, e: Event): void {
    if (item.current) return;
    e.preventDefault();
    this.emit('k3-select', { item, index });
  }

  private renderIcon(name: string) {
    return html`<span
      class="breadcrumb__icon ms notranslate"
      translate="no"
      lang="zxx"
      data-k3-icon=${name}
      aria-hidden="true"
    ></span>`;
  }

  private renderSeparator() {
    const iconName = BreadcrumbSpecs.separatorIcons[this.separator];
    if (iconName) {
      return html`<span
        class=${classMap({
          breadcrumb__separator: true,
          [`breadcrumb__separator--${this.separator}`]: true,
        })}
        aria-hidden="true"
        >${this.renderIcon(iconName)}</span
      >`;
    }
    const text = BreadcrumbSpecs.separators[this.separator] ?? '›';
    return html`<span
      class=${classMap({
        breadcrumb__separator: true,
        [`breadcrumb__separator--${this.separator}`]: true,
      })}
      aria-hidden="true"
      >${text}</span
    >`;
  }

  private renderItem(item: BreadcrumbItem, index: number) {
    const isCurrent = !!item.current;
    const content = html`
      ${this.showIcons && item.icon ? this.renderIcon(item.icon) : nothing}
      <span class="breadcrumb__text">${item.text}</span>
    `;

    if (isCurrent) {
      return html`<li class="breadcrumb__item breadcrumb__item--current">
        <span
          class="breadcrumb__link breadcrumb__link--current"
          aria-current="page"
          part="item"
        >
          ${content}
        </span>
      </li>`;
    }

    const href = item.href ?? '#';
    return html`<li class="breadcrumb__item">
      <a
        class="breadcrumb__link"
        part="item"
        href=${href}
        @click=${(e: Event) => this.onItemClick(item, index, e)}
        >${content}</a
      >
    </li>`;
  }

  override render() {
    const visible = buildVisibleBreadcrumbItems(this.items, this.collapseAfter);

    return html`
      <nav aria-label=${this.ariaLabel || nothing}>
        <ol class="breadcrumb__list">
          ${visible.map((entry, i) => {
            const sep =
              i < visible.length - 1
                ? html`<li class="breadcrumb__item breadcrumb__item--sep">
                    ${this.renderSeparator()}
                  </li>`
                : nothing;

            if (entry.kind === 'ellipsis') {
              return html`<li class="breadcrumb__item breadcrumb__item--ellipsis">
                  <span class="breadcrumb__ellipsis" aria-hidden="true">…</span>
                </li>
                ${sep}`;
            }

            return html`${this.renderItem(entry.item, entry.index)} ${sep}`;
          })}
        </ol>
      </nav>
    `;
  }
}

if (!customElements.get('k3-breadcrumb')) {
  customElements.define('k3-breadcrumb', K3Breadcrumb);
}

export default K3Breadcrumb;
