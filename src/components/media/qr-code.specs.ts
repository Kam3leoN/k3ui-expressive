/**
 * QR Code — styled via `qr-code-styling` + hardcoded body / eye / ball SVG patterns.
 * @see https://qr-code-styling.com
 */

import {
  QR_BALL_IDS,
  QR_BODY_IDS,
  QR_EYE_IDS,
  type QrBallStyle,
  type QrBodyStyle,
  type QrEyeStyle,
} from './qr-code.patterns.js';

export type { QrBallStyle, QrBodyStyle, QrEyeStyle };

export type QrDotType =
  | 'square'
  | 'dots'
  | 'rounded'
  | 'classy'
  | 'classy-rounded'
  | 'extra-rounded'
  | QrBodyStyle;

export type QrCornerSquareType =
  | 'square'
  | 'dot'
  | 'extra-rounded'
  | 'rounded'
  | 'dots'
  | 'classy'
  | 'classy-rounded'
  | QrEyeStyle;

export type QrCornerDotType =
  | 'square'
  | 'dot'
  | 'rounded'
  | 'dots'
  | 'classy'
  | 'classy-rounded'
  | 'extra-rounded'
  | QrBallStyle;

export type QrShape = 'square' | 'circle';

export type QrDrawType = 'svg' | 'canvas';

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

/** Theme role shortcuts for fill colors. */
export type QrColorRole =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'error'
  | 'on-surface'
  | 'on-surface-variant';

/** Classic qr-code-styling module styles. */
export const QR_DOT_TYPES_CLASSIC = [
  'square',
  'dots',
  'rounded',
  'classy',
  'classy-rounded',
  'extra-rounded',
] as const satisfies readonly QrDotType[];

export const QR_DOT_TYPES: readonly QrDotType[] = [
  ...QR_DOT_TYPES_CLASSIC,
  ...QR_BODY_IDS,
] as const;

export const QR_CORNER_SQUARE_TYPES_CLASSIC = [
  'square',
  'dot',
  'extra-rounded',
  'rounded',
  'dots',
  'classy',
  'classy-rounded',
] as const satisfies readonly QrCornerSquareType[];

export const QR_CORNER_SQUARE_TYPES: readonly QrCornerSquareType[] = [
  ...QR_CORNER_SQUARE_TYPES_CLASSIC,
  ...QR_EYE_IDS,
] as const;

export const QR_CORNER_DOT_TYPES_CLASSIC = [
  'square',
  'dot',
  'rounded',
  'dots',
  'classy',
  'classy-rounded',
  'extra-rounded',
] as const satisfies readonly QrCornerDotType[];

export const QR_CORNER_DOT_TYPES: readonly QrCornerDotType[] = [
  ...QR_CORNER_DOT_TYPES_CLASSIC,
  ...QR_BALL_IDS,
] as const;

export { QR_BODY_IDS, QR_EYE_IDS, QR_BALL_IDS };

export const QrCodeSpecs = {
  defaultValue: '',
  defaultSize: 160,
  defaultMargin: 8,
  defaultDots: 'rounded' as QrDotType,
  defaultCornersSquare: 'extra-rounded' as QrCornerSquareType,
  defaultCornersDot: 'dot' as QrCornerDotType,
  defaultShape: 'square' as QrShape,
  defaultType: 'svg' as QrDrawType,
  defaultErrorCorrection: 'M' as QrErrorCorrection,
  defaultColor: 'on-surface' as QrColorRole,
  defaultBackground: 'transparent',
  defaultFramed: false,
  defaultFrameWidth: 3,
  defaultFrameGap: 10,
  accessibility: {
    role: 'img' as const,
  },
} as const;

export function resolveQrDotType(v: string | null | undefined): QrDotType {
  if (v && (QR_DOT_TYPES as readonly string[]).includes(v)) return v as QrDotType;
  return QrCodeSpecs.defaultDots;
}

export function resolveQrCornerSquare(v: string | null | undefined): QrCornerSquareType {
  if (v && (QR_CORNER_SQUARE_TYPES as readonly string[]).includes(v)) {
    return v as QrCornerSquareType;
  }
  return QrCodeSpecs.defaultCornersSquare;
}

export function resolveQrCornerDot(v: string | null | undefined): QrCornerDotType {
  if (v && (QR_CORNER_DOT_TYPES as readonly string[]).includes(v)) {
    return v as QrCornerDotType;
  }
  return QrCodeSpecs.defaultCornersDot;
}

export function resolveQrShape(v: string | null | undefined): QrShape {
  return v === 'circle' ? 'circle' : 'square';
}

export function resolveQrDrawType(v: string | null | undefined): QrDrawType {
  return v === 'canvas' ? 'canvas' : 'svg';
}

export function resolveQrErrorCorrection(v: string | null | undefined): QrErrorCorrection {
  if (v === 'L' || v === 'M' || v === 'Q' || v === 'H') return v;
  return QrCodeSpecs.defaultErrorCorrection;
}

export function isPatternBody(v: string | null | undefined): v is QrBodyStyle {
  return !!v && (QR_BODY_IDS as readonly string[]).includes(v);
}

export function isPatternEye(v: string | null | undefined): v is QrEyeStyle {
  return !!v && (QR_EYE_IDS as readonly string[]).includes(v);
}

export function isPatternBall(v: string | null | undefined): v is QrBallStyle {
  return !!v && (QR_BALL_IDS as readonly string[]).includes(v);
}

/**
 * True when any style id requires the pattern SVG renderer.
 * Shared name `square` stays on qr-code-styling unless an eye/ball pattern is set.
 */
export function usesPatternRenderer(
  dots: string | null | undefined,
  cornersSquare: string | null | undefined,
  cornersDot: string | null | undefined,
): boolean {
  const bodyPattern =
    isPatternBody(dots) && !(QR_DOT_TYPES_CLASSIC as readonly string[]).includes(dots!);
  return bodyPattern || isPatternEye(cornersSquare) || isPatternBall(cornersDot);
}
