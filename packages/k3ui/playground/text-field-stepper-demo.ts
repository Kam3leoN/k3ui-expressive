/**
 * Playground — outlined number field with trailing reset / − / +
 * (same pattern as showcase Pomodoro custom fields).
 */

type FieldEl = HTMLElement & { value?: string };
type BtnEl = HTMLElement & { disabled?: boolean; hidden?: boolean };

const MIN = 1;
const MAX = 180;
const DEFAULT = '1';

function readNumber(field: FieldEl): number | null {
  const raw = String(field.value ?? '').trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function sync(field: FieldEl): void {
  const n = readNumber(field);
  const atMin = n == null || n <= MIN;
  const dirty = n != null && n !== MIN;
  const dec = field.querySelector('.tf-step--dec') as BtnEl | null;
  const inc = field.querySelector('.tf-step--inc') as BtnEl | null;
  const reset = field.querySelector('.tf-step--reset') as BtnEl | null;
  if (dec) dec.disabled = atMin;
  if (inc) inc.disabled = n != null && n >= MAX;
  if (reset) {
    reset.hidden = !dirty;
    reset.toggleAttribute('hidden', !dirty);
    reset.disabled = !dirty;
  }
}

function step(field: FieldEl, delta: number): void {
  const n = readNumber(field);
  if (delta < 0) {
    if (n == null || n <= MIN) return;
    field.value = String(Math.max(MIN, n + delta));
  } else {
    const base = n == null || n < 0 ? 0 : n;
    field.value = String(Math.min(MAX, Math.max(MIN, base + delta)));
  }
  sync(field);
}

function reset(field: FieldEl): void {
  field.value = DEFAULT;
  sync(field);
}

/** Wire every `[data-tf-stepper]` in `root` (idempotent per field). */
export function wireTextFieldStepperDemo(root: ParentNode = document): void {
  for (const el of root.querySelectorAll<FieldEl>('[data-tf-stepper]')) {
    if (el.dataset.stepperWired === '1') continue;
    el.dataset.stepperWired = '1';

    const dec = el.querySelector('.tf-step--dec');
    const inc = el.querySelector('.tf-step--inc');
    const resetBtn = el.querySelector('.tf-step--reset');
    dec?.addEventListener('k3-click', () => step(el, -1));
    inc?.addEventListener('k3-click', () => step(el, 1));
    resetBtn?.addEventListener('k3-click', () => reset(el));
    el.addEventListener('input', () => sync(el));
    el.addEventListener('change', () => sync(el));
    sync(el);
  }
}
