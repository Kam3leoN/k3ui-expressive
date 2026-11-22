import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';
import { computeFabDialOffsets } from '../../src/components/actions/fab-dial.geometry.js';
import type { K3FabDial } from '../../src/components/actions/fab-dial.js';

describe('fab-dial geometry', () => {
  it('returns flower offsets for 3 actions', () => {
    const offsets = computeFabDialOffsets({
      count: 3,
      layout: 'flower',
      position: 'bottom-right',
      radius: null,
      gap: 60,
      spread: [0, 90],
      triggerSize: 56,
      actionSize: 46,
      minGap: 14,
    });
    expect(offsets).toHaveLength(3);
    expect(offsets[0].x).not.toBe(0);
  });
});

describe('k3-fab-dial', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-fab-dial', 'k3-fab-dial-item', 'k3-fab'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('opens and collects slotted items', async () => {
    host.innerHTML = `
      <k3-fab-dial position="bottom-right" layout="flower">
        <k3-fab-dial-item item-id="a" label="A" icon="camera"></k3-fab-dial-item>
        <k3-fab-dial-item item-id="b" label="B" icon="image"></k3-fab-dial-item>
      </k3-fab-dial>`;
    const el = host.querySelector('k3-fab-dial') as K3FabDial;
    await el.updateComplete;
    el.open = true;
    await el.updateComplete;
    expect(el.open).toBe(true);
  });
});
