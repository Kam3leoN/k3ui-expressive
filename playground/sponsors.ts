/**
 * Sponsors section — Chakra-style tiers + logo walls.
 * Prices = Open Collective reference ÷ 2 (no Platinum).
 */

export type SponsorTierId = 'gold' | 'silver' | 'bronze' | 'don';

export interface SponsorEntry {
  name: string;
  href?: string;
  /** Image URL or empty → initials avatar */
  logo?: string;
  initials?: string;
}

export interface SponsorTierCard {
  id: SponsorTierId;
  emoji: string;
  badgeKey: string;
  titleKey: string;
  descKey: string;
  /** Fixed monthly amount in € (omitted for free-amount Don) */
  priceEur?: string;
  priceUnitKey?: string;
  /** Custom / donation — free amount */
  custom?: boolean;
  /** PayPal (or other) URL — empty until configured */
  ctaHref?: string;
}

/**
 * PayPal me. later — leave empty so CTAs stay inert (no GitHub / external link).
 * Example: `https://www.paypal.com/donate/?hosted_button_id=…`
 */
const SPONSOR_CTA = '';

/**
 * Contribution cards — Gold / Silver / Bronze + Don (4 columns).
 * Prices: 99 / 59 / 29 € · Don: montant libre.
 */
export const SPONSOR_TIER_CARDS: SponsorTierCard[] = [
  {
    id: 'gold',
    emoji: '🥇',
    badgeKey: 'playground.sponsors.badge.membership',
    titleKey: 'playground.sponsors.tier.gold.title',
    descKey: 'playground.sponsors.tier.gold.desc',
    priceEur: '99',
    priceUnitKey: 'playground.sponsors.price.unit.eur-month',
    ctaHref: SPONSOR_CTA,
  },
  {
    id: 'silver',
    emoji: '🥈',
    badgeKey: 'playground.sponsors.badge.membership',
    titleKey: 'playground.sponsors.tier.silver.title',
    descKey: 'playground.sponsors.tier.silver.desc',
    priceEur: '59',
    priceUnitKey: 'playground.sponsors.price.unit.eur-month',
    ctaHref: SPONSOR_CTA,
  },
  {
    id: 'bronze',
    emoji: '🥉',
    badgeKey: 'playground.sponsors.badge.membership',
    titleKey: 'playground.sponsors.tier.bronze.title',
    descKey: 'playground.sponsors.tier.bronze.desc',
    priceEur: '29',
    priceUnitKey: 'playground.sponsors.price.unit.eur-month',
    ctaHref: SPONSOR_CTA,
  },
  {
    id: 'don',
    emoji: '💚',
    badgeKey: 'playground.sponsors.badge.custom',
    titleKey: 'playground.sponsors.tier.don.title',
    descKey: 'playground.sponsors.tier.don.desc',
    custom: true,
    ctaHref: SPONSOR_CTA,
  },
];

/** Logo-wall sections — always 24 equal square cells. */
export const SPONSOR_WALLS: {
  id: SponsorTierId;
  titleKey: string;
  /** € amount for cell tooltips (omit for Don / montant libre) */
  priceEur?: string;
  sponsors: SponsorEntry[];
}[] = [
  { id: 'gold', titleKey: 'playground.sponsors.wall.gold', priceEur: '99', sponsors: [] },
  { id: 'silver', titleKey: 'playground.sponsors.wall.silver', priceEur: '59', sponsors: [] },
  { id: 'bronze', titleKey: 'playground.sponsors.wall.bronze', priceEur: '29', sponsors: [] },
  { id: 'don', titleKey: 'playground.sponsors.wall.don', sponsors: [] },
];

function t(key: string, vars?: Record<string, string | number>): string {
  return window.K3UI?.i18n.t(key, undefined, vars) ?? key;
}

