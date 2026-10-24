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

  pause(): void {
    if (!this.timer || this.paused) return;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.remainingMs = Math.max(0, this.deadline - Date.now());
    this.paused = true;
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
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
