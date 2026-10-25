import { html, css, type CSSResultGroup, type PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  runOpenClose,
  afterPaint,
  attachDrag,
  setAxisTranslate,
  animateAxisTranslate,
  clearAxisTranslate,
  shouldDismissDrag,
  resolveDismissThresholdPx,
  M3_DISMISS_POSITION_DP,
  M3_DISMISS_VELOCITY,
  haptic,
  edgeScrollbarStyles,
  isRtl as readRtl,
  type DragController,
  type DragDetail,
} from '../../core/index.js';
import { enterSheetBottom, enterSheetSide } from '../../motion/enter.js';
import { i18n } from '../../i18n/index.js';
import { hostReset } from '../_shared.js';

export type SheetPlacement = 'bottom' | 'side';
export type SheetSide = 'start' | 'end';
/**
 * Bottom sheet horizontal layout ([M3 specs](https://m3.material.io/components/bottom-sheets/specs)):
 * - `standard` — full width up to **640dp**, then centered (56dp side margins grow)
 * - `full` — always edge-to-edge (opt-in; not the M3 default)
 */
export type SheetWidth = 'standard' | 'full';

/**
 * M3 Sheet — bottom (modal) · side (standard / modal).
 * Drag-to-dismiss via shared `attachDrag` + haptic pulses on mobile.
 *
 * Bottom: 28dp top corners · optional drag handle (48dp target) ·
 * `width=standard` max 640dp centered · `width=full` edge-to-edge.
 *
 * Open sheets elevate to `document.body` so they stack above chrome
 * (nav-rail, app bar, …). Opt out with `rail-attached` when the sheet
 * is a nav-rail extension (stays in place / under the rail).
 *
 * Header: title at **start**, close icon at **end** (flips with LTR/RTL).
 *
 * ```html
 * <k3-sheet placement="bottom" width="standard">
 *   <span slot="headline">Title</span>
 *   Content
 * </k3-sheet>
 * ```
 */
