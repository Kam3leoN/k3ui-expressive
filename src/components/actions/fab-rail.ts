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
import K3FabRailItem from './fab-rail-item.js';
import type { FabCornerPosition } from './fab-dial.geometry.js';
import {
  computeFabRailFitScale,
  computeFabRailIconRotation,
  computeFabRailOffsets,
  DEFAULT_RAIL_DIRECTION,
  type FabRailDirection,
} from './fab-rail.geometry.js';
import {
  FabRailSpecs,
  fabRailClampItems,
  fabRailMaxDurationMs,
  type FabRailItem,
  type FabRailPhase,
} from './fab-rail.specs.js';
import { fabRailStyles } from './fab-rail.styles.js';
import { fabVisibilityCss } from './fab-visibility.js';

export type {
  FabCornerPosition,
  FabRailItem,
  FabRailPhase,
} from './fab-rail.specs.js';
export type { FabRailDirection } from './fab-rail.geometry.js';
export { FabRailSpecs } from './fab-rail.specs.js';
export { DEFAULT_RAIL_DIRECTION } from './fab-rail.geometry.js';

if (!customElements.get('k3-fab')) {
  customElements.define('k3-fab', K3Fab);
}
if (!customElements.get('k3-fab-rail-item')) {
  customElements.define('k3-fab-rail-item', K3FabRailItem);
}

const POSITIONS: FabCornerPosition[] = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
];

const DIRECTIONS: FabRailDirection[] = ['right', 'left', 'up', 'down'];

