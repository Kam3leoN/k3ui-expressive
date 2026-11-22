/**
 * Keyboard utility — press / release tracking, chords (2–3+ keys), bindings.
 *
 * Key ids are lowercase tokens: `a`, `space`, `arrowleft`, `control`, `shift`,
 * `alt`, `meta`, `escape`, `enter`, `tab`, `f1`…
 *
 * Chord strings use `+`: `control+shift+k`, `shift+arrowright`.
 */

export type KeyId = string;

export type KeyboardPhase = 'down' | 'up';

export interface KeyboardKeyDetail {
  key: KeyId;
  code: string;
  phase: KeyboardPhase;
  /** All keys currently held (after this event). */
  pressed: ReadonlySet<KeyId>;
  /** Modifier snapshot */
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  repeat: boolean;
  event: KeyboardEvent;
}

export interface KeyboardChordDetail {
  chord: KeyId[];
  chordId: string;
  pressed: ReadonlySet<KeyId>;
  event: KeyboardEvent;
}

type KeyHandler = (detail: KeyboardKeyDetail) => void;
type ChordHandler = (detail: KeyboardChordDetail) => void;

export interface AttachKeyboardOptions {
  /** Skip when focus is in a field / editable / slider. Default false. */
  ignoreFields?: boolean;
  /** Extra CSS selectors that block handling when focused inside. */
  ignoreSelectors?: string;
  /** When false, ignore events. */
  enabled?: () => boolean;
  /**
   * Track modifier keys from `e.ctrlKey` etc. even without a dedicated
   * keydown (default true).
   */
  syncModifiers?: boolean;
}

export interface BindChordOptions extends AttachKeyboardOptions {
  /** Fire on keydown (default) or keyup of the last chord key. */
  phase?: KeyboardPhase;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  /** Require exact set match (no extra keys). Default false (superset OK). */
  exact?: boolean;
}

const FIELD =
  'input,textarea,select,[contenteditable="true"],[contenteditable=""],[role="slider"],[role="spinbutton"],[role="textbox"]';

const ALIASES: Record<string, KeyId> = {
  ' ': 'space',
  spacebar: 'space',
  space: 'space',
  esc: 'escape',
  escape: 'escape',
  return: 'enter',
  enter: 'enter',
  del: 'delete',
  delete: 'delete',
  ctrl: 'control',
  control: 'control',
  cmd: 'meta',
  command: 'meta',
  meta: 'meta',
  win: 'meta',
  option: 'alt',
  alt: 'alt',
  shift: 'shift',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  arrowup: 'arrowup',
  arrowdown: 'arrowdown',
  arrowleft: 'arrowleft',
  arrowright: 'arrowright',
};

/** Normalize a KeyboardEvent or raw string into a stable KeyId. */
export function normalizeKey(input: string | KeyboardEvent): KeyId {
  if (typeof input !== 'string') {
    const e = input;
    if (e.key === ' ') return 'space';
    const fromCode = e.code?.startsWith('Key')
      ? e.code.slice(3).toLowerCase()
      : e.code?.startsWith('Digit')
        ? e.code.slice(5)
        : '';
    const raw = (e.key || fromCode || e.code || '').toLowerCase();
    return ALIASES[raw] ?? raw;
  }
  if (input === ' ' || input === '\u00a0') return 'space';
  const raw = input.trim().toLowerCase();
  return ALIASES[raw] ?? raw;
}

/** Parse `ctrl+shift+k` → sorted unique KeyIds (modifiers first by convention). */
export function parseChord(chord: string | readonly KeyId[]): KeyId[] {
  const parts =
    typeof chord === 'string'
      ? chord.split('+').map((p) => normalizeKey(p))
      : [...chord].map((p) => normalizeKey(p));
  const uniq = [...new Set(parts.filter(Boolean))];
  const order = ['control', 'alt', 'shift', 'meta'];
  uniq.sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia >= 0 || ib >= 0) {
      if (ia < 0) return 1;
      if (ib < 0) return -1;
      return ia - ib;
    }
    return a.localeCompare(b);
  });
  return uniq;
}

export function chordId(keys: readonly KeyId[]): string {
  return parseChord([...keys]).join('+');
}