export class K3Sheet extends K3Element {
  static override styles: CSSResultGroup = [
    hostReset,
    edgeScrollbarStyles,
    /*
     * Edge-pinned scale + spatial-fast overshoot (same spring as menus).
     * Never translate→0 with overshoot — that lifts the sheet off the edge.
     */
    enterSheetBottom('.sheet.bottom'),
    enterSheetSide('.sheet.side'),
    css`
      :host {
        display: contents;
      }
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgb(0 0 0 / 0.32);
        opacity: 0;
        pointer-events: none;
        /* Above shell chrome (rail ~30); menus/dialogs share this band */
        z-index: 100;
        transition: opacity var(--k3-sys-motion-duration-effects-fast, 150ms)
          var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
      }
      .backdrop.open {
        opacity: 1;
        pointer-events: auto;
        transition: opacity var(--k3-sys-motion-duration-effects-default, 200ms)
          var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects));
      }
      .backdrop.dragging {
        transition: none;
      }
      .sheet {
        position: fixed;
        z-index: 101;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background: var(--k3-sys-color-surface-container-low);
        color: var(--k3-sys-color-on-surface);
        pointer-events: none;
        will-change: transform;
      }
      .sheet.open {
        pointer-events: auto;
      }
      .sheet.dragging {
        /* Inline translate owns transform — kill scale transition morph */
        transition: none !important;
        user-select: none;
      }
      .sheet.settling {
        /* Transition comes from inline style in animateDragTo */
        user-select: none;
      }

      /* Bottom sheet — M3: surface-container-low · 28dp top corners · handle 32×4 */
      .sheet.bottom {
        --k3-sheet-max-width: 40rem; /* 640dp */
        --k3-sheet-margin-wide: 3.5rem; /* 56dp when viewport > 640 */
        left: 0;
        right: 0;
        bottom: 0;
        width: min(100%, var(--k3-sheet-max-width));
        max-width: var(--k3-sheet-max-width);
        margin-inline: auto;
        max-height: min(90dvh, calc(100dvh - var(--k3-sheet-margin-wide)));
        padding: 0 1.5rem max(1.5rem, env(safe-area-inset-bottom));
        border-radius: var(--k3-sys-shape-corner-extra-large)
          var(--k3-sys-shape-corner-extra-large) 0 0;
        box-sizing: border-box;
      }
      /* Opt-in edge-to-edge (M3 documents 640dp max; full remains available) */
      .sheet.bottom.width-full {
        --k3-sheet-max-width: 100%;
        width: 100%;
        max-width: none;
        margin-inline: 0;
        max-height: 90dvh;
      }
      /* Drag handle — 32×4 bar · 22dp pad → 48dp accessible target (M3) */
      .sheet.bottom .handle {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
        box-sizing: border-box;
        min-height: 3rem; /* 48dp */
        padding-block: 1.375rem; /* 22dp */
        margin-inline: -0.5rem;
        cursor: grab;
        touch-action: none;
        border: 0;
        background: transparent;
        color: inherit;
        font: inherit;
      }
      .sheet.bottom .handle:active {
        cursor: grabbing;
      }
      .sheet.bottom .handle:focus-visible {
        outline: 0.125rem solid var(--k3-sys-color-secondary);
        outline-offset: -0.125rem;
        border-radius: var(--k3-sys-shape-corner-extra-small);
      }
      .sheet.bottom .handle::after {
        content: '';
        width: 2rem; /* 32dp */
        height: 0.25rem; /* 4dp */
        border-radius: var(--k3-sys-shape-corner-full);
        background: var(--k3-sys-color-on-surface-variant);
        opacity: 0.4;
      }
      .sheet.bottom[data-draggable='false'] .handle {
        cursor: default;
      }

      /* Side sheet — standard: square; modal: round corners facing the page (M3E) */
      .sheet.side {
        --k3-sheet-pad-inline: 1.5rem; /* 24dp — both edges, always */
        inset-block: 0;
        width: min(22rem, 100vw);
        padding-block: 1.5rem max(1.5rem, env(safe-area-inset-bottom));
        padding-inline: var(--k3-sheet-pad-inline);
        border-radius: 0;
      }
      /*
       * Rail-attached only: flush page-facing edge so nav list + scrollbar
       * meet the rounded exterior. Demo / free sheets keep both paddings.
       */
      :host([rail-attached]) .sheet.side.start {
        padding-inline-end: 0;
      }
      :host([rail-attached]) .sheet.side.end {
        padding-inline-start: 0;
      }
      :host([rail-attached]) .sheet.side.start .header,
      :host([rail-attached]) .sheet.side.start .actions {
        padding-inline-end: var(--k3-sheet-pad-inline);
      }
      :host([rail-attached]) .sheet.side.end .header,
      :host([rail-attached]) .sheet.side.end .actions {
        padding-inline-start: var(--k3-sheet-pad-inline);
      }
      /* Modal: exterior edge toward content = extra-large (28dp) */
      :host([modal]) .sheet.side.start {
        border-start-end-radius: var(--k3-sys-shape-corner-extra-large);
        border-end-end-radius: var(--k3-sys-shape-corner-extra-large);
      }
      :host([modal]) .sheet.side.end {
        border-start-start-radius: var(--k3-sys-shape-corner-extra-large);
        border-end-start-radius: var(--k3-sys-shape-corner-extra-large);
      }
      /* Clear rounded exterior corners so the scrollbar does not clip them */
      :host([modal]) .sheet.side {
        padding-block-end: max(
          var(--k3-sys-shape-corner-extra-large),
          env(safe-area-inset-bottom, 0px)
        );
      }
      /* Docked edge = scale origin (overshoot grows into the page, not off-screen) */
      .sheet.side.end {
        inset-inline-end: 0;
        inset-inline-start: auto;
        transform-origin: right center;
      }
      .sheet.side.start {
        inset-inline-start: 0;
        inset-inline-end: auto;
        transform-origin: left center;
      }
      :host(:dir(rtl)) .sheet.side.end {
        transform-origin: left center;
      }
      :host(:dir(rtl)) .sheet.side.start {
        transform-origin: right center;
      }
      .sheet.side .handle {
        display: none;
      }
      .sheet.side[data-draggable='true'] {
        touch-action: pan-y;
        cursor: grab;
      }
      .sheet.side[data-draggable='true']:active {
        cursor: grabbing;
      }

      /* Title start · close end — logical, mirrors with dir=rtl */
      .header {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
        min-width: 0;
        box-sizing: border-box;
      }
      .headline {
        flex: 1 1 auto;
        min-width: 0;
        font-size: var(--k3-sys-typescale-headline-small-size, 1.5rem);
        font-weight: 400;
        color: var(--k3-sys-color-on-surface);
      }
      .headline:empty {
        /* Keep flex spacer so close stays at the trailing edge */
        min-height: 1.5rem;
      }
      .close {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        box-sizing: border-box;
        width: var(--k3-sys-touch-target, 3rem);
        height: var(--k3-sys-touch-target, 3rem);
        margin: 0;
        margin-inline-end: -0.5rem; /* optical align with 24dp pad */
        padding: 0;
        border: 0;
        border-radius: var(--k3-sys-shape-corner-full, 999px);
        background: transparent;
        color: var(--k3-sys-color-on-surface-variant);
        cursor: pointer;
        font: inherit;
      }
      .close:focus-visible {
        outline: 0.125rem solid var(--k3-sys-color-secondary);
        outline-offset: 0.125rem;
      }
      .close-glyph {
        display: block;
        font-family: var(--k3-sys-icon-font-family, 'Material Symbols Rounded', sans-serif);
        font-size: 1.5rem;
        line-height: 1;
        font-variation-settings:
          'FILL' 0,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24;
        font-feature-settings: 'liga';
      }
      .close-glyph[data-k3-icon]::before {
        content: attr(data-k3-icon);
      }
      .content {
        flex: 1;
        min-width: 0; /* flex child — prevent horizontal overflow */
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        font-size: var(--k3-sys-typescale-body-medium-size);
        color: var(--k3-sys-color-on-surface-variant);
      }
      /* Side — edge scrollbar utility (.k3-scroll); slightly thicker for tall panes */
      .sheet.side .content.k3-scroll {
        --k3-scroll-size: 0.5rem; /* 8dp */
      }
      :host([modal]) .sheet.side .content.k3-scroll {
        /* Shorten track away from top/bottom exterior rounds */
        --k3-scroll-track-inset: 0.25rem;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .actions:not(.has) {
        display: none;
      }
    `,
  ];

