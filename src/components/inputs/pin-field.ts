import { html, nothing, type PropertyValues } from 'lit';
import { property, state, queryAll } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import {
  K3Element,
  attachInternals,
  setFormValue,
  haptic,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { pinFieldStyles } from './pin-field.styles.js';
import { i18n } from '../../i18n/index.js';
import type { PinCharset, TextFieldVariant } from './field-types.js';

export type { PinCharset, TextFieldVariant } from './field-types.js';

const CHARSET_RE: Record<PinCharset, RegExp> = {
  numeric: /^[0-9]$/,
  alpha: /^[a-zA-Z]$/,
  alphanumeric: /^[a-zA-Z0-9]$/,
};

const CHARSET_FILTER: Record<PinCharset, RegExp> = {
  numeric: /[^0-9]/g,
  alpha: /[^a-zA-Z]/g,
  alphanumeric: /[^a-zA-Z0-9]/g,
};

/**
 * PIN / OTP — one cell per character.
 *
 * - `charset` — numeric · alpha · alphanumeric
 * - Optional `mask`, `group-size`, `variant` (filled · outlined · standard)
 * - Fires `k3-complete` when every cell is filled
 * - Call `success()` when the code is correct (green borders)
 */
export class K3PinField extends K3Element {
  static formAssociated = true;
  static override styles = [hostReset, pinFieldStyles];

  internals = attachInternals(this);

  @property() label = '';
  @property() name = '';
  @property() value = '';
  @property({ type: Number }) length = 6;
  @property({ reflect: true }) charset: PinCharset = 'numeric';
  @property({ type: Boolean }) mask = false;
  /** Split cells into groups of N (e.g. 3 → `123 – 456`). */
  @property({ type: Number, attribute: 'group-size' }) groupSize = 0;
  @property() separator = '–';
  @property({ reflect: true }) variant: TextFieldVariant = 'outlined';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean }) readonly = false;
  @property({ type: Boolean }) required = false;
  @property({ attribute: 'supporting-text' }) supportingText = '';
  @property() error = '';
  /** Success helper under cells (green chrome when success is active). */
  @property({ attribute: 'success-text' }) successText = '';
  @property() autocomplete: 'one-time-code' | 'off' | '' = 'one-time-code';

  @state() private focused = false;
  @state() private cells: string[] = [];
  /** Green border state — set by `success()` or declarative `success-text`. */
  @state() private successActive = false;

  @queryAll('.cell') private cellEls!: NodeListOf<HTMLInputElement>;

  private get supporting(): string {
    if (this.error) return this.error;
    if (this.successActive && this.successText) return this.successText;
    return this.supportingText;
  }

  private get cellInputMode(): string {
    return this.charset === 'numeric' ? 'numeric' : 'text';
  }

  private clampLength(): number {
    return Math.min(12, Math.max(2, Math.floor(this.length) || 6));
  }

  private syncFromValue(): void {
    const n = this.clampLength();
    const raw = (this.value ?? '').replace(CHARSET_FILTER[this.charset], '').slice(0, n);
    const next = Array.from({ length: n }, (_, i) => raw[i] ?? '');
    const same =
      next.length === this.cells.length && next.every((c, i) => c === this.cells[i]);
    if (!same) this.cells = next;
  }

  private commit(next: string[], emitComplete = true): void {
    const n = this.clampLength();
    const clipped = next.slice(0, n);
    while (clipped.length < n) clipped.push('');
    this.cells = clipped;
    const joined = clipped.join('');
    /* Editing clears success / error chrome so the user can retry */
    if (this.successActive || this.error) {
      this.clearSuccess();
      this.error = '';
    }
    this.value = joined;
    setFormValue(this.internals, joined || null);
    this.emit('k3-input', { value: joined });
    this.emit('k3-change', { value: joined });
    if (emitComplete && joined.length === n && clipped.every(Boolean)) {
      this.emit('k3-complete', { value: joined });
    }
  }

  /**
   * Mark the entered PIN as correct — green cell borders + optional message.
   * Clears any error state. Fires `k3-success`.
   */
  success(message?: string): void {
    this.error = '';
    if (message !== undefined) this.successText = message;
    else if (!this.successText) {
      this.successText = i18n.t('pin-field.success', 'Correct');
    }
    this.successActive = true;
    haptic.success();
    this.emit('k3-success', { value: this.value, message: this.successText });
  }

  /** Clear success chrome (green borders / success text). */
  clearSuccess(): void {
    this.successActive = false;
    this.successText = '';
  }

  private focusCell(index: number): void {
    const el = this.cellEls?.[index];
    el?.focus();
    el?.select();
  }

  /** Write exactly one character into a cell, then advance focus. */
  private writeCell(index: number, ch: string, emitComplete = true): void {
    const next = [...this.cells];
    next[index] = ch;
    this.commit(next, emitComplete);
    const input = this.cellEls?.[index];
    if (input) input.value = this.mask ? '•' : ch;
    if (index < this.clampLength() - 1) this.focusCell(index + 1);
  }

  private onCellInput = (index: number, e: Event): void => {
    if (this.disabled || this.readonly) return;
    const input = e.target as HTMLInputElement;
    const raw = input.value ?? '';
    const chars = [...raw].filter((c) => CHARSET_RE[this.charset].test(c));
    if (chars.length === 0) {
      /* Reject invalid / empty — keep at most one prior char */
      const keep = this.cells[index] ?? '';
      input.value = keep ? (this.mask ? '•' : keep) : '';
      return;
    }
    if (chars.length > 1) {
      /* OTP autofill / rare multi-insert — one char per cell, never stack */
      input.value = '';
      this.applyPaste(chars.join(''), index);
      return;
    }
    /* Rule: one character per cell (numeric · alpha · alphanumeric) */
    this.writeCell(index, chars[0]!);
  };

  private onBeforeInput = (index: number, e: InputEvent): void => {
    if (this.disabled || this.readonly) return;
    /* Cancel native paste insert — chars are applied in onPaste via clipboardData */
    if (e.inputType === 'insertFromPaste') {
      e.preventDefault();
      return;
    }
    if (e.inputType !== 'insertText' || e.data == null) return;
    e.preventDefault();
    const chars = [...e.data].filter((c) => CHARSET_RE[this.charset].test(c));
    if (chars.length === 0) return;
    if (chars.length > 1) {
      this.applyPaste(chars.join(''), index);
      return;
    }
    this.writeCell(index, chars[0]!);
  };

  private applyPaste(text: string, start = 0): void {
    const cleaned = text.replace(CHARSET_FILTER[this.charset], '');
    if (!cleaned) return;
    const n = this.clampLength();
    const next = [...this.cells];
    let i = start;
    for (const ch of cleaned) {
      if (i >= n) break;
      next[i] = ch; /* one char per cell */
      i++;
    }
    this.commit(next);
    for (let c = start; c < i; c++) {
      const el = this.cellEls?.[c];
      if (el) {
        const ch = next[c] ?? '';
        el.value = ch ? (this.mask ? '•' : ch) : '';
      }
    }
    this.focusCell(Math.min(i, n - 1));
  }

  private onKeyDown = (index: number, e: KeyboardEvent): void => {
    if (this.disabled || this.readonly) return;
    const key = e.key;
    if (key === 'Backspace') {
      e.preventDefault();
      const next = [...this.cells];
      if (next[index]) {
        next[index] = '';
        this.commit(next, false);
        const el = this.cellEls?.[index];
        if (el) el.value = '';
      } else if (index > 0) {
        next[index - 1] = '';
        this.commit(next, false);
        this.focusCell(index - 1);
        const el = this.cellEls?.[index - 1];
        if (el) el.value = '';
      }
      return;
    }
    if (key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      this.focusCell(index - 1);
      return;
    }
    if (key === 'ArrowRight' && index < this.clampLength() - 1) {
      e.preventDefault();
      this.focusCell(index + 1);
      return;
    }
    if (key === 'Delete') {
      e.preventDefault();
      const next = [...this.cells];
      next[index] = '';
      this.commit(next, false);
      const el = this.cellEls?.[index];
      if (el) el.value = '';
      return;
    }
    /* Printable — force single-char replace (blocks stacking in one cell) */
    if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (!CHARSET_RE[this.charset].test(key)) return;
      this.writeCell(index, key);
    }
  };

  private onPaste = (index: number, e: ClipboardEvent): void => {
    /* Do not preventDefault on `paste` — Lighthouse flags paste-blocking inputs.
     * Block the native insert via beforeinput (insertFromPaste) instead. */
    if (this.disabled || this.readonly) return;
    const text = e.clipboardData?.getData('text') ?? '';
    this.applyPaste(text, index);
  };

  private onFocusIn = (): void => {
    this.focused = true;
  };

  private onFocusOut = (e: FocusEvent): void => {
    const next = e.relatedTarget as Node | null;
    if (next && this.contains(next)) return;
    this.focused = false;
  };

  private syncHostState(): void {
    this.toggleAttribute('data-focused', this.focused);
    this.toggleAttribute('data-error', !!this.error);
    this.toggleAttribute('data-success', this.successActive && !this.error);
  }

  override willUpdate(changed: PropertyValues): void {
    if (
      changed.has('value') ||
      changed.has('length') ||
      changed.has('charset') ||
      this.cells.length !== this.clampLength()
    ) {
      this.syncFromValue();
    }
    /* Declarative success-text activates green chrome */
    if (changed.has('successText') && this.successText && !this.error) {
      this.successActive = true;
    }
    if (changed.has('error') && this.error) {
      this.successActive = false;
    }
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.syncHostState();
    if (changed.has('value')) {
      setFormValue(this.internals, this.value || null);
    }
  }

  private renderCells() {
    const n = this.clampLength();
    const group = this.groupSize > 0 ? Math.floor(this.groupSize) : 0;
    const nodes = [];
    for (let i = 0; i < n; i++) {
      if (group > 0 && i > 0 && i % group === 0) {
        nodes.push(html`<span class="sep" aria-hidden="true">${this.separator}</span>`);
      }
      const ch = this.cells[i] ?? '';
      nodes.push(html`
        <input
          class="cell"
          part="cell"
          type="text"
          inputmode=${this.cellInputMode}
          maxlength="1"
          autocomplete=${i === 0 ? (this.autocomplete || 'one-time-code') : 'off'}
          aria-label=${i18n.t('pin-field.cell.aria', '{label} {index} / {total}', {
            label: this.label || i18n.t('pin-field.label.default', 'PIN'),
            index: i + 1,
            total: n,
          })}
          .value=${ch ? (this.mask ? '•' : ch) : ''}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          ?required=${this.required && i === 0}
          @beforeinput=${(e: InputEvent) => this.onBeforeInput(i, e)}
          @input=${(e: Event) => this.onCellInput(i, e)}
          @keydown=${(e: KeyboardEvent) => this.onKeyDown(i, e)}
          @paste=${(e: ClipboardEvent) => this.onPaste(i, e)}
        />
      `);
    }
    return nodes;
  }

  override render() {
    return html`
      ${this.label
        ? html`<span class="static-label" part="label">${this.label}</span>`
        : nothing}
      <div
        class="row"
        part="row"
        role="group"
        aria-label=${ifDefined(this.label || undefined)}
        @focusin=${this.onFocusIn}
        @focusout=${this.onFocusOut}
      >
        ${this.renderCells()}
      </div>
      ${this.supporting
        ? html`<div
            class="supporting"
            part="supporting"
            role=${ifDefined(this.error ? 'alert' : undefined)}
            aria-live=${ifDefined(
              this.successActive && !this.error ? 'polite' : undefined,
            )}
          >
            ${this.supporting}
          </div>`
        : nothing}
    `;
  }
}

export default K3PinField;

if (!customElements.get('k3-pin-field')) {
  customElements.define('k3-pin-field', K3PinField);
}
