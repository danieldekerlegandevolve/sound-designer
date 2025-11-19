import { describe, it, expect } from 'vitest';
import { AudioQualityAnalyzer } from '../utils/audioQualityAnalyzer';
import { generateSineWave, generateWhiteNoise } from '../utils/dspTestUtils';

describe('Audio Quality Analyzer', () => {
  const analyzer = new AudioQualityAnalyzer(44100);

  it('should analyze clean sine wave as excellent quality', () => {
    const signal = generateSineWave(440, 1.0, 44100, 0.5);
    const metrics = analyzer.analyze(signal.samples);

    expect(metrics.qualityGrade).toBe('excellent');
    expect(metrics.hasClipping).toBe(false);
    expect(metrics.hasDCOffset).toBe(false);
    expect(metrics.qualityScore).toBeGreaterThan(90);
    expect(metrics.issues).toHaveLength(0);
  });

  it('should detect clipping', () => {
    const signal = generateSineWave(440, 1.0, 44100, 1.0);
    const metrics = analyzer.analyze(signal.samples);

    expect(metrics.hasClipping).toBe(true);
    expect(metrics.qualityGrade).not.toBe('excellent');
    expect(metrics.issues).toContain('Signal clipping detected');
  });

  it('should detect DC offset', () => {
    const signal = generateSineWave(440, 1.0, 44100, 0.5);

    // Add DC offset
    for (let i = 0; i < signal.samples.length; i++) {
      signal.samples[i] += 0.1;
    }

    const metrics = analyzer.analyze(signal.samples);

    expect(metrics.hasDCOffset).toBe(true);
    expect(metrics.dcOffset).toBeCloseTo(0.1, 1);
    expect(metrics.issues.length).toBeGreaterThan(0);
  });

  it('should calculate correct RMS and peak levels', () => {
    const amplitude = 0.5;
    const signal = generateSineWave(440, 1.0, 44100, amplitude);
    const metrics = analyzer.analyze(signal.samples);

    // RMS of sine wave = amplitude / sqrt(2)
    const expectedRMS = amplitude / Math.sqrt(2);
    const expectedRMSdB = 20 * Math.log10(expectedRMS);

    expect(metrics.rmsLevel).toBeCloseTo(expectedRMSdB, 0);
    expect(metrics.peakLevel).toBeCloseTo(20 * Math.log10(amplitude), 0);
  });

  it('should calculate crest factor', () => {
    const signal = generateSineWave(440, 1.0, 44100, 1.0);
    const metrics = analyzer.analyze(signal.samples);

    // Crest factor of sine wave should be sqrt(2) ≈ 1.414
    expect(metrics.crestFactor).toBeCloseTo(Math.sqrt(2), 1);
  });

  it('should detect fundamental frequency', () => {
    const frequency = 440;
    const signal = generateSineWave(frequency, 1.0, 44100, 0.5);
    const metrics = analyzer.analyze(signal.samples);

    expect(metrics.fundamentalFrequency).toBeDefined();
    if (metrics.fundamentalFrequency) {
      // Allow 5% tolerance
      expect(metrics.fundamentalFrequency).toBeGreaterThan(frequency * 0.95);
      expect(metrics.fundamentalFrequency).toBeLessThan(frequency * 1.05);
    }
  });

  it('should generate quality report', () => {
    const signal = generateSineWave(440, 1.0, 44100, 0.7);
    const metrics = analyzer.analyze(signal.samples);
    const report = analyzer.generateReport(metrics);

    expect(report).toContain('Audio Quality Analysis Report');
    expect(report).toContain('RMS Level');
    expect(report).toContain('Peak Level');
    expect(report).toContain('Quality Score');
  });

  it('should handle noisy signals appropriately', () => {
    const noise = generateWhiteNoise(1.0, 44100, 0.5);
    const metrics = analyzer.analyze(noise.samples);

    expect(metrics.hasClipping).toBe(false);
    expect(metrics.qualityGrade).not.toBe('poor');
  });

  it('should calculate THD for harmonically rich signals', () => {
    // Generate signal with harmonics (square-ish wave)
    const fundamental = 440;
    const signal = generateSineWave(fundamental, 1.0, 44100, 0.5);

    // Add harmonics
    const harmonic3 = generateSineWave(fundamental * 3, 1.0, 44100, 0.15);
    const harmonic5 = generateSineWave(fundamental * 5, 1.0, 44100, 0.1);

    for (let i = 0; i < signal.samples.length; i++) {
      signal.samples[i] += harmonic3.samples[i] + harmonic5.samples[i];
    }

    const metrics = analyzer.analyze(signal.samples);

    expect(metrics.thd).toBeGreaterThan(0);
    expect(metrics.fundamentalFrequency).toBeCloseTo(fundamental, -1);
  });
});

describe('Audio Quality Grading', () => {
  const analyzer = new AudioQualityAnalyzer(44100);

  it('should grade pristine audio as excellent', () => {
    const signal = generateSineWave(1000, 1.0, 44100, 0.3);
    const metrics = analyzer.analyze(signal.samples);

    expect(metrics.qualityScore).toBeGreaterThan(90);
    expect(metrics.qualityGrade).toBe('excellent');
  });

  it('should grade clipped audio as poor', () => {
    const signal = generateSineWave(1000, 1.0, 44100, 1.2);

    // Clip the signal
    for (let i = 0; i < signal.samples.length; i++) {
      signal.samples[i] = Math.max(-1, Math.min(1, signal.samples[i]));
    }

    const metrics = analyzer.analyze(signal.samples);

    expect(metrics.qualityScore).toBeLessThan(70);
    expect(metrics.hasClipping).toBe(true);
  });
});