  @property({ reflect: true }) placement: SheetPlacement = 'bottom';
  /** Side sheet edge (when placement=side) */
  @property({ reflect: true }) side: SheetSide = 'end';
  /**
   * Bottom sheet width — `standard` = M3 max 640dp centered;
   * `full` = always edge-to-edge. Ignored for side sheets.
   */
  @property({ reflect: true }) width: SheetWidth = 'standard';
  /** Modal shows scrim; standard side sheet can omit (still modal if true) */
  @property({ type: Boolean, reflect: true }) modal = true;
  /** Trailing close icon (opposite the title — LTR end / RTL end). Default on. */
  @property({ type: Boolean, attribute: 'close-action' }) closeAction = true;
  @property({ type: Boolean, reflect: true }) open = false;
  /**
   * Sheet is a nav-rail extension — stay in-tree (do not portal to body).
   * Playground shell sheet uses this so the rail stays on top of the sheet.
   */
  @property({ type: Boolean, reflect: true, attribute: 'rail-attached' })
  railAttached = false;
  /** Enable drag-to-dismiss (default on) */
  @property({ type: Boolean, reflect: true }) draggable = true;
  /**
   * Positional dismiss threshold in CSS px (M3 SheetDefaults = 56dp).
   * Values ≤ 1 are treated as a fraction of sheet size (legacy).
   */
  @property({ type: Number, attribute: 'dismiss-threshold' })
  dismissThreshold = M3_DISMISS_POSITION_DP;
  /** Fling velocity (px/ms) to dismiss — M3 = 125dp/s ≈ 0.125 */
  @property({ type: Number, attribute: 'dismiss-velocity' })
  dismissVelocity = M3_DISMISS_VELOCITY;

  @state() private visible = false;
  @state() private dragging = false;
  /** True while animating snap-back / slide-off after pointer up. */
  @state() private settling = false;

