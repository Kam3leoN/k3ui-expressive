import { html, nothing, type PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { K3Element } from '../../core/index.js';
import { i18n } from '../../i18n/index.js';
import { hostReset } from '../_shared.js';
import K3Button from '../actions/button.js';
import K3ShapeChip from '../actions/shape-chip.js';
import K3Dialog from '../containment/dialog.js';
import {
  countByMood,
  daysInMonth,
  generateDemoYear,
  moodColor,
  weekdayShort,
} from './mood-calendar.demo-data.js';
import { moodCalendarStyles } from './mood-calendar.styles.js';
import {
  DEFAULT_MOOD_LEGEND,
  defaultMoodYears,
  MONTH_LABELS,
  type MoodEntry,
  type MoodId,
  type MoodMeta,
} from './mood-calendar.types.js';

if (!customElements.get('k3-button')) {
  customElements.define('k3-button', K3Button);
}
if (!customElements.get('k3-shape-chip')) {
  customElements.define('k3-shape-chip', K3ShapeChip);
}
if (!customElements.get('k3-dialog')) {
  customElements.define('k3-dialog', K3Dialog);
}

/**
 * Mood Calendar — year grid + legend + journal (`k3-dialog`) + stats.
 *
 * Selecting a day opens the journal in a modal dialog.
 * Without `entries`, ships deterministic demo data for the selected year.
 * Default year tabs: current year + n−1.
 */
export class K3MoodCalendar extends K3Element {
  static override styles = [hostReset, moodCalendarStyles];

  /** Active year (tabs). */
  @property({ type: Number, reflect: true }) year = new Date().getFullYear();

  /**
   * Journal entries. When empty, demo data is generated for `year`.
   * Assign via property (array) — not a serialized attribute.
   */
  @property({ attribute: false }) entries: MoodEntry[] | null = null;

  /** Mood legend (colors + labels). Defaults to 8-mood Dartegnian set. */
  @property({ attribute: false }) legend: MoodMeta[] = [...DEFAULT_MOOD_LEGEND];

  /** Years shown in tabs. Defaults to current year + previous year. */
  @property({ attribute: false }) years: number[] = defaultMoodYears();

  /** Use built-in demo generator when entries is null/empty. */
  @property({ type: Boolean, attribute: 'demo' }) demo = true;

  @state() private _filter: MoodId | null = null;
  @state() private _selected: string | null = null;
  @state() private _resolved: MoodEntry[] = [];

  @query('k3-dialog') private _dialog?: K3Dialog;

  override connectedCallback(): void {
    super.connectedCallback();
    this._resolveEntries();
  }

  override willUpdate(changed: PropertyValues): void {
    if (
      changed.has('entries') ||
      changed.has('year') ||
      changed.has('demo') ||
      changed.has('years')
    ) {
      this._resolveEntries();
    }
  }

  private _locale(): string {
    return i18n.locale === 'fr' ? 'fr-FR' : 'en-US';
  }

  private _activeYear(): number {
    if (this.years.includes(this.year)) return this.year;
    if (this.years.includes(new Date().getFullYear())) return new Date().getFullYear();
    return this.years[this.years.length - 1] ?? this.year;
  }

  private _resolveEntries(): void {
    const y = this._activeYear();
    const custom = this.entries;
    if (custom && custom.length) {
      this._resolved = custom.filter((e) => e.date.startsWith(`${y}-`));
    } else if (this.demo) {
      this._resolved = generateDemoYear(y, this._locale());
    } else {
      this._resolved = [];
    }

    const byDate = new Map(this._resolved.map((e) => [e.date, e]));
    if (!this._selected || !byDate.has(this._selected)) {
      this._selected = this._resolved.at(-1)?.date ?? null;
    }
  }

  private _byDate(): Map<string, MoodEntry> {
    return new Map(this._resolved.map((e) => [e.date, e]));
  }

  private _selectYear(y: number): void {
    if (y === this.year) return;
    this.year = y;
    this._selected = null;
    this._resolveEntries();
    this.emit('k3-year-change', { year: y });
  }

  private _toggleFilter(id: MoodId): void {
    this._filter = this._filter === id ? null : id;
    this.emit('k3-filter-change', { mood: this._filter });
  }

  private async _selectDate(date: string): Promise<void> {
    this._selected = date;
    const entry = this._byDate().get(date);
    this.emit('k3-change', { date, entry });
    if (entry) {
      await this.updateComplete;
      void this._dialog?.show();
    }
  }

  private _shuffle(): void {
    if (!this._resolved.length) return;
    const i = Math.floor(Math.random() * this._resolved.length);
    const date = this._resolved[i]!.date;
    void this._selectDate(date);
  }

  private _labelFor(id: string): string {
    return this.legend.find((m) => m.id === id)?.label ?? id;
  }

  private _weatherText(weather?: string): string {
    if (!weather) return '';
    return weather.replace(/^\S+\s/, '');
  }

  private _weatherIcon(weather?: string): string {
    if (!weather) return 'wb_cloudy';
    const token = weather.split(/\s+/)[0] ?? 'wb_cloudy';
    return token;
  }

  private _renderJournal(entry: MoodEntry | undefined) {
    if (!entry) {
      return html`<p class="body">${i18n.t('mood-calendar.empty', 'No entry for this selection.')}</p>`;
    }
    return html`
      <span class="weekday">${weekdayShort(entry.date, this._locale())}</span>
      <h3>${entry.title ?? entry.date}</h3>
      <div class="mood-tag">
        <span
          class="ms notranslate"
          translate="no"
          lang="zxx"
          data-k3-icon="sentiment_satisfied"
          aria-hidden="true"
        ></span>
        ${this._labelFor(entry.mood)}
      </div>
      ${entry.weather
        ? html`<div class="weather">
            <span
              class="ms notranslate"
              translate="no"
              lang="zxx"
              data-k3-icon=${this._weatherIcon(entry.weather)}
              aria-hidden="true"
            ></span>
            ${this._weatherText(entry.weather)}
          </div>`
        : nothing}
      ${entry.body ? html`<p class="body">${entry.body}</p>` : nothing}
      <div class="panel-actions">
        <k3-button size="sm" shape="round" variant="tonal" @click=${() => this._shuffle()}>
          <span
            class="ms notranslate"
            slot="icon"
            translate="no"
            lang="zxx"
            data-k3-icon="repeat"
            aria-hidden="true"
          ></span>
          ${i18n.t('mood-calendar.shuffle', 'Shuffle day')}
        </k3-button>
      </div>
    `;
  }

  private _renderGrid(byDate: Map<string, MoodEntry>) {
    const y = this._activeYear();
    const todayKey = (() => {
      const t = new Date();
      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    })();

    return html`
      <div
        class="year-grid"
        role="grid"
        aria-label=${i18n.t('mood-calendar.grid-label', 'Mood calendar {year}', {
          year: y,
        })}
      >
        <div class="corner" aria-hidden="true"></div>
        ${Array.from({ length: 31 }, (_, i) => {
          const d = i + 1;
          return html`<div class="day-head" role="columnheader">${d}</div>`;
        })}
        ${MONTH_LABELS.map((label, mi) => {
          const dim = daysInMonth(y, mi);
          const cells = [];
          for (let day = 1; day <= 31; day++) {
            if (day > dim) {
              cells.push(html`
                <button type="button" class="day is-empty is-pad" disabled aria-label="—">
                  <span
                    class="ms notranslate"
                    translate="no"
                    lang="zxx"
                    data-k3-icon="close"
                    aria-hidden="true"
                  ></span>
                </button>
              `);
              continue;
            }
            const key = `${y}-${String(mi + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const entry = byDate.get(key);
            if (!entry) {
              const future = key > todayKey;
              cells.push(html`
                <button
                  type="button"
                  class="day is-empty"
                  disabled
                  aria-label=${future ? '?' : '—'}
                >
                  <span
                    class="ms notranslate"
                    translate="no"
                    lang="zxx"
                    data-k3-icon=${future ? 'question_mark' : 'close'}
                    aria-hidden="true"
                  ></span>
                </button>
              `);
              continue;
            }
            const dimmed = this._filter != null && entry.mood !== this._filter;
            const selected = this._selected === key;
            const color = moodColor(entry.mood, this.legend);
            cells.push(html`
              <button
                type="button"
                class="day${dimmed ? ' is-dim' : ''}${selected ? ' is-selected' : ''}"
                style=${styleMap({ '--day-bg': color })}
                aria-pressed=${selected ? 'true' : 'false'}
                aria-label=${`${entry.title ?? key}, ${this._labelFor(entry.mood)}`}
                data-date=${key}
                @click=${() => void this._selectDate(key)}
              >
                <span
                  class="ms notranslate"
                  translate="no"
                  lang="zxx"
                  data-k3-icon=${entry.icon ?? 'circle'}
                  aria-hidden="true"
                ></span>
              </button>
            `);
          }
          return html`
            <div class="month-label" role="rowheader">${label}</div>
            ${cells}
          `;
        })}
      </div>
    `;
  }

  override render() {
    const activeYear = this._activeYear();
    const byDate = this._byDate();
    const current = this._selected ? byDate.get(this._selected) : undefined;
    const stats = countByMood(this._resolved, this.legend);
    const journal = this._renderJournal(current);

    return html`
      <p class="section-label">${i18n.t('mood-calendar.years', 'Years')}</p>
      <div class="years" role="tablist">
        ${this.years.map(
          (y) => html`
            <k3-button
              size="md"
              shape="round"
              variant=${y === activeYear ? 'filled' : 'tonal'}
              aria-pressed=${y === activeYear ? 'true' : 'false'}
              @click=${() => this._selectYear(y)}
              >${y}</k3-button
            >
          `,
        )}
      </div>

      <p class="section-label">${i18n.t('mood-calendar.legend', 'Legend')}</p>
      <div class="legend" role="group" aria-label=${i18n.t('mood-calendar.legend', 'Legend')}>
        ${this.legend.map(
          (m) => html`
            <k3-shape-chip
              toggle
              size="xs"
              shape="Cookie7Sided"
              value=${m.id}
              ?selected=${this._filter === m.id}
              style=${styleMap({ '--k3-shape-chip-color': m.color })}
              @k3-change=${() => this._toggleFilter(m.id)}
              >${m.label}</k3-shape-chip
            >
          `,
        )}
      </div>

      <div class="layout">
        <div class="grid-wrap">${this._renderGrid(byDate)}</div>
      </div>

      <k3-dialog variant="basic">
        <span slot="headline">${i18n.t('mood-calendar.journal', 'Journal')}</span>
        <div class="dialog-panel">${journal}</div>
        <k3-button
          slot="actions"
          variant="text"
          @click=${() => void this._dialog?.hide('user')}
          >${i18n.t('mood-calendar.close', 'Close')}</k3-button
        >
      </k3-dialog>

      <p class="stats-title">
        ${i18n.t('mood-calendar.stats', 'Mood statistics for {year}', { year: activeYear })}
      </p>
      <div class="stats">
        ${this.legend.map(
          (m) => html`
            <div class="stat">
              <div class="n" style=${styleMap({ color: m.color })}>${stats[m.id] ?? 0}</div>
              <div class="l">${m.label} · ${i18n.t('mood-calendar.days', 'Days')}</div>
            </div>
          `,
        )}
      </div>
    `;
  }
}

export default K3MoodCalendar;
export type { MoodEntry, MoodId, MoodMeta } from './mood-calendar.types.js';
export {
  DEFAULT_MOOD_LEGEND,
  DEFAULT_MOOD_YEARS,
  defaultMoodYears,
  MOOD_ORDER,
} from './mood-calendar.types.js';
export { generateDemoYear, countByMood } from './mood-calendar.demo-data.js';
