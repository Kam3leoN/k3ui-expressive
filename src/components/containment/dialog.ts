import { html, nothing, type PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  runOpenClose,
  afterPaint,
  FocusTrap,
  edgeScrollbarStyles,
  stateLayerStyles,
  hasNamedSlot,
  LayerPortal,
  haptic,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import { dialogStyles } from './dialog.styles.js';
import { deriveDialogFooterChrome } from './dialog-chrome.js';
import {
  registerSheetChromeHost,
  unregisterSheetChromeHost,
  recomputeSheetChromeShift,
  markSheetChromeOpening,
  clearSheetChromeOpening,
} from './sheet-chrome-shift.js';

/**
 * Dialog variant — M3 anatomy.
 * - `basic` — centered modal (280–560dp, 28dp corners)
 * - `fullscreen` — edge-to-edge task surface; **compact only** when `adaptive`
 *   (default). At ≥600dp the layout swaps to basic (M3 Adaptive design).
 *
 * @see https://m3.material.io/components/dialogs/guidelines
 * @see https://m3.material.io/components/dialogs/specs
 */
export type DialogVariant = 'basic' | 'fullscreen';

/** Compact window — M3 width &lt; 600dp (fullscreen dialogs stay here). */
const COMPACT_MQ = '(max-width: 599.98px)';

/**
 * Material 3 Dialog — basic + fullscreen (adaptive).
 *
 * Fixed **header** · scrollable **body** (edge scrollbar) · fixed **footer**.
 * Optional 1dp dividers appear when the body can scroll past the edges.
 *
 * Open dialogs elevate to `document.body` so they stack above chrome
 * (nav-rail, app bar) — same pattern as `k3-sheet`.
 *
 * ```html
 * <k3-dialog variant="basic">
 *   <span slot="headline">Title</span>
 *   Body
 *   <k3-button slot="actions" variant="text">OK</k3-button>
 * </k3-dialog>
 *
 * <k3-dialog variant="fullscreen">
 *   <span slot="headline">New event</span>
 *   <k3-button slot="header-actions" variant="text">Save</k3-button>
 *   Form fields…
 * </k3-dialog>
 * ```
 */
export class K3Dialog extends K3Element {
  static override styles = [hostReset, stateLayerStyles, edgeScrollbarStyles, dialogStyles];

  /** basic (default) · fullscreen */
  @property({ reflect: true }) variant: DialogVariant = 'basic';
  @property({ type: Boolean, reflect: true }) open = false;
  /**
   * When `variant="fullscreen"`, swap to basic at ≥600dp (M3 Adaptive).
   * Set `adaptive="false"` to force edge-to-edge on all breakpoints
   * (still elevates to body so the rail is covered — do not offset under it).
   */
  @property({ type: Boolean, reflect: true }) adaptive = true;
  /**
   * Append a text Close action in the footer (basic / adapted).
   * Resolved fullscreen uses the header X instead.
   */
  @property({ type: Boolean, attribute: 'close-action' }) closeAction = true;

  @state() private visible = false;
  /** True while window width is compact (&lt;600dp). */
  @state() private compact = true;
  @state() private headerElevated = false;
  @state() private footerElevated = false;
  @state() private hasIcon = false;
  @state() private hasHeaderActions = false;
  @state() private hasFooterActions = false;

  @query('.panel') private panelEl!: HTMLElement;
  @query('.body') private bodyEl!: HTMLElement;

  private trap = new FocusTrap();
  private onKey?: (e: KeyboardEvent) => void;
  private compactMq: MediaQueryList | null = null;
  private readonly portal = new LayerPortal();
  /** In-flight enter — shared by show() and `open` attribute. */
  private enterPromise: Promise<void> | null = null;

  /** Effective fullscreen after adaptive swap. */
  private isFullscreen(): boolean {
    if (this.variant !== 'fullscreen') return false;
    if (!this.adaptive) return true;
    return this.compact;
  }

  private onCompactChange = (): void => {
    this.compact = this.compactMq?.matches ?? true;
    this.syncSlots();
  };

  private elevateLayer(): void {
    this.portal.elevate(this);
  }

  private restoreLayer(): void {
    this.portal.restore(this);
  }

  /**
   * Paint closed state first, then flip `.open` — required after portal /
   * first open so fade / Y-slide actually runs (no sudden pop-in).
   * Basic = scaleY + spatial-fast overshoot (menus); fullscreen = translateY + fade.
   */
  private playEnter(): Promise<void> {
    if (this.visible) return Promise.resolve();
    if (this.enterPromise) return this.enterPromise;
    this.enterPromise = (async () => {
      this.elevateLayer();
      this.visible = false;
      await this.updateComplete;
      void this.panelEl?.offsetWidth; /* commit closed transform */
      await afterPaint();
      this.visible = true;
      await this.updateComplete;
    })().finally(() => {
      this.enterPromise = null;
    });
    return this.enterPromise;
  }

  /** Dialogs always act as modal overlays for floating chrome. */
  get modal(): boolean {
    return true;
  }

  /** Used by sheet-chrome-shift. */
  isSheetVisible(): boolean {
    return this.visible || this.open;
  }

  /** Dialog panel bounds — FAB perimeter conceal. */
  getOverlayZone(): DOMRectReadOnly | null {
    const el = this.panelEl;
    if (!el || !(this.visible || this.open)) return null;
    const r = el.getBoundingClientRect();
    return r.width >= 1 && r.height >= 1 ? r : null;
  }

  /** Centered basic panel estimate while opening (not full viewport). */
  getOpeningOverlayZone(): DOMRectReadOnly | null {
    if (typeof window === 'undefined') return null;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    if (this.isFullscreen()) {
      return new DOMRect(0, 0, w, h);
    }
    const pw = Math.min(35 * 16, w - 3 * 16); /* max 560 · 24dp*2 */
    const ph = Math.min(h * 0.8, 40 * 16);
    return new DOMRect((w - pw) / 2, (h - ph) / 2, pw, ph);
  }

  async show(): Promise<boolean> {
    const ok = await runOpenClose(
      this,
      'open',
      async () => {
        this.syncSlots();
        this.open = true;
        /* Kick FAB/STT hide before enter — fades during elevate/paint (no await). */
        markSheetChromeOpening(this);
        await this.playEnter();
        requestAnimationFrame(() => this.syncScrollEdges());
        this.trap.activate(this.panelEl);
        this.onKey = (e: KeyboardEvent) => {
          if (e.key === 'Escape') void this.hide('escape');
        };
        window.addEventListener('keydown', this.onKey);
        /* Surface open — same light tick as sheet / FAB menus */
        haptic.light();
      },
      { source: 'api' },
    );
    if (ok) {
      requestAnimationFrame(() => recomputeSheetChromeShift());
    } else {
      clearSheetChromeOpening(this);
      recomputeSheetChromeShift();
    }
    return ok;
  }

  async hide(source: 'user' | 'api' | 'escape' | 'backdrop' = 'api'): Promise<boolean> {
    clearSheetChromeOpening(this);
    const ok = await runOpenClose(
      this,
      'close',
      async () => {
        this.visible = false;
        this.open = false;
        if (this.onKey) window.removeEventListener('keydown', this.onKey);
        this.trap.deactivate();
        haptic.light();
      },
      { source },
    );
    if (ok) this.restoreLayer();
    recomputeSheetChromeShift();
    return ok;
  }

  private syncSlots = (): void => {
    this.hasIcon = hasNamedSlot(this, 'icon');
    this.hasHeaderActions = hasNamedSlot(this, 'header-actions');
    const chrome = deriveDialogFooterChrome({
      fullscreen: this.isFullscreen(),
      closeAction: this.closeAction,
      hasHeaderActions: this.hasHeaderActions,
      hasActionsSlot: hasNamedSlot(this, 'actions'),
    });
    this.hasFooterActions = chrome.hasFooterActions;
  };

  private syncScrollEdges = (): void => {
    const el = this.bodyEl;
    if (!el) {
      this.headerElevated = false;
      this.footerElevated = false;
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    const max = scrollHeight - clientHeight;
    this.headerElevated = scrollTop > 1;
    this.footerElevated = max > 1 && scrollTop < max - 1;
  };

  private onBodyScroll = (): void => {
    this.syncScrollEdges();
  };

  private renderHeaderActions() {
    return html`
      <div
        class=${classMap({ 'header-actions': true, has: this.hasHeaderActions })}
        part="header-actions"
      >
        <slot name="header-actions" @slotchange=${this.syncSlots}></slot>
      </div>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    registerSheetChromeHost(this);
    if (typeof matchMedia === 'function') {
      this.compactMq = matchMedia(COMPACT_MQ);
      this.compact = this.compactMq.matches;
      this.compactMq.addEventListener('change', this.onCompactChange);
    }
  }

  override firstUpdated(): void {
    this.syncSlots();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    /* Attribute `open` without show() — enter path only (no 2nd open-start) */
    if (changed.has('open')) {
      if (this.open && !this.visible) {
        markSheetChromeOpening(this);
        void this.playEnter().then(() => {
          requestAnimationFrame(() => recomputeSheetChromeShift());
        });
      } else if (!this.open && !this.visible) {
        clearSheetChromeOpening(this);
        this.restoreLayer();
        recomputeSheetChromeShift();
      }
    }
    if (changed.has('visible') && this.visible) {
      requestAnimationFrame(() => recomputeSheetChromeShift());
    }
    if (
      changed.has('variant') ||
      changed.has('closeAction') ||
      changed.has('adaptive') ||
      changed.has('compact')
    ) {
      /* Defer past this update cycle — avoid Lit change-in-update */
      queueMicrotask(() => this.syncSlots());
    }
  }

  override disconnectedCallback(): void {
    if (this.onKey) window.removeEventListener('keydown', this.onKey);
    this.trap.deactivate();
    this.compactMq?.removeEventListener('change', this.onCompactChange);
    this.compactMq = null;
    /* Reparent to body fires disconnect — keep home markers for restore */
    if (!this.portal.isElevating) {
      unregisterSheetChromeHost(this);
      this.portal.clearHome();
    }
    super.disconnectedCallback();
  }

  override render() {
    const fullscreen = this.isFullscreen();
    const role = fullscreen ? 'dialog' : 'alertdialog';
    const { headerInFooter, showDefaultClose } = deriveDialogFooterChrome({
      fullscreen,
      closeAction: this.closeAction,
      hasHeaderActions: this.hasHeaderActions,
      hasActionsSlot: hasNamedSlot(this, 'actions'),
    });

    return html`
      <div
        class=${classMap({ backdrop: true, open: this.visible })}
        part="backdrop"
        @click=${() => this.hide('backdrop')}
      ></div>
      <div
        class=${classMap({
      panel: true,
      open: this.visible,
      basic: !fullscreen,
      fullscreen,
      'has-icon': this.hasIcon && !fullscreen,
    })}
        part="container"
        role=${role}
        aria-modal="true"
      >
        <header class="header" part="header">
          <button
            type="button"
            class="close k3-state-layer"
            part="close"
            aria-label=${i18n.t('dialog.close')}
            @click=${() => this.hide('user')}
          >
            <span
              class="close-glyph notranslate"
              translate="no"
              lang="zxx"
              data-k3-icon="close"
              aria-hidden="true"
            ></span>
          </button>
          <div class="header-main">
            <span class="icon" part="icon"><slot name="icon" @slotchange=${this.syncSlots}></slot></span>
            <div class="titles">
              <div class="headline" part="headline">
                <slot name="headline"></slot>
              </div>
            </div>
          </div>
          ${fullscreen ? this.renderHeaderActions() : nothing}
        </header>

        <div
          class=${classMap({ divider: true, on: this.headerElevated })}
          part="header-divider"
          aria-hidden="true"
        ></div>

        <div class="body k3-scroll" part="content" @scroll=${this.onBodyScroll}>
          <div class="body-inner">
            <slot @slotchange=${this.syncSlots}></slot>
            <slot name="content" @slotchange=${this.syncSlots}></slot>
          </div>
        </div>

        <div
          class=${classMap({ divider: true, on: this.footerElevated && this.hasFooterActions })}
          part="footer-divider"
          aria-hidden="true"
        ></div>

        <footer
          class=${classMap({ footer: true, has: this.hasFooterActions })}
          part="footer"
        >
          ${headerInFooter ? this.renderHeaderActions() : nothing}
          <slot name="actions" @slotchange=${this.syncSlots}></slot>
          ${showDefaultClose
        ? html`<k3-button variant="text" @k3-click=${() => this.hide('user')}
                >${i18n.t('dialog.close')}</k3-button
              >`
        : nothing}
        </footer>
      </div>
    `;
  }
}
export default K3Dialog;
