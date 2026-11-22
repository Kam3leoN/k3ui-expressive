import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';

/**
 * Docs pager — M3 documentation “Previous / Up next” cards.
 *
 * Layout uses the same column count + gutter as `.k3-layout-grid` /
 * `.k3-layout-grid-overlay`, so each card spans half the grid (6 of 12,
 * 4 of 8, full width when stacked) and never overflows the container.
 *
 * Interaction (aligned with m3.material.io mio-card-set):
 * - rest: identical `surface-container`, radius 24
 * - hover / focus / active: `secondary-container`
 * - pressed (+ focus): radius morph 24 → 48
 *
 * i18n keys (component-scoped):
 * - `doc-nav.label` — nav aria-label
 * - `doc-nav.previous` — eyebrow (default “Previous”)
 * - `doc-nav.next` — eyebrow (default “Up next”)
 */
export class K3DocNav extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        display: block;
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }

      /*
       * Same track recipe as the playground / token layout grid so cards
       * sit on column boundaries (container ON or OFF).
       */
      .row {
        display: grid;
        grid-template-columns: repeat(var(--k3-layout-columns, 12), minmax(0, 1fr));
        gap: var(--k3-layout-gutter, 0.5rem);
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }

      /* Half the columns — 2 of 4 · 4 of 8 · 6 of 12 */
      .previous,
      .next {
        grid-column: span calc(var(--k3-layout-columns, 12) / 2);
        min-width: 0;
      }
      /* Solo card: keep half-width; next alone hugs the end edge */
      .next:only-child {
        grid-column-end: -1;
        grid-column-start: span calc(var(--k3-layout-columns, 12) / 2);
      }

      @media (max-width: 559px) {
        .previous,
        .next,
        .next:only-child {
          grid-column: 1 / -1;
        }
      }

      /*
       * m3.material.io pager (mio-card-set overline):
       * rest = identical surface · hover/focus/active = secondary-container
       * radius 24 → 48 on pressed (+ focus)
       */
      .card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.35rem;
        box-sizing: border-box;
        width: 100%;
        min-height: 5.5rem;
        padding: 1.25rem 1.5rem;
        border-radius: 1.5rem; /* 24 — m3 docs pager */
        background: var(--k3-sys-color-surface-container);
        color: var(--k3-sys-color-on-surface);
        text-decoration: none;
        text-align: start;
        overflow: hidden;
        -webkit-tap-highlight-color: transparent;
        transition:
          border-radius 300ms var(--k3-sys-motion-easing-expressive-spatial, cubic-bezier(0.2, 0, 0, 1)),
          background-color 300ms var(--k3-sys-motion-easing-expressive-effects, cubic-bezier(0.2, 0, 0, 1)),
          color 300ms var(--k3-sys-motion-easing-expressive-effects, cubic-bezier(0.2, 0, 0, 1));
      }
      .card:hover,
      .card:focus-visible,
      .card:active {
        background: var(--k3-sys-color-secondary-container);
        color: var(--k3-sys-color-on-secondary-container);
      }
      .card:hover .eyebrow,
      .card:focus-visible .eyebrow,
      .card:active .eyebrow,
      .card:hover .title,
      .card:focus-visible .title,
      .card:active .title {
        color: var(--k3-sys-color-on-secondary-container);
      }
      /* Pressed (+ keyboard focus) — shape morph 24 → 48 */
      .card:active,
      .card:focus-visible {
        border-radius: var(--k3-sys-shape-corner-extra-extra-large); /* 48 */
      }
      .card:focus-visible {
        outline: 2px solid var(--k3-sys-color-on-surface);
        outline-offset: 0;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: var(--k3-sys-typescale-label-large-size);
        font-weight: 500;
        color: var(--k3-sys-color-on-surface-variant);
        line-height: 1.25;
        transition: color 300ms
          var(--k3-sys-motion-easing-expressive-effects, cubic-bezier(0.2, 0, 0, 1));
      }
      .title {
        font-size: var(--k3-sys-typescale-title-large-size, 1.375rem);
        font-weight: var(--k3-sys-typescale-title-medium-emphasized-weight, 600);
        line-height: 1.3;
        color: var(--k3-sys-color-on-surface);
        overflow-wrap: anywhere;
        transition: color 300ms
          var(--k3-sys-motion-easing-expressive-effects, cubic-bezier(0.2, 0, 0, 1));
      }
      .arrow {
        font-family: 'Material Symbols Rounded', sans-serif;
        font-size: 1.125rem;
        line-height: 1;
        font-weight: normal;
        speak: never;
      }
    `,
  ];

  @property({ attribute: 'previous-href' }) previousHref = '';
  @property({ attribute: 'previous-title' }) previousTitle = '';
  /** Override eyebrow; empty → `doc-nav.previous`. */
  @property({ attribute: 'previous-label' }) previousLabel = '';
  @property({ attribute: 'next-href' }) nextHref = '';
  @property({ attribute: 'next-title' }) nextTitle = '';
  /** Override eyebrow; empty → `doc-nav.next`. */
  @property({ attribute: 'next-label' }) nextLabel = '';

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
  }

  private onActivate = (dir: 'previous' | 'next', href: string): void => {
    this.emit('k3-navigate', { direction: dir, href });
  };

  override render() {
    const prevLabel = this.previousLabel || i18n.t('doc-nav.previous');
    const nextLabel = this.nextLabel || i18n.t('doc-nav.next');
    const hasPrev = !!this.previousHref && !!this.previousTitle;
    const hasNext = !!this.nextHref && !!this.nextTitle;
    if (!hasPrev && !hasNext) return nothing;

    return html`
      <nav class="row" part="container" aria-label=${i18n.t('doc-nav.label')}>
        ${hasPrev
          ? html`<a
              class="card previous"
              part="previous"
              href=${this.previousHref}
              @click=${() => this.onActivate('previous', this.previousHref)}
            >
              <span class="eyebrow" part="previous-label">
                <span
                  class="arrow notranslate"
                  translate="no"
                  lang="zxx"
                  data-k3-icon="arrow_back"
                  aria-hidden="true"
                ></span>
                ${prevLabel}
              </span>
              <span class="title" part="previous-title">${this.previousTitle}</span>
            </a>`
          : nothing}
        ${hasNext
          ? html`<a
              class="card next"
              part="next"
              href=${this.nextHref}
              @click=${() => this.onActivate('next', this.nextHref)}
            >
              <span class="eyebrow" part="next-label">
                ${nextLabel}
                <span
                  class="arrow notranslate"
                  translate="no"
                  lang="zxx"
                  data-k3-icon="arrow_forward"
                  aria-hidden="true"
                ></span>
              </span>
              <span class="title" part="next-title">${this.nextTitle}</span>
            </a>`
          : nothing}
      </nav>
    `;
  }
}
export default K3DocNav;

if (!customElements.get('k3-doc-nav')) {
  customElements.define('k3-doc-nav', K3DocNav);
}
