/**
 * WAI-ARIA tabs for the playground `.qs-tabs` toggles (package manager,
 * HTML / CSS / JS samples): tab / tabpanel roles, selection state, roving
 * tabindex and arrow-key navigation (automatic activation).
 */
let uid = 0;

function panelFor(tab: HTMLElement): HTMLElement | null {
  const scope = tab.closest('.code-sample, .qs-card');
  if (!scope) return null;
  if (tab.dataset.codeTab) return scope.querySelector<HTMLElement>(`[data-code-panel="${tab.dataset.codeTab}"]`);
  if (tab.dataset.qsTab) return scope.querySelector<HTMLElement>(`[data-qs-panel="${tab.dataset.qsTab}"]`);
  return null;
}

/** Add tab / tabpanel semantics under `root` (idempotent). */
export function ariaTabs(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.qs-tabs[role="tablist"]').forEach((list) => {
    list.querySelectorAll<HTMLElement>('.qs-tab').forEach((tab) => {
      if (!tab.id) tab.id = `k3-doc-tab-${++uid}`;
      tab.setAttribute('role', 'tab');
      const selected = tab.classList.contains('is-active');
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = panelFor(tab);
      if (!panel) return;
      if (!panel.id) panel.id = `${tab.id}-panel`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      tab.setAttribute('aria-controls', panel.id);
    });
  });
}

/** Mirror the active tab into class, aria-selected and roving tabindex. */
export function selectTab(list: Element, active: Element): void {
  list.querySelectorAll<HTMLElement>('.qs-tab').forEach((tab) => {
    const on = tab === active;
    tab.classList.toggle('is-active', on);
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
  });
}

let keyboardInstalled = false;

/** Arrow keys / Home / End move between tabs and activate them. */
export function installTabKeyboard(): void {
  if (keyboardInstalled) return;
  keyboardInstalled = true;
  document.addEventListener('keydown', (ev) => {
    const tab = (ev.target as Element | null)?.closest?.<HTMLElement>('.qs-tabs [role="tab"]');
    if (!tab) return;
    const tabs = [...(tab.closest('.qs-tabs')?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
    const i = tabs.indexOf(tab);
    const rtl = getComputedStyle(tab).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    const next =
      ev.key === 'Home'
        ? 0
        : ev.key === 'End'
          ? tabs.length - 1
          : ev.key === forward
            ? (i + 1) % tabs.length
            : ev.key === back
              ? (i - 1 + tabs.length) % tabs.length
              : -1;
    if (next < 0) return;
    ev.preventDefault();
    tabs[next]!.focus();
    tabs[next]!.click();
  });
}
