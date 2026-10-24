/**
 * Declarative gesture elements — `<k3-*-gesture for="id">` (M3E-compatible).
 * Emit `k3-gesture` CustomEvent with detail = gesture detail.
 */

import { detectGesture } from './detect.js';
import { longPress } from './long-press.js';
import { pan } from './pan.js';
import { repeat } from './repeat.js';
import { rotate } from './rotate.js';
import { scale } from './scale.js';
import { sequence } from './sequence.js';
import { swipe } from './swipe.js';
import { tap } from './tap.js';
import type { GestureController, GestureDetail, GestureRecognizer } from './types.js';
import { phase } from './phase.js';

abstract class K3GestureElement extends HTMLElement {
  static observedAttributes = [
    'for',
    'disabled',
    'max-duration',
    'max-displacement',
    'min-duration',
    'discrete',
    'min-velocity',
    'min-displacement',
    'activation-mode',
    'lock-axis',
    'count',
    'max-interval',
    'pointers',
  ];

  private ctrl: GestureController | null = null;
  private targetEl: HTMLElement | null = null;

  get for(): string {
    return this.getAttribute('for') ?? '';
  }
  set for(v: string) {
    if (v) this.setAttribute('for', v);
    else this.removeAttribute('for');
  }

  connectedCallback() {
    this.style.display = 'none';
    this.rebind();
  }

  disconnectedCallback() {
    this.ctrl?.destroy();
    this.ctrl = null;
  }

  attributeChangedCallback() {
    if (this.isConnected) this.rebind();
  }

  protected abstract buildRecognizer(): GestureRecognizer;

  private resolveTarget(): HTMLElement | null {
    const id = this.for;
    if (id) return document.getElementById(id);
    return (this.parentElement as HTMLElement | null) ?? null;
  }

  private rebind() {
    this.ctrl?.destroy();
    this.ctrl = null;
    this.targetEl = this.resolveTarget();
    if (!this.targetEl || this.hasAttribute('disabled')) return;

    const rec = this.buildRecognizer();
    const listener = phase({
      onStart: (d) => this.dispatch(d),
      onUpdate: (d) => this.dispatch(d),
      onEnd: (d) => this.dispatch(d),
      onCancel: (d) => this.dispatch(d),
    });
    const wired: GestureRecognizer = { ...rec, listener };
    this.ctrl = detectGesture(this.targetEl, wired);
  }

  private dispatch(detail: GestureDetail) {
    this.dispatchEvent(
      new CustomEvent('k3-gesture', { detail, bubbles: true, composed: true }),
    );
    this.targetEl?.dispatchEvent(
      new CustomEvent('k3-gesture', { detail, bubbles: true, composed: true }),
    );
  }

  protected num(attr: string, fallback: number): number {
    const v = this.getAttribute(attr);
    if (v == null || v === '') return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
}

export class K3TapGesture extends K3GestureElement {
  protected buildRecognizer() {
    return tap({
      maxDuration: this.num('max-duration', 180),
      maxDisplacement: this.num('max-displacement', 12),
      pointers: this.num('pointers', 1),
    });
  }
}

export class K3LongPressGesture extends K3GestureElement {
  protected buildRecognizer() {
    return longPress({
      minDuration: this.num('min-duration', 500),
      maxDisplacement: this.num('max-displacement', 12),
      discrete: this.hasAttribute('discrete'),
      pointers: this.num('pointers', 1),
    });
  }
}

export class K3SwipeGesture extends K3GestureElement {
  protected buildRecognizer() {
    return swipe({
      minVelocity: this.num('min-velocity', 0.3),
      minDisplacement: this.num('min-displacement', 24),
      pointers: this.num('pointers', 1),
    });
  }
}

export class K3PanGesture extends K3GestureElement {
  protected buildRecognizer() {
    const mode = this.getAttribute('activation-mode');
    const lock = this.getAttribute('lock-axis');
    return pan({
      activationMode: mode === 'move' ? 'move' : 'press',
      minDisplacement: this.num('min-displacement', 4),
      lockAxis: (lock as 'none' | 'x' | 'y' | 'auto') || 'none',
      pointers: this.num('pointers', 1),
    });
  }
}

export class K3RotateGesture extends K3GestureElement {
  protected buildRecognizer() {
    return rotate({ pointers: this.num('pointers', 2) });
  }
}

export class K3ScaleGesture extends K3GestureElement {
  protected buildRecognizer() {
    return scale({ pointers: this.num('pointers', 2) });
  }
}

export class K3RepeatGesture extends K3GestureElement {
  protected buildRecognizer() {
    const child = this.querySelector('k3-tap-gesture, k3-long-press-gesture');
    const nested = child
      ? tap({
          maxDuration: Number(child.getAttribute('max-duration')) || 180,
        })
      : tap();
    return repeat(
      () => undefined,
      {
        count: this.num('count', 2),
        maxInterval: this.num('max-interval', 250),
      },
      nested,
    );
  }
}

export class K3SequenceGesture extends K3GestureElement {
  protected buildRecognizer() {
    const kids = [...this.children].filter((c) => c.localName.endsWith('-gesture'));
    const steps: GestureRecognizer[] = kids.map((k) => {
      if (k.localName === 'k3-long-press-gesture') {
        return longPress({
          minDuration: Number(k.getAttribute('min-duration')) || 500,
        });
      }
      if (k.localName === 'k3-pan-gesture') {
        return pan({
          activationMode: k.getAttribute('activation-mode') === 'move' ? 'move' : 'press',
        });
      }
      if (k.localName === 'k3-swipe-gesture') return swipe();
      return tap();
    });
    if (!steps.length) steps.push(tap());
    return sequence({ maxInterval: this.num('max-interval', 250) }, ...steps);
  }
}

const DEFS: Array<[string, CustomElementConstructor]> = [
  ['k3-tap-gesture', K3TapGesture],
  ['k3-long-press-gesture', K3LongPressGesture],
  ['k3-swipe-gesture', K3SwipeGesture],
  ['k3-pan-gesture', K3PanGesture],
  ['k3-rotate-gesture', K3RotateGesture],
  ['k3-scale-gesture', K3ScaleGesture],
  ['k3-repeat-gesture', K3RepeatGesture],
  ['k3-sequence-gesture', K3SequenceGesture],
];

/** Define all declarative gesture custom elements (idempotent). */
export function defineGestureElements(): void {
  for (const [tag, ctor] of DEFS) {
    if (!customElements.get(tag)) customElements.define(tag, ctor);
  }
}