function avatarHtml(s: SponsorEntry): string {
  if (s.logo) {
    return `<img class="sponsor-logo" src="${escapeAttr(s.logo)}" alt="${escapeAttr(s.name)}" loading="lazy" />`;
  }
  const initials = (s.initials || s.name.slice(0, 2)).toUpperCase();
  return `<span class="sponsor-initials" aria-hidden="true">${escapeHtml(initials)}</span>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

function tooltipLabel(amountEur?: string): string {
  if (amountEur) {
    return t('playground.sponsors.tooltip.amount', { amount: amountEur });
  }
  return t('playground.sponsors.tooltip.free');
}

function renderCta(
  href: string | undefined,
  i18nKey: string,
  fallback: string,
  extraClass = '',
): string {
  const cls = `sponsor-tier-cta${extraClass ? ` ${extraClass}` : ''}`;
  if (href) {
    return `<a class="${cls}" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer"
      data-i18n="${i18nKey}">${fallback}</a>`;
  }
  /* PayPal URL not set yet — visible CTA, no navigation */
  return `<button type="button" class="${cls}" disabled aria-disabled="true"
    data-i18n="${i18nKey}">${fallback}</button>`;
}

/** Wrap CTA in k3-tooltip (host receives hover — disabled buttons do not). */
function renderCtaWithTooltip(
  href: string | undefined,
  tip: string,
  i18nKey: string,
  fallback: string,
  extraClass = '',
): string {
  return `<k3-tooltip position="top" content="${escapeAttr(tip)}">
    <span class="sponsor-tier-cta-host${extraClass ? ` ${extraClass}` : ''}">
      ${renderCta(href, i18nKey, fallback)}
    </span>
  </k3-tooltip>`;
}

function renderTierCard(tier: SponsorTierCard): string {
  const priceInner = tier.custom
    ? `<span class="sponsor-tier-price-free" data-i18n="playground.sponsors.price.free">Montant libre</span>`
    : `<span class="sponsor-tier-price-value">${escapeHtml(tier.priceEur ?? '')}</span>
       <span class="sponsor-tier-price-unit" data-i18n="${tier.priceUnitKey ?? ''}">€ / mois</span>`;

  const tip = tooltipLabel(tier.custom ? undefined : tier.priceEur);

  return `
<article class="sponsor-tier-card" data-tier="${tier.id}">
  <div class="sponsor-tier-banner">
    <span class="sponsor-tier-badge" data-i18n="${tier.badgeKey}">ADHÉSION</span>
  </div>
  <div class="sponsor-tier-body">
    <h3 class="sponsor-tier-title">
      <span data-i18n="${tier.titleKey}">Tier</span>
      <span class="sponsor-tier-emoji" aria-hidden="true">${tier.emoji}</span>
    </h3>
    <p class="sponsor-tier-desc" data-i18n="${tier.descKey}"></p>
    <p class="sponsor-tier-price">${priceInner}</p>
    ${renderCtaWithTooltip(tier.ctaHref, tip, 'playground.sponsors.cta', 'Contribuer')}
  </div>
</article>`;
}

const SPONSOR_GRID_COLS = 24;

function wrapCellTooltip(tip: string, inner: string): string {
  return `<k3-tooltip class="sponsor-wall-tip" position="top" content="${escapeAttr(tip)}">
    <span class="sponsor-wall-cell-hit">${inner}</span>
  </k3-tooltip>`;
}

function renderSponsorCell(s: SponsorEntry, tip: string): string {
  const inner = s.href
    ? `<a class="sponsor-wall-link" href="${escapeAttr(s.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeAttr(s.name)}">${avatarHtml(s)}</a>`
    : `<span class="sponsor-wall-link">${avatarHtml(s)}</span>`;
  return `<li class="sponsor-wall-cell" role="listitem">${wrapCellTooltip(tip, inner)}</li>`;
}

/** Full row of 24 dashed “?” slots — each with the tier amount tooltip. */
function renderEmptyCells(tip: string): string {
  return Array.from({ length: SPONSOR_GRID_COLS }, () =>
    `<li class="sponsor-wall-cell sponsor-wall-cell--empty" role="listitem">
      ${wrapCellTooltip(tip, `<span class="sponsor-wall-placeholder" aria-hidden="true">?</span>`)}
    </li>`,
  ).join('');
}

function renderWall(wall: (typeof SPONSOR_WALLS)[number]): string {
  const tip = tooltipLabel(wall.priceEur);
  const isEmpty = wall.sponsors.length === 0;
  const cells = isEmpty
    ? renderEmptyCells(tip)
    : wall.sponsors.map((s) => renderSponsorCell(s, tip)).join('');
  const emptyCaption = isEmpty
    ? `<p class="sponsor-wall-empty-caption" data-i18n="playground.sponsors.wall.empty">Aucun sponsor pour le moment — soyez le premier.</p>`
    : '';

  return `
<section class="sponsor-wall" data-wall="${wall.id}">
  <h3 class="sponsor-wall-title" data-i18n="${wall.titleKey}"></h3>
  ${emptyCaption}
  <ul class="sponsor-wall-grid" role="list">
    ${cells}
  </ul>
</section>`;
}

/** Mount sponsors block into `#sponsors-root` (home page). */
export function mountSponsors(): void {
  const root = document.getElementById('sponsors-root');
  if (!root) return;

  root.innerHTML = `
<section class="sponsors" aria-labelledby="sponsors-heading">
  <header class="sponsors-head section-head">
    <p class="eyebrow" data-i18n="playground.sponsors.eyebrow">Sponsors</p>
    <h2 id="sponsors-heading" data-i18n="playground.sponsors.title">Soutenu par ces entreprises et contributeurs</h2>
    <p class="sponsors-lead" data-i18n="playground.sponsors.lead">
      Les mainteneurs consacrent temps et énergie à faire évoluer K3ui. Soutenez le projet 🙏
    </p>
    <div class="sponsors-actions">
      ${renderCtaWithTooltip(
        SPONSOR_CTA,
        tooltipLabel(),
        'playground.sponsors.sponsor',
        'Sponsoriser',
        'sponsor-tier-cta-host--inline',
      )}
    </div>
  </header>

  <div class="sponsors-contrib">
    <h3 class="sponsors-contrib-title" data-i18n="playground.sponsors.contrib.title">Contributions financières</h3>
    <div class="sponsor-tiers">
      ${SPONSOR_TIER_CARDS.map(renderTierCard).join('')}
    </div>
  </div>

  <div class="sponsors-walls">
    ${SPONSOR_WALLS.map(renderWall).join('')}
  </div>
</section>`;
}
