import { html, css, type PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  runOpenClose,
  afterPaint,
  attachDrag,
  haptic,
  edgeScrollbarStyles,
  isRtl as readRtl,
  type DragController,
  type DragDetail,
} from '../../core/index.js';
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
  static override styles = [
    hostReset,
    edgeScrollbarStyles,
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
        transition: opacity var(--k3-sys-motion-duration-short4)
          var(--k3-sys-motion-easing-expressive-effects);
      }
      .backdrop.open {
        opacity: 1;
        pointer-events: auto;
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
        opacity: 0;
        pointer-events: none;
        transition:
          transform var(--k3-sys-motion-duration-spatial-default)
            var(--k3-sys-motion-easing-expressive-spatial),
          opacity var(--k3-sys-motion-duration-short4)
            var(--k3-sys-motion-easing-expressive-effects);
        will-change: transform;
      }
      .sheet.open {
        opacity: 1;
        pointer-events: auto;
      }
      .sheet.dragging {
        transition: none !important;
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
        transform: translateY(100%);
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
      .sheet.bottom.open:not(.dragging) {
        transform: translateY(0);
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
      }
      .sheet.bottom .handle:active {
        cursor: grabbing;
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
      .sheet.side.end {
        inset-inline-end: 0;
        inset-inline-start: auto;
        transform: translateX(100%);
      }
      .sheet.side.start {
        inset-inline-start: 0;
        inset-inline-end: auto;
        transform: translateX(-100%);
      }
      .sheet.side.open:not(.dragging) {
        transform: translateX(0);
      }
      :host(:dir(rtl)) .sheet.side.end:not(.open),
      :host(:dir(rtl)) .sheet.side.end.open:not(.dragging) {
        /* open = 0 handled above; closed direction flips in JS + closed rule */
      }
      :host(:dir(rtl)) .sheet.side.end:not(.open) {
        transform: translateX(-100%);
      }
      :host(:dir(rtl)) .sheet.side.start:not(.open) {
        transform: translateX(100%);
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
  /** Fraction of size (0–1) to dismiss on release — default 0.28 */
  @property({ type: Number, attribute: 'dismiss-threshold' }) dismissThreshold = 0.28;
  /** Velocity (px/ms) to dismiss — default 0.55 */
  @property({ type: Number, attribute: 'dismiss-velocity' }) dismissVelocity = 0.55;

  @state() private visible = false;
  @state() private dragging = false;

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
   * first open so the slide transition actually runs (no sudden pop-in).
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
      disabled: () => !this.visible && !this.open,
      minY: isBottom ? 0 : undefined,
      maxY: isBottom ? () => this.sheetEl?.offsetHeight ?? 0 : undefined,
      canStart: (e) => this.canStartDrag(e, isBottom),
      onStart: () => {
        this.crossedThreshold = false;
        this.dragOffset = 0;
      },
      onActivate: () => {
        this.dragging = true;
        haptic.selection();
        this.emit('k3-drag-start', { placement: this.placement });
      },
      onMove: (d) => this.onDragMove(d, isBottom),
      onEnd: (d) => void this.onDragEnd(d, isBottom),
    });
  }

  private canStartDrag(e: PointerEvent, isBottom: boolean): boolean {
    if (!this.draggable) return false;
    if (!(this.visible || this.open)) return false;
    const path = e.composedPath();
    /* Never steal clicks from links / buttons / form controls / disclosures */
    for (const n of path) {
      if (!(n instanceof Element)) continue;
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

  private onDragMove(d: DragDetail, isBottom: boolean): void {
    if (!d.active || !this.sheetEl) return;
    const sign = this.dismissSign();
    const raw = isBottom ? d.dy : d.dx;
    const offset = Math.max(0, raw * sign);
    this.dragOffset = offset;

    if (isBottom) {
      this.sheetEl.style.transform = `translateY(${offset}px)`;
    } else {
      this.sheetEl.style.transform = `translateX(${offset * sign}px)`;
    }

    const size = isBottom
      ? this.sheetEl.offsetHeight
      : this.sheetEl.offsetWidth;
    const progress = size > 0 ? Math.min(1, offset / size) : 0;
    if (this.backdropEl) {
      this.backdropEl.style.opacity = String(Math.max(0, 1 - progress));
    }

    if (!this.crossedThreshold && progress >= this.dismissThreshold) {
      this.crossedThreshold = true;
      haptic.medium();
    } else if (this.crossedThreshold && progress < this.dismissThreshold * 0.85) {
      this.crossedThreshold = false;
    }

    this.emit('k3-drag', {
      placement: this.placement,
      offset,
      progress,
    });
  }

  private async onDragEnd(d: DragDetail, isBottom: boolean): Promise<void> {
    const wasDragging = this.dragging;
    this.dragging = false;
    if (!wasDragging && !d.active) {
      this.clearDragTransform();
      return;
    }

    const sign = this.dismissSign();
    const offset = this.dragOffset;
    const size = isBottom
      ? (this.sheetEl?.offsetHeight ?? 1)
      : (this.sheetEl?.offsetWidth ?? 1);
    const velocity = isBottom ? d.velocityY * sign : d.velocityX * sign;
    const shouldDismiss =
      offset / size >= this.dismissThreshold || velocity >= this.dismissVelocity;

    this.emit('k3-drag-end', {
      placement: this.placement,
      offset,
      velocity,
      dismiss: shouldDismiss,
    });

    if (shouldDismiss) {
      /* Keep offset while close animation runs from current position */
      void this.hide('drag');
      return;
    }

    /* Snap back */
    this.clearDragTransform();
    haptic.light();
  }

  private clearDragTransform(): void {
    if (this.sheetEl) this.sheetEl.style.transform = '';
    if (this.backdropEl) this.backdropEl.style.opacity = '';
    this.dragOffset = 0;
    this.crossedThreshold = false;
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
        <div
          class="handle"
          part="handle"
          aria-hidden=${this.draggable && isBottom ? 'false' : 'true'}
        ></div>
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