  @query('.sheet', true) private sheetEl!: HTMLElement;
  @query('.handle', true) private handleEl!: HTMLElement;
  @query('.header', true) private headerEl!: HTMLElement;
  @query('.backdrop', true) private backdropEl!: HTMLElement | null;
  @query('.content', true) private contentEl!: HTMLElement;

  private drag: DragController | null = null;
  private crossedThreshold = false;
  private dragOffset = 0;
  /** Light-DOM home when elevated to `document.body`. */
  private homeParent: Node | null = null;
  private homeNext: ChildNode | null = null;
  /** True while reparenting to body — skip home clear in disconnectedCallback. */
  private elevating = false;
  /** In-flight enter — shared by show() and `open` attribute. */
  private enterPromise: Promise<void> | null = null;

  /**
   * Escape ancestor stacking contexts (e.g. scrollport z-index:0) so the
   * sheet paints above nav-rail / app bar. Skipped when `rail-attached`.
   */
  private elevateLayer(): void {
    if (this.railAttached) return;
    if (this.parentNode === document.body) return;
    this.homeParent = this.parentNode;
    this.homeNext = this.nextSibling;
    this.elevating = true;
    try {
      document.body.appendChild(this);
    } finally {
      this.elevating = false;
    }
  }

  private restoreLayer(): void {
    if (!this.homeParent) return;
    this.homeParent.insertBefore(this, this.homeNext);
    this.homeParent = null;
    this.homeNext = null;
  }

  /**
   * Paint closed transform first, then flip `.open` — required after portal /
   * first open so the edge-scale + overshoot actually runs (no sudden pop-in).
   */
  private playEnter(): Promise<void> {
    if (this.visible) return Promise.resolve();
    if (this.enterPromise) return this.enterPromise;
    this.enterPromise = (async () => {
      this.elevateLayer();
      this.visible = false;
      this.clearDragTransform();
      await this.updateComplete;
      void this.sheetEl?.offsetWidth; /* commit closed transform */
      await afterPaint();
      this.visible = true;
      await this.updateComplete;
    })().finally(() => {
      this.enterPromise = null;
    });
    return this.enterPromise;
  }

  async show(): Promise<boolean> {
    return runOpenClose(
      this,
      'open',
      async () => {
        this.open = true;
        await this.playEnter();
      },
      { source: 'api' },
    );
  }

  async hide(
    source: 'user' | 'api' | 'backdrop' | 'escape' | 'drag' = 'api',
  ): Promise<boolean> {
    const ok = await runOpenClose(
      this,
      'close',
      async () => {
        this.open = false;
        this.visible = false;
        this.dragging = false;
        this.settling = false;
        this.clearDragTransform();
        if (source === 'drag') haptic.light();
      },
      { source },
    );
    /* Restore after close motion so the sheet is not yanked mid-exit */
    if (ok) this.restoreLayer();
    return ok;
  }

  private onKey = (e: KeyboardEvent): void => {
    if (!this.visible) return;
    if (e.key === 'Escape') void this.hide('escape');
  };

  private isRtl(): boolean {
    return isRtl(this);
  }

  /** Dismiss direction in CSS pixels (positive = away from rest) */
  private dismissSign(): number {
    if (this.placement === 'bottom') return 1; // down
    const rtl = this.isRtl();
    if (this.side === 'end') return rtl ? -1 : 1;
    return rtl ? 1 : -1;
  }

  private bindDrag(): void {
    this.drag?.destroy();
    this.drag = null;
    if (!this.draggable || !this.sheetEl) return;

    const isBottom = this.placement === 'bottom';
    const surface = this.sheetEl;
    if (!surface) return;

    this.drag = attachDrag(surface, {
      axis: isBottom ? 'y' : 'x',
      threshold: 6,
      preventScroll: true,
      /* Keep CSS touch-action so content can still scroll */
      touchAction: null,
      disabled: () => (!this.visible && !this.open) || this.settling,
      minY: isBottom ? 0 : undefined,
      maxY: isBottom ? () => this.sheetEl?.offsetHeight ?? 0 : undefined,
      canStart: (e) => this.canStartDrag(e, isBottom),
      onStart: () => {
        this.crossedThreshold = false;
        this.dragOffset = 0;
      },
      onActivate: () => {
        this.dragging = true;
        /* Lock rest translate so CSS scale rule can drop without a jump */
        this.applyDragTransform(0);
        haptic.selection();
        this.emit('k3-drag-start', { placement: this.placement });
      },
      onMove: (d) => this.onDragMove(d, isBottom),
      onEnd: (d) => void this.onDragEnd(d, isBottom),
    });
  }

