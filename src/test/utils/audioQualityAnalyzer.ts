/**
 * Audio Quality Analyzer
 * Comprehensive audio quality analysis and validation
 */

import { calculateRMS, calculatePeak, calculateTHD, performFFT } from './dspTestUtils';

export interface AudioQualityMetrics {
  // Level metrics
  rmsLevel: number; // RMS level in dB
  peakLevel: number; // Peak level in dB
  crestFactor: number; // Peak to RMS ratio
  dynamicRange: number; // dB

  // Distortion metrics
  thd: number; // Total Harmonic Distortion (%)
  thdPlusNoise: number; // THD+N (%)

  // Frequency metrics
  dcOffset: number; // DC offset value
  bandwidth: number; // -3dB bandwidth in Hz
  fundamentalFrequency?: number; // Hz

  // Quality indicators
  hasClipping: boolean;
  hasDCOffset: boolean;
  hasSubsonicContent: boolean;
  hasUltrasonicContent: boolean;

  // Overall quality score
  qualityScore: number; // 0-100
  qualityGrade: 'excellent' | 'good' | 'fair' | 'poor';
  issues: string[];
}

export class AudioQualityAnalyzer {
  private sampleRate: number;

  constructor(sampleRate: number = 44100) {
    this.sampleRate = sampleRate;
  }

  /**
   * Analyze audio quality
   */
  analyze(samples: Float32Array): AudioQualityMetrics {
    const issues: string[] = [];

    // Level metrics
    const rms = calculateRMS(samples);
    const peak = calculatePeak(samples);
    const rmsLevel = this.linearToDb(rms);
    const peakLevel = this.linearToDb(peak);
    const crestFactor = peak / rms;
    const dynamicRange = peakLevel - rmsLevel;

    // Check clipping
    const hasClipping = peak >= 0.99;
    if (hasClipping) {
      issues.push('Signal clipping detected');
    }

    // DC offset
    const dcOffset = this.calculateDCOffset(samples);
    const hasDCOffset = Math.abs(dcOffset) > 0.01;
    if (hasDCOffset) {
      issues.push(`DC offset detected: ${dcOffset.toFixed(4)}`);
    }

    // Frequency analysis
    const spectrum = performFFT(samples);
    const { bandwidth, fundamentalFrequency } = this.analyzeSpectrum(
      spectrum,
      this.sampleRate
    );

    // Check for subsonic/ultrasonic content
    const hasSubsonicContent = this.hasSubsonicContent(spectrum, this.sampleRate);
    const hasUltrasonicContent = this.hasUltrasonicContent(spectrum, this.sampleRate);

    if (hasSubsonicContent) {
      issues.push('Subsonic content detected (<20Hz)');
    }
    if (hasUltrasonicContent) {
      issues.push('Ultrasonic content detected (>20kHz)');
    }

    // Distortion
    const thd = fundamentalFrequency
      ? calculateTHD(samples, fundamentalFrequency, this.sampleRate)
      : 0;

    const thdPlusNoise = this.calculateTHDN(samples, fundamentalFrequency);

    if (thd > 1) {
      issues.push(`High THD: ${thd.toFixed(2)}%`);
    }

    // Calculate quality score
    const qualityScore = this.calculateQualityScore({
      hasClipping,
      hasDCOffset,
      thd,
      dynamicRange,
      hasSubsonicContent,
      hasUltrasonicContent,
    });

    const qualityGrade = this.getQualityGrade(qualityScore);

    return {
      rmsLevel,
      peakLevel,
      crestFactor,
      dynamicRange,
      thd,
      thdPlusNoise,
      dcOffset,
      bandwidth,
      fundamentalFrequency,
      hasClipping,
      hasDCOffset,
      hasSubsonicContent,
      hasUltrasonicContent,
      qualityScore,
      qualityGrade,
      issues,
    };
  }

