import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import '../../src/components/actions/button-segmented.js';
import type { K3ButtonSegmented } from '../../src/components/actions/button-segmented.js';

describe('k3-button-segmented', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({ components: [], theme: { mode: 'light' } });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('mounts segments and selects the first by default', async () => {
    host.innerHTML = `<k3-button-segmented
      segments='[{"label":"A","value":"a"},{"label":"B","value":"b"}]'
    ></k3-button-segmented>`;
    const el = host.querySelector('k3-button-segmented') as K3ButtonSegmented;
    await el.updateComplete;
    expect(el.getSelectedIndices()).toEqual([0]);
    const active = el.shadowRoot!.querySelectorAll('.button-segmented__btn--active');
    expect(active.length).toBe(1);
  });

  it('emits k3-change when another segment is chosen', async () => {
    host.innerHTML = `<k3-button-segmented
      segments='[{"label":"A","value":"a"},{"label":"B","value":"b"}]'
    ></k3-button-segmented>`;
    const el = host.querySelector('k3-button-segmented') as K3ButtonSegmented;
    await el.updateComplete;
    const onChange = vi.fn();
    el.addEventListener('k3-change', onChange as EventListener);
    const buttons = el.shadowRoot!.querySelectorAll(
      '.button-segmented__btn',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    await el.updateComplete;
    expect(onChange).toHaveBeenCalledTimes(1);
    const detail = (onChange.mock.calls[0][0] as CustomEvent).detail as {
      indices: number[];
      values: string[];
    };
    expect(detail.indices).toEqual([1]);
    expect(detail.values).toEqual(['b']);
    expect(el.getSelectedIndices()).toEqual([1]);
  });
});
