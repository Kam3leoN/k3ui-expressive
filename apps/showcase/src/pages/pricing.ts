import { html, nothing, render, type TemplateResult } from 'lit';
import { i18n } from '@k3ui/i18n/index.js';
import {
  COMPARE_CATEGORIES,
  filterCompareCategories,
  resolveCompareCell,
  type CompareCell,
} from '../data/comparison.js';
import {
  FAQS,
  PLANS,
  annualSavingsEuros,
  planPrice,
  type Billing,
  type Plan,
} from '../data/pricing.js';
import { pageTitleRow } from '../demo-chrome.js';
import { shapeIcon } from '../shape-icon.js';

/** Pricing page is built with k3ui components only (no k3ux). */
const PAGE_STACK = 'k3ui' as const;

const t = (key: string, vars?: Record<string, string | number>) => i18n.t(key, undefined, vars);

function msIcon(name: string): TemplateResult {
  return html`
    <span
      class="ms notranslate"
      translate="no"
      lang="zxx"
      data-k3-icon=${name}
      aria-hidden="true"
    ></span>
  `;
}

function planCard(plan: Plan, billing: Billing): TemplateResult {
  const price = planPrice(plan, billing);
  const saveEuros = billing === 'annual' ? annualSavingsEuros(plan) : null;
  const ctaVariant = plan.recommended ? 'elevated' : 'tonal';

  const freeCta = plan.id === 'free';

  return html`
    <article class="plan-card ${plan.recommended ? 'plan-card--featured' : ''}">
      ${plan.recommended
        ? html`
            <span class="plan-card__badge">
              ${shapeIcon('Sunny', 'plan-card__badge-shape')}
              ${t('showcase.pricing.recommended')}
            </span>
            <span class="plan-card__orbit" aria-hidden="true">
              ${shapeIcon('Pentagon', 'plan-card__orbit-shape')}
            </span>
          `
        : null}
      <div class="plan-card__top">
        ${shapeIcon(plan.shape, 'plan-card__shape')}
      </div>

      <h2 class="plan-card__name">${t(plan.nameKey)}</h2>
      <p class="plan-card__tag">${t(plan.tagKey)}</p>

      <div class="plan-card__price-block">
        <p class="plan-card__price">
          <span class="plan-card__amount">${price}</span>
          <span class="plan-card__unit">
            <span class="plan-card__currency">€</span>
            <span class="plan-card__period">${t('showcase.pricing.perMonth')}</span>
          </span>
        </p>
        ${plan.monthly === 0
          ? html`<p class="plan-card__sub">${t('showcase.pricing.plan.free.forever')}</p>`
          : billing === 'annual'
            ? html`<p class="plan-card__sub">
                ${t('showcase.pricing.billedAnnual', { amount: plan.annual })}
              </p>`
            : html`<p class="plan-card__sub">
                ${t('showcase.pricing.billedMonthly', { amount: plan.monthly })}
              </p>`}
        ${saveEuros != null
          ? html`<span class="plan-card__save"
              >${t('showcase.pricing.saveEuros', { amount: saveEuros })}</span
            >`
          : null}
      </div>

      <k3-button class="plan-card__cta ${freeCta ? 'plan-card__cta--stack' : ''}" variant=${ctaVariant} size="md">
        ${freeCta
          ? html`<span class="plan-card__cta-stack">
              <span>${t('showcase.pricing.plan.free.cta.l1')}</span>
              <span>${t('showcase.pricing.plan.free.cta.l2')}</span>
            </span>`
          : t(plan.ctaKey)}
      </k3-button>
      <p class="plan-card__note">${t(plan.noteKey)}</p>

      <p class="plan-card__includes">${t(plan.includesKey)}</p>
      <ul class="plan-card__features">
        ${plan.featureKeys.map(
          (key) => html`
            <li>
              <span class="plan-card__check" aria-hidden="true">
                ${shapeIcon('Pill', 'plan-card__check-shape')}
              </span>
              <span>${t(key)}</span>
            </li>
          `,
        )}
      </ul>
    </article>
  `;
}

function compareCellView(raw: CompareCell, featured: boolean): TemplateResult {
  const cell = resolveCompareCell(raw, t);
  if (cell === true) {
    return html`
      <span
        class="compare-check ${featured ? 'compare-check--featured' : ''}"
        role="img"
        aria-label=${t('showcase.pricing.compare.included')}
      >
        ${msIcon('check')}
      </span>
    `;
  }
  if (cell === false) {
    return html`
      <span class="compare-dash" role="img" aria-label=${t('showcase.pricing.compare.excluded')}
        >—</span
      >
    `;
  }
  return html`<span class="compare-text">${cell}</span>`;
}

