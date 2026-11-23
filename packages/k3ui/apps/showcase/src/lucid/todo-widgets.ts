/**
 * To-do widget variants — list · focus.
 */

export interface TodoItem {
  t: string;
  d: boolean;
}

export interface TodoLabels {
  title: string;
  focusTitle: string;
  progress: string; // "{done} of {total} done"
  left: string; // "{n} left"
  allDone: string;
  clear: string;
  reset: string;
  empty: string;
  everythingDone: string;
  add: string;
  addHint: string;
  done: string;
  later: string;
  allClear: string;
  addOne: string;
}

const DEFAULT_LABELS: TodoLabels = {
  title: 'To-do',
  focusTitle: 'Up next',
  progress: '{done} of {total} done',
  left: '{n} left',
  allDone: 'all done',
  clear: 'Clear',
  reset: 'Reset',
  empty: 'Nothing on the list',
  everythingDone: "Everything's done",
  add: 'Add a task',
  addHint: 'Type, then Enter',
  done: 'Done',
  later: 'Later',
  allClear: 'All clear.',
  addOne: 'Add the one thing that matters next.',
};

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

function ms(name: string, filled = false): string {
  return `<span class="ms notranslate${filled ? ' ms-fill' : ''}" translate="no" lang="zxx" data-k3-icon="${name}" aria-hidden="true"></span>`;
}

export function demoTodos(): TodoItem[] {
  return [
    { t: 'Ship Calendar showcase', d: true },
    { t: 'Polish Today tonal card', d: true },
    { t: 'Build To-do live UI', d: false },
    { t: 'Wire hub + i18n', d: false },
    { t: 'Add focus variant', d: false },
  ];
}

function ringSvg(ratio: number): string {
  const r = 11;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, Math.max(0, ratio)));
  return `<svg class="todo__ring" viewBox="0 0 28 28" aria-hidden="true">
    <circle class="todo__ring-track" cx="14" cy="14" r="${r}" />
    <circle class="todo__ring-value" cx="14" cy="14" r="${r}"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" />
  </svg>`;
}

abstract class TodoBase {
  protected items: TodoItem[];
  protected readonly seed: TodoItem[];
  protected labels: TodoLabels;
  protected editing = false;

  constructor(
    protected readonly root: HTMLElement,
    opts: { items?: TodoItem[]; labels?: Partial<TodoLabels> } = {},
  ) {
    this.seed = (opts.items ?? demoTodos()).map((it) => ({ ...it }));
    this.items = this.seed.map((it) => ({ ...it }));
    this.labels = { ...DEFAULT_LABELS, ...opts.labels };
    this.root.addEventListener('click', this.onAct);
    this.root.addEventListener('k3-click', this.onAct);
    this.root.addEventListener('keydown', this.onKey);
  }

  setLabels(labels: Partial<TodoLabels>): void {
    this.labels = { ...this.labels, ...labels };
    this.render();
  }

  stop(): void {
    this.root.removeEventListener('click', this.onAct);
    this.root.removeEventListener('k3-click', this.onAct);
    this.root.removeEventListener('keydown', this.onKey);
  }

  protected get doneCount(): number {
    return this.items.filter((it) => it.d).length;
  }

  protected get openCount(): number {
    return this.items.length - this.doneCount;
  }

  protected get nextUp(): { t: string; at: number } | null {
    for (let i = 0; i < this.items.length; i++) {
      if (!this.items[i].d) return { t: this.items[i].t, at: i };
    }
    return null;
  }

  protected toggleAt(at: number): void {
    if (at < 0 || at >= this.items.length) return;
    this.items[at] = { ...this.items[at], d: !this.items[at].d };
    this.render();
  }

  protected removeAt(at: number): void {
    if (at < 0 || at >= this.items.length) return;
    this.items.splice(at, 1);
    this.render();
  }

  protected later(at: number): void {
    if (at < 0 || at >= this.items.length) return;
    const [it] = this.items.splice(at, 1);
    this.items.push(it);
    this.render();
  }

  protected clearDone(): void {
    this.items = this.items.filter((it) => !it.d);
    this.render();
  }

  protected reset(): void {
    this.items = this.seed.map((it) => ({ ...it }));
    this.editing = false;
    this.render();
  }

  protected addItem(text: string): void {
    const t = text.trim();
    if (!t) return;
    this.items.push({ t, d: false });
    this.render();
  }

  protected headActions(extra = ''): string {
    const resetLabel = escapeHtml(this.labels.reset);
    return `<div class="todo__actions">
      ${extra}
      <k3-icon-button
        class="todo__reset"
        variant="standard"
        size="sm"
        width="narrow"
        shape="round"
        data-todo-act="reset"
        label="${resetLabel}"
        title="${resetLabel}"
      >${ms('restart_alt')}</k3-icon-button>
    </div>`;
  }

  protected abstract render(): void;

  private onAct = (e: Event): void => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-todo-act]');
    if (!el || !this.root.contains(el)) return;
    const act = el.dataset.todoAct;
    const at = Number(el.dataset.todoAt);
    if (act === 'toggle') this.toggleAt(at);
    else if (act === 'remove') this.removeAt(at);
    else if (act === 'later') this.later(at);
    else if (act === 'clear') this.clearDone();
    else if (act === 'reset') this.reset();
    else if (act === 'edit') {
      if (this.editing) return;
      this.editing = true;
      this.render();
      this.root.querySelector<HTMLInputElement>('[data-todo-input]')?.focus();
    }
  };

  private onKey = (e: Event): void => {
    const ke = e as KeyboardEvent;
    const input = (ke.target as HTMLElement).closest<HTMLInputElement>('[data-todo-input]');
    if (!input) return;
    if (ke.key === 'Enter') {
      ke.preventDefault();
      this.addItem(input.value);
      this.editing = true;
      this.render();
      this.root.querySelector<HTMLInputElement>('[data-todo-input]')?.focus();
    } else if (ke.key === 'Escape') {
      ke.preventDefault();
      this.editing = false;
      this.render();
    }
  };
}

