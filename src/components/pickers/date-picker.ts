import { html, nothing, type PropertyValues } from 'lit';
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
import { datePickerStyles } from './date-picker.styles.js';
import {
  closePopoverLayer,
  openPopoverLayer,
  supportsPopoverApi,
} from './time-picker.open.js';
import { applyDockedPosition } from './time-picker.position.js';
import K3Calendar from './calendar.js';
import K3Button from '../actions/button.js';
import type {
  BlackoutDatesFn,
  CalendarLayout,
  CalendarView,
  CivilDate,
  DatePickerResolvedVariant,
  DatePickerVariant,
  SpecialDatesFn,
} from './calendar.types.js';
import {
  civilToValue,
  extractSingleIsoDate,
  formatHeadline,
  formatLocaleInputDate,
  formatRangeFieldValue,
  formatRangeHeadline,
  localeDatePlaceholder,
  parseCivilDate,
  parseLocaleInputDate,
  parseRangeFieldValue,
} from './calendar.utils.js';
import { TOGGLE_HOST_SELECTOR, syncTriggerAria } from './time-picker.utils.js';
import type K3TextField from '../inputs/text-field.js';

if (!customElements.get('k3-calendar')) {
  customElements.define('k3-calendar', K3Calendar);
}
if (!customElements.get('k3-button')) {
  customElements.define('k3-button', K3Button);
}

type DateUiMode = 'calendar' | 'input';

/**
 * Material 3 Expressive date picker — docked or modal surface wrapping `k3-calendar`.
 *
 * **Range** (Noph `DateRangePicker` model): always modal; months scroll continuously;
 * first tap = start, second = end. Wire either one field (`for` → Du/Au) or two
 * (`for-start` / `for-end` → one ISO each). Both open the same picker.
 *
 * @see https://m3.material.io/components/date-pickers
 * @see https://noph.dev/components/date-picker
 *
 * @fires k3-input — draft changes
 * @fires k3-change — confirmed with OK
 * @fires k3-open-start / k3-open-end / k3-close-start / k3-close-end
 *
 * @example
 * ```html
 * <k3-text-field id="d" label="Date"></k3-text-field>
 * <k3-date-picker id="dp" for="d" variant="docked"></k3-date-picker>
 * <!-- One field range -->
 * <k3-date-picker id="dpr" range for="range"></k3-date-picker>
 * <!-- Two fields range -->
 * <k3-date-picker id="dpl" range for-start="s" for-end="e"></k3-date-picker>
 * ```
 */
export class K3DatePicker extends K3Element {
  static override styles = [hostReset, focusRingStyles, edgeScrollbarStyles, datePickerStyles];

  @property() value = '';
  @property() for = '';
  /** Start-date field id — two-field range (one ISO each). */
  @property({ attribute: 'for-start' }) forStart = '';
  /** End-date field id — two-field range (one ISO each). */
  @property({ attribute: 'for-end' }) forEnd = '';
  @property({ reflect: true }) variant: DatePickerVariant = 'docked';
  @property({ attribute: 'start-view', reflect: true }) startView: CalendarView = 'month';
  @property({ attribute: 'start-at' }) startAt = '';
  @property({ attribute: 'min-date' }) minDate = '';
  @property({ attribute: 'max-date' }) maxDate = '';
  @property({ type: Boolean, reflect: true }) range = false;
  @property({ attribute: 'range-start' }) rangeStart = '';
  @property({ attribute: 'range-end' }) rangeEnd = '';
  /**
   * Calendar layout — `auto` scrolls when `range` (Noph); `paged` = side-by-side;
   * `scroll` = vertical list.
   */
  @property({ reflect: true }) layout: CalendarLayout = 'auto';
  /** Visible month panes (`paged`) or scroll viewport hint (`scroll` / range). */
  @property({ type: Number, reflect: true }) months = 1;
  @property({ type: Boolean, reflect: true }) clearable = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  /** Modal: show calendar ↔ text-field toggle (Noph `modeToggle`). */
  @property({ type: Boolean, attribute: 'mode-toggle', reflect: true }) modeToggle = true;
  @property({ attribute: 'confirm-label' }) confirmLabel = '';
  @property({ attribute: 'dismiss-label' }) dismissLabel = '';
  @property({ attribute: 'clear-label' }) clearLabel = '';
  @property() label = '';

