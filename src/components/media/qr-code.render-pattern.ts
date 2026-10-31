/**
 * SVG renderer for styled QR body / eye-frame / eye-ball patterns.
 * Matrix via `uqr`; body modules via neighbor-aware drawing.
 */
import { encode } from 'uqr';
import { drawBodyModule, type BodyNeighbors } from './qr-code.body-draw.js';
import {
  finderRotateTransform,
  parseQrFinderRotateMap,
  QR_FINDER_ROTATE_DEFAULT,
  type QrFinderCorner,
  type QrFinderRotateMap,
} from './qr-code.finder-rotate.js';
import {
  QR_BALLS,
  QR_EYES,
  type QrBallStyle,
  type QrBodyStyle,
  type QrEyeStyle,
  type QrPattern,
} from './qr-code.patterns.js';

export type { QrFinderCorner, QrFinderRotateMap } from './qr-code.finder-rotate.js';

export type PatternRenderOptions = {
  data: string;
  size: number;
  margin: number;
  body: QrBodyStyle;
  eye: QrEyeStyle;
  eyeBall: QrBallStyle;
  /** Body / dots fill. */
  color: string;
  /** Eye-frame fill — defaults to `color`. */
  eyeColor?: string;
  /** Eye-ball fill — defaults to `eyeColor` then `color`. */
  eyeBallColor?: string;
  background: string;
  ecc?: 'L' | 'M' | 'Q' | 'H';
  /**
   * Center logo clear — fraction of the matrix (0–0.45). Modules inside the
   * padded hole are skipped so dots do not sit under the logo (use ECC H).
   */
  logoSize?: number;
  /** Extra modules of padding around the logo (each side) — keep small (1–3). */
  logoMarginModules?: number;
  /**
   * Fill color for the square logo plate (capture-style white pad).
   * Defaults to background, or `#ffffff` when background is transparent.
   */
  logoPlateColor?: string;
  /**
   * Per-corner eye-frame orientation (`mirror` = BR-ref flips). Defaults all `mirror`.
   */
  eyeRotate?: Partial<QrFinderRotateMap> | string;
  /**
   * Per-corner eye-ball orientation. Defaults to `eyeRotate` / all `mirror`.
   */
  eyeBallRotate?: Partial<QrFinderRotateMap> | string;
};

function isDark(matrix: boolean[][], x: number, y: number): boolean {
  return !!matrix[y]?.[x];
}

function inFinder(size: number, x: number, y: number): boolean {
  const hit = (ex: number, ey: number) => x >= ex && x < ex + 7 && y >= ey && y < ey + 7;
  return hit(0, 0) || hit(size - 7, 0) || hit(0, size - 7);
}

/** True when (x,y) sits in the center logo clear zone (logo + padding). */
export function inLogoClear(
  matrixSize: number,
  x: number,
  y: number,
  logoSize = 0,
  logoMarginModules = 0,
): boolean {
  const frac = Math.min(0.45, Math.max(0, logoSize));
  if (frac <= 0) return false;
  const pad = Math.max(0, Math.round(logoMarginModules));
  const logoModules = Math.max(1, Math.ceil(matrixSize * frac));
  const hole = logoModules + pad * 2;
  if (hole >= matrixSize - 2) return false;
  const start = Math.floor((matrixSize - hole) / 2);
  const end = start + hole;
  return x >= start && x < end && y >= start && y < end;
}

function resolveRotateMap(
  value: PatternRenderOptions['eyeRotate'],
  fallback: QrFinderRotateMap,
): QrFinderRotateMap {
  if (value == null) return { ...fallback };
  if (typeof value === 'string') return parseQrFinderRotateMap(value, fallback);
  return {
    tl: value.tl ?? fallback.tl,
    tr: value.tr ?? fallback.tr,
    bl: value.bl ?? fallback.bl,
  };
}

function stamp(
  pattern: QrPattern,
  x: number,
  y: number,
  px: number,
  color: string,
  corner: QrFinderCorner,
  rotate: QrFinderRotateMap,
  evenodd = false,
): string {
  const s = px / pattern.cell;
  const rule = evenodd ? ' fill-rule="evenodd"' : '';
  const orient = finderRotateTransform(rotate[corner], corner, pattern.cell);
  const inner = orient ? ` ${orient}` : '';
  return `<g transform="translate(${x},${y}) scale(${s})${inner}" fill="${color}"${rule}>${pattern.markup}</g>`;
}

