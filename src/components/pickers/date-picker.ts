import { html, nothing, type PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import {
  K3Element,
  runOpenClose,
  afterPaint,
  FocusTrap,
  LayerPortal,
  prefersReducedMotion,
  focusRingStyles,
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
  CalendarSelectionTarget,
  CalendarView,
  CivilDate,
  DatePickerResolvedVariant,
  DatePickerVariant,
  SpecialDatesFn,
} from './calendar.types.js';
import {
  extractSingleIsoDate,
  formatHeadline,
  formatRangeFieldValue,
  parseCivilDate,
  parseRangeFieldValue,
} from './calendar.utils.js';
import { TOGGLE_HOST_SELECTOR, syncTriggerAria } from './time-picker.utils.js';

if (!customElements.get('k3-calendar')) {
  customElements.define('k3-calendar', K3Calendar);
}
if (!customElements.get('k3-button')) {
  customElements.define('k3-button', K3Button);
}

/**
 * Material 3 Expressive date picker — docked or modal surface wrapping `k3-calendar`.
 * Adapted from M3E `m3e-datepicker` (Matraic) for K3ui.
 *
 * @see https://m3.material.io/components/date-pickers
 * @see https://matraic.github.io/m3e/components/datepicker.html
 *
 * @fires k3-input — draft changes
 * @fires k3-change — confirmed with OK
 * @fires k3-open-start / k3-open-end / k3-close-start / k3-close-end
 *
 * @example
 * ```html
 * <k3-text-field id="d" label="Date"></k3-text-field>
 * <k3-icon-button label="Open">
 *   <span class="ms" data-k3-icon="calendar_today"></span>
 *   <k3-date-picker-toggle for="dp"></k3-date-picker-toggle>
 * </k3-icon-button>
 * <k3-date-picker id="dp" for="d" variant="auto"></k3-date-picker>
 * <!-- Short range — 2-month panes + one wide field -->
 * <k3-date-picker id="dpr" range months="2" for="range"></k3-date-picker>
 * <!-- Long range — 1 month + dual fields (toggle edge=start|end) -->
 * <k3-date-picker id="dpl" range months="1" for-start="s" for-end="e"></k3-date-picker>
 * ```
 */
export class K3DatePicker extends K3Element {
  static override styles = [hostReset, focusRingStyles, datePickerStyles];

  @property() value = '';
  @property() for = '';
  /** Start-date field id (long range) — M3 dual text fields. */
  @property({ attribute: 'for-start' }) forStart = '';
  /** End-date field id (long range) — M3 dual text fields. */
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
   * Calendar layout — `auto`/`paged` = side-by-side panes; `scroll` = vertical list.
   * @see https://m3.material.io/components/date-pickers/guidelines
   */
  @property({ reflect: true }) layout: CalendarLayout = 'auto';
  /**
   * Visible month panes. Short range → 2 + single `for` field.
   * Long range → 1 + `for-start` / `for-end`.
   */
  @property({ type: Number, reflect: true }) months = 1;
  @property({ type: Boolean, reflect: true }) clearable = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
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
  /** Which range end the open session targets (dual-field toggles). */
  @state() private selectionTarget: CalendarSelectionTarget = 'auto';

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

  /** Long range: Start/End fields (each toggle sets `selectionTarget`). */
  private get isDualRangeFields(): boolean {
    return this.range && !!(this.forStart || this.forEnd);
  }

  private get canConfirm(): boolean {
    if (this.range) {
      /* Dual fields: OK after the targeted end is set (M3 Start/End). */
      if (this.isDualRangeFields) {
        if (this.selectionTarget === 'start') return !!this.draftRangeStart;
        if (this.selectionTarget === 'end') return !!this.draftRangeEnd;
      }
      return !!(this.draftRangeStart && this.draftRangeEnd);
    }
    return !!parseCivilDate(this.draft);
  }

  /** Dual fields → 1 month; single `for` range → 2 months (unless months set higher). */
  private get calendarMonths(): number {
    const n = Math.min(6, Math.max(1, Math.floor(this.months) || 1));
    if (!this.range) return n;
    if (this.forStart || this.forEnd) return n; /* long range: respect months (typ. 1) */
    return Math.max(2, n); /* short range: at least 2 panes */
  }

  private get headlineText(): string {
    return (
      formatHeadline(parseCivilDate(this.draft), i18n.locale) ||
      i18n.t('datepicker.selectDate')
    );
  }

  private rangeLine(iso: string): string {
    const d = parseCivilDate(iso);
    if (!d) return '–';
    const cross =
      !!this.draftRangeStart &&
      !!this.draftRangeEnd &&
      parseCivilDate(this.draftRangeStart)!.year !== parseCivilDate(this.draftRangeEnd)!.year;
    return formatHeadline(d, i18n.locale, { withYear: cross }) || iso;
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
    if (changed.has('variant')) this.resolveLayout();
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
   * @param anchor — docked positioning host
   * @param edge — dual-field range: open to edit start or end
   */
  async show(
    anchor?: HTMLElement | null,
    edge?: CalendarSelectionTarget | null,
  ): Promise<boolean> {
    if (this.open || this.disabled) return false;
    this.anchor = anchor ?? this.findAnchor();
    this.seedFromFields();
    this.selectionTarget =
      this.range && (edge === 'start' || edge === 'end') ? edge : 'auto';
    this.resolveLayout();

    return runOpenClose(
      this,
      'open',
      async () => {
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
        await afterPaint();
        this.positionDocked();
        this.trap.activate(this.surfaceEl ?? this);
        this.bindDismiss();
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
        const wait = prefersReducedMotion() ? 0 : 100;
        if (wait) await new Promise((r) => setTimeout(r, wait));
        closePopoverLayer(this);
        this.open = false;
        this.portal.restore(this);
        if (supportsPopoverApi(this) && !this.hasAttribute('popover')) {
          this.setAttribute('popover', 'manual');
        }
        this.removeAttribute('data-flip');
        this.style.removeProperty('--k3-tp-top');
        this.style.removeProperty('--k3-tp-left');
      },
      { source: 'api' },
    );
  }

  toggle(
    anchor?: HTMLElement | null,
    edge?: CalendarSelectionTarget | null,
  ): Promise<boolean> {
    if (this.disabled) return Promise.resolve(false);
    return this.open ? this.hide() : this.show(anchor, edge);
  }

  private onMq = (e: MediaQueryListEvent): void => {
    this.compact = e.matches;
    this.resolveLayout();
  };

  private resolveLayout(): void {
    this.resolvedVariant = resolveSurfaceVariant(this.variant, this.compact);
    syncResolvedSurface(this, this.resolvedVariant);
    if (this.open && this.resolvedVariant === 'docked') {
      queueMicrotask(() => this.positionDocked());
    }
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
    return this.for ? document.getElementById(this.for) : null;
  }

  private forStartEl(): HTMLElement | null {
    return this.forStart ? document.getElementById(this.forStart) : null;
  }

  private forEndEl(): HTMLElement | null {
    return this.forEnd ? document.getElementById(this.forEnd) : null;
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
    /* Two-line Du/Au needs a textarea — promote single-line k3-text-field if needed */
    if (v.includes('\n') && el.tagName.toLowerCase() === 'k3-text-field') {
      const tf = el as HTMLElement & { multiline?: boolean; rows?: number };
      tf.multiline = true;
      if (!tf.rows || tf.rows < 2) tf.rows = 2;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private seedFromFields(): void {
    if (this.range && (this.forStart || this.forEnd)) {
      /* Dual fields: exactly one ISO date each — never a combined range string */
      const s =
        extractSingleIsoDate(this.fieldValue(this.forStartEl())) ||
        extractSingleIsoDate(this.rangeStart);
      const e =
        extractSingleIsoDate(this.fieldValue(this.forEndEl())) ||
        extractSingleIsoDate(this.rangeEnd);
      this.draftRangeStart = s;
      this.draftRangeEnd = e;
      this.draft = s;
      return;
    }
    const seeded =
      this.for ? this.fieldValue(this.forEl()) : this.value || this.fieldValue(this.forEl());
    if (this.range && seeded) {
      const { start, end } = parseRangeFieldValue(seeded);
      this.draftRangeStart = extractSingleIsoDate(start) || this.rangeStart;
      this.draftRangeEnd = extractSingleIsoDate(end) || this.rangeEnd;
      this.draft = this.draftRangeStart || this.value;
      return;
    }
    this.draft = seeded || this.value;
    this.draftRangeStart = extractSingleIsoDate(this.rangeStart);
    this.draftRangeEnd = extractSingleIsoDate(this.rangeEnd);
  }

  private writeRangeFields(start: string, end: string): void {
    const a = extractSingleIsoDate(start);
    const b = extractSingleIsoDate(end);
    if (this.forStart || this.forEnd) {
      this.setFieldValue(this.forStartEl(), a);
      this.setFieldValue(this.forEndEl(), b);
      return;
    }
    this.setFieldValue(
      this.forEl(),
      formatRangeFieldValue(a, b, {
        from: i18n.t('datepicker.from'),
        to: i18n.t('datepicker.to'),
      }),
    );
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
    /* Live-sync single range field so Du + Au appear as soon as both ends exist */
    if (this.range && this.for && !this.forStart && !this.forEnd) {
      this.writeRangeFields(this.draftRangeStart, this.draftRangeEnd);
    }
    this.emit('k3-input', this.detail());
    /* Docked single-date: commit on select (M3 docked) */
    if (this.resolvedVariant === 'docked' && !this.range && e.detail.date) {
      void this.hide(true);
    }
  };

  private bindDismiss(): void {
    this.unbindDismiss();
    if (this.resolvedVariant !== 'docked') return;
    queueMicrotask(() => {
      this._outsideDismiss = attachOutsideDismiss(this, {
        isActive: () => this.open && this.resolvedVariant === 'docked',
        ignoreNodes: () => [
          this.anchor,
          this.forEl(),
          this.forStartEl(),
          this.forEndEl(),
        ],
        onDismiss: () => void this.hide(false),
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

  private onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      void this.hide(false);
    }
  };

  override render() {
    const title = this.label || i18n.t('datepicker.selectDate');
    return html`
      <div class="scrim" @click=${() => void this.hide(false)}></div>
      <div
        id=${this.surfaceId}
        class="surface"
        part="surface"
        @keydown=${this.onKeydown}
      >
        <p class="headline" id="${this.surfaceId}-title">${title}</p>
        ${this.range
          ? html`
              <div class="supporting" aria-live="polite">
                <span class="range-line"
                  ><span class="range-label">${i18n.t('datepicker.from')} :</span>
                  ${this.rangeLine(this.draftRangeStart)}</span
                >
                <span class="range-line"
                  ><span class="range-label">${i18n.t('datepicker.to')} :</span>
                  ${this.rangeLine(this.draftRangeEnd)}</span
                >
              </div>
            `
          : html`<p class="supporting">${this.headlineText}</p>`}
        <div class="divider" aria-hidden="true"></div>
        <div class="cal-host">
          <k3-calendar
            .value=${this.draft}
            .range=${this.range}
            .rangeStart=${this.draftRangeStart}
            .rangeEnd=${this.draftRangeEnd}
            .minDate=${this.minDate}
            .maxDate=${this.maxDate}
            .startAt=${this.startAt || this.draft || this.draftRangeStart}
            .startView=${this.startView}
            .layout=${this.layout}
            .months=${this.calendarMonths}
            .selectionTarget=${this.selectionTarget}
            .blackoutDates=${this.blackoutDates}
            .specialDates=${this.specialDates}
            @k3-change=${this.onCalChange}
          ></k3-calendar>
        </div>
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
