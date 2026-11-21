import { html, type TemplateResult } from 'lit';
import {
  MATERIAL_SHAPE_SVG,
  type MaterialShapeName,
} from '@k3ui/shapes/index.js';

export type { MaterialShapeName };

/** Filled Material 3 Expressive shape glyph (no circle chrome). */
export function shapeIcon(
  name: MaterialShapeName,
  className = 'shape-icon',
): TemplateResult {
  return html`
    <svg
      class=${className}
      viewBox="0 0 1 1"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="currentColor" d=${MATERIAL_SHAPE_SVG[name]}></path>
    </svg>
  `;
}

/**
 * Portrait painted into a Material shape path (static — list rows, etc.).
 */
export function shapeAvatar(
  name: MaterialShapeName,
  src: string,
  className = 'shape-avatar',
  patternId: string,
): TemplateResult {
  const d = MATERIAL_SHAPE_SVG[name];
  return html`
    <svg
      class=${className}
      viewBox="0 0 1 1"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern
          id=${patternId}
          x="0"
          y="0"
          width="1"
          height="1"
          patternUnits="userSpaceOnUse"
        >
          <image
            href=${src}
            x="0"
            y="0"
            width="1"
            height="1"
            preserveAspectRatio="xMidYMid slice"
          ></image>
        </pattern>
      </defs>
      <path d=${d} fill="url(#${patternId})"></path>
    </svg>
  `;
}

/**
 * Face stays fixed; only the shape clip path rotates
 * (`.shape-avatar-spin__clip` is animated in CSS).
 */
export function shapeAvatarSpinning(
  name: MaterialShapeName,
  src: string,
  className = 'shape-avatar-spin',
  clipId: string,
): TemplateResult {
  const d = MATERIAL_SHAPE_SVG[name];
  return html`
    <svg
      class=${className}
      viewBox="0 0 1 1"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id=${clipId} clipPathUnits="userSpaceOnUse">
          <path class="shape-avatar-spin__clip" d=${d}></path>
        </clipPath>
      </defs>
      <image
        href=${src}
        x="0"
        y="0"
        width="1"
        height="1"
        preserveAspectRatio="xMidYMid slice"
        clip-path="url(#${clipId})"
      ></image>
    </svg>
  `;
}
