/**
 * Body-module drawing — isotropic stamps + neighbor-aware rotated stamps / pills.
 * Cell space is always 0…100 (one module) unless a stamp declares another `cell`.
 */

export type BodyNeighbors = {
  t: boolean;
  r: boolean;
  b: boolean;
  l: boolean;
};

type BodyStamp = { cell: number; markup: string };

/** Isotropic — same stamp every module (optional mosaic parity). */
const ISOTROPIC = new Set([
  'square',
  'mosaic',
  'dot',
  'circle',
  'star',
  'diamond',
  'japnese',
]);

/** Exact body stamp markups (design-space cell). */
const STAMPS: Record<string, BodyStamp> = {
  square: { cell: 100, markup: `<rect width="100" height="100"/>` },
  mosaic: { cell: 100, markup: `<polygon points="8,4 4,92 92,96 96,8"/>` },
  mosaicAlt: { cell: 100, markup: `<polygon points="4,8 8,96 96,92 92,4"/>` },
  dot: { cell: 100, markup: `<circle cx="50" cy="50" r="30"/>` },
  circle: {
    cell: 500,
    markup: `<path d="M250,0c138.077,0,250,111.93,250,250c0,138.077-111.923,250-250,250C111.93,500,0,388.077,0,250C0,111.93,111.93,0,250,0z"/>`,
  },
  japnese: {
    cell: 500,
    markup: `<path d="M250,0c138.077,0,250,111.93,250,250c0,138.077-111.923,250-250,250C111.93,500,0,388.077,0,250C0,111.93,111.93,0,250,0z"/>`,
  },
  diamond: { cell: 100, markup: `<polygon points="0,50 50,100 100,50 50,0"/>` },
  star: {
    cell: 100,
    markup: `<path d="M49.984,99.824C45.848,69.47,28.497,53.961-0.345,49.773 c29.054-3.697,45.791-19.659,50.348-49.949c4.404,29.487,20.907,45.691,49.652,49.975C70.729,54.051,54.532,70.407,49.984,99.824z"/>`,
  },
  /* Tombstone — round top, flat bottom. Rotate so flat faces neighbors. */
  circular: {
    cell: 500,
    markup: `<path d="M500,250c0,58.266,0,250,0,250s-170.194,0-250-0.012c-62.324,0.012-250,0-250,0s0-174.241,0-249.994 C0.006,111.931,111.929,0,249.994,0C388.064,0,500,111.93,500,250z"/>`,
  },
  /* Tip on top. */
  pointed: { cell: 100, markup: `<path d="M100,40.625V100H0V40.625L50,0L100,40.625z"/>` },
  'pointed-edge-cut': {
    cell: 100,
    markup: `<path d="M100,40.625V100H0V40.625L50,0L100,40.625z"/>`,
  },
  'pointed-smooth': {
    cell: 100,
    markup: `<path d="M100,40.625V100H0V40.625L50,0L100,40.625z"/>`,
  },
  /* Notch on top. */
  'pointed-in': { cell: 100, markup: `<path d="M0,0v100h100V0L50,28.125L0,0z"/>` },
  'pointed-in-smooth': {
    cell: 100,
    markup: `<path d="M0,0v100h100V0L50,28.125L0,0z"/>`,
  },
  /* Diagonal cut (top edge slanted). */
  'edge-cut': { cell: 100, markup: `<path d="M100,0v100H0V40.625L100,0z"/>` },
  'edge-cut-smooth': { cell: 100, markup: `<path d="M100,0v100H0V40.625L100,0z"/>` },
  /* Leaf / comma — curved body. */
  leaf: {
    cell: 100,
    markup: `<path d="M99.999,73.426C99.999,85.11,100,100,100,100s-34.008,0-49.953-0.001c-12.452,0.001-49.952,0-49.952,0V74.931 c0,0-2.101-65.501,13.486-73.267C37.695-10.353,99.999,45.737,99.999,73.426z"/>`,
  },
  /* Rounded outer, flat bottom. */
  round: {
    cell: 100,
    markup: `<path d="M100,34.375c0-9.505-3.354-17.611-10.059-24.316C83.236,3.354,75.13,0,65.625,0h-31.25C24.87,0,16.764,3.353,10.059,10.059 S0,24.87,0,34.375v31.25c0,0.521,0.065,1.303,0.195,2.344H0V100h100V67.969h-0.195c0.132-1.041,0.195-1.822,0.195-2.344V34.375z"/>`,
  },
  /* Concave top. */
  'rounded-in': {
    cell: 100,
    markup: `<path d="M0,0v100h100V0c-0.65,0.651-1.596,1.465-2.832,2.441s-3.744,2.702-7.52,5.176s-7.553,4.688-11.328,6.641 s-8.268,3.711-13.477,5.273S54.688,21.875,50,21.875s-9.603-0.749-14.746-2.246s-9.733-3.32-13.77-5.469S13.77,9.863,10.449,7.715 S4.557,3.776,2.734,2.344L0,0z"/>`,
  },
  'rounded-in-smooth': {
    cell: 100,
    markup: `<path d="M0,0v100h100V0c-0.65,0.651-1.596,1.465-2.832,2.441s-3.744,2.702-7.52,5.176s-7.553,4.688-11.328,6.641 s-8.268,3.711-13.477,5.273S54.688,21.875,50,21.875s-9.603-0.749-14.746-2.246s-9.733-3.32-13.77-5.469S13.77,9.863,10.449,7.715 S4.557,3.776,2.734,2.344L0,0z"/>`,
  },
  /* Triangle tip up. */
  'rounded-pointed': { cell: 100, markup: `<polygon points="100,100 50,0 0,100"/>` },
};

