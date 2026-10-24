import {
  argbFromHex,
  hexFromArgb,
  CorePalette,
  Hct,
} from '@material/material-color-utilities';

/** M3 tonal steps (2021–2026 token ladder) */
export const TONAL_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100] as const;

export type PaletteName =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'neutral'
  | 'neutral-variant'
  | 'error';

export interface TonalSwatch {
  tone: number;
  hex: string;
  /** relative luminance hint for label color */
  onHex: string;
}

export interface DynamicPalettes {
  seed: string;
  hct: { hue: number; chroma: number; tone: number };
  palettes: Record<PaletteName, TonalSwatch[]>;
}

function swatches(tp: { tone: (t: number) => number }): TonalSwatch[] {
  return TONAL_STEPS.map((tone) => {
    const argb = tp.tone(tone);
    const hex = hexFromArgb(argb);
    const onHex = tone < 60 ? '#ffffff' : '#000000';
    return { tone, hex, onHex };
  });
}

/** Build full tonal ladders from a seed (dynamic color / MCU CorePalette). */
export function buildDynamicPalettes(seed: string): DynamicPalettes {
  const argb = argbFromHex(seed);
  const hct = Hct.fromInt(argb);
  const core = CorePalette.of(argb);
  return {
    seed,
    hct: { hue: hct.hue, chroma: hct.chroma, tone: hct.tone },
    palettes: {
      primary: swatches(core.a1),
      secondary: swatches(core.a2),
      tertiary: swatches(core.a3),
      neutral: swatches(core.n1),
      'neutral-variant': swatches(core.n2),
      error: swatches(core.error),
    },
  };
}
