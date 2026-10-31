/**
 * Shared keyboard focus navigation (arrow / Home / End / optional Tab).
 *
 * Used by FAB menu, menus, button groups, chip sets — so arrow handling is
 * not re-implemented per component.
 *
 * Open overlays always include the **trigger** in the focus loop (start or end)
 * so the user can arrow back to it and re-close / re-activate.
 *
 * @see focus-ring.ts — visual :focus-visible ring
 * @see focus-trap.ts — Tab cycle inside a modal container
 */

export type FocusNavOrientation = 'horizontal' | 'vertical' | 'both';

export type FocusNavKind = 'prev' | 'next' | 'home' | 'end' | 'none';

/** Where the opener sits in the roving loop relative to items. */
export type FocusNavTriggerPosition = 'start' | 'end';

export interface FocusNavOptions {
  /**
   * Which axes move focus along the list.
   * - `both` — all four arrows (FAB menu style)
   * - `horizontal` — Left/Right (RTL-aware)
   * - `vertical` — Up/Down
   * @default 'both'
   */
  orientation?: FocusNavOrientation;
  /** Loop at ends. @default true */
  wrap?: boolean;
  /** Handle Home / End. @default true */
  homeEnd?: boolean;
  /** Handle Tab / Shift+Tab as next / prev. @default false */
  tab?: boolean;
  /** Flip Left/Right when orientation is horizontal. @default false */
  rtl?: boolean;
}

export interface FocusNavResult {
  handled: boolean;
  kind: FocusNavKind;
  /** Index in the full loop (items + optional trigger). */
  nextIndex: number;
  /** `nextIndex` points at the trigger slot. */
  onTrigger: boolean;
  /** Index into the original items array, or -1 when `onTrigger`. */
  itemIndex: number;
}

/** One slot in a focus loop that includes an optional opener. */
export type FocusNavLoopEntry =
  | { type: 'item'; el: HTMLElement; itemIndex: number }
  | { type: 'trigger'; el: HTMLElement };

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/** Deepest `activeElement` through open shadow roots. */
export function deepActiveElement(
  root: Document | ShadowRoot = document,
): Element | null {
  let a: Element | null =
    root instanceof Document ? root.activeElement : (root.activeElement ?? null);
  while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
  return a;
}

/**
 * True if `active` is `host` or inside its light / nested shadow tree
 * (walks shadow hosts — required for FAB → k3-fab → button).
 */
export function isFocusWithinHost(
  host: Element,
  active: Element | null = deepActiveElement(),
  extras: readonly Element[] = [],
): boolean {
  if (!active) return false;
  if (active === host || host.contains(active)) return true;

  let node: Node | null = active;
  while (node) {
    if (node === host) return true;
    const root = node.getRootNode();
    if (root instanceof ShadowRoot) {
      if (root.host === host) return true;
      node = root.host;
      continue;
    }
    node = node.parentNode;
  }

  return extras.some(
    (el) => el === active || el.contains(active) || !!el.shadowRoot?.contains(active),
  );
}

/**
 * Index of the focused item in `items` (composedPath + contains + shadow).
 * Returns -1 when none match.
 */
export function indexOfFocusedItem(
  items: readonly Element[],
  active: Element | null = deepActiveElement(),
  event?: Event,
): number {
  if (!items.length) return -1;
  const path = event ? event.composedPath() : null;
  for (let i = 0; i < items.length; i++) {
    const el = items[i]!;
    if (path?.includes(el)) return i;
    if (!active) continue;
    if (el === active || el.contains(active) || el.shadowRoot?.contains(active)) return i;
    if (typeof (el as HTMLElement).matches === 'function' && el.matches(':focus-within')) {
      return i;
    }
  }
  return -1;
}

/** True when `active` is the trigger or inside its light / shadow tree. */
export function isFocusOnTrigger(
  trigger: Element | null | undefined,
  active: Element | null = deepActiveElement(),
): boolean {
  if (!trigger || !active) return false;
  if (active === trigger || trigger.contains(active)) return true;
  if (trigger.shadowRoot?.contains(active)) return true;
  let node: Node | null = active;
  while (node) {
    if (node === trigger) return true;
    const root: Node = node.getRootNode();
    if (root instanceof ShadowRoot) {
      if (root.host === trigger) return true;
      node = root.host;
      continue;
    }
    node = node.parentNode;
  }
  return false;
}

