import {
  detectGesture,
  phase,
  tap,
  longPress,
  swipe,
  pan,
  rotate,
  scale,
  repeat,
  sequence,
  defineGestureElements,
  type PanGestureDetail,
  type RotateGestureDetail,
  type ScaleGestureDetail,
  type SwipeGestureDetail,
  type RepeatGestureDetail,
} from '../src/core/gestures/index.js';
import {
  attachSortable,
  attachDraggable,
  attachDroppable,
} from '../src/core/dnd.js';
import { attachKeyboard, bindChords } from '../src/core/keyboard.js';
import { attachMouse } from '../src/core/mouse.js';

let wired = false;

function log(id: string, msg: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

/** Wire gesture + DnD playground demos once. */
export function wireUtilityDemos(): void {
  if (wired) return;
  wired = true;
  defineGestureElements();

  const tapEl = document.getElementById('g-tap');
  if (tapEl) {
    detectGesture(
      tapEl,
      tap(
        phase({
          onEnd: () => {
            log('g-tap-log', `tap @ ${new Date().toLocaleTimeString()}`);
            tapEl.classList.add('is-flash');
            setTimeout(() => tapEl.classList.remove('is-flash'), 200);
          },
        }),
      ),
    );
  }

  const longEl = document.getElementById('g-long');
  if (longEl) {
    detectGesture(
      longEl,
      longPress(
        phase({
          onStart: () => log('g-long-log', 'holding…'),
          onEnd: (d) => log('g-long-log', `long-press ${Math.round(d.duration)} ms`),
          onCancel: () => log('g-long-log', 'cancelled'),
        }),
      ),
    );
  }

  const swipeEl = document.getElementById('g-swipe');
  if (swipeEl) {
    detectGesture(
      swipeEl,
      swipe(
        phase({
          onEnd: (d) => {
            const s = d as SwipeGestureDetail;
            log(
              'g-swipe-log',
              `${s.direction} · ${s.displacement.toFixed(0)} px · ${s.speed.toFixed(2)} px/ms`,
            );
          },
          onCancel: () => log('g-swipe-log', 'not a swipe'),
        }),
      ),
    );
  }

  const panEl = document.getElementById('g-pan');
  const panDot = document.getElementById('g-pan-dot');
  if (panEl && panDot) {
    let ox = 0;
    let oy = 0;
    detectGesture(
      panEl,
      pan(
        { activationMode: 'move', minDisplacement: 2 },
        phase({
          onUpdate: (d) => {
            const p = d as PanGestureDetail;
            panDot.style.transform = `translate(${ox + p.totalDeltaX}px, ${oy + p.totalDeltaY}px)`;
            log('g-pan-log', `Δ ${p.totalDeltaX.toFixed(0)}, ${p.totalDeltaY.toFixed(0)}`);
          },
          onEnd: (d) => {
            const p = d as PanGestureDetail;
            ox += p.totalDeltaX;
            oy += p.totalDeltaY;
          },
        }),
      ),
    );
  }

  const rotEl = document.getElementById('g-rotate');
  const rotBox = document.getElementById('g-rotate-box');
  if (rotEl && rotBox) {
    let base = 0;
    detectGesture(
      rotEl,
      rotate(
        phase({
          onUpdate: (d) => {
            const r = d as RotateGestureDetail;
            const deg = ((base + r.rotation) * 180) / Math.PI;
            rotBox.style.transform = `rotate(${deg}deg)`;
            log('g-rotate-log', `${deg.toFixed(1)}°`);
          },
          onEnd: (d) => {
            base += (d as RotateGestureDetail).rotation;
          },
        }),
      ),
    );
  }

  const scaleEl = document.getElementById('g-scale');
  const scaleBox = document.getElementById('g-scale-box');
  if (scaleEl && scaleBox) {
    let base = 1;
    detectGesture(
      scaleEl,
      scale(
        phase({
          onUpdate: (d) => {
            const s = base * (d as ScaleGestureDetail).scale;
            scaleBox.style.transform = `scale(${s})`;
            log('g-scale-log', `×${s.toFixed(2)}`);
          },
          onEnd: (d) => {
            base *= (d as ScaleGestureDetail).scale;
          },
        }),
      ),
    );
  }

  const repEl = document.getElementById('g-repeat');
  if (repEl) {
    detectGesture(
      repEl,
      repeat(
        phase({
          onUpdate: (d) =>
            log('g-repeat-log', `${(d as RepeatGestureDetail).details.length} / 3`),
          onEnd: () => {
            log('g-repeat-log', 'triple tap ✓');
            repEl.classList.add('is-flash');
            setTimeout(() => repEl.classList.remove('is-flash'), 300);
          },
          onCancel: () => log('g-repeat-log', 'repeat cancelled'),
        }),
        { count: 3, maxInterval: 350 },
        tap(),
      ),
    );
  }

  const seqEl = document.getElementById('g-seq');
  if (seqEl) {
    /* Tap, then swipe within 800 ms (ordered chain). */
    detectGesture(
      seqEl,
      sequence(
        { maxInterval: 800 },
        tap(
          phase({
            onEnd: () => log('g-seq-log', '1/2 tap — now swipe'),
          }),
        ),
        swipe(
          phase({
            onEnd: (d) => log('g-seq-log', `2/2 swipe ${d.direction} ✓`),
            onCancel: () => log('g-seq-log', 'sequence cancelled'),
          }),
        ),
      ),
    );
  }

  /* Keyboard */
  const kbPad = document.getElementById('kb-pad');
  if (kbPad) {
    const kb = attachKeyboard(kbPad);
    kb.on('down', (d) => {
      log('kb-pad-log', `↓ ${d.key} · [${[...d.pressed].join(' + ')}]`);
      kbPad.classList.add('is-flash');
    });
    kb.on('up', (d) => {
      log('kb-pad-log', `↑ ${d.key} · [${[...d.pressed].join(' + ') || '—'}]`);
      if (!d.pressed.size) kbPad.classList.remove('is-flash');
    });
  }

  const kbChord = document.getElementById('kb-chord-pad');
  if (kbChord) {
    bindChords(
      kbChord,
      {
        'control+k': () => {
          log('kb-chord-log', '✓ control+k');
          kbChord.classList.add('is-flash');
          setTimeout(() => kbChord.classList.remove('is-flash'), 200);
        },
        'control+shift+k': () => {
          log('kb-chord-log', '✓ control+shift+k');
          kbChord.classList.add('is-flash');
          setTimeout(() => kbChord.classList.remove('is-flash'), 200);
        },
      },
      { ignoreFields: true },
    );
  }

  /* Mouse */
  const mousePad = document.getElementById('mouse-pad');
  const mouseDot = document.getElementById('mouse-pad-dot');
  if (mousePad) {
    const m = attachMouse(mousePad, { preventContextMenu: true });
    const placeDot = (x: number, y: number) => {
      if (!mouseDot) return;
      const r = mousePad.getBoundingClientRect();
      mouseDot.style.left = `${x - r.left}px`;
      mouseDot.style.top = `${y - r.top}px`;
      mouseDot.style.margin = '-1.25rem 0 0 -1.25rem';
    };
    m.on('move', (d) => {
      placeDot(d.clientX, d.clientY);
      log('mouse-pad-log', `move ${Math.round(d.x)},${Math.round(d.y)}`);
    });
    m.on('down', (d) => log('mouse-pad-log', `↓ ${d.button}`));
    m.on('up', (d) => log('mouse-pad-log', `↑ ${d.button}`));
    m.on('click', (d) => log('mouse-pad-log', `click ${d.button}`));
    m.on('dblclick', () => log('mouse-pad-log', 'dblclick'));
    m.on('dragstart', () => {
      mousePad.classList.add('is-flash');
      log('mouse-pad-log', 'dragstart');
    });
    m.on('drag', (d) =>
      log('mouse-pad-log', `drag Δ${Math.round(d.totalX)},${Math.round(d.totalY)}`),
    );
    m.on('dragend', () => {
      mousePad.classList.remove('is-flash');
      log('mouse-pad-log', 'dragend');
    });
    m.on('wheel', (d) => log('mouse-pad-log', `wheel ${Math.round(d.deltaY)}`));
  }

  /* DnD page */
  const list = document.getElementById('dnd-sort-list');
  if (list) {
    attachSortable(list, {
      itemSelector: ':scope > .dnd-item',
      axis: 'y',
      ghost: true,
      onReorder: ({ from, to }) => log('dnd-sort-log', `moved ${from} → ${to}`),
    });
  }

  const src = document.getElementById('dnd-source');
  const zone = document.getElementById('dnd-zone');
  if (src && zone) {
    attachDraggable(src, {
      type: 'k3/demo',
      data: () => ({ label: src.textContent?.trim() }),
      onEnd: (_p, dropped) => {
        if (!dropped) log('dnd-drop-log', 'missed');
      },
    });
    attachDroppable(zone, {
      accept: ['k3/demo'],
      onDragEnter: () => zone.classList.add('is-target'),
      onDragLeave: () => zone.classList.remove('is-target'),
      onDrop: ({ payload }) => {
        zone.classList.remove('is-target');
        log('dnd-drop-log', `dropped: ${JSON.stringify(payload.data)}`);
      },
    });
  }

  const chips = document.getElementById('dnd-chips');
  chips?.addEventListener('k3-reorder', ((e: CustomEvent) => {
    log('dnd-chips-log', `order: ${(e.detail.values as string[]).join(' · ')}`);
  }) as EventListener);
}
