/**
 * Media keyboard shortcuts — built on {@link bindChords} / `K3UI.keyboard`.
 * Space/K · ←/→ · N/P · M. Skips fields like a native player.
 */

import { bindChords, type BindChordOptions } from './keyboard.js';

export interface MediaHotkeyHandlers {
  /** Space / K — play ↔ pause */
  toggle?: () => void;
  /** ArrowLeft / ArrowRight — seek by seconds (negative = rewind) */
  seekBy?: (deltaSec: number) => void;
  next?: () => void;
  prev?: () => void;
  mute?: () => void;
}

export interface MediaHotkeyOptions {
  /** Default ±5 s for arrow seek. */
  seekStepSec?: number;
  enabled?: () => boolean;
  target?: Document | HTMLElement;
}

/**
 * Bind media hotkeys via the keyboard utility. Returns unsubscribe.
 *
 * @example
 * bindMediaHotkeys({
 *   toggle: () => player.toggle(),
 *   seekBy: (d) => player.seek(player.currentTime + d),
 *   next: () => player.next(),
 *   prev: () => player.prev(),
 *   mute: () => player.setMusicMuted(!player.muted),
 * }, { enabled: () => player.hotkeys });
 */
export function bindMediaHotkeys(
  handlers: MediaHotkeyHandlers,
  options: MediaHotkeyOptions = {},
): () => void {
  const seekStep = options.seekStepSec ?? 5;
  const target = options.target ?? document;
  const map: Record<string, () => void> = {};

  if (handlers.toggle) {
    map['space'] = handlers.toggle;
    map['k'] = handlers.toggle;
  }
  if (handlers.seekBy) {
    map['arrowright'] = () => handlers.seekBy!(seekStep);
    map['arrowleft'] = () => handlers.seekBy!(-seekStep);
  }
  if (handlers.next) map['n'] = handlers.next;
  if (handlers.prev) map['p'] = handlers.prev;
  if (handlers.mute) map['m'] = handlers.mute;

  const chordOpts: BindChordOptions = {
    ignoreFields: true,
    enabled: options.enabled,
    preventDefault: true,
  };

  /* Space on a focused button should not steal activation — skip when target is button/a */
  const base = bindChords(
    target,
    Object.fromEntries(
      Object.entries(map).map(([chord, fn]) => [
        chord,
        (d: { event: KeyboardEvent; chordId: string }) => {
          if (
            chord === 'space' &&
            (d.event.target as HTMLElement | null)?.closest?.('button,a')
          ) {
            return;
          }
          fn();
        },
      ]),
    ),
    chordOpts,
  );

  return base;
}
