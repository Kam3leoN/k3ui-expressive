/**
 * K3ui drag-and-drop — shared primitives for any component.
 *
 * Layers:
 * - {@link attachDrag} (drag.ts) — pan / swipe (sheets, drawers)
 * - {@link attachSortable} — reorder siblings in a list
 * - {@link attachDraggable} + {@link attachDroppable} — free source → drop zone
 *
 * ```ts
 * // Reorder chips
 * attachSortable(set, {
 *   itemSelector: 'k3-chip',
 *   onReorder: ({ from, to, items }) => { ... },
 * });
 *
 * // Cross-surface drop
 * attachDraggable(item, { type: 'k3/chip', data: () => ({ id }) });
 * attachDroppable(zone, { accept: ['k3/chip'], onDrop: (d) => { ... } });
 * ```
 */

import { attachDrag, type DragAxis, type DragController } from './drag.js';

/* ── Shared session (cross-zone drops) ───────────────────────────────────── */

export interface DndPayload {
  /** MIME-like type, e.g. `k3/chip` · `k3/list-item` */
  type: string;
  data: unknown;
  source: HTMLElement;
}

let activePayload: DndPayload | null = null;
const droppables = new Set<DroppableController>();

export function getActiveDndPayload(): DndPayload | null {
  return activePayload;
}

function setActivePayload(p: DndPayload | null): void {
  activePayload = p;
  document.documentElement.toggleAttribute('data-k3-dnd', p != null);
}

/* ── Ghost helper ────────────────────────────────────────────────────────── */

function createGhost(source: HTMLElement): HTMLElement {
  const rect = source.getBoundingClientRect();
  const ghost = source.cloneNode(true) as HTMLElement;
  ghost.removeAttribute('id');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.classList.add('k3-dnd-ghost');
  ghost.style.cssText = [
    'position:fixed',
    'z-index:10000',
    'pointer-events:none',
    'margin:0',
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    `left:${rect.left}px`,
    `top:${rect.top}px`,
    'opacity:0.92',
    'box-shadow:var(--k3-sys-elevation-level3, 0 4px 8px rgb(0 0 0 / 0.2))',
    'border-radius:inherit',
    'transition:none',
  ].join(';');
  document.body.appendChild(ghost);
  return ghost;
}

function moveGhost(ghost: HTMLElement, x: number, y: number, ox: number, oy: number): void {
  ghost.style.left = `${x - ox}px`;
  ghost.style.top = `${y - oy}px`;
}

function destroyGhost(ghost: HTMLElement | null): void {
  ghost?.remove();
}

/* ── Sortable ────────────────────────────────────────────────────────────── */

export interface SortableDetail {
  item: HTMLElement;
  index: number;
  container: HTMLElement;
  dx: number;
  dy: number;
  event: PointerEvent;
  active: boolean;
}

export interface SortableReorderDetail extends SortableDetail {
  from: number;
  to: number;
  items: HTMLElement[];
}

export interface SortableOptions {
  /** Items to reorder (default `:scope > *`) */
  itemSelector?: string;
  axis?: DragAxis;
  threshold?: number;
  disabled?: boolean | (() => boolean);
  /** Attr on the dragged item (default `dragging`) */
  draggingAttr?: string;
  /** Attr on container while sorting (default `sorting`) */
  sortingAttr?: string;
  /** Floating clone under pointer (default true) */
  ghost?: boolean;
  canStart?: (item: HTMLElement, e: PointerEvent) => boolean;
  /**
   * Axis / gesture lock after threshold — same contract as {@link DragOptions.shouldActivate}.
   * Receives raw dx/dy so callers can prefer vertical reorder vs horizontal dismiss.
   */
  shouldActivate?: (d: SortableDetail) => boolean;
  onStart?: (d: SortableDetail) => void;
  /** Pointer crossed drag threshold — item is floating. */
  onActivate?: (d: SortableDetail) => void;
  onMove?: (d: SortableDetail) => void;
  onReorder?: (d: SortableReorderDetail) => void;
  onEnd?: (d: SortableDetail) => void;
}

export interface SortableController {
  destroy(): void;
  setEnabled(enabled: boolean): void;
  get enabled(): boolean;
  /** Rebind after dynamic children change */
  refresh(): void;
}

function resolveDisabled(d: boolean | (() => boolean) | undefined): boolean {
  if (d == null) return false;
  return typeof d === 'function' ? d() : d;
}