export function isStampBody(id: string): boolean {
  return ISOTROPIC.has(id);
}

/** Rotate degrees so stamp’s “special” edge faces the open side. */
function rotationFor(body: string, n: BodyNeighbors): number {
  const openT = !n.t;
  const openR = !n.r;
  const openB = !n.b;
  const openL = !n.l;
  const openCount = Number(openT) + Number(openR) + Number(openB) + Number(openL);

  /* Tip / notch / concave / triangle: feature on TOP of stamp → face open side. */
  const tipStyles = new Set([
    'pointed',
    'pointed-edge-cut',
    'pointed-smooth',
    'pointed-in',
    'pointed-in-smooth',
    'rounded-in',
    'rounded-in-smooth',
    'rounded-pointed',
    'round',
    'circular',
    'edge-cut',
    'edge-cut-smooth',
  ]);

  if (tipStyles.has(body)) {
    if (openCount === 1) {
      if (openT) return 0;
      if (openR) return 90;
      if (openB) return 180;
      if (openL) return 270;
    }
    /* Prefer vertical then horizontal when several opens. */
    if (openT && !openB) return 0;
    if (openB && !openT) return 180;
    if (openR && !openL) return 90;
    if (openL && !openR) return 270;
    return 0;
  }

  /* Leaf: alternate diagonal based on empty corners. */
  if (body === 'leaf') {
    const tl = openT && openL;
    const tr = openT && openR;
    const br = openB && openR;
    const bl = openB && openL;
    if (tr || bl) return 90;
    if (tl || br) return 0;
    if (openT) return 0;
    if (openR) return 90;
    if (openB) return 180;
    if (openL) return 270;
    return 0;
  }

  return 0;
}

function stampAt(
  ox: number,
  oy: number,
  mod: number,
  color: string,
  stamp: BodyStamp,
  rotDeg: number,
): string {
  const s = mod / stamp.cell;
  const c = stamp.cell / 2;
  if (!rotDeg) {
    return `<g transform="translate(${ox},${oy}) scale(${s})" fill="${color}">${stamp.markup}</g>`;
  }
  return `<g transform="translate(${ox},${oy}) scale(${s}) rotate(${rotDeg},${c},${c})" fill="${color}">${stamp.markup}</g>`;
}

/** Horizontal pills (zebra). */
function drawPillH(ox: number, oy: number, mod: number, color: string, n: BodyNeighbors): string {
  if (n.l && n.r) {
    return `<g transform="translate(${ox},${oy}) scale(${mod / 100})" fill="${color}"><rect width="100" height="100"/></g>`;
  }
  if (n.l) {
    return `<g transform="translate(${ox},${oy}) scale(${mod / 100})" fill="${color}"><path d="M0,0 H50 A50,50 0 0 1 50,100 H0 Z"/></g>`;
  }
  if (n.r) {
    return `<g transform="translate(${ox},${oy}) scale(${mod / 100})" fill="${color}"><path d="M50,0 H100 V100 H50 A50,50 0 0 1 50,0 Z"/></g>`;
  }
  return `<g transform="translate(${ox},${oy}) scale(${mod / 100})" fill="${color}"><circle cx="50" cy="50" r="50"/></g>`;
}

