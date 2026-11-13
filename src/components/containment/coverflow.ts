import { html, css, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { K3Element, FocusTrap, isRtl, overlayStack, prefersReducedMotion } from '../../core/index.js';
import { i18n } from '../../i18n/index.js';
import './coverflow-item.js';
import type { K3CoverflowItem } from './coverflow-item.js';
import {
  CoverflowSpecs,
  coverflowBulletWeight,
  coverflowFit,
  coverflowOffset,
  coverflowPose,
  coverflowSlidePose,
  coverflowSlideVisible,
  coverflowSnap,
  coverflowSpring,
  coverflowTransform,
  safeCoverflowHref,
  wrapIndex,
  type CoverflowGeometry,
} from './coverflow.specs.js';

export type CoverflowMode = 'loop' | 'bounded';
export type CoverflowOrientation = 'horizontal' | 'vertical';
export type CoverflowEffect = 'coverflow' | 'slide';

type PopoverElement = HTMLElement & { showPopover?: () => void; hidePopover?: () => void };

const chevron = (d: string) =>
  html`<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d=${d} /></svg>`;
const CHEVRON_PREV = 'M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z';
const CHEVRON_NEXT = 'M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z';
/** Resolves once `src` is decoded (or failed, or after `timeout` ms). */
function preload(src: string, timeout = 500): Promise<void> {
  if (typeof Image !== 'function') return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    const done = () => resolve();
    const timer = setTimeout(done, timeout);
    img.onload = img.onerror = () => {
      clearTimeout(timer);
      done();
    };
    img.decoding = 'async';
    img.src = src;
    if (img.complete) {
      clearTimeout(timer);
      done();
    }
  });
}

const CLOSE = 'M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z';

/**
 * `k3-coverflow` — 3D cover flow. The centred cover faces the viewer, the
 * others turn towards it on both sides, with an optional mirror reflection.
 * Endless by default (`mode="bounded"` stops at the ends).
 *
 * No captions, categories or scrollbar: covers only. Each cover is a link
 * (`href`) or turns over (`flip`) once centred — see `k3-coverflow-item`.
 * With `lightbox`, link covers open their target image in a built-in viewer
 * (scrim, arrows, Escape) instead of navigating.
 *
 * Options: `arrows` (side buttons), `bullets` (the active one 3× wider,
 * following the motion), `full-width` (side covers reach the edges of the
 * container — top and bottom when vertical), `orientation="vertical"` (covers
 * stacked top to bottom and tilting around x; ↑ ↓, vertical drag and wheel,
 * height from `--k3-coverflow-height`, no reflection), `effect="slide"` (no
 * 3D: a flat row filling the viewport where the centred cover grows to
 * `active-scale`, both orientations; same optional mirror reflection as coverflow).
 *
 * Navigation: drag / swipe (with momentum), click a side cover, ← → Home End,
 * horizontal wheel / trackpad (`wheel` adds the vertical wheel).
 *
 * ```html
 * <k3-coverflow label="Gallery" lightbox arrows bullets>
 *   <k3-coverflow-item href="big/1.webp"><img src="1.webp" alt="Dunes" /></k3-coverflow-item>
 *   <k3-coverflow-item href="big/2.webp"><img src="2.webp" alt="Aurora" /></k3-coverflow-item>
 * </k3-coverflow>
 * ```
 *
 * Events: `k3-change` `{ index }` once a new cover is centred;
 * `k3-open` / `k3-close` `{ index }` for the lightbox.
 *
 * @cssprop --k3-coverflow-item-width  - cover width (default 14rem)
 * @cssprop --k3-coverflow-item-height - cover height (default 14rem)
 * @cssprop --k3-coverflow-item-shape  - cover corner radius
 * @cssprop --k3-coverflow-bullet-size - inactive bullet size (default 8px)
 * @cssprop --k3-coverflow-height      - viewport height when vertical (default 2.6 × cover height)
 * @cssprop --k3-coverflow-scrim       - lightbox scrim colour
 * @csspart viewport - clipping, perspective, gesture surface
 * @csspart stage    - 3D stage holding the covers
 * @csspart arrow    - side buttons (also `arrow-prev`, `arrow-next`)
 * @csspart bullets  - bullet row; `bullet` each bullet
 * @csspart lightbox - lightbox scrim / layer; `lightbox-image`, `lightbox-button`
 */
