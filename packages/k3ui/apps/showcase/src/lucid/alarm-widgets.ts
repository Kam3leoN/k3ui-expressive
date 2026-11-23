/**
 * Alarm card — condensed stacked time · day letters · switch.
 * MIT Lucid-inspired layout on M3 tokens (not Lucid colors).
 */

export interface AlarmState {
  /** Minutes from midnight 0…1439 */
  minutes: number;
  enabled: boolean;
  /** Mon…Sun — true if alarm fires that day */
  days: boolean[];
}

export interface AlarmLabels {
  switch: string;
  dayToggle: string; // "{day}"
}

const DEFAULT_LABELS: AlarmLabels = {
  switch: 'Alarm',
  dayToggle: '{day}',
};

/** Monday-based narrow weekday letters for the locale. */
export function weekdayLetters(locale?: string): string[] {
  // 2024-01-01 was a Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(2024, 0, 1 + i));
    const letter = new Intl.DateTimeFormat(locale, {
      weekday: 'narrow',
      timeZone: 'UTC',
    }).format(d);
    return letter.charAt(0).toLocaleUpperCase(locale);
  });
}

/** Full weekday names Mon…Sun (for aria). */
export function weekdayNames(locale?: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(2024, 0, 1 + i));
    const name = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      timeZone: 'UTC',
    }).format(d);
    return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
  });
}

export function demoAlarms(): AlarmState[] {
  return [
    {
      minutes: 7 * 60 + 20,
      enabled: true,
      days: [true, true, true, true, true, false, false],
    },
    {
      minutes: 10 * 60 + 30,
      enabled: false,
      days: [false, false, false, false, false, true, true],
    },
  ];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

export interface AlarmCardOptions {
  locale?: string;
  hour12?: boolean;
  labels?: Partial<AlarmLabels>;
  state?: AlarmState;
}

export class AlarmCard {
  private state: AlarmState;
  private readonly hour12: boolean;
  private readonly locale: string | undefined;
  private labels: AlarmLabels;
  private readonly letters: string[];
  private readonly names: string[];

  constructor(
    private readonly root: HTMLElement,
    options: AlarmCardOptions = {},
  ) {
    this.locale = options.locale;
    const cycle = new Intl.DateTimeFormat(options.locale, {
      hour: 'numeric',
    }).resolvedOptions().hourCycle;
    this.hour12 = options.hour12 ?? (cycle === 'h11' || cycle === 'h12');
    this.labels = { ...DEFAULT_LABELS, ...options.labels };
    this.letters = weekdayLetters(options.locale);
    this.names = weekdayNames(options.locale);
    const seed = options.state ?? demoAlarms()[0];
    this.state = {
      minutes: seed.minutes,
      enabled: seed.enabled,
      days: seed.days.map(Boolean),
    };
    while (this.state.days.length < 7) this.state.days.push(false);
    this.state.days = this.state.days.slice(0, 7);

    this.root.addEventListener('click', this.onClick);
    this.root.addEventListener('k3-change', this.onSwitch);
    this.render();
  }

  setLabels(labels: Partial<AlarmLabels>): void {
    this.labels = { ...this.labels, ...labels };
    this.render();
  }

  stop(): void {
    this.root.removeEventListener('click', this.onClick);
    this.root.removeEventListener('k3-change', this.onSwitch);
  }

  getState(): AlarmState {
    return {
      minutes: this.state.minutes,
      enabled: this.state.enabled,
      days: [...this.state.days],
    };
  }

  private onClick = (e: Event): void => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-alarm-day]');
    if (!btn || !this.root.contains(btn)) return;
    const i = Number(btn.dataset.alarmDay);
    if (i < 0 || i > 6) return;
    this.state.days[i] = !this.state.days[i];
    this.render();
  };

  private onSwitch = (e: Event): void => {
    const sw = e.target as HTMLElement & { selected?: boolean };
    if (sw.tagName?.toLowerCase() !== 'k3-switch') return;
    this.state.enabled = Boolean(sw.selected);
    this.root.classList.toggle('is-on', this.state.enabled);
    this.root.classList.toggle('is-off', !this.state.enabled);
  };

  private timeParts(): { hh: string; mm: string; period: string } {
    const total = ((this.state.minutes % 1440) + 1440) % 1440;
    const h24 = Math.floor(total / 60);
    const m = total % 60;
    const mm = String(m).padStart(2, '0');
    if (!this.hour12) {
      return { hh: String(h24).padStart(2, '0'), mm, period: '' };
    }
    const probe = new Date(2024, 0, 1, h24, m, 0);
    const parts = new Intl.DateTimeFormat(this.locale, {
      hour: 'numeric',
      hour12: true,
    }).formatToParts(probe);
    const period = parts.find((p) => p.type === 'dayPeriod')?.value ?? (h24 >= 12 ? 'PM' : 'AM');
    const h12 = h24 % 12 || 12;
    return { hh: String(h12).padStart(2, '0'), mm, period };
  }

  private render(): void {
    const { hh, mm, period } = this.timeParts();
    const days = this.state.days
      .map((on, i) => {
        const label = fmt(this.labels.dayToggle, { day: this.names[i] });
        return `<button type="button"
          class="alarm__day${on ? ' is-on' : ''}"
          data-alarm-day="${i}"
          aria-pressed="${on}"
          aria-label="${escapeHtml(label)}"
          title="${escapeHtml(this.names[i])}"
        ><span class="alarm__day-letter">${escapeHtml(this.letters[i])}</span></button>`;
      })
      .join('');

    this.root.classList.toggle('is-on', this.state.enabled);
    this.root.classList.toggle('is-off', !this.state.enabled);
    this.root.setAttribute(
      'aria-label',
      `${hh}:${mm}${period ? ` ${period}` : ''} · ${this.labels.switch}`,
    );

    this.root.innerHTML = `
      <time class="alarm__time" datetime="${String(Math.floor((((this.state.minutes % 1440) + 1440) % 1440) / 60)).padStart(2, '0')}:${mm}">
        <span class="alarm__hours">${hh}</span>
        <span class="alarm__minutes">${mm}</span>
        <span class="alarm__period" ${period ? '' : 'hidden'} aria-hidden="${period ? 'false' : 'true'}">${period || ''}</span>
      </time>
      <div class="alarm__days" role="group" aria-label="${escapeHtml(this.labels.switch)}">${days}</div>
      <k3-switch
        class="alarm__switch"
        ${this.state.enabled ? 'selected' : ''}
        aria-label="${escapeHtml(this.labels.switch)}"
        title="${escapeHtml(this.labels.switch)}"
      ></k3-switch>
    `;
  }
}
