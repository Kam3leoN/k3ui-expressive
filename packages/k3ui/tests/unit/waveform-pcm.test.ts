import { describe, it, expect, afterEach } from 'vitest';
import {
  clearWaveformPeakCache,
  oscillationBarCount,
  peaksFromAudioBuffer,
  resamplePeaks,
} from '../../src/components/media/waveform-pcm.js';

function mockBuffer(samples: Float32Array, channels = 1): AudioBuffer {
  const chans = Array.from({ length: channels }, (_, c) => {
    if (c === 0) return samples;
    const copy = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) copy[i] = (samples[i] ?? 0) * 0.5;
    return copy;
  });
  return {
    numberOfChannels: channels,
    length: samples.length,
    sampleRate: 44100,
    duration: samples.length / 44100,
    getChannelData: (c: number) => chans[c]!,
  } as unknown as AudioBuffer;
}

describe('waveform-pcm', () => {
  afterEach(() => clearWaveformPeakCache());

  it('peaksFromAudioBuffer tracks loud regions and normalizes', () => {
    const samples = new Float32Array(1000);
    for (let i = 400; i < 500; i++) samples[i] = 0.9;
    for (let i = 0; i < 100; i++) samples[i] = 0.05;
    const peaks = peaksFromAudioBuffer(mockBuffer(samples), 10);
    expect(peaks.length).toBe(10);
    const loud = peaks[4]!;
    const quiet = peaks[0]!;
    expect(loud).toBeGreaterThan(quiet);
    expect(Math.max(...peaks)).toBeLessThanOrEqual(1);
    expect(Math.min(...peaks)).toBeGreaterThanOrEqual(0.039);
  });

  it('resamplePeaks max-pools when downsampling', () => {
    const src = new Float32Array([0.1, 0.9, 0.2, 0.3, 0.8, 0.1]);
    const out = resamplePeaks(src, 3);
    expect(out.length).toBe(3);
    expect(out[0]).toBeCloseTo(0.9, 5);
    expect(out[1]).toBeGreaterThanOrEqual(0.3);
    expect(out[2]).toBeCloseTo(0.8, 5);
  });

  it('oscillationBarCount scales with width', () => {
    expect(oscillationBarCount(40)).toBeGreaterThanOrEqual(8);
    expect(oscillationBarCount(400)).toBeGreaterThan(oscillationBarCount(100));
  });
});
