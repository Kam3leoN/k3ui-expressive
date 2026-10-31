import { html, nothing, css, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import {
  K3Element,
  runOpenClose,
  hasNamedSlot,
  afterPaint,
  attachOutsideDismiss,
  type OutsideDismissController,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  resolveFloatingTipPlacement,
  type TooltipPosition,
} from './tooltip-placement.js';

export type { TooltipPosition } from './tooltip-placement.js';

/** Popover top-layer — escapes overflow:hidden ancestors (dialogs / sheets / cards). */
type PopoverEl = HTMLElement & {
  showPopover?: () => void;
  hidePopover?: () => void;
  popover?: string;
};

function supportsPopoverApi(el: HTMLElement): boolean {
  return typeof (el as PopoverEl).showPopover === 'function';
}

function openPopoverLayer(el: HTMLElement): boolean {
  const host = el as PopoverEl;
  if (typeof host.showPopover !== 'function') return false;
  try {
    host.popover = 'manual';
    host.showPopover();
    return host.matches(':popover-open');
  } catch {
    return false;
  }
}

function closePopoverLayer(el: HTMLElement): void {
  const host = el as PopoverEl;
  if (typeof host.hidePopover !== 'function') return;
  try {
    if (host.matches(':popover-open')) host.hidePopover();
  } catch {
    /* ignore */
  }
}

/** Plain (inverse, one-line) · rich (surface, subhead + body + actions). */
export type TooltipVariant = 'plain' | 'rich';

/**
 * M3 tooltip — plain or rich (header + supporting text + action buttons).
 *
 * @see https://m3.material.io/components/tooltips/overview
 */
export class K3Tooltip extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        display: inline-flex;
        position: relative;
        z-index: 0;
        --k3-tooltip-gap: 0.5rem; /* 8dp — clearer separation from anchor */
        /* +1 LTR · −1 RTL — flips logical start/end enter slides */
        --k3-tooltip-inline-sign: 1;
      }
      /*
       * Connected button-group segment — fill the equal-width track so
       * wrapping a k3-button does not punch visual gaps in the bar.
       * data-bg / data-connected are set by k3-button-group.
       */
      :host([data-bg]),
      :host([data-connected]) {
        display: flex;
        align-self: stretch;
        box-sizing: border-box;
        min-width: 0;
        max-width: 100%;
        height: auto;
      }
      :host([data-bg]) span[part='anchor'],
      :host([data-connected]) span[part='anchor'] {
        display: flex;
        flex: 1 1 auto;
        align-items: stretch;
        width: 100%;
        min-width: 0;
        height: 100%;
        max-width: none;
      }
      :host([data-bg]) ::slotted(k3-button),
      :host([data-bg]) ::slotted(k3-icon-button),
      :host([data-connected]) ::slotted(k3-button),
      :host([data-connected]) ::slotted(k3-icon-button) {
        flex: 1 1 auto;
        width: 100%;
        min-width: 0;
        align-self: stretch;
      }
      /* Temporary elevation while open — tip must clear sibling chrome */
      :host([data-open]) {
        z-index: var(--k3-tooltip-elevate-z, 50);
      }
      :host(:dir(rtl)),
      :host-context([dir='rtl']) {
        --k3-tooltip-inline-sign: -1;
      }

      .tip {
        position: absolute;
        z-index: 40;
        box-sizing: border-box;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        will-change: opacity, transform;
        /*
         * Align: --tx/--ty · Enter: --ax/--ay (±1) × --slide × --enter (1→0)
         * Origin (--ox/--oy) = attachment edge so scale+slide stays axial
         * (not diagonal). NW/SW ↔ NE/SE are mirrors (Popper / Floating UI).
         */
        --k3-tooltip-tx: -50%;
        --k3-tooltip-ty: 0%;
        --k3-tooltip-ox: 50%;
        --k3-tooltip-oy: 100%; /* top default — grow from bottom center */
        --k3-tooltip-ax: 0;
        --k3-tooltip-ay: 1; /* top default — rise into place */
        --k3-tooltip-slide: 0.75rem; /* 12dp — readable enter travel */
        --k3-tooltip-enter: 1;
        --k3-tooltip-scale: 0.88;
        transform-origin: var(--k3-tooltip-ox) var(--k3-tooltip-oy);
        transform: translate(var(--k3-tooltip-tx), var(--k3-tooltip-ty))
          translate(
            calc(var(--k3-tooltip-ax) * var(--k3-tooltip-slide) * var(--k3-tooltip-enter)),
            calc(var(--k3-tooltip-ay) * var(--k3-tooltip-slide) * var(--k3-tooltip-enter))
          )
          scale(var(--k3-tooltip-scale));
        /* Exit — slightly snappier */
        transition:
          opacity var(--k3-sys-motion-duration-short4, 200ms)
            var(--k3-sys-motion-easing-emphasized-accelerate, cubic-bezier(0.3, 0, 0.8, 0.15)),
          transform var(--k3-sys-motion-duration-medium2, 300ms)
            var(--k3-sys-motion-easing-emphasized-accelerate, cubic-bezier(0.3, 0, 0.8, 0.15)),
          visibility 0ms linear var(--k3-sys-motion-duration-short4, 200ms);
      }
      /*
       * Floating — fixed (+ optional popover top-layer) so tips clear
       * overflow:hidden on dialogs / sheets / cards / scrollports.
       * left/top set in syncFloatingTip(); inset rules below are neutralized.
       */
      /*
       * Floating — beat position=* inset rules (higher specificity) then JS
       * sets left/top. Never inset:!important (overrides inline coords → 0,0).
       */
      :host .tip[data-floating],
      :host([position]) .tip[data-floating] {
        position: fixed;
        inset: unset;
        top: unset;
        right: unset;
        bottom: unset;
        left: unset;
        margin: 0;
        z-index: var(--k3-tooltip-floating-z, 1200);
      }
      span[part='anchor'] {
        display: inline-flex;
        align-items: stretch;
        max-width: 100%;
      }

      /* ── Plain — inverse surface, single line (M3 · theme light/dark) ──── */
      .tip.plain {
        max-width: min(12.5rem, 85vw); /* 200dp */
        padding: 0.25rem 0.5rem; /* 4×8 */
        border-radius: var(--k3-sys-shape-corner-extra-small, 0.25rem); /* 4dp */
        background: var(--k3-sys-color-inverse-surface);
        color: var(--k3-sys-color-inverse-on-surface);
        /* Hairline so the tip still reads on near-inverse / MCU surfaces */
        border: 1px solid
          color-mix(in srgb, var(--k3-sys-color-inverse-on-surface) 20%, transparent);
        font-size: var(--k3-sys-typescale-body-small-size, 0.75rem);
        line-height: var(--k3-sys-typescale-body-small-line-height, 1rem);
        font-weight: var(--k3-sys-typescale-body-small-weight, 400);
        white-space: nowrap;
      }

      /* ── Rich — elevated surface, multi-line + actions ─────────────────── */
      .tip.rich {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.375rem; /* 6 */
        width: max-content;
        min-width: 11.5rem; /* 184 */
        max-width: min(22rem, 85vw); /* 352 */
        padding: 1rem 1.125rem 0.625rem; /* 16×18 · bottom 10 */
        border-radius: var(--k3-sys-shape-corner-medium); /* 12 */
        background: var(--k3-sys-color-surface-container);
        color: var(--k3-sys-color-on-surface-variant);
        border: 1px solid var(--k3-sys-color-outline-variant);
        box-shadow: var(--k3-sys-elevation-level2);
        white-space: normal;
        /* Rich stays interactive when open (action buttons) */
        pointer-events: none;
      }
      .tip.rich.open {
        pointer-events: auto;
      }
      .tip.rich .headline {
        margin: 0;
        color: var(--k3-sys-color-on-surface);
        font-size: var(--k3-sys-typescale-title-medium-size, 1rem);
        line-height: var(--k3-sys-typescale-title-medium-line-height, 1.5rem);
        font-weight: var(--k3-sys-typescale-title-medium-weight, 500);
      }
      .tip.rich .headline:not(.has) {
        display: none;
      }
      .tip.rich .body {
        margin: 0;
        font-size: var(--k3-sys-typescale-body-large-size, 1rem);
        line-height: var(--k3-sys-typescale-body-large-line-height, 1.5rem);
        font-weight: var(--k3-sys-typescale-body-large-weight, 400);
        color: var(--k3-sys-color-on-surface-variant);
      }
      .tip.rich .body:not(.has) {
        display: none;
      }
      .tip.rich .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5rem;
        margin-inline: -0.5rem; /* align text buttons with content edge */
        margin-block-start: 0.25rem;
        padding-block-end: 0.25rem;
      }
      .tip.rich .actions:not(.has) {
        display: none;
      }
      .tip.rich .actions ::slotted(k3-button),
      .tip.rich .actions ::slotted(button) {
        margin: 0;
      }

      /* ── Top / bottom (centered) — slide along block axis ──────────────── */
      :host([position='top']) .tip,
      :host(:not([position])) .tip {
        inset: auto auto calc(100% + var(--k3-tooltip-gap)) 50%;
        --k3-tooltip-tx: -50%;
        --k3-tooltip-ty: 0%;
        --k3-tooltip-ox: 50%;
        --k3-tooltip-oy: 100%;
        --k3-tooltip-ax: 0;
        --k3-tooltip-ay: 1;
      }
      :host([position='bottom']) .tip {
        inset: calc(100% + var(--k3-tooltip-gap)) auto auto 50%;
        --k3-tooltip-tx: -50%;
        --k3-tooltip-ty: 0%;
        --k3-tooltip-ox: 50%;
        --k3-tooltip-oy: 0%;
        --k3-tooltip-ax: 0;
        --k3-tooltip-ay: -1;
      }

      /* ── Physical left / right — never flipped by dir ──────────────────── */
      :host([position='left']) .tip {
        inset: 50% calc(100% + var(--k3-tooltip-gap)) auto auto;
        --k3-tooltip-tx: 0%;
        --k3-tooltip-ty: -50%;
        --k3-tooltip-ox: 100%;
        --k3-tooltip-oy: 50%;
        --k3-tooltip-ax: 1;
        --k3-tooltip-ay: 0;
      }
      :host([position='right']) .tip {
        inset: 50% auto auto calc(100% + var(--k3-tooltip-gap));
        --k3-tooltip-tx: 0%;
        --k3-tooltip-ty: -50%;
        --k3-tooltip-ox: 0%;
        --k3-tooltip-oy: 50%;
        --k3-tooltip-ax: -1;
        --k3-tooltip-ay: 0;
      }

      /*
       * Logical start / end — ax uses --inline-sign so LTR/RTL both slide
       * from the anchor toward the tip (not a flat fade).
       */
      :host([position='start']) .tip {
        top: 50%;
        bottom: auto;
        inset-inline-end: calc(100% + var(--k3-tooltip-gap));
        inset-inline-start: auto;
        --k3-tooltip-tx: 0%;
        --k3-tooltip-ty: -50%;
        --k3-tooltip-ox: 100%;
        --k3-tooltip-oy: 50%;
        --k3-tooltip-ax: var(--k3-tooltip-inline-sign);
        --k3-tooltip-ay: 0;
      }
      :host([position='end']) .tip {
        top: 50%;
        bottom: auto;
        inset-inline-start: calc(100% + var(--k3-tooltip-gap));
        inset-inline-end: auto;
        --k3-tooltip-tx: 0%;
        --k3-tooltip-ty: -50%;
        --k3-tooltip-ox: 0%;
        --k3-tooltip-oy: 50%;
        --k3-tooltip-ax: calc(-1 * var(--k3-tooltip-inline-sign));
        --k3-tooltip-ay: 0;
      }
      :host(:dir(rtl))[position='start'] .tip,
      :host-context([dir='rtl'])[position='start'] .tip {
        --k3-tooltip-ox: 0%;
      }
      :host(:dir(rtl))[position='end'] .tip,
      :host-context([dir='rtl'])[position='end'] .tip {
        --k3-tooltip-ox: 100%;
      }

      /*
       * Corners (logical) — edge-aligned like Popper top-start/top-end.
       * Enter is block-axis only (ay); origin = attachment corner so NE/SE
       * mirror NW/SW instead of scaling diagonally from center.
       */
      :host([position='top-start']) .tip,
      :host([position='top-end']) .tip {
        top: auto;
        bottom: calc(100% + var(--k3-tooltip-gap));
        --k3-tooltip-tx: 0%;
        --k3-tooltip-ty: 0%;
        --k3-tooltip-oy: 100%;
        --k3-tooltip-ax: 0;
        --k3-tooltip-ay: 1;
      }
      :host([position='top-start']) .tip {
        inset-inline-start: 0;
        inset-inline-end: auto;
        --k3-tooltip-ox: 0%;
      }
      :host([position='top-end']) .tip {
        inset-inline-end: 0;
        inset-inline-start: auto;
        --k3-tooltip-ox: 100%;
      }
      :host([position='bottom-start']) .tip,
      :host([position='bottom-end']) .tip {
        top: calc(100% + var(--k3-tooltip-gap));
        bottom: auto;
        --k3-tooltip-tx: 0%;
        --k3-tooltip-ty: 0%;
        --k3-tooltip-oy: 0%;
        --k3-tooltip-ax: 0;
        --k3-tooltip-ay: -1;
      }
      :host([position='bottom-start']) .tip {
        inset-inline-start: 0;
        inset-inline-end: auto;
        --k3-tooltip-ox: 0%;
      }
      :host([position='bottom-end']) .tip {
        inset-inline-end: 0;
        inset-inline-start: auto;
        --k3-tooltip-ox: 100%;
      }
      /* RTL mirrors start/end attachment corners */
      :host(:dir(rtl))[position='top-start'] .tip,
      :host(:dir(rtl))[position='bottom-start'] .tip,
      :host-context([dir='rtl'])[position='top-start'] .tip,
      :host-context([dir='rtl'])[position='bottom-start'] .tip {
        --k3-tooltip-ox: 100%;
      }
      :host(:dir(rtl))[position='top-end'] .tip,
      :host(:dir(rtl))[position='bottom-end'] .tip,
      :host-context([dir='rtl'])[position='top-end'] .tip,
      :host-context([dir='rtl'])[position='bottom-end'] .tip {
        --k3-tooltip-ox: 0%;
      }

      /*
       * Open — only --enter / scale / opacity change (ax/ay stay).
       * @starting-style keeps --enter:1 so the slide actually runs.
       * :popover-open = top-layer escape (same paint as .open).
       */
      :host .tip.open,
      :host .tip:popover-open {
        opacity: 1;
        visibility: visible;
        --k3-tooltip-enter: 0;
        --k3-tooltip-scale: 1;
        transition:
          opacity var(--k3-sys-motion-duration-short4, 200ms)
            var(--k3-sys-motion-easing-expressive-effects, cubic-bezier(0.2, 0, 0, 1)),
          transform var(--k3-sys-motion-duration-spatial-fast, 350ms)
            var(--k3-sys-motion-easing-emphasized-decelerate, cubic-bezier(0.05, 0.7, 0.1, 1)),
          visibility 0ms linear 0ms;
      }
      @starting-style {
        :host .tip.open,
        :host .tip:popover-open {
          opacity: 0;
          --k3-tooltip-enter: 1;
          --k3-tooltip-scale: 0.88;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .tip,
        :host .tip.open,
        :host .tip:popover-open {
          transition: none !important;
        }
      }
    `,
  ];

  /** Plain label · rich supporting text when no `content` slot. */
  @property() content = '';
  /** Rich tooltip subhead / title. */
  @property() headline = '';
  /** `plain` (default) · `rich` (header + body + actions). */
  @property({ reflect: true }) variant: TooltipVariant = 'plain';
  /**
   * Side of the anchor — physical (`top`/`bottom`/`left`/`right`),
   * logical (`start`/`end`), or corners (`top-start`…).
   */
  @property({ reflect: true }) position: TooltipPosition = 'top';

  @state() private open = false;
  @state() private hasHeadlineSlot = false;
  @state() private hasContentSlot = false;
  @state() private hasActionsSlot = false;

  private hideTimer = 0;
  /** Guards overlapping show() while the enter paint settles. */
  private _opening = false;
  /**
   * Pointer/focus intent — separate from painted `open`.
   * Fixes sticky tip when mouseleave races an in-flight show() (nav-rail).
   */
  private _wantOpen = false;
  private _floatingBound = false;

  private get isRich(): boolean {
    return this.variant === 'rich';
  }

  private tipEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('.tip') ?? null;
  }

  /** Trigger box — slotted control when present, else host. */
  private anchorRect(): DOMRect {
    const slot = this.renderRoot?.querySelector(
      'span[part="anchor"] > slot',
    ) as HTMLSlotElement | null;
    const assigned = slot?.assignedElements({ flatten: true })[0];
    if (assigned instanceof HTMLElement) {
      const r = assigned.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) return r;
    }
    return this.getBoundingClientRect();
  }

  /**
   * Anchor tip in viewport coords so overflow ancestors cannot clip it.
   * Prefer Popover top-layer; fall back to position:fixed alone.
   *
   * Corner placements follow Floating UI / Popper: preferred side + alignment
   * (edge flush), not a diagonal exterior. Enter motion stays axial via
   * transform-origin on the attachment corner (NE mirrors NW, SE mirrors SW).
   */
  private syncFloatingTip = (): void => {
    if (!this.open && !this._wantOpen) return;
    const tip = this.tipEl();
    if (!tip) return;
    const r = this.anchorRect();
    const rtl = getComputedStyle(this).direction === 'rtl';
    const { left, top, tx, ty, ox, oy } = resolveFloatingTipPlacement(
      this.position || 'top',
      r,
      8,
      rtl,
    );

    tip.dataset.floating = '';
    tip.style.setProperty('left', `${Math.round(left)}px`);
    tip.style.setProperty('top', `${Math.round(top)}px`);
    tip.style.setProperty('right', 'auto');
    tip.style.setProperty('bottom', 'auto');
    tip.style.setProperty('--k3-tooltip-tx', tx);
    tip.style.setProperty('--k3-tooltip-ty', ty);
    tip.style.setProperty('--k3-tooltip-ox', ox);
    tip.style.setProperty('--k3-tooltip-oy', oy);
  };

  private bindFloatingReposition(on: boolean): void {
    if (on === this._floatingBound) return;
    this._floatingBound = on;
    const opts: AddEventListenerOptions = { capture: true, passive: true };
    if (on) {
      window.addEventListener('scroll', this.syncFloatingTip, opts);
      window.addEventListener('resize', this.syncFloatingTip);
    } else {
      window.removeEventListener('scroll', this.syncFloatingTip, opts);
      window.removeEventListener('resize', this.syncFloatingTip);
    }
  }

  private armFloatingTip(): void {
    const tip = this.tipEl();
    if (!tip) return;
    this.syncFloatingTip();
    openPopoverLayer(tip);
    this.syncFloatingTip();
    /* Second frame — layout/popover settle (connected groups / flex) */
    requestAnimationFrame(() => this.syncFloatingTip());
    this.bindFloatingReposition(true);
  }

  private disarmFloatingTip(): void {
    this.bindFloatingReposition(false);
    const tip = this.tipEl();
    if (!tip) return;
    closePopoverLayer(tip);
    tip.removeAttribute('data-floating');
    tip.style.removeProperty('left');
    tip.style.removeProperty('top');
    tip.style.removeProperty('right');
    tip.style.removeProperty('bottom');
    tip.style.removeProperty('--k3-tooltip-tx');
    tip.style.removeProperty('--k3-tooltip-ty');
    tip.style.removeProperty('--k3-tooltip-ox');
    tip.style.removeProperty('--k3-tooltip-oy');
    if (supportsPopoverApi(tip)) tip.removeAttribute('popover');
  }

  private syncSlots(): void {
    this.hasHeadlineSlot = hasNamedSlot(this, 'headline');
    this.hasContentSlot = hasNamedSlot(this, 'content');
    this.hasActionsSlot = hasNamedSlot(this, 'actions');
    /* Auto-promote to rich when rich-only slots are used */
    if (
      this.variant === 'plain' &&
      (this.hasHeadlineSlot || this.hasActionsSlot || !!this.headline)
    ) {
      this.variant = 'rich';
    }
  }

  private async show(): Promise<void> {
    this._wantOpen = true;
    this.toggleAttribute('data-open', true); /* elevate before tip paints */
    this.cancelHide();
    if (this.open) {
      this.armFloatingTip();
      return;
    }
    if (this._opening) return; /* in-flight — completes only if still wanted */
    this._opening = true;
    try {
      await runOpenClose(
        this,
        'open',
        async () => {
          /* Paint closed styles first — otherwise open snaps with no transition */
          await this.updateComplete;
          await afterPaint();
          if (!this._wantOpen) return; /* left during open — do not stick */
          if (this.open) return;
          this.open = true;
          await this.updateComplete;
          if (this._wantOpen) this.armFloatingTip();
        },
        { source: 'user' },
      );
    } finally {
      this._opening = false;
      /* Leave raced the open sequence — ensure closed */
      if (!this._wantOpen && this.open) {
        this.disarmFloatingTip();
        this.open = false;
        await this.updateComplete;
      }
    }
  }

  private async hide(): Promise<void> {
    this._wantOpen = false;
    if (!this.open) this.toggleAttribute('data-open', false);
    this.cancelHide();
    if (!this.open) {
      this.disarmFloatingTip();
      return;
    }
    await runOpenClose(
      this,
      'close',
      async () => {
        this.disarmFloatingTip();
        this.open = false;
        await this.updateComplete;
      },
      { source: 'user' },
    );
  }

  private cancelHide = (): void => {
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = 0;
    }
  };

  /** Delay hide so the pointer can move from anchor → rich tip (actions). */
  private scheduleHide = (): void => {
    this._wantOpen = false;
    this.cancelHide();
    const delay = this.isRich ? 120 : 0;
    if (delay === 0) {
      void this.hide();
      return;
    }
    this.hideTimer = window.setTimeout(() => {
      this.hideTimer = 0;
      if (!this._wantOpen) void this.hide();
    }, delay);
  };

  /** Host-level leave — catches nav-rail / nested button gaps mouseleave can miss. */
  private onHostPointerLeave = (e: PointerEvent): void => {
    const next = e.relatedTarget;
    if (next instanceof Node && this.contains(next)) return;
    this.scheduleHide();
  };

  private onHostPointerEnter = (): void => {
    void this.show();
  };

  private _outsideDismiss: OutsideDismissController | null = null;

  private onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && (this.open || this._wantOpen)) {
      void this.hide();
    }
  };

  private onActionClick = (e: Event): void => {
    const path = e.composedPath();
    const btn = path.find(
      (n) =>
        n instanceof HTMLElement &&
        (n.localName === 'k3-button' || n.localName === 'button'),
    ) as HTMLElement | undefined;
    if (!btn) return;
    this.emit('k3-action', { source: btn });
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('pointerenter', this.onHostPointerEnter);
    this.addEventListener('pointerleave', this.onHostPointerLeave);
    this.addEventListener('focusin', this.onHostPointerEnter);
    this.addEventListener('focusout', this.onHostFocusOut);
    this._outsideDismiss = attachOutsideDismiss(this, {
      isActive: () => this.open || this._wantOpen,
      onDismiss: () => void this.hide(),
    });
    document.addEventListener('keydown', this.onKeydown, true);
    queueMicrotask(() => this.syncSlots());
  }

  private onHostFocusOut = (e: FocusEvent): void => {
    const next = e.relatedTarget;
    if (next instanceof Node && this.contains(next)) return;
    this.scheduleHide();
  };

  override firstUpdated(): void {
    this.syncSlots();
    this.shadowRoot?.querySelectorAll('slot').forEach((slot) => {
      slot.addEventListener('slotchange', () => this.syncSlots());
    });
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('headline') || changed.has('variant') || changed.has('content')) {
      this.syncSlots();
    }
  }

  override disconnectedCallback(): void {
    this._wantOpen = false;
    this.cancelHide();
    this.disarmFloatingTip();
    this.removeEventListener('pointerenter', this.onHostPointerEnter);
    this.removeEventListener('pointerleave', this.onHostPointerLeave);
    this.removeEventListener('focusin', this.onHostPointerEnter);
    this.removeEventListener('focusout', this.onHostFocusOut);
    this._outsideDismiss?.detach();
    this._outsideDismiss = null;
    document.removeEventListener('keydown', this.onKeydown, true);
    if (this.open) this.open = false;
    super.disconnectedCallback();
  }

  override render() {
    const rich = this.isRich;
    const showHeadline = rich && (this.hasHeadlineSlot || !!this.headline);
    const showBody = rich && (this.hasContentSlot || !!this.content);
    const showActions = rich && this.hasActionsSlot;

    return html`
      <span part="anchor">
        <slot></slot>
      </span>
      <div
        class=${classMap({
      tip: true,
      open: this.open,
      plain: !rich,
      rich,
    })}
        part="tooltip"
        role=${rich ? 'dialog' : 'tooltip'}
        @pointerenter=${() => {
        if (rich) void this.show();
      }}
        @pointerleave=${() => {
        if (rich) this.scheduleHide();
      }}
      >
        ${rich
        ? html`
              <div
                class=${classMap({ headline: true, has: showHeadline })}
                part="headline"
              >
                ${this.hasHeadlineSlot
            ? html`<slot name="headline"></slot>`
            : this.headline || nothing}
              </div>
              <div class=${classMap({ body: true, has: showBody })} part="supporting-text">
                ${this.hasContentSlot
            ? html`<slot name="content"></slot>`
            : this.content || nothing}
              </div>
              <div
                class=${classMap({ actions: true, has: showActions })}
                part="actions"
                @click=${this.onActionClick}
              >
                <slot name="actions"></slot>
              </div>
            `
        : html`${this.content}<slot name="content"></slot>`}
      </div>
    `;
  }
}

export default K3Tooltip;
