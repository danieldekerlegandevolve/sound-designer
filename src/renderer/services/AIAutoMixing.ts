import { DSPNode } from '@shared/types';

/**
 * AI Auto-Mixing Service
 * Automatic level balancing, EQ, and spatial positioning
 */

export interface MixingAnalysis {
  totalRMS: number;
  peakLevel: number;
  dynamicRange: number;
  stereoWidth: number;
  frequencyBalance: Record<string, number>;
  issues: MixingIssue[];
}

export interface MixingIssue {
  type: 'clipping' | 'phaseIssue' | 'frequencyMasking' | 'imbalance';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedFix?: string;
}

export interface AutoMixSettings {
  target: 'radio' | 'streaming' | 'mastering' | 'podcast' | 'custom';
  preserveDynamics: boolean;
  targetLUFS: number;
  maxPeakdB: number;
}

export class AIAutoMixing {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = 'https://api.sounddesigner.com/ai/mixing') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Analyze mix and provide recommendations
   */
  async analyzeMix(audioBuffer: AudioBuffer): Promise<MixingAnalysis> {
    const channelData = audioBuffer.getChannelData(0);

    // Calculate metrics
    const totalRMS = this.calculateRMS(channelData);
    const peakLevel = this.findPeak(channelData);
    const dynamicRange = this.calculateDynamicRange(channelData);
    const stereoWidth = audioBuffer.numberOfChannels > 1
      ? this.calculateStereoWidth(audioBuffer)
      : 0;
    const frequencyBalance = this.analyzeFrequencyBalance(channelData, audioBuffer.sampleRate);

    // Detect issues
    const issues = this.detectMixingIssues(audioBuffer, {
      totalRMS,
      peakLevel,
      dynamicRange,
      stereoWidth,
      frequencyBalance,
      issues: [],
    });

    return {
      totalRMS,
      peakLevel,
      dynamicRange,
      stereoWidth,
      frequencyBalance,
      issues,
    };
  }

  /**
   * Auto-mix audio with AI
   */
  async autoMix(
    audioBuffer: AudioBuffer,
    settings: AutoMixSettings
  ): Promise<{
    processedBuffer: AudioBuffer;
    appliedChanges: Array<{ type: string; description: string; amount: number }>;
  }> {
    try {
      // Send audio to AI service
      const audioData = this.bufferToBase64(audioBuffer);

      const response = await fetch(`${this.apiEndpoint}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          audio: audioData,
          settings,
        }),
      });

      if (!response.ok) {
        throw new Error('Auto-mix request failed');
      }

      const result = await response.json();

      // Decode processed audio
      const processedBuffer = await this.base64ToBuffer(
        result.processedAudio,
        audioBuffer.sampleRate
      );

      return {
        processedBuffer,
        appliedChanges: result.changes,
      };
    } catch (error) {
      console.error('Auto-mix failed:', error);
      throw error;
    }
  }

  /**
   * Balance levels across tracks
   */
  async balanceLevels(tracks: AudioBuffer[]): Promise<number[]> {
    const gains: number[] = [];

    // Calculate RMS for each track
    const rmsValues = tracks.map((track) => this.calculateRMS(track.getChannelData(0)));

    // Find target RMS (average of all tracks)
    const targetRMS = rmsValues.reduce((sum, val) => sum + val, 0) / rmsValues.length;

    // Calculate gain adjustments
    rmsValues.forEach((rms) => {
      const gainDB = 20 * Math.log10(targetRMS / (rms || 0.001));
      gains.push(Math.pow(10, gainDB / 20));
    });

    return gains;
  }

  /**
   * Apply auto-EQ to fix frequency imbalances
   */
  async applyAutoEQ(audioBuffer: AudioBuffer): Promise<{
    lowShelfGain: number;
    midGain: number;
    highShelfGain: number;
  }> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    const balance = this.analyzeFrequencyBalance(channelData, sampleRate);

    // Calculate EQ adjustments
    const targetBalance = 33.33; // Equal distribution
    const lowAdjust = targetBalance - balance.low;
    const midAdjust = targetBalance - balance.mid;
    const highAdjust = targetBalance - balance.high;

    return {
      lowShelfGain: this.clamp(lowAdjust * 0.2, -12, 12),
      midGain: this.clamp(midAdjust * 0.15, -6, 6),
      highShelfGain: this.clamp(highAdjust * 0.2, -12, 12),
    };
  }

  /**
   * Detect and fix phase issues
   */
  async detectPhaseIssues(
    leftChannel: Float32Array,
    rightChannel: Float32Array
  ): Promise<{ hasIssue: boolean; correlation: number; shouldInvertRight: boolean }> {
    const correlation = this.calculateCorrelation(leftChannel, rightChannel);

    return {
      hasIssue: correlation < -0.5,
      correlation,
      shouldInvertRight: correlation < -0.7,
    };
  }

  /**
   * Calculate RMS level
   */
  private calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  /**
   * Find peak level
   */
  private findPeak(data: Float32Array): number {
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      peak = Math.max(peak, Math.abs(data[i]));
    }
    return peak;
  }

  /**
   * Calculate dynamic range
   */
  private calculateDynamicRange(data: Float32Array): number {
    const rms = this.calculateRMS(data);
    const peak = this.findPeak(data);
    return 20 * Math.log10(peak / (rms || 0.001));
  }

  /**
   * Calculate stereo width
   */
  private calculateStereoWidth(audioBuffer: AudioBuffer): number {
    if (audioBuffer.numberOfChannels < 2) {
      return 0;
    }

    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);

    const correlation = this.calculateCorrelation(left, right);

    // Convert correlation to width (0-100%)
    return (1 - correlation) * 100;
  }

  /**
   * Calculate correlation between two signals
   */
  private calculateCorrelation(signal1: Float32Array, signal2: Float32Array): number {
    let sum = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    const length = Math.min(signal1.length, signal2.length);

    for (let i = 0; i < length; i++) {
      sum += signal1[i] * signal2[i];
      sum1Sq += signal1[i] * signal1[i];
      sum2Sq += signal2[i] * signal2[i];
    }

    return sum / (Math.sqrt(sum1Sq * sum2Sq) || 1);
  }

  /**
   * Analyze frequency balance
   */
  private analyzeFrequencyBalance(
    data: Float32Array,
    sampleRate: number
  ): Record<string, number> {
    // Simplified frequency analysis
    // In production, use proper FFT-based analysis

    return {
      low: 30, // % of energy in low frequencies (20-250 Hz)
      mid: 40, // % of energy in mid frequencies (250-4000 Hz)
      high: 30, // % of energy in high frequencies (4000-20000 Hz)
    };
  }

  /**
   * Detect mixing issues
   */
  private detectMixingIssues(audioBuffer: AudioBuffer, analysis: MixingAnalysis): MixingIssue[] {
    const issues: MixingIssue[] = [];

    // Check for clipping
    if (analysis.peakLevel >= 0.99) {
      issues.push({
        type: 'clipping',
        severity: 'high',
        description: 'Audio is clipping',
        suggestedFix: 'Reduce overall gain or apply limiting',
      });
    }

    // Check for low dynamic range
    if (analysis.dynamicRange < 6) {
      issues.push({
        type: 'imbalance',
        severity: 'medium',
        description: 'Very low dynamic range - possibly over-compressed',
        suggestedFix: 'Reduce compression ratio or increase release time',
      });
    }

    // Check for frequency imbalance
    const freqBalance = analysis.frequencyBalance;
    if (freqBalance.low > 50) {
      issues.push({
        type: 'frequencyMasking',
        severity: 'medium',
        description: 'Excessive low frequency energy',
        suggestedFix: 'Apply high-pass filter or reduce low shelf',
      });
    }

    // Check for phase issues (if stereo)
    if (audioBuffer.numberOfChannels > 1) {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      const correlation = this.calculateCorrelation(left, right);

      if (correlation < -0.5) {
        issues.push({
          type: 'phaseIssue',
          severity: 'high',
          description: 'Significant phase cancellation detected',
          suggestedFix: 'Check polarity of channels or mono compatibility',
        });
      }
    }

    return issues;
  }

  /**
   * Convert buffer to base64
   */
  private bufferToBase64(audioBuffer: AudioBuffer): string {
    // In production, properly encode audio buffer
    return '';
  }

  /**
   * Convert base64 to buffer
   */
  private async base64ToBuffer(base64: string, sampleRate: number): Promise<AudioBuffer> {
    // In production, properly decode audio buffer
    const audioContext = new AudioContext({ sampleRate });
    return audioContext.createBuffer(2, sampleRate, sampleRate);
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
  }
}

export default AIAutoMixing;
