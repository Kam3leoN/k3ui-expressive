import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { styleMap } from 'lit/directives/style-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  K3Element,
  focusRingStyles,
  prefersReducedMotion,
  stateLayerStyles,
} from '@k3ui/core/index.js';
import { hostReset } from '@k3ui/components/_shared.js';
import { i18n } from '@k3ui/i18n/index.js';
import { showSnackbar } from '@k3ui/components/feedback/snackbar-queue.js';
import K3Button from '@k3ui/components/actions/button.js';
import K3IconButton from '@k3ui/components/actions/icon-button.js';
import '@k3ui/components/actions/button-segmented.js';
import K3Select from '@k3ui/components/inputs/select.js';
import K3Chip from '@k3ui/components/inputs/chip.js';
import K3ChipSet from '@k3ui/components/inputs/chip-set.js';
import K3Slider from '@k3ui/components/inputs/slider.js';
import K3Switch from '@k3ui/components/inputs/switch.js';
import K3TextField from '@k3ui/components/inputs/text-field.js';
import K3Tabs from '@k3ui/components/navigation/tabs.js';
import '@k3ui/components/media/qr-code.js';

/* Children that rely on the registry — define them so the generator also works standalone. */
for (const [tag, ctor] of [
  ['k3-button', K3Button],
  ['k3-icon-button', K3IconButton],
  ['k3-select', K3Select],
  ['k3-chip', K3Chip],
  ['k3-chip-set', K3ChipSet],
  ['k3-slider', K3Slider],
  ['k3-switch', K3Switch],
  ['k3-text-field', K3TextField],
  ['k3-tabs', K3Tabs],
] as const) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}
import type { K3QrCode, QrRenderDetail } from '@k3ui/components/media/qr-code.js';
import type { QrExportFormat } from '@k3ui/components/media/qr-code.specs.js';
import type { TextFieldType } from '@k3ui/components/inputs/field-types.js';
import { encodeQr, type QrEcc, type QrMatrix } from '@k3ui/components/media/qr-code.encoder.js';
import {
  QR_CONTENT_TYPES,
  buildQrPayload,
  emptyQrPayloads,
  validateQrPayload,
  type QrContentType,
  type QrFieldError,
  type QrFieldErrors,
  type QrPayloadMap,
  type QrWifiEncryption,
} from '@k3ui/components/media/qr-code.payload.js';
import {
  QR_DOT_STYLES,
  QR_EYE_BALL_STYLES,
  QR_EYE_FRAME_STYLES,
  QR_FRAME_FONTS,
  QR_FRAME_STYLES,
  QR_LOGO_ICONS,
  contrastRatio,
  relativeLuminance,
  renderDotSampleSvg,
  renderEyeBallSampleSvg,
  renderEyeFrameSampleSvg,
  renderQrSvg,
  type QrDotStyle,
  type QrEyeBallStyle,
  type QrEyeFrameStyle,
  type QrFrameStyle,
  type QrLogoIcon,
} from '@k3ui/components/media/qr-code.render.js';
import {
  QR_DESIGN_DEFAULTS,
  QR_LOGO_PRESETS,
  QR_SWATCHES,
  QR_TYPE_ICONS,
  QrGeneratorSpecs,
  type QrDesign,
} from './qr-generator.specs.js';
import { qrGeneratorStyles } from './qr-generator.styles.js';

export {
  QR_DESIGN_DEFAULTS,
  QR_LOGO_PRESETS,
  QR_SWATCHES,
  QR_TYPE_ICONS,
  QR_TYPE_LOGOS,
  QrGeneratorSpecs,
  type QrDesign,
} from './qr-generator.specs.js';
export {
  QR_CONTENT_TYPES,
  buildQrPayload,
  emptyQrPayloads,
  validateQrPayload,
  type QrContentType,
  type QrPayloadMap,
} from '@k3ui/components/media/qr-code.payload.js';

/** Partial preset per content type (`generator.data = { wifi: { ssid: 'Home' } }`). */
export type QrGeneratorData = { [K in QrContentType]?: Partial<QrPayloadMap[K]> };

/** Detail of the generator `k3-change` event. */
export interface QrGeneratorChangeDetail {
  type: QrContentType;
  /** String encoded in the code (`''` while required fields are missing). */
  payload: string;
  design: QrDesign;
}

/** Inner k3-* events stay inside the generator (its own `k3-change` is the API). */
const INTERNAL_EVENTS = [
  'k3-change',
  'k3-input',
  'k3-click',
  'k3-clear',
  'k3-render',
  'k3-error',
  'k3-copy',
  'k3-remove',
  'k3-password-toggle',
  'k3-change-start',
  'k3-change-end',
  'k3-open-start',
  'k3-open-end',
  'k3-close-start',
  'k3-close-end',
] as const;

const t = (key: string, fallback: string, vars?: Record<string, string | number>): string =>
  i18n.t(key, fallback, vars);

function icon(name: string, slot?: string): TemplateResult {
  return html`<span
    class="ms notranslate"
    slot=${slot ?? nothing}
    translate="no"
    lang="zxx"
    data-k3-icon=${name}
    aria-hidden="true"
  ></span>`;
}

/** `#abc` / `#aabbcc` / `#aabbccdd` → `#aabbcc` for `<input type=color>`. */
function toHex6(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{8}$/.test(v)) return v.slice(0, 7);
  if (/^#[0-9a-f]{3,4}$/.test(v)) return `#${[...v.slice(1, 4)].map((c) => c + c).join('')}`;
  return null;
}

let sampleMatrix: QrMatrix | null = null;
const artCache = new Map<string, string>();

function cachedArt(key: string, build: () => string): string {
  let svg = artCache.get(key);
  if (!svg) {
    svg = build();
    artCache.set(key, svg);
  }
  return svg;
}

/** Material Symbols `close` (24×24) — leading “none” tile for frame / logo (qr.io-style). */
const MS_CLOSE_PATH =
  'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';

function noneClearArt(): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">` +
    `<path fill="currentColor" d="${MS_CLOSE_PATH}"/></svg>`
  );
}

function frameArt(frame: QrFrameStyle): string {
  return cachedArt(`frame:${frame}`, () => {
    if (frame === 'none') return noneClearArt();
    sampleMatrix ??= encodeQr('K3', { ecc: 'L' });
    return renderQrSvg(sampleMatrix, {
      frame,
      framePlaceholder: true,
      color: 'currentColor',
      background: 'transparent',
      margin: 1,
      title: frame,
      idPrefix: `k3qgf-${frame}`,
    });
  });
}

