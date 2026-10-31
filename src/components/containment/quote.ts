import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { K3Element, hasNamedSlot } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import {
  QuoteSpecs,
  isQuoteLayout,
  isQuoteTiltDir,
  resolveQuoteTiltDir,
  type QuoteLayout,
  type QuoteTiltDir,
} from './quote.specs.js';
import { quoteStyles } from './quote.styles.js';

export type { QuoteLayout, QuoteTiltDir } from './quote.specs.js';
export {
  QuoteSpecs,
  isQuoteLayout,
  isQuoteTiltDir,
  resolveQuoteTiltDir,
} from './quote.specs.js';

/**
 * Default-true boolean — Lit's Boolean converter treats a missing attribute as
 * false; absent / empty / "true" / "1" → true; "false" / "0" → false.
 */
const tiltConverter = {
  fromAttribute: (value: string | null): boolean => {
    if (value === null) return true;
    if (value === 'false' || value === '0') return false;
    return true;
  },
  toAttribute: (value: boolean): string | null => (value ? '' : 'false'),
};

/**
 * Testimonial quote card — tilted surface, primary offset, author | citation.
 *
 * Job title attribute is `role` (plan API); the JS property is `job` so it does
 * not clash with the ARIA `role` IDL. ARIA `figure` lives on the inner `.wrap`.
 *
 * ```html
 * <k3-quote author="Rodrigo" role="Python educator" layout="author-start" tilt>
 *   <k3-avatar slot="avatar" initials="R"></k3-avatar>
 *   I've been presenting my talks with …
 *   <a slot="action" href="#">Read more</a>
 * </k3-quote>
 * ```
 */
export class K3Quote extends K3Element {
  static override styles = [hostReset, quoteStyles];

  /** Display name (or use `slot="author"`). */
  @property()
  author = '';

  /**
   * Job title / subtitle (or use `slot="role"`).
   * Reflected as attribute `role` to match the public HTML API.
   */
  @property({ attribute: 'role' })
  job = '';

  /**
   * Column order: `author-start` (avatar left) or `author-end` (avatar right).
   */
  @property({ reflect: true })
  layout: QuoteLayout = QuoteSpecs.defaultLayout;

  /**
   * Slight card tilt with colored offset layer behind.
   * Default on — set `tilt="false"` to disable.
   * Motion (deeper tilt) runs on hover only.
   */
  @property({
    reflect: true,
    converter: tiltConverter,
  })
  tilt: boolean = QuoteSpecs.defaultTilt;

  /**
   * Tilt sense: `auto` (random once, same ±3° size), `ccw` (−), or `cw` (+).
   * Auto resolves to `ccw`/`cw` on connect and reflects for stable CSS.
   */
  @property({ reflect: true, attribute: 'tilt-dir' })
  tiltDir: QuoteTiltDir = QuoteSpecs.defaultTiltDir;

  @state() private hasAvatar = false;
  @state() private hasAuthorSlot = false;
  @state() private hasRoleSlot = false;
  @state() private hasAction = false;

  /** @param author - Display name */
  setAuthor(author: string): void {
    this.author = author;
  }

  /** @param job - Subtitle / job title */
  setRole(job: string): void {
    this.job = job;
  }

  /** @param layout - author-start | author-end */
  setLayout(layout: QuoteLayout): void {
    if (isQuoteLayout(layout)) this.layout = layout;
  }

  /** @param tilt - Enable / disable tilt + offset */
  setTilt(tilt: boolean): void {
    this.tilt = tilt;
  }

  /** @param dir - auto | ccw | cw */
  setTiltDir(dir: QuoteTiltDir): void {
    if (isQuoteTiltDir(dir)) this.tiltDir = dir;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.resolveTiltDir();
    this.addEventListener('slotchange', this.syncSlots, true);
    this.syncSlots();
  }

  /** Resolve `auto` → concrete ccw|cw once (same ±3° size, random sense). */
  private resolveTiltDir(): void {
    if (!this.tilt) return;
    if (this.tiltDir === 'ccw' || this.tiltDir === 'cw') return;
    this.tiltDir = resolveQuoteTiltDir('auto');
  }

  override disconnectedCallback(): void {
    this.removeEventListener('slotchange', this.syncSlots, true);
    super.disconnectedCallback();
  }

