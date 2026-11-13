import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { K3Element, emitLifecycle } from '../../core/index.js';
import { safeCoverflowHref } from './coverflow.specs.js';

/**
 * `k3-coverflow-item` — one cover of a `k3-coverflow`.
 *
 * - `href` → the centred cover is a link (`target`, `rel` supported).
 * - `flip` → the centred cover turns over to show `slot="back"`.
 * - neither → a plain cover.
 *
 * A cover that is not centred only comes to the centre on click; the link /
 * flip acts once it is centred.
 *
 * Slots: default (front, usually an `<img>`), `back` (with `flip`).
 *
 * Events: `k3-flip` `{ flipped }` (cancelable via `k3-change-start`).
 *
 * @csspart card  - the 3D card (shape, shadow)
 * @csspart front - front face (the link when `href` is set)
 * @csspart back  - back face (`flip`)
 */
export class K3CoverflowItem extends K3Element {
  static override styles = css`
    :host {
      position: absolute;
      inset-block-start: 0;
      /* Centred with inset only — page resets (* { margin: 0 }) beat :host margins */
      inset-inline-start: calc(50% - var(--k3-coverflow-item-width, 14rem) / 2);
      inline-size: var(--k3-coverflow-item-width, 14rem);
      block-size: var(--k3-coverflow-item-height, 14rem);
      box-sizing: border-box;
      transform-style: preserve-3d;
      /* The flip gets its own depth (the reflection flattens the host) */
      perspective: calc(var(--k3-coverflow-item-width, 14rem) * 4);
      will-change: transform;
      pointer-events: auto;
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    :host([data-hidden]) {
      visibility: hidden;
    }
    /* Mirror below the cover (Chromium / WebKit — progressive enhancement) */
    :host([data-reflect]) {
      -webkit-box-reflect: below var(--k3-coverflow-reflection-gap, 2px)
        linear-gradient(transparent 62%, rgb(0 0 0 / var(--k3-coverflow-reflection-opacity, 0.28)));
    }
    .card {
      position: relative;
      inline-size: 100%;
      block-size: 100%;
      transform-style: preserve-3d;
      transition: transform var(--k3-coverflow-flip-duration, 600ms)
        var(--k3-sys-motion-easing-emphasized, cubic-bezier(0.2, 0, 0, 1));
    }
    :host([flipped]) .card {
      transform: rotateY(180deg);
    }
    /* In a vertical cover flow the card turns over around x */
    :host([data-vertical][flipped]) .card {
      transform: rotateX(180deg);
    }
    .face {
      position: absolute;
      inset: 0;
      display: block;
      overflow: hidden;
      border-radius: var(--k3-coverflow-item-shape, var(--k3-sys-shape-corner-large, 16px));
      background: var(--k3-coverflow-item-color, var(--k3-sys-color-surface-container-high));
      color: var(--k3-sys-color-on-surface);
      box-shadow: var(--k3-coverflow-item-shadow, 0 12px 28px rgb(0 0 0 / 0.28));
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      text-decoration: none;
      outline: none;
    }
    .back {
      transform: rotateY(180deg);
    }
    :host([data-vertical]) .back {
      transform: rotateX(180deg);
    }
    /*
     * Covers fill the face. !important: page resets such as
     * img { height: auto; max-width: 100% } otherwise win over ::slotted.
     */
    ::slotted(img),
    ::slotted(video),
    ::slotted(picture) {
      display: block !important;
      inline-size: 100% !important;
      block-size: 100% !important;
      max-inline-size: none !important;
      object-fit: cover !important;
      pointer-events: none;
      user-select: none;
      -webkit-user-drag: none;
    }
    :host(:focus-visible) .front,
    :host(:focus-visible) .back,
    .front:focus-visible {
      outline: 3px solid var(--k3-sys-color-secondary, #625b71);
      outline-offset: 3px;
    }
    @media (prefers-reduced-motion: reduce) {
      .card {
        transition: none;
      }
    }
    :host-context([data-k3-reduce-motion]) .card {
      transition: none;
    }
    @media (forced-colors: active) {
      .face {
        border: 1px solid CanvasText;
      }
    }
  `;