  blackoutDates: BlackoutDatesFn | null = null;
  specialDates: SpecialDatesFn | null = null;

  @property({ type: Boolean, reflect: true }) open = false;

  readonly surfaceId = `k3-dp-surface-${Math.random().toString(36).slice(2, 9)}`;

  @state() private draft = '';
  @state() private draftRangeStart = '';
  @state() private draftRangeEnd = '';
  @state() private resolvedVariant: DatePickerResolvedVariant = 'docked';
  @state() private compact = true;
  /** Modal only — calendar grid vs typed fields. */
  @state() private uiMode: DateUiMode = 'calendar';
  @state() private inputDraft = '';
  @state() private inputRangeStart = '';
  @state() private inputRangeEnd = '';
  /** Seeded once per open — avoids rebinding startAt on every range tap (scroll jump). */
  @state() private calStartAt = '';

  @query('.surface') private surfaceEl!: HTMLElement;
  @query('k3-calendar') private calendarEl?: K3Calendar;

  private trap = new FocusTrap();
  private portal = new LayerPortal();
  private mq?: MediaQueryList;
  private anchor: HTMLElement | null = null;
  private readonly dockedFit: DockedFitController = attachDockedFit({
    isActive: () => this.open && this.resolvedVariant === 'docked',
    onReposition: () => this.positionDocked(),
    observe: () => this,
  });
  private _outsideDismiss: OutsideDismissController | null = null;

  /** Two linked fields (`for-start` / `for-end`) vs one combined `for`. */
  private get isDualRangeFields(): boolean {
    return this.range && !!(this.forStart || this.forEnd);
  }

  private get canConfirm(): boolean {
    if (this.range) {
      if (this.uiMode === 'input') {
        const s = parseLocaleInputDate(this.inputRangeStart, i18n.locale);
        const e = parseLocaleInputDate(this.inputRangeEnd, i18n.locale);
        return !!(s && e);
      }
      return !!(this.draftRangeStart && this.draftRangeEnd);
    }
    if (this.uiMode === 'input') {
      return !!parseLocaleInputDate(this.inputDraft, i18n.locale);
    }
    return !!parseCivilDate(this.draft);
  }

  private get calendarMonths(): number {
    return Math.min(6, Math.max(1, Math.floor(this.months) || 1));
  }

  private get showModeToggle(): boolean {
    return this.modeToggle && this.resolvedVariant === 'modal';
  }

  private get headlineText(): string {
    return (
      formatHeadline(parseCivilDate(this.draft), i18n.locale) ||
      i18n.t('datepicker.selectDate')
    );
  }

  /** Compact range with 4-digit years: `24 nov. 2026 – 27 nov. 2026`. */
  private get rangeHeadlineText(): string {
    return formatRangeHeadline(
      parseCivilDate(this.draftRangeStart),
      parseCivilDate(this.draftRangeEnd),
      i18n.locale,
    );
  }

