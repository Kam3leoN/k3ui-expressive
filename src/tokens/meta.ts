/**
 * M3 Styles token catalogs — for docs / playground / tooling.
 * Values live in CSS (`src/tokens/_*.scss`); this lists names + labels.
 *
 * @see https://m3.material.io/styles
 */

export const M3_STYLE_CATEGORIES = [
  'color',
  'elevation',
  'icons',
  'motion',
  'shape',
  'spacing',
  'typography',
] as const;

export type M3StyleCategory = (typeof M3_STYLE_CATEGORIES)[number];

/** Spacing scale — spaceN = 8dp × (N/100). */
export const SPACING_TOKENS = [
  { token: 'space0', css: '--k3-sys-spacing-space0', dp: 0 },
  { token: 'space25', css: '--k3-sys-spacing-space25', dp: 2 },
  { token: 'space50', css: '--k3-sys-spacing-space50', dp: 4 },
  { token: 'space75', css: '--k3-sys-spacing-space75', dp: 6 },
  { token: 'space100', css: '--k3-sys-spacing-space100', dp: 8 },
  { token: 'space125', css: '--k3-sys-spacing-space125', dp: 10 },
  { token: 'space150', css: '--k3-sys-spacing-space150', dp: 12 },
  { token: 'space175', css: '--k3-sys-spacing-space175', dp: 14 },
  { token: 'space200', css: '--k3-sys-spacing-space200', dp: 16 },
  { token: 'space225', css: '--k3-sys-spacing-space225', dp: 18 },
  { token: 'space250', css: '--k3-sys-spacing-space250', dp: 20 },
  { token: 'space300', css: '--k3-sys-spacing-space300', dp: 24 },
  { token: 'space400', css: '--k3-sys-spacing-space400', dp: 32 },
  { token: 'space450', css: '--k3-sys-spacing-space450', dp: 36 },
  { token: 'space500', css: '--k3-sys-spacing-space500', dp: 40 },
  { token: 'space600', css: '--k3-sys-spacing-space600', dp: 48 },
  { token: 'space700', css: '--k3-sys-spacing-space700', dp: 56 },
  { token: 'space800', css: '--k3-sys-spacing-space800', dp: 64 },
  { token: 'space900', css: '--k3-sys-spacing-space900', dp: 72 },
] as const;

export const ELEVATION_TOKENS = [
  { level: 0, css: '--k3-sys-elevation-level0' },
  { level: 1, css: '--k3-sys-elevation-level1' },
  { level: 2, css: '--k3-sys-elevation-level2' },
  { level: 3, css: '--k3-sys-elevation-level3' },
  { level: 4, css: '--k3-sys-elevation-level4' },
  { level: 5, css: '--k3-sys-elevation-level5' },
] as const;

export const ICON_SIZE_TOKENS = [
  { name: 'small', css: '--k3-sys-icon-size-small', dp: 20, opsz: 20 },
  { name: 'medium', css: '--k3-sys-icon-size-medium', dp: 24, opsz: 24 },
  { name: 'large', css: '--k3-sys-icon-size-large', dp: 40, opsz: 40 },
  { name: 'extra-large', css: '--k3-sys-icon-size-extra-large', dp: 48, opsz: 48 },
] as const;

export const SHAPE_CORNER_TOKENS = [
  { name: 'none', css: '--k3-sys-shape-corner-none', dp: 0 },
  { name: 'extra-small', css: '--k3-sys-shape-corner-extra-small', dp: 4 },
  { name: 'small', css: '--k3-sys-shape-corner-small', dp: 8 },
  { name: 'medium', css: '--k3-sys-shape-corner-medium', dp: 12 },
  { name: 'large', css: '--k3-sys-shape-corner-large', dp: 16 },
  { name: 'large-increased', css: '--k3-sys-shape-corner-large-increased', dp: 20 },
  { name: 'extra-large', css: '--k3-sys-shape-corner-extra-large', dp: 28 },
  { name: 'extra-large-increased', css: '--k3-sys-shape-corner-extra-large-increased', dp: 32 },
  { name: 'extra-extra-large', css: '--k3-sys-shape-corner-extra-extra-large', dp: 48 },
  { name: 'full', css: '--k3-sys-shape-corner-full', dp: null },
] as const;

export const TYPE_ROLES = [
  'display-large',
  'display-medium',
  'display-small',
  'headline-large',
  'headline-medium',
  'headline-small',
  'title-large',
  'title-medium',
  'title-small',
  'body-large',
  'body-medium',
  'body-small',
  'label-large',
  'label-medium',
  'label-small',
] as const;

export const MOTION_DURATION_TOKENS = [
  'short1',
  'short2',
  'short3',
  'short4',
  'medium1',
  'medium2',
  'medium3',
  'medium4',
  'long1',
  'long2',
  'long3',
  'long4',
  'extra-long1',
  'extra-long2',
  'extra-long3',
  'extra-long4',
  'spatial-fast',
  'spatial-default',
  'spatial-slow',
  'effects-fast',
  'effects-default',
  'effects-slow',
] as const;