function itemsOf(container: HTMLElement, selector: string): HTMLElement[] {
  return [...container.querySelectorAll(selector)].filter(
    (n): n is HTMLElement => n instanceof HTMLElement && n.parentElement === container,
  );
}

/**
 * `Element.closest(':scope > x')` never matches — `:scope` is the candidate itself,
 * so `:scope > x` means “self’s child”. Strip the combinator for closest(); keep the
 * full selector for querySelectorAll / parent checks.
 */
function closestItemSelector(itemSelector: string): string {
  return itemSelector.replace(/^:scope\s*>\s*/i, '').trim() || '*';
}

/** Resolve the sortable item from a pointer event (handles slotted WC hosts). */
function itemFromEvent(
  e: PointerEvent,
  container: HTMLElement,
  itemSelector: string,
): HTMLElement | null {
  const local = closestItemSelector(itemSelector);
  const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
  for (const n of path) {
    if (!(n instanceof HTMLElement)) continue;
    if (n.parentElement !== container) continue;
    if (n.matches(local)) return n;
  }
  const t = e.target;
  if (!(t instanceof Element)) return null;
  const hit = t.closest(local);
  if (!(hit instanceof HTMLElement) || hit.parentElement !== container) return null;
  if (!itemsOf(container, itemSelector).includes(hit)) return null;
  return hit;
}

/**
 * Pointer sortable — reorder light-DOM children of `container`.
 * Safe for slotted web-component children (e.g. `k3-chip` in `k3-chip-set`).
 */
export function attachSortable(
  container: HTMLElement,
  options: SortableOptions = {},
): SortableController {
  const itemSelector = options.itemSelector ?? ':scope > *';
  const axis = options.axis ?? 'both';
  const threshold = options.threshold ?? 6;
  const draggingAttr = options.draggingAttr ?? 'dragging';
  const sortingAttr = options.sortingAttr ?? 'sorting';
  const useGhost = options.ghost !== false;

  let enabled = true;
  let drag: DragController | null = null;
  let item: HTMLElement | null = null;
  let fromIndex = -1;
  let ghost: HTMLElement | null = null;
  let grabX = 0;
  let grabY = 0;
  let lastTo = -1;

  const refresh = (): void => {
    drag?.destroy();
    drag = attachDrag(container, {
      axis,
      threshold,
      touchAction: axis === 'y' ? 'pan-x' : axis === 'x' ? 'pan-y' : 'none',
      disabled: () => !enabled || resolveDisabled(options.disabled),
      canStart: (e) => {
        const t = itemFromEvent(e, container, itemSelector);
        if (!t) return false;
        if (options.canStart && !options.canStart(t, e)) return false;
        item = t;
        fromIndex = itemsOf(container, itemSelector).indexOf(t);
        lastTo = fromIndex;
        const r = t.getBoundingClientRect();
        grabX = e.clientX - r.left;
        grabY = e.clientY - r.top;
        return fromIndex >= 0;
      },
      shouldActivate: (d) => {
        if (!item || !options.shouldActivate) return true;
        return options.shouldActivate({
          item,
          index: fromIndex,
          container,
          dx: d.dx,
          dy: d.dy,
          event: d.event,
          active: false,
        });
      },
      onStart: (d) => {
        if (!item) return;
        options.onStart?.({
          item,
          index: fromIndex,
          container,
          dx: 0,
          dy: 0,
          event: d.event,
          active: false,
        });
      },
      onActivate: (d) => {
        if (!item) return;
        container.setAttribute(sortingAttr, '');
        item.setAttribute(draggingAttr, '');
        if ('dragged' in item) {
          try {
            (item as HTMLElement & { dragged: boolean }).dragged = true;
          } catch {
            /* ignore */
          }
        }
        if (useGhost) ghost = createGhost(item);
        const detail: SortableDetail = {
          item,
          index: fromIndex,
          container,
          dx: d.dx,
          dy: d.dy,
          event: d.event,
          active: true,
        };
        options.onActivate?.(detail);
        options.onMove?.(detail);
      },
      onMove: (d) => {
        if (!item || !d.active) return;
        if (ghost) moveGhost(ghost, d.x, d.y, grabX, grabY);

        const list = itemsOf(container, itemSelector).filter((el) => el !== item);
        const to = insertIndex(list, d.x, d.y, axis);
        /* Map to index among all items including dragged */
        const all = itemsOf(container, itemSelector);
        let targetIndex = to;
        const cur = all.indexOf(item);
        if (cur >= 0 && to > cur) targetIndex = to + 1;

        if (targetIndex !== lastTo && targetIndex >= 0) {
          const ref = all[targetIndex] ?? null;
          if (ref && ref !== item) {
            container.insertBefore(item, ref);
          } else if (targetIndex >= all.length) {
            container.appendChild(item);
          }
          lastTo = itemsOf(container, itemSelector).indexOf(item);
        }

        options.onMove?.({
          item,
          index: lastTo,
          container,
          dx: d.dx,
          dy: d.dy,
          event: d.event,
          active: true,
        });
      },
      onEnd: (d) => {
        if (!item) return;
        const to = itemsOf(container, itemSelector).indexOf(item);
        destroyGhost(ghost);
        ghost = null;
        item.removeAttribute(draggingAttr);
        if ('dragged' in item) {
          try {
            (item as HTMLElement & { dragged: boolean }).dragged = false;
          } catch {
            /* ignore */
          }
        }
        container.removeAttribute(sortingAttr);

        const detail: SortableDetail = {
          item,
          index: to,
          container,
          dx: d.dx,
          dy: d.dy,
          event: d.event,
          active: d.active,
        };

        if (d.active && fromIndex !== to && to >= 0) {
          options.onReorder?.({
            ...detail,
            from: fromIndex,
            to,
            items: itemsOf(container, itemSelector),
          });
        }
        options.onEnd?.(detail);
        item = null;
        fromIndex = -1;
        lastTo = -1;
      },
    });
  };

  refresh();

  return {
    destroy() {
      destroyGhost(ghost);
      ghost = null;
      drag?.destroy();
      drag = null;
      enabled = false;
      container.removeAttribute(sortingAttr);
    },
    setEnabled(v: boolean) {
      enabled = v;
      drag?.setEnabled(v);
    },
    get enabled() {
      return enabled;
    },
    refresh,
  };
}

