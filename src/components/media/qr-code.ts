import { html, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import QRCodeStyling from 'qr-code-styling';
import type { Options as QrStylingOptions } from 'qr-code-styling';
import { K3Element } from '../../core/index.js';
import { i18n } from '../../i18n/index.js';
import { hostReset } from '../_shared.js';
import {
  isPatternBall,
  isPatternBody,
  isPatternEye,
  QrCodeSpecs,
  resolveQrCornerDot,
  resolveQrCornerSquare,
  resolveQrDotType,
  resolveQrDrawType,
  resolveQrErrorCorrection,
  resolveQrShape,
  usesPatternRenderer,
  type QrColorRole,
  type QrCornerDotType,
  type QrCornerSquareType,
  type QrDotType,
  type QrDrawType,
  type QrErrorCorrection,
  type QrShape,
} from './qr-code.specs.js';
import {
  parseQrFinderRotateMap,
  QR_FINDER_ROTATE_DEFAULT,
} from './qr-code.finder-rotate.js';
import { mountPatternQr, renderPatternQrSvg } from './qr-code.render-pattern.js';
import { qrCodeStyles } from './qr-code.styles.js';

export type {
  QrColorRole,
  QrCornerDotType,
  QrCornerSquareType,
  QrDotType,
  QrDrawType,
  QrErrorCorrection,
  QrShape,
  QrBallStyle,
  QrBodyStyle,
  QrEyeStyle,
} from './qr-code.specs.js';
export type { QrFinderCorner, QrFinderRotate, QrFinderRotateMap } from './qr-code.finder-rotate.js';
export {
  QrCodeSpecs,
  QR_DOT_TYPES,
  QR_CORNER_SQUARE_TYPES,
  QR_CORNER_DOT_TYPES,
  QR_BODY_IDS,
  QR_EYE_IDS,
  QR_BALL_IDS,
  resolveQrDotType,
  resolveQrCornerSquare,
  resolveQrCornerDot,
} from './qr-code.specs.js';
export {
  QR_FINDER_CORNERS,
  QR_FINDER_ROTATE_DEFAULT,
  QR_FINDER_ROTATE_IDS,
  parseQrFinderRotateMap,
  resolveQrFinderRotate,
} from './qr-code.finder-rotate.js';
export { QR_EYES, QR_BALLS } from './qr-code.patterns.js';

/**
 * Styled QR code — [`qr-code-styling`](https://qr-code-styling.com) + hardcoded
 * body / eye-frame / eye-ball SVG patterns.
 *
 * @example
 * ```html
 * <k3-qr-code value="https://example.com" dots="diamond" corners-square="frame14" corners-dot="ball5" corners-square-rotate="mirror"></k3-qr-code>
 * ```
 *
 * @fires k3-ready - after a successful render `{ value }`
 * @fires k3-error - when encoding fails `{ error }`
 */
export class K3QrCode extends K3Element {
  static override styles = [hostReset, qrCodeStyles];

  /** Payload encoded in the QR (URL, text, …). */
  @property() value = QrCodeSpecs.defaultValue;

  /** Outer size in CSS pixels (width = height). */
  @property({ type: Number, reflect: true }) size = QrCodeSpecs.defaultSize;

  /** Quiet-zone margin around the modules. */
  @property({ type: Number }) margin = QrCodeSpecs.defaultMargin;

  /** Module (dot) style from qr-code-styling. */
  @property({ reflect: true }) dots: QrDotType = QrCodeSpecs.defaultDots;

  /** Finder pattern outer square style. */
  @property({ attribute: 'corners-square', reflect: true })
  cornersSquare: QrCornerSquareType = QrCodeSpecs.defaultCornersSquare;

  /** Finder pattern inner dot style. */
  @property({ attribute: 'corners-dot', reflect: true })
  cornersDot: QrCornerDotType = QrCodeSpecs.defaultCornersDot;

  /**
   * Per-corner eye-frame orientation: `mirror` (default) | `none` | `90` | `180` |
   * `270` | `flip-h` | `flip-v` | `flip-both`.
   * One value for all, or `tl,tr,bl` / space-separated.
   */
  @property({ attribute: 'corners-square-rotate', reflect: true })
  cornersSquareRotate = 'mirror';

  /**
   * Per-corner eye-ball orientation (same tokens as `corners-square-rotate`).
   * Empty / unset → inherits frame rotate.
   */
  @property({ attribute: 'corners-dot-rotate', reflect: true })
  cornersDotRotate = '';

  /** QR outline shape — square or decorative circle. */
  @property({ reflect: true }) shape: QrShape = QrCodeSpecs.defaultShape;

  /** Render backend. */
  @property({ reflect: true }) type: QrDrawType = QrCodeSpecs.defaultType;

  /** Error correction level. */
  @property({ attribute: 'error-correction', reflect: true })
  errorCorrection: QrErrorCorrection = QrCodeSpecs.defaultErrorCorrection;

  /**
   * Theme color role for dots + corners.
   * Overridden by `dots-color` / corner color attrs when set.
   */
  @property({ reflect: true }) color: QrColorRole | string = QrCodeSpecs.defaultColor;

  /** Explicit dots fill (any CSS color). */
  @property({ attribute: 'dots-color' }) dotsColor: string | undefined;

  /** Explicit corners-square fill. */
  @property({ attribute: 'corners-square-color' }) cornersSquareColor: string | undefined;

  /** Explicit corners-dot fill. */
  @property({ attribute: 'corners-dot-color' }) cornersDotColor: string | undefined;

  /** Background fill — `transparent` (default) or any CSS color. */
  @property() background: string = QrCodeSpecs.defaultBackground;

  /** Optional center logo URL. */
  @property() image: string | undefined;

  /** Logo size as a fraction of the QR (0–1). */
  @property({ type: Number, attribute: 'image-size' }) imageSize = 0.4;

  /**
   * Padding around the logo in modules (pattern) / px (qr-code-styling).
   * Keep small (1–3) for a clean square plate like Material QR samples.
   */
  @property({ type: Number, attribute: 'image-margin' }) imageMargin = 2;

  /**
   * Draw a stroke frame around the QR (CSS border on the host).
   * Pair with `shape="circle"` for a ring like branded circular codes.
   */
  @property({ type: Boolean, reflect: true }) framed = QrCodeSpecs.defaultFramed;

  /** Frame stroke width in CSS px. */
  @property({ type: Number, attribute: 'frame-width' }) frameWidth =
    QrCodeSpecs.defaultFrameWidth;

  /** Gap between the QR and the frame stroke (CSS px). */
  @property({ type: Number, attribute: 'frame-gap' }) frameGap = QrCodeSpecs.defaultFrameGap;

  /** Frame stroke color — defaults to the dots / theme color. */
  @property({ attribute: 'frame-color' }) frameColor: string | undefined;

  /** Accessible name; defaults to a localized “QR code”. */
  @property() label = '';

  /**
   * Stable mount node — interpolated as a Node so Lit never clears
   * qr-code-styling’s SVG/canvas children on re-render.
   */
  private readonly frameEl: HTMLDivElement = Object.assign(document.createElement('div'), {
    className: 'frame',
  });

  private qr: QRCodeStyling | null = null;
  /** Last pattern SVG markup (for download when not using qr-code-styling). */
  private patternSvg: string | null = null;
  private renderToken = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', QrCodeSpecs.accessibility.role);
    this.frameEl.setAttribute('part', 'frame');
  }

  override disconnectedCallback(): void {
    this.qr = null;
    super.disconnectedCallback();
  }

  override firstUpdated(): void {
    void this.rebuild();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncFrameChrome();
    const keys = [
      'value',
      'size',
      'margin',
      'dots',
      'cornersSquare',
      'cornersDot',
      'cornersSquareRotate',
      'cornersDotRotate',
      'shape',
      'type',
      'errorCorrection',
      'color',
      'dotsColor',
      'cornersSquareColor',
      'cornersDotColor',
      'background',
      'image',
      'imageSize',
      'imageMargin',
      'framed',
      'frameWidth',
      'frameGap',
      'frameColor',
    ];
    /* Frame chrome is CSS-only — no need to rebuild the matrix. */
    const matrixKeys = keys.filter(
      (k) => k !== 'framed' && k !== 'frameWidth' && k !== 'frameGap' && k !== 'frameColor',
    );
    if (matrixKeys.some((k) => changed.has(k))) {
      void this.rebuild();
    }
  }

  /** Download the QR as png / svg / jpeg / webp / pdf (logo composited). */
  async download(
    name = 'qr-code',
    extension: 'png' | 'svg' | 'jpeg' | 'webp' | 'pdf' = 'png',
  ): Promise<void> {
    if (!this.value.trim()) return;
    const blob = await this.getRawData(extension);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Raw blob — pattern path composites the center logo; PDF embeds a JPEG page. */
  async getRawData(
    extension: 'png' | 'svg' | 'jpeg' | 'webp' | 'pdf' = 'png',
  ): Promise<Blob | Buffer | null> {
    if (!this.value.trim()) return null;
    if (extension === 'pdf') {
      const jpeg = await this.getRawData('jpeg');
      if (!(jpeg instanceof Blob)) return null;
      return this.jpegToPdf(jpeg, Math.round(this.size), Math.round(this.size));
    }
    if (this.patternSvg) {
      if (extension === 'svg') return this.compositePatternSvg();
      return this.rasterizeComposite(extension);
    }
    if (!this.qr) return null;
    if (extension === 'svg' || extension === 'png' || extension === 'jpeg' || extension === 'webp') {
      return this.qr.getRawData(extension);
    }
    return null;
  }

  /** SVG string with optional embedded logo (base64). */
  private async compositePatternSvg(): Promise<Blob | null> {
    if (!this.patternSvg) return null;
    const logo = this.image?.trim();
    if (!logo) {
      return new Blob([this.patternSvg], { type: 'image/svg+xml' });
    }
    try {
      const dataUrl = await this.imageToDataUrl(logo);
      const frac = Math.min(0.45, Math.max(0.1, this.imageSize || 0.3));
      const inner = Math.max(1, this.size - 2 * this.margin);
      const logoPx = Math.round(inner * frac);
      const x = (this.size - logoPx) / 2;
      const y = (this.size - logoPx) / 2;
      const injected = this.patternSvg.replace(
        '</svg>',
        `<image href="${dataUrl}" x="${x}" y="${y}" width="${logoPx}" height="${logoPx}" preserveAspectRatio="xMidYMid meet"/></svg>`,
      );
      return new Blob([injected], { type: 'image/svg+xml' });
    } catch {
      return new Blob([this.patternSvg], { type: 'image/svg+xml' });
    }
  }

  private rasterizeComposite(
    extension: 'png' | 'jpeg' | 'webp',
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      void (async () => {
        const svgBlob = await this.compositePatternSvg();
        if (!svgBlob) {
          resolve(null);
          return;
        }
        const img = new Image();
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(this.size);
          canvas.height = Math.round(this.size);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(null);
            return;
          }
          /* JPEG has no alpha — fill white when background is transparent. */
          if (extension === 'jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          const mime =
            extension === 'jpeg' ? 'image/jpeg' : extension === 'webp' ? 'image/webp' : 'image/png';
          canvas.toBlob((b) => resolve(b), mime, extension === 'jpeg' ? 0.92 : undefined);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };
        img.src = url;
      })();
    });
  }

  private imageToDataUrl(src: string): Promise<string> {
    if (src.startsWith('data:')) return Promise.resolve(src);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('image'));
      img.src = src;
    });
  }

  /** Minimal single-page PDF embedding a JPEG (no extra dependency). */
  private async jpegToPdf(jpeg: Blob, width: number, height: number): Promise<Blob> {
    const bytes = new Uint8Array(await jpeg.arrayBuffer());
    const objects: string[] = [];
    const add = (s: string) => {
      objects.push(s);
      return objects.length;
    };
    add('<< /Type /Catalog /Pages 2 0 R >>');
    add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    add(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
    );
    const imgDict = `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>`;
    const content = `q ${width} 0 0 ${height} 0 0 cm /Im0 Do Q`;
    add(imgDict); /* 4 — stream appended below */
    add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const pushStr = (s: string) => chunks.push(encoder.encode(s));
    pushStr('%PDF-1.4\n');
    const offsets: number[] = [0];
    let offset = chunks.reduce((n, c) => n + c.length, 0);
    for (let i = 0; i < objects.length; i++) {
      offsets.push(offset);
      if (i === 3) {
        /* Image object with binary stream */
        const header = `${i + 1} 0 obj\n${objects[i]}\nstream\n`;
        const headerBytes = encoder.encode(header);
        chunks.push(headerBytes);
        chunks.push(bytes);
        const end = encoder.encode('\nendstream\nendobj\n');
        chunks.push(end);
        offset += headerBytes.length + bytes.length + end.length;
      } else {
        const body = encoder.encode(`${i + 1} 0 obj\n${objects[i]}\nendobj\n`);
        chunks.push(body);
        offset += body.length;
      }
    }
    const xrefStart = offset;
    pushStr(`xref\n0 ${objects.length + 1}\n`);
    pushStr('0000000000 65535 f \n');
    for (let i = 1; i < offsets.length; i++) {
      pushStr(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    }
    pushStr(
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`,
    );
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let o = 0;
    for (const c of chunks) {
      out.set(c, o);
      o += c.length;
    }
    return new Blob([out], { type: 'application/pdf' });
  }

  private normalizeEnums(): void {
    this.dots = resolveQrDotType(this.dots);
    this.cornersSquare = resolveQrCornerSquare(this.cornersSquare);
    this.cornersDot = resolveQrCornerDot(this.cornersDot);
    this.shape = resolveQrShape(this.shape);
    this.type = resolveQrDrawType(this.type);
    this.errorCorrection = resolveQrErrorCorrection(this.errorCorrection);
    if (!Number.isFinite(this.size) || this.size <= 0) this.size = QrCodeSpecs.defaultSize;
    if (!Number.isFinite(this.margin) || this.margin < 0) this.margin = QrCodeSpecs.defaultMargin;
  }

  /** Resolve a CSS color / theme token to a paint string for the library. */
  private paint(explicit: string | undefined, cssVar: string): string {
    if (explicit?.trim()) return explicit.trim();
    const fromVar = getComputedStyle(this).getPropertyValue(cssVar).trim();
    return fromVar || '#000000';
  }

  private isThemeRole(v: string): boolean {
    return (
      v === 'primary' ||
      v === 'secondary' ||
      v === 'tertiary' ||
      v === 'error' ||
      v === 'on-surface' ||
      v === 'on-surface-variant'
    );
  }

  private buildOptions(): QrStylingOptions {
    this.normalizeEnums();
    const size = Math.round(this.size);
    /* `color` as a raw CSS color when it is not a theme role. */
    const colorAsPaint =
      this.color && !this.isThemeRole(this.color) ? this.color.trim() : undefined;
    const dotsColor = this.paint(this.dotsColor ?? colorAsPaint, '--k3-qr-dots');
    const cornerSq = this.paint(this.cornersSquareColor ?? colorAsPaint, '--k3-qr-corners-square');
    const cornerDot = this.paint(this.cornersDotColor ?? colorAsPaint, '--k3-qr-corners-dot');
    let bg = this.background?.trim() || 'transparent';
    if (bg === 'surface') {
      bg = this.paint(undefined, '--k3-sys-color-surface');
    } else if (bg.startsWith('--')) {
      bg = this.paint(undefined, bg);
    } else if (bg === 'var(--k3-qr-background)' || !bg) {
      bg = this.paint(undefined, '--k3-qr-background') || 'transparent';
    }

    const opts: QrStylingOptions = {
      width: size,
      height: size,
      type: this.type,
      shape: this.shape,
      margin: this.margin,
      data: this.value.trim(),
      qrOptions: {
        errorCorrectionLevel: this.errorCorrection,
      },
      dotsOptions: {
        type: this.dots,
        color: dotsColor,
        roundSize: true,
      },
      cornersSquareOptions: {
        type: this.cornersSquare,
        color: cornerSq,
      },
      cornersDotOptions: {
        type: this.cornersDot,
        color: cornerDot,
      },
      backgroundOptions: {
        color: bg,
      },
    };

    if (this.image?.trim()) {
      opts.image = this.image.trim();
      opts.imageOptions = {
        crossOrigin: 'anonymous',
        margin: this.imageMargin,
        imageSize: this.imageSize,
        hideBackgroundDots: true,
      };
      /* Logo occludes modules — prefer high ECC unless the user forced another level. */
      if (!this.hasAttribute('error-correction')) {
        opts.qrOptions = { ...opts.qrOptions, errorCorrectionLevel: 'H' };
      }
    }

    return opts;
  }

  private async rebuild(): Promise<void> {
    const token = ++this.renderToken;
    this.normalizeEnums();
    const data = this.value.trim();

    await this.updateComplete;
    if (token !== this.renderToken || !this.frameEl) return;

    /* Frame content is owned by the active renderer — never Lit-templated. */
    this.frameEl.replaceChildren();
    this.qr = null;
    this.patternSvg = null;

    if (!data) {
      const ph = document.createElement('span');
      ph.className = 'placeholder';
      ph.setAttribute('part', 'placeholder');
      ph.textContent = i18n.t('qrcode.empty') || 'Enter a value';
      this.frameEl.append(ph);
      return;
    }

    try {
      if (usesPatternRenderer(this.dots, this.cornersSquare, this.cornersDot)) {
        this.rebuildPattern(data);
      } else {
        const options = this.buildOptions();
        this.qr = new QRCodeStyling(options);
        this.qr.append(this.frameEl);
      }
      if (token !== this.renderToken) return;
      this.emit('k3-ready', { value: data });
    } catch (err) {
      this.qr = null;
      this.patternSvg = null;
      this.emit('k3-error', { error: err instanceof Error ? err.message : String(err) });
    }
  }

  /** Render via hardcoded body / eye-frame / eye-ball SVG patterns. */
  private rebuildPattern(data: string): void {
    const body = isPatternBody(this.dots) ? this.dots : 'square';
    const eye = isPatternEye(this.cornersSquare) ? this.cornersSquare : 'frame0';
    const eyeBall = isPatternBall(this.cornersDot) ? this.cornersDot : 'ball0';
    const colorAsPaint =
      this.color && !this.isThemeRole(this.color) ? this.color.trim() : undefined;
    const color = this.paint(this.dotsColor ?? colorAsPaint, '--k3-qr-dots');
    const eyeColor = this.paint(
      this.cornersSquareColor ?? colorAsPaint,
      '--k3-qr-corners-square',
    );
    const eyeBallColor = this.paint(
      this.cornersDotColor ?? colorAsPaint,
      '--k3-qr-corners-dot',
    );
    let bg = this.background?.trim() || 'transparent';
    if (bg === 'surface') bg = this.paint(undefined, '--k3-sys-color-surface');
    else if (bg.startsWith('--')) bg = this.paint(undefined, bg);

    const hasLogo = !!this.image?.trim();
    const frac = Math.min(0.45, Math.max(0.1, this.imageSize || 0.3));
    /* 1–4 modules of pad → clean square plate (capture-2), not a huge void. */
    const logoPadModules = hasLogo
      ? Math.max(1, Math.min(4, Math.round(this.imageMargin || 2)))
      : 0;
    const eyeRotate = parseQrFinderRotateMap(
      this.cornersSquareRotate,
      QR_FINDER_ROTATE_DEFAULT,
    );
    const eyeBallRotate = this.cornersDotRotate?.trim()
      ? parseQrFinderRotateMap(this.cornersDotRotate, eyeRotate)
      : eyeRotate;
    const opts = {
      data,
      size: Math.round(this.size),
      margin: this.margin,
      body,
      eye,
      eyeBall,
      color,
      eyeColor,
      eyeBallColor,
      background: bg,
      ecc: this.errorCorrection,
      logoSize: hasLogo ? frac : 0,
      logoMarginModules: logoPadModules,
      logoPlateColor: bg && bg !== 'transparent' ? bg : '#ffffff',
      eyeRotate,
      eyeBallRotate,
    };
    this.patternSvg = renderPatternQrSvg(opts);
    mountPatternQr(this.frameEl, opts);
    /* Logo sits inside the plate (inner size = frac of the QR content area). */
    if (hasLogo) {
      const img = document.createElement('img');
      img.src = this.image!.trim();
      img.alt = '';
      img.setAttribute('part', 'logo');
      const inner = Math.max(1, this.size - 2 * this.margin);
      const px = Math.round(inner * frac);
      img.style.cssText = `position:absolute;left:50%;top:50%;width:${px}px;height:${px}px;margin:-${px / 2}px 0 0 -${px / 2}px;object-fit:contain;pointer-events:none;`;
      this.frameEl.style.position = 'relative';
      this.frameEl.append(img);
    }
  }

  private ariaLabel(): string {
    const custom = this.label.trim();
    if (custom) return custom;
    return i18n.t('qrcode.label') || 'QR code';
  }

  private syncFrameChrome(): void {
    const sizePx = `${Math.max(1, Math.round(this.size))}px`;
    this.frameEl.style.setProperty('--k3-qr-size', sizePx);
    this.frameEl.style.width = sizePx;
    this.frameEl.style.height = sizePx;
    this.frameEl.setAttribute('aria-label', this.ariaLabel());

    const fw = Number.isFinite(this.frameWidth) ? Math.max(0, this.frameWidth) : QrCodeSpecs.defaultFrameWidth;
    const fg = Number.isFinite(this.frameGap) ? Math.max(0, this.frameGap) : QrCodeSpecs.defaultFrameGap;
    this.style.setProperty('--k3-qr-frame-width', `${fw}px`);
    this.style.setProperty('--k3-qr-frame-gap', `${fg}px`);
    if (this.frameColor?.trim()) {
      this.style.setProperty('--k3-qr-frame', this.frameColor.trim());
    } else {
      this.style.removeProperty('--k3-qr-frame');
    }
    if (this.background?.trim() && this.background !== 'transparent') {
      let bg = this.background.trim();
      if (bg === 'surface') bg = this.paint(undefined, '--k3-sys-color-surface');
      this.style.setProperty('--k3-qr-background', bg);
    } else {
      this.style.setProperty('--k3-qr-background', 'transparent');
    }
  }

  override render() {
    return html`${this.frameEl}`;
  }
}

export default K3QrCode;

if (!customElements.get('k3-qr-code')) {
  customElements.define('k3-qr-code', K3QrCode);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-qr-code': K3QrCode;
  }
}