  /** Link opened by the centred cover. */
  @property() href = '';
  @property() target = '';
  @property() rel = '';
  /** Turn over on activation to show `slot="back"`. */
  @property({ type: Boolean, reflect: true }) flip = false;
  /** Back side showing (with `flip`). */
  @property({ type: Boolean, reflect: true }) flipped = false;
  /** Accessible name of the cover (else the image `alt` is read). */
  @property() label = '';

  /** Centred in its coverflow — set by `k3-coverflow`. */
  @property({ type: Boolean, reflect: true }) active = false;

  /** The parent opens this link in its lightbox — set by `k3-coverflow`. */
  @property({ type: Boolean, attribute: 'data-lightbox' }) protected lightboxed = false;

  /** Position in the coverflow — set by `k3-coverflow`. */
  index = 0;

  private get link(): string {
    return safeCoverflowHref(this.href);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    this.setAttribute('aria-roledescription', 'slide');
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    /* Tab stop: the link inside a link cover, else the cover itself (centred only) */
    const selfFocusable = this.active && !this.link;
    this.tabIndex = selfFocusable ? 0 : -1;
    if (this.flip && !this.link) {
      this.setAttribute('role', 'button');
      this.setAttribute('aria-pressed', String(this.flipped));
    } else if (this.getAttribute('role') === 'button') {
      this.setAttribute('role', 'group');
      this.removeAttribute('aria-pressed');
    }
    if (!this.active) this.setAttribute('aria-hidden', 'true');
    else this.removeAttribute('aria-hidden');
  }

  /** Follow the link or turn the card — what activating the centred cover does. */
  activate(): void {
    if (this.link) {
      this.renderRoot.querySelector<HTMLAnchorElement>('a.front')?.click();
      return;
    }
    if (this.flip) this.toggle();
  }

  /** Turn the card over (`flip` only). */
  toggle(force?: boolean): void {
    if (!this.flip) return;
    const next = force ?? !this.flipped;
    if (next === this.flipped) return;
    if (!emitLifecycle(this, 'change-start', { source: 'user', flipped: next })) return;
    this.flipped = next;
    this.emit('k3-flip', { flipped: next });
    emitLifecycle(this, 'change-end', { source: 'user', flipped: next });
  }

  /** Focus the cover's tab stop (its link, or the cover). */
  override focus(options?: FocusOptions): void {
    const a = this.renderRoot.querySelector<HTMLAnchorElement>('a.front');
    if (a) a.focus(options);
    else super.focus(options);
  }

  override render() {
    const link = this.link;
    const blank = this.target === '_blank';
    const rel = blank ? [...new Set([...this.rel.split(/\s+/).filter(Boolean), 'noopener', 'noreferrer'])].join(' ') : this.rel;
    const front = link
      ? html`<a
          class="face front"
          part="front"
          href=${link}
          target=${this.target || nothing}
          rel=${rel || nothing}
          tabindex=${this.active ? 0 : -1}
          aria-label=${this.label || nothing}
          aria-haspopup=${this.lightboxed ? 'dialog' : nothing}
          draggable="false"
          ><slot></slot
        ></a>`
      : html`<div class="face front" part="front"><slot></slot></div>`;
    return html`
      <div class="card" part="card">
        ${front}
        ${this.flip
          ? html`<div class="face back" part="back" aria-hidden=${this.flipped ? 'false' : 'true'}>
              <slot name="back"></slot>
            </div>`
          : nothing}
      </div>
    `;
  }
}
export default K3CoverflowItem;

if (!customElements.get('k3-coverflow-item')) {
  customElements.define('k3-coverflow-item', K3CoverflowItem);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-coverflow-item': K3CoverflowItem;
  }
}
