import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@k3ui/i18n/index.js';
import en from '../src/i18n/en.json';
import fr from '../src/i18n/fr.json';
import '../src/qr-generator.js';
import type {
  K3QrGenerator,
  QrGeneratorChangeDetail,
} from '../src/qr-generator.js';
import { QR_DESIGN_DEFAULTS } from '../src/qr-generator.specs.js';
import type { K3QrCode } from '@k3ui/components/media/qr-code.js';

const settle = async (el: K3QrGenerator): Promise<void> => {
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
};

describe('k3-qr-generator', () => {
  let el: K3QrGenerator;

  beforeAll(() => {
    i18n.extend({ en, fr });
    i18n.setLocale('en');
  });

  beforeEach(async () => {
    el = document.createElement('k3-qr-generator');
    document.body.appendChild(el);
    await settle(el);
  });

  afterEach(() => el.remove());

  const preview = (): K3QrCode => el.shadowRoot!.querySelector('.preview-code') as K3QrCode;

  it('registers with a region role and the nine qr.io types', () => {
    expect(customElements.get('k3-qr-generator')).toBeTruthy();
    expect(el.getAttribute('role')).toBe('region');
    const chips = el.shadowRoot!.querySelectorAll('k3-chip');
    expect(chips.length).toBe(9);
    expect(el.type).toBe('link');
    expect(el.payload).toBe('');
  });

  it('defines every child component it renders (standalone import)', () => {
    for (const tag of [
      'k3-qr-code',
      'k3-button',
      'k3-icon-button',
      'k3-button-segmented',
      'k3-select',
      'k3-menu-item',
      'k3-chip',
      'k3-chip-set',
      'k3-slider',
      'k3-switch',
      'k3-text-field',
      'k3-tabs',
    ]) {
      expect(customElements.get(tag), tag).toBeTruthy();
    }
  });

  it('restricts types with the `types` attribute', async () => {
    el.setAttribute('types', 'wifi,vcard');
    await settle(el);
    expect(el.shadowRoot!.querySelectorAll('k3-chip').length).toBe(2);
    expect(el.type).toBe('wifi');
  });

  it('feeds presets into the live preview', async () => {
    el.data = { link: { url: 'k3ui.dev' } };
    await settle(el);
    expect(el.payload).toBe('https://k3ui.dev');
    expect(preview().value).toBe('https://k3ui.dev');

    el.type = 'wifi';
    el.data = { wifi: { ssid: 'Maison', password: 's3cret' } };
    await settle(el);
    expect(el.payload).toBe('WIFI:T:WPA;S:Maison;P:s3cret;;');
    expect(preview().value).toBe(el.payload);
  });

  it('applies design presets to the preview', async () => {
    el.data = { link: { url: 'k3ui.dev' } };
    el.design = { dotStyle: 'dots', frame: 'pill', color: '#00639b', transparent: true };
    await settle(el);
    const qr = preview();
    expect(qr.dotStyle).toBe('dots');
    expect(qr.frame).toBe('pill');
    expect(qr.color).toBe('#00639b');
    expect(qr.background).toBe('transparent');
  });

  it('switches type from the chips and emits its own k3-change', async () => {
    const changes: QrGeneratorChangeDetail[] = [];
    el.addEventListener('k3-change', (e) => changes.push((e as CustomEvent<QrGeneratorChangeDetail>).detail));
    const smsChip = el.shadowRoot!.querySelector('k3-chip[value="sms"]') as HTMLElement & {
      selected: boolean;
    };
    smsChip.selected = true;
    smsChip.dispatchEvent(
      new CustomEvent('k3-change', { bubbles: true, composed: true, detail: { selected: true, value: 'sms' } }),
    );
    await settle(el);
    expect(el.type).toBe('sms');
    expect(changes.length).toBeGreaterThan(0);
    // Inner component events never leak: every detail is the generator's own shape
    for (const d of changes) {
      expect(d).toHaveProperty('type');
      expect(d).toHaveProperty('design');
    }
  });

  it('keeps inner k3-input / k3-change events inside the shadow root', async () => {
    const outer = vi.fn();
    el.addEventListener('k3-input', outer);
    const field = el.shadowRoot!.querySelector('k3-text-field')!;
    field.dispatchEvent(
      new CustomEvent('k3-input', { bubbles: true, composed: true, detail: { value: 'example.org' } }),
    );
    await settle(el);
    expect(outer).not.toHaveBeenCalled();
    expect(el.payload).toBe('https://example.org');
  });

  it('updates the payload when typing in the real text field', async () => {
    const field = el.shadowRoot!.querySelector('k3-text-field')!;
    await (field as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    const input = field.shadowRoot!.querySelector('input')!;
    input.value = 'github.com/Kam3leoN';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await settle(el);
    expect(el.payload).toBe('https://github.com/Kam3leoN');
    expect(preview().value).toBe('https://github.com/Kam3leoN');
  });

  it('raises error correction to H when a logo is picked', async () => {
    el.design = { ecc: 'M' };
    await settle(el);
    // Logo tab
    el.shadowRoot!.querySelector('k3-tabs')!.dispatchEvent(
      new CustomEvent('k3-change', { bubbles: true, composed: true, detail: { index: 2 } }),
    );
    await settle(el);
    const wifiTile = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.tiles--logos .tile')].find(
      (b) => b.getAttribute('aria-label') === 'Wi-Fi',
    )!;
    wifiTile.click();
    await settle(el);
    expect(el.currentDesign.logoIcon).toBe('wifi');
    expect(el.currentDesign.ecc).toBe('H');
    expect(el.shadowRoot!.textContent).toContain('Error correction switched to H');
  });

  it('renders accessible radio tiles in the Shape tab', async () => {
    el.shadowRoot!.querySelector('k3-tabs')!.dispatchEvent(
      new CustomEvent('k3-change', { bubbles: true, composed: true, detail: { index: 1 } }),
    );
    await settle(el);
    const group = el.shadowRoot!.querySelector('.tiles--dots')!;
    expect(group.getAttribute('role')).toBe('radiogroup');
    const tiles = group.querySelectorAll('[role="radio"]');
    expect(tiles.length).toBe(19);
    expect(el.shadowRoot!.querySelectorAll('.tiles--eye-frames [role="radio"]').length).toBe(12);
    expect(el.shadowRoot!.querySelectorAll('.tiles--eye-balls [role="radio"]').length).toBe(16);
    expect(group.querySelectorAll('[aria-checked="true"]').length).toBe(1);
    (tiles[3] as HTMLButtonElement).click();
    await settle(el);
    expect(el.currentDesign.dotStyle).toBe('diamond');
  });

  it('resets the design but keeps the content', async () => {
    el.data = { link: { url: 'k3ui.dev' } };
    el.design = { dotStyle: 'special-diamond', frame: 'box', color: '#b3261e' };
    await settle(el);
    el.resetDesign();
    await settle(el);
    expect(el.currentDesign).toEqual(QR_DESIGN_DEFAULTS);
    expect(el.payload).toBe('https://k3ui.dev');
  });

  it('hides download actions with no-download', async () => {
    expect(el.shadowRoot!.querySelector('.actions')).toBeTruthy();
    el.noDownload = true;
    await settle(el);
    expect(el.shadowRoot!.querySelector('.actions')).toBeNull();
  });

  it('warns about inverted or low-contrast colours', async () => {
    el.data = { link: { url: 'k3ui.dev' } };
    el.design = { color: '#ffffff', background: '#000000' };
    await settle(el);
    expect(el.shadowRoot!.querySelector('.warning')?.textContent).toContain('lighter than the background');
    el.design = { color: '#cccccc', background: '#ffffff' };
    await settle(el);
    expect(el.shadowRoot!.querySelector('.warning')?.textContent).toContain('Low contrast');
  });
});

describe('k3-select inside a Lit template', () => {
  it('shows the option label without Lit part markers', async () => {
    const gen = document.createElement('k3-qr-generator') as K3QrGenerator;
    gen.type = 'wifi';
    document.body.appendChild(gen);
    await settle(gen);
    const select = gen.shadowRoot!.querySelector('k3-select') as HTMLElement & {
      updateComplete: Promise<unknown>;
      syncSelection?: () => void;
    };
    await select.updateComplete;
    select.syncSelection?.();
    await select.updateComplete;
    const trigger = select.shadowRoot!.querySelector('k3-text-field') as HTMLElement & { value: string };
    expect(trigger.value).toBe('WPA / WPA2 / WPA3');
    gen.remove();
  });
});
