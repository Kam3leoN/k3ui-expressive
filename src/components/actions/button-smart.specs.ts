/**
 * Button Smart tokens — Material You Quick Settings tile (AOSP `qs_tile_*`).
 *
 * Morph pill (OFF) ⇄ squircle (ON), AOSP marquee, light haptic.
 *
 * @see https://cs.android.com/android/platform/superproject/main/+/main:frameworks/base/packages/SystemUI/res/values/dimens.xml
 * @see https://m3.material.io/styles/color/system/overview
 */

/** Tile height — AOSP `qs_tile_height`. */
export const ButtonSmartHeightDp = 80;

/**
 * Vertical / chrome inset — AOSP `qs_tile_padding` (12).
 * Icon box = height − 2×padding = 56.
 */
export const ButtonSmartInsetDp = 12;

/** Leading padding — AOSP `qs_tile_start_padding`. */
export const ButtonSmartPadInlineStartDp = 16;

/** Trailing padding after text (match start for balance). */
export const ButtonSmartPadInlineEndDp = 16;

/** Icon circle / squircle box (dp) — 80 − 2×12. */
export const ButtonSmartIconBoxDp = ButtonSmartHeightDp - 2 * ButtonSmartInsetDp;

/** Glyph inside icon box — AOSP `qs_icon_size`. */
export const ButtonSmartGlyphDp = 20;

/**
 * ON corner radius (squircle). OFF = height/2 pill.
 * Between pill (40) and sharp — Material You active tile look.
 */
export const ButtonSmartRadiusOnDp = 24;

/** Marquee edge fade mask (dp). */
export const ButtonSmartFadeDp = 14;

/** Gap icon → label — AOSP `qs_label_container_margin`. */
export const ButtonSmartLabelGapDp = 10;

/** Label type size — AOSP `qs_tile_text_size` (14sp ≈ 14dp). */
export const ButtonSmartLabelSizeDp = 14;

/** Subtitle type size (dp). */
export const ButtonSmartSubtitleSizeDp = 12;

/** Parent 2-col grid gap — AOSP `qs_tile_margin_horizontal`. */
export const ButtonSmartGridGapDp = 8;

/** Morph duration (ms) — M3 spatial-fast / emphasized. */
export const ButtonSmartMorphMs = 350;

/** AOSP marquee: delay before first scroll (ms). */
export const ButtonSmartMarqueeDelayMs = 1200;

/** AOSP marquee: pause between loops (ms). */
export const ButtonSmartMarqueeRestartDelayMs = 1200;

/** AOSP marquee scroll speed (dp/s). */
export const ButtonSmartMarqueeDpPerSecond = 30;

/** Default haptic pulse (ms). `0` → `haptic.light()`. */
export const ButtonSmartDefaultHapticDuration = 15;

/**
 * Default active subtitle (English).
 * For locale-aware UI use `i18n.t('switch.on')` (FR: « Activé »).
 */
export const ButtonSmartDefaultActiveSubtitle = 'On';

export const ButtonSmartDefaultInactiveSubtitle = '';

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
