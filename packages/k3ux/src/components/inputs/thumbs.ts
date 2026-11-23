import { html, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import {
  K3Element,
  attachInternals,
  setFormValue,
  haptic,
} from 'k3ui';
import { hostReset } from '../_shared.js';
import {
  ThumbsSpecs,
  resolveThumbsSize,
  resolveThumbsVote,
  type ThumbsSize,
  type ThumbsVote,
} from './thumbs.specs.js';
import { thumbsStyles } from './thumbs.styles.js';

export type { ThumbsSize, ThumbsVote } from './thumbs.specs.js';
export {
  ThumbsSpecs,
  ThumbsIconDp,
  ThumbsTargetDp,
  resolveThumbsSize,
  resolveThumbsVote,
} from './thumbs.specs.js';

/**
 * Thumbs up / down with a live counter — exclusive toggle vote.
 *
 * Layout: `thumb_up` · count · `thumb_down` (YouTube-style).
 * Tapping the active thumb clears the vote; switching adjusts ±2×step.
 *
 * @fires k3-change - `{ value, vote, delta }` after a user or programmatic vote
 * @fires k3-vote - same payload (alias for listeners that prefer vote semantics)
 *
 * @example
 * ```html
 * <k3-thumbs value="17" label="Helpful?"></k3-thumbs>
 * <k3-thumbs value="42" vote="up" size="lg"></k3-thumbs>
 * ```
 *
 * @see ./thumbs.specs.ts
 */
export class K3Thumbs extends K3Element {
  static formAssociated = true;
  static override styles = [hostReset, thumbsStyles];

  private internals = attachInternals(this as unknown as HTMLElement);

  /** Displayed counter (net score). */
  @property({ type: Number }) value: number = ThumbsSpecs.defaultValue;
  /** Current exclusive vote — `''` | `up` | `down`. */
  @property({ reflect: true }) vote: ThumbsVote = ThumbsSpecs.defaultVote;
  /** Increment / decrement amount per vote edge. */
  @property({ type: Number }) step: number = ThumbsSpecs.defaultStep;
  /** Optional lower clamp (omit for unbounded). */
  @property({ type: Number }) min: number | undefined;
  /** Optional upper clamp. */
  @property({ type: Number }) max: number | undefined;
  @property({ type: Boolean, reflect: true }) readonly = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ reflect: true }) size: ThumbsSize = ThumbsSpecs.defaultSize;
  /** Material Symbol for upvote (default `thumb_up`). */
  @property({ attribute: 'up-icon' }) upIcon: string = ThumbsSpecs.defaultUpIcon;
  /** Material Symbol for downvote (default `thumb_down`). */
  @property({ attribute: 'down-icon' }) downIcon: string = ThumbsSpecs.defaultDownIcon;
  @property() name: string | undefined;
  /** Accessible name for the control group. */
  @property() label: string | undefined;
  /** Accessible label for the upvote button. */
  @property({ attribute: 'up-label' }) upLabel: string | undefined;
  /** Accessible label for the downvote button. */
  @property({ attribute: 'down-label' }) downLabel: string | undefined;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncFormValue();
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('size')) this.size = resolveThumbsSize(this.size);
    if (changed.has('vote')) this.vote = resolveThumbsVote(this.vote);
    if (changed.has('value') || changed.has('min') || changed.has('max') || changed.has('step')) {
      this.step = this.resolvedStep();
      this.value = this.clamp(this.value);
    }
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (
      changed.has('value') ||
      changed.has('vote') ||
      changed.has('name') ||
      changed.has('disabled')
    ) {
      this.syncFormValue();
    }
  }

  /** Current counter. */
  getValue(): number {
    return this.value;
  }

  /** Current exclusive vote. */
  getVote(): ThumbsVote {
    return this.vote;
  }

  /**
   * Set counter (clamped). Emits `k3-change` when it differs.
   * Does not change `vote`.
   */
  setValue(next: number): void {
    const v = this.clamp(next);
    if (v === this.value) {
      this.requestUpdate();
      return;
    }
    const delta = v - this.value;
    this.value = v;
    this.emitChange(delta);
  }

  /**
   * Apply or clear a vote (`up` / `down` / `''`).
   * Adjusts the counter using exclusive-toggle rules.
   */
  setVote(next: ThumbsVote): void {
    const target = resolveThumbsVote(next);
    if (target === this.vote) return;
    if (target === '') {
      this.clearVote();
      return;
    }
    this.applyVote(target);
  }

  /** Clear the active vote and restore the counter. */
  clearVote(): void {
    if (!this.vote) return;
    const delta = this.vote === 'up' ? -this.resolvedStep() : this.resolvedStep();
    this.vote = '';
    this.value = this.clamp(this.value + delta);
    haptic.selection();
    this.emitChange(delta);
  }

  private resolvedStep(): number {
    const s = Number(this.step);
    return Number.isFinite(s) && s > 0 ? s : ThumbsSpecs.defaultStep;
  }

  private clamp(raw: number): number {
    let v = Number(raw);
    if (!Number.isFinite(v)) v = ThumbsSpecs.defaultValue;
    if (this.min != null && Number.isFinite(this.min)) v = Math.max(this.min, v);
    if (this.max != null && Number.isFinite(this.max)) v = Math.min(this.max, v);
    return v;
  }

  private syncFormValue(): void {
    const name = this.name;
    if (!name || this.disabled) {
      setFormValue(this.internals, null);
      return;
    }
    setFormValue(this.internals, String(this.value));
  }

  private emitChange(delta: number): void {
    const detail = { value: this.value, vote: this.vote, delta };
    this.emit('k3-change', detail);
    this.emit('k3-vote', detail);
  }

  /** Exclusive toggle: same thumb clears; other switches (±2×step). */
  private applyVote(next: 'up' | 'down'): void {
    if (this.disabled || this.readonly) return;
    const step = this.resolvedStep();
    const prev = this.vote;
    let delta = 0;
    let vote: ThumbsVote = next;

    if (prev === next) {
      delta = next === 'up' ? -step : step;
      vote = '';
    } else if (prev === '') {
      delta = next === 'up' ? step : -step;
      vote = next;
    } else {
      delta = next === 'up' ? 2 * step : -2 * step;
      vote = next;
    }

    this.vote = vote;
    this.value = this.clamp(this.value + delta);
    haptic.selection();
    this.emitChange(delta);
  }

  private onUp = (): void => this.applyVote('up');
  private onDown = (): void => this.applyVote('down');

  private renderGlyph(name: string) {
    return html`
      <span
        class="glyph notranslate"
        translate="no"
        lang="zxx"
        data-k3-icon=${name}
        aria-hidden="true"
      ></span>
    `;
  }

  override render() {
    const groupLabel = this.label?.trim() || 'Rating';
    const upLabel = this.upLabel?.trim() || 'Thumbs up';
    const downLabel = this.downLabel?.trim() || 'Thumbs down';
    const upIcon = this.upIcon?.trim() || ThumbsSpecs.defaultUpIcon;
    const downIcon = this.downIcon?.trim() || ThumbsSpecs.defaultDownIcon;
    const upPressed = this.vote === 'up';
    const downPressed = this.vote === 'down';

    return html`
      <div class="row" role="group" aria-label=${groupLabel}>
        <button
          type="button"
          class="btn is-up"
          aria-label=${upLabel}
          aria-pressed=${upPressed ? 'true' : 'false'}
          ?disabled=${this.disabled || this.readonly}
          @click=${this.onUp}
        >
          ${this.renderGlyph(upIcon)}
        </button>
        <span class="count" aria-live="polite" aria-atomic="true">${this.value}</span>
        <button
          type="button"
          class="btn is-down"
          aria-label=${downLabel}
          aria-pressed=${downPressed ? 'true' : 'false'}
          ?disabled=${this.disabled || this.readonly}
          @click=${this.onDown}
        >
          ${this.renderGlyph(downIcon)}
        </button>
      </div>
    `;
  }
}

export default K3Thumbs;

if (!customElements.get('k3-thumbs')) {
  customElements.define('k3-thumbs', K3Thumbs);
}

declare global {
  interface HTMLElementTagNameMap {
    'k3-thumbs': K3Thumbs;
  }
}