export class K3Coverflow extends K3Element {
  static override styles = css`
    :host {
      display: block;
      position: relative;
      box-sizing: border-box;
      inline-size: 100%;
      --_w: var(--k3-coverflow-item-width, 14rem);
      --_h: var(--k3-coverflow-item-height, 14rem);
      --_b: var(--k3-coverflow-bullet-size, 8px);
      --_ease: var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1));
    }
    .frame {
      position: relative;
    }
    .viewport {
      position: relative;
      overflow: clip;
      /* = CoverflowSpecs.perspective */
      perspective: calc(var(--_w) * 3.2);
      perspective-origin: 50% 45%;
      padding-block: calc(var(--_h) * 0.12) calc(var(--_h) * 0.12);
      touch-action: pan-y;
      user-select: none;
      -webkit-user-select: none;
      cursor: grab;
      outline: none;
    }
    :host([data-reflect]) .viewport {
      padding-block-end: calc(var(--_h) * 0.5);
    }
    .viewport.dragging {
      cursor: grabbing;
    }
    .stage {
      position: relative;
      block-size: var(--_h);
      transform-style: preserve-3d;
      /* Its z = 0 plane would hide the covers set back in depth from hit testing */
      pointer-events: none;
    }

    /* ── Slide: flat row, room for the grown centre cover ─────────────── */
    :host([effect='slide']:not([orientation='vertical'])) .viewport {
      /* Shorthand would wipe data-reflect's extra padding-block-end */
      padding-block-start: calc(var(--_h) * (var(--_s, 1.4) - 1) / 2 + 16px);
      padding-block-end: calc(var(--_h) * (var(--_s, 1.4) - 1) / 2 + 16px);
    }
    :host([effect='slide'][data-reflect]:not([orientation='vertical'])) .viewport {
      padding-block-end: calc(var(--_h) * (var(--_s, 1.4) - 1) / 2 + 16px + var(--_h) * 0.5);
    }
    :host([effect='slide']:not([orientation='vertical'])) .arrow {
      inset-block-start: calc(var(--_h) * (var(--_s, 1.4) - 1) / 2 + 16px + var(--_h) / 2 - 24px);
    }

    /* ── Vertical: covers stacked top to bottom, tilting around x ─────── */
    :host([orientation='vertical']) .viewport {
      box-sizing: border-box;
      block-size: var(--k3-coverflow-height, calc(var(--_h) * 2.6));
      padding-block: 0;
      perspective: calc(var(--_h) * 3.2);
      perspective-origin: 50% 50%;
      touch-action: pan-x;
      /* Covers fade out at the top and bottom edges */
      -webkit-mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent);
      mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent);
    }
    :host([orientation='vertical']) .stage {
      position: absolute;
      inset-inline: 0;
      inset-block-start: calc(50% - var(--_h) / 2);
    }

    /* ── Side arrows ─────────────────────────────────────────────────── */
    .arrow,
    .lb-button {
      appearance: none;
      position: absolute;
      display: grid;
      place-items: center;
      box-sizing: border-box;
      inline-size: 48px;
      block-size: 48px;
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
      fill: currentColor;
      -webkit-tap-highlight-color: transparent;
      transition:
        background-color 150ms linear,
        opacity 150ms linear,
        transform 200ms var(--_ease);
    }
    .arrow {
      inset-block-start: calc(var(--_h) * 0.12 + var(--_h) / 2 - 24px);
      z-index: 1;
      color: var(--k3-sys-color-on-surface);
      background: color-mix(in srgb, var(--k3-sys-color-surface-container-highest, #e6e0e9) 88%, transparent);
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.2), 0 4px 10px rgb(0 0 0 / 0.12);
      backdrop-filter: blur(6px);
    }
    .arrow.prev {
      inset-inline-start: 8px;
    }
    .arrow.next {
      inset-inline-end: 8px;
    }
    .arrow:hover {
      background: color-mix(
        in srgb,
        var(--k3-sys-color-on-surface, #1d1b20) 8%,
        var(--k3-sys-color-surface-container-highest, #e6e0e9)
      );
    }
    .arrow:active,
    .lb-button:active {
      transform: scale(0.92);
    }
    .arrow:disabled {
      opacity: 0;
      pointer-events: none;
    }
    :host(:dir(rtl)) .arrow svg,
    :host(:dir(rtl)) .lb-nav svg {
      transform: scaleX(-1);
    }
    /* Vertical: up / down, stacked on the inline-start side */
    :host([orientation='vertical']) .arrow {
      inset-inline: 12px auto;
    }
    :host([orientation='vertical']) .arrow.prev {
      inset-block-start: calc(50% - 56px);
    }
    :host([orientation='vertical']) .arrow.next {
      inset-block-start: calc(50% + 8px);
    }
    :host([orientation='vertical']) .arrow svg {
      transform: rotate(90deg);
    }

    /* ── Bullets ─────────────────────────────────────────────────────── */
    .bullets {
      position: relative;
      z-index: 1;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      margin-block-start: 8px;
    }
    :host([data-reflect]) .bullets {
      /* Sit in the fading part of the reflection */
      margin-block-start: calc(var(--_h) * -0.16);
    }
    .bullet {
      appearance: none;
      display: grid;
      place-items: center;
      min-block-size: 24px;
      margin: 0;
      padding: 0 8px;
      border: 0;
      border-radius: 12px;
      background: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .bullet::before {
      content: '';
      display: block;
      block-size: var(--_b);
      /* --t: 0 … 1, follows the stage position (set every frame) */
      inline-size: calc(var(--_b) * (1 + 2 * var(--t, 0)));
      border-radius: var(--_b);
      background: color-mix(
        in srgb,
        var(--k3-sys-color-primary, #6750a4) calc(var(--t, 0) * 100%),
        var(--k3-sys-color-outline-variant, #cac4d0)
      );
    }
    .bullet:hover::before {
      background: color-mix(
        in srgb,
        var(--k3-sys-color-primary, #6750a4) calc(30% + var(--t, 0) * 70%),
        var(--k3-sys-color-outline-variant, #cac4d0)
      );
    }

    /* Vertical: a column on the inline-end side, the active bullet 3× taller */
    :host([orientation='vertical']) .bullets {
      position: absolute;
      inset-inline-end: 8px;
      inset-block-start: 50%;
      flex-direction: column;
      flex-wrap: nowrap;
      margin: 0;
      transform: translateY(-50%);
    }
    :host([orientation='vertical']) .bullet {
      min-block-size: 0;
      min-inline-size: 24px;
      padding: 8px 0;
    }
    :host([orientation='vertical']) .bullet::before {
      inline-size: var(--_b);
      block-size: calc(var(--_b) * (1 + 2 * var(--t, 0)));
    }

    .arrow:focus-visible,
    .bullet:focus-visible,
    .lb-button:focus-visible {
      outline: 3px solid var(--k3-sys-color-secondary, #625b71);
      outline-offset: 2px;
    }

    /* ── Lightbox (top layer through the Popover API, not <dialog>) ───── */
    .lightbox {
      position: fixed;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      max-inline-size: none;
      max-block-size: none;
      margin: 0;
      padding: 0;
      border: 0;
      overflow: hidden;
      z-index: 2147483000;
      display: grid;
      place-items: center;
      box-sizing: border-box;
      color: #fff;
      background: var(--k3-coverflow-scrim, color-mix(in srgb, var(--k3-sys-color-scrim, #000) 82%, transparent));
      opacity: 0;
      transition: opacity 220ms linear;
      overscroll-behavior: contain;
      touch-action: none;
    }
    .lightbox.open {
      opacity: 1;
    }
    .lb-image {
      display: block;
      max-inline-size: min(92vw, 1200px);
      max-block-size: 84vh;
      inline-size: auto;
      block-size: auto;
      border-radius: var(--k3-sys-shape-corner-large, 16px);
      box-shadow: 0 24px 64px rgb(0 0 0 / 0.5);
      transform: scale(0.9);
      transition: transform 380ms var(--_ease);
      user-select: none;
      -webkit-user-drag: none;
    }
    .lightbox.open .lb-image {
      transform: none;
    }
    .lb-button {
      color: #fff;
      background: rgb(255 255 255 / 0.14);
      backdrop-filter: blur(8px);
    }
    .lb-button:hover {
      background: rgb(255 255 255 / 0.26);
    }
    .lb-close {
      inset-block-start: max(16px, env(safe-area-inset-top));
      inset-inline-end: max(16px, env(safe-area-inset-right));
    }
    .lb-nav {
      inset-block-start: calc(50% - 24px);
    }
    .lb-nav.prev {
      inset-inline-start: max(12px, env(safe-area-inset-left));
    }
    .lb-nav.next {
      inset-inline-end: max(12px, env(safe-area-inset-right));
    }

    @media (prefers-reduced-motion: reduce) {
      .lightbox,
      .lb-image,
      .arrow,
      .lb-button {
        transition: none;
      }
    }
    :host-context([data-k3-reduce-motion]) .lightbox,
    :host-context([data-k3-reduce-motion]) .lb-image {
      transition: none;
    }
    @media (forced-colors: active) {
      .arrow,
      .lb-button {
        border: 1px solid ButtonText;
      }
      .bullet::before {
        background: CanvasText;
        opacity: calc(0.4 + var(--t, 0) * 0.6);
      }
    }

    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
  `;

