import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, focusRingStyles } from '../../core/index.js';
import { hostReset } from '../_shared.js';
import { i18n } from '../../i18n/index.js';
import { calendarStyles } from './calendar.styles.js';
import type {
  BlackoutDatesFn,
  CalendarLayout,
  CalendarSelectionTarget,
  CalendarView,
  CivilDate,
  SpecialDatesFn,
} from './calendar.types.js';
import {
  YEARS_PER_PAGE,
  addMonths,
  addYears,
  buildMonthGrid,
  clampCivil,
  compareCivil,
  daysInMonth,
  firstWeekday,
  formatFullDate,
  formatPeriodLabel,
  inRange,
  isDisabledCivil,
  isRangeEdge,
  monthLabels,
  monthSpan,
  monthsToCoverRange,
  multiYearPageStart,
  parseCivilDate,
  sameCivil,
  todayCivil,
  weekdayLabels,
  civilToValue,
} from './calendar.utils.js';

/** Default months preloaded when `layout="scroll"` (opt-in). */
const SCROLL_MONTHS_DEFAULT = 24;

/**
 * Material 3 calendar — month / year / multi-year.
 * Multi-month ranges use side-by-side panes (`months` ≥ 2, `layout` paged).
 * Vertical scroll is available via `layout="scroll"` when preferred.
 *
 * @see https://m3.material.io/components/date-pickers/guidelines
 * @see https://matraic.github.io/m3e/components/calendar.html
 *
 * @fires k3-change — `{ value, date, rangeStart, rangeEnd }`
 * @fires k3-view-change — `{ view }`
 */
export class K3Calendar extends K3Element {
  static override styles = [hostReset, focusRingStyles, calendarStyles];

  @property() value = '';
  @property({ attribute: 'start-at' }) startAt = '';
  @property({ attribute: 'min-date' }) minDate = '';
  @property({ attribute: 'max-date' }) maxDate = '';
  @property({ attribute: 'range-start' }) rangeStart = '';
  @property({ attribute: 'range-end' }) rangeEnd = '';
  @property({ type: Boolean, reflect: true }) range = false;
  /**
   * Range: which end the next day click edits.
   * `auto` = start then end; `start` / `end` = dual-field targeting.
   */
  @property({ attribute: 'selection-target', reflect: true })
  selectionTarget: CalendarSelectionTarget = 'auto';
  @property({ attribute: 'start-view', reflect: true }) startView: CalendarView = 'month';
  /**
   * How months are presented.
   * `auto` / `paged` → side-by-side panes (`months`).
   * `scroll` → vertical month list (opt-in).
   */
  @property({ reflect: true }) layout: CalendarLayout = 'auto';
  /**
   * Visible month panes in `paged` (side-by-side), or scroll viewport hint.
   * Clamped 1…6. Use 2 for short ranges; 1 for long dual-field ranges.
   */
  @property({ type: Number, reflect: true }) months = 1;
  /** Months preloaded in scroll layout (default 24). */
  @property({ type: Number, attribute: 'scroll-months' }) scrollMonths = SCROLL_MONTHS_DEFAULT;

  blackoutDates: BlackoutDatesFn | null = null;
  specialDates: SpecialDatesFn | null = null;

  @state() private view: CalendarView = 'month';
  @state() private active: CivilDate = todayCivil();
  @state() private selected: CivilDate | null = null;
  @state() private rStart: CivilDate | null = null;
  @state() private rEnd: CivilDate | null = null;

  private get min(): CivilDate | null {
    return parseCivilDate(this.minDate);
  }
  private get max(): CivilDate | null {
    return parseCivilDate(this.maxDate);
  }
  private get weekStart(): number {
    return firstWeekday(i18n.locale);
  }

  private get resolvedLayout(): 'paged' | 'scroll' {
    return this.layout === 'scroll' ? 'scroll' : 'paged';
  }

