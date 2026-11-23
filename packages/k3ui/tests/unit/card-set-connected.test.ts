import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing-helpers';
import { init } from '../../src/index.js';
import {
  CardSetConnectedGapDp,
  CardSetConnectedInnerDp,
  CardSetConnectedOuterDp,
  CardSetSpecs,
} from '../../src/components/containment/card-set.specs.js';
import {
  cornerFlagsFromNeighbors,
  detectCardNeighbors,
  logicalCornersFromFlags,
  resolveConnectedCorners,
  stackPositionLabel,
  type CardRect,
} from '../../src/components/containment/card-set.geometry.js';
import type { K3CardSet } from '../../src/components/containment/card-set.js';
import type { K3Card } from '../../src/components/containment/card.js';
import { devicePixelSnapCss } from '../../src/core/css-length.js';

describe('card-set connected specs', () => {
  it('matches M3E card-list join tokens', () => {
    expect(CardSetConnectedGapDp).toBe(2);
    expect(CardSetConnectedOuterDp).toBe(28);
    expect(CardSetConnectedInnerDp).toBe(4);
    expect(CardSetSpecs.connectedOuterCss).toContain('extra-large');
    expect(CardSetSpecs.connectedInnerCss).toContain('extra-small');
  });
});

describe('card-set geometry', () => {
  const outer = 'OUTER';
  const inner = 'INNER';

  it('stackPositionLabel covers only/first/middle/last', () => {
    expect(stackPositionLabel(0, 1)).toBe('only');
    expect(stackPositionLabel(0, 3)).toBe('first');
    expect(stackPositionLabel(1, 3)).toBe('middle');
    expect(stackPositionLabel(2, 3)).toBe('last');
  });

  it('vertical stack — outer top / all inner / outer bottom', () => {
    const gap = 2;
    const rects: CardRect[] = [
      { top: 0, right: 100, bottom: 40, left: 0 },
      { top: 42, right: 100, bottom: 82, left: 0 },
      { top: 84, right: 100, bottom: 124, left: 0 },
    ];
    const corners = resolveConnectedCorners(rects, gap, outer, inner, false);
    expect(corners[0]).toEqual({
      rss: outer,
      rse: outer,
      ree: inner,
      res: inner,
    });
    expect(corners[1]).toEqual({
      rss: inner,
      rse: inner,
      ree: inner,
      res: inner,
    });
    expect(corners[2]).toEqual({
      rss: inner,
      rse: inner,
      ree: outer,
      res: outer,
    });
  });

  it('2×2 grid — corner cells get a single outer corner each', () => {
    const gap = 2;
    /* TL TR / BL BR */
    const rects: CardRect[] = [
      { top: 0, right: 98, bottom: 48, left: 0 },
      { top: 0, right: 200, bottom: 48, left: 100 },
      { top: 50, right: 98, bottom: 100, left: 0 },
      { top: 50, right: 200, bottom: 100, left: 100 },
    ];
    const neighbors = detectCardNeighbors(rects, gap);
    expect(neighbors[0]).toEqual({
      above: false,
      right: true,
      below: true,
      left: false,
    });
    expect(neighbors[1]).toEqual({
      above: false,
      right: false,
      below: true,
      left: true,
    });
    const flags = neighbors.map(cornerFlagsFromNeighbors);
    expect(flags[0]!.topLeftOuter).toBe(true);
    expect(flags[0]!.topRightOuter).toBe(false);
    expect(flags[1]!.topRightOuter).toBe(true);
    expect(flags[2]!.bottomLeftOuter).toBe(true);
    expect(flags[3]!.bottomRightOuter).toBe(true);
  });

  it('full-width bottom row — both bottom corners outer', () => {
    const gap = 2;
    const rects: CardRect[] = [
      { top: 0, right: 66, bottom: 40, left: 0 },
      { top: 0, right: 134, bottom: 40, left: 68 },
      { top: 0, right: 200, bottom: 40, left: 136 },
      { top: 42, right: 200, bottom: 90, left: 0 },
    ];
    const corners = resolveConnectedCorners(rects, gap, outer, inner, false);
    expect(corners[3]).toEqual({
      rss: inner,
      rse: inner,
      ree: outer,
      res: outer,
    });
  });

  it('RTL remaps physical corners to logical tokens', () => {
    const flags = {
      topLeftOuter: true,
      topRightOuter: false,
      bottomRightOuter: false,
      bottomLeftOuter: false,
    };
    const ltr = logicalCornersFromFlags(flags, outer, inner, false);
    const rtl = logicalCornersFromFlags(flags, outer, inner, true);
    expect(ltr.rss).toBe(outer);
    expect(ltr.rse).toBe(inner);
    expect(rtl.rss).toBe(inner);
    expect(rtl.rse).toBe(outer);
  });
});

