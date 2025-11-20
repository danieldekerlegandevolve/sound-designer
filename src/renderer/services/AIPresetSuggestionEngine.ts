import { PluginProject, DSPNode } from '@shared/types';
import { CloudPreset } from './CloudSyncService';

/**
 * AI Preset Suggestion Engine
 * Machine learning-powered preset recommendations
 * based on user preferences, usage patterns, and audio analysis
 */

export interface PresetSuggestion {
  preset: CloudPreset;
  score: number;
  reason: string;
  category: 'similar' | 'complementary' | 'trending' | 'personalized';
}

export interface UserPreferences {
  favoriteCategories: string[];
  favoriteAuthors: string[];
  recentlyUsed: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  musicalGenres: string[];
}

export interface AudioFeatures {
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  mfcc: number[];
  tempo?: number;
  key?: string;
  harmonicContent: number;
  noisiness: number;
}

export class AIPresetSuggestionEngine {
  private userPreferences: UserPreferences;
  private usageHistory: Map<string, number> = new Map();
  private modelEndpoint: string;

  constructor(modelEndpoint: string = 'https://api.sounddesigner.com/ai') {
    this.modelEndpoint = modelEndpoint;
    this.userPreferences = this.loadUserPreferences();
  }

  /**
   * Get preset suggestions based on current project
   */
  async getSuggestionsForProject(project: PluginProject): Promise<PresetSuggestion[]> {
    const suggestions: PresetSuggestion[] = [];

    try {
      // Analyze current project
      const projectFeatures = this.extractProjectFeatures(project);

      // Get AI-powered recommendations
      const aiSuggestions = await this.fetchAISuggestions(projectFeatures);
      suggestions.push(...aiSuggestions);

      // Get similar presets based on content
      const similarPresets = await this.findSimilarPresets(projectFeatures);
      suggestions.push(...similarPresets);

      // Get complementary presets
      const complementary = await this.findComplementaryPresets(project);
      suggestions.push(...complementary);

      // Get personalized recommendations
      const personalized = await this.getPersonalizedRecommendations();
      suggestions.push(...personalized);

      // Get trending presets
      const trending = await this.getTrendingPresets();
      suggestions.push(...trending);

      // Sort by score and deduplicate
      return this.deduplicateAndSort(suggestions).slice(0, 20);
    } catch (error) {
      console.error('Failed to get preset suggestions:', error);
      return [];
    }
  }

  /**
   * Get suggestions based on audio analysis
   */
  async getSuggestionsForAudio(audioBuffer: AudioBuffer): Promise<PresetSuggestion[]> {
    try {
      // Extract audio features
      const features = await this.extractAudioFeatures(audioBuffer);

      // Send features to AI model
      const response = await fetch(`${this.modelEndpoint}/suggest-from-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        throw new Error('AI suggestion request failed');
      }

      const suggestions = await response.json();

      return suggestions.map((s: any) => ({
        preset: s.preset,
        score: s.confidence,
        reason: s.explanation,
        category: 'personalized',
      }));
    } catch (error) {
      console.error('Failed to get audio-based suggestions:', error);
      return [];
    }
  }

  /**
   * Get suggestions based on text description
   */
  async getSuggestionsFromDescription(description: string): Promise<PresetSuggestion[]> {
    try {
      const response = await fetch(`${this.modelEndpoint}/suggest-from-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error('AI suggestion request failed');
      }

      const suggestions = await response.json();

      return suggestions.map((s: any) => ({
        preset: s.preset,
        score: s.relevance,
        reason: `Matches: "${s.matchedKeywords.join(', ')}"`,
        category: 'personalized',
      }));
    } catch (error) {
      console.error('Failed to get description-based suggestions:', error);
      return [];
    }
  }

  /**
   * Update user preferences based on actions
   */
  trackPresetUsage(presetId: string, action: 'load' | 'favorite' | 'download'): void {
    const currentCount = this.usageHistory.get(presetId) || 0;
    const weight = action === 'favorite' ? 3 : action === 'download' ? 2 : 1;

    this.usageHistory.set(presetId, currentCount + weight);

    // Update preferences
    this.updatePreferences();
  }