  private get paneCount(): number {
    return Math.min(6, Math.max(1, Math.floor(this.months) || 1));
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.syncFromProps(true);
    this.dataset.layout = this.resolvedLayout;
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (
      changed.has('value') ||
      changed.has('rangeStart') ||
      changed.has('rangeEnd') ||
      changed.has('range') ||
      changed.has('startAt') ||
      changed.has('startView')
    ) {
      this.syncFromProps(false);
    }
    if (changed.has('layout') || changed.has('range') || changed.has('months')) {
      this.dataset.layout = this.resolvedLayout;
    }
  }

  private syncFromProps(initial: boolean): void {
    this.selected = parseCivilDate(this.value);
    this.rStart = parseCivilDate(this.rangeStart);
    this.rEnd = parseCivilDate(this.rangeEnd);
    const start = parseCivilDate(this.startAt) ?? this.selected ?? this.rStart ?? todayCivil();
    this.active = clampCivil(start, this.min, this.max);
    if (initial || !this.view) this.view = this.startView || 'month';
  }

  resetActiveView(): void {
    this.view = this.startView || 'month';
  }

  focusActiveCell(): void {
    const el = this.renderRoot.querySelector<HTMLElement>(
      '.cell[tabindex="0"], .cell[aria-pressed="true"]',
    );
    el?.focus();
  }