  /** Accessible name of the cover flow. */
  @property() label = '';
  /** Centred cover. */
  @property({ type: Number, reflect: true }) index = 0;
  /** `loop` (endless, default) · `bounded` (stops at both ends). */
  @property({ reflect: true }) mode: CoverflowMode = 'loop';
  /** `horizontal` (default) · `vertical`: covers stacked top to bottom, tilting around x. */
  @property({ reflect: true }) orientation: CoverflowOrientation = 'horizontal';
  /** `coverflow` (3D, default) · `slide`: flat row, the centred cover grows. */
  @property({ reflect: true }) effect: CoverflowEffect = 'coverflow';
  /** `effect="slide"`: scale of the centred cover. */
  @property({ type: Number, attribute: 'active-scale' }) activeScale: number = CoverflowSpecs.slideScale;
  /** Side rotation in degrees. */
  @property({ type: Number }) angle: number = CoverflowSpecs.angle;
  /** Centre → first side cover, as a fraction of the cover width. */
  @property({ type: Number }) gap: number = CoverflowSpecs.gap;
  /** Between side covers, as a fraction of the cover width (computed with `full-width`). */
  @property({ type: Number }) spacing: number = CoverflowSpecs.spacing;
  /** Depth of the side covers, as a fraction of the cover width. */
  @property({ type: Number }) depth: number = CoverflowSpecs.depth;
  /** Side covers shown on each side (computed with `full-width`). */
  @property({ type: Number }) visible: number = CoverflowSpecs.visible;
  /** No mirror reflection under the covers. */
  @property({ type: Boolean, attribute: 'no-reflection' }) noReflection = false;
  /** The vertical mouse wheel also moves the covers (horizontal always does). */
  @property({ type: Boolean }) wheel = false;
  /** Previous / next buttons on the sides. */
  @property({ type: Boolean, reflect: true }) arrows = false;
  /** Bullets under the covers — the active one 3× wider, following the motion. */
  @property({ type: Boolean, reflect: true }) bullets = false;
  /** Side covers spread to the edges of the container (spacing and count computed). */
  @property({ type: Boolean, reflect: true, attribute: 'full-width' }) fullWidth = false;
  /** Link covers open their target image in a lightbox instead of navigating. */
  @property({ type: Boolean, reflect: true }) lightbox = false;