  private get datePlaceholder(): string {
    return localeDatePlaceholder(i18n.locale);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'dialog');
    this.setAttribute('aria-labelledby', `${this.surfaceId}-title`);
    if (!this.hasAttribute('popover')) this.setAttribute('popover', 'manual');
    this.mq = window.matchMedia(SURFACE_COMPACT_MQ);
    this.compact = this.mq.matches;
    this.mq.addEventListener('change', this.onMq);
    this.resolveLayout(); /* sets aria-modal via syncResolvedSurface */
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
    if (changed.has('variant') || changed.has('range')) this.resolveLayout();
    if (changed.has('for') || changed.has('forStart') || changed.has('forEnd')) {
      this.bindForField();
    }
    if (changed.has('value') && !this.open) this.draft = this.value;
    if (
      (changed.has('rangeStart') || changed.has('rangeEnd')) &&
      !this.open
    ) {
      this.draftRangeStart = this.rangeStart;
      this.draftRangeEnd = this.rangeEnd;
    }
    if (changed.has('open') || changed.has('disabled') || changed.has('id')) {
      this.syncToggleAria();
    }
  }

  /**
   * @param anchor — docked positioning host (ignored for range / modal)
   */
  async show(anchor?: HTMLElement | null): Promise<boolean> {
    if (this.open || this.disabled) return false;
    this.anchor = anchor ?? this.findAnchor();
    this.seedFromFields();
    this.calStartAt = this.startAt || this.draft || this.draftRangeStart;
    this.uiMode = 'calendar';
    this.seedInputFromDraft();
    this.resolveLayout();
    if (overlayStack.wouldOpenBeside(this, this.anchor ?? this.primaryFieldEl())) {
      return false;
    }

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
        this.calendarEl?.resetActiveView();
        this.calendarEl?.focusActiveCell();
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

  private onMq = (e: MediaQueryListEvent): void => {
    this.compact = e.matches;
    this.resolveLayout();
  };

  /**
   * Range is always modal (Noph DateRangePicker). Single date honors `variant`
   * (`auto` → modal under 600dp). Syncs `data-resolved-variant` + `aria-modal`.
   */
  private resolveLayout(): void {
    this.resolvedVariant = this.range
      ? 'modal'
      : resolveSurfaceVariant(this.variant, this.compact);
    syncResolvedSurface(this, this.resolvedVariant);
    if (this.open && this.resolvedVariant === 'docked') {
      queueMicrotask(() => this.positionDocked());
    }
  }

  private primaryFieldEl(): HTMLElement | null {
    return this.forEl() ?? this.forStartEl() ?? this.forEndEl();
  }

  private syncToggleAria(): void {
    if (!this.id) return;
    document.querySelectorAll(`k3-date-picker-toggle[for="${this.id}"]`).forEach((toggle) => {
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
    this.rangeStart = '';
    this.rangeEnd = '';
    if (!this.open) {
      this.draft = '';
      this.draftRangeStart = '';
      this.draftRangeEnd = '';
    }
    this.writeRangeFields('', '');
  };

  private boundClearHosts: HTMLElement[] = [];

  private bindForField(): void {
    this.unbindForField();
    const hosts = [this.forEl(), this.forStartEl(), this.forEndEl()].filter(
      (el): el is HTMLElement => !!el,
    );
    this.boundClearHosts = hosts;
    for (const el of hosts) el.addEventListener('k3-clear', this.onForCleared);
  }

  private unbindForField(): void {
    for (const el of this.boundClearHosts) {
      el.removeEventListener('k3-clear', this.onForCleared);
    }
    this.boundClearHosts = [];
  }

  private forEl(): HTMLElement | null {
    return resolveIdRef(this, this.for);
  }

  private forStartEl(): HTMLElement | null {
    return resolveIdRef(this, this.forStart);
  }

  private forEndEl(): HTMLElement | null {
    return resolveIdRef(this, this.forEnd);
  }

  private findAnchor(): HTMLElement | null {
    if (!this.id) return null;
    return (
      document
        .querySelector<HTMLElement>(`[for="${this.id}"]`)
        ?.closest(TOGGLE_HOST_SELECTOR) ?? null
    );
  }

  private fieldValue(el: HTMLElement | null): string {
    if (!el) return '';
    return (el as HTMLInputElement).value ?? el.getAttribute('value') ?? '';
  }

  private setFieldValue(el: HTMLElement | null, v: string): void {
    if (!el) return;
    /* Lit CE (`k3-text-field`) + native input/textarea */
    (el as HTMLInputElement).value = v;
    el.setAttribute('value', v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private seedInputFromDraft(): void {
    const loc = i18n.locale;
    const d = parseCivilDate(this.draft);
    this.inputDraft = d ? formatLocaleInputDate(d, loc) : '';
    const s = parseCivilDate(this.draftRangeStart);
    const e = parseCivilDate(this.draftRangeEnd);
    this.inputRangeStart = s ? formatLocaleInputDate(s, loc) : '';
    this.inputRangeEnd = e ? formatLocaleInputDate(e, loc) : '';
  }

  /** Apply typed modal fields into draft ISO values (before confirm). */
  private syncDraftFromInput(): boolean {
    if (this.range) {
      const s = parseLocaleInputDate(this.inputRangeStart, i18n.locale);
      const e = parseLocaleInputDate(this.inputRangeEnd, i18n.locale);
      if (!s || !e) return false;
      this.draftRangeStart = civilToValue(s);
      this.draftRangeEnd = civilToValue(e);
      this.draft = this.draftRangeStart;
      return true;
    }
    const d = parseLocaleInputDate(this.inputDraft, i18n.locale);
    if (!d) return false;
    this.draft = civilToValue(d);
    return true;
  }

  private toggleUiMode(): void {
    if (this.uiMode === 'calendar') {
      this.seedInputFromDraft();
      this.uiMode = 'input';
    } else {
      this.syncDraftFromInput();
      this.uiMode = 'calendar';
    }
  }

  private onInputField = (e: Event, which: 'single' | 'start' | 'end'): void => {
    const v = (e.target as K3TextField | HTMLInputElement).value ?? '';
    if (which === 'single') this.inputDraft = v;
    else if (which === 'start') this.inputRangeStart = v;
    else this.inputRangeEnd = v;
    this.requestUpdate();
  };

  private seedFromFields(): void {
    if (!this.range) {
      const seeded = this.for
        ? this.fieldValue(this.forEl())
        : this.value || this.fieldValue(this.forEl());
      this.draft = seeded || this.value;
      this.draftRangeStart = '';
      this.draftRangeEnd = '';
      return;
    }

    if (this.isDualRangeFields) {
      /* Two fields → one ISO each (sanitize polluted Du/Au strings). */
      this.draftRangeStart =
        extractSingleIsoDate(this.fieldValue(this.forStartEl())) ||
        extractSingleIsoDate(this.rangeStart);
      this.draftRangeEnd =
        extractSingleIsoDate(this.fieldValue(this.forEndEl())) ||
        extractSingleIsoDate(this.rangeEnd);
    } else {
      /* One field → parse Du/Au (or `start – end`) plus props. */
      const seeded = this.for ? this.fieldValue(this.forEl()) : '';
      if (seeded) {
        const { start, end } = parseRangeFieldValue(seeded);
        this.draftRangeStart =
          extractSingleIsoDate(start) || extractSingleIsoDate(this.rangeStart);
        this.draftRangeEnd =
          extractSingleIsoDate(end) || extractSingleIsoDate(this.rangeEnd);
      } else {
        this.draftRangeStart = extractSingleIsoDate(this.rangeStart);
        this.draftRangeEnd = extractSingleIsoDate(this.rangeEnd);
      }
    }
    this.draft = this.draftRangeStart || this.value;
  }

  private writeRangeFields(start: string, end: string): void {
    const a = extractSingleIsoDate(start);
    const b = extractSingleIsoDate(end);
    if (this.isDualRangeFields) {
      this.setFieldValue(this.forStartEl(), a);
      this.setFieldValue(this.forEndEl(), b);
      return;
    }
    if (!this.for) return;
    this.setFieldValue(this.forEl(), formatRangeFieldValue(a, b));
  }

  private writeForValue(v: string): void {
    this.setFieldValue(this.forEl(), v);
  }

  private detail() {
    return {
      value: this.draft,
      date: parseCivilDate(this.draft),
      rangeStart: this.draftRangeStart,
      rangeEnd: this.draftRangeEnd,
    };
  }

  private commit(): void {
    if (this.uiMode === 'input' && !this.syncDraftFromInput()) return;
    if (!this.canConfirm) return;
    this.value = this.draft;
    this.rangeStart = this.draftRangeStart;
    this.rangeEnd = this.draftRangeEnd;
    if (this.range) {
      this.writeRangeFields(this.draftRangeStart, this.draftRangeEnd);
    } else {
      this.writeForValue(this.draft);
    }
    this.emit('k3-change', this.detail());
  }

  private clearAndClose(): void {
    this.draft = '';
    this.draftRangeStart = '';
    this.draftRangeEnd = '';
    this.inputDraft = '';
    this.inputRangeStart = '';
    this.inputRangeEnd = '';
    this.value = '';
    this.rangeStart = '';
    this.rangeEnd = '';
    if (this.range) this.writeRangeFields('', '');
    else this.writeForValue('');
    this.emit('k3-change', this.detail());
    void this.hide(false);
  }

  private onCalChange = (
    e: CustomEvent<{
      value: string;
      date: CivilDate | null;
      rangeStart: string;
      rangeEnd: string;
    }>,
  ): void => {
    e.stopPropagation();
    this.draft = e.detail.value;
    this.draftRangeStart = e.detail.rangeStart;
    this.draftRangeEnd = e.detail.rangeEnd;
    this.seedInputFromDraft();
    this.emit('k3-input', this.detail());
    /* Docked single-date: commit on select (M3 docked). Range always modal + OK. */
    if (this.resolvedVariant === 'docked' && !this.range && e.detail.date) {
      void this.hide(true);
    }
  };

  private bindDismiss(): void {
    this.unbindDismiss();
    /* Docked: host is the panel. Modal: host is full-viewport; “inside” = .surface
     * so scrim / outside pointerdown closes (popover ::backdrop is non-interactive). */
    queueMicrotask(() => {
      const inside =
        this.resolvedVariant === 'modal' ? (this.surfaceEl ?? this) : this;
      this._outsideDismiss = attachOutsideDismiss(inside, {
        isActive: () => this.open,
        ignoreNodes: () => [
          this.anchor,
          this.forEl(),
          this.forStartEl(),
          this.forEndEl(),
        ],
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
    const anchorEl = this.primaryFieldEl() ?? this.anchor;
    if (anchorEl) applyDockedPosition(this, anchorEl);
  }

  private onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      void this.hide(false);
    }
  };

  private renderModeToggle(): unknown {
    if (!this.showModeToggle) return nothing;
    const toInput = this.uiMode === 'calendar';
    return html`
      <button
        type="button"
        class="ms-btn k3-focus-ring"
        aria-label=${toInput
          ? i18n.t('datepicker.toggleInput')
          : i18n.t('datepicker.toggleCalendar')}
        ?disabled=${this.disabled}
        @click=${() => this.toggleUiMode()}
      >
        <span
          class="ms notranslate"
          translate="no"
          lang="zxx"
          data-k3-icon=${toInput ? 'edit_calendar' : 'calendar_today'}
          aria-hidden="true"
        ></span>
      </button>
    `;
  }

  private renderInputBody(): unknown {
    const ph = this.datePlaceholder;
    if (this.range) {
      return html`
        <div class="input-host input-host--range">
          <k3-text-field
            variant="outlined"
            label=${i18n.t('datepicker.startDate')}
            supporting-text=${ph}
            .value=${this.inputRangeStart}
            @input=${(e: Event) => this.onInputField(e, 'start')}
          ></k3-text-field>
          <k3-text-field
            variant="outlined"
            label=${i18n.t('datepicker.endDate')}
            supporting-text=${ph}
            .value=${this.inputRangeEnd}
            @input=${(e: Event) => this.onInputField(e, 'end')}
          ></k3-text-field>
        </div>
      `;
    }
    return html`
      <div class="input-host">
        <k3-text-field
          variant="outlined"
          label=${i18n.t('datepicker.date')}
          supporting-text=${ph}
          .value=${this.inputDraft}
          @input=${(e: Event) => this.onInputField(e, 'single')}
        ></k3-text-field>
      </div>
    `;
  }

  private renderCalendarBody(): unknown {
    return html`
      <div class="cal-host">
        <k3-calendar
          .value=${this.draft}
          .range=${this.range}
          .rangeStart=${this.draftRangeStart}
          .rangeEnd=${this.draftRangeEnd}
          .minDate=${this.minDate}
          .maxDate=${this.maxDate}
          .startAt=${this.calStartAt}
          .startView=${this.startView}
          .layout=${this.layout}
          .months=${this.calendarMonths}
          selection-target="auto"
          .blackoutDates=${this.blackoutDates}
          .specialDates=${this.specialDates}
          @k3-change=${this.onCalChange}
        ></k3-calendar>
      </div>
    `;
  }

  private renderActions(): unknown {
    return html`
      <div class="actions">
        ${this.clearable
          ? html`
              <k3-button variant="text" @k3-click=${() => this.clearAndClose()}>
                ${this.clearLabel || i18n.t('datepicker.clear')}
              </k3-button>
            `
          : nothing}
        <span class="spacer"></span>
        <k3-button variant="text" @k3-click=${() => void this.hide(false)}>
          ${this.dismissLabel || i18n.t('datepicker.cancel')}
        </k3-button>
        <k3-button
          variant="text"
          ?disabled=${!this.canConfirm}
          @k3-click=${() => void this.hide(true)}
        >
          ${this.confirmLabel || i18n.t('datepicker.ok')}
        </k3-button>
      </div>
    `;
  }

  override render() {
    const title =
      this.label ||
      (this.range ? i18n.t('datepicker.selectRange') : i18n.t('datepicker.selectDate'));
    const supporting = this.range ? this.rangeHeadlineText : this.headlineText;
    const modal = this.resolvedVariant === 'modal';
    const body = this.uiMode === 'input' ? this.renderInputBody() : this.renderCalendarBody();
    /*
     * Modal: head + foot fixed; body scrolls on edge-sticky k3-scroll
     * (same gutter as timepicker — never a nested UA bar inside the calendar).
     */
    if (modal) {
      return html`
        <div class="scrim" @click=${() => void this.hide(false)}></div>
        <div
          id=${this.surfaceId}
          class="surface"
          part="surface"
          data-ui-mode=${this.uiMode}
          @keydown=${this.onKeydown}
        >
          <div class="surface-head">
            <div class="modal-head">
              <div class="modal-head-text">
                <p class="headline" id="${this.surfaceId}-title">${title}</p>
                <p class="supporting" aria-live="polite">${supporting || '–'}</p>
              </div>
              ${this.renderModeToggle()}
            </div>
            <div class="divider" aria-hidden="true"></div>
          </div>
          <div class="surface-scroll k3-scroll">
            <div class="surface-scroll-inner">${body}</div>
          </div>
          <div class="surface-foot">${this.renderActions()}</div>
        </div>
      `;
    }
    return html`
      <div class="scrim" @click=${() => void this.hide(false)}></div>
      <div
        id=${this.surfaceId}
        class="surface"
        part="surface"
        data-ui-mode=${this.uiMode}
        @keydown=${this.onKeydown}
      >
        <div class="surface-scroll">
          <div class="surface-inner">
            <div class="modal-head">
              <div class="modal-head-text">
                <p class="headline" id="${this.surfaceId}-title">${title}</p>
                <p class="supporting" aria-live="polite">${supporting || '–'}</p>
              </div>
              ${this.renderModeToggle()}
            </div>
            <div class="divider" aria-hidden="true"></div>
            ${body}
            ${this.renderActions()}
          </div>
        </div>
      </div>
    `;
  }
}

export default K3DatePicker;
export type {
  DatePickerVariant,
  CalendarView,
  CalendarLayout,
  CivilDate,
  BlackoutDatesFn,
  SpecialDatesFn,
} from './calendar.types.js';
export { K3Calendar } from './calendar.js';

if (!customElements.get('k3-date-picker')) {
  customElements.define('k3-date-picker', K3DatePicker);
}
