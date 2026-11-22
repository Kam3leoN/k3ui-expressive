import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { K3Element, edgeScrollbarStyles, focusRingStyles } from '../../core/index.js';
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
  addMonths,
  addYears,
  buildMonthGrid,
  clampCivil,
  compareCivil,
  daysInMonth,
  firstWeekday,
  formatFullDate,
  formatMonthName,
  formatPeriodLabel,
  inRange,
  isDisabledCivil,
  isRangeEdge,
  monthLabels,
  monthSpan,
  monthsToCoverRange,
  pad2,
  parseCivilDate,
  sameCivil,
  todayCivil,
  weekdayLabels,
  yearBounds,
  civilToValue,
} from './calendar.utils.js';

/** Default months preloaded when `layout="scroll"` (opt-in). */
const SCROLL_MONTHS_DEFAULT = 24;

/**
 * Material 3 calendar — month / year / multi-year.
 * Header: month (left) + year (right). Year menu scrolls continuously;
 * month menu is a fixed column grid (12 fit).
 * Multi-month ranges use side-by-side panes (`months` ≥ 2, `layout` paged).
 *
 * @see https://m3.material.io/components/date-pickers/guidelines
 * @see https://matraic.github.io/m3e/components/calendar.html
 *
 * @fires k3-change — `{ value, date, rangeStart, rangeEnd }`
 * @fires k3-view-change — `{ view }`
 */
export class K3Calendar extends K3Element {
  static override styles = [hostReset, focusRingStyles, edgeScrollbarStyles, calendarStyles];

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
  /** Day-grid slide direction after month/year step. */
  @state() private slideDir: 'next' | 'prev' | null = null;
  /** Bumps to re-trigger selected-day pop animation. */
  @state() private valueAnim = 0;

