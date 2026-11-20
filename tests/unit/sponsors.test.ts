import { afterEach, describe, expect, it } from 'vitest';
import {
  SPONSOR_GRID_CELLS,
  SPONSOR_GRID_COLS,
  SPONSOR_GRID_ROWS,
  SPONSOR_MEGA_COUNT,
  SPONSOR_MEGA_SPECS,
  mountSponsors,
  pickRandomMegaBlocks,
  sponsorDomCellCount,
} from '../../playground/sponsors.js';

function seededRand(start = 1): () => number {
  let seed = start;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

describe('sponsors strip', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('picks 5×3×3 and 10×2×2 megas without overlap', () => {
    expect(SPONSOR_MEGA_SPECS).toEqual([
      { span: 3, count: 5 },
      { span: 2, count: 10 },
    ]);
    const blocks = pickRandomMegaBlocks(
      SPONSOR_GRID_COLS,
      SPONSOR_GRID_ROWS,
      SPONSOR_MEGA_SPECS,
      seededRand(),
    );
    expect(blocks).toHaveLength(SPONSOR_MEGA_COUNT);
    expect(blocks.filter((b) => b.span === 3)).toHaveLength(5);
    expect(blocks.filter((b) => b.span === 2)).toHaveLength(10);

    const occupied = new Set<string>();
    for (const b of blocks) {
      expect(b.col + b.span).toBeLessThanOrEqual(SPONSOR_GRID_COLS);
      expect(b.row + b.span).toBeLessThanOrEqual(SPONSOR_GRID_ROWS);
      for (let dr = 0; dr < b.span; dr++) {
        for (let dc = 0; dc < b.span; dc++) {
          const key = `${b.col + dc},${b.row + dr}`;
          expect(occupied.has(key)).toBe(false);
          occupied.add(key);
        }
      }
    }
    expect(occupied.size).toBe(5 * 9 + 10 * 4);
  });

  it('mounts title + unit cells with mixed mega merges', () => {
    expect(SPONSOR_GRID_CELLS).toBe(SPONSOR_GRID_COLS * SPONSOR_GRID_ROWS);
    const expected = sponsorDomCellCount();
    /* 216 − 5×8 − 10×3 = 146 */
    expect(expected).toBe(146);
    document.body.innerHTML = `
      <article class="comp-page" data-page="sponsors" id="page-sponsors">
        <div id="sponsors-root" class="sponsors-root"></div>
      </article>`;
    mountSponsors();
    const root = document.getElementById('sponsors-root')!;
    expect(root.querySelector('.sponsors-strip-title')?.getAttribute('data-i18n')).toBe(
      'playground.sponsors.strip.title',
    );
    expect(root.querySelectorAll('.sponsor-wall-cell')).toHaveLength(expected);
    expect(root.querySelectorAll('.sponsor-wall-cell--mega')).toHaveLength(SPONSOR_MEGA_COUNT);
    expect(root.querySelectorAll('.sponsor-wall-cell--mega-lg')).toHaveLength(5);
    expect(root.querySelectorAll('.sponsor-wall-cell--mega-sm')).toHaveLength(10);
  });

  it('is idempotent', () => {
    document.body.innerHTML = '<div id="sponsors-root"></div>';
    mountSponsors();
    mountSponsors();
    expect(document.querySelectorAll('#sponsors-root .sponsor-wall-grid')).toHaveLength(1);
    expect(document.querySelectorAll('#sponsors-root .sponsor-wall-cell')).toHaveLength(
      sponsorDomCellCount(),
    );
  });
});
