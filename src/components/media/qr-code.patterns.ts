/**
 * Hardcoded SVG pattern markups for QR body / eye-frame / eye-ball styles.
 * Coordinates are in a square cell of `cell` units (usually 100).
 * Eyes/balls: exact markups from `assets/qrcode/corners` + `assets/qrcode/dots`
 * (BR authoring reference; renderer flips TL/TR/BL).
 */

import { QR_BALL_SVG_MARKUPS } from './qr-code.ball-markups.js';
import { QR_EYE_SVG_MARKUPS } from './qr-code.eye-markups.js';

/** UI order matches the body-shape picker (left → right, top → bottom). */
export const QR_BODY_IDS = [
  'square',
  'mosaic',
  'dot',
  'circle',
  'circle-zebra',
  'circle-zebra-vertical',
  'circular',
  'edge-cut',
  'edge-cut-smooth',
  'japnese',
  'knob',
  'knob-smooth',
  'leaf',
  'pointed',
  'pointed-edge-cut',
  'pointed-in',
  'pointed-in-smooth',
  'pointed-smooth',
  'round',
  'rounded-in',
  'rounded-in-smooth',
  'rounded-pointed',
  'star',
  'diamond',
] as const;
export type QrBodyStyle = (typeof QR_BODY_IDS)[number];

/** Matches `assets/qrcode/corners/{n}.svg` (0–14). */
export const QR_EYE_IDS = [
  'frame0',
  'frame1',
  'frame2',
  'frame3',
  'frame4',
  'frame5',
  'frame6',
  'frame7',
  'frame8',
  'frame9',
  'frame10',
  'frame11',
  'frame12',
  'frame13',
  'frame14',
] as const;
export type QrEyeStyle = (typeof QR_EYE_IDS)[number];

/** Matches `assets/qrcode/dots/{n}.svg` (0–15). */
export const QR_BALL_IDS = [
  'ball0',
  'ball1',
  'ball2',
  'ball3',
  'ball4',
  'ball5',
  'ball6',
  'ball7',
  'ball8',
  'ball9',
  'ball10',
  'ball11',
  'ball12',
  'ball13',
  'ball14',
  'ball15',
] as const;
export type QrBallStyle = (typeof QR_BALL_IDS)[number];

export type QrPattern = {
  /** Inner SVG markup (path / polygon / circle / rect…). */
  markup: string;
  /** Design-space size the markup is authored in. */
  cell: number;
};

export function isQrBodyStyle(v: string | null | undefined): v is QrBodyStyle {
  return !!v && (QR_BODY_IDS as readonly string[]).includes(v);
}
export function isQrEyeStyle(v: string | null | undefined): v is QrEyeStyle {
  return !!v && (QR_EYE_IDS as readonly string[]).includes(v);
}
export function isQrBallStyle(v: string | null | undefined): v is QrBallStyle {
  return !!v && (QR_BALL_IDS as readonly string[]).includes(v);
}

export const QR_EYES: Record<QrEyeStyle, QrPattern> = Object.fromEntries(
  (QR_EYE_IDS as readonly string[]).map((id) => {
    const p = QR_EYE_SVG_MARKUPS[id];
    if (!p) throw new Error(`Missing QR eye markup: ${id}`);
    return [id, p];
  }),
) as Record<QrEyeStyle, QrPattern>;

export const QR_BALLS: Record<QrBallStyle, QrPattern> = Object.fromEntries(
  (QR_BALL_IDS as readonly string[]).map((id) => {
    const p = QR_BALL_SVG_MARKUPS[id];
    if (!p) throw new Error(`Missing QR ball markup: ${id}`);
    return [id, p];
  }),
) as Record<QrBallStyle, QrPattern>;