/** True if every chord key is currently pressed. */
export function matchChord(
  pressed: ReadonlySet<KeyId>,
  chord: string | readonly KeyId[],
  exact = false,
): boolean {
  const keys = parseChord(chord);
  if (!keys.length) return false;
  for (const k of keys) {
    if (!pressed.has(k)) return false;
  }
  if (exact && pressed.size !== keys.length) return false;
  return true;
}

function shouldIgnore(
  target: EventTarget | null,
  ignoreFields: boolean,
  extra?: string,
): boolean {
  if (!(target instanceof Element)) return false;
  if (ignoreFields && target.closest(FIELD)) return true;
  if (extra && target.closest(extra)) return true;
  return false;
}

function syncMods(pressed: Set<KeyId>, e: KeyboardEvent): void {
  const set = (id: KeyId, on: boolean) => {
    if (on) pressed.add(id);
    else pressed.delete(id);
  };
  set('control', e.ctrlKey);
  set('shift', e.shiftKey);
  set('alt', e.altKey);
  set('meta', e.metaKey);
}

export interface KeyboardController {
  readonly pressed: ReadonlySet<KeyId>;
  isDown(key: string): boolean;
  /** Subscribe to key down/up. Returns unsubscribe. */
  on(type: 'down' | 'up', handler: KeyHandler): () => void;
  /** Subscribe when a chord becomes fully held (on last keydown). */
  onChord(chord: string | readonly KeyId[], handler: ChordHandler): () => void;
  destroy(): void;
}

/**
 * Attach keyboard tracking to `document` or an element.
 */
export function attachKeyboard(
  target: Document | HTMLElement = document,
  options: AttachKeyboardOptions = {},
): KeyboardController {
  const pressed = new Set<KeyId>();
  const downHandlers = new Set<KeyHandler>();
  const upHandlers = new Set<KeyHandler>();
  const chordWatchers = new Map<string, { keys: KeyId[]; handlers: Set<ChordHandler> }>();
  const ignoreFields = options.ignoreFields ?? false;
  const syncModifiers = options.syncModifiers ?? true;
  const enabled = options.enabled ?? (() => true);

  const emitKey = (phase: KeyboardPhase, e: KeyboardEvent, key: KeyId) => {
    const detail: KeyboardKeyDetail = {
      key,
      code: e.code,
      phase,
      pressed,
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey,
      meta: e.metaKey,
      repeat: e.repeat,
      event: e,
    };
    const set = phase === 'down' ? downHandlers : upHandlers;
    for (const h of set) h(detail);
  };

  const onDown = (e: KeyboardEvent) => {
    if (!enabled()) return;
    if (shouldIgnore(e.target, ignoreFields, options.ignoreSelectors)) return;
    const key = normalizeKey(e);
    if (syncModifiers) syncMods(pressed, e);
    const wasDown = pressed.has(key);
    /* Snapshot before add — chord edge detection */
    const incomplete = [...chordWatchers.values()].filter(
      (w) => !matchChord(pressed, w.keys),
    );
    pressed.add(key);
    if (!wasDown || !e.repeat) emitKey('down', e, key);

    for (const watch of incomplete) {
      if (!matchChord(pressed, watch.keys)) continue;
      if (e.repeat && wasDown) continue;
      const detail: KeyboardChordDetail = {
        chord: watch.keys,
        chordId: chordId(watch.keys),
        pressed,
        event: e,
      };
      for (const h of watch.handlers) h(detail);
    }
  };

  const onUp = (e: KeyboardEvent) => {
    if (!enabled()) return;
    const key = normalizeKey(e);
    if (syncModifiers) syncMods(pressed, e);
    if (pressed.has(key)) {
      pressed.delete(key);
      if (!shouldIgnore(e.target, ignoreFields, options.ignoreSelectors)) {
        emitKey('up', e, key);
      }
    }
  };

  const onBlur = () => {
    pressed.clear();
  };

  target.addEventListener('keydown', onDown as EventListener);
  target.addEventListener('keyup', onUp as EventListener);
  window.addEventListener('blur', onBlur);

  return {
    get pressed() {
      return pressed;
    },
    isDown(key: string) {
      return pressed.has(normalizeKey(key));
    },
    on(type, handler) {
      const set = type === 'down' ? downHandlers : upHandlers;
      set.add(handler);
      return () => set.delete(handler);
    },
    onChord(chord, handler) {
      const keys = parseChord(chord);
      const id = chordId(keys);
      let watch = chordWatchers.get(id);
      if (!watch) {
        watch = { keys, handlers: new Set() };
        chordWatchers.set(id, watch);
      }
      watch.handlers.add(handler);
      return () => {
        watch!.handlers.delete(handler);
        if (!watch!.handlers.size) chordWatchers.delete(id);
      };
    },
    destroy() {
      target.removeEventListener('keydown', onDown as EventListener);
      target.removeEventListener('keyup', onUp as EventListener);
      window.removeEventListener('blur', onBlur);
      downHandlers.clear();
      upHandlers.clear();
      chordWatchers.clear();
      pressed.clear();
    },
  };
}