  /**
   * Calculate DC offset
   */
  private calculateDCOffset(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i];
    }
    return sum / samples.length;
  }

  /**
   * Analyze frequency spectrum
   */
  private analyzeSpectrum(
    spectrum: Float32Array,
    sampleRate: number
  ): { bandwidth: number; fundamentalFrequency?: number } {
    const binSize = sampleRate / (spectrum.length * 2);

    // Find fundamental frequency (highest magnitude peak)
    let maxMagnitude = 0;
    let fundamentalBin = 0;

    for (let i = 1; i < spectrum.length; i++) {
      if (spectrum[i] > maxMagnitude) {
        maxMagnitude = spectrum[i];
        fundamentalBin = i;
      }
    }

    const fundamentalFrequency =
      fundamentalBin > 0 ? fundamentalBin * binSize : undefined;

    // Calculate -3dB bandwidth
    const threshold = maxMagnitude * 0.707; // -3dB
    let lowerBin = 0;
    let upperBin = 0;

    for (let i = 0; i < spectrum.length; i++) {
      if (spectrum[i] >= threshold) {
        if (lowerBin === 0) lowerBin = i;
        upperBin = i;
      }
    }

    const bandwidth = (upperBin - lowerBin) * binSize;

    return { bandwidth, fundamentalFrequency };
  }

  /**
   * Check for subsonic content
   */
  private hasSubsonicContent(spectrum: Float32Array, sampleRate: number): boolean {
    const binSize = sampleRate / (spectrum.length * 2);
    const subsonicBins = Math.floor(20 / binSize);

    let subsonicEnergy = 0;
    for (let i = 0; i < subsonicBins; i++) {
      subsonicEnergy += spectrum[i] * spectrum[i];
    }

    let totalEnergy = 0;
    for (let i = 0; i < spectrum.length; i++) {
      totalEnergy += spectrum[i] * spectrum[i];
    }

    return subsonicEnergy / totalEnergy > 0.1; // >10% subsonic energy
  }

  /**
   * Check for ultrasonic content
   */
  private hasUltrasonicContent(spectrum: Float32Array, sampleRate: number): boolean {
    const binSize = sampleRate / (spectrum.length * 2);
    const ultrasonicStart = Math.floor(20000 / binSize);

    let ultrasonicEnergy = 0;
    for (let i = ultrasonicStart; i < spectrum.length; i++) {
      ultrasonicEnergy += spectrum[i] * spectrum[i];
    }

    let totalEnergy = 0;
    for (let i = 0; i < spectrum.length; i++) {
      totalEnergy += spectrum[i] * spectrum[i];
    }

    return ultrasonicEnergy / totalEnergy > 0.05; // >5% ultrasonic energy
  }

  /**
   * Calculate THD+N
   */
  private calculateTHDN(samples: Float32Array, fundamentalFreq?: number): number {
    if (!fundamentalFreq) return 0;

    // Simplified THD+N calculation
    const spectrum = performFFT(samples);
    const binSize = this.sampleRate / samples.length;
    const fundamentalBin = Math.round(fundamentalFreq / binSize);

    const fundamentalMagnitude = spectrum[fundamentalBin];

    // Calculate total energy excluding fundamental
    let noiseEnergy = 0;
    for (let i = 0; i < spectrum.length; i++) {
      if (Math.abs(i - fundamentalBin) > 2) {
        // Exclude fundamental +/- 2 bins
        noiseEnergy += spectrum[i] * spectrum[i];
      }
    }

    const thdPlusN = Math.sqrt(noiseEnergy) / fundamentalMagnitude;
    return thdPlusN * 100;
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(metrics: {
    hasClipping: boolean;
    hasDCOffset: boolean;
    thd: number;
    dynamicRange: number;
    hasSubsonicContent: boolean;
    hasUltrasonicContent: boolean;
  }): number {
    let score = 100;

    // Penalties
    if (metrics.hasClipping) score -= 40;
    if (metrics.hasDCOffset) score -= 10;
    if (metrics.hasSubsonicContent) score -= 5;
    if (metrics.hasUltrasonicContent) score -= 5;

    // THD penalty
    if (metrics.thd > 5) score -= 30;
    else if (metrics.thd > 1) score -= 15;
    else if (metrics.thd > 0.1) score -= 5;

    // Dynamic range penalty
    if (metrics.dynamicRange < 6) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get quality grade from score
   */
  private getQualityGrade(
    score: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Convert linear to dB
   */
  private linearToDb(linear: number): number {
    return 20 * Math.log10(Math.max(linear, 0.00001));
  }

  /**
   * Generate quality report
   */
  generateReport(metrics: AudioQualityMetrics): string {
    const lines = [
      '=== Audio Quality Analysis Report ===',
      '',
      'Level Metrics:',
      `  RMS Level: ${metrics.rmsLevel.toFixed(2)} dB`,
      `  Peak Level: ${metrics.peakLevel.toFixed(2)} dB`,
      `  Crest Factor: ${metrics.crestFactor.toFixed(2)}`,
      `  Dynamic Range: ${metrics.dynamicRange.toFixed(2)} dB`,
      '',
      'Distortion Metrics:',
      `  THD: ${metrics.thd.toFixed(3)}%`,
      `  THD+N: ${metrics.thdPlusNoise.toFixed(3)}%`,
      '',
      'Frequency Metrics:',
      `  DC Offset: ${metrics.dcOffset.toFixed(4)}`,
      `  Bandwidth: ${metrics.bandwidth.toFixed(0)} Hz`,
      metrics.fundamentalFrequency
        ? `  Fundamental: ${metrics.fundamentalFrequency.toFixed(2)} Hz`
        : '',
      '',
      'Quality Checks:',
      `  Clipping: ${metrics.hasClipping ? 'FAIL' : 'PASS'}`,
      `  DC Offset: ${metrics.hasDCOffset ? 'FAIL' : 'PASS'}`,
      `  Subsonic Content: ${metrics.hasSubsonicContent ? 'WARNING' : 'PASS'}`,
      `  Ultrasonic Content: ${metrics.hasUltrasonicContent ? 'WARNING' : 'PASS'}`,
      '',
      'Overall Quality:',
      `  Score: ${metrics.qualityScore}/100`,
      `  Grade: ${metrics.qualityGrade.toUpperCase()}`,
      '',
    ];

    if (metrics.issues.length > 0) {
      lines.push('Issues Found:');
      metrics.issues.forEach((issue) => lines.push(`  - ${issue}`));
    } else {
      lines.push('No issues found.');
    }

    return lines.filter((l) => l !== '').join('\n');
  }
}