  /** Scroll the range list so `active` month is in view. */
  private scrollActiveIntoView(): void {
    if (this.resolvedLayout !== 'scroll') return;
    queueMicrotask(() => {
      const pane = this.renderRoot.querySelector<HTMLElement>(
        `.month-pane[data-ym="${this.active.year}-${this.active.month}"]`,
      );
      pane?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  private emitChange(): void {
    this.emit('k3-change', {
      value: this.selected ? civilToValue(this.selected) : '',
      date: this.selected,
      rangeStart: this.rStart ? civilToValue(this.rStart) : '',
      rangeEnd: this.rEnd ? civilToValue(this.rEnd) : '',
    });
  }

  private setView(v: CalendarView): void {
    this.view = v;
    this.emit('k3-view-change', { view: v });
  }

  private togglePeriodMenu(): void {
    if (this.view === 'month') this.setView('year');
    else if (this.view === 'year') this.setView('multi-year');
    else this.setView('month');
  }

  /** Month-view step: one page of panes (multi-month) or one month. */
  private get monthStep(): number {
    return this.resolvedLayout === 'paged' ? this.paneCount : 1;
  }

  private get canPrev(): boolean {
    if (!this.min) return true;
    if (this.view === 'month') {
      const prev = addMonths(this.active, -this.monthStep);
      return (
        compareCivil({ year: prev.year, month: prev.month, day: daysEnd(prev) }, this.min) >= 0
      );
    }
    if (this.view === 'year') return this.active.year - 1 >= this.min.year;
    return multiYearPageStart(this.active.year) - YEARS_PER_PAGE >= multiYearPageStart(this.min.year);
  }

  private get canNext(): boolean {
    if (!this.max) return true;
    if (this.view === 'month') {
      const next = addMonths(this.active, this.monthStep);
      return compareCivil({ year: next.year, month: next.month, day: 1 }, this.max) <= 0;
    }
    if (this.view === 'year') return this.active.year + 1 <= this.max.year;
    return (
      multiYearPageStart(this.active.year) + YEARS_PER_PAGE <= multiYearPageStart(this.max.year)
    );
  }

  private movePrev(): void {
    if (!this.canPrev) return;
    if (this.view === 'month') this.active = addMonths(this.active, -this.monthStep);
    else if (this.view === 'year') this.active = addYears(this.active, -1);
    else this.active = addYears(this.active, -YEARS_PER_PAGE);
  }

  private moveNext(): void {
    if (!this.canNext) return;
    if (this.view === 'month') this.active = addMonths(this.active, this.monthStep);
    else if (this.view === 'year') this.active = addYears(this.active, 1);
    else this.active = addYears(this.active, YEARS_PER_PAGE);
  }

  /** True when `d`'s month is already shown in the current paged/scroll panes. */
  private isMonthVisible(d: CivilDate): boolean {
    if (this.resolvedLayout === 'scroll') {
      return true; /* list covers many months; scrollIntoView handles focus */
    }
    return monthSpan(this.active, this.paneCount).some(
      (p) => p.year === d.year && p.month === d.month,
    );
  }

  private applyRangeStart(d: CivilDate): void {
    this.rStart = d;
    if (this.rEnd && compareCivil(d, this.rEnd) > 0) this.rEnd = null;
    this.selected = d;
    this.rangeStart = civilToValue(d);
    this.rangeEnd = this.rEnd ? civilToValue(this.rEnd) : '';
    this.value = civilToValue(d);
  }

  private applyRangeEnd(d: CivilDate): void {
    if (!this.rStart || compareCivil(d, this.rStart) < 0) {
      this.applyRangeStart(d);
      return;
    }
    this.rEnd = d;
    this.selected = d;
    this.rangeEnd = civilToValue(d);
    this.value = civilToValue(d);
  }

  private selectDay(d: CivilDate): void {
    if (isDisabledCivil(d, this.min, this.max, this.blackoutDates)) return;
    if (this.range) {
      if (this.selectionTarget === 'start') {
        this.applyRangeStart(d);
      } else if (this.selectionTarget === 'end') {
        /* Dual End field: allow end without start (don't steal into start). */
        if (!this.rStart) {
          this.rEnd = d;
          this.selected = d;
          this.rangeStart = '';
          this.rangeEnd = civilToValue(d);
          this.value = civilToValue(d);
        } else {
          this.applyRangeEnd(d);
        }
      } else if (!this.rStart || (this.rStart && this.rEnd)) {
        this.applyRangeStart(d);
        this.rEnd = null;
        this.rangeEnd = '';
      } else if (compareCivil(d, this.rStart) < 0) {
        this.applyRangeStart(d);
        this.rEnd = null;
        this.rangeEnd = '';
      } else {
        this.applyRangeEnd(d);
      }
    } else {
      this.selected = d;
      this.value = civilToValue(d);
      this.rStart = null;
      this.rEnd = null;
    }
    /* Keep current multi-month page if the day is already visible (no jump to 3rd month). */
    if (!this.isMonthVisible(d)) {
      this.active = { year: d.year, month: d.month, day: 1 };
    }
    this.emitChange();
    this.scrollActiveIntoView();
  }

  private selectMonth(month: number): void {
    this.active = clampCivil(
      { year: this.active.year, month, day: 1 },
      this.min,
      this.max,
    );
    this.setView('month');
  }

  private selectYear(year: number): void {
    this.active = clampCivil(
      { year, month: this.active.month, day: 1 },
      this.min,
      this.max,
    );
    this.setView('year');
  }

  private navLabel(): string {
    if (this.view === 'month') return i18n.t('datepicker.prevMonth');
    if (this.view === 'year') return i18n.t('datepicker.prevYear');
    return i18n.t('datepicker.prevMultiYear');
  }

  private nextNavLabel(): string {
    if (this.view === 'month') return i18n.t('datepicker.nextMonth');
    if (this.view === 'year') return i18n.t('datepicker.nextYear');
    return i18n.t('datepicker.nextMultiYear');
  }

  private renderHeader(): TemplateResult {
    const label = formatPeriodLabel(
      this.resolvedLayout === 'scroll' && this.view === 'month' ? 'year' : this.view,
      this.active,
      i18n.locale,
    );
    const headerLabel =
      this.resolvedLayout === 'scroll' && this.view === 'month'
        ? String(this.active.year)
        : formatPeriodLabel(this.view, this.active, i18n.locale);
    return html`
      <div class="header">
        <button
          type="button"
          class="period-btn k3-focus-ring"
          aria-label=${label}
          @click=${() => this.togglePeriodMenu()}
        >
          <span>${headerLabel}</span>
          <span
            class="chev ms notranslate"
            translate="no"
            lang="zxx"
            data-k3-icon="arrow_drop_down"
            aria-hidden="true"
          ></span>
        </button>
        <div class="nav">
          <button
            type="button"
            class="nav-btn k3-focus-ring"
            aria-label=${this.navLabel()}
            ?disabled=${!this.canPrev}
            @click=${() => this.movePrev()}
          >
            <span
              class="ms notranslate"
              translate="no"
              lang="zxx"
              data-k3-icon="chevron_left"
              aria-hidden="true"
            ></span>
          </button>
          <button
            type="button"
            class="nav-btn k3-focus-ring"
            aria-label=${this.nextNavLabel()}
            ?disabled=${!this.canNext}
            @click=${() => this.moveNext()}
          >
            <span
              class="ms notranslate"
              translate="no"
              lang="zxx"
              data-k3-icon="chevron_right"
              aria-hidden="true"
            ></span>
          </button>
        </div>
      </div>
    `;
  }

  private renderWeekdays(): TemplateResult {
    const labels = weekdayLabels(i18n.locale, this.weekStart);
    return html`
      <div class="weekdays" aria-hidden="true">
        ${labels.map(
          (w) => html`
            <div class="weekday">
              <span aria-hidden="true">${w.short}</span>
              <span class="visually-hidden">${w.long}</span>
            </div>
          `,
        )}
      </div>
    `;
  }

  private renderDayCell(
    d: CivilDate,
    paneMonth: number,
    opts: { hideOutside: boolean },
  ): TemplateResult {
    const outside = d.month !== paneMonth;
    if (opts.hideOutside && outside) {
      return html`<div role="gridcell" class="day placeholder" aria-hidden="true"></div>`;
    }
    const today = todayCivil();
    const disabled = isDisabledCivil(d, this.min, this.max, this.blackoutDates);
    const selected = this.range
      ? !!isRangeEdge(d, this.rStart, this.rEnd)
      : sameCivil(d, this.selected);
    const edge = this.range ? isRangeEdge(d, this.rStart, this.rEnd) : null;
    const hasFullRange = !!(this.rStart && this.rEnd);
    const midRange =
      this.range && hasFullRange && inRange(d, this.rStart, this.rEnd) && !edge;
    const isToday = sameCivil(d, today);
    const special = !disabled && !!this.specialDates?.(d);
    const tab =
      selected ||
      (this.selected == null && !this.rStart && isToday && !outside);
    return html`
      <div
        role="gridcell"
        class=${classMap({
          day: true,
          'in-range': midRange,
          'range-start': hasFullRange && (edge === 'start' || edge === 'both'),
          'range-end': hasFullRange && (edge === 'end' || edge === 'both'),
        })}
      >
        <button
          type="button"
          class=${classMap({
            cell: true,
            'k3-focus-ring': true,
            outside,
            today: isToday,
            special,
          })}
          tabindex=${tab ? 0 : -1}
          aria-pressed=${selected ? 'true' : 'false'}
          aria-current=${isToday ? 'date' : nothing}
          aria-label=${formatFullDate(d, i18n.locale)}
          ?disabled=${disabled || outside}
          @click=${() => this.selectDay(d)}
        >
          <span aria-hidden="true">${d.day}</span>
        </button>
      </div>
    `;
  }

  private renderMonthPane(
    anchor: CivilDate,
    opts: { showSubhead: boolean; hideOutside: boolean },
  ): TemplateResult {
    const cells = buildMonthGrid(anchor.year, anchor.month, this.weekStart);
    const title = formatPeriodLabel('month', anchor, i18n.locale);
    return html`
      <section class="month-pane" data-ym="${anchor.year}-${anchor.month}">
        ${opts.showSubhead ? html`<h3 class="month-subhead">${title}</h3>` : nothing}
        ${this.renderWeekdays()}
        <div class="grid month" role="grid" aria-label=${title}>
          ${cells.map((d) => this.renderDayCell(d, anchor.month, opts))}
        </div>
      </section>
    `;
  }

  private renderPagedMonths(): TemplateResult {
    const panes = monthSpan(this.active, this.paneCount);
    if (panes.length === 1) {
      return this.renderMonthPane(panes[0]!, { showSubhead: false, hideOutside: false });
    }
    return html`
      <div class="months-row">
        ${panes.map((a) =>
          this.renderMonthPane(a, { showSubhead: true, hideOutside: true }),
        )}
      </div>
    `;
  }

  private renderScrollMonths(): TemplateResult {
    /* Cover selection range + buffer; at least scrollMonths / paneCount */
    const cover = monthsToCoverRange(this.rStart, this.rEnd, this.paneCount);
    const total = Math.max(
      this.scrollMonths || SCROLL_MONTHS_DEFAULT,
      cover + 2,
      this.paneCount,
    );
    /* Start a bit before active so user can scroll up */
    let start = addMonths({ year: this.active.year, month: this.active.month, day: 1 }, -1);
    if (this.rStart) {
      const rs = { year: this.rStart.year, month: this.rStart.month, day: 1 };
      if (compareCivil(rs, start) < 0) start = rs;
    }
    if (this.min) {
      const ms = { year: this.min.year, month: this.min.month, day: 1 };
      if (compareCivil(start, ms) < 0) start = ms;
    }
    const panes = monthSpan(start, total);
    return html`
      <div
        class="months-scroll"
        style=${`--k3-cal-scroll-max-h: ${Math.max(2, this.paneCount) * 11}rem`}
      >
        ${panes.map((a) =>
          this.renderMonthPane(a, { showSubhead: true, hideOutside: true }),
        )}
      </div>
    `;
  }

  private renderMonthBody(): TemplateResult {
    return this.resolvedLayout === 'scroll'
      ? this.renderScrollMonths()
      : this.renderPagedMonths();
  }

  private renderYear(): TemplateResult {
    const labels = monthLabels(i18n.locale);
    return html`
      <div class="grid year" role="grid" aria-label=${String(this.active.year)}>
        ${labels.map((label, i) => {
          const month = i + 1;
          const probe = { year: this.active.year, month, day: 1 };
          const disabled =
            (this.min &&
              compareCivil(
                { year: probe.year, month: probe.month, day: daysEnd(probe) },
                this.min,
              ) < 0) ||
            (this.max && compareCivil(probe, this.max) > 0);
          const selected = this.active.month === month;
          return html`
            <div role="gridcell">
              <button
                type="button"
                class=${classMap({ cell: true, 'k3-focus-ring': true })}
                aria-pressed=${selected ? 'true' : 'false'}
                ?disabled=${disabled}
                @click=${() => this.selectMonth(month)}
              >
                ${label}
              </button>
            </div>
          `;
        })}
      </div>
    `;
  }

  private renderMultiYear(): TemplateResult {
    const start = multiYearPageStart(this.active.year);
    return html`
      <div
        class="grid multi-year"
        role="grid"
        aria-label=${`${start} – ${start + YEARS_PER_PAGE - 1}`}
      >
        ${Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
          const year = start + i;
          const disabled =
            (this.min && year < this.min.year) || (this.max && year > this.max.year);
          const selected = this.active.year === year;
          return html`
            <div role="gridcell">
              <button
                type="button"
                class=${classMap({ cell: true, 'k3-focus-ring': true })}
                aria-pressed=${selected ? 'true' : 'false'}
                ?disabled=${!!disabled}
                @click=${() => this.selectYear(year)}
              >
                ${year}
              </button>
            </div>
          `;
        })}
      </div>
    `;
  }

  override render() {
    return html`
      ${this.renderHeader()}
      <div class="body">
        ${this.view === 'month'
          ? this.renderMonthBody()
          : this.view === 'year'
            ? this.renderYear()
            : this.renderMultiYear()}
      </div>
    `;
  }
}

function daysEnd(d: CivilDate): number {
  return daysInMonth(d.year, d.month);
}

export default K3Calendar;

if (!customElements.get('k3-calendar')) {
  customElements.define('k3-calendar', K3Calendar);
}