  /**
   * Extract features from project
   */
  private extractProjectFeatures(project: PluginProject): any {
    const features = {
      nodeTypes: project.dspGraph.nodes.map((n) => n.type),
      nodeCount: project.dspGraph.nodes.length,
      connectionCount: project.dspGraph.connections?.length || 0,
      categories: this.categorizeNodes(project.dspGraph.nodes),
      complexity: this.calculateComplexity(project),
      hasMIDI: project.dspGraph.nodes.some((n) => n.type === 'oscillator'),
      hasEffects: project.dspGraph.nodes.some((n) =>
        ['delay', 'reverb', 'distortion'].includes(n.type)
      ),
    };

    return features;
  }

  /**
   * Categorize DSP nodes
   */
  private categorizeNodes(nodes: DSPNode[]): Record<string, number> {
    const categories: Record<string, number> = {};

    nodes.forEach((node) => {
      const category = this.getNodeCategory(node.type);
      categories[category] = (categories[category] || 0) + 1;
    });

    return categories;
  }

  /**
   * Get category for node type
   */
  private getNodeCategory(type: string): string {
    const categoryMap: Record<string, string> = {
      oscillator: 'synthesis',
      filter: 'filters',
      delay: 'effects',
      reverb: 'effects',
      compressor: 'dynamics',
      eq: 'filters',
      distortion: 'effects',
    };

    return categoryMap[type] || 'utilities';
  }

  /**
   * Calculate project complexity score
   */
  private calculateComplexity(project: PluginProject): number {
    const nodeScore = project.dspGraph.nodes.length;
    const connectionScore = (project.dspGraph.connections?.length || 0) * 1.5;
    const parameterScore = project.dspGraph.nodes.reduce(
      (sum, node) => sum + (node.parameters?.length || 0),
      0
    );

    return nodeScore + connectionScore + parameterScore;
  }

