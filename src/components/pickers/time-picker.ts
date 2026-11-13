import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { resolveIdRef } from '../../core/id-ref.js';
import { property, state, query } from 'lit/decorators.js';
import {
  K3Element,
  runOpenClose,
  afterPaint,
  waitForMotion,
  FocusTrap,
  LayerPortal,
  overlayStack,
  allowsExpressiveMotion,
  focusRingStyles,
  edgeScrollbarStyles,
  SURFACE_COMPACT_MQ,
  resolveSurfaceVariant,
  syncResolvedSurface,
  attachDockedFit,
  attachOutsideDismiss,
  type DockedFitController,
  type OutsideDismissController,
} from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import { timePickerStyles } from './time-picker.styles.js';
import {
  closePopoverLayer,
  openPopoverLayer,
  supportsPopoverApi,
} from './time-picker.open.js';
import { applyDockedPosition } from './time-picker.position.js';
import { canWebAnimate, morphSize, spatialFastTiming } from '../../motion/morph.js';
import K3TimePickerDial from './time-picker-dial.js';
import K3Button from '../actions/button.js';
import type {
  BlackoutTimesFn,
  TimeDraft,
  TimeParts,
  TimePickerFormat,
  TimePickerMode,
  TimePickerOrientation,
  TimePickerPeriod,
  TimePickerResolvedOrientation,
  TimePickerResolvedVariant,
  TimePickerUiMode,
  TimePickerVariant,
  TimePickerView,
} from './time-picker.types.js';
import {
  TOGGLE_HOST_SELECTOR,
  applyPeriod,
  clampParts,
  displayHour,
  draftToDetail,
  draftToParts,
  emptyDraft,
  formatSegment,
  hour24FromDisplay,
  isPartsDisabled,
  nextView,
  parseTimeToParts,
  periodLabels,
  periodOf,
  resolveFormat,
  resolveOrientation,
  resolveUiMode,
  snapToStep,
  syncTriggerAria,
} from './time-picker.utils.js';

if (!customElements.get('k3-time-picker-dial')) {
  customElements.define('k3-time-picker-dial', K3TimePickerDial);
}
if (!customElements.get('k3-button')) {
  customElements.define('k3-button', K3Button);
}

/**
 * Material 3 Expressive time picker — dial + keyboard, 12/24h, docked or modal.
 *
 * Opens empty when unset (no “now” fill-in). OK disabled until hour + minute set.
 * `orientation` affects dial layout only; keyboard is always vertical + AM/PM beside.
 * `mode` = initial surface; runtime dial↔keyboard is `uiMode` (not reset by format).
 *
 * @see https://m3.material.io/components/time-pickers
 * @see https://matraic.github.io/m3e/#/components/timepicker.html
 *
 * @fires k3-input — draft changes
 * @fires k3-change — confirmed with OK
 * @fires k3-open-start / k3-open-end / k3-close-start / k3-close-end
 *
 * @example
 * ```html
 * <k3-text-field id="t" label="Time"></k3-text-field>
 * <k3-icon-button label="Open">
 *   <span class="ms" data-k3-icon="schedule"></span>
 *   <k3-time-picker-toggle for="tp"></k3-time-picker-toggle>
 * </k3-icon-button>
 * <k3-time-picker id="tp" for="t" variant="auto" format="auto"></k3-time-picker>
 * ```
 */
export class K3TimePicker extends K3Element {
  static override styles = [hostReset, focusRingStyles, edgeScrollbarStyles, timePickerStyles];

