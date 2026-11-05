import { html, css, svg } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { K3Element, emitLifecycle, prefersReducedMotion } from '../../core/index.js';
import { observeActiveVisibility } from '../../core/visibility.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import {
  MATERIAL_SHAPE_SVG,
  morphMaterialShapes,
  type MaterialShapeName,
} from '../../shapes/index.js';

/**
 * Canonical M3 Expressive indeterminate cycle
 * SoftBurst → Cookie9 → Pentagon → Pill → Sunny → Cookie4 → Oval
 */
const CYCLE: MaterialShapeName[] = [
  'SoftBurst',
  'Cookie9Sided',
  'Pentagon',
  'Pill',
  'Sunny',
  'Cookie4Sided',
  'Oval',
];

const MORPH_MS = 650;
const HOLD_MS = 80;
/** Full background revolution (Compose parity ≈ 4666ms). */
const SPIN_MS = 4666;
/** Per-morph rotation kick (Compose: progress × 90°). */
const KICK_DEG = 90;

/** Spring ease with ~14% overshoot (damping≈0.6 / stiffness≈200 approx). */
function springProgress(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  // Underdamped spring approximation → overshoots then settles
  const decay = Math.exp(-6 * t);
  const osc = Math.cos(t * Math.PI * 2.2);
  const raw = 1 - decay * osc;
  // Normalize so t=1 → 1 (peak overshoot ~1.14 mid-way)
  return Math.min(1.14, Math.max(0, raw));
}

export class K3LoadingIndicator extends K3Element {
  static override styles = [
    hostReset,
    css`
      :host {
        --k3-loading-size: 3rem; /* 48dp container */
        display: inline-flex;
        width: var(--k3-loading-size);
        height: var(--k3-loading-size);
        vertical-align: middle;
      }
      :host([contained]) {
        background: var(--k3-sys-color-primary-container);
        border-radius: 50%;
      }
      .box {
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
      }
      svg {
        width: 79.166%; /* 38/48 active indicator */
        height: 79.166%;
        display: block;
        overflow: visible;
      }
      .spin,
      .kick {
        transform-box: fill-box;
        transform-origin: center;
      }
      /* Background revolution on the compositor — no per-frame Lit render. */
      .spin {
        animation: k3-loading-spin var(--k3-loading-spin-duration, ${SPIN_MS}ms) linear infinite;
      }
      :host([data-paused]) .spin {
        animation-play-state: paused;
      }
      @keyframes k3-loading-spin {
        to {
          transform: rotate(360deg);
        }
      }
      :host-context([data-k3-reduce-motion]) .spin {
        animation: none;
      }
      path {
        fill: var(--k3-sys-color-primary);
      }
      :host([contained]) path {
        fill: var(--k3-sys-color-on-primary-container);
      }
      @media (prefers-reduced-motion: reduce) {
        .spin {
          animation: none;
        }
        .spin,
        .kick {
          transform: none !important;
        }
      }
    `,
  ];

  @property({ type: Boolean, reflect: true }) contained = false;

  @state() private pathD = MATERIAL_SHAPE_SVG.SoftBurst;
  @state() private kickDeg = 0;

  private fromIdx = 0;
  private accumulatedKick = 0;
  private raf = 0;
  private timer = 0;
  private morphStart = 0;
  private reduced = false;
  /** On screen and tab visible — the morph cycle only runs then. */
  private active = true;
  private unobserve: (() => void) | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.reduced = prefersReducedMotion();
    this.active = true;
    this.unobserve = observeActiveVisibility(this, this.onActiveChange);
    this.scheduleNext();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unobserve?.();
    this.unobserve = null;
    this.stopCycle();
  }

  /** Off-screen / hidden tab: freeze the spin and the morph cycle (no CPU, no events). */
  private onActiveChange = (active: boolean): void => {
    if (active === this.active) return;
    this.active = active;
    this.toggleAttribute('data-paused', !active);
    if (active) this.scheduleNext();
    else this.stopCycle();
  };

  private stopCycle(): void {
    if (this.timer) clearTimeout(this.timer);
    if (this.raf) cancelAnimationFrame(this.raf);
    this.timer = 0;
    this.raf = 0;
  }

  private scheduleNext(): void {
    if (this.timer || this.raf || !this.active) return;
    this.timer = window.setTimeout(() => {
      this.timer = 0;
      this.runMorph();
    }, HOLD_MS);
  }

  private runMorph(): void {
    const from = CYCLE[this.fromIdx]!;
    const toIdx = (this.fromIdx + 1) % CYCLE.length;
    const to = CYCLE[toIdx]!;
    const kickBase = this.accumulatedKick;
    emitLifecycle(this, 'morph-start', { source: 'auto', from, to });
    this.morphStart = performance.now();

    const tick = (now: number): void => {
      const u = Math.min(1, (now - this.morphStart) / MORPH_MS);
      const s = this.reduced ? u : springProgress(u);
      const morphT = Math.min(1, Math.max(0, s));
      this.pathD = morphMaterialShapes({ from, to, progress: morphT });
      if (!this.reduced) {
        // Kick rotates with spring (overshoot past 90°)
        this.kickDeg = kickBase + KICK_DEG * s;
      }
      if (u < 1) {
        this.raf = requestAnimationFrame(tick);
      } else {
        this.raf = 0;
        this.fromIdx = toIdx;
        this.accumulatedKick = (kickBase + KICK_DEG) % 360;
        this.kickDeg = this.accumulatedKick;
        this.pathD = MATERIAL_SHAPE_SVG[to];
        emitLifecycle(this, 'morph-end', { source: 'auto', shape: to });
        this.scheduleNext();
      }
    };
    this.raf = requestAnimationFrame(tick);
  }

  override render() {
    return html`
      <div class="box" part="container">
        <svg viewBox="0 0 1 1" role="status" aria-label=${i18n.t('loading.label')} part="shape">
          <g class="spin">
            <g
              class="kick"
              style=${styleMap({ transform: `rotate(${this.kickDeg}deg)` })}
            >
              ${svg`<path d=${this.pathD}></path>`}
            </g>
          </g>
        </svg>
      </div>
    `;
  }
}
export default K3LoadingIndicator;

if (!customElements.get('k3-loading-indicator')) {
  customElements.define('k3-loading-indicator', K3LoadingIndicator);
}
