import { html, nothing, type PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  K3Element,
  runOpenClose,
  hasNamedSlot,
  afterPaint,
  stateLayerStyles,
  LayerPortal,
  rootRemPx,
  normalizeLabel,
  haptic,
  prefersReducedMotion,
  allowsExpressiveMotion,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import { snackbarStyles } from './snackbar.styles.js';
import { SNACKBAR_ICONS } from './snackbar-icons.js';
import {
  snackbarQueue,
  type SnackbarQueueBehavior,
} from './snackbar-queue.js';
import { PauseableTimeout } from './snackbar-timer.js';
import { applyChromeInset } from './snackbar-chrome.js';
import { SnackbarGoo, GOO_TIMING } from './snackbar-goo.js';

/** Horizontal placement on the anchored edge. */
export type SnackbarPosition = 'auto' | 'center' | 'start' | 'end';
/** Screen edge the snackbar enters from and leaves through. */
export type SnackbarEdge = 'bottom' | 'top';
/** `expressive` (M3E icon button that stretches) · `standard` (M3 bar). */
export type SnackbarMode = 'expressive' | 'standard';
/** Color role of the container. `inverse` = M3 spec. */
export type SnackbarVariant = 'inverse' | 'emphasized' | 'tonal' | 'error';
export type SnackbarDuration = 'short' | 'long' | 'indefinite' | number;

/** M3: action wider than ~128 dp stacks below the label. */
export const SNACKBAR_STACK_ACTION_DP = 128;

export const SNACKBAR_DURATION_MS = {
  short: 4000,
  long: 10000,
  indefinite: 0,
} as const;

/** Resolve duration token / ms → milliseconds (`0` = stay open). */
export function resolveSnackbarDuration(
  duration: SnackbarDuration | undefined,
  hasAction: boolean,
): number {
  if (duration === undefined) {
    return hasAction ? SNACKBAR_DURATION_MS.indefinite : SNACKBAR_DURATION_MS.short;
  }
  if (typeof duration === 'number') return Math.max(0, duration);
  if (duration === 'short') return SNACKBAR_DURATION_MS.short;
  if (duration === 'long') return SNACKBAR_DURATION_MS.long;
  return SNACKBAR_DURATION_MS.indefinite;
}

/** Whether the bar should stack (forced, or action wider than 128 dp). */
export function snackbarShouldStack(
  actionWidthPx: number,
  forced = false,
  remPx = 16,
): boolean {
  if (forced) return true;
  if (actionWidthPx <= 0) return false;
  const threshold = (SNACKBAR_STACK_ACTION_DP / 16) * remPx;
  return actionWidthPx > threshold;
}

function durationConverter(value: string | null): SnackbarDuration {
  if (value === null || value === '') return 'short';
  if (value === 'short' || value === 'long' || value === 'indefinite') return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 'short';
}

/**
 * Visual lifecycle
 * - expressive: hidden → entering → icon (circle rises from the edge, icon
 *   scales in) → expanded (stretches from the center) → collapsing (back to
 *   the circle) → leaving (out through the edge) → hidden
 * - standard: hidden → entering → expanded → leaving → hidden
 */
type Phase = 'hidden' | 'entering' | 'icon' | 'expanded' | 'collapsing' | 'leaving';
type LeadingKind = 'loading' | 'slot' | 'avatar' | 'svg' | 'font' | null;
type ExitKind = 'slide' | 'swipe' | null;

/** Durations (ms), matched to snackbar.styles.ts. */
const TIMING = {
  iconHold: 650, // circle rise + icon scale-in before the stretch
  collapse: 400,
  leave: 250,
  slideOut: 300, // stack: front slides out while others wait
  swipeOut: 220,
  standardLeave: 200,
  reducedLeave: 150,
  /** Fluid gooey — spatial-fast out (~405) + buffer */
  fluidLeave: 420,
  /** Fluid collapse width spring (~610 spatial-default is long; keep snappy) */
  fluidCollapse: 500,
  /** Fluid gooey expressive — drop falls back into the edge (snackbar-goo.ts) */
  gooLeave: GOO_TIMING.leave,
  settle: 450, // swipe too short → spring back
  pop: 450, // icon pop at the end of loading
  minResume: 1500, // floor after hover / focus pause
} as const;

function isFluidMotionScheme(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('data-k3-motion') === 'fluid';
}

/** Swipe to dismiss — 48 dp like before, touch / pen only. */
const SWIPE = { slop: 8, distance: 48, velocity: 0.5 } as const;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

/**
 * M3 / M3E Snackbar — short process updates on a screen edge.
 *
 * `mode="expressive"` (default): an icon button rises from the edge, its icon
 * (or a brand mark) scales in, then it stretches from the center into a full
 * radius pill. `mode="standard"`: the M3 bar slides in at full width.
 * Stack mode (`snackbarQueue.setStack(3)`): up to 3 visible in vertical
 * perspective, the rest queued.
 *
 * @see https://m3.material.io/components/snackbar/overview
 * @see https://m3.material.io/components/snackbar/specs
 */
export class K3Snackbar extends K3Element {
  static override styles = [hostReset, stateLayerStyles, snackbarStyles];

  /**
   * Auto-dismiss — `short` (4s) · `long` (10s) · `indefinite` / `0`.
   * With an action and no duration set, defaults to indefinite.
   */
  @property({
    converter: {
      fromAttribute: durationConverter,
      toAttribute: (v: SnackbarDuration) => String(v),
    },
  })
  duration: SnackbarDuration = 'short';

  /** Show built-in trailing close (after action). */
  @property({ type: Boolean, reflect: true }) dismissible = false;

  /** Text action label (optional). Prefer slot `action` for custom controls. */
  @property({ type: String }) action = '';

  /** Accessible name for the dismiss control. */
  @property({ type: String, attribute: 'close-label' }) closeLabel = '';

  /** Horizontal placement — default `center` (MDC). `start` / `end` opt-in. */
  @property({ type: String, reflect: true }) position: SnackbarPosition = 'center';

  /**
   * Force stacked layout (action on its own row). Also auto when action
   * &gt; 128 dp. A stacked snackbar always uses the standard motion.
   */
  @property({ type: Boolean, reflect: true }) stacked = false;

  /** Queue behavior when `show()` is called — `queue` · `replace` · `bypass`. */
  @property({ type: String, attribute: 'queue-behavior', reflect: true })
  queueBehavior: SnackbarQueueBehavior = 'queue';

  /** Nudge above FAB / bottom bar when open (default on). */
  @property({ type: Boolean, attribute: 'chrome-inset' }) chromeInset = true;

  /** `expressive` (default) · `standard`. `data-k3-motion="standard"` forces standard. */
  @property({ type: String, reflect: true }) mode: SnackbarMode = 'expressive';

  /** Container color role — `inverse` (M3) · `emphasized` · `tonal` · `error`. */
  @property({ type: String, reflect: true }) variant: SnackbarVariant = 'inverse';

  /** Edge it enters from and leaves through — `bottom` (default) · `top`. */
  @property({ type: String, reflect: true }) edge: SnackbarEdge = 'bottom';

  /**
   * Leading Material Symbol. Names in SNACKBAR_ICONS render as SVG (pixel
   * centered on iOS); others use the ligature font. Expressive falls back to
   * `check_circle` when nothing else is set.
   */
  @property({ type: String }) icon = '';

  /** Custom leading SVG path (viewBox `0 -960 960 960`). Wins over `icon`. */
  @property({ type: String, attribute: 'icon-path' }) iconPath = '';

  /** Round image (avatar, cover…) instead of the icon. Wins over `icon`. */
  @property({ type: String }) avatar = '';

  /**
   * Brand mark in the circle (expressive only), original colors. Shown at
   * opening only: it scales into the circle, then yields to the icon / avatar.
   */
  @property({ type: String, attribute: 'brand-icon' }) brandIcon = '';

  /** Second, quieter line (e.g. “Level 31”). */
  @property({ type: String, attribute: 'supporting-text' }) supportingText = '';

  /** Standard mode: no leading icon (M3 bar). Expressive always shows one. */
  @property({ type: Boolean, attribute: 'hide-icon' }) hideIcon = false;

  /**
   * M3 Expressive loading indicator in place of the icon (k3-loading-indicator
   * shape morph). The timer waits; when set back to false the icon pops in and
   * the timer starts.
   */
  @property({ type: Boolean, reflect: true }) loading = false;

  /** Stack depth set by the queue (0 = front). `null` = standalone. */
  @property({ attribute: false }) stackDepth: number | null = null;

  /** Set by the queue: others wait behind → close slides out instead of collapsing. */
  @property({ attribute: false }) stackSlideExit = false;

  @state() private phase: Phase = 'hidden';
  @state() private effMode: SnackbarMode = 'expressive';
  @state() private hasActionSlot = false;
  @state() private hasTrailingSlot = false;
  @state() private hasIconSlot = false;
  @state() private twoLine = false;
  @state() private autoStacked = false;
  @state() private enterBehind = false;
  @state() private exitKind: ExitKind = null;
  @state() private popIcon = false;
  @state() private hug: number | null = null;
  @state() private dragState: 'active' | 'settle' | null = null;
  @state() private dragX = 0;
  @state() private dragY = 0;
  @state() private dragOpacity = 1;
  /** Fluid gooey layer (fluid scheme + expressive, front, not reduced). */
  @state() private goo = false;

  @query('.bar') private barEl?: HTMLElement;
  @query('.label') private labelEl?: HTMLElement;
  @query('.action') private actionEl?: HTMLElement;
  @query('.goo') private gooEl?: SVGSVGElement;

  private readonly portal = new LayerPortal();
  private readonly dismissTimer = new PauseableTimeout(() => void this.hide('auto'));
  private readonly gooFx = new SnackbarGoo(
    () => this.barEl,
    () => this.gooEl,
  );
  private chromeRo?: ResizeObserver;
  private onWinResize?: () => void;
  private reduced = false;
  private hovering = false;
  private drag: {
    id: number;
    x0: number;
    y0: number;
    axis: 'x' | 'y' | null;
    lastX: number;
    lastY: number;
    lastT: number;
    vx: number;
    vy: number;
    width: number;
  } | null = null;

  /** True from the start of the opening until the close begins. */
  get isOpen(): boolean {
    return this.phase === 'entering' || this.phase === 'icon' || this.phase === 'expanded';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.refreshSlots();
  }

  override disconnectedCallback(): void {
    /* Moving to <body> while opening (layer portal) is not a removal */
    if (!this.portal.isElevating) {
      this.teardownChrome();
      this.dismissTimer.clear();
      this.gooFx.stop();
      snackbarQueue.cancel(this);
      this.portal.clearHome();
    }
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('loading') && this.loading) {
      /* Child component, loaded on demand (registry deps: k3-loading-indicator) */
      void import('./loading-indicator.js');
    }
  }

  override updated(changed: PropertyValues<this>): void {
    if (changed.has('stackDepth')) {
      if (this.stackDepth === null) {
        this.removeAttribute('data-depth');
        this.style.removeProperty('--_depth');
      } else {
        this.setAttribute('data-depth', String(this.stackDepth));
        this.style.setProperty('--_depth', String(this.stackDepth));
      }
    }
    if ((changed.has('stackDepth') || changed.has('loading')) && this.phase === 'expanded') {
      if (this.isHeld) this.dismissTimer.pause();
      else if (!this.hovering) this.dismissTimer.resume(0);
    }
    if (changed.has('loading') && changed.get('loading') === true && !this.loading && this.isOpen) {
      this.popIcon = true;
      window.setTimeout(() => (this.popIcon = false), TIMING.pop);
    }
    if ((changed.has('action') || changed.has('stacked')) && this.isOpen) {
      this.measureStack();
    }
  }

  private get isHeld(): boolean {
    return (this.stackDepth ?? 0) > 0 || this.loading;
  }

  private get isFront(): boolean {
    return (this.stackDepth ?? 0) === 0;
  }

  private elevateLayer(): void {
    this.portal.elevate(this);
  }

  private restoreLayer(): void {
    this.portal.restore(this);
  }

  private refreshSlots(): void {
    this.hasActionSlot = hasNamedSlot(this, 'action');
    this.hasTrailingSlot = hasNamedSlot(this, 'trailing');
    this.hasIconSlot = hasNamedSlot(this, 'icon');
  }

  private updateLineCount(): void {
    const el = this.labelEl;
    if (!el) return;
    const styles = getComputedStyle(el);
    const lh = Number.parseFloat(styles.lineHeight) || 20;
    const lines = Math.round(el.scrollHeight / lh);
    const chars = normalizeLabel(this.textContent ?? '').length;
    this.twoLine = lines >= 2 || chars > 40;
  }

  private measureStack(): void {
    if (this.stacked) {
      this.autoStacked = true;
      return;
    }
    const action = this.actionEl;
    if (!action || !this.showAction) {
      this.autoStacked = false;
      return;
    }
    const w = action.getBoundingClientRect().width;
    this.autoStacked = snackbarShouldStack(w, false, rootRemPx());
  }

  /** Natural width of the content (wide windows hug it, M3 expanded). */
  private measureHug(): number | null {
    const bar = this.barEl;
    const label = this.labelEl;
    if (!bar || !label) return null;
    const px = (v: string): number => Number.parseFloat(v) || 0;
    const bs = getComputedStyle(bar);
    let w = px(bs.paddingLeft) + px(bs.paddingRight);
    const lead = bar.querySelector<HTMLElement>('.leading');
    if (lead) w += lead.offsetWidth;
    const text = bar.querySelector<HTMLElement>('.text');
    if (text) {
      const ts = getComputedStyle(text);
      w += px(ts.paddingLeft) + px(ts.paddingRight);
    }
    const prev = label.style.whiteSpace;
    label.style.whiteSpace = 'nowrap';
    const labelW = label.scrollWidth;
    label.style.whiteSpace = prev;
    const sup = bar.querySelector<HTMLElement>('.supporting');
    w += Math.max(labelW, sup?.scrollWidth ?? 0);
    const trailing = bar.querySelector<HTMLElement>('.trailing.has');
    if (trailing) w += trailing.scrollWidth;
    return w > 0 ? Math.ceil(w) + 2 : null;
  }

  private syncChromeInset(): void {
    applyChromeInset(this, this.chromeInset && this.edge === 'bottom');
  }

  private setupChrome(): void {
    this.syncChromeInset();
    if (typeof ResizeObserver !== 'undefined') {
      this.chromeRo?.disconnect();
      this.chromeRo = new ResizeObserver(() => this.syncChromeInset());
      this.chromeRo.observe(document.documentElement);
    }
    this.onWinResize = () => this.syncChromeInset();
    window.addEventListener('resize', this.onWinResize);
  }

  private teardownChrome(): void {
    this.chromeRo?.disconnect();
    this.chromeRo = undefined;
    if (this.onWinResize) {
      window.removeEventListener('resize', this.onWinResize);
      this.onWinResize = undefined;
    }
    this.style.removeProperty('--k3-snackbar-inset-bottom');
  }

  /* ── Timer ─────────────────────────────────────────────── */

  private startTimer(): void {
    const ms = resolveSnackbarDuration(this.duration, this.showAction);
    if (this.isHeld || this.hovering) this.dismissTimer.prime(ms);
    else this.dismissTimer.start(ms);
  }

  private onBarPointerEnter = (): void => {
    this.hovering = true;
    this.dismissTimer.pause();
  };
  private onBarPointerLeave = (): void => {
    this.hovering = false;
    if (!this.isHeld && !this.drag?.axis) this.dismissTimer.resume(TIMING.minResume);
  };
  private onBarFocusIn = (): void => {
    this.hovering = true;
    this.dismissTimer.pause();
  };
  private onBarFocusOut = (e: FocusEvent): void => {
    const bar = this.barEl;
    const next = e.relatedTarget as Node | null;
    if (bar && next && (bar.contains(next) || this.contains(next))) return;
    this.hovering = false;
    if (!this.isHeld) this.dismissTimer.resume(TIMING.minResume);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.isOpen) {
      e.stopPropagation();
      void this.hide('user');
    }
  };

  /* ── Open ──────────────────────────────────────────────── */

  private async playEnter(): Promise<void> {
    this.reduced = prefersReducedMotion();
    this.toggleAttribute('data-reduce', this.reduced);
    this.effMode = this.mode === 'expressive' && allowsExpressiveMotion() ? 'expressive' : 'standard';
    this.enterBehind = (this.stackDepth ?? 0) > 0;
    this.exitKind = null;
    this.hug = null;
    this.resetDrag();

    this.elevateLayer();
    this.setupChrome();
    this.phase = 'entering';
    await this.updateComplete;

    /* Long action → stacked layout, which always uses the standard motion */
    this.measureStack();
    this.updateLineCount();
    if (this.stacked || this.autoStacked) this.effMode = 'standard';
    this.goo =
      !this.reduced &&
      !this.enterBehind &&
      this.effMode === 'expressive' &&
      isFluidMotionScheme();
    await this.updateComplete;
    this.hug = this.measureHug();
    await this.updateComplete;

    void this.barEl?.offsetWidth;
    await afterPaint();
    if (this.phase !== 'entering') return; /* closed meanwhile */

    if (this.enterBehind || this.effMode === 'standard') {
      this.phase = 'expanded';
    } else {
      this.phase = 'icon';
      if (this.goo) this.gooFx.enter(this.edge);
      await sleep(TIMING.iconHold);
      if (this.phase !== 'icon') return; /* closed meanwhile */
      this.phase = 'expanded';
      if (this.goo) this.gooFx.stretch();
    }
    this.startTimer();
  }

  /**
   * Open immediately (no queue). Prefer {@link show} for M3 one-at-a-time
   * (or stacked) behavior.
   */
  async showNow(): Promise<boolean> {
    if (this.isOpen) return true;
    this.refreshSlots();
    return runOpenClose(this, 'open', () => this.playEnter(), { source: 'api' });
  }

  /** Open via the global queue (default). */
  async show(): Promise<boolean> {
    return snackbarQueue.request(this, this.queueBehavior);
  }

  /* ── Close ─────────────────────────────────────────────── */

  private async playExit(source: string): Promise<void> {
    this.enterBehind = false;
    const fluid = isFluidMotionScheme();
    if (source === 'drag' && this.exitKind === 'swipe') {
      this.dragState = null;
      this.phase = 'leaving';
      await sleep(TIMING.swipeOut);
      return;
    }
    if (this.reduced || this.effMode === 'standard') {
      this.phase = 'leaving';
      await sleep(
        this.reduced
          ? TIMING.reducedLeave
          : fluid
            ? TIMING.fluidLeave
            : TIMING.standardLeave,
      );
      return;
    }
    if (this.stackSlideExit) {
      this.exitKind = 'slide';
      this.phase = 'leaving';
      await sleep(fluid ? TIMING.fluidLeave : TIMING.slideOut);
      return;
    }
    this.phase = 'collapsing';
    if (this.goo) this.gooFx.stretch(0.18);
    await sleep(fluid ? TIMING.fluidCollapse : TIMING.collapse);
    this.phase = 'leaving';
    if (this.goo) {
      this.gooFx.leave();
      await sleep(TIMING.gooLeave);
      return;
    }
    await sleep(fluid ? TIMING.fluidLeave : TIMING.leave);
  }

  async hide(source: 'user' | 'api' | 'auto' | 'drag' = 'api'): Promise<boolean> {
    if (!this.isOpen) return true;
    this.dismissTimer.clear();
    const ok = await runOpenClose(this, 'close', () => this.playExit(source), { source });
    if (ok) {
      this.teardownChrome();
      this.gooFx.stop();
      this.goo = false;
      this.phase = 'hidden';
      this.exitKind = null;
      this.hovering = false;
      await this.updateComplete;
      this.restoreLayer();
    } else if (this.phase === 'expanded') {
      this.startTimer(); /* close canceled — keep counting */
    }
    return ok;
  }

  /* ── Actions ───────────────────────────────────────────── */

  private onActionClick(e: Event): void {
    e.stopPropagation();
    /* User action only — never vibrate on auto-appear (low-priority surface). */
    haptic.light();
    this.dispatchEvent(
      new CustomEvent('k3-action', {
        bubbles: true,
        composed: true,
        detail: { source: 'user' },
      }),
    );
    void this.hide('user');
  }

  private onDismissClick(e: Event): void {
    e.stopPropagation();
    haptic.light();
    void this.hide('user');
  }

  private onSlotChange(): void {
    this.refreshSlots();
    if (this.isOpen) {
      this.updateLineCount();
      this.measureStack();
    }
    /* New label while open (e.g. end of loading): re-hug on wide windows */
    if (this.phase === 'expanded') {
      requestAnimationFrame(() => {
        if (this.phase === 'expanded') this.hug = this.measureHug();
      });
    }
  }

  /* ── Swipe to dismiss ──────────────────────────────────── */

  private onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' || this.phase !== 'expanded' || !this.isFront) return;
    const bar = this.barEl;
    this.drag = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      axis: null,
      lastX: e.clientX,
      lastY: e.clientY,
      lastT: e.timeStamp,
      vx: 0,
      vy: 0,
      width: bar?.offsetWidth || 1,
    };
  };

  private onPointerMove = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;

    if (!d.axis) {
      if (Math.hypot(dx, dy) < SWIPE.slop) return; /* still a tap */
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      try {
        this.barEl?.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
      this.dismissTimer.pause();
      this.dragState = 'active';
    }

    const dt = Math.max(1, e.timeStamp - d.lastT);
    d.vx = (e.clientX - d.lastX) / dt;
    d.vy = (e.clientY - d.lastY) / dt;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;

    if (d.axis === 'x') {
      this.dragX = dx;
      this.dragY = 0;
      this.dragOpacity = 1 - Math.min(Math.abs(dx) / d.width, 1) * 0.6;
    } else {
      /* Toward the edge: follows the finger. Away from it: resistance. */
      const toward = this.edge === 'top' ? -1 : 1;
      this.dragY = dy * toward > 0 ? dy : dy * 0.2;
      this.dragX = 0;
      this.dragOpacity = 1;
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    if (!d.axis) return; /* tap: the click goes on */

    const toward = this.edge === 'top' ? -1 : 1;
    const distance = d.axis === 'x' ? Math.abs(this.dragX) : this.dragY * toward;
    const velocity = d.axis === 'x' ? Math.abs(d.vx) : d.vy * toward;
    const fling = distance > SWIPE.slop && velocity >= SWIPE.velocity;

    if (e.type !== 'pointercancel' && (distance >= SWIPE.distance || fling)) {
      const rect = this.barEl?.getBoundingClientRect();
      if (d.axis === 'x') {
        this.dragX = Math.sign(this.dragX || d.vx || 1) * window.innerWidth;
      } else if (rect) {
        this.dragY = toward > 0 ? window.innerHeight - rect.top + 16 : -(rect.bottom + 16);
      }
      this.exitKind = 'swipe';
      haptic.light();
      void this.hide('drag');
      return;
    }

    /* Not far enough: spring back */
    this.dragState = 'settle';
    this.dragX = 0;
    this.dragY = 0;
    this.dragOpacity = 1;
    window.setTimeout(() => {
      if (this.dragState === 'settle') this.dragState = null;
    }, TIMING.settle);
    if (!this.isHeld && !this.hovering) this.dismissTimer.resume(TIMING.minResume);
  };

  private resetDrag(): void {
    this.drag = null;
    this.dragState = null;
    this.dragX = 0;
    this.dragY = 0;
    this.dragOpacity = 1;
  }

  /* ── Render ────────────────────────────────────────────── */

  private get dismissAria(): string {
    return this.closeLabel.trim() || i18n.t('snackbar.dismiss');
  }

  private get showAction(): boolean {
    return this.hasActionSlot || this.action.trim().length > 0;
  }

  private get showTrailing(): boolean {
    return this.dismissible || this.hasTrailingSlot;
  }

  private get hasBrand(): boolean {
    return this.effMode === 'expressive' && !this.enterBehind && this.brandIcon.trim().length > 0;
  }

  private get iconName(): string {
    if (this.icon.trim()) return this.icon.trim();
    /* Expressive needs something in the circle — unless a brand mark fills it */
    return this.effMode === 'expressive' && !this.brandIcon.trim() ? 'check_circle' : '';
  }

  private get leadingKind(): LeadingKind {
    if (this.effMode === 'standard' && this.hideIcon) return null;
    if (this.loading) return 'loading';
    if (this.hasIconSlot) return 'slot';
    if (this.avatar.trim()) return 'avatar';
    if (this.iconPath.trim() || SNACKBAR_ICONS[this.iconName]) return 'svg';
    if (this.iconName) return 'font';
    return null;
  }

  private renderLeading(kind: LeadingKind) {
    const pop = this.popIcon;
    switch (kind) {
      case 'loading':
        return html`<span class="leading loader" part="loader">
          <k3-loading-indicator></k3-loading-indicator>
        </span>`;
      case 'slot':
        return html`<span class="leading icon" part="icon" ?data-pop=${pop}>
          <slot name="icon" @slotchange=${this.onSlotChange}></slot>
        </span>`;
      case 'avatar':
        return html`<img
          class="leading avatar"
          part="avatar"
          src=${this.avatar}
          alt=""
          aria-hidden="true"
          ?data-pop=${pop}
        />`;
      case 'svg': {
        const d = this.iconPath.trim() || SNACKBAR_ICONS[this.iconName] || '';
        return html`<span class="leading icon" part="icon" aria-hidden="true" ?data-pop=${pop}>
          <svg viewBox="0 -960 960 960" focusable="false"><path d=${d}></path></svg>
        </span>`;
      }
      case 'font':
        return html`<span class="leading icon" part="icon" aria-hidden="true" ?data-pop=${pop}>
          <span
            class="ms notranslate"
            translate="no"
            lang="zxx"
            data-k3-icon=${this.iconName}
          ></span>
        </span>`;
      default:
        return nothing;
    }
  }

  /** Goo layer — shapes only, drawn by SnackbarGoo (blur + alpha threshold). */
  private renderGoo() {
    return html`<svg class="goo" part="goo" aria-hidden="true" focusable="false">
      <defs>
        <filter
          id="k3-snackbar-goo"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
          color-interpolation-filters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="0"></feGaussianBlur>
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
          ></feColorMatrix>
        </filter>
      </defs>
      <g class="goo-bodies">
        <ellipse class="puddle"></ellipse>
        <circle class="drop"></circle>
        <rect class="body"></rect>
        <circle class="tip"></circle>
        <circle class="tip"></circle>
      </g>
    </svg>`;
  }

  override render() {
    if (this.phase === 'hidden') return nothing;
    const stacked = this.stacked || this.autoStacked;
    const trailingVisible = this.showAction || this.showTrailing;
    const kind = this.leadingKind;
    const supporting = this.supportingText.trim();
    const interactive = this.phase === 'expanded' && this.isFront;
    const style: Record<string, string | undefined> = {
      '--_hug': this.hug ? `${this.hug}px` : undefined,
      '--_drag-x': `${this.dragX}px`,
      '--_drag-y': `${this.dragY}px`,
      '--_drag-opacity': String(this.dragOpacity),
    };

    return html`
      <div
        class=${classMap({
          bar: true,
          'two-line': this.twoLine && !stacked && !supporting,
          stacked,
        })}
        part="container"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-mode=${this.effMode}
        data-phase=${this.phase}
        data-variant=${this.variant}
        data-leading=${kind ?? nothing}
        ?data-brand=${this.hasBrand}
        ?data-goo=${this.goo}
        data-enter=${this.enterBehind ? 'behind' : nothing}
        data-exit=${this.exitKind ?? nothing}
        data-drag=${this.dragState ?? nothing}
        style=${styleMap(style)}
        @pointerdown=${this.onPointerDown}
        @pointermove=${this.onPointerMove}
        @pointerup=${this.onPointerUp}
        @pointercancel=${this.onPointerUp}
        @pointerenter=${this.onBarPointerEnter}
        @pointerleave=${this.onBarPointerLeave}
        @focusin=${this.onBarFocusIn}
        @focusout=${this.onBarFocusOut}
        @keydown=${this.onKeyDown}
      >
        ${this.goo ? this.renderGoo() : nothing}
        ${this.hasBrand
          ? html`<img class="brand" part="brand" src=${this.brandIcon} alt="" aria-hidden="true" />`
          : nothing}
        ${this.renderLeading(kind)}
        <div class=${classMap({ text: true, 'has-supporting': !!supporting })} part="text">
          <div class="label" part="label" id="k3-snackbar-label">
            <slot @slotchange=${this.onSlotChange}></slot>
          </div>
          ${supporting
            ? html`<div class="supporting" part="supporting">${supporting}</div>`
            : nothing}
        </div>
        <div
          class=${classMap({ trailing: true, has: trailingVisible })}
          part="trailing-group"
          ?inert=${!interactive}
        >
          <div class=${classMap({ action: true, has: this.showAction })} part="action">
            ${this.hasActionSlot
              ? html`<slot
                  name="action"
                  @slotchange=${this.onSlotChange}
                  @click=${this.onActionClick}
                ></slot>`
              : this.action.trim()
                ? html`<button
                    type="button"
                    class="action-btn k3-state-layer"
                    part="action-button"
                    aria-describedby="k3-snackbar-label"
                    @click=${this.onActionClick}
                  >
                    ${this.action}
                  </button>`
                : nothing}
          </div>
          <span
            class=${classMap({ 'trailing-slot': true, has: this.hasTrailingSlot })}
            part="trailing"
          >
            <slot name="trailing" @slotchange=${this.onSlotChange}></slot>
          </span>
          ${this.dismissible
            ? html`<button
                type="button"
                class="dismiss k3-state-layer"
                part="dismiss"
                aria-label=${this.dismissAria}
                @click=${this.onDismissClick}
              >
                <svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
                  <path d=${SNACKBAR_ICONS.close}></path>
                </svg>
              </button>`
            : nothing}
        </div>
      </div>
    `;
  }
}

export { showSnackbar, snackbarQueue } from './snackbar-queue.js';
export type { ShowSnackbarOptions, SnackbarQueueBehavior } from './snackbar-queue.js';
export { SNACKBAR_ICONS } from './snackbar-icons.js';
export default K3Snackbar;

if (!customElements.get('k3-snackbar')) {
  customElements.define('k3-snackbar', K3Snackbar);
}