  /**
   * Fetch AI-powered suggestions
   */
  private async fetchAISuggestions(features: any): Promise<PresetSuggestion[]> {
    try {
      const response = await fetch(`${this.modelEndpoint}/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          features,
          userPreferences: this.userPreferences,
        }),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return data.suggestions.map((s: any) => ({
        preset: s.preset,
        score: s.score,
        reason: s.reason,
        category: 'personalized',
      }));
    } catch {
      return [];
    }
  }

  /**
   * Find similar presets using content-based filtering
   */
  private async findSimilarPresets(features: any): Promise<PresetSuggestion[]> {
    // Implement similarity search using vector embeddings
    // For now, return mock data
    return [];
  }

  /**
   * Find complementary presets
   */
  private async findComplementaryPresets(project: PluginProject): Promise<PresetSuggestion[]> {
    // Find presets that complement the current project
    // e.g., if project has oscillators but no reverb, suggest reverb presets
    const suggestions: PresetSuggestion[] = [];

    const hasType = (type: string) => project.dspGraph.nodes.some((n) => n.type === type);

    // If has synthesis but no effects, suggest effects
    if (hasType('oscillator') && !hasType('reverb') && !hasType('delay')) {
      // Would query database for effect presets
    }

    return suggestions;
  }

  /**
   * Get personalized recommendations based on user history
   */
  private async getPersonalizedRecommendations(): Promise<PresetSuggestion[]> {
    const topCategories = this.userPreferences.favoriteCategories.slice(0, 3);

    // Would query database for presets in preferred categories
    return [];
  }

  /**
   * Get currently trending presets
   */
  private async getTrendingPresets(): Promise<PresetSuggestion[]> {
    try {
      const response = await fetch(`${this.modelEndpoint}/trending`, {
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return data.presets.map((preset: CloudPreset) => ({
        preset,
        score: 0.7,
        reason: 'Currently trending in the community',
        category: 'trending',
      }));
    } catch {
      return [];
    }
  }

  /**
   * Extract audio features from buffer
   */
  private async extractAudioFeatures(audioBuffer: AudioBuffer): Promise<AudioFeatures> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Calculate basic features
    const spectralCentroid = this.calculateSpectralCentroid(channelData, sampleRate);
    const spectralRolloff = this.calculateSpectralRolloff(channelData, sampleRate);
    const zeroCrossingRate = this.calculateZeroCrossingRate(channelData);
    const mfcc = this.calculateMFCC(channelData, sampleRate);
    const harmonicContent = this.calculateHarmonicContent(channelData);
    const noisiness = this.calculateNoisiness(channelData);

    return {
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate,
      mfcc,
      harmonicContent,
      noisiness,
    };
  }

  /**
   * Calculate spectral centroid
   */
  private calculateSpectralCentroid(data: Float32Array, sampleRate: number): number {
    // Simplified spectral centroid calculation
    const fftSize = 2048;
    const fft = this.performFFT(data.slice(0, fftSize));

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < fft.length; i++) {
      const frequency = (i * sampleRate) / fftSize;
      const magnitude = fft[i];

      numerator += frequency * magnitude;
      denominator += magnitude;
    }

    return numerator / (denominator || 1);
  }

  /**
   * Calculate spectral rolloff
   */
  private calculateSpectralRolloff(data: Float32Array, sampleRate: number): number {
    const fftSize = 2048;
    const fft = this.performFFT(data.slice(0, fftSize));
    const threshold = 0.85;

    const totalEnergy = fft.reduce((sum, val) => sum + val, 0);
    const targetEnergy = totalEnergy * threshold;

    let cumulativeEnergy = 0;
    for (let i = 0; i < fft.length; i++) {
      cumulativeEnergy += fft[i];

      if (cumulativeEnergy >= targetEnergy) {
        return (i * sampleRate) / fftSize;
      }
    }

    return sampleRate / 2;
  }

  /**
   * Calculate zero crossing rate
   */
  private calculateZeroCrossingRate(data: Float32Array): number {
    let crossings = 0;

    for (let i = 1; i < data.length; i++) {
      if ((data[i - 1] >= 0 && data[i] < 0) || (data[i - 1] < 0 && data[i] >= 0)) {
        crossings++;
      }
    }

    return crossings / data.length;
  }

  /**
   * Calculate MFCC (simplified)
   */
  private calculateMFCC(data: Float32Array, sampleRate: number): number[] {
    // Simplified MFCC calculation
    // In production, use a proper MFCC library
    const coefficients = 13;
    const mfcc: number[] = [];

    for (let i = 0; i < coefficients; i++) {
      mfcc.push(Math.random()); // Placeholder
    }

    return mfcc;
  }

  /**
   * Calculate harmonic content
   */
  private calculateHarmonicContent(data: Float32Array): number {
    const fft = this.performFFT(data.slice(0, 2048));

    // Find peaks in FFT
    const peaks = this.findPeaks(fft, 10);

    // Calculate harmonic ratio
    let harmonicEnergy = 0;
    let totalEnergy = 0;

    for (let i = 0; i < fft.length; i++) {
      totalEnergy += fft[i];

      if (peaks.includes(i)) {
        harmonicEnergy += fft[i];
      }
    }

    return harmonicEnergy / (totalEnergy || 1);
  }

  /**
   * Calculate noisiness
   */
  private calculateNoisiness(data: Float32Array): number {
    return 1 - this.calculateHarmonicContent(data);
  }

  /**
   * Perform FFT (simplified)
   */
  private performFFT(data: Float32Array): Float32Array {
    // In production, use a proper FFT library
    // This is a placeholder
    const result = new Float32Array(data.length / 2);

    for (let i = 0; i < result.length; i++) {
      result[i] = Math.abs(data[i]);
    }

    return result;
  }

  /**
   * Find peaks in array
   */
  private findPeaks(data: Float32Array, numPeaks: number): number[] {
    const peaks: Array<{ index: number; value: number }> = [];

    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        peaks.push({ index: i, value: data[i] });
      }
    }

    return peaks
      .sort((a, b) => b.value - a.value)
      .slice(0, numPeaks)
      .map((p) => p.index);
  }

  /**
   * Deduplicate and sort suggestions
   */
  private deduplicateAndSort(suggestions: PresetSuggestion[]): PresetSuggestion[] {
    const seen = new Set<string>();
    const unique: PresetSuggestion[] = [];

    for (const suggestion of suggestions) {
      if (!seen.has(suggestion.preset.id)) {
        seen.add(suggestion.preset.id);
        unique.push(suggestion);
      }
    }

    return unique.sort((a, b) => b.score - a.score);
  }

  /**
   * Update user preferences
   */
  private updatePreferences(): void {
    // Analyze usage history to update preferences
    // Save to local storage
    localStorage.setItem('aiUserPreferences', JSON.stringify(this.userPreferences));
  }

  /**
   * Load user preferences
   */
  private loadUserPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem('aiUserPreferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore errors
    }

    // Default preferences
    return {
      favoriteCategories: [],
      favoriteAuthors: [],
      recentlyUsed: [],
      skillLevel: 'intermediate',
      musicalGenres: [],
    };
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
  }
}

export default AIPresetSuggestionEngine;
