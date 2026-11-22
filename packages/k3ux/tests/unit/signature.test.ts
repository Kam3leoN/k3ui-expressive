import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import type { K3Signature } from '../../src/components/inputs/signature.js';

function installCanvasMock(): void {
  const proto = HTMLCanvasElement.prototype;
  if ((proto as unknown as { __k3Mock?: boolean }).__k3Mock) return;
  Object.defineProperty(proto, '__k3Mock', { value: true });
  // jsdom has no 2d context — stub for SignaturePad.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (proto as any).getContext = vi.fn(() => ({
    scale: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: 'center',
    textBaseline: 'middle',
    lineWidth: 1,
    lineCap: 'round',
    lineJoin: 'round',
    globalCompositeOperation: 'source-over',
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (proto as any).toDataURL = vi.fn(() => 'data:image/png;base64,xx');
}

describe('k3-signature', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    installCanvasMock();
    window.K3UI_MANUAL = true;
    await init();
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  async function mount(html: string): Promise<K3Signature> {
    host.innerHTML = html;
    const el = host.querySelector('k3-signature') as K3Signature;
    await el.updateComplete;
    await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    await el.updateComplete;
    return el;
  }

  it('mounts empty with canvas', async () => {
    const el = await mount(`<k3-signature style="width:320px"></k3-signature>`);
    expect(el.isEmpty()).toBe(true);
    expect(el.shadowRoot?.querySelector('canvas')).toBeTruthy();
  });

  it('clear stays empty and emits', async () => {
    const el = await mount(`<k3-signature style="width:320px"></k3-signature>`);
    const onClear = vi.fn();
    const onChange = vi.fn();
    el.addEventListener('k3-clear', onClear as EventListener);
    el.addEventListener('k3-change', onChange as EventListener);
    el.clear();
    await el.updateComplete;
    expect(el.isEmpty()).toBe(true);
    expect(onClear).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });

  it('toData returns an array', async () => {
    const el = await mount(`<k3-signature style="width:320px"></k3-signature>`);
    expect(Array.isArray(el.toData())).toBe(true);
  });

  it('disabled keeps clear disabled when empty', async () => {
    const el = await mount(`<k3-signature disabled style="width:320px"></k3-signature>`);
    const btn = el.shadowRoot?.querySelector('.btn-clear') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('recovers canvas size after a zero-width first layout', async () => {
    const el = await mount(`<k3-signature></k3-signature>`);
    const canvas = el.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
    const surface = el.shadowRoot?.querySelector('.surface') as HTMLElement;

    /* Simulate a hidden first paint that baked style.width = 0px. */
    canvas.style.width = '0px';
    canvas.style.height = '160px';
    canvas.width = 0;
    canvas.height = 200;

    Object.defineProperty(surface, 'clientWidth', { configurable: true, get: () => 320 });
    Object.defineProperty(surface, 'clientHeight', { configurable: true, get: () => 160 });
    Object.defineProperty(canvas, 'clientWidth', { configurable: true, get: () => 320 });
    Object.defineProperty(canvas, 'clientHeight', { configurable: true, get: () => 160 });
    canvas.getBoundingClientRect = () =>
      ({
        width: 320,
        height: 160,
        top: 0,
        left: 0,
        right: 320,
        bottom: 160,
        x: 0,
        y: 0,
        toJSON() {
          return {};
        },
      }) as DOMRect;

    el.resize();
    expect(canvas.style.width).toBe('320px');
    expect(canvas.width).toBeGreaterThan(0);
  });

  it('applies initials and emits', async () => {
    const el = await mount(`<k3-signature style="width:320px"></k3-signature>`);
    const onInitials = vi.fn();
    el.addEventListener('k3-initials', onInitials as EventListener);
    el.applyInitials('jd');
    await el.updateComplete;
    expect(el.isEmpty()).toBe(false);
    expect(el.initials).toBe('JD');
    expect(onInitials).toHaveBeenCalled();
  });
});