/** Pick insert index by comparing pointer to item midpoints. */
function insertIndex(
  siblings: HTMLElement[],
  x: number,
  y: number,
  axis: DragAxis,
): number {
  if (!siblings.length) return 0;
  for (let i = 0; i < siblings.length; i++) {
    const r = siblings[i]!.getBoundingClientRect();
    const midX = r.left + r.width / 2;
    const midY = r.top + r.height / 2;
    if (axis === 'x') {
      if (x < midX) return i;
    } else if (axis === 'y') {
      if (y < midY) return i;
    } else if (x < midX && y < midY + r.height) {
      /* both — prefer horizontal in a wrapping flex row */
      if (y >= r.top && y <= r.bottom && x < midX) return i;
      if (y < midY) return i;
    }
  }
  return siblings.length;
}

/* ── Draggable source ────────────────────────────────────────────────────── */

export interface DraggableOptions {
  type: string;
  data?: unknown | (() => unknown);
  axis?: DragAxis;
  threshold?: number;
  disabled?: boolean | (() => boolean);
  ghost?: boolean;
  draggingAttr?: string;
  canStart?: (e: PointerEvent) => boolean;
  onStart?: (p: DndPayload) => void;
  onEnd?: (p: DndPayload, dropped: boolean) => void;
}

export interface DraggableController {
  destroy(): void;
  setEnabled(enabled: boolean): void;
}

/**
 * Make `el` a drag source that publishes a typed payload for droppables.
 */
export function attachDraggable(
  el: HTMLElement,
  options: DraggableOptions,
): DraggableController {
  const draggingAttr = options.draggingAttr ?? 'dragging';
  const useGhost = options.ghost !== false;
  let enabled = true;
  let ghost: HTMLElement | null = null;
  let grabX = 0;
  let grabY = 0;
  let dropped = false;
  let payload: DndPayload | null = null;

  const drag = attachDrag(el, {
    axis: options.axis ?? 'both',
    threshold: options.threshold ?? 6,
    touchAction: 'none',
    disabled: () => !enabled || resolveDisabled(options.disabled),
    canStart: options.canStart,
    onStart: (d) => {
      dropped = false;
      const r = el.getBoundingClientRect();
      grabX = d.x - r.left;
      grabY = d.y - r.top;
      const data =
        typeof options.data === 'function' ? (options.data as () => unknown)() : options.data;
      payload = { type: options.type, data, source: el };
    },
    onActivate: () => {
      if (!payload) return;
      setActivePayload(payload);
      el.setAttribute(draggingAttr, '');
      if (useGhost) ghost = createGhost(el);
      options.onStart?.(payload);
      for (const z of droppables) z._notifyEnterCheck();
    },
    onMove: (d) => {
      if (!d.active || !payload) return;
      if (ghost) moveGhost(ghost, d.x, d.y, grabX, grabY);
      for (const z of droppables) z._notifyOver(d.x, d.y, payload);
    },
    onEnd: (d) => {
      destroyGhost(ghost);
      ghost = null;
      el.removeAttribute(draggingAttr);
      if (d.active && payload) {
        for (const z of droppables) {
          if (z._tryDrop(d.x, d.y, payload)) {
            dropped = true;
            break;
          }
        }
        options.onEnd?.(payload, dropped);
      }
      setActivePayload(null);
      for (const z of droppables) z._clearHover();
      payload = null;
    },
  });

  return {
    destroy() {
      destroyGhost(ghost);
      drag.destroy();
      enabled = false;
    },
    setEnabled(v: boolean) {
      enabled = v;
      drag.setEnabled(v);
    },
  };
}