  private canStartDrag(e: PointerEvent, isBottom: boolean): boolean {
    if (!this.draggable || this.settling) return false;
    if (!(this.visible || this.open)) return false;
    const path = e.composedPath();
    /* Never steal clicks from links / buttons / form controls / disclosures.
     * Drag handle is role=button — allow it explicitly. */
    for (const n of path) {
      if (!(n instanceof Element)) continue;
      if (this.handleEl && (n === this.handleEl || this.handleEl.contains(n))) {
        return true;
      }
      if (
        n.closest(
          'a, button, input, textarea, select, label, summary, details, [href], [role="link"], [role="button"]',
        )
      ) {
        return false;
      }
    }
    if (isBottom) {
      if (this.handleEl && path.includes(this.handleEl)) return true;
      if (this.headerEl && path.includes(this.headerEl)) return true;
      const content = this.contentEl;
      if (content && path.includes(content)) {
        return content.scrollTop <= 0;
      }
      return true;
    }
    /* Side: prefer chrome; allow content only if not mid-scroll */
    if (this.headerEl && path.includes(this.headerEl)) return true;
    const content = this.contentEl;
    if (content && path.includes(content) && content.scrollHeight > content.clientHeight) {
      return false;
    }
    return true;
  }

  private dragAxis(): 'x' | 'y' {
    return this.placement === 'bottom' ? 'y' : 'x';
  }

  private applyDragTransform(offset: number): void {
    if (!this.sheetEl) return;
    this.dragOffset = offset;
    setAxisTranslate(this.sheetEl, this.dragAxis(), offset, this.dismissSign());
  }

  private syncBackdrop(offset: number, size: number): void {
    if (!this.backdropEl) return;
    const progress = size > 0 ? Math.min(1, offset / size) : 0;
    this.backdropEl.style.opacity = String(Math.max(0, 1 - progress));
  }

  /** Settle via shared {@link animateAxisTranslate} (snap / dismiss). */
  private async animateDragTo(
    offset: number,
    mode: 'snap' | 'dismiss',
  ): Promise<void> {
    if (!this.sheetEl) return;
    this.dragging = false;
    this.settling = true;
    await this.updateComplete;

    const el = this.sheetEl;
    const size = this.placement === 'bottom' ? el.offsetHeight : el.offsetWidth;
    if (this.backdropEl) {
      this.backdropEl.style.transition = `opacity var(--k3-sys-motion-duration-effects-fast, 150ms)
        var(--k3-sys-motion-easing-effects, var(--k3-sys-motion-easing-expressive-effects))`;
    }
    this.dragOffset = offset;
    this.syncBackdrop(offset, size || 1);
    await animateAxisTranslate(el, this.dragAxis(), offset, mode, this.dismissSign());
  }

  private onDragMove(d: DragDetail, isBottom: boolean): void {
    if (!d.active || !this.sheetEl) return;
    const sign = this.dismissSign();
    const raw = isBottom ? d.dy : d.dx;
    const offset = Math.max(0, raw * sign);
    this.applyDragTransform(offset);

    const size = isBottom ? this.sheetEl.offsetHeight : this.sheetEl.offsetWidth;
    this.syncBackdrop(offset, size);

    const posPx = resolveDismissThresholdPx(this.dismissThreshold, size);
    if (!this.crossedThreshold && offset >= posPx) {
      this.crossedThreshold = true;
      haptic.medium();
    } else if (this.crossedThreshold && offset < posPx * 0.85) {
      this.crossedThreshold = false;
    }

    this.emit('k3-drag', {
      placement: this.placement,
      offset,
      progress: size > 0 ? Math.min(1, offset / size) : 0,
    });
  }

