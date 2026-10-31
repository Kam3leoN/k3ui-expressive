/**
 * Spécifications `k3-qr-generator` — générateur complet inspiré de qr.io :
 * 1 · Contenu (9 types statiques) → 2 · Design (cadre, forme, logo, réglages)
 * → 3 · Téléchargement (PNG, SVG, JPG, copie).
 */
import type { QrEcc } from '@k3ui/components/media/qr-code.encoder.js';
import type { QrContentType } from '@k3ui/components/media/qr-code.payload.js';
import type {
  QrDotStyle,
  QrEyeBallStyle,
  QrEyeFrameStyle,
  QrFrameFont,
  QrFrameStyle,
  QrGradient,
  QrLogoIcon,
} from '@k3ui/components/media/qr-code.render.js';

/** Everything the Design step controls — serialisable (JSON-safe). */
export interface QrDesign {
  dotStyle: QrDotStyle;
  eyeFrameStyle: QrEyeFrameStyle;
  eyeBallStyle: QrEyeBallStyle;
  color: string;
  gradient: QrGradient;
  gradientColor: string;
  gradientRotation: number;
  /** Empty → same paint as the dots. */
  eyeFrameColor: string;
  eyeBallColor: string;
  background: string;
  transparent: boolean;
  /** Background corner radius in modules (frame `none`). */
  radius: number;
  /** Uploaded image as data URL. */
  logo: string;
  logoIcon: QrLogoIcon | '';
  logoSize: number;
  logoMargin: number;
  logoKeepDots: boolean;
  frame: QrFrameStyle;
  /** Empty → localized “Scan me”. */
  frameText: string;
  /** Empty → dots colour. */
  frameColor: string;
  frameFont: QrFrameFont;
  ecc: QrEcc;
  margin: number;
  exportSize: number;
}

export const QR_DESIGN_DEFAULTS: Readonly<QrDesign> = {
  dotStyle: 'default',
  eyeFrameStyle: 'default',
  eyeBallStyle: 'default',
  color: '#1b1b1f',
  gradient: 'none',
  gradientColor: '#00639b',
  gradientRotation: 45,
  eyeFrameColor: '',
  eyeBallColor: '',
  background: '#ffffff',
  transparent: false,
  radius: 0,
  logo: '',
  logoIcon: '',
  logoSize: 0.24,
  logoMargin: 1,
  logoKeepDots: false,
  frame: 'none',
  frameText: '',
  frameColor: '',
  frameFont: 'sans',
  ecc: 'M',
  margin: 2,
  exportSize: 1024,
};

/** Material Symbols ligature per content type (chips + logo presets). */
export const QR_TYPE_ICONS: Readonly<Record<QrContentType, string>> = {
  link: 'link',
  text: 'notes',
  email: 'mail',
  phone: 'call',
  sms: 'sms',
  whatsapp: 'chat',
  wifi: 'wifi',
  vcard: 'contact_page',
  event: 'event',
};

/** Matching vector logo per content type (suggested in the Logo tab). */
export const QR_TYPE_LOGOS: Readonly<Record<QrContentType, QrLogoIcon>> = {
  link: 'link',
  text: 'text',
  email: 'mail',
  phone: 'phone',
  sms: 'sms',
  whatsapp: 'chat',
  wifi: 'wifi',
  vcard: 'contact',
  event: 'event',
};

export const QR_LOGO_PRESETS: readonly QrLogoIcon[] = [
  'link',
  'text',
  'mail',
  'phone',
  'sms',
  'chat',
  'wifi',
  'contact',
  'location',
  'event',
];

/** Quick colour picks — dark tones keep scanners happy on light backgrounds. */
export const QR_SWATCHES: readonly string[] = [
  '#1b1b1f',
  '#00639b',
  '#006a60',
  '#386a20',
  '#6750a4',
  '#984061',
  '#b3261e',
];

export const QrGeneratorSpecs = {
  defaultType: 'link' as QrContentType,
  /** Host width (rem) from which the preview sits beside the form. */
  twoPaneMinRem: 56,
  /** Host width (rem) from which paired fields share a row. */
  rowsMinRem: 36,
  textMaxLength: 1000,
  smsMaxLength: 160,
  frameTextMaxLength: 24,
  logoMaxBytes: 5 * 1024 * 1024,
  /** Uploaded rasters are downscaled to keep exported SVGs light. */
  logoMaxPx: 512,
  logoSize: { min: 0.1, max: 0.36, step: 0.02 },
  logoMargin: { min: 0, max: 3, step: 1 },
  margin: { min: 0, max: 8, step: 1 },
  radius: { min: 0, max: 6, step: 1 },
  exportSize: { min: 256, max: 2048, step: 128 },
  /** Below this WCAG ratio the preview warns about scan reliability. */
  minContrast: 3,
  /** Levels L/M are raised to this one when a logo is added. */
  logoEcc: 'H' as QrEcc,
  eccLevels: ['L', 'M', 'Q', 'H'] as readonly QrEcc[],
  eccRecovery: { L: 7, M: 15, Q: 25, H: 30 } as Record<QrEcc, number>,
  accessibility: {
    role: 'region' as const,
    ariaLabel: 'QR code generator',
  },
} as const;