function logoArt(iconName: QrLogoIcon | ''): string {
  return cachedArt(`logo:${iconName}`, () => {
    if (!iconName) return noneClearArt();
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${QR_LOGO_ICONS[iconName]}"/></svg>`;
  });
}

/** Read an image file as data URL, downscaling large rasters. */
async function readImage(file: File, maxPx: number): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
  if (/^data:image\/(svg\+xml|gif)/i.test(dataUrl)) return dataUrl;
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('decode failed'));
  });
  const scale = Math.min(1, maxPx / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  if (scale >= 1) return dataUrl;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

/** Keep only known design keys with plausible values. */
function sanitizeDesign(input: Partial<QrDesign>): Partial<QrDesign> {
  const out: Partial<QrDesign> = {};
  for (const key of Object.keys(QR_DESIGN_DEFAULTS) as Array<keyof QrDesign>) {
    const value = input[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== typeof QR_DESIGN_DEFAULTS[key]) continue;
    (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

interface FieldOptions {
  type?: TextFieldType;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  supporting?: string;
  autocomplete?: string;
  required?: boolean;
}

/**
 * Complete QR code generator modelled on qr.io:
 * **1 · Content** (link, text, e-mail, call, SMS, WhatsApp, Wi-Fi, vCard, event)
 * → **2 · Design** (frame, shape & colours, logo, settings)
 * → **3 · Download** (PNG / SVG / JPG / copy) with a live `k3-qr-code` preview.
 *
 * @fires k3-change — `{ type, payload, design }` on every edit
 * @fires k3-download — re-dispatched from the preview (cancelable, see `k3-qr-code`)
 *
 * @cssprop --k3-qr-generator-sticky-top — sticky offset of the preview pane (two-pane layout)
 */
export class K3QrGenerator extends K3Element {
  static override styles = [hostReset, stateLayerStyles, focusRingStyles, qrGeneratorStyles];

  /** Selected content type. */
  @property({ reflect: true }) type: QrContentType = QrGeneratorSpecs.defaultType;
  /** Comma-separated subset of types to offer (default: all nine). */
  @property() types = '';
  /** Preset content per type — merged into the form. */
  @property({ attribute: false }) data: QrGeneratorData = {};
  /** Preset design — merged into the Design step. */
  @property({ attribute: false }) design: Partial<QrDesign> = {};
  /** Download filename (extension added per format). */
  @property() filename = 'qr-code';
  /** Hide the download actions (host provides its own). */
  @property({ type: Boolean, attribute: 'no-download', reflect: true }) noDownload = false;

  @state() private payloads: QrPayloadMap = emptyQrPayloads();
  @state() private look: QrDesign = { ...QR_DESIGN_DEFAULTS };
  @state() private tab = 0;
  @state() private touched: ReadonlySet<string> = new Set();
  @state() private info: QrRenderDetail | null = null;
  @state() private overflow = false;
  @state() private eccRaised = false;
  @state() private logoError = '';
  @state() private peek = false;

  @query('.preview-code') private previewQr?: K3QrCode;
  @query('.file-input') private fileInput?: HTMLInputElement;
  @query('.stage') private stageEl?: HTMLElement;

  private errors: QrFieldErrors = {};
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private hostVisible = false;
  private stageVisible = true;
  private wide = false;

  /** The string currently encoded (`''` while required fields are missing). */
  get payload(): string {
    return buildQrPayload(this.type, this.payloads[this.type]);
  }

  /** Snapshot of the current design. */
  get currentDesign(): QrDesign {
    return { ...this.look };
  }

  /** Snapshot of the content of every type. */
  get currentData(): QrPayloadMap {
    return structuredCloneSafe(this.payloads);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', QrGeneratorSpecs.accessibility.role);
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', t('qrGenerator.ariaLabel', QrGeneratorSpecs.accessibility.ariaLabel));
    }
    if (this.hasUpdated) this.observeVisibility();
  }

  override disconnectedCallback(): void {
    this.io?.disconnect();
    this.io = undefined;
    this.ro?.disconnect();
    this.ro = undefined;
    super.disconnectedCallback();
  }

  override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('data') && this.data) this.applyData(this.data);
    if (changed.has('design') && this.design) {
      this.look = { ...this.look, ...sanitizeDesign(this.design) };
    }
    if (changed.has('types') || changed.has('type')) {
      const list = this.availableTypes();
      if (!list.includes(this.type)) this.type = list[0] ?? 'link';
    }
    this.errors = validateQrPayload(this.type, this.payloads[this.type]);
  }

  override firstUpdated(): void {
    this.observeVisibility();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    // Segmented buttons keep their own selection — resync after resets / presets
    this.renderRoot
      .querySelectorAll<HTMLElement & { getSelectedIndices?: () => number[]; setSelectedIndices?: (i: number[]) => void }>(
        'k3-button-segmented[data-index]',
      )
      .forEach((el) => {
        const want = Number(el.dataset.index);
        const current = el.getSelectedIndices?.() ?? [];
        if (want >= 0 && current[0] !== want) el.setSelectedIndices?.([want]);
      });
  }

  /* ── Public API ─────────────────────────────────────────────────────── */

  /** Download the preview (`png` · `svg` · `jpeg` · `webp`). */
  async download(format: QrExportFormat = 'png'): Promise<boolean> {
    const qr = this.previewQr;
    if (!qr || !this.payload) return false;
    return qr.download(format, { size: this.look.exportSize, filename: this.filename });
  }

  /** Copy the preview as a PNG image. */
  async copy(): Promise<boolean> {
    const qr = this.previewQr;
    const ok = qr ? await qr.copy('png') : false;
    void showSnackbar({
      message: ok
        ? t('qrGenerator.copied', 'Image copied')
        : t('qrGenerator.copyFailed', 'This browser blocked copying the image'),
    });
    return ok;
  }

  /** Back to the default design (content is kept). */
  resetDesign(): void {
    this.look = { ...QR_DESIGN_DEFAULTS };
    this.eccRaised = false;
    this.logoError = '';
    this.notify();
  }

  /* ── State helpers ──────────────────────────────────────────────────── */

  private availableTypes(): QrContentType[] {
    const wanted = this.types
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const list = wanted.length ? QR_CONTENT_TYPES.filter((tp) => wanted.includes(tp)) : [...QR_CONTENT_TYPES];
    return list.length ? list : [...QR_CONTENT_TYPES];
  }

  private applyData(data: QrGeneratorData): void {
    const next = { ...this.payloads } as Record<QrContentType, unknown>;
    for (const tp of QR_CONTENT_TYPES) {
      const patch = data[tp];
      if (patch) next[tp] = { ...this.payloads[tp], ...patch };
    }
    this.payloads = next as QrPayloadMap;
  }

  private setField<K extends QrContentType>(type: K, key: keyof QrPayloadMap[K] & string, value: unknown): void {
    const nextData = { ...this.payloads[type], [key]: value } as QrPayloadMap[K];
    this.payloads = { ...this.payloads, [type]: nextData } as QrPayloadMap;
    this.notify();
  }

  private touch(type: QrContentType, key: string): void {
    const id = `${type}.${key}`;
    if (this.touched.has(id)) return;
    const next = new Set(this.touched);
    next.add(id);
    this.touched = next;
  }

  private setLook<K extends keyof QrDesign>(key: K, value: QrDesign[K]): void {
    if (this.look[key] === value) return;
    this.look = { ...this.look, [key]: value };
    this.notify();
  }

  private setLogo(logo: string, logoIcon: QrLogoIcon | ''): void {
    const next: QrDesign = { ...this.look, logo, logoIcon };
    if ((logo || logoIcon) && (next.ecc === 'L' || next.ecc === 'M')) {
      next.ecc = QrGeneratorSpecs.logoEcc;
      this.eccRaised = true;
    }
    if (!logo && !logoIcon) this.eccRaised = false;
    this.look = next;
    this.notify();
  }

  private notify(): void {
    this.emit<QrGeneratorChangeDetail>('k3-change', {
      type: this.type,
      payload: this.payload,
      design: { ...this.look },
    });
  }

  private errorText(code: QrFieldError): string {
    switch (code) {
      case 'required':
        return t('qrGenerator.error.required', 'Required');
      case 'url':
        return t('qrGenerator.error.url', 'Enter a valid web address');
      case 'email':
        return t('qrGenerator.error.email', 'Enter a valid email address');
      case 'phone':
        return t('qrGenerator.error.phone', 'Enter a valid phone number');
      case 'date':
        return t('qrGenerator.error.date', 'Enter a valid date');
      case 'endBeforeStart':
        return t('qrGenerator.error.endBeforeStart', 'End must be after start');
      case 'name':
        return t('qrGenerator.error.name', 'Add a name or a company');
    }
  }

  /** Errors appear once a field was left, or as soon as typed text is malformed. */
  private fieldError(type: QrContentType, key: string): string {
    const code = this.errors[key];
    if (!code) return '';
    const value = (this.payloads[type] as unknown as Record<string, unknown>)[key];
    const typed = typeof value === 'string' && value.trim() !== '';
    const show = this.touched.has(`${type}.${key}`) || (typed && code !== 'required' && code !== 'name');
    return show ? this.errorText(code) : '';
  }

  /* ── Visual feedback ────────────────────────────────────────────────── */

  private observeVisibility(): void {
    if (typeof ResizeObserver !== 'undefined' && !this.ro) {
      this.ro = new ResizeObserver((entries) => this.applyLayout(entries[0]?.contentRect.width ?? 0));
      this.ro.observe(this);
    }
    this.applyLayout(this.getBoundingClientRect().width);
    if (typeof IntersectionObserver === 'undefined' || this.io) return;
    this.io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === this) this.hostVisible = entry.isIntersecting;
        else this.stageVisible = entry.isIntersecting;
      }
      this.updatePeek();
    });
    this.io.observe(this);
    if (this.stageEl) this.io.observe(this.stageEl);
  }

  /** compact · medium · wide — drives the CSS through `data-layout` (no container queries). */
  private applyLayout(width: number): void {
    if (!width) return;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const mode =
      width >= QrGeneratorSpecs.twoPaneMinRem * rem
        ? 'wide'
        : width >= QrGeneratorSpecs.rowsMinRem * rem
          ? 'medium'
          : 'compact';
    if (this.dataset.layout !== mode) this.dataset.layout = mode;
    this.wide = mode === 'wide';
    this.updatePeek();
  }

  private updatePeek(): void {
    const next = this.hostVisible && !this.stageVisible && !this.wide;
    if (next !== this.peek) this.peek = next;
  }

  private scrollToPreview = (): void => {
    this.stageEl?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'center',
    });
  };

  /* ── Event handlers ─────────────────────────────────────────────────── */

  private stopInternal = (e: Event): void => {
    if (e.target !== this) e.stopPropagation();
  };

  private onTypeChange = (e: CustomEvent<{ values?: string[] }>): void => {
    if (e.target !== e.currentTarget) return;
    const next = e.detail?.values?.[0] as QrContentType | undefined;
    if (!next || next === this.type || !QR_CONTENT_TYPES.includes(next)) return;
    this.type = next;
    this.touched = new Set();
    this.updateComplete.then(() => this.notify());
  };

  private onTab = (e: CustomEvent<{ index?: number }>): void => {
    if (e.target !== e.currentTarget || typeof e.detail?.index !== 'number') return;
    this.tab = e.detail.index;
  };

  private onRender = (e: CustomEvent<QrRenderDetail>): void => {
    this.info = e.detail;
    this.overflow = false;
  };

  private onOverflow = (): void => {
    this.info = null;
    this.overflow = true;
  };

  private onFile = async (e: Event): Promise<void> => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.logoError = t('qrGenerator.logo.invalid', 'This file is not an image');
      return;
    }
    if (file.size > QrGeneratorSpecs.logoMaxBytes) {
      this.logoError = t('qrGenerator.logo.tooLarge', 'Image too large (5 MB max)');
      return;
    }
    try {
      const url = await readImage(file, QrGeneratorSpecs.logoMaxPx);
      this.logoError = '';
      this.setLogo(url, '');
    } catch {
      this.logoError = t('qrGenerator.logo.invalid', 'This file is not an image');
    }
  };

  private onTilesKey<T extends string>(
    e: KeyboardEvent,
    values: readonly T[],
    current: T,
    pick: (value: T) => void,
  ): void {
    const keys = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const group = e.currentTarget as HTMLElement;
    const rtl = getComputedStyle(group).direction === 'rtl';
    let i = Math.max(0, values.indexOf(current));
    if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = values.length - 1;
    else {
      const forward =
        e.key === 'ArrowDown' || (e.key === 'ArrowRight' && !rtl) || (e.key === 'ArrowLeft' && rtl);
      i = (i + (forward ? 1 : -1) + values.length) % values.length;
    }
    pick(values[i]!);
    void this.updateComplete.then(() =>
      group.querySelector<HTMLElement>('[aria-checked="true"]')?.focus(),
    );
  }

  /* ── Building blocks ────────────────────────────────────────────────── */

  private stepHead(n: number, id: string, title: string): TemplateResult {
    return html`<div class="step-head">
      <span class="step-num" aria-hidden="true">${n}</span>
      <h3 class="step-title" id=${id}>${title}</h3>
    </div>`;
  }

  private textField<K extends QrContentType>(
    type: K,
    key: keyof QrPayloadMap[K] & string,
    label: string,
    opts: FieldOptions = {},
  ): TemplateResult {
    const value = String((this.payloads[type] as unknown as Record<string, unknown>)[key] ?? '');
    return html`<k3-text-field
      variant="outlined"
      label=${label}
      .value=${live(value)}
      type=${opts.type ?? 'text'}
      ?multiline=${!!opts.multiline}
      rows=${opts.rows ?? 3}
      max-length=${opts.maxLength ?? nothing}
      placeholder=${opts.placeholder ?? ''}
      supporting-text=${opts.supporting ?? ''}
      error=${this.fieldError(type, key)}
      autocomplete=${opts.autocomplete ?? 'off'}
      ?required=${!!opts.required}
      @k3-input=${(e: CustomEvent<{ value: string }>) => this.setField(type, key, e.detail?.value ?? '')}
      @k3-change=${() => this.touch(type, key)}
      @focusout=${() => this.touch(type, key)}
    ></k3-text-field>`;
  }

  private tiles<T extends string>(
    name: string,
    label: string,
    values: readonly T[],
    current: T,
    pick: (value: T) => void,
    art: (value: T) => string,
    title: (value: T) => string,
  ): TemplateResult {
    const id = `k3qg-${name}`;
    return html`<div class="control">
      <div class="control-head">
        <span class="control-label" id=${id}>${label}</span>
        <span class="control-value">${title(current)}</span>
      </div>
      <div
        class="tiles tiles--${name}"
        role="radiogroup"
        aria-labelledby=${id}
        @keydown=${(e: KeyboardEvent) => this.onTilesKey(e, values, current, pick)}
      >
        ${values.map(
          (value) => html`<button
            type="button"
            class="tile k3-state-layer k3-focus-ring"
            role="radio"
            aria-checked=${value === current ? 'true' : 'false'}
            tabindex=${value === current ? 0 : -1}
            title=${title(value)}
            aria-label=${title(value)}
            @click=${() => pick(value)}
          >
            <span class="tile-art" aria-hidden="true">${unsafeHTML(art(value))}</span>
          </button>`,
        )}
      </div>
    </div>`;
  }

  private colorField(
    label: string,
    value: string,
    pick: (value: string) => void,
    opts: { auto?: string; disabled?: boolean } = {},
  ): TemplateResult {
    const isAuto = opts.auto !== undefined && !value;
    const shown = isAuto ? opts.auto! : value;
    const hex = toHex6(shown) ?? '#000000';
    return html`<div class="color-field ${isAuto ? 'is-auto' : ''}" ?data-disabled=${!!opts.disabled}>
      <label class="color-main k3-state-layer">
        <span class="swatch" style=${styleMap({ '--swatch': hex })}>
          <input
            type="color"
            .value=${live(hex)}
            ?disabled=${!!opts.disabled}
            aria-label=${label}
            @input=${(e: Event) => pick((e.target as HTMLInputElement).value)}
          />
        </span>
        <span class="color-text">
          <span class="color-label">${label}</span>
          <span class="color-value">${isAuto ? t('qrGenerator.color.auto', 'Same as pattern') : hex.toUpperCase()}</span>
        </span>
      </label>
      ${opts.auto !== undefined && !isAuto
        ? html`<k3-icon-button
            variant="standard"
            size="sm"
            label=${t('qrGenerator.color.reset', 'Use the pattern colour')}
            @k3-click=${() => pick('')}
            >${icon('restart_alt')}</k3-icon-button
          >`
        : nothing}
    </div>`;
  }

  private sliderControl(
    label: string,
    valueText: string,
    value: number,
    range: { min: number; max: number; step: number },
    onValue: (value: number) => void,
  ): TemplateResult {
    const handler = (e: CustomEvent<{ value: number }>) => {
      const v = Number(e.detail?.value);
      if (Number.isFinite(v)) onValue(v);
    };
    return html`<div class="control">
      <div class="control-head">
        <span class="control-label">${label}</span>
        <span class="control-value">${valueText}</span>
      </div>
      <k3-slider
        .value=${value}
        min=${range.min}
        max=${range.max}
        step=${range.step}
        label=${label}
        @k3-input=${handler}
        @k3-change=${handler}
      ></k3-slider>
    </div>`;
  }

  private switchControl(label: string, selected: boolean, onToggle: (value: boolean) => void): TemplateResult {
    return html`<k3-switch
      class="switch"
      .selected=${selected}
      @k3-change=${(e: CustomEvent<{ selected: boolean }>) => onToggle(!!e.detail?.selected)}
      >${label}</k3-switch
    >`;
  }

  private segmented<T extends string>(
    label: string,
    values: readonly T[],
    labels: readonly string[],
    current: T,
    pick: (value: T) => void,
  ): TemplateResult {
    const index = Math.max(0, values.indexOf(current));
    const segments = values.map((value, i) => ({ label: labels[i] ?? value, value }));
    return html`<div class="control">
      <span class="control-label">${label}</span>
      <k3-button-segmented
        aria-label=${label}
        data-index=${index}
        .segments=${segments}
        .selectedIndices=${[index]}
        @k3-change=${(e: CustomEvent<{ indices?: number[] }>) => {
          const i = e.detail?.indices?.[0];
          if (typeof i === 'number' && values[i] !== undefined) pick(values[i]!);
        }}
      ></k3-button-segmented>
    </div>`;
  }

  /* ── Step 1 · Content ───────────────────────────────────────────────── */

  private typeLabel(type: QrContentType): string {
    const fallback: Record<QrContentType, string> = {
      link: 'Link',
      text: 'Text',
      email: 'Email',
      phone: 'Call',
      sms: 'SMS',
      whatsapp: 'WhatsApp',
      wifi: 'Wi-Fi',
      vcard: 'Contact card',
      event: 'Event',
    };
    return t(`qrGenerator.type.${type}`, fallback[type]);
  }

  private renderContentStep(): TemplateResult {
    const types = this.availableTypes();
    return html`<section class="step" aria-labelledby="k3qg-step-1">
      ${this.stepHead(1, 'k3qg-step-1', t('qrGenerator.step.content', 'Content'))}
      ${types.length > 1
        ? html`<k3-chip-set
            class="types"
            selection="single"
            label=${t('qrGenerator.types', 'QR code type')}
            @k3-change=${this.onTypeChange}
          >
            ${types.map(
              (tp) => html`<k3-chip variant="filter" value=${tp} .selected=${tp === this.type}>
                ${icon(QR_TYPE_ICONS[tp], 'icon')}${this.typeLabel(tp)}
              </k3-chip>`,
            )}
          </k3-chip-set>`
        : nothing}
      <div class="fields">${this.renderFields()}</div>
    </section>`;
  }

  private renderFields(): TemplateResult {
    const phoneHint = t('qrGenerator.field.phoneHint', 'International format, e.g. +33 6 12 34 56 78');
    switch (this.type) {
      case 'text':
        return this.textField('text', 'text', t('qrGenerator.field.text', 'Text'), {
          multiline: true,
          rows: 5,
          maxLength: QrGeneratorSpecs.textMaxLength,
          required: true,
        });

      case 'email':
        return html`${this.textField('email', 'to', t('qrGenerator.field.emailTo', 'Recipient'), {
            type: 'email',
            autocomplete: 'email',
            placeholder: t('qrGenerator.field.emailPlaceholder', 'name@example.com'),
            required: true,
          })}
          ${this.textField('email', 'subject', t('qrGenerator.field.subject', 'Subject'))}
          ${this.textField('email', 'body', t('qrGenerator.field.message', 'Message'), {
            multiline: true,
            rows: 4,
          })}`;

      case 'phone':
        return this.textField('phone', 'phone', t('qrGenerator.field.phone', 'Phone number'), {
          type: 'tel',
          autocomplete: 'tel',
          supporting: phoneHint,
          required: true,
        });

      case 'sms':
      case 'whatsapp': {
        const type = this.type;
        return html`${this.textField(type, 'phone', t('qrGenerator.field.phone', 'Phone number'), {
            type: 'tel',
            autocomplete: 'tel',
            supporting: phoneHint,
            required: true,
          })}
          ${this.textField(type, 'message', t('qrGenerator.field.message', 'Message'), {
            multiline: true,
            rows: 3,
            maxLength: type === 'sms' ? QrGeneratorSpecs.smsMaxLength : undefined,
          })}`;
      }

      case 'wifi': {
        const d = this.payloads.wifi;
        const options: Array<[QrWifiEncryption, string]> = [
          ['WPA', 'WPA / WPA2 / WPA3'],
          ['WEP', 'WEP'],
          ['nopass', t('qrGenerator.wifi.nopass', 'None (open network)')],
        ];
        return html`${this.textField('wifi', 'ssid', t('qrGenerator.field.ssid', 'Network name (SSID)'), {
            required: true,
          })}
          <div class="row">
            <k3-select
              variant="outlined"
              label=${t('qrGenerator.field.security', 'Security')}
              .value=${d.encryption}
              @k3-change=${(e: CustomEvent<{ value?: string }>) => {
                const v = e.detail?.value as QrWifiEncryption | undefined;
                if (v === 'WPA' || v === 'WEP' || v === 'nopass') this.setField('wifi', 'encryption', v);
              }}
            >
              ${options.map(([v, label]) => html`<k3-menu-item value=${v}>${label}</k3-menu-item>`)}
            </k3-select>
            ${d.encryption !== 'nopass'
              ? this.textField('wifi', 'password', t('qrGenerator.field.password', 'Password'), {
                  type: 'password',
                  autocomplete: 'off',
                  required: true,
                })
              : nothing}
          </div>
          ${this.switchControl(t('qrGenerator.field.hidden', 'Hidden network'), d.hidden, (v) =>
            this.setField('wifi', 'hidden', v),
          )}`;
      }

      case 'vcard':
        return html`<div class="row">
            ${this.textField('vcard', 'firstName', t('qrGenerator.field.firstName', 'First name'), {
              autocomplete: 'given-name',
            })}
            ${this.textField('vcard', 'lastName', t('qrGenerator.field.lastName', 'Last name'), {
              autocomplete: 'family-name',
            })}
          </div>
          <div class="group">
            <h4 class="group-title">${t('qrGenerator.group.contact', 'Contact details')}</h4>
            <div class="row">
              ${this.textField('vcard', 'phone', t('qrGenerator.field.phoneWork', 'Phone'), { type: 'tel' })}
              ${this.textField('vcard', 'mobile', t('qrGenerator.field.mobile', 'Mobile'), { type: 'tel' })}
            </div>
            <div class="row">
              ${this.textField('vcard', 'email', t('qrGenerator.field.email', 'Email'), { type: 'email' })}
              ${this.textField('vcard', 'website', t('qrGenerator.field.website', 'Website'), { type: 'url' })}
            </div>
          </div>
          <div class="group">
            <h4 class="group-title">${t('qrGenerator.group.company', 'Company')}</h4>
            <div class="row">
              ${this.textField('vcard', 'company', t('qrGenerator.field.company', 'Company'), {
                autocomplete: 'organization',
              })}
              ${this.textField('vcard', 'jobTitle', t('qrGenerator.field.jobTitle', 'Job title'), {
                autocomplete: 'organization-title',
              })}
            </div>
          </div>
          <div class="group">
            <h4 class="group-title">${t('qrGenerator.group.address', 'Address')}</h4>
            ${this.textField('vcard', 'street', t('qrGenerator.field.street', 'Street'), {
              autocomplete: 'street-address',
            })}
            <div class="row">
              ${this.textField('vcard', 'zip', t('qrGenerator.field.zip', 'Postcode'), {
                autocomplete: 'postal-code',
              })}
              ${this.textField('vcard', 'city', t('qrGenerator.field.city', 'City'), {
                autocomplete: 'address-level2',
              })}
            </div>
            ${this.textField('vcard', 'country', t('qrGenerator.field.country', 'Country'), {
              autocomplete: 'country-name',
            })}
          </div>`;

      case 'event': {
        const d = this.payloads.event;
        const kind: TextFieldType = d.allDay ? 'date' : 'datetime-local';
        const toggleAllDay = (allDay: boolean) => {
          const convert = (v: string, hour: string) =>
            !v ? '' : allDay ? v.slice(0, 10) : `${v.slice(0, 10)}T${hour}`;
          this.payloads = {
            ...this.payloads,
            event: { ...d, allDay, start: convert(d.start, '09:00'), end: convert(d.end, '10:00') },
          };
          this.notify();
        };
        return html`${this.textField('event', 'title', t('qrGenerator.field.eventTitle', 'Event title'), {
            required: true,
          })}
          ${this.textField('event', 'location', t('qrGenerator.field.location', 'Location'))}
          ${this.switchControl(t('qrGenerator.field.allDay', 'All day'), d.allDay, toggleAllDay)}
          <div class="row">
            ${this.textField('event', 'start', t('qrGenerator.field.start', 'Starts'), {
              type: kind,
              required: true,
            })}
            ${this.textField('event', 'end', t('qrGenerator.field.end', 'Ends'), { type: kind })}
          </div>
          ${this.textField('event', 'description', t('qrGenerator.field.description', 'Description'), {
            multiline: true,
            rows: 3,
          })}`;
      }

      case 'link':
      default:
        return this.textField('link', 'url', t('qrGenerator.field.url', 'Website address'), {
          type: 'url',
          autocomplete: 'url',
          placeholder: 'https://',
          required: true,
        });
    }
  }

  /* ── Step 2 · Design ────────────────────────────────────────────────── */

  private renderDesignStep(): TemplateResult {
    const tabs = [
      t('qrGenerator.tab.frame', 'Frame'),
      t('qrGenerator.tab.shape', 'Shape'),
      t('qrGenerator.tab.logo', 'Logo'),
      t('qrGenerator.tab.settings', 'Settings'),
    ];
    const panels = [
      () => this.renderFramePanel(),
      () => this.renderShapePanel(),
      () => this.renderLogoPanel(),
      () => this.renderSettingsPanel(),
    ];
    const index = Math.min(this.tab, panels.length - 1);
    return html`<section class="step" aria-labelledby="k3qg-step-2">
      ${this.stepHead(2, 'k3qg-step-2', t('qrGenerator.step.design', 'Design'))}
      <k3-tabs
        class="design-tabs"
        variant="secondary"
        labels=${tabs.join(',')}
        .index=${index}
        @k3-change=${this.onTab}
      ></k3-tabs>
      <div class="panel" role="tabpanel" aria-label=${tabs[index]!}>${panels[index]!()}</div>
    </section>`;
  }

  private frameLabel(frame: QrFrameStyle): string {
    const fallback: Record<QrFrameStyle, string> = {
      none: 'No frame',
      box: 'Banner below',
      'box-top': 'Banner above',
      bubble: 'Speech bubble',
      pill: 'Badge',
      corners: 'Viewfinder',
      clipboard: 'Clipboard',
      bag: 'Shopping bag',
      phone: 'Phone',
      circle: 'Circle',
      banner: 'Banner',
    };
    return t(`qrGenerator.frame.${frame}`, fallback[frame]);
  }

  private renderFramePanel(): TemplateResult {
    const L = this.look;
    const fonts = QR_FRAME_FONTS.map((f) =>
      t(`qrGenerator.font.${f}`, f === 'sans' ? 'Sans serif' : f === 'serif' ? 'Serif' : 'Monospace'),
    );
    return html`${this.tiles(
        'frames',
        t('qrGenerator.frame.style', 'Frame'),
        QR_FRAME_STYLES,
        L.frame,
        (v) => this.setLook('frame', v),
        frameArt,
        (v) => this.frameLabel(v),
      )}
      ${L.frame !== 'none'
        ? html`<k3-text-field
              variant="outlined"
              label=${t('qrGenerator.frame.text', 'Frame phrase')}
              .value=${live(L.frameText)}
              placeholder=${t('qrCode.frameText', 'Scan me')}
              max-length=${QrGeneratorSpecs.frameTextMaxLength}
              @k3-input=${(e: CustomEvent<{ value: string }>) => this.setLook('frameText', e.detail?.value ?? '')}
            ></k3-text-field>
            ${this.segmented(
              t('qrGenerator.frame.font', 'Phrase font'),
              QR_FRAME_FONTS,
              fonts,
              L.frameFont,
              (v) => this.setLook('frameFont', v),
            )}
            <div class="colors">
              ${this.colorField(
                t('qrGenerator.frame.color', 'Frame colour'),
                L.frameColor,
                (v) => this.setLook('frameColor', v),
                { auto: L.color },
              )}
            </div>`
        : nothing}`;
  }

  private humanizeStyle(style: string): string {
    return style
      .replace(/special-circle-orizz/g, 'special-circle-horiz')
      .split(/[-_]/)
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ');
  }

  private dotLabel(style: QrDotStyle): string {
    return t(`qrGenerator.dot.${style}`, this.humanizeStyle(style));
  }

  private eyeLabel(style: QrEyeFrameStyle | QrEyeBallStyle): string {
    return t(`qrGenerator.eye.${style}`, this.humanizeStyle(style));
  }

  private renderShapePanel(): TemplateResult {
    const L = this.look;
    const gradientOn = L.gradient !== 'none';
    return html`${this.tiles(
        'dots',
        t('qrGenerator.shape.dots', 'Pattern'),
        QR_DOT_STYLES,
        L.dotStyle,
        (v) => this.setLook('dotStyle', v),
        (v) => cachedArt(`dot:${v}`, () => renderDotSampleSvg(v)),
        (v) => this.dotLabel(v),
      )}
      <div class="control">
        <span class="control-label">${t('qrGenerator.shape.color', 'Pattern colour')}</span>
        <div class="swatches" role="group" aria-label=${t('qrGenerator.shape.swatches', 'Suggested colours')}>
          ${QR_SWATCHES.map(
            (c) => html`<button
              type="button"
              class="swatch-btn k3-focus-ring"
              style=${styleMap({ '--swatch': c })}
              aria-label=${c.toUpperCase()}
              aria-pressed=${L.color.toLowerCase() === c ? 'true' : 'false'}
              @click=${() => this.setLook('color', c)}
            ></button>`,
          )}
        </div>
        <div class="colors">
          ${this.colorField(t('qrGenerator.shape.color', 'Pattern colour'), L.color, (v) =>
            this.setLook('color', v),
          )}
          ${gradientOn
            ? this.colorField(t('qrGenerator.shape.gradientColor', 'Second colour'), L.gradientColor, (v) =>
                this.setLook('gradientColor', v),
              )
            : nothing}
        </div>
        ${this.switchControl(t('qrGenerator.shape.gradient', 'Gradient'), gradientOn, (on) =>
          this.setLook('gradient', on ? 'linear' : 'none'),
        )}
      </div>
      ${gradientOn
        ? html`${this.segmented(
            t('qrGenerator.shape.gradientType', 'Gradient type'),
            ['linear', 'radial'] as const,
            [t('qrGenerator.gradient.linear', 'Linear'), t('qrGenerator.gradient.radial', 'Radial')],
            L.gradient === 'radial' ? 'radial' : 'linear',
            (v) => this.setLook('gradient', v),
          )}
          ${L.gradient === 'linear'
            ? this.sliderControl(
                t('qrGenerator.shape.angle', 'Angle'),
                `${L.gradientRotation}°`,
                L.gradientRotation,
                { min: 0, max: 345, step: 15 },
                (v) => this.setLook('gradientRotation', v),
              )
            : nothing}`
        : nothing}
      <div class="control">
        <span class="control-label">${t('qrGenerator.shape.background', 'Background')}</span>
        <div class="colors">
          ${this.colorField(
            t('qrGenerator.shape.background', 'Background'),
            L.background,
            (v) => this.setLook('background', v),
            { disabled: L.transparent },
          )}
        </div>
        ${this.switchControl(t('qrGenerator.shape.transparent', 'Transparent background'), L.transparent, (v) =>
          this.setLook('transparent', v),
        )}
      </div>
      ${L.frame === 'none' && !L.transparent
        ? this.sliderControl(
            t('qrGenerator.shape.radius', 'Rounded corners'),
            String(L.radius),
            L.radius,
            QrGeneratorSpecs.radius,
            (v) => this.setLook('radius', v),
          )
        : nothing}
      ${this.tiles(
        'eye-frames',
        t('qrGenerator.shape.eyeFrame', 'Eye frame'),
        QR_EYE_FRAME_STYLES,
        L.eyeFrameStyle,
        (v) => this.setLook('eyeFrameStyle', v),
        (v) => cachedArt(`eye-frame:${v}`, () => renderEyeFrameSampleSvg(v)),
        (v) => this.eyeLabel(v),
      )}
      ${this.tiles(
        'eye-balls',
        t('qrGenerator.shape.eyeBall', 'Eye centre'),
        QR_EYE_BALL_STYLES,
        L.eyeBallStyle,
        (v) => this.setLook('eyeBallStyle', v),
        (v) => cachedArt(`eye-ball:${v}`, () => renderEyeBallSampleSvg(v)),
        (v) => this.eyeLabel(v),
      )}
      <div class="colors">
        ${this.colorField(
          t('qrGenerator.shape.eyeFrameColor', 'Eye frame colour'),
          L.eyeFrameColor,
          (v) => this.setLook('eyeFrameColor', v),
          { auto: L.color },
        )}
        ${this.colorField(
          t('qrGenerator.shape.eyeBallColor', 'Eye centre colour'),
          L.eyeBallColor,
          (v) => this.setLook('eyeBallColor', v),
          { auto: L.color },
        )}
      </div>`;
  }

  private renderLogoPanel(): TemplateResult {
    const L = this.look;
    const hasLogo = !!(L.logo || L.logoIcon);
    const presets: Array<QrLogoIcon | ''> = ['', ...QR_LOGO_PRESETS];
    const iconLabel = (v: QrLogoIcon | ''): string =>
      v ? t(`qrGenerator.logo.icon.${v}`, v) : t('qrGenerator.logo.none', 'No logo');
    return html`<div class="control">
        <span class="control-label">${t('qrGenerator.logo.image', 'Your image')}</span>
        <div class="logo-actions">
          ${L.logo ? html`<img class="logo-thumb" src=${L.logo} alt="" />` : nothing}
          <k3-button variant="tonal" @k3-click=${() => this.fileInput?.click()}>
            ${icon('upload', 'icon')}${t('qrGenerator.logo.upload', 'Upload an image')}
          </k3-button>
          ${L.logo
            ? html`<k3-button variant="text" @k3-click=${() => this.setLogo('', '')}>
                ${t('qrGenerator.logo.remove', 'Remove')}
              </k3-button>`
            : nothing}
          <input
            class="file-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            tabindex="-1"
            aria-hidden="true"
            @change=${this.onFile}
          />
        </div>
        ${this.logoError ? html`<p class="hint hint--error" role="alert">${this.logoError}</p>` : nothing}
      </div>
      ${this.tiles(
        'logos',
        t('qrGenerator.logo.presets', 'Or pick an icon'),
        presets,
        L.logo ? ('' as const) : L.logoIcon,
        (v) => this.setLogo('', v),
        logoArt,
        iconLabel,
      )}
      ${hasLogo
        ? html`${this.sliderControl(
            t('qrGenerator.logo.size', 'Logo size'),
            `${Math.round(L.logoSize * 100)} %`,
            Math.round(L.logoSize * 100),
            {
              min: QrGeneratorSpecs.logoSize.min * 100,
              max: QrGeneratorSpecs.logoSize.max * 100,
              step: QrGeneratorSpecs.logoSize.step * 100,
            },
            (v) => this.setLook('logoSize', v / 100),
          )}
          ${this.sliderControl(
            t('qrGenerator.logo.margin', 'Space around the logo'),
            String(L.logoMargin),
            L.logoMargin,
            QrGeneratorSpecs.logoMargin,
            (v) => this.setLook('logoMargin', v),
          )}
          ${this.switchControl(t('qrGenerator.logo.hideDots', 'Clear the pattern behind the logo'), !L.logoKeepDots, (v) =>
            this.setLook('logoKeepDots', !v),
          )}
          ${this.eccRaised
            ? html`<p class="hint">${t('qrGenerator.logo.eccNote', 'Error correction switched to H so the code stays readable.')}</p>`
            : nothing}`
        : nothing}`;
  }

  private renderSettingsPanel(): TemplateResult {
    const L = this.look;
    const levels = QrGeneratorSpecs.eccLevels;
    return html`${this.segmented(
        t('qrGenerator.settings.ecc', 'Error correction'),
        levels,
        levels.map((l) => `${l} · ${QrGeneratorSpecs.eccRecovery[l]} %`),
        L.ecc,
        (v) => {
          this.eccRaised = false;
          this.setLook('ecc', v as QrEcc);
        },
      )}
      <p class="hint">
        ${t(
          'qrGenerator.settings.eccHint',
          'Higher levels survive dirt and logos, but make the code denser.',
        )}
      </p>
      ${this.sliderControl(
        t('qrGenerator.settings.margin', 'Quiet zone'),
        String(L.margin),
        L.margin,
        QrGeneratorSpecs.margin,
        (v) => this.setLook('margin', v),
      )}
      ${this.sliderControl(
        t('qrGenerator.settings.exportSize', 'Export size'),
        `${L.exportSize} px`,
        L.exportSize,
        QrGeneratorSpecs.exportSize,
        (v) => this.setLook('exportSize', v),
      )}
      <div>
        <k3-button variant="text" @k3-click=${() => this.resetDesign()}>
          ${icon('restart_alt', 'icon')}${t('qrGenerator.reset', 'Reset design')}
        </k3-button>
      </div>`;
  }

  /* ── Step 3 · Preview & download ────────────────────────────────────── */

  private qrTemplate(payload: string, className: string, main: boolean): TemplateResult {
    const L = this.look;
    return html`<k3-qr-code
      class=${className}
      ?fluid=${main}
      size=${main ? 'md' : 'xs'}
      .value=${payload}
      .ecc=${L.ecc}
      .margin=${L.margin}
      .dotStyle=${L.dotStyle}
      .eyeFrameStyle=${L.eyeFrameStyle}
      .eyeBallStyle=${L.eyeBallStyle}
      .color=${L.color}
      .gradient=${L.gradient}
      .gradientColor=${L.gradientColor}
      .gradientRotation=${L.gradientRotation}
      .eyeFrameColor=${L.eyeFrameColor}
      .eyeBallColor=${L.eyeBallColor}
      .background=${L.transparent ? 'transparent' : L.background}
      .radius=${L.radius}
      .logo=${L.logo}
      .logoIcon=${L.logo ? '' : L.logoIcon}
      .logoSize=${L.logoSize}
      .logoMargin=${L.logoMargin}
      .logoKeepDots=${L.logoKeepDots}
      .frame=${L.frame}
      .frameText=${L.frameText}
      .frameColor=${L.frameColor}
      .frameFont=${L.frameFont}
      .exportSize=${L.exportSize}
      .filename=${this.filename}
      @k3-render=${main ? this.onRender : nothing}
      @k3-error=${main ? this.onOverflow : nothing}
    ></k3-qr-code>`;
  }

  private metaText(payload: string): string {
    if (this.overflow) return t('qrCode.overflow', 'Too much content for one QR code');
    if (!payload || !this.info) {
      return t('qrGenerator.empty', 'Fill in the content to see your code');
    }
    return t('qrGenerator.info', 'Version {version} · {modules} × {modules} modules · level {ecc}', {
      version: this.info.version,
      modules: this.info.modules,
      ecc: this.info.ecc,
    });
  }

  private renderWarning(): TemplateResult | typeof nothing {
    const L = this.look;
    const bg = L.transparent ? '#ffffff' : L.background;
    const inks = [L.color, L.gradient !== 'none' ? L.gradientColor : '', L.eyeFrameColor, L.eyeBallColor].filter(
      Boolean,
    );
    const bgLum = relativeLuminance(bg);
    const inverted = !L.transparent && bgLum != null && inks.some((c) => (relativeLuminance(c) ?? 0) > bgLum);
    const low = inks.some((c) => (contrastRatio(c, bg) ?? 21) < QrGeneratorSpecs.minContrast);
    if (!inverted && !low) return nothing;
    const text = inverted
      ? t('qrGenerator.warn.inverted', 'The pattern is lighter than the background: some readers cannot scan inverted codes.')
      : t('qrGenerator.warn.contrast', 'Low contrast: some phones may not read this code.');
    return html`<p class="warning" role="status">${icon('warning')}<span>${text}</span></p>`;
  }

  private renderPreview(payload: string): TemplateResult {
    const ready = !!payload && !this.overflow;
    return html`<section class="preview" aria-labelledby="k3qg-step-3">
      ${this.stepHead(3, 'k3qg-step-3', t('qrGenerator.step.download', 'Download'))}
      <div class="stage">
        <div class="stage-code">${this.qrTemplate(payload, 'preview-code', true)}</div>
      </div>
      <p class="meta" aria-live="polite">${this.metaText(payload)}</p>
      ${this.renderWarning()}
      ${this.noDownload
        ? nothing
        : html`<div class="actions">
            <k3-button class="primary" variant="filled" ?disabled=${!ready} @k3-click=${() => this.download('png')}>
              ${icon('download', 'icon')}${t('qrGenerator.download.png', 'Download PNG')}
            </k3-button>
            <div class="secondary">
              <k3-button variant="tonal" ?disabled=${!ready} @k3-click=${() => this.download('svg')}>SVG</k3-button>
              <k3-button variant="tonal" ?disabled=${!ready} @k3-click=${() => this.download('jpeg')}>JPG</k3-button>
              <k3-icon-button
                variant="tonal"
                label=${t('qrGenerator.copy', 'Copy image')}
                ?disabled=${!ready}
                @k3-click=${() => this.copy()}
                >${icon('content_copy')}</k3-icon-button
              >
            </div>
          </div>`}
    </section>`;
  }

  private renderPeek(payload: string): TemplateResult {
    const show = this.peek && !!payload;
    return html`<button
      type="button"
      class="peek k3-state-layer k3-focus-ring"
      ?data-show=${show}
      tabindex=${show ? 0 : -1}
      aria-hidden=${show ? 'false' : 'true'}
      aria-label=${t('qrGenerator.peek', 'Show the preview')}
      @click=${this.scrollToPreview}
    >
      ${this.qrTemplate(payload, 'peek-code', false)}
    </button>`;
  }

  override render() {
    const payload = this.payload;
    const stop = this.stopInternal;
    return html`<div
      class="layout"
      @k3-change=${stop}
      @k3-input=${stop}
      @k3-click=${stop}
      @k3-clear=${stop}
      @k3-render=${stop}
      @k3-error=${stop}
      @k3-copy=${stop}
      @k3-remove=${stop}
      @k3-password-toggle=${stop}
      @k3-change-start=${stop}
      @k3-change-end=${stop}
      @k3-open-start=${stop}
      @k3-open-end=${stop}
      @k3-close-start=${stop}
      @k3-close-end=${stop}
    >
      <div class="editor">${this.renderContentStep()}${this.renderDesignStep()}</div>
      ${this.renderPreview(payload)} ${this.renderPeek(payload)}
    </div>`;
  }
}

function structuredCloneSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Internal event names kept inside the generator (exposed for tests). */
export const QR_GENERATOR_INTERNAL_EVENTS: readonly string[] = INTERNAL_EVENTS;

export default K3QrGenerator;

if (!customElements.get('k3-qr-generator')) {
  customElements.define('k3-qr-generator', K3QrGenerator);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-qr-generator': K3QrGenerator;
  }
}