/** Vertical pills. */
function drawPillV(ox: number, oy: number, mod: number, color: string, n: BodyNeighbors): string {
  if (n.t && n.b) {
    return `<g transform="translate(${ox},${oy}) scale(${mod / 100})" fill="${color}"><rect width="100" height="100"/></g>`;
  }
  if (n.t) {
    return `<g transform="translate(${ox},${oy}) scale(${mod / 100})" fill="${color}"><path d="M0,0 V50 A50,50 0 0 0 100,50 V0 Z"/></g>`;
  }
  if (n.b) {
    return `<g transform="translate(${ox},${oy}) scale(${mod / 100})" fill="${color}"><path d="M0,50 A50,50 0 0 0 100,50 V100 H0 Z"/></g>`;
  }
  return `<g transform="translate(${ox},${oy}) scale(${mod / 100})" fill="${color}"><circle cx="50" cy="50" r="50"/></g>`;
}

/**
 * Knob — circle + rectangular bridges toward neighbors (pinched “beads”).
 * `smooth` uses a larger circle / wider bridge so joins read softer.
 */
function drawKnob(
  ox: number,
  oy: number,
  mod: number,
  color: string,
  n: BodyNeighbors,
  smooth: boolean,
): string {
  const r = smooth ? 44 : 38;
  const hw = smooth ? 30 : 22;
  const parts: string[] = [`<circle cx="50" cy="50" r="${r}"/>`];
  if (n.t) parts.push(`<rect x="${50 - hw}" y="0" width="${hw * 2}" height="50"/>`);
  if (n.b) parts.push(`<rect x="${50 - hw}" y="50" width="${hw * 2}" height="50"/>`);
  if (n.l) parts.push(`<rect x="0" y="${50 - hw}" width="50" height="${hw * 2}"/>`);
  if (n.r) parts.push(`<rect x="50" y="${50 - hw}" width="50" height="${hw * 2}"/>`);
  return `<g transform="translate(${ox},${oy}) scale(${mod / 100})" fill="${color}">${parts.join('')}</g>`;
}

/**
 * Draw one dark module at grid (col,row) into pixel space (ox,oy) with size `mod`.
 */
export function drawBodyModule(
  body: string,
  col: number,
  row: number,
  ox: number,
  oy: number,
  mod: number,
  color: string,
  n: BodyNeighbors,
): string {
  if (body === 'circle-zebra') return drawPillH(ox, oy, mod, color, n);
  if (body === 'circle-zebra-vertical') return drawPillV(ox, oy, mod, color, n);
  if (body === 'knob') return drawKnob(ox, oy, mod, color, n, false);
  if (body === 'knob-smooth') return drawKnob(ox, oy, mod, color, n, true);

  if (body === 'mosaic') {
    const stamp = (col + row) % 2 === 0 ? STAMPS.mosaic! : STAMPS.mosaicAlt!;
    return stampAt(ox, oy, mod, color, stamp, 0);
  }

  const stamp = STAMPS[body] ?? STAMPS.square!;
  if (ISOTROPIC.has(body)) {
    return stampAt(ox, oy, mod, color, stamp, 0);
  }

  const rot = rotationFor(body, n);
  return stampAt(ox, oy, mod, color, stamp, rot);
}

/**
 * Fixed preview matrix (8×8) — characteristic cluster for procedural fallbacks.
 * Prefer `QR_BODY_PREVIEW_PNG` for the picker.
 */
export const BODY_PREVIEW_MATRIX: readonly (readonly number[])[] = [
  [0, 1, 1, 0, 1, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 0, 1, 0, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [1, 1, 0, 1, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 0, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

/** Render a small preview SVG for a body style (picker fallback). */
export function renderBodyPreviewSvg(body: string, size = 44, color = 'currentColor'): string {
  const m = BODY_PREVIEW_MATRIX;
  const rows = m.length;
  const cols = m[0]!.length;
  const mod = size / cols;
  const parts: string[] = [];
  const dark = (x: number, y: number) => !!m[y]?.[x];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!dark(x, y)) continue;
      const n: BodyNeighbors = {
        t: dark(x, y - 1),
        r: dark(x + 1, y),
        b: dark(x, y + 1),
        l: dark(x - 1, y),
      };
      parts.push(drawBodyModule(body, x, y, x * mod, y * mod, mod, color, n));
    }
  }
  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${parts.join('')}</svg>`;
}
