/**
 * End the current task so input and rendering can run, then continue.
 *
 * `scheduler.yield()` where available, else a `MessageChannel` message (a
 * macrotask, not throttled like nested `setTimeout`, and untouched by fake
 * timers in tests), else a resolved promise.
 */
export function yieldToMain(): Promise<void> {
  const sched = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (typeof sched?.yield === 'function') return sched.yield();
  if (typeof MessageChannel === 'function') {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close();
        resolve();
      };
      channel.port2.postMessage(null);
    });
  }
  return Promise.resolve();
}
