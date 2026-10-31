import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { init } from '../../src/index.js';
import type { K3QrCode } from '../../src/components/media/qr-code.js';
import {
  finderRotateTransform,
  parseQrFinderRotateMap,
} from '../../src/components/media/qr-code.finder-rotate.js';
import { resolveQrDotType } from '../../src/components/media/qr-code.specs.js';

describe('qr-code specs', () => {
  it('resolves dot types', () => {
    expect(resolveQrDotType('rounded')).toBe('rounded');
    expect(resolveQrDotType('nope')).toBe('rounded');
  });
});

describe('qr finder rotate', () => {
  it('defaults each corner to mirror', () => {
    expect(parseQrFinderRotateMap('')).toEqual({ tl: 'mirror', tr: 'mirror', bl: 'mirror' });
    expect(parseQrFinderRotateMap('mirror')).toEqual({
      tl: 'mirror',
      tr: 'mirror',
      bl: 'mirror',
    });
  });

  it('parses per-corner list', () => {
    expect(parseQrFinderRotateMap('none,90,flip-h')).toEqual({
      tl: 'none',
      tr: '90',
      bl: 'flip-h',
    });
  });

  it('maps mirror to BR-ref flips', () => {
    expect(finderRotateTransform('mirror', 'tl', 14)).toContain('scale(-1,-1)');
    expect(finderRotateTransform('mirror', 'tr', 14)).toContain('scale(1,-1)');
    expect(finderRotateTransform('mirror', 'bl', 14)).toContain('scale(-1,1)');
    expect(finderRotateTransform('none', 'tl', 14)).toBe('');
  });
});

describe('k3-qr-code', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    window.K3UI_MANUAL = true;
    await init({
      components: ['k3-qr-code'],
      theme: { mode: 'light' },
    });
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  async function mount(html: string): Promise<K3QrCode> {
    host.innerHTML = html;
    const el = host.querySelector('k3-qr-code') as K3QrCode;
    await el.updateComplete;
    /* Allow async rebuild (qr-code-styling append). */
    await new Promise((r) => setTimeout(r, 50));
    await el.updateComplete;
    return el;
  }

  it('renders an SVG for a value', async () => {
    const el = await mount(
      `<k3-qr-code value="https://example.com" size="120" dots="rounded"></k3-qr-code>`,
    );
    const frame = el.shadowRoot!.querySelector('.frame') as HTMLElement;
    expect(frame).toBeTruthy();
    expect(frame.querySelector('svg')).toBeTruthy();
  });

  it('shows placeholder when value is empty', async () => {
    const el = await mount(`<k3-qr-code value="" size="120"></k3-qr-code>`);
    const ph = el.shadowRoot!.querySelector('.placeholder');
    expect(ph).toBeTruthy();
  });

  it('updates when value changes', async () => {
    const el = await mount(`<k3-qr-code value="a" size="100"></k3-qr-code>`);
    const onReady = vi.fn();
    el.addEventListener('k3-ready', onReady as EventListener);
    el.value = 'https://k3ui.dev/updated';
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 50));
    expect(onReady).toHaveBeenCalled();
    expect(el.shadowRoot!.querySelector('svg')).toBeTruthy();
  });

  it('reflects style attributes', async () => {
    const el = await mount(
      `<k3-qr-code value="x" dots="classy" corners-square="dot" color="primary"></k3-qr-code>`,
    );
    expect(el.dots).toBe('classy');
    expect(el.cornersSquare).toBe('dot');
    expect(el.getAttribute('color')).toBe('primary');
  });

  it('renders pattern body / eye / ball as SVG', async () => {
    const el = await mount(
      `<k3-qr-code value="https://k3ui.dev" size="160" dots="diamond" corners-square="frame14" corners-dot="ball5"></k3-qr-code>`,
    );
    const svg = el.shadowRoot!.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg!.innerHTML.includes('polygon') || svg!.innerHTML.includes('path')).toBe(true);
  });
});