  private slideClearTimer = 0;
  /**
   * Stable first month of the scroll list — set once per open/seed so selecting
   * the range end never rebuilds panes and jumps the dialog scroll to top.
   */
  private scrollAnchor: CivilDate | null = null;

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
    if (this.layout === 'scroll') return 'scroll';
    if (this.layout === 'paged') return 'paged';
    /* auto — Noph range scrolls months continuously */
    return this.range ? 'scroll' : 'paged';
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
      this.syncFromProps(false, changed);
    }
    if (changed.has('layout') || changed.has('range') || changed.has('months')) {
      this.dataset.layout = this.resolvedLayout;
    }
  }

  private syncFromProps(initial: boolean, changed?: PropertyValues): void {
    this.selected = parseCivilDate(this.value);
    this.rStart = parseCivilDate(this.rangeStart);
    this.rEnd = parseCivilDate(this.rangeEnd);
    /*
     * Only re-seed `active` / scroll list on open or explicit startAt — never on
     * rangeEnd (2nd tap): that used to yank active back to the start month and
     * scrollIntoView jumped the dialog to the top.
     */
    const seedActive =
      initial || !!changed?.has('startAt') || !!changed?.has('startView');
    if (seedActive) {
      const start =
        parseCivilDate(this.startAt) ?? this.selected ?? this.rStart ?? todayCivil();
      this.active = clampCivil(start, this.min, this.max);
      this.scrollAnchor = null;
    }
    if (initial || !this.view || changed?.has('startView')) {
      this.view = this.startView || 'month';
    }
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

  private toggleMonthMenu(): void {
    this.setView(this.view === 'year' ? 'month' : 'year');
  }

  private toggleYearMenu(): void {
    this.setView(this.view === 'multi-year' ? 'month' : 'multi-year');
  }

  /** Month-view step: one page of panes (multi-month) or one month. */
  private get monthStep(): number {
    return this.resolvedLayout === 'paged' ? this.paneCount : 1;
  }

  private get canPrevMonth(): boolean {
    if (!this.min) return true;
    const prev = addMonths(this.active, -this.monthStep);
    return (
      compareCivil({ year: prev.year, month: prev.month, day: daysEnd(prev) }, this.min) >= 0
    );
  }

  private get canNextMonth(): boolean {
    if (!this.max) return true;
    const next = addMonths(this.active, this.monthStep);
    return compareCivil({ year: next.year, month: next.month, day: 1 }, this.max) <= 0;
  }

  private get canPrevYear(): boolean {
    if (!this.min) return true;
    return this.active.year - 1 >= this.min.year;
  }

  private get canNextYear(): boolean {
    if (!this.max) return true;
    return this.active.year + 1 <= this.max.year;
  }

  private bumpSlide(dir: 'next' | 'prev'): void {
    this.slideDir = dir;
    window.clearTimeout(this.slideClearTimer);
    this.slideClearTimer = window.setTimeout(() => {
      this.slideDir = null;
    }, 400);
  }

  private moveMonth(delta: number): void {
    if (delta < 0 && !this.canPrevMonth) return;
    if (delta > 0 && !this.canNextMonth) return;
    this.bumpSlide(delta > 0 ? 'next' : 'prev');
    this.active = addMonths(this.active, delta * this.monthStep);
    if (this.view !== 'month') this.setView('month');
  }

  private moveYear(delta: number): void {
    if (delta < 0 && !this.canPrevYear) return;
    if (delta > 0 && !this.canNextYear) return;
    this.bumpSlide(delta > 0 ? 'next' : 'prev');
    this.active = addYears(this.active, delta);
    if (this.view !== 'month') this.setView('month');
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('view') && this.view === 'multi-year') {
      queueMicrotask(() => this.scrollActiveYearIntoView());
    }
  }

  private scrollActiveYearIntoView(): void {
    const el = this.renderRoot.querySelector<HTMLElement>(
      '.grid.multi-year .cell[aria-pressed="true"]',
    );
    if (typeof el?.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }

  override disconnectedCallback(): void {
    window.clearTimeout(this.slideClearTimer);
    super.disconnectedCallback();
  }

  /** True when `d`'s month is already shown in the current paged/scroll panes. */
  private isMonthVisible(d: CivilDate): boolean {
    if (this.resolvedLayout === 'scroll') {
      return true; /* continuous list — never page-jump on day tap */
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
      /* Noph range: 1st tap = start, 2nd = end, tap before start = new range.
       * `selectionTarget` start|end only when a dual field explicitly retargets. */
      if (this.selectionTarget === 'start') {
        this.applyRangeStart(d);
      } else if (this.selectionTarget === 'end') {
        this.applyRangeEnd(d);
      } else if (!this.rStart || this.rEnd) {
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
    this.valueAnim += 1;
    /* Keep current multi-month page if the day is already visible (no jump to 3rd month). */
    if (!this.isMonthVisible(d)) {
      const before = this.active;
      this.active = { year: d.year, month: d.month, day: 1 };
      const delta =
        this.active.year * 12 + this.active.month - (before.year * 12 + before.month);
      if (delta !== 0) this.bumpSlide(delta > 0 ? 'next' : 'prev');
    }
    /* Scroll layout: never scrollIntoView on day tap — stay on the month just picked. */
    this.emitChange();
  }

  private selectMonth(month: number): void {
    const before = this.active;
    this.active = clampCivil(
      { year: this.active.year, month, day: 1 },
      this.min,
      this.max,
    );
    const delta =
      this.active.year * 12 + this.active.month - (before.year * 12 + before.month);
    if (delta !== 0) this.bumpSlide(delta > 0 ? 'next' : 'prev');
    this.setView('month');
  }

  private selectYear(year: number): void {
    const before = this.active;
    this.active = clampCivil(
      { year, month: this.active.month, day: 1 },
      this.min,
      this.max,
    );
    if (this.active.year !== before.year) {
      this.bumpSlide(this.active.year > before.year ? 'next' : 'prev');
    }
    this.setView('year');
  }

  private renderNavBtn(
    dir: 'prev' | 'next',
    label: string,
    disabled: boolean,
    onClick: () => void,
  ): TemplateResult {
    return html`
      <button
        type="button"
        class="nav-btn k3-focus-ring"
        aria-label=${label}
        ?disabled=${disabled}
        @click=${onClick}
      >
        <span
          class="ms notranslate"
          translate="no"
          lang="zxx"
          data-k3-icon=${dir === 'prev' ? 'chevron_left' : 'chevron_right'}
          aria-hidden="true"
        ></span>
      </button>
    `;
  }

  private renderHeader(): TemplateResult {
    const monthOpen = this.view === 'year';
    const yearOpen = this.view === 'multi-year';
    const showSteppers = this.view === 'month';
    const monthName = formatMonthName(this.active, i18n.locale);
    const yearLabel = String(this.active.year);
    return html`
      <div class="header">
        <div class="period period--month">
          ${showSteppers
            ? this.renderNavBtn(
                'prev',
                i18n.t('datepicker.prevMonth'),
                !this.canPrevMonth,
                () => this.moveMonth(-1),
              )
            : nothing}
          <button
            type="button"
            class="period-btn k3-focus-ring"
            aria-label=${i18n.t('datepicker.selectMonth')}
            aria-expanded=${monthOpen ? 'true' : 'false'}
            @click=${() => this.toggleMonthMenu()}
          >
            <span class="label">${monthName}</span>
            <span
              class="chev ms notranslate"
              translate="no"
              lang="zxx"
              data-k3-icon="arrow_drop_down"
              aria-hidden="true"
            ></span>
          </button>
          ${showSteppers
            ? this.renderNavBtn(
                'next',
                i18n.t('datepicker.nextMonth'),
                !this.canNextMonth,
                () => this.moveMonth(1),
              )
            : nothing}
        </div>
        <div class="period period--year">
          ${showSteppers
            ? this.renderNavBtn(
                'prev',
                i18n.t('datepicker.prevYear'),
                !this.canPrevYear,
                () => this.moveYear(-1),
              )
            : nothing}
          <button
            type="button"
            class="period-btn k3-focus-ring"
            aria-label=${i18n.t('datepicker.selectYear')}
            aria-expanded=${yearOpen ? 'true' : 'false'}
            @click=${() => this.toggleYearMenu()}
          >
            <span class="label">${yearLabel}</span>
            <span
              class="chev ms notranslate"
              translate="no"
              lang="zxx"
              data-k3-icon="arrow_drop_down"
              aria-hidden="true"
            ></span>
          </button>
          ${showSteppers
            ? this.renderNavBtn(
                'next',
                i18n.t('datepicker.nextYear'),
                !this.canNextYear,
                () => this.moveYear(1),
              )
            : nothing}
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
          data-value-anim=${selected && this.valueAnim > 0 ? String(this.valueAnim) : nothing}
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
      <section class="month-pane" data-ym="${anchor.year}-${pad2(anchor.month)}">
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

  /** First pane of the continuous list — stable across range taps. */
  private ensureScrollAnchor(): CivilDate {
    if (!this.scrollAnchor) {
      let start = addMonths(
        { year: this.active.year, month: this.active.month, day: 1 },
        -1,
      );
      if (this.rStart) {
        const rs = { year: this.rStart.year, month: this.rStart.month, day: 1 };
        if (compareCivil(rs, start) < 0) start = rs;
      }
      if (this.min) {
        const ms = { year: this.min.year, month: this.min.month, day: 1 };
        if (compareCivil(start, ms) < 0) start = ms;
      }
      this.scrollAnchor = start;
    } else if (this.rStart) {
      /* Allow extending earlier if a new start is before the anchor — never jump forward. */
      const rs = { year: this.rStart.year, month: this.rStart.month, day: 1 };
      if (compareCivil(rs, this.scrollAnchor) < 0) this.scrollAnchor = rs;
    }
    return this.scrollAnchor;
  }

  private renderScrollMonths(): TemplateResult {
    /* Cover selection range + buffer; at least scrollMonths / paneCount */
    const cover = monthsToCoverRange(this.rStart, this.rEnd, this.paneCount);
    const total = Math.max(
      this.scrollMonths || SCROLL_MONTHS_DEFAULT,
      cover + 2,
      this.paneCount,
    );
    const panes = monthSpan(this.ensureScrollAnchor(), total);
    return html`
      <div class="months-scroll">
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
    const [yMin, yMax] = yearBounds(this.min, this.max);
    const years: number[] = [];
    for (let y = yMin; y <= yMax; y++) years.push(y);
    return html`
      <div
        class="years-scroll k3-scroll"
        role="presentation"
      >
        <div
          class="grid multi-year"
          role="grid"
          aria-label=${i18n.t('datepicker.selectYear')}
        >
          ${years.map((year) => {
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
      </div>
    `;
  }

  override render() {
    const slide = this.view === 'month' && this.slideDir ? this.slideDir : nothing;
    return html`
      ${this.renderHeader()}
      <div class="body" data-slide=${slide}>
        <div class="body-inner">
          ${this.view === 'month'
            ? this.renderMonthBody()
            : this.view === 'year'
              ? this.renderYear()
              : this.renderMultiYear()}
        </div>
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