  @property() value = '';
  @property() for = '';
  @property({ reflect: true }) variant: TimePickerVariant = 'docked';
  @property({ reflect: true }) mode: TimePickerMode = 'dial';
  @property({ reflect: true }) orientation: TimePickerOrientation = 'vertical';
  @property({ reflect: true }) format: TimePickerFormat = '12';
  @property({ attribute: 'min-time' }) minTime = '';
  @property({ attribute: 'max-time' }) maxTime = '';
  @property({ type: Boolean, attribute: 'show-seconds', reflect: true }) showSeconds = false;
  @property({ type: Number, attribute: 'minute-step' }) minuteStep = 1;
  @property({ type: Number, attribute: 'second-step' }) secondStep = 1;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, attribute: 'hide-mode-toggle', reflect: true }) hideModeToggle =
    false;
  @property({ type: Boolean, attribute: 'hide-format-toggle', reflect: true }) hideFormatToggle =
    false;
  @property({ attribute: 'confirm-label' }) confirmLabel = '';
  @property({ attribute: 'dismiss-label' }) dismissLabel = '';
  @property({ attribute: 'dial-label' }) dialLabel = '';
  @property({ attribute: 'input-label' }) inputLabel = '';
  @property({ attribute: 'hour-label' }) hourLabel = '';
  @property({ attribute: 'minute-label' }) minuteLabel = '';
  @property({ attribute: 'second-label' }) secondLabel = '';

  /** Optional blackout predicate (not an attribute). */
  blackoutTimes: BlackoutTimesFn | null = null;

  @property({ type: Boolean, reflect: true }) open = false;

  /** Surface id for `aria-controls` on toggle hosts. */
  readonly surfaceId = `k3-tp-surface-${Math.random().toString(36).slice(2, 9)}`;

  @state() private draft: TimeDraft = emptyDraft();
  @state() private view: TimePickerView = 'hour';
  @state() private uiMode: TimePickerUiMode = 'dial';
  @state() private resolvedVariant: TimePickerResolvedVariant = 'docked';
  @state() private resolvedOrientation: TimePickerResolvedOrientation = 'vertical';
  @state() private compact = true;
  @state() private editRaw: string | null = null;

  @query('.surface') private surfaceEl!: HTMLElement;

  private trap = new FocusTrap();
  private portal = new LayerPortal();
  private mq?: MediaQueryList;
  private anchor: HTMLElement | null = null;
  private forBound: HTMLElement | null = null;
  private readonly dockedFit: DockedFitController = attachDockedFit({
    isActive: () => this.open && this.resolvedVariant === 'docked',
    onReposition: () => this.positionDocked(),
    observe: () => this,
  });
  private _outsideDismiss: OutsideDismissController | null = null;

  private get clockFormat(): '12' | '24' {
    return resolveFormat(this.format, i18n.locale);
  }

  private get period(): TimePickerPeriod {
    return periodOf(this.draft.hour);
  }

  private get minParts(): TimeParts | null {
    return parseTimeToParts(this.minTime);
  }

  private get maxParts(): TimeParts | null {
    return parseTimeToParts(this.maxTime);
  }

  private get canConfirm(): boolean {
    const parts = draftToParts(this.draft);
    return !!parts && !isPartsDisabled(parts, this.minParts, this.maxParts, this.blackoutTimes);
  }

  private get formatToggleTarget(): '12' | '24' {
    return this.clockFormat === '12' ? '24' : '12';
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'dialog');
    this.setAttribute('aria-modal', 'false');
    this.setAttribute('aria-labelledby', `${this.surfaceId}-title`);
    if (!this.hasAttribute('popover')) this.setAttribute('popover', 'manual');
    this.mq = window.matchMedia(SURFACE_COMPACT_MQ);
    this.compact = this.mq.matches;
    this.mq.addEventListener('change', this.onMq);
    this.resolveLayout();
    this.bindForField();
    this.syncToggleAria();
  }

  override disconnectedCallback(): void {
    this.mq?.removeEventListener('change', this.onMq);
    this.unbindForField();
    this.unbindDismiss();
    this.unbindFitListeners();
    this.trap.deactivate({ restore: false });
    if (!this.portal.isElevating) this.portal.clearHome();
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has('mode')) this.uiMode = resolveUiMode(this.mode);
    if (
      changed.has('variant') ||
      changed.has('orientation') ||
      changed.has('mode') ||
      changed.has('format')
    ) {
      this.resolveLayout();
    }
    if (changed.has('for')) this.bindForField();
    if (changed.has('value') && !this.open) {
      this.draft = parseTimeToParts(this.value) ?? emptyDraft();
    }
    if (changed.has('open') || changed.has('disabled') || changed.has('id')) {
      this.syncToggleAria();
    }
  }

  async show(anchor?: HTMLElement | null): Promise<boolean> {
    if (this.open || this.disabled) return false;
    this.anchor = anchor ?? this.findAnchor();
    this.resolveLayout();
    /* Scrim already up — do not open another picker/dialog beside it. */
    if (overlayStack.wouldOpenBeside(this, this.anchor ?? this.forEl())) {
      return false;
    }
    const seeded = this.for
      ? this.readForValue()
      : (parseTimeToParts(this.value) ?? this.readForValue());
    this.draft = seeded ? clampParts(seeded, this.minParts, this.maxParts) : emptyDraft();
    if (!seeded) this.value = '';
    this.editRaw = null;
    this.view = 'hour';
    this.uiMode = resolveUiMode(this.mode);
    this.resolveLayout();

    return runOpenClose(
      this,
      'open',
      async () => {
        this.removeAttribute('data-closing');
        const dockedEnter =
          this.resolvedVariant === 'docked' && allowsExpressiveMotion();
        if (dockedEnter) this.setAttribute('data-enter', '');
        this.open = true;
        await this.updateComplete;
        await afterPaint();
        if (!openPopoverLayer(this)) {
          this.removeAttribute('popover');
          this.portal.elevate(this);
          await afterPaint();
        }
        this.positionDocked();
        this.bindFitListeners();
        if (dockedEnter) {
          void this.offsetWidth; /* commit closed transform */
          await afterPaint();
          this.removeAttribute('data-enter');
          await this.updateComplete;
          await afterPaint();
        } else {
          await afterPaint();
        }
        /* Final fit after enter settle — scrollHeight-stable, no clip flash */
        this.positionDocked();
        this.trap.activate(this.surfaceEl ?? this);
        this.bindDismiss();
        if (this.resolvedVariant === 'modal') {
          overlayStack.push(this, () => void this.hide(false));
        }
        this.focusActiveInput();
      },
      { source: 'api' },
    );
  }

  async hide(commit = false): Promise<boolean> {
    if (!this.open) return false;
    return runOpenClose(
      this,
      'close',
      async () => {
        if (commit) this.commit();
        this.unbindDismiss();
        this.unbindFitListeners();
        this.trap.deactivate({ restore: true });
        if (allowsExpressiveMotion()) {
          this.setAttribute('data-closing', '');
          await this.updateComplete;
          await waitForMotion(this, 400);
        }
        closePopoverLayer(this);
        this.open = false;
        this.removeAttribute('data-closing');
        this.removeAttribute('data-enter');
        this.portal.restore(this);
        overlayStack.remove(this);
        if (supportsPopoverApi(this) && !this.hasAttribute('popover')) {
          this.setAttribute('popover', 'manual');
        }
        this.removeAttribute('data-flip');
        this.removeAttribute('data-clip');
        this.style.removeProperty('--k3-tp-top');
        this.style.removeProperty('--k3-tp-left');
        this.style.maxHeight = '';
      },
      { source: 'api' },
    );
  }

  toggle(anchor?: HTMLElement | null): Promise<boolean> {
    if (this.disabled) return Promise.resolve(false);
    return this.open ? this.hide() : this.show(anchor);
  }

  // ── layout / for-field / dismiss / docked ──────────────────────────

  private onMq = (e: MediaQueryListEvent): void => {
    this.compact = e.matches;
    this.resolveLayout();
  };

  private resolveLayout(): void {
    this.resolvedVariant = resolveSurfaceVariant(this.variant, this.compact);
    this.resolvedOrientation = resolveOrientation(this.orientation, this.compact);
    syncResolvedSurface(this, this.resolvedVariant);
    this.dataset.resolvedOrientation = this.resolvedOrientation;
    this.dataset.mode = this.uiMode;
    this.dataset.format = this.clockFormat;
    if (this.open && this.resolvedVariant === 'docked') {
      queueMicrotask(() => this.positionDocked());
    }
  }

  private syncToggleAria(): void {
    if (!this.id) return;
    document.querySelectorAll(`k3-time-picker-toggle[for="${this.id}"]`).forEach((toggle) => {
      const host =
        (toggle.closest(TOGGLE_HOST_SELECTOR) as HTMLElement | null) ??
        (toggle.parentElement as HTMLElement | null);
      syncTriggerAria(host, {
        open: this.open,
        controls: this.surfaceId,
        disabled: this.disabled,
      });
    });
  }

  private onForCleared = (): void => {
    this.value = '';
    if (!this.open) this.draft = emptyDraft();
  };

  private bindForField(): void {
    this.unbindForField();
    const el = this.forEl();
    if (!el) return;
    this.forBound = el;
    el.addEventListener('k3-clear', this.onForCleared);
  }

  private unbindForField(): void {
    this.forBound?.removeEventListener('k3-clear', this.onForCleared);
    this.forBound = null;
  }

  private forEl(): HTMLElement | null {
    return resolveIdRef(this, this.for);
  }

  private findAnchor(): HTMLElement | null {
    if (!this.id) return null;
    return (
      document
        .querySelector<HTMLElement>(`[for="${this.id}"]`)
        ?.closest(TOGGLE_HOST_SELECTOR) ?? null
    );
  }

  private readForValue(): TimeParts | null {
    const el = this.forEl();
    if (!el) return null;
    const v = (el as HTMLInputElement).value ?? el.getAttribute('value') ?? '';
    return parseTimeToParts(v);
  }

  private writeForValue(v: string): void {
    const el = this.forEl();
    if (!el) return;
    if ('value' in el) (el as HTMLInputElement).value = v;
    el.setAttribute('value', v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private bindDismiss(): void {
    this.unbindDismiss();
    /* Docked: host is the panel. Modal: host is full-viewport; “inside” = .surface
     * so scrim / outside pointerdown closes (popover ::backdrop is non-interactive). */
    queueMicrotask(() => {
      const inside =
        this.resolvedVariant === 'modal' ? (this.surfaceEl ?? this) : this;
      this._outsideDismiss = attachOutsideDismiss(inside, {
        isActive: () => this.open,
        ignoreNodes: () => [this.anchor, this.forEl()],
        onDismiss: (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          void this.hide(false);
        },
      });
    });
  }

  private unbindDismiss(): void {
    this._outsideDismiss?.detach();
    this._outsideDismiss = null;
  }

  private bindFitListeners(): void {
    this.dockedFit.bind();
  }

  private unbindFitListeners(): void {
    this.dockedFit.unbind();
  }

  private positionDocked(): void {
    if (this.resolvedVariant !== 'docked') return;
    const anchorEl = this.forEl() ?? this.anchor;
    if (anchorEl) applyDockedPosition(this, anchorEl);
  }

  // ── draft / selection ──────────────────────────────────────────────

  private setDraft(next: TimeDraft): void {
    this.draft = next;
    this.emit('k3-input', draftToDetail(next, this.showSeconds));
  }

  private commit(): void {
    const parts = draftToParts(this.draft);
    if (!parts) return;
    const detail = draftToDetail(this.draft, this.showSeconds);
    this.value = detail.value;
    this.writeForValue(detail.value);
    this.emit('k3-change', detail);
  }

  private setPeriod(p: TimePickerPeriod): void {
    this.setDraft({ ...this.draft, hour: applyPeriod(this.draft.hour, p) });
  }

  private onDialChange(
    e: CustomEvent<{ hour?: number; minute?: number; second?: number }>,
  ): void {
    e.stopPropagation();
    const d = e.detail;
    let hour = d.hour !== undefined ? d.hour : this.draft.hour;
    let minute = d.minute !== undefined ? d.minute : this.draft.minute;
    let second = d.second !== undefined ? d.second : this.draft.second;
    if (d.hour != null && minute == null) minute = 0;
    if (minute != null && this.minuteStep > 1) minute = snapToStep(minute, this.minuteStep);
    if (second != null && this.secondStep > 1) second = snapToStep(second, this.secondStep);
    this.setDraft({ hour, minute, second });
    if (d.hour != null) this.view = nextView(this.view, 'hour', this.showSeconds);
    else if (d.minute != null) this.view = nextView(this.view, 'minute', this.showSeconds);
  }

  /** Apply dial ↔ keyboard without motion (reduced motion / closed). */
  private applyUiMode(next: TimePickerUiMode): void {
    this.uiMode = next;
    this.editRaw = null;
    this.dataset.mode = next;
    this.removeAttribute('data-dial-entering');
    this.removeAttribute('data-dial-leaving');
    if (next === 'input') this.view = 'hour';
  }

  /** Panel that actually changes size — modal host is full-viewport. */
  private panelMorphEl(): HTMLElement {
    return this.resolvedVariant === 'modal' ? (this.surfaceEl ?? this) : this;
  }

  /**
   * Toggle dial ↔ keyboard while open (Noph TimePickerDialog `setMode`):
   * dial scales out/in + panel morphSize so the dialog does not jump.
   */
  private toggleMode(): void {
    void this.toggleModeAsync();
  }

  private async toggleModeAsync(): Promise<void> {
    const next: TimePickerUiMode = this.uiMode === 'dial' ? 'input' : 'dial';
    const animate = allowsExpressiveMotion();

    if (!animate || !this.open) {
      this.applyUiMode(next);
      await this.updateComplete;
      if (this.open && this.resolvedVariant === 'docked') this.positionDocked();
      if (next === 'input') this.focusActiveInput();
      return;
    }

    if (next === 'input') {
      // Dial → keyboard: scale dial out, then morph panel height.
      this.setAttribute('data-dial-leaving', '');
      await afterPaint();
      const dial = this.renderRoot.querySelector<HTMLElement>('.dial-host');
      if (dial && canWebAnimate(dial)) {
        const { duration, easing } = spatialFastTiming(this);
        if (duration > 0) {
          try {
            await dial
              .animate(
                [
                  { transform: 'scale(1)', opacity: 1 },
                  { transform: 'scale(0.8)', opacity: 0 },
                ],
                { duration, easing },
              )
              .finished;
          } catch {
            /* cancelled */
          }
        }
      }
      await morphSize(this.panelMorphEl(), async () => {
        this.applyUiMode('input');
        await this.updateComplete;
      });
      if (this.resolvedVariant === 'docked') this.positionDocked();
      this.focusActiveInput();
      return;
    }

    // Keyboard → dial: morph panel with dial+actions staged hidden, then reveal
    // together (CSS spatial-fast on dial, effects-fast on .actions).
    await morphSize(this.panelMorphEl(), async () => {
      this.uiMode = 'dial';
      this.editRaw = null;
      this.dataset.mode = 'dial';
      this.setAttribute('data-dial-entering', '');
      this.removeAttribute('data-dial-leaving');
      await this.updateComplete;
    });
    await afterPaint();
    this.removeAttribute('data-dial-entering');
    void this.renderRoot.querySelector<HTMLElement>('.dial-host')?.offsetWidth;
    const { duration } = spatialFastTiming(this);
    if (duration > 0) {
      await new Promise<void>((r) => {
        window.setTimeout(r, duration);
      });
    }
    if (this.resolvedVariant === 'docked') this.positionDocked();
  }

  /** Focus the hour / minute / second `<input>` matching `view` (input mode). */
  private focusActiveInput(): void {
    if (this.uiMode !== 'input') return;
    const inputs = [...this.renderRoot.querySelectorAll<HTMLInputElement>('.field-input')];
    const idx = this.view === 'hour' ? 0 : this.view === 'minute' ? 1 : 2;
    const el = inputs[idx] ?? inputs[0];
    if (!el) return;
    el.focus();
    el.select?.();
  }

  private toggleFormat(): void {
    this.format = this.formatToggleTarget;
    this.dataset.format = this.format;
    this.editRaw = null;
  }

  private onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      void this.hide(false);
    }
  };

  private commitFieldRaw(part: TimePickerView, raw: string): void {
    if (!raw.length) return;
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    const fmt = this.clockFormat;
    if (part === 'hour') {
      if (fmt === '12') {
        if (n < 1 || n > 12) return;
        this.setDraft({ ...this.draft, hour: hour24FromDisplay(n, this.period, '12') });
      } else {
        if (n > 23) return;
        this.setDraft({ ...this.draft, hour: hour24FromDisplay(n, this.period, '24') });
      }
    } else if (part === 'minute') {
      if (n > 59) return;
      this.setDraft({ ...this.draft, minute: snapToStep(n, this.minuteStep) });
    } else {
      if (n > 59) return;
      this.setDraft({ ...this.draft, second: snapToStep(n, this.secondStep) });
    }
  }

  private onFieldInput(part: TimePickerView, e: Event): void {
    const el = e.target as HTMLInputElement;
    const raw = el.value.replace(/\D/g, '').slice(0, 2);
    this.editRaw = raw;
    el.value = raw;
    this.commitFieldRaw(part, raw);
    if (raw.length === 2) {
      this.editRaw = null;
      if (part === 'hour' || (part === 'minute' && this.showSeconds)) {
        this.view = nextView(this.view, part, this.showSeconds);
        void this.updateComplete.then(() => this.focusActiveInput());
      }
    }
  }

  private onFieldFocus(part: TimePickerView, e: Event): void {
    this.view = part;
    const el = e.target as HTMLInputElement;
    this.editRaw = el.value;
    queueMicrotask(() => el.select?.());
  }

  private onFieldBlur(part: TimePickerView, e: Event): void {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 2);
    this.commitFieldRaw(part, raw);
    this.editRaw = null;
  }

  // ── render ─────────────────────────────────────────────────────────

  private renderFieldControl(
    part: TimePickerView,
    value: number | null,
    label: string,
  ): TemplateResult {
    const selected = this.view === part;
    const text = formatSegment(value);
    if (this.uiMode === 'input') {
      const shown = selected && this.editRaw != null ? this.editRaw : text;
      return html`
        <div class="field">
          <input
            class="field-input k3-focus-ring"
            type="text"
            inputmode="numeric"
            maxlength="2"
            placeholder="––"
            .value=${shown}
            ?disabled=${this.disabled}
            aria-label=${label}
            @focus=${(e: Event) => this.onFieldFocus(part, e)}
            @blur=${(e: Event) => this.onFieldBlur(part, e)}
            @input=${(e: Event) => this.onFieldInput(part, e)}
          />
          <span class="field-label">${label}</span>
        </div>
      `;
    }
    return html`
      <div class="field">
        <button
          type="button"
          class="field-btn k3-focus-ring"
          role="radio"
          aria-checked=${selected ? 'true' : 'false'}
          aria-label=${label}
          ?disabled=${this.disabled}
          @click=${() => {
            this.view = part;
          }}
        >
          ${text || '––'}
        </button>
        <span class="field-label">${label}</span>
      </div>
    `;
  }

  private renderPeriod(): TemplateResult | typeof nothing {
    if (this.clockFormat !== '12') return nothing;
    const { am, pm } = periodLabels(i18n.locale);
    const hasHour = this.draft.hour != null;
    return html`
      <div class="period" role="radiogroup" aria-label=${i18n.t('timepicker.period')}>
        <button
          type="button"
          class="k3-focus-ring"
          role="radio"
          aria-checked=${hasHour && this.period === 'am' ? 'true' : 'false'}
          ?disabled=${this.disabled}
          @click=${() => this.setPeriod('am')}
        >
          ${am}
        </button>
        <button
          type="button"
          class="k3-focus-ring"
          role="radio"
          aria-checked=${hasHour && this.period === 'pm' ? 'true' : 'false'}
          ?disabled=${this.disabled}
          @click=${() => this.setPeriod('pm')}
        >
          ${pm}
        </button>
      </div>
    `;
  }

  private renderFields(): TemplateResult {
    const fmt = this.clockFormat;
    const periodUnder = this.uiMode === 'dial' && this.resolvedOrientation === 'horizontal';
    const dialFields = this.uiMode === 'dial';
    return html`
      <div class="fields-col">
        <div
          class="fields"
          role=${dialFields ? 'radiogroup' : nothing}
          aria-label=${dialFields ? i18n.t('timepicker.dialLabel') : nothing}
        >
          ${this.renderFieldControl(
            'hour',
            displayHour(this.draft.hour, fmt),
            this.hourLabel || i18n.t('timepicker.hour'),
          )}
          <span class="sep" aria-hidden="true">:</span>
          ${this.renderFieldControl(
            'minute',
            this.draft.minute,
            this.minuteLabel || i18n.t('timepicker.minute'),
          )}
          ${this.showSeconds
            ? html`
                <span class="sep" aria-hidden="true">:</span>
                ${this.renderFieldControl(
                  'second',
                  this.draft.second,
                  this.secondLabel || i18n.t('timepicker.second'),
                )}
              `
            : nothing}
          ${periodUnder ? nothing : this.renderPeriod()}
        </div>
        ${periodUnder ? this.renderPeriod() : nothing}
      </div>
    `;
  }

  private renderActions(): TemplateResult {
    const fmtTarget = this.formatToggleTarget;
    const fmtLabel =
      fmtTarget === '12' ? i18n.t('timepicker.useFormat12') : i18n.t('timepicker.useFormat24');
    return html`
      <div class="actions">
        ${this.hideModeToggle
          ? nothing
          : html`
              <button
                type="button"
                class="ms-btn k3-focus-ring"
                aria-label=${this.uiMode === 'dial'
                  ? i18n.t('timepicker.toggleKeyboard')
                  : i18n.t('timepicker.toggleDial')}
                ?disabled=${this.disabled}
                @click=${() => this.toggleMode()}
              >
                <span
                  class="ms notranslate"
                  translate="no"
                  lang="zxx"
                  data-k3-icon=${this.uiMode === 'dial' ? 'keyboard' : 'schedule'}
                  aria-hidden="true"
                ></span>
              </button>
            `}
        ${this.hideFormatToggle
          ? nothing
          : html`
              <button
                type="button"
                class="ms-btn fmt-btn k3-focus-ring"
                aria-label=${fmtLabel}
                title=${fmtLabel}
                ?disabled=${this.disabled}
                @click=${() => this.toggleFormat()}
              >
                <span class="fmt-label" aria-hidden="true">${fmtTarget}</span>
              </button>
            `}
        <span class="spacer"></span>
        <k3-button variant="text" @k3-click=${() => void this.hide(false)}>
          ${this.dismissLabel || i18n.t('timepicker.cancel')}
        </k3-button>
        <k3-button
          variant="text"
          ?disabled=${!this.canConfirm || this.disabled}
          @k3-click=${() => void this.hide(true)}
        >
          ${this.confirmLabel || i18n.t('timepicker.ok')}
        </k3-button>
      </div>
    `;
  }

  override render() {
    const headline =
      this.uiMode === 'input'
        ? this.inputLabel || i18n.t('timepicker.inputLabel')
        : this.dialLabel || i18n.t('timepicker.dialLabel');
    return html`
      <div class="scrim" @click=${() => void this.hide(false)}></div>
      <div
        id=${this.surfaceId}
        class="surface"
        part="surface"
        @keydown=${this.onKeydown}
      >
        <div
          class="surface-scroll${this.resolvedVariant === 'modal' ? ' k3-scroll' : ''}"
        >
          <div class="surface-inner">
            <p class="headline" id="${this.surfaceId}-title">${headline}</p>
            <div class="body">
              ${this.renderFields()}
              <div class="dial-host">
                <k3-time-picker-dial
                  .view=${this.view}
                  .format=${this.clockFormat}
                  .hour=${this.draft.hour}
                  .minute=${this.draft.minute}
                  .second=${this.draft.second}
                  .period=${this.period}
                  ?show-seconds=${this.showSeconds}
                  .minuteStep=${this.minuteStep}
                  .secondStep=${this.secondStep}
                  .minParts=${this.minParts}
                  .maxParts=${this.maxParts}
                  .blackoutTimes=${this.blackoutTimes}
                  @k3-change=${this.onDialChange}
                ></k3-time-picker-dial>
              </div>
            </div>
            ${this.renderActions()}
          </div>
        </div>
      </div>
    `;
  }
}

export default K3TimePicker;
export type {
  TimePickerVariant,
  TimePickerMode,
  TimePickerOrientation,
  TimePickerFormat,
  TimePickerView,
  TimePickerPeriod,
  TimeParts,
  BlackoutTimesFn,
  TimePickerValueDetail,
} from './time-picker.types.js';

if (!customElements.get('k3-time-picker')) {
  customElements.define('k3-time-picker', K3TimePicker);
}