/* ── Droppable zone ──────────────────────────────────────────────────────── */

export interface DroppableDetail {
  payload: DndPayload;
  x: number;
  y: number;
  zone: HTMLElement;
}

export interface DroppableOptions {
  /** Accepted payload types, or predicate */
  accept?: string[] | ((type: string, data: unknown) => boolean);
  disabled?: boolean | (() => boolean);
  /** Attr while a compatible payload hovers (default `drop-target`) */
  activeAttr?: string;
  onDragEnter?: (d: DroppableDetail) => void;
  onDragOver?: (d: DroppableDetail) => void;
  onDragLeave?: (d: DroppableDetail) => void;
  onDrop?: (d: DroppableDetail) => void;
}

export interface DroppableController {
  destroy(): void;
  setEnabled(enabled: boolean): void;
  /** @internal */
  _notifyEnterCheck(): void;
  /** @internal */
  _notifyOver(x: number, y: number, payload: DndPayload): void;
  /** @internal */
  _tryDrop(x: number, y: number, payload: DndPayload): boolean;
  /** @internal */
  _clearHover(): void;
}

function accepts(
  opt: DroppableOptions,
  type: string,
  data: unknown,
): boolean {
  const a = opt.accept;
  if (a == null) return true;
  if (typeof a === 'function') return a(type, data);
  return a.includes(type);
}

/**
 * Register `zone` as a drop target for typed draggable payloads.
 */
export function attachDroppable(
  zone: HTMLElement,
  options: DroppableOptions = {},
): DroppableController {
  const activeAttr = options.activeAttr ?? 'drop-target';
  let enabled = true;
  let hovering = false;
  let lastPayload: DndPayload | null = null;

  const hit = (x: number, y: number): boolean => {
    const r = zone.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  const ctrl: DroppableController = {
    destroy() {
      droppables.delete(ctrl);
      zone.removeAttribute(activeAttr);
      enabled = false;
    },
    setEnabled(v: boolean) {
      enabled = v;
      if (!v) ctrl._clearHover();
    },
    _notifyEnterCheck() {
      /* no-op until move */
    },
    _notifyOver(x, y, payload) {
      if (!enabled || resolveDisabled(options.disabled)) return;
      if (!accepts(options, payload.type, payload.data)) return;
      const inside = hit(x, y);
      const detail: DroppableDetail = { payload, x, y, zone };
      if (inside && !hovering) {
        hovering = true;
        lastPayload = payload;
        zone.setAttribute(activeAttr, '');
        options.onDragEnter?.(detail);
      } else if (inside && hovering) {
        options.onDragOver?.(detail);
      } else if (!inside && hovering) {
        hovering = false;
        zone.removeAttribute(activeAttr);
        options.onDragLeave?.(detail);
        lastPayload = null;
      }
    },
    _tryDrop(x, y, payload) {
      if (!enabled || resolveDisabled(options.disabled)) return false;
      if (!accepts(options, payload.type, payload.data)) return false;
      if (!hit(x, y)) return false;
      options.onDrop?.({ payload, x, y, zone });
      ctrl._clearHover();
      return true;
    },
    _clearHover() {
      if (hovering && lastPayload) {
        options.onDragLeave?.({
          payload: lastPayload,
          x: 0,
          y: 0,
          zone,
        });
      }
      hovering = false;
      lastPayload = null;
      zone.removeAttribute(activeAttr);
    },
  };

  droppables.add(ctrl);
  return ctrl;
}

export const dnd = {
  attachSortable,
  attachDraggable,
  attachDroppable,
  getActivePayload: getActiveDndPayload,
};

export default dnd;