import { html, nothing, type PropertyValues } from 'lit';
import { property, query, queryAll, state } from 'lit/decorators.js';
import {
  K3Element,
  emitLifecycle,
  isRtl,
  prefersReducedMotion,
  resolveCssLengthPx,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import K3IconButton from '../actions/icon-button.js';
import './carousel-item.js';
import type { K3CarouselItem } from './carousel-item.js';
import {
  CarouselSpecs,
  type CarouselAlign,
  type CarouselIndicators,
  type CarouselLayout,
  type CarouselMode,
} from './carousel.specs.js';
import {
  LOOP_CYCLES,
  adjacentSnap,
  canLoop,
  createModel,
  focalIndex,
  indicatorWeights,
  itemGeometry,
  loopDeltaTo,
  loopIndicatorWeights,
  loopItemGeometry,
  loopMaxScroll,
  loopPeriod,
  loopPosition,
  loopSnapPoints,
  scrollForIndex,
  snapPoints,
  type CarouselModel,
} from './carousel.keylines.js';
import { carouselStyles } from './carousel.styles.js';

export {
  CarouselSpecs,
  type CarouselLayout,
  type CarouselAlign,
  type CarouselIndicators,
  type CarouselMode,
} from './carousel.specs.js';

/** Forces an instant jump even when the scroller has `scroll-behavior: smooth`. */
const INSTANT = 'instant' as ScrollBehavior;

/**
 * `k3-carousel` — M3 Expressive carousel.
 *
 * ```html
 * <k3-carousel layout="multi-browse" label="Featured" controls indicators="bottom" mode="loop">
 *   <k3-carousel-item label="Lake"><img src="lake.jpg" alt="" /><span slot="label">Lake</span></k3-carousel-item>
 *   …
 * </k3-carousel>
 * ```
 *
 * Layouts (M3): `multi-browse` (default) · `uncontained` · `hero` (`align="start|center"`) · `full-screen`.
 *
 * - Masked keylines: items grow / shrink between large, medium and small sizes
 *   while their content keeps the large width (parallax), as in M3.
 * - `mode="loop"`: infinite wrap in keyline layouts (multi-browse / hero),
 *   rewind to the other end in flow layouts (uncontained / full-screen).
 * - `indicators="top|bottom|left|right"`: page dots; the active one is 3× longer
 *   and morphs continuously with the scroll position (spatial spring).
 * - Native scrolling (touch, trackpad, wheel) + scroll-snap; optional mouse drag.
 * - Keyboard: roving focus — ← → (↑ ↓ in full-screen), Home / End, Enter / Space.
 * - A11y: `role="region"` + `aria-roledescription="carousel"`, slides announce
 *   “n of total”; polite live region on change. No autoplay (M3 guidance).
 *
 * Events:
 * - `k3-change-start` (cancelable) / `k3-change-end` lifecycle
 * - `k3-change` `{ index }` — focal item settled
 *
 * CSS custom properties:
 * `--k3-carousel-height` · `--k3-carousel-gap` · `--k3-carousel-padding-inline` ·
 * `--k3-carousel-padding-block` · `--k3-carousel-item-width` · `--k3-carousel-corner` ·
 * `--k3-carousel-dot-size` · `--k3-carousel-dot-color` · `--k3-carousel-dot-active-color`
 *
 * @csspart viewport   - padded clipping box
 * @csspart scroller   - native scroll container
 * @csspart controls   - prev / next icon buttons wrapper
 * @csspart indicators - page dots wrapper
 * @csspart dot        - one page dot
 */
export class K3Carousel extends K3Element {
  static override styles = [hostReset, carouselStyles];

  @property({ reflect: true }) layout: CarouselLayout = CarouselSpecs.layout;
  /** Hero only — `start` (large + small) or `center` (small + large + small). */
  @property({ reflect: true }) align: CarouselAlign = CarouselSpecs.align;
  /** Preferred large item width in px (multi-browse / uncontained). */
  @property({ type: Number, attribute: 'item-width' }) itemWidth: number = CarouselSpecs.itemWidth;
  /** Accessible name of the carousel region. */
  @property() label = '';
  /** Show prev / next icon buttons. */
  @property({ type: Boolean, reflect: true }) controls = false;
  /** Page indicators position. */
  @property({ reflect: true }) indicators: CarouselIndicators = CarouselSpecs.indicators;
  /** `continuous` (stops at the ends) or `loop` (wraps around). */
  @property({ reflect: true }) mode: CarouselMode = CarouselSpecs.mode;
  /** Allow click-and-drag scrolling with a mouse. */
  @property({ type: Boolean, reflect: true, attribute: 'mouse-drag' })
  mouseDrag = true;
  /** Focal item index (reflects user scrolling; set it to navigate). */
  @property({ type: Number }) index = 0;

  @state() private model: CarouselModel | null = null;
  @state() private snaps: number[] = [];
  @state() private announce = '';
  /** Last settled logical scroll (drives prev / next disabled state). */
  @state() private atScroll = 0;
  /** Infinite loop active (mode=loop + keyline layout + enough items). */
  @state() private looping = false;
  /** Item indices that get a dot (reachable focal positions). */
  @state() private dotItems: number[] = [];

  @query('.scroller') private scroller!: HTMLElement;
  @queryAll('.dot') private dotEls!: NodeListOf<HTMLButtonElement>;

  private items: K3CarouselItem[] = [];
  private dotPos: number[] = [];
  private activeDot = -1;
  private viewport = 0;
  private gapPx: number = CarouselSpecs.gap;
  private raf = 0;
  private resizeObs?: ResizeObserver;
  private settleTimer = 0;
  private changing = false;
  private focusIndex = 0;
  private drag: {
    id: number;
    start: number;
    scroll: number;
    scrollLogical: number;
    moved: boolean;
  } | null = null;

  /* -------------------------------------------------- lifecycle */

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'region');
    this.setAttribute('aria-roledescription', i18n.t('carousel.roledescription', 'carousel'));
  }

  override disconnectedCallback(): void {
    this.resizeObs?.disconnect();
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.settleTimer);
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    this.resizeObs = new ResizeObserver(() => this.measure());
    this.resizeObs.observe(this.scroller);
    this.measure();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('label')) {
      if (this.label) this.setAttribute('aria-label', this.label);
      else this.removeAttribute('aria-label');
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    const relayout = (['layout', 'align', 'itemWidth', 'mode', 'indicators'] as const).some(
      (k) => changed.has(k) && changed.get(k) !== undefined,
    );
    if (relayout) {
      this.syncItems();
      this.measure();
    }
    if (changed.has('index') && changed.get('index') !== undefined && !this.changing) {
      this.goTo(this.index, 'api');
    }
  }

  /* -------------------------------------------------- public API */

  /** Number of slides. */
  get count(): number {
    return this.items.length;
  }

  /** Scroll so that `i` becomes the focal (large) item. */
  goTo(i: number, source: 'user' | 'api' = 'api', behavior?: ScrollBehavior): void {
    const n = this.items.length;
    if (!n) return;
    const raw = Math.round(i);
    const target = this.mode === 'loop' ? ((raw % n) + n) % n : Math.max(0, Math.min(n - 1, raw));
    if (!emitLifecycle(this, 'change-start', { source, index: target })) return;
    this.changing = true;
    const b: ScrollBehavior = behavior ?? (prefersReducedMotion() ? INSTANT : 'smooth');
    if (this.looping && this.model) {
      const s = this.logicalScroll;
      this.scrollToLogical(s + loopDeltaTo(this.model, s, target), b);
    } else {
      this.scrollToLogical(this.scrollPositionFor(target), b);
    }
    this.setRoving(target);
    this.scheduleSettle(b === 'smooth' ? 700 : 0);
  }

  /** Advance one snap (keyline layouts) or one item (flow layouts). Wraps in loop mode. */
  next(): void {
    this.step(1);
  }

  /** Go back one snap (keyline layouts) or one item (flow layouts). Wraps in loop mode. */
  prev(): void {
    this.step(-1);
  }

  private step(dir: 1 | -1): void {
    const n = this.items.length;
    if (!n) return;
    const b: ScrollBehavior = prefersReducedMotion() ? INSTANT : 'smooth';

    if (this.looping && this.model) {
      const st = this.model.step;
      const s = this.logicalScroll;
      const target = (Math.round(s / st) + dir) * st;
      if (
        !emitLifecycle(this, 'change-start', { source: 'user', index: this.wrap(this.index + dir) })
      )
        return;
      this.changing = true;
      this.scrollToLogical(target, b);
      this.scheduleSettle(b === 'smooth' ? 700 : 0);
      return;
    }

    /* Rewind loop: at an end, jump to the other end. */
    if (this.mode === 'loop' && !this.canStepRaw(dir)) {
      this.goTo(dir > 0 ? 0 : n - 1, 'user');
      return;
    }

    if (!this.model) {
      this.goTo(this.index + dir, 'user');
      return;
    }
    const target = adjacentSnap(this.snaps, this.logicalScroll, dir);
    if (
      !emitLifecycle(this, 'change-start', {
        source: 'user',
        index: focalIndex(this.model, target),
      })
    )
      return;
    this.changing = true;
    this.scrollToLogical(target, b);
    this.scheduleSettle(b === 'smooth' ? 700 : 0);
  }

  private wrap(i: number): number {
    const n = this.items.length || 1;
    return ((i % n) + n) % n;
  }

  /** True when the carousel can still move in that direction (always true in loop mode). */
  private canStep(dir: 1 | -1): boolean {
    return this.mode === 'loop' ? this.items.length > 1 : this.canStepRaw(dir);
  }

  private canStepRaw(dir: 1 | -1): boolean {
    if (!this.model) return dir > 0 ? this.index < this.items.length - 1 : this.index > 0;
    return dir > 0 ? this.atScroll < this.model.maxScroll - 1 : this.atScroll > 1;
  }

  /* -------------------------------------------------- measure / layout */

  private onSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this.items = slot
      .assignedElements({ flatten: true })
      .filter((el): el is K3CarouselItem => el.localName === 'k3-carousel-item');
    this.syncItems();
    this.measure();
  }

  private syncItems(): void {
    const n = this.items.length;
    this.items.forEach((item, i) => {
      item.index = i;
      item.dataset.layout = this.layout;
      const name = item.label || item.querySelector('[slot="label"]')?.textContent?.trim() || '';
      const pos = i18n.t('carousel.slide', '{n} of {total}', { n: i + 1, total: n });
      item.setAttribute('aria-label', name ? `${name}, ${pos}` : pos);
    });
    this.setRoving(Math.min(this.focusIndex, Math.max(0, n - 1)));
  }

  private measure(): void {
    if (!this.scroller) return;
    const cs = getComputedStyle(this);
    this.gapPx = resolveCssLengthPx(
      cs.getPropertyValue('--_k3-carousel-gap').trim(),
      CarouselSpecs.gap,
    );
    this.viewport = this.scroller.clientWidth;
    const n = this.items.length;

    if ((this.layout === 'multi-browse' || this.layout === 'hero') && this.viewport && n) {
      const m = createModel(this.layout, this.align, this.viewport, n, {
        itemWidth: this.itemWidth,
        gap: this.gapPx,
      });
      this.model = m;
      this.looping = this.mode === 'loop' && canLoop(m);
      this.snaps = this.looping ? loopSnapPoints(m) : snapPoints(m);
      this.style.setProperty('--_k3-carousel-viewport', `${this.viewport}px`);
      if (this.looping) {
        this.dotItems = this.items.map((_, i) => i);
        this.dotPos = [];
      } else {
        /* One dot per reachable focal position. */
        const seen = new Set<number>();
        const idx: number[] = [];
        const pos: number[] = [];
        for (let i = 0; i < n; i++) {
          const p = scrollForIndex(m, i);
          const f = focalIndex(m, p);
          if (seen.has(f)) continue;
          seen.add(f);
          idx.push(f);
          pos.push(p);
        }
        this.dotItems = idx;
        this.dotPos = pos;
      }
    } else {
      this.model = null;
      this.looping = false;
      this.snaps = [];
      if (this.layout === 'uncontained') {
        this.style.setProperty('--k3-carousel-item-width', `${this.itemWidth}px`);
      }
      this.items.forEach((it) => {
        it.style.removeProperty('--_k3-ci-x');
        it.style.removeProperty('--_k3-ci-size');
        it.style.removeProperty('--_k3-ci-large');
        it.style.removeProperty('--_k3-ci-progress');
        it.removeAttribute('data-offscreen');
      });
    }

    this.updateComplete.then(() => {
      if (!this.model) this.measureFlowDots();
      /* Keep the focal item in place after a resize / mode change. */
      if (this.looping && this.model) {
        const N = loopPeriod(this.model);
        this.scrollToLogical(2 * N + this.index * this.model.step, INSTANT);
      } else if (this.model) {
        this.scrollToLogical(this.scrollPositionFor(this.index), INSTANT);
      }
      this.atScroll = this.logicalScroll;
      this.activeDot = -1;
      this.layoutItems();
    });
  }

  /** Dots for flow layouts: one per distinct reachable scroll offset. */
  private measureFlowDots(): void {
    const max = this.maxLogicalScroll;
    const idx: number[] = [];
    const pos: number[] = [];
    let last = -Infinity;
    this.items.forEach((_, i) => {
      const p = Math.min(max, this.scrollPositionFor(i));
      if (p - last < 2) return;
      last = p;
      idx.push(i);
      pos.push(p);
    });
    this.dotItems = idx;
    this.dotPos = pos;
  }

  private get vertical(): boolean {
    return this.layout === 'full-screen';
  }

  private get maxLogicalScroll(): number {
    const s = this.scroller;
    return this.vertical
      ? Math.max(0, s.scrollHeight - s.clientHeight)
      : Math.max(0, s.scrollWidth - s.clientWidth);
  }

  private scrollPositionFor(i: number): number {
    if (this.model) return scrollForIndex(this.model, i);
    const item = this.items[i];
    if (!item || !this.scroller) return 0;
    const r = item.getBoundingClientRect();
    const sr = this.scroller.getBoundingClientRect();
    if (this.vertical) return r.top - sr.top + this.scroller.scrollTop;
    const start = isRtl(this) ? sr.right - r.right : r.left - sr.left;
    return Math.max(0, start + this.logicalScroll);
  }

  /** Logical scroll (≥ 0) regardless of writing direction. */
  private get logicalScroll(): number {
    if (!this.scroller) return 0;
    if (this.vertical) return this.scroller.scrollTop;
    return Math.abs(this.scroller.scrollLeft);
  }

  private scrollToLogical(px: number, behavior: ScrollBehavior): void {
    if (this.vertical) this.scroller.scrollTo({ top: px, behavior });
    else this.scroller.scrollTo({ left: isRtl(this) ? -px : px, behavior });
  }

  private layoutItems = (): void => {
    const m = this.model;
    const raw = this.logicalScroll;
    if (m) {
      const scroll = this.looping ? raw : Math.min(raw, m.maxScroll);
      const rtl = isRtl(this);
      for (const item of this.items) {
        const g = this.looping
          ? loopItemGeometry(m, item.index, scroll)
          : itemGeometry(m, item.index, scroll);
        const startX = g.center - g.size / 2;
        const off = startX + g.size < -1 || startX > m.viewport + 1;
        item.toggleAttribute('data-offscreen', off);
        if (off) continue;
        item.style.setProperty('--_k3-ci-x', `${rtl ? -startX : startX}px`);
        item.style.setProperty('--_k3-ci-size', `${g.size}px`);
        item.style.setProperty('--_k3-ci-large', `${m.large}px`);
        item.style.setProperty('--_k3-ci-progress', g.progress.toFixed(3));
      }
    }
    this.paintDots(raw);
  };

  /** Continuous dot morph: weight 1 → 3× length, blends between neighbours while scrolling. */
  private paintDots(scroll: number): void {
    const dots = this.dotEls;
    if (!dots?.length) return;
    const w =
      this.looping && this.model
        ? loopIndicatorWeights(this.model, scroll)
        : indicatorWeights(this.dotPos, scroll);
    let best = 0;
    dots.forEach((d, k) => {
      const v = w[k] ?? 0;
      d.style.setProperty('--_k3-dot-w', v.toFixed(3));
      if (v > (w[best] ?? 0)) best = k;
    });
    if (best !== this.activeDot) {
      this.activeDot = best;
      dots.forEach((d, k) => {
        d.toggleAttribute('aria-current', k === best);
        d.tabIndex = k === best ? 0 : -1;
      });
    }
  }

  /* -------------------------------------------------- scroll / settle */

  private onScroll(): void {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.layoutItems);
    this.scheduleSettle(140);
  }

  private scheduleSettle(delay: number): void {
    window.clearTimeout(this.settleTimer);
    this.settleTimer = window.setTimeout(() => this.settle(), delay);
  }

  private settle(): void {
    if (this.drag) return;
    /* Loop: silently re-centre on the middle cycle (geometry is periodic). */
    if (this.looping && this.model) {
      const N = loopPeriod(this.model);
      const s = this.logicalScroll;
      if (s < N || s > (LOOP_CYCLES - 1) * N) {
        this.scrollToLogical(2 * N + (((s % N) + N) % N), INSTANT);
      }
    }
    this.atScroll = this.logicalScroll;
    const i = this.currentFocal();
    const changed = i !== this.index;
    this.changing = true;
    this.index = i;
    if (changed) {
      emitLifecycle(this, 'change-end', { source: 'user', index: i });
      this.emit('k3-change', { index: i });
      this.announce = this.items[i]?.getAttribute('aria-label') ?? '';
    }
    this.updateComplete.then(() => (this.changing = false));
  }

  private currentFocal(): number {
    if (this.looping && this.model) {
      return this.wrap(Math.round(loopPosition(this.model, this.logicalScroll)));
    }
    if (this.model) return focalIndex(this.model, this.logicalScroll);
    const s = this.logicalScroll;
    let best = 0;
    let dist = Infinity;
    this.dotPos.forEach((p, k) => {
      const d = Math.abs(p - s);
      if (d < dist) {
        dist = d;
        best = this.dotItems[k];
      }
    });
    return best;
  }

  /* -------------------------------------------------- keyboard / focus */

  private setRoving(i: number): void {
    this.focusIndex = i;
    this.items.forEach((it, k) => (it.tabIndex = k === i ? 0 : -1));
  }

  private keyDirs(): { fwd: string; back: string } {
    const rtl = isRtl(this);
    if (this.vertical) return { fwd: 'ArrowDown', back: 'ArrowUp' };
    return { fwd: rtl ? 'ArrowLeft' : 'ArrowRight', back: rtl ? 'ArrowRight' : 'ArrowLeft' };
  }

  private onKeyDown(e: KeyboardEvent): void {
    const item = (e.composedPath() as Element[]).find(
      (el) => (el as Element).localName === 'k3-carousel-item',
    ) as K3CarouselItem | undefined;
    if (!item) return;
    const { fwd, back } = this.keyDirs();
    const n = this.items.length;
    let to = -1;
    if (e.key === fwd) to = item.index + 1;
    else if (e.key === back) to = item.index - 1;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = n - 1;
    else return;
    if (this.mode === 'loop') to = this.wrap(to);
    if (to < 0 || to >= n) return;
    e.preventDefault();
    this.setRoving(to);
    this.items[to].focus({ preventScroll: true });
    this.goTo(to, 'user');
  }

  private onFocusIn(e: FocusEvent): void {
    const item = e.target as K3CarouselItem;
    if (item?.localName !== 'k3-carousel-item') return;
    if (item.index !== this.focusIndex) {
      this.setRoving(item.index);
      this.goTo(item.index, 'user');
    }
  }

  /* -------------------------------------------------- indicators */

  private onDotClick(k: number): void {
    const i = this.dotItems[k];
    if (i === undefined) return;
    if (!this.model && this.dotPos[k] !== undefined) {
      /* Flow layouts: go to the exact (possibly clamped) offset. */
      if (!emitLifecycle(this, 'change-start', { source: 'user', index: i })) return;
      this.changing = true;
      this.scrollToLogical(this.dotPos[k], prefersReducedMotion() ? INSTANT : 'smooth');
      this.scheduleSettle(700);
      return;
    }
    this.goTo(i, 'user');
  }

  private onDotKey(e: KeyboardEvent): void {
    const vertical = this.indicators === 'left' || this.indicators === 'right';
    const rtl = isRtl(this);
    const fwd = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const count = this.dotItems.length;
    let k = this.activeDot;
    if (e.key === fwd) k += 1;
    else if (e.key === back) k -= 1;
    else if (e.key === 'Home') k = 0;
    else if (e.key === 'End') k = count - 1;
    else return;
    e.preventDefault();
    k = this.mode === 'loop' ? ((k % count) + count) % count : Math.max(0, Math.min(count - 1, k));
    this.onDotClick(k);
    this.dotEls[k]?.focus({ preventScroll: true });
  }

  /* -------------------------------------------------- mouse drag */

  private onPointerDown(e: PointerEvent): void {
    if (!this.mouseDrag || e.pointerType !== 'mouse' || e.button !== 0) return;
    this.drag = {
      id: e.pointerId,
      start: this.vertical ? e.clientY : e.clientX,
      scroll: this.vertical ? this.scroller.scrollTop : this.scroller.scrollLeft,
      scrollLogical: this.logicalScroll,
      moved: false,
    };
  }

  private onPointerMove(e: PointerEvent): void {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    const delta = (this.vertical ? e.clientY : e.clientX) - d.start;
    if (!d.moved && Math.abs(delta) < 4) return;
    if (!d.moved) {
      d.moved = true;
      this.toggleAttribute('dragging', true);
      this.scroller.setPointerCapture(e.pointerId);
    }
    if (this.vertical) this.scroller.scrollTop = d.scroll - delta;
    else this.scroller.scrollLeft = d.scroll - delta;
  }

  private onPointerUp(e: PointerEvent): void {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    if (!d.moved) return;
    this.removeAttribute('dragging');
    /* Swallow the click that follows a drag. */
    this.addEventListener('click', (ev) => ev.stopPropagation(), { capture: true, once: true });
    const delta = (this.vertical ? e.clientY : e.clientX) - d.start;
    const dir = ((isRtl(this) && !this.vertical ? -1 : 1) * Math.sign(-delta) || 1) as 1 | -1;
    const fling = Math.abs(delta) > 40;
    const b: ScrollBehavior = prefersReducedMotion() ? INSTANT : 'smooth';
    const s = this.logicalScroll;

    if (this.looping && this.model) {
      const st = this.model.step;
      const k = fling ? (dir > 0 ? Math.ceil(s / st) : Math.floor(s / st)) : Math.round(s / st);
      this.scrollToLogical(k * st, b);
      this.scheduleSettle(700);
    } else if (this.model) {
      const nearest = this.snaps.reduce((a, p) => (Math.abs(p - s) < Math.abs(a - s) ? p : a), 0);
      this.scrollToLogical(fling ? adjacentSnap(this.snaps, d.scrollLogical, dir) : nearest, b);
      this.scheduleSettle(700);
    } else {
      this.goTo(fling ? this.index + dir : this.currentFocal(), 'user');
    }
  }

  /* -------------------------------------------------- render */

  private renderIcon(name: string) {
    return html`<span
      class="ms notranslate"
      translate="no"
      lang="zxx"
      data-k3-icon=${name}
      aria-hidden="true"
    ></span>`;
  }

  private renderControls() {
    if (!this.controls) return nothing;
    const v = this.vertical;
    return html`<div class="controls" part="controls">
      <k3-icon-button
        class="prev"
        variant="tonal"
        size="sm"
        label=${i18n.t('carousel.prev')}
        ?disabled=${!this.canStep(-1)}
        @k3-click=${(e: Event) => {
          e.stopPropagation(); /* keep item k3-click unambiguous */
          this.prev();
        }}
        >${this.renderIcon(v ? 'keyboard_arrow_up' : 'chevron_left')}</k3-icon-button
      >
      <k3-icon-button
        class="next"
        variant="tonal"
        size="sm"
        label=${i18n.t('carousel.next')}
        ?disabled=${!this.canStep(1)}
        @k3-click=${(e: Event) => {
          e.stopPropagation();
          this.next();
        }}
        >${this.renderIcon(v ? 'keyboard_arrow_down' : 'chevron_right')}</k3-icon-button
      >
    </div>`;
  }

  private renderIndicators() {
    if (this.indicators === 'none' || this.dotItems.length < 2) return nothing;
    return html`<div
      class="indicators"
      part="indicators"
      role="group"
      aria-label=${i18n.t('carousel.indicators', 'Slide indicators')}
      @keydown=${this.onDotKey}
    >
      ${this.dotItems.map(
        (i, k) =>
          html`<button
            type="button"
            class="dot"
            part="dot"
            tabindex="-1"
            aria-label=${i18n.t('carousel.goTo', 'Go to slide {n}', { n: i + 1 })}
            @click=${() => this.onDotClick(k)}
          ></button>`,
      )}
    </div>`;
  }

  override render() {
    const m = this.model;
    const runway = m ? (this.looping ? loopMaxScroll(m) : m.maxScroll) : 0;
    const trackSize = m ? `inline-size: ${m.viewport + runway}px` : '';
    return html`
      <div class="frame">
        <div class="viewport" part="viewport">
          <div
            class="scroller"
            part="scroller"
            @scroll=${this.onScroll}
            @keydown=${this.onKeyDown}
            @focusin=${this.onFocusIn}
            @pointerdown=${this.onPointerDown}
            @pointermove=${this.onPointerMove}
            @pointerup=${this.onPointerUp}
            @pointercancel=${this.onPointerUp}
          >
            <div class="track" style=${trackSize}>
              ${
                m
                  ? this.snaps.map(
                      (p) => html`<span class="snap" style="inset-inline-start:${p}px"></span>`,
                    )
                  : nothing
              }
              <div class="stage">
                <slot @slotchange=${this.onSlotChange}></slot>
              </div>
            </div>
          </div>
          ${this.renderControls()}
        </div>
        ${this.renderIndicators()}
      </div>
      <div class="sr-only" aria-live="polite" aria-atomic="true">${this.announce}</div>
    `;
  }
}

/* Inner controls — the registry may not have defined them yet. */
if (!customElements.get('k3-icon-button')) {
  customElements.define('k3-icon-button', K3IconButton);
}
if (!customElements.get('k3-carousel')) {
  customElements.define('k3-carousel', K3Carousel);
}

export default K3Carousel;
