import { html, isServer, type PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, prefersReducedMotion } from '../../core/index.js';
import { rippleStyles } from './ripple.styles.js';

/**
 * Classic Material ink ripple — expanding circular press from the pointer.
 *
 * M3 still uses state layers for hover/focus; the press **ripple** is the
 * classic Material Web / MDC ink (grow from contact point).
 *
 * @see https://material-web.dev/components/ripple/
 * @see https://m3.material.io/foundations/interaction/states/state-layers
 *
 * Parent must be `position: relative` (and usually `overflow: hidden`).
 *
 * ```html
 * <button style="position:relative; overflow:hidden">
 *   <k3-ripple></k3-ripple>
 *   Label
 * </button>
 * ```
 *
 * Or attach to a control: `<k3-ripple for="btn"></k3-ripple>`
 */
const PRESS_GROW_MS = 450;
const MINIMUM_PRESS_MS = 225;
const INITIAL_ORIGIN_SCALE = 0.2;
const PADDING = 10;
const SOFT_EDGE_MINIMUM_SIZE = 75;
const SOFT_EDGE_CONTAINER_RATIO = 0.35;
const TOUCH_DELAY_MS = 150;

const EVENTS = [
  'click',
  'contextmenu',
  'pointercancel',
  'pointerdown',
  'pointerenter',
  'pointerleave',
  'pointerup',
] as const;

enum State {
  Inactive,
  TouchDelay,
  Holding,
  WaitingForClick,
}

export class K3Ripple extends K3Element {
  static override styles = [rippleStyles];

  @property({ type: Boolean, reflect: true }) disabled = false;
  /** Circular unbounded ripple (icon buttons) — 40dp default */
  @property({ type: Boolean, reflect: true }) unbounded = false;
  /** Attach to element id (otherwise parentElement) */
  @property({ attribute: 'for' }) htmlFor: string | null = null;

  @state() private hovered = false;
  @state() private pressed = false;

  @query('.surface') private surfaceEl!: HTMLElement;

  private control: HTMLElement | null = null;
  private state = State.Inactive;
  private rippleStartEvent?: PointerEvent;
  private growAnimation?: Animation;
  private initialSize = 0;
  private rippleScale = '1';
  private rippleSize = '0px';

  private readonly onEvent = (e: Event): void => {
    void this.handleEvent(e);
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('aria-hidden', 'true');
    queueMicrotask(() => this.resolveControl());
  }

