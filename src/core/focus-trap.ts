import { deepActiveElement } from './focus-nav.js';

/**
 * Tab-cycling focus trap for modal surfaces (dialog · sheet · modal pickers).
 *
 * Walks the **composed** tree: open shadow roots of nested components and the
 * nodes assigned to `<slot>`s. A panel living in a component's shadow root
 * therefore sees the `<k3-button slot="actions">` of its light DOM — and the
 * `<button>` inside it. Querying the container alone (light DOM only) missed
 * every slotted control, so Tab left the modal.
 */

/** Natively tabbable elements (tabindex ≥ 0 is checked separately). */
const TABBABLE =
  'a[href],area[href],button,input:not([type="hidden"]),select,textarea,iframe,audio[controls],video[controls],summary,[contenteditable]:not([contenteditable="false"]),[tabindex]';

/** Hard cap — a pathological tree must not freeze a Tab key press. */
const MAX_VISITED = 5_000;

function isDisabled(el: Element): boolean {
  return (el as HTMLButtonElement).disabled === true || el.hasAttribute('disabled');
}

function isRendered(el: HTMLElement): boolean {
  if (el.hidden) return false;
  const check = (el as HTMLElement & { checkVisibility?: (o?: object) => boolean }).checkVisibility;
  if (typeof check === 'function') {
    return check.call(el, { visibilityProperty: true, checkVisibilityCSS: true } as object);
  }
  if (typeof getComputedStyle !== 'function') return true;
  const cs = getComputedStyle(el);
  return cs.display !== 'none' && cs.visibility !== 'hidden';
}

function isTabbable(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  if (!el.matches(TABBABLE) || el.tabIndex < 0) return false;
  /* A host that delegates focus is entered through its shadow content instead. */
  if (el.shadowRoot?.delegatesFocus) return false;
  if (isDisabled(el) || el.closest('[inert]')) return false;
  return isRendered(el);
}

function childrenOf(node: Element | ShadowRoot): Element[] {
  if (node instanceof HTMLSlotElement) {
    const assigned = node.assignedElements({ flatten: true });
    return assigned.length ? assigned : [...node.children];
  }
  if (node instanceof Element && node.shadowRoot) {
    /* Light children render only through slots — the shadow tree is the order. */
    return [...node.shadowRoot.children];
  }
  return [...node.children];
}

/**
 * Tabbable elements under `root`, in composed-tree order (flat tree).
 * Positive `tabindex` values are rare in components and treated as 0.
 */
export function tabbableElements(root: Element | ShadowRoot): HTMLElement[] {
  const out: HTMLElement[] = [];
  let visited = 0;
  const walk = (node: Element | ShadowRoot): void => {
    for (const child of childrenOf(node)) {
      if (++visited > MAX_VISITED) return;
      if (child instanceof HTMLElement && (child.hidden || child.inert)) continue;
      if (isTabbable(child)) out.push(child);
      walk(child);
    }
  };
  walk(root);
  return out;
}

/** True when `node` is `container` or one of its composed-tree descendants. */
function composedContains(container: Node, node: Node | null): boolean {
  let n: Node | null = node;
  while (n) {
    if (n === container) return true;
    n = n instanceof ShadowRoot ? n.host : ((n as Element).assignedSlot ?? n.parentNode);
  }
  return false;
}

export class FocusTrap {
  private previous: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private onKey: ((e: KeyboardEvent) => void) | null = null;

  /**
   * Trap Tab inside `container` and move focus to its first tabbable element
   * (or to the container itself, made focusable with `tabindex="-1"`).
   */
  activate(container: HTMLElement): void {
    this.deactivate({ restore: false });
    this.previous = deepActiveElement() as HTMLElement | null;
    this.container = container;
    this.onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.defaultPrevented) return;
      const nodes = tabbableElements(container);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const active = deepActiveElement();
      const index = active ? nodes.indexOf(active as HTMLElement) : -1;
      const last = nodes.length - 1;
      let next: HTMLElement | null = null;
      if (index === -1) next = e.shiftKey ? nodes[last]! : nodes[0]!;
      else if (e.shiftKey && index === 0) next = nodes[last]!;
      else if (!e.shiftKey && index === last) next = nodes[0]!;
      if (next) {
        e.preventDefault();
        next.focus();
      }
    };
    container.addEventListener('keydown', this.onKey);
    this.focusInitial();
  }

  /** Focus the first tabbable element — or the container itself. */
  focusInitial(): void {
    const container = this.container;
    if (!container) return;
    const active = deepActiveElement();
    if (active && composedContains(container, active)) return;
    const first = tabbableElements(container)[0];
    if (first) {
      first.focus({ preventScroll: true });
      return;
    }
    if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
    container.focus({ preventScroll: true });
  }

  /** @param restore — focus previously focused node (default true) */
  deactivate(opts: { restore?: boolean } = {}): void {
    const restore = opts.restore !== false;
    const container = this.container;
    if (container && this.onKey) {
      container.removeEventListener('keydown', this.onKey);
    }
    this.onKey = null;
    this.container = null;
    const previous = this.previous;
    this.previous = null;
    if (!restore || !previous?.isConnected) return;
    /* Never steal focus the user already moved elsewhere on the page. */
    const active = deepActiveElement();
    const focusIsLost =
      !active || active === document.body || (container != null && composedContains(container, active));
    if (focusIsLost) previous.focus?.({ preventScroll: true });
  }

  get keyHandler(): ((e: KeyboardEvent) => void) | null {
    return this.onKey;
  }
}