function comparePanel(billing: Billing, diffsOnly: boolean): TemplateResult {
  const cats = filterCompareCategories(COMPARE_CATEGORIES, diffsOnly);
  const featuredIdx = PLANS.findIndex((p) => p.recommended);

  return html`
    <section
      id="comparison"
      class="compare"
      aria-label=${t('showcase.pricing.compare.aria')}
    >
      <div class="compare__panel">
        <div class="compare__toolbar">
          <h2 class="compare__title">${t('showcase.pricing.compare.title')}</h2>
          <k3-switch class="compare__diffs" ?selected=${diffsOnly} icons
            >${t('showcase.pricing.compare.diffs')}</k3-switch
          >
        </div>

        <div class="compare__scroll k3-scroll k3-scroll--x">
          <div class="compare__inner">
            <div class="compare-matrix__head" role="row">
              <div class="compare-matrix__corner" role="columnheader">
                ${t('showcase.pricing.compare.formulas')}
              </div>
              ${PLANS.map((plan, i) => {
                const price = planPrice(plan, billing);
                const featured = i === featuredIdx;
                return html`
                  <div
                    class="compare-matrix__plan ${featured ? 'compare-matrix__plan--featured' : ''}"
                    role="columnheader"
                  >
                    <span class="compare-matrix__plan-name">${t(plan.nameKey)}</span>
                    <span class="compare-matrix__plan-price"
                      >${price} € ${t('showcase.pricing.perMonth')}</span
                    >
                    <k3-button
                      class="compare-matrix__plan-cta"
                      variant=${featured ? 'elevated' : 'tonal'}
                      size="sm"
                      >${t('showcase.pricing.compare.choose')}</k3-button
                    >
                  </div>
                `;
              })}
            </div>

            ${cats.map(
              (cat) => html`
                <div class="compare-cat">
                  <h3 class="compare-cat__title">${t(cat.titleKey)}</h3>
                  ${cat.rows.map(
                    (row) => html`
                      <div class="compare-row" role="row">
                        <div class="compare-row__label" role="rowheader">${t(row.labelKey)}</div>
                        ${row.values.map(
                          (val, i) => html`
                            <div
                              class="compare-row__cell ${i === featuredIdx
                                ? 'compare-row__cell--featured'
                                : ''}"
                              role="cell"
                            >
                              ${compareCellView(val, i === featuredIdx)}
                            </div>
                          `,
                        )}
                      </div>
                    `,
                  )}
                </div>
              `,
            )}
          </div>
        </div>
      </div>
    </section>
  `;
}

export function mountPricing(host: HTMLElement): () => void {
  let billing: Billing = 'annual';
  let compareOpen = false;
  let diffsOnly = false;
  /** Docs embed already shows the page title + stack in `.section-head`. */
  const showTitle = !host.closest('.showcase-doc');

  const paint = (): void => {
    render(
      html`
        <section
          class="page page--pricing"
          aria-labelledby=${showTitle ? 'pricing-title' : nothing}
          aria-label=${showTitle ? nothing : t('showcase.nav.pricing')}
        >
          ${showTitle
            ? pageTitleRow('showcase.nav.pricing', PAGE_STACK, 'pricing-title')
            : null}
          <header class="page-hero page-hero--billing">
            <k3-button-group
              class="billing-toggle"
              variant="connected"
              shape="round"
              selection="single"
              size="md"
              sync
              required
              label=${t('showcase.pricing.billing.monthly')}
              @k3-change=${(e: CustomEvent<{ values?: string[] }>) => {
                const v = e.detail?.values?.[0];
                if (v === 'monthly' || v === 'annual') {
                  billing = v;
                  paint();
                }
              }}
            >
              <k3-button
                variant="tonal"
                value="monthly"
                ?selected=${billing === 'monthly'}
                >${t('showcase.pricing.billing.monthly')}</k3-button
              >
              <k3-button variant="tonal" value="annual" ?selected=${billing === 'annual'}
                >${t('showcase.pricing.billing.annual')}
                <span class="billing-save">${t('showcase.pricing.billing.save')}</span>
              </k3-button>
            </k3-button-group>
          </header>

          <div class="plan-grid k3-layout-grid">${PLANS.map((p) => planCard(p, billing))}</div>

          <p class="pricing-trust">${t('showcase.pricing.trust')}</p>

          <div class="pricing-compare">
            <k3-button
              variant="tonal"
              size="lg"
              aria-expanded=${compareOpen ? 'true' : 'false'}
              aria-controls="comparison"
              @k3-click=${() => {
                compareOpen = !compareOpen;
                paint();
                if (compareOpen) {
                  requestAnimationFrame(() => {
                    host
                      .querySelector('#comparison')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  });
                }
              }}
            >
              ${compareOpen
                ? t('showcase.pricing.compare.hide')
                : t('showcase.pricing.compare')}
              <span class="pricing-compare__chev" aria-hidden="true">
                ${msIcon(compareOpen ? 'expand_less' : 'expand_more')}
              </span>
            </k3-button>
          </div>

          ${compareOpen
            ? html`<div
                @k3-change=${(e: Event) => {
                  const sw = e.target as HTMLElement & { selected?: boolean };
                  if (sw?.tagName?.toLowerCase() !== 'k3-switch') return;
                  const detail = (e as CustomEvent<{ selected?: boolean }>).detail;
                  diffsOnly = detail?.selected ?? !!sw.selected;
                  paint();
                }}
              >
                ${comparePanel(billing, diffsOnly)}
              </div>`
            : null}

          <section class="faq" aria-labelledby="faq-title">
            <h2 id="faq-title">${t('showcase.pricing.faq.title')}</h2>
            <k3-accordion>
              ${FAQS.map(
                (item, i) => html`
                  <k3-expansion-panel ?open=${i === 0}>
                    <span slot="header">${t(item.qKey)}</span>
                    <p slot="content">${t(item.aKey)}</p>
                  </k3-expansion-panel>
                `,
              )}
            </k3-accordion>
          </section>

          <aside class="pricing-cta" aria-labelledby="pricing-cta-title">
            <div>
              <h2 id="pricing-cta-title">${t('showcase.pricing.cta.title')}</h2>
              <p>${t('showcase.pricing.cta.lead')}</p>
            </div>
            <k3-button variant="filled" size="lg"
              >${t('showcase.pricing.cta.button')}</k3-button
            >
          </aside>
        </section>
      `,
      host,
    );
  };

  paint();
  return () => render(null, host);
}