  private async onDragEnd(d: DragDetail, isBottom: boolean): Promise<void> {
    const wasDragging = this.dragging;
    if (!wasDragging && !d.active) {
      this.dragging = false;
      this.clearDragTransform();
      return;
    }

    const offset = this.dragOffset;
    const size = isBottom
      ? (this.sheetEl?.offsetHeight ?? 1)
      : (this.sheetEl?.offsetWidth ?? 1);
    const sign = this.dismissSign();
    const velocity = isBottom ? d.velocityY * sign : d.velocityX * sign;
    const dismiss = shouldDismissDrag({
      offset,
      size,
      velocity,
      positionalThreshold: this.dismissThreshold,
      velocityThreshold: this.dismissVelocity,
    });

    this.emit('k3-drag-end', {
      placement: this.placement,
      offset,
      velocity,
      dismiss,
    });

    if (dismiss) {
      /* M3: continue fling off-screen, then tear down */
      await this.animateDragTo(size, 'dismiss');
      await this.hide('drag');
      return;
    }

    await this.animateDragTo(0, 'snap');
    this.clearDragTransform();
    haptic.light();
  }

  private clearDragTransform(): void {
    if (this.sheetEl) clearAxisTranslate(this.sheetEl);
    if (this.backdropEl) {
      this.backdropEl.style.opacity = '';
      this.backdropEl.style.removeProperty('transition');
    }
    this.dragOffset = 0;
    this.crossedThreshold = false;
    this.settling = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this.onKey);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.onKey);
    this.drag?.destroy();
    this.drag = null;
    /* Reparent to body fires disconnect — keep home markers for restore */
    if (!this.elevating) {
      this.homeParent = null;
      this.homeNext = null;
    }
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    /* Attribute `open` without show() — same enter path (slide, not pop) */
    if (changed.has('open')) {
      if (this.open && !this.visible) {
        void this.playEnter();
      } else if (!this.open && !this.visible) {
        this.restoreLayer();
      }
    }
    if (
      changed.has('draggable') ||
      changed.has('placement') ||
      changed.has('side') ||
      changed.has('open') ||
      changed.has('visible')
    ) {
      /* Rebind after DOM settles */
      requestAnimationFrame(() => this.bindDrag());
    }
  }

  override firstUpdated(): void {
    this.bindDrag();
  }

  override render() {
    /* Only `visible` drives .open — `open` alone must not skip the enter slide */
    const open = this.visible;
    const isBottom = this.placement === 'bottom';
    return html`
      ${this.modal
        ? html`<div
            class=${classMap({ backdrop: true, open, dragging: this.dragging })}
            part="backdrop"
            @click=${() => {
            if (!this.dragging) void this.hide('backdrop');
          }}
          ></div>`
        : null}
      <div
        class=${classMap({
          sheet: true,
          open,
          dragging: this.dragging,
          settling: this.settling,
          bottom: isBottom,
          side: !isBottom,
          start: !isBottom && this.side === 'start',
          end: !isBottom && this.side === 'end',
          'width-full': isBottom && this.width === 'full',
        })}
        part="container"
        role="dialog"
        aria-modal=${this.modal ? 'true' : 'false'}
        data-draggable=${this.draggable ? 'true' : 'false'}
      >
        ${isBottom && this.draggable
          ? html`<div
              class="handle"
              part="handle"
              role="button"
              tabindex="0"
              aria-label=${i18n.t('sheet.dragHandle')}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  void this.hide('user');
                }
              }}
            ></div>`
          : html`<div class="handle" part="handle" aria-hidden="true"></div>`}
        <div class="header" part="header">
          <div class="headline" part="headline"><slot name="headline"></slot></div>
          ${this.closeAction
        ? html`<button
                type="button"
                class="close"
                part="close"
                aria-label=${i18n.t('sheet.close')}
                @click=${() => void this.hide('user')}
              >
                <span
                  class="close-glyph notranslate"
                  translate="no"
                  lang="zxx"
                  data-k3-icon="close"
                  aria-hidden="true"
                ></span>
              </button>`
        : null}
        </div>
        <div
          class=${classMap({ content: true, 'k3-scroll': !isBottom })}
          part="content"
        >
          <slot></slot>
        </div>
        <div class="actions ${this.hasSlot('actions') ? 'has' : ''}" part="actions">
          <slot name="actions"></slot>
        </div>
      </div>
    `;
  }
}
export default K3Sheet;
