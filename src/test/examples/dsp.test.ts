import { describe, it, expect } from 'vitest';
import {
  generateSineWave,
  generateWhiteNoise,
  calculateRMS,
  calculatePeak,
  findDominantFrequency,
  isClipping,
  isSilent,
  signalsMatch,
  assertSignal,
} from '../utils/dspTestUtils';

describe('DSP Signal Generation', () => {
  it('should generate a valid sine wave', () => {
    const signal = generateSineWave(440, 1.0, 44100);

    expect(signal.sampleRate).toBe(44100);
    expect(signal.duration).toBe(1.0);
    expect(signal.samples.length).toBe(44100);

    // Check signal is finite and in range
    assertSignal.isFinite(signal.samples);
    assertSignal.inRange(signal.samples, -1, 1);
  });

  it('should generate sine wave with correct frequency', () => {
    const frequency = 440;
    const signal = generateSineWave(frequency, 1.0, 44100);

    const dominantFreq = findDominantFrequency(signal.samples, signal.sampleRate);

    // Allow 5% tolerance
    expect(dominantFreq).toBeGreaterThan(frequency * 0.95);
    expect(dominantFreq).toBeLessThan(frequency * 1.05);
  });

  it('should generate white noise with correct properties', () => {
    const signal = generateWhiteNoise(1.0, 44100);

    // White noise should have RMS around 0.577 (1/sqrt(3))
    const rms = calculateRMS(signal.samples);
    expect(rms).toBeGreaterThan(0.5);
    expect(rms).toBeLessThan(0.65);

    // Peak should be close to 1
    const peak = calculatePeak(signal.samples);
    expect(peak).toBeGreaterThan(0.9);
    expect(peak).toBeLessThan(1.0);
  });
});

describe('DSP Analysis', () => {
  it('should calculate RMS correctly', () => {
    const signal = generateSineWave(440, 1.0, 44100, 1.0);
    const rms = calculateRMS(signal.samples);

    // RMS of a full-scale sine wave is 1/sqrt(2) ≈ 0.707
    expect(rms).toBeCloseTo(0.707, 2);
  });

  it('should calculate peak correctly', () => {
    const signal = generateSineWave(440, 1.0, 44100, 0.5);
    const peak = calculatePeak(signal.samples);

    expect(peak).toBeCloseTo(0.5, 2);
  });

  it('should detect clipping', () => {
    const signal = generateSineWave(440, 1.0, 44100, 1.0);
    expect(isClipping(signal.samples, 0.99)).toBe(true);
    expect(isClipping(signal.samples, 1.01)).toBe(false);
  });

  it('should detect silence', () => {
    const silent = new Float32Array(1000);
    expect(isSilent(silent)).toBe(true);

    const notSilent = generateSineWave(440, 0.1, 44100);
    expect(isSilent(notSilent.samples)).toBe(false);
  });
});

describe('DSP Signal Comparison', () => {
  it('should match identical signals', () => {
    const signal1 = generateSineWave(440, 1.0, 44100);
    const signal2 = generateSineWave(440, 1.0, 44100);

    expect(signalsMatch(signal1.samples, signal2.samples, 0.001)).toBe(true);
  });

  it('should not match different signals', () => {
    const signal1 = generateSineWave(440, 1.0, 44100);
    const signal2 = generateSineWave(880, 1.0, 44100);

    expect(signalsMatch(signal1.samples, signal2.samples, 0.001)).toBe(false);
  });
});

describe('DSP Signal Validation', () => {
  it('should validate finite signals', () => {
    const signal = generateSineWave(440, 1.0, 44100);

    expect(() => assertSignal.isFinite(signal.samples)).not.toThrow();
  });

  it('should reject infinite signals', () => {
    const signal = new Float32Array([1, 2, Infinity, 4]);

    expect(() => assertSignal.isFinite(signal)).toThrow();
  });

  it('should validate range', () => {
    const signal = generateSineWave(440, 1.0, 44100);

    expect(() => assertSignal.inRange(signal.samples, -1, 1)).not.toThrow();
    expect(() => assertSignal.inRange(signal.samples, 0, 0.5)).toThrow();
  });

  it('should detect clipping in validation', () => {
    const clipped = new Float32Array([0.5, 0.9, 1.0, 0.8]);

    expect(() => assertSignal.hasNoClipping(clipped)).toThrow();
  });
});
