import { DSPNode, PluginProject } from '@shared/types';

/**
 * AI Sound Matching Service
 * Match and recreate target sounds using AI analysis
 */

export interface SoundProfile {
  spectralFeatures: {
    centroid: number;
    rolloff: number;
    flux: number;
    flatness: number;
  };
  temporalFeatures: {
    attackTime: number;
    decayTime: number;
    sustainLevel: number;
    releaseTime: number;
  };
  harmonicFeatures: {
    fundamentalFreq: number;
    harmonicRatio: number;
    inharmonicity: number;
  };
  timbreFeatures: {
    brightness: number;
    warmth: number;
    roughness: number;
  };
}

export interface MatchResult {
  similarity: number; // 0-100%
  suggestedNodes: DSPNode[];
  suggestedParameters: Map<string, number>;
  matchQuality: 'excellent' | 'good' | 'fair' | 'poor';
  analysis: string;
}

export class AISoundMatching {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = 'https://api.sounddesigner.com/ai/matching') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Match a target sound and suggest configuration
   */
  async matchSound(targetAudio: AudioBuffer): Promise<MatchResult> {
    try {
      // Analyze target sound
      const profile = await this.analyzeSoundProfile(targetAudio);

      // Send to AI for matching
      const response = await fetch(`${this.apiEndpoint}/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({ profile }),
      });

      if (!response.ok) {
        throw new Error('Sound matching request failed');
      }

      const result = await response.json();

      return {
        similarity: result.similarity,
        suggestedNodes: result.nodes,
        suggestedParameters: new Map(Object.entries(result.parameters)),
        matchQuality: this.classifyMatchQuality(result.similarity),
        analysis: result.analysis,
      };
    } catch (error) {
      console.error('Sound matching failed:', error);
      throw error;
    }
  }

  /**
   * Compare current sound with target
   */
  async compareSounds(
    currentAudio: AudioBuffer,
    targetAudio: AudioBuffer
  ): Promise<{
    similarity: number;
    differences: Array<{ aspect: string; delta: number; suggestion: string }>;
  }> {
    const currentProfile = await this.analyzeSoundProfile(currentAudio);
    const targetProfile = await this.analyzeSoundProfile(targetAudio);

    const differences: Array<{ aspect: string; delta: number; suggestion: string }> = [];

    // Compare spectral features
    const centroidDelta =
      currentProfile.spectralFeatures.centroid - targetProfile.spectralFeatures.centroid;
    if (Math.abs(centroidDelta) > 500) {
      differences.push({
        aspect: 'Brightness',
        delta: centroidDelta,
        suggestion:
          centroidDelta > 0
            ? 'Reduce high frequencies or filter cutoff'
            : 'Increase high frequencies or filter cutoff',
      });
    }

    // Compare temporal features
    const attackDelta =
      currentProfile.temporalFeatures.attackTime - targetProfile.temporalFeatures.attackTime;
    if (Math.abs(attackDelta) > 0.01) {
      differences.push({
        aspect: 'Attack',
        delta: attackDelta,
        suggestion:
          attackDelta > 0 ? 'Decrease envelope attack time' : 'Increase envelope attack time',
      });
    }

    // Calculate overall similarity
    const similarity = this.calculateSimilarity(currentProfile, targetProfile);

    return { similarity, differences };
  }

  /**
   * Suggest DSP chain to match target
   */
  async suggestDSPChain(targetAudio: AudioBuffer): Promise<DSPNode[]> {
    const profile = await this.analyzeSoundProfile(targetAudio);

    const nodes: DSPNode[] = [];

    // Determine sound type
    const soundType = this.classifySoundType(profile);

    switch (soundType) {
      case 'synth':
        nodes.push(this.createNode('oscillator', { frequency: profile.harmonicFeatures.fundamentalFreq }));
        if (profile.timbreFeatures.warmth < 0.5) {
          nodes.push(this.createNode('filter', { type: 'lowpass', frequency: 2000 }));
        }
        nodes.push(this.createNode('envelope', {
          attack: profile.temporalFeatures.attackTime,
          decay: profile.temporalFeatures.decayTime,
          sustain: profile.temporalFeatures.sustainLevel,
          release: profile.temporalFeatures.releaseTime,
        }));
        break;

      case 'bass':
        nodes.push(this.createNode('oscillator', { type: 'sawtooth', frequency: 80 }));
        nodes.push(this.createNode('filter', { type: 'lowpass', frequency: 500 }));
        nodes.push(this.createNode('distortion', { amount: 0.3 }));
        break;

      case 'pad':
        nodes.push(this.createNode('oscillator', { type: 'sine' }));
        nodes.push(this.createNode('reverb', { size: 0.8, damping: 0.5 }));
        nodes.push(this.createNode('filter', { type: 'lowpass', frequency: 4000 }));
        break;

      case 'percussion':
        nodes.push(this.createNode('noise'));
        nodes.push(this.createNode('filter', { type: 'bandpass' }));
        nodes.push(this.createNode('envelope', { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }));
        break;
    }

    return nodes;
  }

  /**
   * Optimize current patch to better match target
   */
  async optimizePatchForTarget(
    currentProject: PluginProject,
    targetAudio: AudioBuffer
  ): Promise<Map<string, number>> {
    const optimizedParams = new Map<string, number>();

    const targetProfile = await this.analyzeSoundProfile(targetAudio);

    // Analyze each node and suggest optimizations
    for (const node of currentProject.dspGraph.nodes) {
      const nodeOptimizations = await this.optimizeNode(node, targetProfile);
      nodeOptimizations.forEach((value, key) => {
        optimizedParams.set(`${node.id}.${key}`, value);
      });
    }

    return optimizedParams;
  }

  /**
   * Analyze sound profile
   */
  private async analyzeSoundProfile(audioBuffer: AudioBuffer): Promise<SoundProfile> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    return {
      spectralFeatures: {
        centroid: this.calculateSpectralCentroid(channelData, sampleRate),
        rolloff: this.calculateSpectralRolloff(channelData, sampleRate),
        flux: this.calculateSpectralFlux(channelData),
        flatness: this.calculateSpectralFlatness(channelData),
      },
      temporalFeatures: {
        attackTime: this.detectAttackTime(channelData, sampleRate),
        decayTime: this.detectDecayTime(channelData, sampleRate),
        sustainLevel: this.detectSustainLevel(channelData),
        releaseTime: this.detectReleaseTime(channelData, sampleRate),
      },
      harmonicFeatures: {
        fundamentalFreq: this.detectFundamental(channelData, sampleRate),
        harmonicRatio: this.calculateHarmonicRatio(channelData),
        inharmonicity: this.calculateInharmonicity(channelData),
      },
      timbreFeatures: {
        brightness: this.calculateBrightness(channelData, sampleRate),
        warmth: this.calculateWarmth(channelData, sampleRate),
        roughness: this.calculateRoughness(channelData),
      },
    };
  }

  /**
   * Calculate similarity between two sound profiles
   */
  private calculateSimilarity(profile1: SoundProfile, profile2: SoundProfile): number {
    let totalSimilarity = 0;
    let count = 0;

    // Compare spectral features
    const spectralSim = this.compareSimilarity(
      profile1.spectralFeatures.centroid,
      profile2.spectralFeatures.centroid,
      10000
    );
    totalSimilarity += spectralSim;
    count++;

    // Compare temporal features
    const temporalSim = this.compareSimilarity(
      profile1.temporalFeatures.attackTime,
      profile2.temporalFeatures.attackTime,
      0.5
    );
    totalSimilarity += temporalSim;
    count++;

    // Compare harmonic features
    const harmonicSim = this.compareSimilarity(
      profile1.harmonicFeatures.harmonicRatio,
      profile2.harmonicFeatures.harmonicRatio,
      1
    );
    totalSimilarity += harmonicSim;
    count++;

    return (totalSimilarity / count) * 100;
  }

  /**
   * Compare similarity of two values
   */
  private compareSimilarity(val1: number, val2: number, maxDiff: number): number {
    const diff = Math.abs(val1 - val2);
    return Math.max(0, 1 - diff / maxDiff);
  }

  /**
   * Classify sound type
   */
  private classifySoundType(profile: SoundProfile): 'synth' | 'bass' | 'pad' | 'percussion' | 'vocal' {
    if (profile.harmonicFeatures.fundamentalFreq < 200) return 'bass';
    if (profile.temporalFeatures.attackTime < 0.01) return 'percussion';
    if (profile.timbreFeatures.warmth > 0.7) return 'pad';
    return 'synth';
  }

  /**
   * Classify match quality
   */
  private classifyMatchQuality(similarity: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (similarity >= 90) return 'excellent';
    if (similarity >= 75) return 'good';
    if (similarity >= 60) return 'fair';
    return 'poor';
  }

  /**
   * Create a DSP node
   */
  private createNode(type: string, params?: Record<string, any>): DSPNode {
    return {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      position: { x: 0, y: 0 },
      parameters: params
        ? Object.entries(params).map(([name, value]) => ({
            id: name,
            name,
            value: value as number,
            min: 0,
            max: 1,
            default: value as number,
          }))
        : [],
    };
  }

  /**
   * Optimize node parameters
   */
  private async optimizeNode(
    node: DSPNode,
    targetProfile: SoundProfile
  ): Promise<Map<string, number>> {
    const optimizations = new Map<string, number>();

    // Node-specific optimizations
    if (node.type === 'filter') {
      const targetCutoff = targetProfile.spectralFeatures.centroid;
      optimizations.set('frequency', targetCutoff);
    }

    if (node.type === 'envelope') {
      optimizations.set('attack', targetProfile.temporalFeatures.attackTime);
      optimizations.set('decay', targetProfile.temporalFeatures.decayTime);
      optimizations.set('sustain', targetProfile.temporalFeatures.sustainLevel);
      optimizations.set('release', targetProfile.temporalFeatures.releaseTime);
    }

    return optimizations;
  }

  // Placeholder feature extraction methods (would be implemented with proper DSP)
  private calculateSpectralCentroid(data: Float32Array, sampleRate: number): number {
    return 2000; // Placeholder
  }

  private calculateSpectralRolloff(data: Float32Array, sampleRate: number): number {
    return 5000; // Placeholder
  }

  private calculateSpectralFlux(data: Float32Array): number {
    return 0.5; // Placeholder
  }

  private calculateSpectralFlatness(data: Float32Array): number {
    return 0.3; // Placeholder
  }

  private detectAttackTime(data: Float32Array, sampleRate: number): number {
    return 0.01; // Placeholder
  }

  private detectDecayTime(data: Float32Array, sampleRate: number): number {
    return 0.1; // Placeholder
  }

  private detectSustainLevel(data: Float32Array): number {
    return 0.7; // Placeholder
  }

  private detectReleaseTime(data: Float32Array, sampleRate: number): number {
    return 0.2; // Placeholder
  }

  private detectFundamental(data: Float32Array, sampleRate: number): number {
    return 440; // Placeholder
  }

  private calculateHarmonicRatio(data: Float32Array): number {
    return 0.8; // Placeholder
  }

  private calculateInharmonicity(data: Float32Array): number {
    return 0.1; // Placeholder
  }

  private calculateBrightness(data: Float32Array, sampleRate: number): number {
    return 0.6; // Placeholder
  }

  private calculateWarmth(data: Float32Array, sampleRate: number): number {
    return 0.5; // Placeholder
  }

  private calculateRoughness(data: Float32Array): number {
    return 0.3; // Placeholder
  }

  private getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
  }
}

export default AISoundMatching;