  override disconnectedCallback(): void {
    this.unbindControl();
    super.disconnectedCallback();
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('htmlFor') || changed.has('disabled')) {
      this.resolveControl();
    }
    if (changed.has('disabled') && this.disabled) {
      this.hovered = false;
      this.pressed = false;
    }
  }

  /** Imperative attach (Material Web parity). */
  attach(control: HTMLElement): void {
    this.bindControl(control);
  }

  detach(): void {
    this.unbindControl();
  }

  private resolveControl(): void {
    if (isServer) return;
    let next: HTMLElement | null = null;
    if (this.htmlFor) {
      next =
        (this.getRootNode() as Document | ShadowRoot).getElementById(this.htmlFor) ??
        null;
    } else {
      next = this.parentElement;
    }
    this.bindControl(next);
  }

  private bindControl(next: HTMLElement | null): void {
    if (next === this.control) return;
    this.unbindControl();
    this.control = next;
    if (!next || this.disabled) return;
    /* capture: true — receive events even if a child stops bubbling */
    for (const name of EVENTS) {
      next.addEventListener(name, this.onEvent, true);
    }
  }

  private unbindControl(): void {
    if (!this.control) return;
    for (const name of EVENTS) {
      this.control.removeEventListener(name, this.onEvent, true);
    }
    this.control = null;
  }

  private async handleEvent(event: Event): Promise<void> {
    if (this.disabled || prefersReducedMotion()) return;
    switch (event.type) {
      case 'click':
        this.handleClick();
        break;
      case 'contextmenu':
        this.endPressAnimation();
        break;
      case 'pointercancel':
        if (this.shouldReact(event as PointerEvent)) this.endPressAnimation();
        break;
      case 'pointerdown':
        await this.handlePointerdown(event as PointerEvent);
        break;
      case 'pointerenter':
        this.handlePointerenter(event as PointerEvent);
        break;
      case 'pointerleave':
        this.handlePointerleave(event as PointerEvent);
        break;
      case 'pointerup':
        this.handlePointerup(event as PointerEvent);
        break;
      default:
        break;
    }
  }

  private handlePointerenter(event: PointerEvent): void {
    if (!this.shouldReact(event) || event.pointerType === 'touch') return;
    this.hovered = true;
  }

  private handlePointerleave(event: PointerEvent): void {
    if (!this.shouldReact(event) || event.pointerType === 'touch') return;
    this.hovered = false;
    if (this.state !== State.Inactive) this.endPressAnimation();
  }

  private handlePointerup(event: PointerEvent): void {
    if (!this.shouldReact(event)) return;
    if (this.state === State.Holding) {
      this.state = State.WaitingForClick;
      return;
    }
    if (this.state === State.TouchDelay) {
      this.state = State.WaitingForClick;
      this.startPressAnimation(this.rippleStartEvent);
    }
  }

  private async handlePointerdown(event: PointerEvent): Promise<void> {
    if (!this.shouldReact(event)) return;
    this.rippleStartEvent = event;
    if (event.pointerType !== 'touch') {
      this.state = State.WaitingForClick;
      this.startPressAnimation(event);
      return;
    }
    this.state = State.TouchDelay;
    await new Promise((r) => setTimeout(r, TOUCH_DELAY_MS));
    if (this.state !== State.TouchDelay) return;
    this.state = State.Holding;
    this.startPressAnimation(event);
  }

  private handleClick(): void {
    if (this.state === State.WaitingForClick) {
      this.endPressAnimation();
      return;
    }
    if (this.state === State.Inactive) {
      /* Keyboard synthesized click */
      this.startPressAnimation();
      this.endPressAnimation();
    }
  }

  private shouldReact(event: PointerEvent): boolean {
    if (this.disabled || !event.isPrimary) return false;
    if (this.rippleStartEvent && this.rippleStartEvent.pointerId !== event.pointerId) {
      return false;
    }
    if (event.type === 'pointerenter' || event.type === 'pointerleave') {
      return event.pointerType !== 'touch';
    }
    return event.pointerType === 'touch' || event.buttons === 1;
  }

  private determineRippleSize(): void {
    const host = this.getBoundingClientRect();
    const maxDim = Math.max(host.height, host.width);
    const softEdge = Math.max(SOFT_EDGE_CONTAINER_RATIO * maxDim, SOFT_EDGE_MINIMUM_SIZE);
    const initialSize = Math.floor(maxDim * INITIAL_ORIGIN_SCALE);
    const hypotenuse = Math.hypot(host.width, host.height);
    const maxRadius = hypotenuse + PADDING;
    this.initialSize = initialSize;
    this.rippleScale = String((maxRadius + softEdge) / initialSize);
    this.rippleSize = `${initialSize}px`;
    this.style.setProperty('--k3-ripple-size', this.rippleSize);
  }

  private coords(ev: PointerEvent): { x: number; y: number } {
    const { left, top } = this.getBoundingClientRect();
    return { x: ev.clientX - left, y: ev.clientY - top };
  }

  private startPressAnimation(positionEvent?: Event): void {
    const surface =
      this.surfaceEl ?? this.renderRoot?.querySelector<HTMLElement>('.surface');
    if (!surface) return;
    this.pressed = true;
    this.growAnimation?.cancel();
    this.determineRippleSize();
    const { height, width } = this.getBoundingClientRect();
    const end = {
      x: (width - this.initialSize) / 2,
      y: (height - this.initialSize) / 2,
    };
    let start = { x: width / 2, y: height / 2 };
    if (positionEvent instanceof PointerEvent) {
      start = this.coords(positionEvent);
    }
    start = { x: start.x - this.initialSize / 2, y: start.y - this.initialSize / 2 };

    this.growAnimation = surface.animate(
      {
        transform: [
          `translate(${start.x}px, ${start.y}px) scale(1)`,
          `translate(${end.x}px, ${end.y}px) scale(${this.rippleScale})`,
        ],
      },
      {
        pseudoElement: '::after',
        duration: PRESS_GROW_MS,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
        fill: 'forwards',
      },
    );
  }

  private async endPressAnimation(): Promise<void> {
    this.rippleStartEvent = undefined;
    this.state = State.Inactive;
    const animation = this.growAnimation;
    let t = Infinity;
    if (typeof animation?.currentTime === 'number') t = animation.currentTime;
    else if (animation?.currentTime) t = animation.currentTime.to('ms').value;

    if (t >= MINIMUM_PRESS_MS) {
      this.pressed = false;
      return;
    }
    await new Promise((r) => setTimeout(r, MINIMUM_PRESS_MS - t));
    if (this.growAnimation !== animation) return;
    this.pressed = false;
  }

  override render() {
    return html`
      <div
        class=${classMap({
          surface: true,
          hovered: this.hovered,
          pressed: this.pressed,
        })}
        part="surface"
      ></div>
    `;
  }
}

export default K3Ripple;