/**
 * Build the roving loop: menu/list items + opener.
 * Default `end` matches FAB menu (items… then close FAB) and lets End land on trigger.
 */
export function buildFocusNavLoop(
  items: readonly HTMLElement[],
  trigger?: HTMLElement | null,
  position: FocusNavTriggerPosition = 'end',
): FocusNavLoopEntry[] {
  const entries: FocusNavLoopEntry[] = items.map((el, itemIndex) => ({
    type: 'item',
    el,
    itemIndex,
  }));
  if (!trigger) return entries;
  const slot: FocusNavLoopEntry = { type: 'trigger', el: trigger };
  return position === 'start' ? [slot, ...entries] : [...entries, slot];
}

/** Loop index of the focused entry (−1 if none). */
export function indexInFocusNavLoop(
  loop: readonly FocusNavLoopEntry[],
  active: Element | null = deepActiveElement(),
  event?: Event,
): number {
  if (!loop.length) return -1;
  for (let i = 0; i < loop.length; i++) {
    const entry = loop[i]!;
    if (entry.type === 'trigger') {
      if (isFocusOnTrigger(entry.el, active)) return i;
      if (event?.composedPath().includes(entry.el)) return i;
      continue;
    }
    const el = entry.el;
    if (event?.composedPath().includes(el)) return i;
    if (!active) continue;
    if (el === active || el.contains(active) || el.shadowRoot?.contains(active)) return i;
    if (typeof el.matches === 'function' && el.matches(':focus-within')) return i;
  }
  return -1;
}

function describeLoopIndex(
  loop: readonly FocusNavLoopEntry[],
  index: number,
): Pick<FocusNavResult, 'onTrigger' | 'itemIndex'> {
  const entry = loop[index];
  if (!entry) return { onTrigger: false, itemIndex: -1 };
  if (entry.type === 'trigger') return { onTrigger: true, itemIndex: -1 };
  return { onTrigger: false, itemIndex: entry.itemIndex };
}

/** Focus with `focusVisible` when supported (keyboard roving). */
export function focusElement(el: HTMLElement | null | undefined): void {
  if (!el) return;
  try {
    el.focus({ preventScroll: true, focusVisible: true } as FocusOptions);
  } catch {
    try {
      el.focus({ preventScroll: true });
    } catch {
      el.focus();
    }
  }
}

/** Prefer the painted surface (`button` / `[part=container]`) inside a CE. */
export function focusComposite(el: HTMLElement | null | undefined): void {
  if (!el) return;
  const inner =
    el.shadowRoot?.querySelector<HTMLElement>('button:not([disabled])') ??
    el.shadowRoot?.querySelector<HTMLElement>('[part="container"]') ??
    null;
  focusElement(inner ?? el);
}

function arrowDelta(
  key: string,
  orientation: FocusNavOrientation,
  rtl: boolean,
): -1 | 1 | 0 {
  if (orientation === 'both') {
    if (key === 'ArrowDown' || key === 'ArrowRight') return 1;
    if (key === 'ArrowUp' || key === 'ArrowLeft') return -1;
    return 0;
  }
  if (orientation === 'horizontal') {
    if (key === 'ArrowRight') return rtl ? -1 : 1;
    if (key === 'ArrowLeft') return rtl ? 1 : -1;
    return 0;
  }
  if (key === 'ArrowDown') return 1;
  if (key === 'ArrowUp') return -1;
  return 0;
}

function stepIndex(current: number, delta: -1 | 1, length: number, wrap: boolean): number {
  if (length <= 0) return -1;
  /* No current focus — enter at first (next) or last (prev) */
  if (current < 0) return delta > 0 ? 0 : length - 1;
  if (wrap) {
    const next = current + delta;
    return ((next % length) + length) % length;
  }
  return Math.max(0, Math.min(length - 1, current + delta));
}

function emptyResult(currentIndex: number): FocusNavResult {
  return {
    handled: false,
    kind: 'none',
    nextIndex: currentIndex,
    onTrigger: false,
    itemIndex: -1,
  };
}

/**
 * Pure key → next index. Does not touch the DOM.
 * Pass `loopLength` = items.length, or items.length + 1 when a trigger is in the loop.
 * Use {@link describeFocusNavIndex} / {@link handleFocusNavKey} to map trigger slots.
 */