/** Build a full SVG string for a pattern-styled QR. */
export function renderPatternQrSvg(opts: PatternRenderOptions): string {
  const ecc = opts.ecc ?? 'M';
  const encoded = encode(opts.data, { ecc, border: 0 });
  const n = encoded.size;
  const matrix = encoded.data as boolean[][];

  const margin = Math.max(0, opts.margin);
  const inner = Math.max(1, opts.size - margin * 2);
  const module = inner / n;
  const eyePx = module * 7;
  const ballPx = module * 3;
  const ballPad = module * 2;

  const eyePat = QR_EYES[opts.eye] ?? QR_EYES.frame0;
  const ballPat = QR_BALLS[opts.eyeBall] ?? QR_BALLS.ball0;
  const color = opts.color || '#000000';
  const eyeColor = opts.eyeColor || color;
  const eyeBallColor = opts.eyeBallColor || eyeColor;
  const bg = opts.background || 'transparent';
  const logoFrac = opts.logoSize ?? 0;
  const logoPad = opts.logoMarginModules ?? 0;
  const plate =
    opts.logoPlateColor?.trim() ||
    (bg && bg !== 'transparent' ? bg : '#ffffff');

  const moduleVisible = (x: number, y: number): boolean =>
    isDark(matrix, x, y) && !inFinder(n, x, y) && !inLogoClear(n, x, y, logoFrac, logoPad);

  const parts: string[] = [];
  if (bg && bg !== 'transparent') {
    parts.push(
      `<rect x="0" y="0" width="${opts.size}" height="${opts.size}" fill="${bg}"/>`,
    );
  }

  parts.push(`<g transform="translate(${margin},${margin})">`);

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!moduleVisible(x, y)) continue;
      const neighbors: BodyNeighbors = {
        t: moduleVisible(x, y - 1),
        r: moduleVisible(x + 1, y),
        b: moduleVisible(x, y + 1),
        l: moduleVisible(x - 1, y),
      };
      /* Finder / logo-adjacent treated as empty for rounding toward holes. */
      parts.push(
        drawBodyModule(
          opts.body,
          x,
          y,
          x * module,
          y * module,
          module,
          color,
          neighbors,
        ),
      );
    }
  }

  const eyeRotate = resolveRotateMap(opts.eyeRotate, QR_FINDER_ROTATE_DEFAULT);
  const ballRotate = resolveRotateMap(opts.eyeBallRotate, eyeRotate);

  /* Eyes authored for BR; per-corner rotate (default `mirror`) for frame + ball. */
  const eyes: Array<[number, number, QrFinderCorner]> = [
    [0, 0, 'tl'],
    [n - 7, 0, 'tr'],
    [0, n - 7, 'bl'],
  ];
  for (const [ex, ey, corner] of eyes) {
    const ox = ex * module;
    const oy = ey * module;
    /* Corner SVGs use evenodd rings (outer + hole). Balls are solid. */
    parts.push(stamp(eyePat, ox, oy, eyePx, eyeColor, corner, eyeRotate, true));
    parts.push(
      stamp(ballPat, ox + ballPad, oy + ballPad, ballPx, eyeBallColor, corner, ballRotate),
    );
  }

  /* Sharp square plate under the logo (capture-2 style — not a jagged module hole). */
  if (logoFrac > 0) {
    const logoModules = Math.max(1, Math.ceil(n * Math.min(0.45, logoFrac)));
    const pad = Math.max(0, Math.round(logoPad));
    const hole = logoModules + pad * 2;
    if (hole < n - 2) {
      const start = Math.floor((n - hole) / 2);
      const xy = start * module;
      const wh = hole * module;
      parts.push(
        `<rect x="${xy.toFixed(2)}" y="${xy.toFixed(2)}" width="${wh.toFixed(2)}" height="${wh.toFixed(2)}" fill="${plate}"/>`,
      );
    }
  }

  parts.push('</g>');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.size}" height="${opts.size}" viewBox="0 0 ${opts.size} ${opts.size}" shape-rendering="geometricPrecision">${parts.join('')}</svg>`;
}

/** Mount pattern SVG into a host element (replaces children). */
export function mountPatternQr(host: HTMLElement, opts: PatternRenderOptions): SVGSVGElement {
  host.replaceChildren();
  const wrap = document.createElement('div');
  wrap.innerHTML = renderPatternQrSvg(opts);
  const svg = wrap.firstElementChild as SVGSVGElement;
  host.append(svg);
  return svg;
}
