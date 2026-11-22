/**
 * Button Smart tokens — Material You Quick Settings tile.
 *
 * Geometry from AOSP Compose `CommonTileDefaults` (SystemUI infinitegrid).
 * Morph pill (OFF) ⇄ squircle (ON), AOSP marquee, light haptic.
 *
 * @see CommonTileDefaults in frameworks/base/.../qs/panels/ui/compose/infinitegrid/CommonTile.kt
 * @see https://m3.material.io/styles/color/system/overview
 */
import {
  TextMarqueeDelayMs,
  TextMarqueeDpPerSecond,
  TextMarqueeRestartDelayMs,
} from '../feedback/text-marquee.specs.js';

/** Tile height — Compose `CommonTileDefaults.TileHeight`. */
export const ButtonSmartHeightDp = 72;

/**
 * Uniform chrome inset — Compose `TilePadding` (8).
 * Icon box = height − 2×padding = 56 (`ToggleTargetSize`).
 */
export const ButtonSmartInsetDp = 8;

/** Leading pad — alias of inset (Compose TilePadding is uniform). */
export const ButtonSmartPadInlineStartDp = ButtonSmartInsetDp;

/** Trailing pad — alias of inset (Compose TilePadding is uniform). */
export const ButtonSmartPadInlineEndDp = ButtonSmartInsetDp;

/** Icon circle / squircle — Compose `ToggleTargetSize`. */
export const ButtonSmartIconBoxDp = ButtonSmartHeightDp - 2 * ButtonSmartInsetDp;

/** Glyph inside icon box — Compose `LargeTileIconSize`. */
export const ButtonSmartGlyphDp = 28;

/**
 * ON corner radius (squircle). OFF = height/2 pill.
 * Between pill (36) and sharp — Material You active tile look.
 */
export const ButtonSmartRadiusOnDp = 24;

/** Marquee edge fade mask (dp). */
export const ButtonSmartFadeDp = 14;

/** Gap icon → label — Compose `TileArrangementPadding`. */
export const ButtonSmartLabelGapDp = 6;

/** Label type size — AOSP `qs_tile_text_size` (14sp ≈ 14dp). */
export const ButtonSmartLabelSizeDp = 14;

/** Subtitle type size (dp). */
export const ButtonSmartSubtitleSizeDp = 12;

/** Parent grid gap — AOSP `qs_tile_margin_horizontal`. */
export const ButtonSmartGridGapDp = 8;

/** Morph duration (ms) — M3 spatial-fast / emphasized. */
export const ButtonSmartMorphMs = 350;

/** Marquee timing — re-export of shared text-marquee specs (compat). */
export const ButtonSmartMarqueeDelayMs = TextMarqueeDelayMs;
export const ButtonSmartMarqueeRestartDelayMs = TextMarqueeRestartDelayMs;
export const ButtonSmartMarqueeDpPerSecond = TextMarqueeDpPerSecond;

/** Default haptic pulse (ms). `0` → `haptic.light()`. */
export const ButtonSmartDefaultHapticDuration = 15;

/**
 * Default active subtitle (English).
 * For locale-aware UI use `i18n.t('switch.on')` (FR: « Activé »).
 */
export const ButtonSmartDefaultActiveSubtitle = 'On';

export const ButtonSmartDefaultInactiveSubtitle = '';

/**
 * Host CSS custom properties snapped at runtime via `devicePixelSnapCss`
 * (Windows 125% integer device pixels).
 */
export const ButtonSmartGeometryCssVars = [
  ['--k3-button-smart-height', ButtonSmartHeightDp],
  ['--k3-button-smart-inset', ButtonSmartInsetDp],
  ['--k3-button-smart-icon-size', ButtonSmartIconBoxDp],
  ['--k3-button-smart-glyph', ButtonSmartGlyphDp],
  ['--k3-button-smart-radius-on', ButtonSmartRadiusOnDp],
  ['--k3-button-smart-fade', ButtonSmartFadeDp],
  ['--k3-button-smart-label-gap', ButtonSmartLabelGapDp],
  ['--k3-button-smart-label-size', ButtonSmartLabelSizeDp],
  ['--k3-button-smart-subtitle-size', ButtonSmartSubtitleSizeDp],
] as const;

export const ButtonSmartSpecs = {
  behaviors: {
    defaultActive: false,
    defaultActiveSubtitle: ButtonSmartDefaultActiveSubtitle,
    defaultInactiveSubtitle: ButtonSmartDefaultInactiveSubtitle,
    defaultHapticDuration: ButtonSmartDefaultHapticDuration,
    morphMs: ButtonSmartMorphMs,
    marqueeDelayMs: ButtonSmartMarqueeDelayMs,
    marqueeRestartDelayMs: ButtonSmartMarqueeRestartDelayMs,
    marqueeDpPerSecond: ButtonSmartMarqueeDpPerSecond,
  },
  accessibility: {
    role: 'button',
    autoDisableMarqueeForReducedMotion: true,
  },
  geometry: {
    heightDp: ButtonSmartHeightDp,
    insetDp: ButtonSmartInsetDp,
    padInlineStartDp: ButtonSmartPadInlineStartDp,
    padInlineEndDp: ButtonSmartPadInlineEndDp,
    iconBoxDp: ButtonSmartIconBoxDp,
    glyphDp: ButtonSmartGlyphDp,
    radiusOnDp: ButtonSmartRadiusOnDp,
    fadeDp: ButtonSmartFadeDp,
    labelGapDp: ButtonSmartLabelGapDp,
    gridGapDp: ButtonSmartGridGapDp,
  },
} as const;
