import { html, nothing, render } from 'lit';
import { i18n } from '@k3ui/i18n/index.js';
import { TodoFocus, TodoList, demoTodos, type TodoLabels } from '../lucid/todo-widgets.js';
import { pageTitleRow } from '../demo-chrome.js';

/** To-do live UI — list · focus. */
const PAGE_STACK = 'k3ui' as const;

const t = (key: string) => i18n.t(key);

function labelsFromI18n(): Partial<TodoLabels> {
  return {
    title: t('showcase.todo.list.title'),
    focusTitle: t('showcase.todo.focus.title'),
    progress: t('showcase.todo.progress'),
    left: t('showcase.todo.left'),
    allDone: t('showcase.todo.allDone'),
    clear: t('showcase.todo.clear'),
    reset: t('showcase.todo.reset'),
    empty: t('showcase.todo.empty'),
    everythingDone: t('showcase.todo.everythingDone'),
    add: t('showcase.todo.add'),
    addHint: t('showcase.todo.addHint'),
    done: t('showcase.todo.done'),
    later: t('showcase.todo.later'),
    allClear: t('showcase.todo.allClear'),
    addOne: t('showcase.todo.addOne'),
  };
}

export function mountTodo(host: HTMLElement): () => void {
  let list: TodoList | undefined;
  let focus: TodoFocus | undefined;
  const showTitle = !host.closest('.showcase-doc');

  const paint = (): void => {
    list?.stop();
    focus?.stop();
    list = undefined;
    focus = undefined;

    const labels = labelsFromI18n();
    const items = demoTodos();

    render(
      html`
        <section
          class="page page--todo"
          aria-labelledby=${showTitle ? 'todo-title' : nothing}
          aria-label=${showTitle ? nothing : t('showcase.todo.title')}
        >
          ${showTitle
            ? html`
                ${pageTitleRow('showcase.todo.title', PAGE_STACK, 'todo-title')}
                <p class="page-lead">${t('showcase.todo.lead')}</p>
              `
            : null}

          <div class="widget-grid k3-layout-grid k3-demo-cols-2">
            <article class="widget-card widget-card--todo">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.todo.list.title')}</h2>
                <p class="widget-card__hint">${t('showcase.todo.list.hint')}</p>
              </header>
              <div class="widget-card__body">
                <div
                  class="todo todo--list"
                  data-todo-list
                  role="group"
                  aria-label=${t('showcase.todo.list.title')}
                ></div>
              </div>
            </article>

            <article class="widget-card widget-card--todo">
              <header class="widget-card__head">
                <h2 class="widget-card__title">${t('showcase.todo.focus.title')}</h2>
                <p class="widget-card__hint">${t('showcase.todo.focus.hint')}</p>
              </header>
              <div class="widget-card__body">
                <div
                  class="todo todo--focus"
                  data-todo-focus
                  role="group"
                  aria-label=${t('showcase.todo.focus.title')}
                ></div>
              </div>
            </article>
          </div>
        </section>
      `,
      host,
    );

    const listRoot = host.querySelector<HTMLElement>('[data-todo-list]');
    if (listRoot) list = new TodoList(listRoot, { items: structuredClone(items), labels });

    const focusRoot = host.querySelector<HTMLElement>('[data-todo-focus]');
    if (focusRoot) focus = new TodoFocus(focusRoot, { items: structuredClone(items), labels });
  };

  paint();
  const onLocale = (): void => paint();
  document.addEventListener('k3-locale-change', onLocale);

  return () => {
    document.removeEventListener('k3-locale-change', onLocale);
    list?.stop();
    focus?.stop();
    render(null, host);
  };
}
