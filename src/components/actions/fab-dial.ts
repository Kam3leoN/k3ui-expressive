import { html, nothing, unsafeCSS, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { repeat } from 'lit/directives/repeat.js';
import {
  K3Element,
  runOpenClose,
  haptic,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import K3Fab from './fab.js';
import K3FabDialItem from './fab-dial-item.js';
import {
  computeFabDialIconRotation,
  computeFabDialOffsets,
} from './fab-dial.geometry.js';
import {
  FabDialSpecs,
  fabDialClampItems,
  fabDialMaxDurationMs,
  type FabCornerPosition,
  type FabDialItem,
  type FabDialLayout,
  type FabDialPhase,
} from './fab-dial.specs.js';
import { fabDialStyles } from './fab-dial.styles.js';
import { fabVisibilityCss } from './fab-visibility.js';

export type {
  FabCornerPosition,
  FabDialItem,
  FabDialLayout,
  FabDialPhase,
} from './fab-dial.specs.js';
export { FabDialSpecs } from './fab-dial.specs.js';

if (!customElements.get('k3-fab')) {
  customElements.define('k3-fab', K3Fab);
}
if (!customElements.get('k3-fab-dial-item')) {
  customElements.define('k3-fab-dial-item', K3FabDialItem);
}

const POSITIONS: FabCornerPosition[] = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
];

function parseItemsAttr(value: string | null): FabDialItem[] {
  if (!value?.trim()) return [];
  try {
    const data = JSON.parse(value) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
      .map((x, i) => ({
        id: String(x.id ?? x.itemId ?? `item-${i}`),
        label: String(x.label ?? x.id ?? ''),
        icon: x.icon != null ? String(x.icon) : 'edit',
      }));
  } catch {
    return [];
  }
}

/**
 * Material-style FAB speed dial — radial flower fan.
 *
 * - Host footprint = trigger only; actions overlay with `--x` / `--y`
 * - Max 4 flower actions
 * - Scrim + Escape + outside click dismiss
 * - `haptic.light` on open / close
 * - Linear / vertical stacks → `k3-fab-rail`
 *
 * @see ./fab-dial.specs.ts
 */
export class K3FabDial extends K3Element {
  static override styles = [hostReset, unsafeCSS(fabVisibilityCss), fabDialStyles];

  private static activeDial: K3FabDial | null = null;

  // ── Public API ──────────────────────────────────────────────────────────

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ reflect: true }) position: FabCornerPosition = FabDialSpecs.defaultPosition;
  @property({ reflect: true }) layout: FabDialLayout = FabDialSpecs.defaultLayout;
  /** Corner-docked; default false for playground / in-flow demos. */
  @property({ type: Boolean, reflect: true }) fixed = false;
  @property({ type: Boolean, reflect: true, attribute: 'show-labels' }) showLabels = false;
  @property({ type: Boolean, reflect: true }) scrim = true;
  @property({ attribute: 'fab-icon' }) fabIcon = FabDialSpecs.defaultFabIcon;
  @property({ type: Boolean, reflect: true }) disabled = false;

  /**
   * Actions — prefer property array; JSON also accepted via `items` attribute.
   * When empty, slotted `k3-fab-dial-item` children are collected.
   */
  @property({
    type: Array,
    converter: {
      fromAttribute: (value: string | null) => parseItemsAttr(value),
      toAttribute: (value: FabDialItem[] | null) =>
        value?.length ? JSON.stringify(value) : null,
    },
  })
  items: FabDialItem[] = [];

  // ── Internal ────────────────────────────────────────────────────────────

  @state() private phase: FabDialPhase = 'closed';
  @state() private slotGen = 0;

  private bootstrapped = false;
  private motionGen = 0;
  private phaseTimer: number | null = null;
  private phaseWaitResolve: (() => void) | null = null;
  private onDocPointer?: (e: Event) => void;
  private onKey?: (e: KeyboardEvent) => void;
  private itemCountWarned = false;

  private get menuOpen(): boolean {
    return this.phase !== 'closed';
  }

  private get triggerExpanded(): boolean {
    return this.phase === 'open' || this.phase === 'opening';
  }

  private get resolvedItems(): FabDialItem[] {
    const fromProp = this.items?.length ? this.items : this.slottedItems();
    return fabDialClampItems(fromProp, this.layout);
  }

  private slottedItems(): FabDialItem[] {
    void this.slotGen;
    return [...this.querySelectorAll<K3FabDialItem>('k3-fab-dial-item')].map((el, i) => ({
      id: el.actionId || `item-${i}`,
      label: el.label || el.textContent?.trim() || el.actionId || '',
      icon: el.icon || 'edit',
    }));
  }

  private get fabEl(): HTMLElement | null {
    return this.renderRoot.querySelector('k3-fab');
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this.attachDismiss();
    this.syncHostCss();
  }

  override firstUpdated(): void {
    this.bootstrapped = true;
    this.syncHostCss();
    if (this.open) void this.show();
    else this.phase = 'closed';
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (
      changed.has('position') ||
      changed.has('layout') ||
      changed.has('fixed')
    ) {
      this.syncHostCss();
    }
    if (!this.bootstrapped) return;
    if (changed.has('open') && this.open !== this.menuOpen) {
      void (this.open ? this.show() : this.hide('api'));
    }
  }

  override disconnectedCallback(): void {
    this.clearPhaseTimer();
    this.detachDismiss();
    this.releaseActive();
    super.disconnectedCallback();
  }

  // ── Open / close ────────────────────────────────────────────────────────

  async show(): Promise<boolean> {
    if (this.phase === 'open' || this.phase === 'opening') return true;
    if (this.disabled) return false;
    this.warnItemCountIfNeeded();
    this.claimActive();
    const gen = ++this.motionGen;
    this.clearPhaseTimer();
    return runOpenClose(
      this,
      'open',
      async () => {
        this.open = true;
        this.phase = 'opening';
        this.setAttribute('data-phase', 'opening');
        this.pulseSpring('open');
        haptic.light();
        await this.waitPhase(fabDialMaxDurationMs('opening', this.resolvedItems.length));
        if (gen !== this.motionGen) return;
        this.phase = 'open';
        this.setAttribute('data-phase', 'open');
        this.clearSpring();
      },
      { source: 'user' },
    );
  }

  async hide(source: 'user' | 'api' | 'escape' | 'auto' = 'api'): Promise<boolean> {
    if (this.phase === 'closed' || this.phase === 'closing') return true;
    const gen = ++this.motionGen;
    this.clearPhaseTimer();
    return runOpenClose(
      this,
      'close',
      async () => {
        this.phase = 'closing';
        this.setAttribute('data-phase', 'closing');
        this.pulseSpring('close');
        haptic.light();
        await this.waitPhase(fabDialMaxDurationMs('closing', this.resolvedItems.length));
        if (gen !== this.motionGen) return;
        this.open = false;
        this.phase = 'closed';
        this.removeAttribute('data-phase');
        this.clearSpring();
        this.releaseActive();
        if (source === 'escape' || source === 'user') this.restoreFocus();
      },
      { source },
    );
  }

  // ── Internals ───────────────────────────────────────────────────────────

  private syncHostCss(): void {
    const pos = POSITIONS.includes(this.position)
      ? this.position
      : FabDialSpecs.defaultPosition;
    this.style.setProperty(
      '--k3-fab-dial-rotate',
      `${computeFabDialIconRotation(pos)}deg`,
    );
  }

  private warnItemCountIfNeeded(): void {
    if (this.itemCountWarned || this.layout !== 'flower') return;
    const raw = this.items?.length ? this.items.length : this.slottedItems().length;
    if (raw > FabDialSpecs.maxFlowerActions) {
      this.itemCountWarned = true;
      console.warn(
        `[k3-fab-dial] flower layout shows max ${FabDialSpecs.maxFlowerActions} actions (got ${raw}). Use k3-fab-rail for a linear stack.`,
      );
    }
  }

  private claimActive(): void {
    const prev = K3FabDial.activeDial;
    if (prev && prev !== this) void prev.hide('auto');
    K3FabDial.activeDial = this;
  }

  private releaseActive(): void {
    if (K3FabDial.activeDial === this) K3FabDial.activeDial = null;
  }

  private pulseSpring(kind: 'open' | 'close'): void {
    const fab = this.fabEl;
    if (!fab) return;
    fab.removeAttribute('data-spring');
    void (fab as HTMLElement).offsetWidth;
    fab.setAttribute('data-spring', kind === 'close' ? 'close' : 'open');
  }

  private clearSpring(): void {
    this.fabEl?.removeAttribute('data-spring');
  }

  private clearPhaseTimer(): void {
    if (this.phaseTimer != null) {
      window.clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
    const resolve = this.phaseWaitResolve;
    this.phaseWaitResolve = null;
    resolve?.();
  }

  private waitPhase(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.phaseWaitResolve = resolve;
      this.phaseTimer = window.setTimeout(() => {
        this.phaseTimer = null;
        this.phaseWaitResolve = null;
        resolve();
      }, ms);
    });
  }

  private restoreFocus(): void {
    const btn = this.fabEl?.shadowRoot?.querySelector<HTMLElement>('button');
    const target = btn ?? this.fabEl;
    if (!target) return;
    try {
      target.focus({ preventScroll: true });
    } catch {
      target.focus();
    }
  }

  private eventFromSelf(e: Event): boolean {
    return e.composedPath().some((n) => n === this);
  }

  private attachDismiss(): void {
    if (this.onDocPointer) return;
    this.onDocPointer = (e: Event) => {
      if (!this.menuOpen) return;
      if (!this.eventFromSelf(e)) void this.hide('user');
    };
    this.onKey = (e: KeyboardEvent) => {
      if (!this.menuOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        void this.hide('escape');
      }
    };
    document.addEventListener('pointerdown', this.onDocPointer, true);
    document.addEventListener('keydown', this.onKey, true);
  }

  private detachDismiss(): void {
    if (this.onDocPointer) document.removeEventListener('pointerdown', this.onDocPointer, true);
    if (this.onKey) document.removeEventListener('keydown', this.onKey, true);
    this.onDocPointer = undefined;
    this.onKey = undefined;
  }

  private toggle = (): void => {
    if (this.disabled) return;
    void (this.triggerExpanded ? this.hide('user') : this.show());
  };

  private onScrimClick = (): void => {
    void this.hide('user');
  };

  private onItemClick = (item: FabDialItem) => (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
    this.emit('k3-item-click', { item });
    void this.hide('user');
  };

  private onActionPointerDown = (e: Event): void => {
    (e.currentTarget as HTMLElement).setAttribute('data-pressed', '');
  };

  private onActionPointerUp = (e: Event): void => {
    (e.currentTarget as HTMLElement).removeAttribute('data-pressed');
  };

  private onSlotChange = (): void => {
    this.slotGen += 1;
  };

  private offsetsFor(count: number) {
    const pos = POSITIONS.includes(this.position)
      ? this.position
      : FabDialSpecs.defaultPosition;
    return computeFabDialOffsets({
      count,
      layout: this.layout === 'vertical' ? 'vertical' : 'flower',
      position: pos,
      radius: null,
      gap: FabDialSpecs.gapDp,
      spread: [...FabDialSpecs.spreadDeg],
      triggerSize: FabDialSpecs.triggerSizeDp,
      actionSize: FabDialSpecs.actionSizeDp,
      minGap: FabDialSpecs.minGapDp,
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────

  override render() {
    const list = this.resolvedItems;
    const offsets = this.offsetsFor(list.length);
    const n = list.length;
    const expanded = this.triggerExpanded;
    const closing = this.phase === 'closing';

    return html`
      ${this.scrim
        ? html`<button
            type="button"
            class="scrim"
            part="scrim"
            tabindex="-1"
            aria-hidden="true"
            @click=${this.onScrimClick}
          ></button>`
        : nothing}
      <div class="menu" part="menu" role="menu">
        ${repeat(
          list,
          (item) => item.id,
          (item, i) => {
            const delayIn = i * FabDialSpecs.staggerEnterMs;
            const delayOut = (n - 1 - i) * FabDialSpecs.staggerExitMs;
            const o = offsets[i] ?? { x: 0, y: 0 };
            return html`
              <div
                class="item"
                part="item"
                style=${styleMap({
                  '--x': `${o.x}px`,
                  '--y': `${o.y}px`,
                  '--delay-in': `${delayIn}ms`,
                  '--delay-out': `${delayOut}ms`,
                })}
              >
                ${this.showLabels && this.layout === 'vertical'
                  ? html`<span class="label" part="label" aria-hidden="true"
                      >${item.label}</span
                    >`
                  : nothing}
                <button
                  type="button"
                  class="action"
                  part="action"
                  role="menuitem"
                  tabindex=${expanded ? 0 : -1}
                  data-id=${item.id}
                  aria-label=${item.label}
                  title=${item.label}
                  @click=${this.onItemClick(item)}
                  @pointerdown=${this.onActionPointerDown}
                  @pointerup=${this.onActionPointerUp}
                  @pointercancel=${this.onActionPointerUp}
                  @pointerleave=${this.onActionPointerUp}
                >
                  <span
                    class="notranslate"
                    translate="no"
                    lang="zxx"
                    data-k3-icon=${item.icon || 'edit'}
                    aria-hidden="true"
                  ></span>
                </button>
              </div>
            `;
          },
        )}
      </div>
      <div class="slot" part="fab-slot">
        <div class="trigger-wrap">
          <k3-fab
            part="fab"
            size="default"
            variant="primary"
            ?round=${expanded}
            ?disabled=${this.disabled}
            aria-expanded=${String(this.menuOpen)}
            aria-haspopup="menu"
            @k3-click=${this.toggle}
          >
            <span class="trigger-icon" slot="icon" part="trigger-icon">
              <span
                class=${classMap({
                  'icon-rotator': true,
                  open: expanded && !closing,
                  closing,
                })}
                part="icon-rotator"
              >
                <slot name="icon"
                  ><span
                    class="notranslate"
                    translate="no"
                    lang="zxx"
                    data-k3-icon=${this.fabIcon || 'add'}
                    aria-hidden="true"
                  ></span
                ></slot>
              </span>
            </span>
            <span class="sr-only"
              >${i18n.t(this.menuOpen ? 'fab.dial.close' : 'fab.dial.open')}</span
            >
          </k3-fab>
        </div>
      </div>
      <slot @slotchange=${this.onSlotChange}></slot>
    `;
  }
}

export default K3FabDial;

if (!customElements.get('k3-fab-dial')) {
  customElements.define('k3-fab-dial', K3FabDial);
}