  @state() private announcement = '';
  @state() private count = 0;
  /** Lightbox content while open. */
  @state() private viewer: { src: string; alt: string; index: number } | null = null;
  @state() private viewerShown = false;

  /** Continuous stage position (items) and its target — unbounded in loop mode. */
  private position = 0;
  private target = 0;
  private velocity = 0;
  private frame = 0;
  private lastTime = 0;
  private itemWidth = 0;
  private itemHeight = 0;
  /** Viewport size along the main axis (width, or height when vertical). */
  private viewportSize = 0;
  private fit: { visible: number; spacing: number } | null = null;
  private ro: ResizeObserver | null = null;
  private settledIndex = -1;
  /** A gesture moved the stage — the click that ends it must not activate. */
  private suppressClick = false;
  private drag: {
    id: number;
    x: number;
    start: number;
    moved: boolean;
    samples: Array<{ t: number; p: number }>;
  } | null = null;
  private wheelAcc = 0;
  private wheelTimer = 0;
  private trap = new FocusTrap();
  private viewerTimer = 0;
  /** Latest lightbox request — older image loads are ignored. */
  private viewerToken = 0;

  private get items(): K3CoverflowItem[] {
    return [...this.children].filter((el): el is K3CoverflowItem => el.localName === 'k3-coverflow-item');
  }

  /**
   * Own computed direction — the side arrows and bullets follow CSS, so the
   * covers must too (an ltr block inside an rtl page stays ltr).
   */
  private isRtl(): boolean {
    try {
      const d = getComputedStyle(this).direction;
      if (d === 'rtl' || d === 'ltr') return d === 'rtl';
    } catch {
      /* not styled */
    }
    return isRtl(this);
  }

  private get vertical(): boolean {
    return this.orientation === 'vertical';
  }

  /** Cover size along the main axis. */
  private get itemSize(): number {
    return (this.vertical ? this.itemHeight : this.itemWidth) || 224;
  }

  private get loop(): boolean {
    return this.mode !== 'bounded';
  }

  private geometry(): CoverflowGeometry {
    const fit = this.fullWidth ? this.fit : null;
    return {
      width: this.itemSize,
      angle: this.angle,
      gap: this.gap,
      spacing: fit?.spacing ?? this.spacing,
      depth: this.depth,
      visible: Math.max(0, fit?.visible ?? this.visible),
    };
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
    this.setAttribute('aria-roledescription', i18n.t('coverflow.roledescription', 'cover flow'));
    this.addEventListener('keydown', this.onKeyDown);
    this.addEventListener('click', this.onClick, true);
    if (typeof ResizeObserver === 'function') {
      this.ro = new ResizeObserver(() => this.measure());
      this.ro.observe(this);
    }
  }