describe('k3-card-set variant=connected', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-card-set', 'k3-card'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    host.style.width = '480px';
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  async function flushLayout(el: K3CardSet): Promise<void> {
    await el.updateComplete;
    for (const card of el.querySelectorAll('k3-card')) {
      await (card as K3Card).updateComplete;
    }
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
  }

  it('applies DPR-snapped connected gap token', async () => {
    host.innerHTML = `
      <k3-card-set variant="connected" layout="stack" label="Stack">
        <k3-card variant="filled"><span slot="headline">A</span></k3-card>
        <k3-card variant="filled"><span slot="headline">B</span></k3-card>
      </k3-card-set>
    `;
    const set = host.querySelector('k3-card-set') as K3CardSet;
    await flushLayout(set);
    expect(set.style.getPropertyValue('--k3-card-set-connected-gap').trim()).toBe(
      devicePixelSnapCss(CardSetConnectedGapDp),
    );
  });

  it('marks stack children with data-connected + data-cs positions', async () => {
    host.innerHTML = `
      <k3-card-set variant="connected" layout="stack">
        <k3-card variant="filled"><span slot="headline">A</span></k3-card>
        <k3-card variant="filled"><span slot="headline">B</span></k3-card>
        <k3-card variant="filled"><span slot="headline">C</span></k3-card>
      </k3-card-set>
    `;
    const set = host.querySelector('k3-card-set') as K3CardSet;
    await flushLayout(set);
    const cards = [...set.querySelectorAll('k3-card')] as K3Card[];
    expect(cards.every((c) => c.hasAttribute('data-connected'))).toBe(true);
    expect(cards[0]!.getAttribute('data-cs')).toBe('first');
    expect(cards[1]!.getAttribute('data-cs')).toBe('middle');
    expect(cards[2]!.getAttribute('data-cs')).toBe('last');
    expect(cards[0]!.style.getPropertyValue('--k3-card-rss')).toBe(
      CardSetSpecs.connectedOuterCss,
    );
    expect(cards[0]!.style.getPropertyValue('--k3-card-ree')).toBe(
      CardSetSpecs.connectedInnerCss,
    );
    expect(cards[1]!.style.getPropertyValue('--k3-card-rss')).toBe(
      CardSetSpecs.connectedInnerCss,
    );
    expect(cards[2]!.style.getPropertyValue('--k3-card-ree')).toBe(
      CardSetSpecs.connectedOuterCss,
    );
  });

  it('bento grid columns=3 with full-span last card', async () => {
    const set = await fixture<K3CardSet>(html`
      <k3-card-set
        variant="connected"
        layout="grid"
        columns="3"
        style="width: 480px"
      >
        <k3-card variant="filled"><span slot="headline">1</span></k3-card>
        <k3-card variant="filled"><span slot="headline">2</span></k3-card>
        <k3-card variant="filled"><span slot="headline">3</span></k3-card>
        <k3-card variant="filled"><span slot="headline">4</span></k3-card>
        <k3-card variant="filled"><span slot="headline">5</span></k3-card>
        <k3-card variant="filled"><span slot="headline">6</span></k3-card>
        <k3-card variant="filled" col-span="full"
          ><span slot="headline">7</span></k3-card
        >
      </k3-card-set>
    `);
    document.body.appendChild(set);
    await flushLayout(set);

    expect(set.getAttribute('columns')).toBe('3');
    expect(set.style.getPropertyValue('--k3-card-set-columns')).toBe('3');

    const cards = [...set.querySelectorAll('k3-card')] as K3Card[];
    expect(cards).toHaveLength(7);
    expect(cards.every((c) => c.hasAttribute('data-connected'))).toBe(true);
    expect(cards.every((c) => c.getAttribute('data-cs') === 'cell')).toBe(true);

    /* Top-left outer · full-width bottom both bottom corners outer */
    expect(cards[0]!.style.getPropertyValue('--k3-card-rss')).toBe(
      CardSetSpecs.connectedOuterCss,
    );
    expect(cards[0]!.style.getPropertyValue('--k3-card-rse')).toBe(
      CardSetSpecs.connectedInnerCss,
    );
    expect(cards[6]!.style.getPropertyValue('--k3-card-res')).toBe(
      CardSetSpecs.connectedOuterCss,
    );
    expect(cards[6]!.style.getPropertyValue('--k3-card-ree')).toBe(
      CardSetSpecs.connectedOuterCss,
    );
    expect(cards[6]!.style.getPropertyValue('--k3-card-rss')).toBe(
      CardSetSpecs.connectedInnerCss,
    );

    set.remove();
  });

  it('clears connected chrome when switching back to standard', async () => {
    host.innerHTML = `
      <k3-card-set variant="connected" layout="stack">
        <k3-card variant="filled"><span slot="headline">A</span></k3-card>
        <k3-card variant="filled"><span slot="headline">B</span></k3-card>
      </k3-card-set>
    `;
    const set = host.querySelector('k3-card-set') as K3CardSet;
    await flushLayout(set);
    set.variant = 'standard';
    await flushLayout(set);
    const cards = [...set.querySelectorAll('k3-card')] as K3Card[];
    expect(cards.every((c) => !c.hasAttribute('data-connected'))).toBe(true);
    expect(cards[0]!.style.getPropertyValue('--k3-card-rss')).toBe('');
    expect(set.style.getPropertyValue('--k3-card-set-connected-gap')).toBe('');
  });

  it('does not reflect columns=0 as an attribute', async () => {
    host.innerHTML = `<k3-card-set layout="grid"></k3-card-set>`;
    const set = host.querySelector('k3-card-set') as K3CardSet;
    await set.updateComplete;
    expect(set.hasAttribute('columns')).toBe(false);
    set.columns = 3;
    await set.updateComplete;
    expect(set.getAttribute('columns')).toBe('3');
    set.columns = 0;
    await set.updateComplete;
    expect(set.hasAttribute('columns')).toBe(false);
  });
});
