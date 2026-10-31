import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import {
  K3Element,
  attachInternals,
  setFormValue,
  hasNamedSlot,
} from '../../core/index.js';
import { i18n } from '../../i18n/index.js';
import { hostReset } from '../_shared.js';
import { textFieldStyles } from './text-field.styles.js';
import { TEMPORAL_FIELD_TYPES, type TextFieldType, type TextFieldVariant } from './field-types.js';

export type { TextFieldType, TextFieldVariant } from './field-types.js';

/** Material Web STANDARD easing — label float WAAPI. */
const LABEL_EASING = 'cubic-bezier(0.2, 0, 0, 1)';
/** Matches cutout `--k3-tf-cutout-motion` (short3). */
const LABEL_MS = 150;

/**
 * M3 text field — filled · outlined · standard.
 *
 * Outlined (Material Web): 3-part outline · dual labels · WAAPI 150 ms
 * float · cutout scaleX from center. Filled: fixed 56dp, same float engine.
 *
 * @see https://m3.material.io/components/text-fields/specs
 * @see https://material-web.dev/components/text-field/
 */
export class K3TextField extends K3Element {
  static formAssociated = true;
  static override styles = [hostReset, textFieldStyles];

  internals = attachInternals(this);

  // ── Public API ──────────────────────────────────────────────────────────
  @property() label = '';
  @property() name = '';
  @property() value = '';
  @property() placeholder = '';
  @property() type: TextFieldType = 'text';
  @property({ reflect: true }) variant: TextFieldVariant = 'filled';
  /** Prefer `k3-textarea` for multi-line. */
  @property({ type: Boolean, reflect: true }) multiline = false;
  @property({ type: Number }) rows = 3;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean }) readonly = false;
  @property({ type: Boolean }) required = false;
  @property({ attribute: 'supporting-text' }) supportingText = '';
  /** Sets error colors + aria-invalid (replaces supporting text). */
  @property() error = '';
  @property({ attribute: 'prefix-text' }) prefixText = '';
  @property({ attribute: 'suffix-text' }) suffixText = '';
  @property({ type: Number, attribute: 'max-length' }) maxLength: number | null = null;
  @property() autocomplete = '';
  @property() pattern = '';
  @property({ type: Boolean, attribute: 'password-toggle' }) passwordToggle = true;
  @property({ type: Boolean, reflect: true }) clearable = false;
  /** Skip form association (e.g. `k3-select` trigger). */
  @property({ type: Boolean, attribute: 'no-form', reflect: true }) noForm = false;

  // ── Internal state ──────────────────────────────────────────────────────
  @state() private focused = false;
  @state() private hasLeading = false;
  @state() private hasTrailing = false;
  /** Slotted k3-icon-button / k3-button — keep default width (not 24dp glyph). */
  @state() private leadingControl = false;
  @state() private trailingControl = false;
  @state() private revealPassword = false;
  /** Float WAAPI in flight — keeps floating label painted for rise + descent. */
  @state() private animating = false;

  @query('.control') private controlEl!: HTMLInputElement | HTMLTextAreaElement;
  @query('.label.floating') private floatingLabelEl!: HTMLElement | null;
  @query('.label.resting') private restingLabelEl!: HTMLElement | null;

  private labelAnimation?: Animation;
  private prevFloated: boolean | undefined;
  private pendingKeyframes: Keyframe[] | undefined;
  private labelAnimGen = 0;

  // ── Derived ─────────────────────────────────────────────────────────────
  private get isStandard(): boolean {
    return this.variant === 'standard';
  }

  private get floated(): boolean {
    if (this.isStandard) return false;
    // date / time / datetime-local render a native mask — never under the label
    return this.focused || !!this.value || TEMPORAL_FIELD_TYPES.has(this.type);
  }

  private get showPasswordToggle(): boolean {
    return this.type === 'password' && this.passwordToggle && !this.multiline;
  }

  private get showClear(): boolean {
    return (
      this.clearable &&
      !!this.value &&
      !this.disabled &&
      !this.readonly &&
      !this.showPasswordToggle
    );
  }

  private get controlType(): TextFieldType | 'text' {
    return this.type === 'password' && this.revealPassword ? 'text' : this.type;
  }

  private get supporting(): string {
    return this.error || this.supportingText;
  }

  private get showCounter(): boolean {
    return this.maxLength != null && this.maxLength > 0;
  }

  // ── Form / slots / host attrs ───────────────────────────────────────────
  private writeFormValue(v: string | null): void {
    setFormValue(this.internals, this.noForm ? null : v);
  }

  private isSlotControl(el: Element | null): boolean {
    if (!el) return false;
    const t = el.localName;
    return t === 'k3-icon-button' || t === 'k3-button';
  }

  private syncSlots = (): void => {
    this.hasLeading = hasNamedSlot(this, 'leading-icon');
    this.hasTrailing =
      this.showPasswordToggle ||
      this.showClear ||
      hasNamedSlot(this, 'trailing-icon');
    this.leadingControl = this.isSlotControl(
      this.querySelector(':scope > [slot="leading-icon"]'),
    );
    this.trailingControl = this.isSlotControl(
      this.querySelector(':scope > [slot="trailing-icon"]'),
    );
  };

  private syncHostState(): void {
    this.toggleAttribute('data-focused', this.focused);
    this.toggleAttribute('data-floated', this.floated);
    this.toggleAttribute('data-populated', !!this.value);
    this.toggleAttribute('data-error', !!this.error);
    this.toggleAttribute('data-has-label', !!this.label);
    this.toggleAttribute('data-has-leading', this.hasLeading);
    this.toggleAttribute('data-has-trailing', this.hasTrailing);
    this.toggleAttribute('data-leading-control', this.leadingControl);
    this.toggleAttribute('data-trailing-control', this.trailingControl);
    this.toggleAttribute('data-animating', this.animating);
  }

  // ── Label float (Material Web WAAPI) ────────────────────────────────────
  /**
   * Measure rest↔float in willUpdate (DOM still on previous float layout),
   * play after paint. Gen token: prior cancel must not clear `animating`
   * (that hid the descent).
   */
  private armFloatAnimation(toFloating: boolean): void {
    const frames = this.measureLabelKeyframes(toFloating);
    if (!frames.length) return;
    this.pendingKeyframes = frames;
    this.animating = true;
  }

  private playLabelAnimation(keyframes: Keyframe[]): void {
    const el = this.floatingLabelEl;
    if (!el || !keyframes.length) {
      this.animating = false;
      this.syncHostState();
      return;
    }

    const gen = ++this.labelAnimGen;
    const prev = this.labelAnimation;
    this.labelAnimation = undefined;
    prev?.cancel();

    const anim = el.animate(keyframes, {
      duration: LABEL_MS,
      easing: LABEL_EASING,
      fill: 'forwards',
    });
    this.labelAnimation = anim;

    anim.addEventListener(
      'finish',
      () => {
        if (gen !== this.labelAnimGen) return;
        try {
          anim.commitStyles();
        } catch {
          /* element may have left the document */
        }
        anim.cancel();
        el.style.transform = '';
        el.style.width = '';
        this.animating = false;
        this.syncHostState();
      },
      { once: true },
    );
  }

  /** Rest↔float keyframes from live geometry (Material Web). */
  private measureLabelKeyframes(toFloating: boolean): Keyframe[] {
    const floating = this.floatingLabelEl;
    const resting = this.restingLabelEl;
    if (!floating || !resting) return [];

    const fr = floating.getBoundingClientRect();
    const rr = resting.getBoundingClientRect();
    const floatingW = floating.scrollWidth;
    const restingW = resting.scrollWidth;
    if (floatingW === 0 || restingW === 0) return [];

    const scale = restingW / floatingW;
    const xDelta = rr.x - fr.x;
    const yDelta =
      rr.y - fr.y + Math.round((rr.height - fr.height * scale) / 2);

    const rest = `translateX(${xDelta}px) translateY(${yDelta}px) scale(${scale})`;
    const float = `translateX(0) translateY(0) scale(1)`;
    const clipped = restingW > resting.clientWidth;
    const width = clipped ? `${resting.clientWidth / scale}px` : '';

    return toFloating
      ? [
          { transform: rest, width },
          { transform: float, width },
        ]
      : [
          { transform: float, width },
          { transform: rest, width },
        ];
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  private togglePasswordReveal = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
    if (this.disabled) return;
    this.revealPassword = !this.revealPassword;
    this.emit('k3-password-toggle', { revealed: this.revealPassword });
    queueMicrotask(() => this.controlEl?.focus());
  };

  private clearValue = (e: Event): void => {
    e.preventDefault();
    e.stopPropagation();
    if (this.disabled || this.readonly) return;
    this.value = '';
    this.writeFormValue(null);
    this.syncSlots();
    this.syncHostState();
    this.emit('k3-input', { value: '' });
    this.emit('k3-change', { value: '' });
    this.emit('k3-clear');
    queueMicrotask(() => this.controlEl?.focus());
  };

  // ── Lifecycle ───────────────────────────────────────────────────────────
  override connectedCallback(): void {
    super.connectedCallback();
    this.writeFormValue(this.noForm ? null : this.value || null);
    queueMicrotask(() => {
      this.syncSlots();
      this.syncHostState();
      this.prevFloated = this.floated;
    });
  }

  override disconnectedCallback(): void {
    this.labelAnimGen++;
    this.labelAnimation?.cancel();
    super.disconnectedCallback();
  }

  override firstUpdated(): void {
    this.syncSlots();
    this.shadowRoot?.querySelectorAll('slot').forEach((slot) => {
      slot.addEventListener('slotchange', this.syncSlots);
    });
    this.syncHostState();
    this.prevFloated = this.floated;
  }

  override willUpdate(changed: PropertyValues): void {
    /* Derived before render — no second update cycle */
    if (changed.has('type') && this.type !== 'password') this.revealPassword = false;
    if (
      !(changed.has('focused') || changed.has('value') || changed.has('variant')) ||
      this.isStandard ||
      !this.label
    ) {
      return;
    }
    const was = this.prevFloated;
    const next = this.floated;
    if (was !== undefined && was !== next) {
      this.armFloatAnimation(next);
    }
    this.prevFloated = next;
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);

    const slotsDirty =
      changed.has('type') ||
      changed.has('passwordToggle') ||
      changed.has('clearable') ||
      changed.has('value');
    if (slotsDirty) this.syncSlots();

    if (
      slotsDirty ||
      changed.has('focused') ||
      changed.has('error') ||
      changed.has('placeholder') ||
      changed.has('hasLeading') ||
      changed.has('hasTrailing') ||
      changed.has('leadingControl') ||
      changed.has('trailingControl') ||
      changed.has('revealPassword') ||
      changed.has('variant') ||
      changed.has('animating')
    ) {
      this.syncHostState();
    }

    if (changed.has('value') || changed.has('noForm')) {
      this.writeFormValue(this.noForm ? null : this.value || null);
    }
    if (this.pendingKeyframes) {
      const frames = this.pendingKeyframes;
      this.pendingKeyframes = undefined;
      this.playLabelAnimation(frames);
    }
  }

  /** Focus the inner control. */
  focus(options?: FocusOptions): void {
    this.controlEl?.focus(options);
  }

  /** Select all text in the control. */
  select(): void {
    this.controlEl?.select();
  }

  // ── Events ──────────────────────────────────────────────────────────────
  private onFocus = (): void => {
    this.focused = true;
  };

  private onBlur = (): void => {
    this.focused = false;
  };

  private onInput = (e: Event): void => {
    const el = e.target as HTMLInputElement | HTMLTextAreaElement;
    let v = el.value;
    if (this.maxLength != null && this.maxLength > 0 && v.length > this.maxLength) {
      v = v.slice(0, this.maxLength);
      el.value = v;
    }
    this.value = v;
    this.writeFormValue(v || null);
    this.emit('k3-input', { value: v });
  };

  private onChange = (): void => {
    this.emit('k3-change', { value: this.value });
  };

  // ── Render ──────────────────────────────────────────────────────────────
  private renderControl(): TemplateResult {
    const describedBy = this.supporting ? 'tf-supporting' : undefined;
    const shared = {
      class: 'control',
      part: 'input',
      name: this.name || undefined,
      disabled: this.disabled,
      readonly: this.readonly,
      required: this.required,
      placeholder: this.placeholder || undefined,
      maxlength: this.maxLength ?? undefined,
      'aria-invalid': this.error ? 'true' : 'false',
      'aria-describedby': describedBy,
    } as const;

    if (this.multiline) {
      return html`
        <textarea
          class=${shared.class}
          part=${shared.part}
          name=${ifDefined(shared.name)}
          .value=${this.value}
          ?disabled=${shared.disabled}
          ?readonly=${shared.readonly}
          ?required=${shared.required}
          placeholder=${ifDefined(shared.placeholder)}
          rows=${this.rows}
          maxlength=${ifDefined(shared.maxlength)}
          aria-invalid=${shared['aria-invalid']}
          aria-describedby=${ifDefined(shared['aria-describedby'])}
          @input=${this.onInput}
          @change=${this.onChange}
          @focus=${this.onFocus}
          @blur=${this.onBlur}
        ></textarea>
      `;
    }

    return html`
      <input
        class=${shared.class}
        part=${shared.part}
        type=${this.controlType}
        name=${ifDefined(shared.name)}
        .value=${this.value}
        ?disabled=${shared.disabled}
        ?readonly=${shared.readonly}
        ?required=${shared.required}
        placeholder=${ifDefined(shared.placeholder)}
        autocomplete=${ifDefined(this.autocomplete || undefined)}
        pattern=${ifDefined(this.pattern || undefined)}
        maxlength=${ifDefined(shared.maxlength)}
        aria-invalid=${shared['aria-invalid']}
        aria-describedby=${ifDefined(shared['aria-describedby'])}
        @input=${this.onInput}
        @change=${this.onChange}
        @focus=${this.onFocus}
        @blur=${this.onBlur}
      />
    `;
  }

  private renderIconButton(
    icon: string,
    label: string,
    onClick: (e: Event) => void,
    pressed?: boolean,
  ): TemplateResult {
    return html`
      <button
        type="button"
        class="trailing has"
        part="trailing-icon"
        tabindex="0"
        aria-label=${label}
        aria-pressed=${ifDefined(
          pressed === undefined ? undefined : pressed ? 'true' : 'false',
        )}
        ?disabled=${this.disabled}
        @mousedown=${(e: Event) => e.preventDefault()}
        @click=${onClick}
      >
        <span
          class="ms notranslate"
          translate="no"
          lang="zxx"
          data-k3-icon=${icon}
          aria-hidden="true"
        ></span>
      </button>
    `;
  }

  private renderTrailing(): TemplateResult {
    if (this.showPasswordToggle) {
      const revealed = this.revealPassword;
      return this.renderIconButton(
        revealed ? 'visibility_off' : 'visibility',
        revealed
          ? i18n.t('textfield.password.hide', 'Hide password')
          : i18n.t('textfield.password.show', 'Show password'),
        this.togglePasswordReveal,
        revealed,
      );
    }
    /*
     * M3: clear appears only when populated; keep slotted trailing affordance
     * (e.g. schedule for time picker) beside it — clear first, then action.
     */
    const hasSlot = hasNamedSlot(this, 'trailing-icon');
    if (!this.showClear && !hasSlot) {
      return html`<span class="trailing" part="trailing-icon"></span>`;
    }
    if (this.showClear && !hasSlot) {
      return this.renderIconButton(
        'close',
        i18n.t('textfield.clear', 'Clear'),
        this.clearValue,
      );
    }
    return html`
      <span
        class=${classMap({
          'trailing-group': true,
          has: true,
          control: this.trailingControl || this.showClear,
        })}
        part="trailing-icon"
      >
        ${this.showClear
          ? this.renderIconButton(
              'close',
              i18n.t('textfield.clear', 'Clear'),
              this.clearValue,
            )
          : nothing}
        <span
          class=${classMap({
            trailing: true,
            has: true,
            control: this.trailingControl,
          })}
        >
          <slot name="trailing-icon" @slotchange=${this.syncSlots}></slot>
        </span>
      </span>
    `;
  }

  /** Dual-label span — floating stays painted while `animating`. */
  private renderLabel(floating: boolean): TemplateResult | typeof nothing {
    if (!this.label || this.isStandard) return nothing;

    const showFloating = this.floated || this.animating;
    const visible = floating ? showFloating : !showFloating;

    return html`
      <span
        class=${classMap({
          label: true,
          floating,
          resting: !floating,
          hidden: !visible,
        })}
        part=${ifDefined(floating ? 'label' : undefined)}
        aria-hidden="true"
        >${this.label}</span
      >
    `;
  }

  private renderOutline(): TemplateResult | typeof nothing {
    if (this.variant !== 'outlined') return nothing;
    return html`
      <div class="outline" part="outline" aria-hidden="true">
        <div class="outline-start"></div>
        <div class="outline-notch">
          <div class="outline-panel-inactive"></div>
          <div class="outline-panel-active"></div>
          <div class="outline-label">${this.renderLabel(true)}</div>
        </div>
        <div class="outline-end"></div>
      </div>
    `;
  }

  override render() {
    const showSupporting = !!this.supporting || this.showCounter;
    const standard = this.isStandard;
    const outlined = this.variant === 'outlined';

    return html`
      ${standard && this.label
        ? html`<span class="static-label" part="label">${this.label}</span>`
        : nothing}

      <div class="field" part="container">
        ${this.renderOutline()}
        ${!standard && this.label
          ? html`
              <div class="label-wrapper">
                ${this.renderLabel(false)}
                ${outlined ? nothing : this.renderLabel(true)}
              </div>
            `
          : nothing}

        <span
          class=${classMap({
            leading: true,
            has: this.hasLeading,
            control: this.leadingControl,
          })}
          part="leading-icon"
        >
          <slot name="leading-icon" @slotchange=${this.syncSlots}></slot>
        </span>

        <div class="body" part="body">
          <span class=${classMap({ affix: true, has: !!this.prefixText })} part="prefix"
            >${this.prefixText}</span
          >
          ${this.renderControl()}
          <span class=${classMap({ affix: true, has: !!this.suffixText })} part="suffix"
            >${this.suffixText}</span
          >
        </div>

        ${this.renderTrailing()}
      </div>

      <div
        id="tf-supporting"
        class=${classMap({ supporting: true, has: showSupporting })}
        part="supporting"
        role=${ifDefined(this.error ? 'alert' : undefined)}
        aria-live=${ifDefined(this.error ? 'polite' : undefined)}
      >
        <span class="supporting-text">${this.supporting}</span>
        <span class=${classMap({ counter: true, has: this.showCounter })} part="counter"
          >${this.value.length}/${this.maxLength}</span
        >
      </div>
    `;
  }
}

export default K3TextField;

if (!customElements.get('k3-text-field')) {
  customElements.define('k3-text-field', K3TextField);
}
