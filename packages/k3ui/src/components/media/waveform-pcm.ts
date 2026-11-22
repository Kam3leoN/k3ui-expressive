/**
 * Real PCM waveform peaks for oscillation seek — Web Audio `decodeAudioData`.
 * High-res cache per URL, then max-pool resample to the canvas bar count.
 */

const DEFAULT_BUCKETS = 2048;
const cache = new Map<string, Float32Array>();
const inflight = new Map<string, Promise<Float32Array>>();

let sharedCtx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof AudioContext === 'undefined' && typeof (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext === 'undefined') {
    return null;
  }
  if (!sharedCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    try {
      sharedCtx = new Ctor();
    } catch {
      return null;
    }
  }
  return sharedCtx;
}

/** Mix channels → max-abs envelope, normalize to 0.04…1. */
export function peaksFromAudioBuffer(
  buffer: AudioBuffer,
  buckets = DEFAULT_BUCKETS,
): Float32Array {
  const n = Math.max(1, buckets | 0);
  const ch = Math.max(1, buffer.numberOfChannels);
  const len = buffer.length;
  if (!len) return new Float32Array(n);

  const channels: Float32Array[] = [];
  for (let c = 0; c < ch; c++) channels.push(buffer.getChannelData(c));

  const out = new Float32Array(n);
  const block = Math.max(1, Math.floor(len / n));
  let peakMax = 1e-6;

  for (let i = 0; i < n; i++) {
    const start = i * block;
    const end = i === n - 1 ? len : Math.min(len, start + block);
    let m = 0;
    for (let s = start; s < end; s++) {
      let sum = 0;
      for (let c = 0; c < ch; c++) sum += channels[c]![s] ?? 0;
      const v = Math.abs(sum / ch);
      if (v > m) m = v;
    }
    out[i] = m;
    if (m > peakMax) peakMax = m;
  }

  for (let i = 0; i < n; i++) {
    out[i] = Math.min(1, Math.max(0.04, (out[i] ?? 0) / peakMax));
  }
  return out;
}

/** Down/up-sample peaks with max-pooling (keeps loud transients). */
export function resamplePeaks(peaks: ArrayLike<number>, count: number): Float32Array {
  const n = Math.max(1, count | 0);
  const srcLen = peaks.length;
  const out = new Float32Array(n);
  if (!srcLen) {
    out.fill(0.08);
    return out;
  }
  if (srcLen === n) {
    out.set(peaks as ArrayLike<number>);
    return out;
  }

  for (let i = 0; i < n; i++) {
    const a = Math.floor((i * srcLen) / n);
    const b = Math.max(a + 1, Math.floor(((i + 1) * srcLen) / n));
    let m = 0;
    for (let j = a; j < b && j < srcLen; j++) {
      const v = peaks[j] ?? 0;
      if (v > m) m = v;
    }
    out[i] = m;
  }
  return out;
}

/** Bar count that fits a seek width (same geometry as `drawOscillationBars`). */
export function oscillationBarCount(width: number): number {
  const W = Math.max(0, width);
  const bar = Math.max(1.5, Math.min(3, W / 120));
  const gap = Math.max(1, bar * 0.65);
  return Math.max(8, Math.floor((W - bar) / (bar + gap)) + 1);
}

/**
 * Fetch + decode audio → cached high-res peaks (0..1).
 * Same-origin or CORS-enabled URLs only.
 */
export async function loadWaveformPeaks(
  src: string,
  options: { buckets?: number; signal?: AbortSignal } = {},
): Promise<Float32Array> {
  const url = src.trim();
  if (!url) throw new Error('waveform: empty src');

  const cached = cache.get(url);
  if (cached) return cached;

  const pending = inflight.get(url);
  if (pending) return pending;

  const job = (async () => {
    const ctx = audioContext();
    if (!ctx) throw new Error('waveform: AudioContext unavailable');

    const res = await fetch(url, {
      signal: options.signal,
      mode: 'cors',
      credentials: 'same-origin',
    });
    if (!res.ok) throw new Error(`waveform: HTTP ${res.status}`);
    const raw = await res.arrayBuffer();
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    /* decodeAudioData may detach the buffer — copy first on some engines */
    const copy = raw.slice(0);
    const audio = await ctx.decodeAudioData(copy);
    const peaks = peaksFromAudioBuffer(audio, options.buckets ?? DEFAULT_BUCKETS);
    cache.set(url, peaks);
    return peaks;
  })().finally(() => {
    inflight.delete(url);
  });

  inflight.set(url, job);
  return job;
}

/** Test helper — clear module cache. */
export function clearWaveformPeakCache(): void {
  cache.clear();
  inflight.clear();
}