export function resolveFocusNavKey(
  e: Pick<KeyboardEvent, 'key' | 'shiftKey'>,
  currentIndex: number,
  length: number,
  opts: FocusNavOptions = {},
): FocusNavResult {
  const orientation = opts.orientation ?? 'both';
  const wrap = opts.wrap ?? true;
  const homeEnd = opts.homeEnd ?? true;
  const tab = opts.tab ?? false;
  const rtl = opts.rtl ?? false;

  if (length <= 0) return emptyResult(currentIndex);

  const key = e.key;
  const withMeta = (partial: Omit<FocusNavResult, 'onTrigger' | 'itemIndex'>): FocusNavResult => ({
    ...partial,
    onTrigger: false,
    itemIndex: -1,
  });

  if (homeEnd && key === 'Home') {
    return withMeta({ handled: true, kind: 'home', nextIndex: 0 });
  }
  if (homeEnd && key === 'End') {
    return withMeta({ handled: true, kind: 'end', nextIndex: length - 1 });
  }

  if (tab && key === 'Tab') {
    const delta: -1 | 1 = e.shiftKey ? -1 : 1;
    const nextIndex = stepIndex(currentIndex, delta, length, wrap);
    return withMeta({
      handled: true,
      kind: delta > 0 ? 'next' : 'prev',
      nextIndex,
    });
  }

  if (!ARROW_KEYS.has(key)) return emptyResult(currentIndex);

  const delta = arrowDelta(key, orientation, rtl);
  if (delta === 0) return emptyResult(currentIndex);

  const nextIndex = stepIndex(currentIndex, delta, length, wrap);
  if (nextIndex < 0 || (!wrap && nextIndex === currentIndex && currentIndex >= 0)) {
    if (!wrap && currentIndex >= 0) {
      const atStart = currentIndex === 0 && delta < 0;
      const atEnd = currentIndex === length - 1 && delta > 0;
      if (atStart || atEnd) {
        return withMeta({
          handled: true,
          kind: delta > 0 ? 'next' : 'prev',
          nextIndex: currentIndex,
        });
      }
    }
    return emptyResult(currentIndex);
  }

  return withMeta({
    handled: true,
    kind: delta > 0 ? 'next' : 'prev',
    nextIndex,
  });
}

/** Attach `onTrigger` / `itemIndex` for a resolved loop index. */
export function annotateFocusNavResult(
  result: FocusNavResult,
  loop: readonly FocusNavLoopEntry[],
): FocusNavResult {
  if (!result.handled || result.nextIndex < 0) return result;
  return { ...result, ...describeLoopIndex(loop, result.nextIndex) };
}

/**
 * High-level helper: resolve key + focus the target (item or trigger).
 * Pass `trigger` so the opener stays in the loop and can re-close the overlay.
 */
export function handleFocusNavKey(
  e: KeyboardEvent,
  items: readonly HTMLElement[],
  opts: FocusNavOptions & {
    /** Opener / close control included in the loop (FAB, menu trigger…). */
    trigger?: HTMLElement | null;
    /** @default 'end' — End key lands on trigger (FAB menu pattern). */
    triggerPosition?: FocusNavTriggerPosition;
    /** Override current loop index. */
    currentIndex?: number;
    focusItem?: (el: HTMLElement, itemIndex: number) => void;
    focusTrigger?: (el: HTMLElement) => void;
  } = {},
): FocusNavResult {
  const loop = buildFocusNavLoop(items, opts.trigger, opts.triggerPosition ?? 'end');
  if (!loop.length) return emptyResult(-1);

  const current =
    opts.currentIndex ??
    indexInFocusNavLoop(loop, deepActiveElement(), e);

  const raw = resolveFocusNavKey(e, current, loop.length, opts);
  const result = annotateFocusNavResult(raw, loop);
  if (!result.handled) return result;

  const entry = loop[result.nextIndex];
  if (!entry) return result;

  if (entry.type === 'trigger') {
    if (opts.focusTrigger) opts.focusTrigger(entry.el);
    else focusComposite(entry.el);
  } else if (opts.focusItem) {
    opts.focusItem(entry.el, entry.itemIndex);
  } else {
    focusComposite(entry.el);
  }
  return result;
}