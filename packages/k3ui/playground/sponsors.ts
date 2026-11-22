/**
 * Sponsors page — centered title + 24×9 placeholder cells.
 * Random square megas without overlap: 5× (3×3 = 9) and 10× (2×2 = 4).
 */

export interface SponsorEntry {
  name: string;
  href?: string;
  /** Image URL or empty → initials avatar */
  logo?: string;
  initials?: string;
}

/** Top-left of a mega block (0-indexed) + span in unit cells. */
export type SponsorMegaBlock = { col: number; row: number; span: number };

export type SponsorMegaSpec = { span: number; count: number };

/** Filled cells when sponsors exist; empty → dashed “?” placeholders. */
export const SPONSORS: SponsorEntry[] = [];

export const SPONSOR_GRID_COLS = 24;
export const SPONSOR_GRID_ROWS = 9;
export const SPONSOR_GRID_CELLS = SPONSOR_GRID_COLS * SPONSOR_GRID_ROWS;

/** Larger first so 3×3 packs before 2×2. */
export const SPONSOR_MEGA_SPECS: readonly SponsorMegaSpec[] = [
  { span: 3, count: 5 },
  { span: 2, count: 10 },
];

export const SPONSOR_MEGA_COUNT = SPONSOR_MEGA_SPECS.reduce((n, s) => n + s.count, 0);

function t(key: string, vars?: Record<string, string | number>): string {
  return window.K3UI?.i18n.t(key, undefined, vars) ?? key;
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

function avatarHtml(s: SponsorEntry): string {
  if (s.logo) {
    return `<img class="sponsor-logo" src="${escapeAttr(s.logo)}" alt="${escapeAttr(s.name)}" loading="lazy" />`;
  }
  const initials = (s.initials || s.name.slice(0, 2)).toUpperCase();
  return `<span class="sponsor-initials" aria-hidden="true">${escapeHtml(initials)}</span>`;
}

function wrapCellTooltip(tip: string, inner: string): string {
  return `<k3-tooltip class="sponsor-wall-tip" position="top" content="${escapeAttr(tip)}">
    <span class="sponsor-wall-cell-hit">${inner}</span>
  </k3-tooltip>`;
}

function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

function shuffleInPlace<T>(items: T[], rand: () => number): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const a = items[i]!;
    items[i] = items[j]!;
    items[j] = a;
  }
}

function pickBlocksOfSpan(
  cols: number,
  rows: number,
  span: number,
  count: number,
  occupied: Set<string>,
  rand: () => number,
): SponsorMegaBlock[] {
  const candidates: SponsorMegaBlock[] = [];
  for (let row = 0; row <= rows - span; row++) {
    for (let col = 0; col <= cols - span; col++) {
      candidates.push({ col, row, span });
    }
  }
  shuffleInPlace(candidates, rand);

  const picked: SponsorMegaBlock[] = [];
  for (const block of candidates) {
    if (picked.length >= count) break;
    let overlaps = false;
    for (let dr = 0; dr < span && !overlaps; dr++) {
      for (let dc = 0; dc < span; dc++) {
        if (occupied.has(cellKey(block.col + dc, block.row + dr))) {
          overlaps = true;
          break;
        }
      }
    }
    if (overlaps) continue;
    for (let dr = 0; dr < span; dr++) {
      for (let dc = 0; dc < span; dc++) {
        occupied.add(cellKey(block.col + dc, block.row + dr));
      }
    }
    picked.push(block);
  }
  return picked;
}

/**
 * Place all mega specs without overlap (larger spans first).
 */
export function pickRandomMegaBlocks(
  cols = SPONSOR_GRID_COLS,
  rows = SPONSOR_GRID_ROWS,
  specs: readonly SponsorMegaSpec[] = SPONSOR_MEGA_SPECS,
  rand: () => number = Math.random,
): SponsorMegaBlock[] {
  const occupied = new Set<string>();
  const ordered = [...specs].sort((a, b) => b.span - a.span);
  const picked: SponsorMegaBlock[] = [];
  for (const spec of ordered) {
    picked.push(...pickBlocksOfSpan(cols, rows, spec.span, spec.count, occupied, rand));
  }
  return picked;
}