/**
 * Bind one chord to a callback. Returns unsubscribe.
 *
 * @example
 * bindChord(document, 'control+shift+k', () => console.log('chord'));
 * bindChord(el, 'shift+arrowright', seekFwd, { ignoreFields: true });
 */
export function bindChord(
  target: Document | HTMLElement,
  chord: string | readonly KeyId[],
  handler: (detail: KeyboardChordDetail) => void,
  options: BindChordOptions = {},
): () => void {
  const keys = parseChord(chord);
  const phase = options.phase ?? 'down';
  const preventDefault = options.preventDefault ?? true;
  const kb = attachKeyboard(target, options);
  let off: () => void;

  if (phase === 'down') {
    off = kb.onChord(keys, (d) => {
      if (options.exact && d.pressed.size !== keys.length) return;
      if (preventDefault) d.event.preventDefault();
      if (options.stopPropagation) d.event.stopPropagation();
      handler(d);
    });
  } else {
    off = kb.on('up', (d) => {
      /* Chord was held, releasing one of its keys */
      if (!keys.includes(d.key)) return;
      /* Reconstruct: before up we already deleted — check others still down
         is wrong; fire if the released key was part of chord and all others
         are still down (chord was active). */
      const others = keys.filter((k) => k !== d.key);
      if (!others.every((k) => d.pressed.has(k) || k === d.key)) {
        /* After up, pressed no longer has d.key — require others down */
        if (!others.every((k) => kb.isDown(k))) return;
      }
      if (options.exact && d.pressed.size + 1 !== keys.length) return;
      if (preventDefault) d.event.preventDefault();
      if (options.stopPropagation) d.event.stopPropagation();
      handler({
        chord: keys,
        chordId: chordId(keys),
        pressed: d.pressed,
        event: d.event,
      });
    });
  }

  return () => {
    off();
    kb.destroy();
  };
}

/**
 * Bind many chords at once (one shared keyboard attachment).
 * Map keys are chord strings (`' '`, `'control+k'`, `'arrowright'`).
 */
export function bindChords(
  target: Document | HTMLElement,
  map: Record<string, (detail: KeyboardChordDetail) => void>,
  options: BindChordOptions = {},
): () => void {
  const kb = attachKeyboard(target, options);
  const phase = options.phase ?? 'down';
  const preventDefault = options.preventDefault ?? true;
  const offs: Array<() => void> = [];

  for (const [chord, handler] of Object.entries(map)) {
    const keys = parseChord(chord);
    if (phase === 'down') {
      offs.push(
        kb.onChord(keys, (d) => {
          if (options.exact && d.pressed.size !== keys.length) return;
          if (preventDefault) d.event.preventDefault();
          if (options.stopPropagation) d.event.stopPropagation();
          handler(d);
        }),
      );
    } else {
      offs.push(
        kb.on('up', (d) => {
          if (!keys.includes(d.key)) return;
          const others = keys.filter((k) => k !== d.key);
          if (!others.every((k) => kb.isDown(k))) return;
          if (preventDefault) d.event.preventDefault();
          if (options.stopPropagation) d.event.stopPropagation();
          handler({
            chord: keys,
            chordId: chordId(keys),
            pressed: d.pressed,
            event: d.event,
          });
        }),
      );
    }
  }

  return () => {
    offs.forEach((fn) => fn());
    kb.destroy();
  };
}

/** Namespace for `K3UI.keyboard`. */
export const keyboard = {
  attach: attachKeyboard,
  bindChord,
  bindChords,
  normalizeKey,
  parseChord,
  matchChord,
  chordId,
} as const;