  private syncSlots = (): void => {
    const hasAvatar = hasNamedSlot(this, 'avatar');
    const hasAuthorSlot = hasNamedSlot(this, 'author');
    const hasRoleSlot = hasNamedSlot(this, 'role');
    const hasAction = hasNamedSlot(this, 'action');
    if (hasAvatar !== this.hasAvatar) this.hasAvatar = hasAvatar;
    if (hasAuthorSlot !== this.hasAuthorSlot) this.hasAuthorSlot = hasAuthorSlot;
    if (hasRoleSlot !== this.hasRoleSlot) this.hasRoleSlot = hasRoleSlot;
    if (hasAction !== this.hasAction) this.hasAction = hasAction;
  };

  override render() {
    const authorFallback = this.author.trim();
    const jobFallback = this.job.trim();
    const showName = this.hasAuthorSlot || !!authorFallback;
    const showJob = this.hasRoleSlot || !!jobFallback;

    return html`
      <div class="wrap" part="root" role=${QuoteSpecs.accessibility.role}>
        <div class="motion" part="motion">
          <div class="offset" part="offset" aria-hidden="true"></div>
          <div class="card" part="card">
            <svg
              class="mark"
              part="mark"
              viewBox="0 0 46 38"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="currentColor"
                d="M22.2344 27.9844C22.2344 30.6094 21.25 32.9062 19.2812 34.875C17.4062 36.75 15.0625 37.6875 12.25 37.6875C9.625 37.6875 7.32812 36.75 5.35938 34.875C3.39062 32.9062 2.21875 30.7031 1.84375 28.2656C1.09375 23.3906 1.89062 18.6094 4.23438 13.9219C6.67188 9.14062 10.1406 5.39063 14.6406 2.67188C16.5156 1.45313 18.1094 1.45313 19.4219 2.67188C20.7344 3.89062 20.5469 5.15625 18.8594 6.46875C17.3594 7.6875 15.9531 9.23437 14.6406 11.1094C13.3281 12.8906 12.4375 15 11.9688 17.4375C11.7812 18.2812 12.2969 18.7031 13.5156 18.7031C15.6719 18.7031 17.6406 19.6406 19.4219 21.5156C21.2969 23.2969 22.2344 25.4531 22.2344 27.9844ZM45.7188 27.9844C45.7188 30.6094 44.7344 32.9062 42.7656 34.875C40.8906 36.75 38.5469 37.6875 35.7344 37.6875C33.1094 37.6875 30.8125 36.75 28.8438 34.875C26.875 32.9062 25.7031 30.7031 25.3281 28.2656C24.5781 23.3906 25.375 18.6094 27.7188 13.9219C30.1562 9.14062 33.625 5.39063 38.125 2.67188C40 1.45313 41.5938 1.45313 42.9062 2.67188C44.2188 3.89062 44.0312 5.15625 42.3438 6.46875C40.8438 7.6875 39.4375 9.23437 38.125 11.1094C36.8125 12.8906 35.9219 15 35.4531 17.4375C35.2656 18.2812 35.7344 18.7031 36.8594 18.7031C39.1094 18.7031 41.125 19.6406 42.9062 21.5156C44.7812 23.2969 45.7188 25.4531 45.7188 27.9844Z"
              />
            </svg>
            <div class="author" part="author">
              <div class="author__avatar" part="avatar" ?hidden=${!this.hasAvatar}>
                <slot name="avatar" @slotchange=${this.syncSlots}></slot>
              </div>
              <div class="author__meta">
                <div class="author__name" part="name" ?hidden=${!showName}>
                  <slot name="author" @slotchange=${this.syncSlots}
                    >${authorFallback || nothing}</slot
                  >
                </div>
                <div class="author__role" part="role" ?hidden=${!showJob}>
                  <slot name="role" @slotchange=${this.syncSlots}
                    >${jobFallback || nothing}</slot
                  >
                </div>
              </div>
            </div>
            <div class="divider" part="divider" aria-hidden="true"></div>
            <div class="quote" part="quote">
              <blockquote class="quote__body" part="body">
                <slot></slot>
              </blockquote>
              <div class="quote__action" part="action" ?hidden=${!this.hasAction}>
                <slot name="action" @slotchange=${this.syncSlots}></slot>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('k3-quote')) {
  customElements.define('k3-quote', K3Quote);
}

export default K3Quote;