function parseItemsAttr(value: string | null): FabRailItem[] {
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
 * Material-style FAB speed dial — linear rail along an axis.
 *
 * - Host footprint = trigger only; actions overlay with `--x` / `--y`
 * - Max 5 actions; `autoFit` scales action/gap to fit the viewport
 * - Scrim + Escape + outside click dismiss
 * - `haptic.light` on open / close
 *
 * @see ./fab-rail.specs.ts
 */
export class K3FabRail extends K3Element {
  static override styles = [hostReset, unsafeCSS(fabVisibilityCss), fabRailStyles];

  private static activeRail: K3FabRail | null = null;

  // ── Public API ──────────────────────────────────────────────────────────

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ reflect: true }) position: FabCornerPosition = FabRailSpecs.defaultPosition;
  /**
   * Expansion axis. Empty / unset → corner default (`DEFAULT_RAIL_DIRECTION`).
   */
  @property({ reflect: true }) direction: FabRailDirection | '' = '';
  /** Corner-docked; default false for playground / in-flow demos. */
  @property({ type: Boolean, reflect: true }) fixed = false;
  /** Scale action size + gap so the rail fits the viewport. */
  @property({ type: Boolean, reflect: true, attribute: 'auto-fit' }) autoFit =
    FabRailSpecs.autoFit;
  @property({ type: Boolean, reflect: true }) scrim = true;
  @property({ attribute: 'fab-icon' }) fabIcon = FabRailSpecs.defaultFabIcon;
  @property({ type: Boolean, reflect: true }) disabled = false;

  /**
   * Actions — prefer property array; JSON also accepted via `items` attribute.
   * When empty, slotted `k3-fab-rail-item` children are collected.
   */
  @property({
    type: Array,
    converter: {
      fromAttribute: (value: string | null) => parseItemsAttr(value),
      toAttribute: (value: FabRailItem[] | null) =>
        value?.length ? JSON.stringify(value) : null,
    },
  })
  items: FabRailItem[] = [];

  // ── Internal ────────────────────────────────────────────────────────────

  @state() private phase: FabRailPhase = 'closed';
  @state() private slotGen = 0;
  @state() private fitScale = 1;

  private bootstrapped = false;
  private motionGen = 0;
  private phaseTimer: number | null = null;
  private phaseWaitResolve: (() => void) | null = null;
  private onDocPointer?: (e: Event) => void;
  private onKey?: (e: KeyboardEvent) => void;
  private onResize?: () => void;
  private itemCountWarned = false;

  private get menuOpen(): boolean {
    return this.phase !== 'closed';
  }

  private get triggerExpanded(): boolean {
    return this.phase === 'open' || this.phase === 'opening';
  }

  private get axisDirection(): FabRailDirection {
    if (this.direction && DIRECTIONS.includes(this.direction as FabRailDirection)) {
      return this.direction as FabRailDirection;
    }
    const pos = POSITIONS.includes(this.position)
      ? this.position
      : FabRailSpecs.defaultPosition;
    return DEFAULT_RAIL_DIRECTION[pos] ?? 'up';
  }

  private get resolvedItems(): FabRailItem[] {
    const fromProp = this.items?.length ? this.items : this.slottedItems();
    return fabRailClampItems(fromProp);
  }

  private slottedItems(): FabRailItem[] {
    void this.slotGen;
    return [...this.querySelectorAll<K3FabRailItem>('k3-fab-rail-item')].map((el, i) => ({
      id: el.actionId || `item-${i}`,
      label: el.label || el.textContent?.trim() || el.actionId || '',
      icon: el.icon || 'edit',
    }));
  }

  private get fabEl(): HTMLElement | null {
    return this.renderRoot.querySelector('k3-fab');
  }

  private get sized(): { actionSize: number; gap: number } {
    const scale = this.autoFit ? this.fitScale : 1;
    return {
      actionSize: Math.round(FabRailSpecs.actionSizeDp * scale),
      gap: Math.round(FabRailSpecs.gapDp * scale),
    };
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this.attachDismiss();
    this.attachResize();
    this.syncHostCss();
  }

  override firstUpdated(): void {
    this.bootstrapped = true;
    this.refreshFit();
    this.syncHostCss();
    if (this.open) void this.show();
    else this.phase = 'closed';
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (
      changed.has('position') ||
      changed.has('direction') ||
      changed.has('fixed') ||
      changed.has('autoFit') ||
      changed.has('items') ||
      changed.has('slotGen')
    ) {
      this.refreshFit();
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
    this.detachResize();
    this.releaseActive();
    super.disconnectedCallback();
  }

  // ── Open / close ────────────────────────────────────────────────────────

  async show(): Promise<boolean> {
    if (this.phase === 'open' || this.phase === 'opening') return true;
    if (this.disabled) return false;
    this.warnItemCountIfNeeded();
    this.refreshFit();
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
        this.setAttribute('data-direction', this.axisDirection);
        this.pulseSpring('open');
        haptic.light();
        await this.waitPhase(fabRailMaxDurationMs('opening', this.resolvedItems.length));
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
        await this.waitPhase(fabRailMaxDurationMs('closing', this.resolvedItems.length));
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

  private refreshFit(): void {
    if (!this.autoFit) {
      this.fitScale = 1;
      this.style.setProperty(
        '--k3-fab-rail-item-size',
        `${FabRailSpecs.actionSizeDp / 16}rem`,
      );
      return;
    }
    const list = this.resolvedItems;
    const scale = computeFabRailFitScale(
      this.getBoundingClientRect(),
      this.axisDirection,
      list.length,
      FabRailSpecs.actionSizeDp,
      FabRailSpecs.gapDp,
    );
    this.fitScale = scale;
    const actionSize = Math.round(FabRailSpecs.actionSizeDp * scale);
    this.style.setProperty('--k3-fab-rail-item-size', `${actionSize / 16}rem`);
  }

  private syncHostCss(): void {
    this.style.setProperty(
      '--k3-fab-rail-rotate',
      computeFabRailIconRotation(this.axisDirection),
    );
    this.setAttribute('data-direction', this.axisDirection);
  }

  private warnItemCountIfNeeded(): void {
    if (this.itemCountWarned) return;
    const raw = this.items?.length ? this.items.length : this.slottedItems().length;
    if (raw > FabRailSpecs.maxActions) {
      this.itemCountWarned = true;
      console.warn(
        `[k3-fab-rail] max ${FabRailSpecs.maxActions} actions (got ${raw}).`,
      );
    }
  }

  private claimActive(): void {
    const prev = K3FabRail.activeRail;
    if (prev && prev !== this) void prev.hide('auto');
    K3FabRail.activeRail = this;
  }

  private releaseActive(): void {
    if (K3FabRail.activeRail === this) K3FabRail.activeRail = null;
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

  private attachResize(): void {
    if (this.onResize) return;
    this.onResize = () => {
      if (this.autoFit) this.refreshFit();
    };
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  private detachResize(): void {
    if (!this.onResize) return;
    window.removeEventListener('resize', this.onResize);
    this.onResize = undefined;
  }

  private toggle = (): void => {
    if (this.disabled) return;
    void (this.triggerExpanded ? this.hide('user') : this.show());
  };

  private onScrimClick = (): void => {
    void this.hide('user');
  };

  private onItemClick = (item: FabRailItem) => (e: Event): void => {
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
    const { actionSize, gap } = this.sized;
    return computeFabRailOffsets({
      count,
      direction: this.axisDirection,
      actionSize,
      gap,
      triggerSize: FabRailSpecs.triggerSizeDp,
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
            const delayIn = i * FabRailSpecs.staggerEnterMs;
            const delayOut = (n - 1 - i) * FabRailSpecs.staggerExitMs;
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
              >${i18n.t(this.menuOpen ? 'fab.rail.close' : 'fab.rail.open')}</span
            >
          </k3-fab>
        </div>
      </div>
      <slot @slotchange=${this.onSlotChange}></slot>
    `;
  }
}

export default K3FabRail;

if (!customElements.get('k3-fab-rail')) {
  customElements.define('k3-fab-rail', K3FabRail);
}