/** List — checkboxes, clear done, adder pill. */
export class TodoList extends TodoBase {
  private readonly hideDone: boolean;

  constructor(
    root: HTMLElement,
    opts: { items?: TodoItem[]; labels?: Partial<TodoLabels>; hideDone?: boolean } = {},
  ) {
    super(root, opts);
    this.hideDone = opts.hideDone ?? false;
    this.render();
  }

  protected render(): void {
    const shown = this.items
      .map((it, at) => ({ ...it, at }))
      .filter((it) => !(this.hideDone && it.d));
    const ratio = this.items.length ? this.doneCount / this.items.length : 0;
    const sub =
      this.items.length === 0
        ? ''
        : fmt(this.labels.progress, {
            done: this.doneCount,
            total: this.items.length,
          });

    const rows =
      shown.length === 0
        ? `<div class="todo__empty">
            ${ms(this.items.length ? 'check_circle' : 'notes')}
            <p>${this.items.length ? this.labels.everythingDone : this.labels.empty}</p>
          </div>`
        : `<ul class="todo__list k3-scroll">${shown
            .map((it, i) => {
              const ends =
                shown.length === 1
                  ? 'is-only'
                  : i === 0
                    ? 'is-first'
                    : i === shown.length - 1
                      ? 'is-last'
                      : '';
              return `<li class="todo__row ${ends}${it.d ? ' is-done' : ''}">
                <button type="button" class="todo__check${it.d ? ' is-on' : ''}" data-todo-act="toggle" data-todo-at="${it.at}" aria-pressed="${it.d}" aria-label="Toggle">
                  ${ms('check')}
                </button>
                <span class="todo__text">${escapeHtml(it.t)}</span>
                <button type="button" class="todo__del" data-todo-act="remove" data-todo-at="${it.at}" aria-label="Remove">
                  ${ms('close')}
                </button>
              </li>`;
            })
            .join('')}</ul>`;

    const clear =
      this.doneCount > 0
        ? `<k3-button class="todo__clear" variant="text" size="sm" data-todo-act="clear">${ms('check')}${escapeHtml(this.labels.clear)}</k3-button>`
        : '';

    this.root.innerHTML = `
      <header class="todo__head">
        <div class="todo__badge">
          ${ringSvg(ratio)}
          ${ms('list', true)}
        </div>
        <div class="todo__titles">
          <p class="todo__title">${this.labels.title}</p>
          ${sub ? `<p class="todo__sub">${sub}</p>` : ''}
        </div>
        ${this.headActions(clear)}
      </header>
      <div class="todo__body">${rows}</div>
      ${this.adderHtml()}
    `;
  }

  private adderHtml(): string {
    return `<div class="todo__adder${this.editing ? ' is-editing' : ''}" data-todo-act="edit">
      ${ms('add')}
      <input class="todo__input" type="text" data-todo-input
        placeholder="${this.editing ? this.labels.addHint : this.labels.add}"
        aria-label="${this.labels.add}" />
    </div>`;
  }
}

/** Focus — next open task big, Done + Later. */
export class TodoFocus extends TodoBase {
  constructor(
    root: HTMLElement,
    opts: { items?: TodoItem[]; labels?: Partial<TodoLabels> } = {},
  ) {
    super(root, opts);
    this.render();
  }

  protected render(): void {
    const next = this.nextUp;
    const ratio = this.items.length ? this.doneCount / this.items.length : 0;
    const sub =
      this.items.length === 0
        ? ''
        : this.openCount === 0
          ? this.labels.allDone
          : fmt(this.labels.left, { n: this.openCount });

    const big = next
      ? escapeHtml(next.t)
      : this.items.length
        ? this.labels.allClear
        : this.labels.addOne;

    this.root.innerHTML = `
      <header class="todo__head">
        <div class="todo__badge">
          ${ringSvg(ratio)}
          ${ms('bolt', true)}
        </div>
        <div class="todo__titles">
          <p class="todo__title">${this.labels.focusTitle}</p>
          ${sub ? `<p class="todo__sub">${sub}</p>` : ''}
        </div>
        ${this.headActions()}
      </header>
      <div class="todo__focus-body">
        <p class="todo__focus-task${!next ? ' is-empty' : ''}">${big}</p>
        ${
          next
            ? `<div class="todo__focus-actions">
                <button type="button" class="todo__btn todo__btn--filled" data-todo-act="toggle" data-todo-at="${next.at}">
                  ${ms('check')}<span>${this.labels.done}</span>
                </button>
                ${
                  this.openCount > 1
                    ? `<button type="button" class="todo__btn todo__btn--tonal" data-todo-act="later" data-todo-at="${next.at}">
                        ${ms('schedule')}<span>${this.labels.later}</span>
                      </button>`
                    : ''
                }
              </div>`
            : ''
        }
      </div>
      ${this.adderHtml()}
    `;
  }

  private adderHtml(): string {
    return `<div class="todo__adder${this.editing ? ' is-editing' : ''}" data-todo-act="edit">
      ${ms('add')}
      <input class="todo__input" type="text" data-todo-input
        placeholder="${this.editing ? this.labels.addHint : this.labels.add}"
        aria-label="${this.labels.add}" />
    </div>`;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
