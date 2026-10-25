import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { init } from '../../src/index.js';

describe('k3-slider', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({ components: ['k3-slider'], theme: { mode: 'light' } });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('coerces vertical range to standard (M3 cognitive-load rule)', async () => {
    host.innerHTML = `<k3-slider variant="range" orientation="vertical" value-start="20" value-end="70"></k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
      variant: string;
      orientation: string;
    };
    await el.updateComplete;
    expect(el.orientation).toBe('vertical');
    expect(el.variant).toBe('standard');
  });

  it('positions vertical handle flush at min/max (0% / 100%)', async () => {
    host.innerHTML = `<k3-slider orientation="vertical" value="0" min="0" max="100"></k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
      value: number;
    };
    await el.updateComplete;
    const handle = el.shadowRoot!.querySelector('.handle') as HTMLElement;
    expect(handle.style.bottom).toBe('0%');
    expect(handle.style.top).toBe('auto');
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');

    el.value = 100;
    await el.updateComplete;
    expect(handle.style.bottom).toBe('100%');
  });

  it('keeps stop COLOR and stop SIZE on separate CSS vars', async () => {
    host.innerHTML = `<k3-slider stops step="10" value="40" min="0" max="100"></k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    /* Size is inlined on the host; color token must NOT be overwritten with "4px". */
    expect(el.style.getPropertyValue('--k3-slider-stop-size').trim()).toBe('4px');
    expect(el.style.getPropertyValue('--k3-slider-stop').trim()).toBe('');
    const inactive = el.shadowRoot!.querySelectorAll('.stop:not(.on-active)');
    const active = el.shadowRoot!.querySelectorAll('.stop.on-active');
    expect(inactive.length).toBeGreaterThan(0);
    expect(active.length).toBeGreaterThan(0);
  });

  it('aligns handle with discrete stops on the shared axis (not only at 50%)', async () => {
    host.innerHTML = `<k3-slider stops step="10" value="20" min="0" max="100"></k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
      trackLenPx?: number;
    };
    await el.updateComplete;
    /* Force a known track length so inset math is deterministic. */
    (el as unknown as { trackLenPx: number }).trackLenPx = 200;
    el.requestUpdate();
    await el.updateComplete;

    const handle = el.shadowRoot!.querySelector('.handle') as HTMLElement;
    const stops = [
      ...el.shadowRoot!.querySelectorAll('.stop[part="stop"]'),
    ] as HTMLElement[];
    /* value 20 → fraction 0.2 → inset 6px on 200px → 3% + 0.2*94% = 21.8% */
    expect(handle.style.insetInlineStart).toBe('21.8%');
    const stopAt20 = stops.find((s) => s.style.insetInlineStart === '21.8%');
    expect(stopAt20).toBeTruthy();
  });

  it('at max keeps handle gap + inner end (no inactive stub past handle)', async () => {
    host.innerHTML = `<k3-slider value="100" min="0" max="100"></k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    const handle = el.shadowRoot!.querySelector('.handle') as HTMLElement;
    expect(handle.style.insetInlineStart).toBe('100%');
    expect(el.shadowRoot!.querySelector('.stop[part="end-stop"]')).toBeNull();
    expect(el.shadowRoot!.querySelector('.seg.inactive')).toBeNull();
    const active = el.shadowRoot!.querySelector('.seg.active') as HTMLElement;
    expect(active).toBeTruthy();
    expect(active.classList.contains('lead-cap')).toBe(true);
    expect(active.classList.contains('trail-cap')).toBe(false);
    /* M3 gap before handle — width subtracts --k3-slider-pad */
    expect(active.style.width).toContain('var(--k3-slider-pad)');
  });

  it('at min keeps handle gap + inner start (no active stub)', async () => {
    host.innerHTML = `<k3-slider value="0" min="0" max="100"></k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    const handle = el.shadowRoot!.querySelector('.handle') as HTMLElement;
    expect(handle.style.insetInlineStart).toBe('0%');
    expect(el.shadowRoot!.querySelector('.seg.active')).toBeNull();
    const inactive = el.shadowRoot!.querySelector('.seg.inactive') as HTMLElement;
    expect(inactive).toBeTruthy();
    expect(inactive.classList.contains('lead-cap')).toBe(false);
    expect(inactive.classList.contains('trail-cap')).toBe(true);
    expect(inactive.style.insetInlineStart).toContain('var(--k3-slider-pad)');
  });

  it('exposes APG slider a11y and disabled state', async () => {
    host.innerHTML = `<k3-slider value="40" label="Volume" disabled></k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
      disabled: boolean;
    };
    await el.updateComplete;
    const handle = el.shadowRoot!.querySelector('.handle') as HTMLElement;
    expect(handle.getAttribute('role')).toBe('slider');
    expect(handle.getAttribute('aria-valuemin')).toBe('0');
    expect(handle.getAttribute('aria-valuemax')).toBe('100');
    expect(handle.getAttribute('aria-valuenow')).toBe('40');
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal');
    expect(handle.getAttribute('aria-disabled')).toBe('true');
    expect(handle.tabIndex).toBe(-1);
    expect(el.hasAttribute('disabled')).toBe(true);
  });

  it('snaps drag fractions to step so ends stay flush (no near-max stub)', async () => {
    host.innerHTML = `<k3-slider value="50" min="0" max="100" step="1" value-indicator></k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
      value: number;
    };
    await el.updateComplete;
    /* Simulate pointer fraction just shy of 1 — must land on max, not 99.x. */
    (
      el as unknown as {
        setFromFraction: (f: number, h: string) => void;
      }
    ).setFromFraction(0.996, 'value');
    await el.updateComplete;
    expect(el.value).toBe(100);
    const handle = el.shadowRoot!.querySelector('.handle') as HTMLElement;
    expect(handle.style.insetInlineStart).toBe('100%');
    expect(el.shadowRoot!.querySelector('.seg.inactive')).toBeNull();
  });

  it('owns vertical track length via host CSS var (area consumes it)', async () => {
    host.innerHTML = `<k3-slider orientation="vertical" size="xl" value="0" min="-50" max="50" variant="centered"></k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    expect(el.style.getPropertyValue('--k3-slider-vertical-len').trim()).toBe(
      '360px',
    );
    expect(el.shadowRoot!.querySelector('.area')).toBeTruthy();
    const handle = el.shadowRoot!.querySelector('.handle') as HTMLElement;
    expect(handle.classList.contains('k3-focus-ring')).toBe(true);
  });

  it('places start/end addons on the rail centered to the track', async () => {
    host.innerHTML = `<k3-slider value="40" label="Volume">
      <button slot="start" type="button">−</button>
      <button slot="end" type="button">+</button>
    </k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
      orientation: string;
    };
    await el.updateComplete;
    const rail = el.shadowRoot!.querySelector('.rail') as HTMLElement;
    const start = el.shadowRoot!.querySelector('.addon.start') as HTMLElement;
    const end = el.shadowRoot!.querySelector('.addon.end') as HTMLElement;
    expect(rail.classList.contains('has-start')).toBe(true);
    expect(rail.classList.contains('has-end')).toBe(true);
    expect(start.classList.contains('has')).toBe(true);
    expect(end.classList.contains('has')).toBe(true);
    /* DOM order: start → area → end; vertical uses column-reverse in CSS. */
    expect(start.compareDocumentPosition(end) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const area = el.shadowRoot!.querySelector('.area') as HTMLElement;
    expect(
      start.compareDocumentPosition(area) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      area.compareDocumentPosition(end) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    el.orientation = 'vertical';
    await el.updateComplete;
    expect(el.getAttribute('orientation')).toBe('vertical');
  });

  it('range end-stop follows valueEnd (same as standard atMax), not value', async () => {
    host.innerHTML = `<k3-slider variant="range" value-start="20" value-end="70"></k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
      valueEnd: number;
    };
    await el.updateComplete;
    /* Trailing inactive → contrast tip at max end. */
    expect(el.shadowRoot!.querySelector('.stop[part="end-stop"]')).toBeTruthy();

    el.valueEnd = 100;
    await el.updateComplete;
    /* End handle covers the tip — hide like standard at max. */
    expect(el.shadowRoot!.querySelector('.stop[part="end-stop"]')).toBeNull();
  });

  it('range keeps two VI nodes but only the active handle shows one', async () => {
    host.innerHTML = `<k3-slider variant="range" value-start="10" value-end="70" value-indicator></k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    const bubbles = [
      ...el.shadowRoot!.querySelectorAll('.value-indicator'),
    ] as HTMLElement[];
    expect(bubbles).toHaveLength(2);
    expect(bubbles[0].getAttribute('data-edge')).toBe('start');
    expect(bubbles[1].getAttribute('data-edge')).toBe('end');
    expect(bubbles[0].textContent?.trim()).toBe('10');
    expect(bubbles[1].textContent?.trim()).toBe('70');
    /* Idle — neither shown until drag. */
    expect(bubbles[0].classList.contains('has')).toBe(false);
    expect(bubbles[1].classList.contains('has')).toBe(false);
    const startPct = parseFloat(bubbles[0].style.insetInlineStart);
    const endPct = parseFloat(bubbles[1].style.insetInlineStart);
    expect(startPct).toBeLessThan(endPct);
  });

  it('supports color roles, top-to-bottom, stop-labels, and linked field', async () => {
    host.innerHTML = `
      <input id="vol" type="number" />
      <k3-slider
        id="sl"
        for="vol"
        color="secondary"
        orientation="vertical"
        top-to-bottom
        stops
        step="50"
        stop-labels="Low,Mid,High"
        value="50"
        min="0"
        max="100"
      ></k3-slider>`;
    const el = host.querySelector('#sl') as HTMLElement & {
      updateComplete: Promise<unknown>;
      value: number;
      color: string;
      topToBottom: boolean;
    };
    await el.updateComplete;
    expect(el.getAttribute('color')).toBe('secondary');
    expect(el.topToBottom).toBe(true);
    expect(el.shadowRoot!.querySelectorAll('[part="stop-label"]').length).toBeGreaterThan(0);
    const input = host.querySelector('#vol') as HTMLInputElement;
    expect(input.value).toBe('50');
    el.value = 100;
    await el.updateComplete;
    expect(input.value).toBe('100');
  });

  it('swaps inset icon-min at value min', async () => {
    host.innerHTML = `<k3-slider size="md" inset-icon value="0" min="0" max="100">
      <span slot="icon" id="ic-on">on</span>
      <span slot="icon-min" id="ic-off">off</span>
    </k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
      value: number;
    };
    await el.updateComplete;
    const faces = el.shadowRoot!.querySelectorAll('.inset-icon-face');
    expect(faces.length).toBe(2);
    expect((faces[0] as HTMLElement).hidden).toBe(true);
    expect((faces[1] as HTMLElement).hidden).toBe(false);
    el.value = 40;
    await el.updateComplete;
    expect((faces[0] as HTMLElement).hidden).toBe(false);
    expect((faces[1] as HTMLElement).hidden).toBe(true);
  });

  it('locks handle + gap press to shared CSS pad/hw vars (no DPR)', async () => {
    host.innerHTML = `<k3-slider value="40" min="0" max="100" size="xs"></k3-slider>`;
    const el = host.querySelector('k3-slider') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    await el.updateComplete;
    const active = el.shadowRoot!.querySelector('.seg.active') as HTMLElement;
    /* Rest pad = 4+2 = 6px · press pad = 2+1 = 3px — on host, shared clock. */
    expect(el.style.getPropertyValue('--k3-slider-pad-rest').trim()).toBe('6px');
    expect(el.style.getPropertyValue('--k3-slider-pad-press').trim()).toBe('3px');
    expect(el.style.getPropertyValue('--k3-slider-hw-rest').trim()).toBe('4px');
    expect(el.style.getPropertyValue('--k3-slider-hw-press').trim()).toBe('2px');
    expect(active.style.width).toContain('var(--k3-slider-pad)');
  });
});