  override disconnectedCallback(): void {
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('click', this.onClick, true);
    this.ro?.disconnect();
    this.ro = null;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    clearTimeout(this.wheelTimer);
    if (this.viewer) this.teardownViewer(false);
    super.disconnectedCallback();
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('label')) {
      if (this.label) this.setAttribute('aria-label', this.label);
    }
    this.toggleAttribute('data-reflect', this.reflects);
    if (changed.has('activeScale') || changed.has('effect')) {
      if (this.slide) this.style.setProperty('--_s', String(this.slideScale));
      else this.style.removeProperty('--_s');
    }
  }

  /** Mirror reflection: under horizontal covers (3D and slide); never when vertical. */
  private get reflects(): boolean {
    return !this.noReflection && !this.vertical;
  }

  private get slide(): boolean {
    return this.effect === 'slide';
  }

  private get slideScale(): number {
    return Number.isFinite(this.activeScale) && this.activeScale > 0 ? this.activeScale : CoverflowSpecs.slideScale;
  }

  override firstUpdated(): void {
    this.position = this.target = this.clampTarget(this.index);
    /* The initial cover is not a change */
    this.settledIndex = this.items.length ? wrapIndex(this.target, this.items.length) : -1;
    this.syncItems();
    this.measure();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('index') && changed.get('index') !== undefined && wrapIndex(this.target, this.items.length) !== this.index) {
      this.goTo(this.index);
    }
    if (changed.has('orientation') && changed.get('orientation') !== undefined) this.measure(true);
    if (changed.has('fullWidth')) this.refit();
    if (
      changed.has('angle') ||
      changed.has('gap') ||
      changed.has('spacing') ||
      changed.has('depth') ||
      changed.has('visible') ||
      changed.has('mode') ||
      changed.has('noReflection') ||
      changed.has('orientation') ||
      changed.has('effect') ||
      changed.has('activeScale') ||
      changed.has('fullWidth') ||
      changed.has('lightbox')
    ) {
      this.syncItems();
      this.applyPoses();
    }
    /* New bullets / arrows rendered: paint their state for the current position */
    if (changed.has('count') || changed.has('bullets')) this.applyPoses();
    if (changed.has('viewer') && this.viewer && !changed.get('viewer')) this.showViewer();
  }

  /* ── Public API ─────────────────────────────────────────────────────── */

  /** Centre cover `index` (shortest way round in loop mode). */
  goTo(index: number, opts: { animate?: boolean } = {}): void {
    const count = this.items.length;
    if (!count) return;
    let next: number;
    if (this.loop) {
      next = this.target + coverflowOffset(wrapIndex(index, count), this.target, count, true);
      next = Math.round(next);
    } else {
      next = this.clampTarget(index);
    }
    this.setTarget(next, opts.animate !== false);
  }

  next(): void {
    this.setTarget(this.clampTarget(this.target + 1), true);
  }

  prev(): void {
    this.setTarget(this.clampTarget(this.target - 1), true);
  }

  /** Open the lightbox on cover `index` (its `href`, else its image). */
  open(index: number = this.index): void {
    const count = this.items.length;
    if (!count) return;
    const i = wrapIndex(index, count);
    if (i !== wrapIndex(Math.round(this.target), count)) this.goTo(i);
    const content = this.viewerContent(i);
    if (!content) return;
    if (this.viewer) {
      this.viewer = content;
      return;
    }
    const token = ++this.viewerToken;
    /* Open once the image can paint (no empty frame), at most ~0.5 s later */
    void preload(content.src).then(() => {
      if (token !== this.viewerToken || this.viewer || !this.isConnected) return;
      this.viewer = content;
      this.emit('k3-open', { index: i });
    });
  }

  /** Close the lightbox. */
  close(): void {
    this.viewerToken++;
    if (!this.viewer) return;
    const shown = this.viewerShown;
    this.viewerShown = false;
    const index = this.viewer.index;
    const done = () => {
      this.teardownViewer(true);
      this.emit('k3-close', { index });
    };
    clearTimeout(this.viewerTimer);
    if (!shown || prefersReducedMotion()) done();
    else this.viewerTimer = window.setTimeout(done, 220);
  }

  /* ── Motion ─────────────────────────────────────────────────────────── */

  private clampTarget(value: number): number {
    const count = this.items.length;
    if (this.loop || !count) return value;
    return Math.min(count - 1, Math.max(0, value));
  }

  private setTarget(value: number, animate: boolean): void {
    this.target = value;
    if (!animate || prefersReducedMotion()) {
      this.position = value;
      this.velocity = 0;
      this.applyPoses();
      this.settle();
      return;
    }
    this.startLoop();
  }

  private startLoop(): void {
    if (this.frame) return;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  /** Critically damped spring towards `target`; renders only while moving. */
  private tick = (now: number): void => {
    this.frame = 0;
    const dt = Math.min(0.1, Math.max(0, (now - this.lastTime) / 1000));
    this.lastTime = now;
    if (!this.drag) {
      const step = coverflowSpring(this.position, this.velocity, this.target, dt);
      this.position = step.position;
      this.velocity = step.velocity;
      if (Math.abs(this.target - this.position) < 0.002 && Math.abs(this.velocity) < 0.02) {
        this.position = this.target;
        this.velocity = 0;
      }
    }
    this.applyPoses();
    if (this.position !== this.target || this.drag) this.frame = requestAnimationFrame(this.tick);
    else this.settle();
  };

  private measure(force = false): void {
    const first = this.items[0];
    const w = first?.offsetWidth ?? 0;
    const h = first?.offsetHeight ?? 0;
    const vp = this.renderRoot.querySelector<HTMLElement>('.viewport');
    const size = (this.vertical ? vp?.clientHeight : vp?.clientWidth) ?? 0;
    const changed = force || (w && w !== this.itemWidth) || (h && h !== this.itemHeight) || (size && size !== this.viewportSize);
    if (w) this.itemWidth = w;
    if (h) this.itemHeight = h;
    if (size) this.viewportSize = size;
    if (changed) {
      this.refit();
      this.applyPoses();
    }
  }

  /** `full-width`: side covers and spacing for the current container width. */
  private refit(): void {
    if (!this.fullWidth || this.slide || !this.itemSize || !this.viewportSize) {
      this.fit = null;
      return;
    }
    const count = this.items.length;
    const maxSide = this.loop ? Math.floor((count - 1) / 2) : count - 1;
    const base = { ...this.geometry(), spacing: this.spacing, visible: this.visible };
    this.fit = coverflowFit(this.viewportSize, base, maxSide);
  }

  /** Index, roles and reflection of every cover. */
  private syncItems(): void {
    const items = this.items;
    const count = items.length;
    this.count = count;
    items.forEach((item, i) => {
      item.index = i;
      item.toggleAttribute('data-reflect', this.reflects);
      item.toggleAttribute('data-vertical', this.vertical);
      item.toggleAttribute('data-lightbox', this.lightbox && !!item.href);
      /* Name: label, else the image text alternative, with its position */
      const pos = i18n.t('carousel.slide', '{n} of {total}', { n: i + 1, total: count });
      const alt = this.coverName(item);
      item.setAttribute('aria-label', alt ? `${alt} (${pos})` : pos);
    });
  }

  private coverName(item: K3CoverflowItem | undefined): string {
    return item?.label || item?.querySelector('img')?.alt || '';
  }

  private applyPoses(): void {
    const items = this.items;
    const count = items.length;
    if (!count) return;
    const g = this.geometry();
    /* Slide: as many covers as reach the edges (the row always fills the viewport) */
    const slide = this.slide;
    /* Loop: the cover opposite the centre must stay hidden (it wraps there) */
    const maxSide = this.loop ? Math.floor((count - 1) / 2) : count - 1;
    const slideG = {
      width: g.width,
      visible: Math.min(maxSide, coverflowSlideVisible(this.viewportSize, g.width, this.slideScale)),
    };
    const vertical = this.vertical;
    const rtl = !vertical && this.isRtl();
    const centre = wrapIndex(Math.round(this.position), count);
    const bullets = this.bullets ? this.renderRoot.querySelectorAll<HTMLElement>('.bullet') : [];
    for (let i = 0; i < count; i++) {
      const item = items[i]!;
      const d = coverflowOffset(i, this.position, count, this.loop);
      const bullet = bullets[i];
      if (bullet) bullet.style.setProperty('--t', coverflowBulletWeight(d).toFixed(3));
      const pose = slide ? coverflowSlidePose(d, slideG, this.slideScale, rtl) : coverflowPose(d, g, rtl);
      const active = i === centre;
      if (item.active !== active) item.active = active;
      if (pose.hidden) {
        if (!item.hasAttribute('data-hidden')) item.setAttribute('data-hidden', '');
        continue;
      }
      item.removeAttribute('data-hidden');
      item.style.transform = coverflowTransform(pose, vertical);
      item.style.zIndex = String(pose.zIndex);
      item.style.opacity = pose.opacity < 1 ? pose.opacity.toFixed(3) : '';
    }
  }

  /** The stage came to rest on a cover. */
  private settle(): void {
    const count = this.items.length;
    if (!count) return;
    const idx = wrapIndex(Math.round(this.target), count);
    if (this.loop && Math.abs(this.target) > count * 1000) {
      /* Keep numbers small on very long sessions */
      this.position = this.target = idx;
    }
    if (idx === this.settledIndex) return;
    this.settledIndex = idx;
    this.index = idx;
    this.announcement = [i18n.t('carousel.slide', '{n} of {total}', { n: idx + 1, total: count }), this.coverName(this.items[idx])]
      .filter(Boolean)
      .join(' — ');
    this.emit('k3-change', { index: idx });
  }

  /* ── Lightbox ───────────────────────────────────────────────────────── */

  private viewerContent(index: number): { src: string; alt: string; index: number } | null {
    const item = this.items[index];
    if (!item) return null;
    const img = item.querySelector('img');
    const src = safeCoverflowHref(item.href) || img?.currentSrc || img?.getAttribute('src') || '';
    return src ? { src, alt: this.coverName(item), index } : null;
  }

  private get viewerEl(): PopoverElement | null {
    return this.renderRoot.querySelector<PopoverElement>('.lightbox');
  }

  /** Rendered: put it in the top layer, trap focus, animate in. */
  private showViewer(): void {
    const el = this.viewerEl;
    if (!el) return;
    try {
      el.showPopover?.();
    } catch {
      /* Not supported / already open — the fixed layer still covers the page */
    }
    overlayStack.push(this, () => this.close());
    this.trap.activate(el);
    if (prefersReducedMotion()) this.viewerShown = true;
    else requestAnimationFrame(() => requestAnimationFrame(() => (this.viewerShown = true)));
  }

  private teardownViewer(restoreFocus: boolean): void {
    clearTimeout(this.viewerTimer);
    const el = this.viewerEl;
    try {
      if (el?.matches(':popover-open')) el.hidePopover?.();
    } catch {
      /* ignore */
    }
    overlayStack.remove(this);
    this.trap.deactivate({ restore: false });
    this.viewer = null;
    this.viewerShown = false;
    if (restoreFocus) {
      /* Back to the cover now centred (arrows may have moved it) */
      const item = this.items[wrapIndex(Math.round(this.target), this.items.length)];
      if (item) void this.updateComplete.then(() => item.focus({ preventScroll: true }));
    }
  }

  private viewerStep(dir: 1 | -1): void {
    if (dir > 0) this.next();
    else this.prev();
    const content = this.viewerContent(wrapIndex(Math.round(this.target), this.items.length));
    if (!content || !this.viewer) return;
    const token = ++this.viewerToken;
    void preload(content.src).then(() => {
      if (token === this.viewerToken && this.viewer) this.swapViewer(content, dir);
    });
  }

  private swapViewer(content: { src: string; alt: string; index: number }, dir: 1 | -1): void {
    this.viewer = content;
    const img = this.renderRoot.querySelector<HTMLImageElement>('.lb-image');
    if (img && typeof img.animate === 'function' && !prefersReducedMotion()) {
      const from = (this.isRtl() ? -dir : dir) * 24;
      img.animate(
        [
          { opacity: 0, transform: `translateX(${from}px)` },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 260, easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)' },
      );
    }
  }

  /** A press on the scrim (not on the image or a button) closes. */
  private onViewerClick = (e: MouseEvent): void => {
    const t = e.target as HTMLElement;
    if (t.closest('.lb-image, .lb-button')) return;
    this.close();
  };

  private viewerSwipe: { x: number; id: number } | null = null;

  private onViewerPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse') return;
    this.viewerSwipe = { x: e.clientX, id: e.pointerId };
  };

  private onViewerPointerUp = (e: PointerEvent): void => {
    const s = this.viewerSwipe;
    this.viewerSwipe = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) < 48) return;
    const forward = this.isRtl() ? dx > 0 : dx < 0;
    this.viewerStep(forward ? 1 : -1);
  };

  /* ── Input ──────────────────────────────────────────────────────────── */

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const rtl = this.isRtl();
    const count = this.items.length;
    const path = e.composedPath() as EventTarget[];
    const within = (cls: string) => path.some((n) => n instanceof HTMLElement && n.classList.contains(cls));

    if (this.viewer) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        this.viewerStep((e.key === 'ArrowRight') !== rtl ? 1 : -1);
      } else if (this.vertical && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        this.viewerStep(e.key === 'ArrowDown' ? 1 : -1);
      }
      return;
    }

    /* Main axis: ← → (mirrored in RTL), or ↑ ↓ when vertical */
    const vertical = this.vertical;
    const nextKey = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    let handled = true;
    switch (e.key) {
      case nextKey:
        this.next();
        break;
      case prevKey:
        this.prev();
        break;
      case 'Home':
        this.goTo(0);
        break;
      case 'End':
        this.goTo(count - 1);
        break;
      case 'Enter':
      case ' ': {
        /* Links and buttons answer natively; flip / plain covers here */
        const item = path.find(
          (n): n is K3CoverflowItem => n instanceof HTMLElement && n.localName === 'k3-coverflow-item',
        );
        if (!item || item.href || e.target !== item) {
          handled = false;
          break;
        }
        item.activate();
        break;
      }
      default:
        handled = false;
    }
    if (!handled) return;
    e.preventDefault();
    if (e.key === 'Enter' || e.key === ' ') return;
    const idx = wrapIndex(Math.round(this.target), count);
    if (within('bullets')) {
      /* Roving focus along the bullets */
      void this.updateComplete.then(() =>
        this.renderRoot.querySelectorAll<HTMLElement>('.bullet')[idx]?.focus({ preventScroll: true }),
      );
    } else if (path.some((n) => n instanceof HTMLElement && n.localName === 'k3-coverflow-item')) {
      /* Roving focus follows the centred cover */
      const item = this.items[idx];
      if (item) {
        item.active = true;
        void item.updateComplete.then(() => item.focus({ preventScroll: true }));
      }
    }
  };

  /** Capture phase: a side cover comes to the centre instead of acting. */
  private onClick = (e: MouseEvent): void => {
    if (this.suppressClick) {
      this.suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const item = (e.composedPath() as EventTarget[]).find(
      (n): n is K3CoverflowItem => n instanceof HTMLElement && n.localName === 'k3-coverflow-item',
    );
    if (!item) return;
    if (!item.active) {
      e.preventDefault();
      e.stopPropagation();
      this.goTo(item.index);
      return;
    }
    /* Centred: a flip cover turns over; a link opens the lightbox or follows itself */
    if (!item.href && item.flip) item.toggle();
    else if (this.lightbox && item.href && !e.defaultPrevented) {
      e.preventDefault();
      this.open(item.index);
    }
  };

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0 || !e.isPrimary || this.drag) return;
    this.drag = {
      id: e.pointerId,
      x: this.vertical ? e.clientY : e.clientX,
      start: this.position,
      moved: false,
      samples: [{ t: e.timeStamp, p: this.position }],
    };
  };

  private onPointerMove = (e: PointerEvent): void => {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.id) return;
    const dx = (this.vertical ? e.clientY : e.clientX) - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < CoverflowSpecs.clickSlop) return;
      drag.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      (e.currentTarget as HTMLElement).classList.add('dragging');
      this.velocity = 0;
    }
    /* Slide: the row follows the hand one to one */
    const unit = this.slide ? this.itemSize * (1 + CoverflowSpecs.slideGap) : this.itemSize * CoverflowSpecs.dragUnit;
    const dir = !this.vertical && this.isRtl() ? -1 : 1;
    let next = drag.start - (dx / unit) * dir;
    if (!this.loop) {
      /* Rubber band past the ends */
      const max = this.items.length - 1;
      if (next < 0) next = next / 3;
      else if (next > max) next = max + (next - max) / 3;
    }
    this.position = next;
    drag.samples.push({ t: e.timeStamp, p: next });
    if (drag.samples.length > 6) drag.samples.shift();
    this.startLoop();
  };

  private onPointerUp = (e: PointerEvent): void => {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.id) return;
    this.drag = null;
    (e.currentTarget as HTMLElement).classList.remove('dragging');
    if (!drag.moved) return;
    this.suppressClick = true;
    /* Clear the flag if no click follows (pointer released outside) */
    setTimeout(() => {
      this.suppressClick = false;
    }, 0);
    const first = drag.samples[0]!;
    const last = drag.samples[drag.samples.length - 1]!;
    const dt = (last.t - first.t) / 1000;
    const v = dt > 0 ? (last.p - first.p) / dt : 0;
    /* Keep the hand's speed: the spring carries it into the snap */
    this.velocity = Math.max(-40, Math.min(40, v));
    this.setTarget(coverflowSnap(this.position, v, this.items.length, this.loop), true);
  };

  private onWheel = (e: WheelEvent): void => {
    const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    /* Main axis: the vertical wheel moves a vertical cover flow */
    const delta = this.vertical
      ? horizontal
        ? 0
        : e.deltaY
      : horizontal
        ? e.deltaX
        : e.shiftKey || this.wheel
          ? e.deltaY
          : 0;
    if (!delta) return;
    /* Bounded, already at that end: let the page scroll */
    const towards = Math.sign(delta) * (this.isRtl() && horizontal ? -1 : 1);
    if (!this.loop && this.clampTarget(this.target + towards) === this.target) return;
    e.preventDefault();
    this.wheelAcc += delta * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
    clearTimeout(this.wheelTimer);
    this.wheelTimer = window.setTimeout(() => {
      this.wheelAcc = 0;
    }, 180);
    const step = CoverflowSpecs.wheelStep;
    while (Math.abs(this.wheelAcc) >= step) {
      const dir = Math.sign(this.wheelAcc) * (this.isRtl() && horizontal ? -1 : 1);
      this.wheelAcc -= Math.sign(this.wheelAcc) * step;
      this.setTarget(this.clampTarget(this.target + dir), true);
    }
  };

  private onSlotChange = (): void => {
    this.syncItems();
    this.measure();
    this.refit();
    const count = this.items.length;
    if (!this.loop) this.target = this.position = this.clampTarget(this.target);
    if (count && this.settledIndex === -1) this.settledIndex = wrapIndex(Math.round(this.target), count);
    if (count) this.applyPoses();
  };

  /* ── Render ─────────────────────────────────────────────────────────── */

  private renderArrows() {
    if (!this.arrows) return nothing;
    const atStart = !this.loop && this.index <= 0;
    const atEnd = !this.loop && this.index >= this.count - 1;
    return html`
      <button
        class="arrow prev"
        part="arrow arrow-prev"
        type="button"
        aria-label=${i18n.t('carousel.prev', 'Previous')}
        ?disabled=${atStart || this.count < 2}
        @click=${() => this.prev()}
      >
        ${chevron(CHEVRON_PREV)}
      </button>
      <button
        class="arrow next"
        part="arrow arrow-next"
        type="button"
        aria-label=${i18n.t('carousel.next', 'Next')}
        ?disabled=${atEnd || this.count < 2}
        @click=${() => this.next()}
      >
        ${chevron(CHEVRON_NEXT)}
      </button>
    `;
  }

  private renderBullets() {
    if (!this.bullets || this.count < 2) return nothing;
    return html`
      <div class="bullets" part="bullets" role="group" aria-label=${i18n.t('carousel.indicators', 'Slide indicators')}>
        ${Array.from({ length: this.count }, (_, i) => {
          const current = i === this.index;
          return html`<button
            class="bullet"
            part="bullet"
            type="button"
            tabindex=${current ? 0 : -1}
            aria-current=${current ? 'true' : 'false'}
            aria-label=${i18n.t('carousel.goTo', 'Go to slide {n}', { n: i + 1 })}
            @click=${() => this.goTo(i)}
          ></button>`;
        })}
      </div>
    `;
  }

  private renderViewer() {
    const v = this.viewer;
    if (!v) return nothing;
    const many = this.count > 1;
    const atStart = !this.loop && v.index <= 0;
    const atEnd = !this.loop && v.index >= this.count - 1;
    return html`
      <div
        class="lightbox ${this.viewerShown ? 'open' : ''}"
        part="lightbox"
        popover="manual"
        role="dialog"
        aria-modal="true"
        aria-label=${v.alt || i18n.t('carousel.slide', '{n} of {total}', { n: v.index + 1, total: this.count })}
        @click=${this.onViewerClick}
        @pointerdown=${this.onViewerPointerDown}
        @pointerup=${this.onViewerPointerUp}
      >
        <button class="lb-button lb-close" part="lightbox-button" type="button" aria-label=${i18n.t('dialog.close', 'Close')} @click=${() => this.close()}>
          ${chevron(CLOSE)}
        </button>
        <img class="lb-image" part="lightbox-image" src=${v.src} alt=${v.alt} draggable="false" />
        ${many && !atStart
          ? html`<button class="lb-button lb-nav prev" part="lightbox-button" type="button" aria-label=${i18n.t('carousel.prev', 'Previous')} @click=${() => this.viewerStep(-1)}>
              ${chevron(CHEVRON_PREV)}
            </button>`
          : nothing}
        ${many && !atEnd
          ? html`<button class="lb-button lb-nav next" part="lightbox-button" type="button" aria-label=${i18n.t('carousel.next', 'Next')} @click=${() => this.viewerStep(1)}>
              ${chevron(CHEVRON_NEXT)}
            </button>`
          : nothing}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="frame">
        <div
          class="viewport"
          part="viewport"
          @pointerdown=${this.onPointerDown}
          @pointermove=${this.onPointerMove}
          @pointerup=${this.onPointerUp}
          @pointercancel=${this.onPointerUp}
          @wheel=${{ handleEvent: this.onWheel, passive: false }}
          @dragstart=${(e: Event) => e.preventDefault()}
        >
          <div class="stage" part="stage"><slot @slotchange=${this.onSlotChange}></slot></div>
        </div>
        ${this.renderArrows()}
      </div>
      ${this.renderBullets()} ${this.renderViewer()}
      <span class="sr-only" aria-live="polite">${this.announcement}</span>
    `;
  }
}
export default K3Coverflow;

if (!customElements.get('k3-coverflow')) {
  customElements.define('k3-coverflow', K3Coverflow);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-coverflow': K3Coverflow;
  }
}
