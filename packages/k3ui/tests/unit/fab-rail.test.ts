import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import {
  computeFabRailOffsets,
  DEFAULT_RAIL_DIRECTION,
} from '../../src/components/actions/fab-rail.geometry.js';
import type { K3FabRail } from '../../src/components/actions/fab-rail.js';

describe('fab-rail geometry', () => {
  it('defaults bottom-right → left and lays out along axis', () => {
    expect(DEFAULT_RAIL_DIRECTION['bottom-right']).toBe('left');
    const offsets = computeFabRailOffsets({
      count: 3,
      direction: 'up',
      actionSize: 46,
      gap: 14,
      triggerSize: 56,
    });
    expect(offsets).toHaveLength(3);
    expect(offsets[0].y).toBeLessThan(0);
  });
});

describe('k3-fab-rail', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-fab-rail', 'k3-fab-rail-item', 'k3-fab'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('opens with slotted items', async () => {
    host.innerHTML = `
      <k3-fab-rail position="bottom-right" direction="up">
        <k3-fab-rail-item item-id="a" label="A" icon="camera"></k3-fab-rail-item>
      </k3-fab-rail>`;
    const el = host.querySelector('k3-fab-rail') as K3FabRail;
    await el.updateComplete;
    el.open = true;
    await el.updateComplete;
    expect(el.open).toBe(true);
  });
});
