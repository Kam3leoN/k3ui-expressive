/**
 * Auto-dismiss timer that can pause on hover / focus (M3 snackbar a11y).
 */
export class PauseableTimeout {
  private timer?: number;
  private remainingMs = 0;
  private deadline = 0;
  private paused = false;

  constructor(private readonly onFire: () => void) {}

  start(ms: number): void {
    this.clear();
    if (ms <= 0) return;
    this.remainingMs = ms;
    this.arm();
  }

  clear(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.paused = false;
    this.remainingMs = 0;
    this.deadline = 0;
  }

  /**
   * Arm later: keep the full `ms` without running (snackbar held behind a
   * stack or while loading). `resume()` starts it.
   */
  prime(ms: number): void {
    this.clear();
    if (ms <= 0) return;
    this.remainingMs = ms;
    this.paused = true;
  }

  /** True while counting down. */
  get running(): boolean {
    return this.timer !== undefined;
  }

  /** Remaining time once paused / primed (ms). */
  get remaining(): number {
    return this.remainingMs;
  }

  pause(): void {
    if (!this.timer || this.paused) return;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.remainingMs = Math.max(0, this.deadline - Date.now());
    this.paused = true;
  }

  /** Resume a paused / primed timer, never with less than `minMs` left. */
  resume(minMs = 0): void {
    if (!this.paused) return;
    this.paused = false;
    this.remainingMs = Math.max(this.remainingMs, minMs);
    this.arm();
  }

  private arm(): void {
    if (this.remainingMs <= 0) return;
    this.deadline = Date.now() + this.remainingMs;
    this.timer = window.setTimeout(() => {
      this.timer = undefined;
      this.onFire();
    }, this.remainingMs);
  }
}