function renderUnitCell(tip: string, sponsor?: SponsorEntry): string {
  if (sponsor) {
    const inner = sponsor.href
      ? `<a class="sponsor-wall-link" href="${escapeAttr(sponsor.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeAttr(sponsor.name)}">${avatarHtml(sponsor)}</a>`
      : `<span class="sponsor-wall-link">${avatarHtml(sponsor)}</span>`;
    return `<li class="sponsor-wall-cell" role="listitem">${wrapCellTooltip(tip, inner)}</li>`;
  }
  return `<li class="sponsor-wall-cell sponsor-wall-cell--empty" role="listitem">
      ${wrapCellTooltip(tip, `<span class="sponsor-wall-placeholder" aria-hidden="true">?</span>`)}
    </li>`;
}

function renderMegaCell(tip: string, span: number, sponsor?: SponsorEntry): string {
  const sizeClass = span >= 3 ? 'sponsor-wall-cell--mega-lg' : 'sponsor-wall-cell--mega-sm';
  if (sponsor) {
    const inner = sponsor.href
      ? `<a class="sponsor-wall-link" href="${escapeAttr(sponsor.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeAttr(sponsor.name)}">${avatarHtml(sponsor)}</a>`
      : `<span class="sponsor-wall-link">${avatarHtml(sponsor)}</span>`;
    return `<li class="sponsor-wall-cell sponsor-wall-cell--mega ${sizeClass}" role="listitem" style="grid-column: span ${span}; grid-row: span ${span}">${wrapCellTooltip(tip, inner)}</li>`;
  }
  return `<li class="sponsor-wall-cell sponsor-wall-cell--empty sponsor-wall-cell--mega ${sizeClass}" role="listitem" style="grid-column: span ${span}; grid-row: span ${span}">
      ${wrapCellTooltip(tip, `<span class="sponsor-wall-placeholder" aria-hidden="true">?</span>`)}
    </li>`;
}

/** Expected DOM cell count after mega merges. */
export function sponsorDomCellCount(
  specs: readonly SponsorMegaSpec[] = SPONSOR_MEGA_SPECS,
): number {
  return specs.reduce((n, s) => n - s.count * (s.span * s.span - 1), SPONSOR_GRID_CELLS);
}

export function renderGrid(megas: SponsorMegaBlock[] = pickRandomMegaBlocks()): string {
  const tip = t('playground.sponsors.tooltip.free');
  const megaAt = new Map<string, SponsorMegaBlock>();
  const covered = new Set<string>();

  for (const block of megas) {
    megaAt.set(cellKey(block.col, block.row), block);
    for (let dr = 0; dr < block.span; dr++) {
      for (let dc = 0; dc < block.span; dc++) {
        if (dr === 0 && dc === 0) continue;
        covered.add(cellKey(block.col + dc, block.row + dr));
      }
    }
  }

  let sponsorIdx = 0;
  const parts: string[] = [];
  for (let row = 0; row < SPONSOR_GRID_ROWS; row++) {
    for (let col = 0; col < SPONSOR_GRID_COLS; col++) {
      const key = cellKey(col, row);
      if (covered.has(key)) continue;
      const sponsor = SPONSORS[sponsorIdx++];
      const mega = megaAt.get(key);
      if (mega) {
        parts.push(renderMegaCell(tip, mega.span, sponsor));
      } else {
        parts.push(renderUnitCell(tip, sponsor));
      }
    }
  }
  return parts.join('');
}

/** Mount sponsors strip into `#sponsors-root` (sponsors page). */
export function mountSponsors(): void {
  const root = document.getElementById('sponsors-root');
  if (!root) return;
  if (root.querySelector('.sponsor-wall-grid')) return;

  root.innerHTML = `
<section class="sponsors" aria-labelledby="sponsors-heading">
  <h1 id="sponsors-heading" class="sponsors-strip-title" data-i18n="playground.sponsors.strip.title">
    Become a K3ui sponsor
  </h1>
  <ul class="sponsor-wall-grid" role="list">
    ${renderGrid()}
  </ul>
</section>`;
}
