/**
 * Home “Behind k3ui” band — Cookie/Flower clips + spinning portrait (clip only).
 * Avatar is a local animated GIF (`/avatars/kam3leon.gif`).
 */
import {
  MATERIAL_SHAPE_SVG,
  type MaterialShapeName,
} from '../../src/shapes/index.js';

const COOKIE: MaterialShapeName = 'Cookie12Sided';
const FLOWER: MaterialShapeName = 'Flower';
/** Playground public asset — animated GIF. */
export const AVATAR_SRC = '/avatars/kam3leon.gif';
const CLIP_ID = 'home-about-spin-clip';

function ensureClipDefs(host: HTMLElement): void {
  let defs = host.querySelector('svg.home-about__defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    defs.classList.add('home-about__defs');
    defs.setAttribute('aria-hidden', 'true');
    defs.setAttribute('focusable', 'false');
    host.prepend(defs);
  }
  defs.innerHTML = `
    <defs>
      <clipPath id="home-about-cookie" clipPathUnits="objectBoundingBox">
        <path d="${MATERIAL_SHAPE_SVG[COOKIE]}" />
      </clipPath>
      <clipPath id="home-about-flower" clipPathUnits="objectBoundingBox">
        <path d="${MATERIAL_SHAPE_SVG[FLOWER]}" />
      </clipPath>
    </defs>
  `;
}

/**
 * HTML `<img>` keeps the GIF animating; only the Cookie clip path rotates
 * (SVG `<image>` often freezes GIFs).
 */
function mountSpinningPortrait(host: HTMLElement): void {
  const frame = host.querySelector('.home-about__frame');
  if (!frame) return;
  frame.innerHTML = `
    <svg class="home-about__spin-defs" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="${CLIP_ID}" clipPathUnits="objectBoundingBox">
          <path class="home-about__spin-clip" d="${MATERIAL_SHAPE_SVG[COOKIE]}"></path>
        </clipPath>
      </defs>
    </svg>
    <img
      class="home-about__photo"
      src="${AVATAR_SRC}"
      width="440"
      height="440"
      alt="Portrait of Kam3leoN"
      decoding="async"
    />
  `;
}

export function mountHomeAbout(): void {
  const host = document.getElementById('home-about');
  if (!host) return;
  ensureClipDefs(host);
  mountSpinningPortrait(host);
  const mini = host.querySelector<HTMLImageElement>('.home-about__profile-av img');
  if (mini) mini.src = AVATAR_SRC;
}

export function syncHomeAboutI18n(): void {
  /* Static data-i18n nodes — playground locale pass already covers them. */
}
