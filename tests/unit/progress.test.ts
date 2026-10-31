import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import * as waveformPcm from '../../src/components/media/waveform-pcm.js';

describe('k3-progress', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-progress'], theme: { mode: 'light' } });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    waveformPcm.clearWaveformPeakCache();
    host.remove();
  });

  it('linear default places label leading and percent trailing inline', async () => {
    host.innerHTML = `
      <k3-progress
        value="0.65"
        label="Downloading"
        show-percent
        layout="default"
        supporting-text="Almost done"
      ></k3-progress>
    `;
    const el = host.querySelector('k3-progress') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    await Promise.resolve();

    const root = el.shadowRoot!.querySelector('.root')!;
    expect(root.classList.contains('linear')).toBe(true);
    expect(root.classList.contains('layout-default')).toBe(true);

    const leading = el.shadowRoot!.querySelector('.leading')!;
    const trailing = el.shadowRoot!.querySelector('.trailing')!;
    const supporting = el.shadowRoot!.querySelector('.supporting')!;
    expect(leading.classList.contains('has')).toBe(true);
    expect(leading.classList.contains('start')).toBe(true);
    expect(leading.textContent).toContain('Downloading');
    expect(trailing.classList.contains('has')).toBe(true);
    expect(trailing.classList.contains('end')).toBe(true);
    expect(trailing.querySelector('.value-text')?.textContent).toContain('65%');
    expect(supporting.classList.contains('has')).toBe(true);
    expect(supporting.textContent).toContain('Almost done');

    /* No duplicate percent ghosts */
    const percents = [...el.shadowRoot!.querySelectorAll('.percent.has')];
    expect(percents).toHaveLength(1);
  });

  it('linear top / bottom move label+value above or below the bar', async () => {
    host.innerHTML = `<k3-progress value="0.5" label="A" show-percent layout="top"></k3-progress>`;
    const el = host.querySelector('k3-progress') as HTMLElement & {
      updateComplete: Promise<unknown>;
      layout: string;
    };
    await el.updateComplete;
    const root = el.shadowRoot!.querySelector('.root')!;
    expect(root.classList.contains('layout-top')).toBe(true);
    expect(el.shadowRoot!.querySelector('.leading')!.classList.contains('above-start')).toBe(
      true,
    );
    expect(el.shadowRoot!.querySelector('.trailing')!.classList.contains('above-end')).toBe(
      true,
    );

    el.layout = 'bottom';
    await el.updateComplete;
    expect(root.classList.contains('layout-bottom')).toBe(true);
    expect(el.shadowRoot!.querySelector('.leading')!.classList.contains('below-start')).toBe(
      true,
    );
    expect(el.shadowRoot!.querySelector('.trailing')!.classList.contains('below-end')).toBe(
      true,
    );
  });

  it('circular puts label top and percent inside or below', async () => {
    host.innerHTML = `
      <k3-progress
        variant="circular"
        value="0.65"
        label="Battery"
        show-percent
        percent-position="inside"
      ></k3-progress>
    `;
    const el = host.querySelector('k3-progress') as HTMLElement & {
      updateComplete: Promise<unknown>;
      percentPosition: string;
    };
    await el.updateComplete;
    const root = el.shadowRoot!.querySelector('.root')!;
    expect(root.classList.contains('circular')).toBe(true);
    expect(el.shadowRoot!.querySelector('.leading')!.textContent).toContain('Battery');
    expect(el.shadowRoot!.querySelector('.percent.inside')!.classList.contains('has')).toBe(
      true,
    );
    expect(el.shadowRoot!.querySelector('.trailing')!.classList.contains('has')).toBe(false);

    el.percentPosition = 'below';
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.percent.inside')!.classList.contains('has')).toBe(
      false,
    );
    expect(el.shadowRoot!.querySelector('.trailing')!.classList.contains('has')).toBe(true);
    expect(el.shadowRoot!.querySelector('.value-text')?.textContent).toContain('65%');
  });

  it('hides percent chrome when show-percent is off', async () => {
    host.innerHTML = `<k3-progress value="0.65"></k3-progress>`;
    const el = host.querySelector('k3-progress') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll('.percent.has')).toHaveLength(0);
    expect(el.shadowRoot!.querySelector('.trailing')!.classList.contains('has')).toBe(false);
  });

  it('label and show-percent are independent', async () => {
    host.innerHTML = `<k3-progress value="0.65" label="Downloading"></k3-progress>`;
    const el = host.querySelector('k3-progress') as HTMLElement & {
      updateComplete: Promise<unknown>;
      showPercent: boolean;
      label: string;
      supportingText: string;
    };
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.leading')!.textContent).toContain('Downloading');
    expect(el.shadowRoot!.querySelector('.trailing')!.classList.contains('has')).toBe(false);

    el.showPercent = true;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.value-text')?.textContent).toContain('65%');
    expect(el.shadowRoot!.querySelector('.leading')!.textContent).toContain('Downloading');

    el.label = '';
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.leading')!.classList.contains('has')).toBe(false);
    expect(el.shadowRoot!.querySelector('.value-text')?.textContent).toContain('65%');
  });

  it('aligns supporting under the bar when there is no label', async () => {
    host.innerHTML = `<k3-progress
      value="0.65"
      show-percent
      supporting-text="Almost done"
    ></k3-progress>`;
    const el = host.querySelector('k3-progress') as HTMLElement & {
      updateComplete: Promise<unknown>;
      label: string;
      supportingText: string;
      layout: string;
    };
    await el.updateComplete;
    const root = el.shadowRoot!.querySelector('.root')!;
    const supporting = el.shadowRoot!.querySelector('.supporting')!;
    expect(supporting.classList.contains('has')).toBe(true);
    expect(root.classList.contains('has-label')).toBe(false);
    expect(root.classList.contains('has-trailing')).toBe(true);

    el.label = 'Downloading';
    await el.updateComplete;
    expect(root.classList.contains('has-label')).toBe(true);
    expect(supporting.classList.contains('has')).toBe(true);

    el.layout = 'bottom';
    await el.updateComplete;
    expect(root.classList.contains('has-below')).toBe(true);
  });

  it('clears label and supporting text on repeated off', async () => {
    host.innerHTML = `<k3-progress value="0.65"></k3-progress>`;
    const el = host.querySelector('k3-progress') as HTMLElement & {
      updateComplete: Promise<unknown>;
      label: string;
      supportingText: string;
    };
    await el.updateComplete;

    for (let i = 0; i < 3; i++) {
      el.label = 'Downloading';
      el.supportingText = 'Almost done';
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.label-text')?.textContent).toContain('Downloading');
      expect(el.shadowRoot!.querySelector('.supporting-text')?.textContent).toContain(
        'Almost done',
      );

      el.label = '';
      el.supportingText = '';
      el.setAttribute('label', '');
      el.setAttribute('supporting-text', '');
      await el.updateComplete;
      expect(el.shadowRoot!.querySelector('.leading')!.classList.contains('has')).toBe(false);
      expect(el.shadowRoot!.querySelector('.supporting')!.classList.contains('has')).toBe(
        false,
      );
    }
  });

  it('clears circular size token when returning to linear', async () => {
    host.innerHTML = `<k3-progress value="0.65" variant="circular" size="64"></k3-progress>`;
    const el = host.querySelector('k3-progress') as HTMLElement & {
      updateComplete: Promise<unknown>;
      variant: string;
    };
    await el.updateComplete;
    el.style.setProperty('--k3-progress-size', '64px');

    el.variant = 'linear';
    await el.updateComplete;
    /* updated() → resetCanvasBox removes the circular size var */
    expect(el.style.getPropertyValue('--k3-progress-size')).toBe('');
    expect(el.getAttribute('variant')).toBe('linear');
  });

  it('oscillation shape reflects and clears wavy alias', async () => {
    host.innerHTML = `<k3-progress value="0.42" shape="wavy" wavy></k3-progress>`;
    const el = host.querySelector('k3-progress') as HTMLElement & {
      updateComplete: Promise<unknown>;
      shape: string;
      wavy: boolean;
      src: string;
    };
    await el.updateComplete;
    expect(el.shape).toBe('wavy');
    expect(el.wavy).toBe(true);

    el.shape = 'oscillation';
    await el.updateComplete;
    expect(el.getAttribute('shape')).toBe('oscillation');
    expect(el.wavy).toBe(false);
    expect(el.hasAttribute('wavy')).toBe(false);
  });

  it('oscillation without src skips PCM load (placeholder only)', async () => {
    const loadSpy = vi.spyOn(waveformPcm, 'loadWaveformPeaks');
    host.innerHTML = `<k3-progress shape="oscillation" value="0.5" show-percent></k3-progress>`;
    const el = host.querySelector('k3-progress') as HTMLElement & {
      updateComplete: Promise<unknown>;
      shape: string;
      src: string;
    };
    await el.updateComplete;
    await Promise.resolve();
    expect(el.shape).toBe('oscillation');
    expect(el.src).toBe('');
    expect(loadSpy).not.toHaveBeenCalled();
    expect(el.shadowRoot!.querySelector('.value-text')?.textContent).toContain('50%');
  });

  it('oscillation with src loads PCM peaks via shared waveform cache', async () => {
    const peaks = new Float32Array([0.2, 0.9, 0.4, 0.7]);
    const loadSpy = vi
      .spyOn(waveformPcm, 'loadWaveformPeaks')
      .mockResolvedValue(peaks);
    host.innerHTML = `<k3-progress
      shape="oscillation"
      src="/sounds/hello.mp3"
      value="0.42"
    ></k3-progress>`;
    const el = host.querySelector('k3-progress') as HTMLElement & {
      updateComplete: Promise<unknown>;
      shape: string;
      src: string;
    };
    await el.updateComplete;
    await vi.waitFor(() => {
      expect(loadSpy).toHaveBeenCalled();
    });
    expect(loadSpy.mock.calls[0]![0]).toBe('/sounds/hello.mp3');
    expect(el.getAttribute('src')).toBe('/sounds/hello.mp3');
  });

  it('circular ignores oscillation paint path (shape still set)', async () => {
    const loadSpy = vi.spyOn(waveformPcm, 'loadWaveformPeaks');
    host.innerHTML = `<k3-progress
      variant="circular"
      shape="oscillation"
      src="/sounds/hello.mp3"
      value="0.5"
    ></k3-progress>`;
    const el = host.querySelector('k3-progress') as HTMLElement & {
      updateComplete: Promise<unknown>;
      shape: string;
      variant: string;
    };
    await el.updateComplete;
    await Promise.resolve();
    expect(el.variant).toBe('circular');
    expect(el.shape).toBe('oscillation');
    /* isOscillation requires linear — no PCM fetch */
    expect(loadSpy).not.toHaveBeenCalled();
    expect(el.shadowRoot!.querySelector('.root')!.classList.contains('circular')).toBe(
      true,
    );
  });
});
