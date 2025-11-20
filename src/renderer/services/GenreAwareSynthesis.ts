import { DSPNode, PluginProject } from '@shared/types';

/**
 * Genre-Aware Synthesis System
 * AI-powered genre-specific synthesis and sound design
 */

export type MusicGenre =
  | 'edm'
  | 'dubstep'
  | 'house'
  | 'techno'
  | 'trance'
  | 'dnb'
  | 'trap'
  | 'hiphop'
  | 'pop'
  | 'rock'
  | 'ambient'
  | 'cinematic'
  | 'jazz'
  | 'classical';

export interface GenreCharacteristics {
  genre: MusicGenre;
  tempoRange: [number, number];
  keySignatures: string[];
  commonNodes: string[];
  commonEffects: string[];
  mixingStyle: {
    bassEmphasis: number;
    stereoWidth: number;
    reverbAmount: number;
    compression: number;
  };
  soundDesign: {
    synthesisType: 'subtractive' | 'fm' | 'wavetable' | 'granular' | 'sampling';
    filterCharacter: 'warm' | 'bright' | 'aggressive' | 'smooth';
    modulationRate: 'slow' | 'medium' | 'fast';
  };
}

export interface GenrePreset {
  name: string;
  genre: MusicGenre;
  description: string;
  nodes: DSPNode[];
  tags: string[];
  popularity: number;
}

export class GenreAwareSynthesis {
  private genreDatabase: Map<MusicGenre, GenreCharacteristics>;
  private apiEndpoint: string;

  constructor(apiEndpoint: string = 'https://api.sounddesigner.com/ai/genre') {
    this.apiEndpoint = apiEndpoint;
    this.genreDatabase = this.initializeGenreDatabase();
  }

  /**
   * Generate a synth patch for specific genre
   */
  async generateForGenre(
    genre: MusicGenre,
    soundType: 'lead' | 'bass' | 'pad' | 'pluck' | 'arp' | 'fx'
  ): Promise<PluginProject> {
    const characteristics = this.genreDatabase.get(genre);
    if (!characteristics) {
      throw new Error(`Unknown genre: ${genre}`);
    }

    const nodes = await this.createNodesForGenre(genre, soundType, characteristics);

    return {
      id: `genre-${genre}-${soundType}-${Date.now()}`,
      name: `${genre.toUpperCase()} ${soundType.charAt(0).toUpperCase() + soundType.slice(1)}`,
      description: `AI-generated ${soundType} for ${genre} music`,
      version: '1.0.0',
      author: 'AI Genre Generator',
      category: genre,
      tags: [genre, soundType, 'ai-generated'],
      dspGraph: {
        nodes,
        connections: this.createConnections(nodes),
      },
      uiComponents: [],
      code: {
        dsp: '',
        ui: '',
        helpers: '',
      },
      settings: {
        width: 800,
        height: 600,
        backgroundColor: '#1a1a1a',
        accentColor: '#4a9eff',
      },
    };
  }

  /**
   * Analyze audio and suggest genre
   */
  async detectGenre(audioBuffer: AudioBuffer): Promise<{
    topGenres: Array<{ genre: MusicGenre; confidence: number }>;
    bpm?: number;
    key?: string;
  }> {
    try {
      // Send audio to AI for analysis
      const features = await this.extractGenreFeatures(audioBuffer);

      const response = await fetch(`${this.apiEndpoint}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        throw new Error('Genre detection failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Genre detection failed:', error);

      // Fallback to simple heuristics
      return this.detectGenreHeuristics(audioBuffer);
    }
  }

  /**
   * Get genre-specific presets
   */
  async getGenrePresets(genre: MusicGenre): Promise<GenrePreset[]> {
    try {
      const response = await fetch(`${this.apiEndpoint}/presets/${genre}`, {
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch genre presets:', error);
    }

    // Return built-in presets
    return this.getBuiltInPresetsForGenre(genre);
  }

  /**
   * Adapt existing project to genre
   */
  async adaptToGenre(project: PluginProject, targetGenre: MusicGenre): Promise<PluginProject> {
    const characteristics = this.genreDatabase.get(targetGenre);
    if (!characteristics) {
      throw new Error(`Unknown genre: ${targetGenre}`);
    }

    const adaptedProject = { ...project };

    // Adjust mixing style
    adaptedProject.dspGraph.nodes = await this.adaptMixing(
      project.dspGraph.nodes,
      characteristics.mixingStyle
    );

    // Add genre-specific effects
    const additionalEffects = this.suggestAdditionalEffects(
      project.dspGraph.nodes,
      characteristics.commonEffects
    );

    adaptedProject.dspGraph.nodes.push(...additionalEffects);

    // Update connections
    adaptedProject.dspGraph.connections = this.createConnections(adaptedProject.dspGraph.nodes);

    return adaptedProject;
  }

  /**
   * Get mixing recommendations for genre
   */
  getMixingRecommendations(genre: MusicGenre): {
    bassBoost: number;
    stereoWidth: number;
    reverbMix: number;
    compression: { ratio: number; threshold: number };
  } {
    const characteristics = this.genreDatabase.get(genre);
    if (!characteristics) {
      return {
        bassBoost: 0,
        stereoWidth: 50,
        reverbMix: 20,
        compression: { ratio: 4, threshold: -20 },
      };
    }

    const mixing = characteristics.mixingStyle;

    return {
      bassBoost: mixing.bassEmphasis * 12, // Convert to dB
      stereoWidth: mixing.stereoWidth,
      reverbMix: mixing.reverbAmount,
      compression: {
        ratio: 2 + mixing.compression * 6,
        threshold: -30 + mixing.compression * 20,
      },
    };
  }

  /**
   * Initialize genre database
   */
  private initializeGenreDatabase(): Map<MusicGenre, GenreCharacteristics> {
    const db = new Map<MusicGenre, GenreCharacteristics>();

    // EDM
    db.set('edm', {
      genre: 'edm',
      tempoRange: [120, 140],
      keySignatures: ['Cm', 'Am', 'Dm', 'Em'],
      commonNodes: ['oscillator', 'filter', 'reverb', 'delay', 'compressor'],
      commonEffects: ['sidechain', 'distortion', 'chorus'],
      mixingStyle: {
        bassEmphasis: 0.8,
        stereoWidth: 80,
        reverbAmount: 30,
        compression: 0.7,
      },
      soundDesign: {
        synthesisType: 'subtractive',
        filterCharacter: 'bright',
        modulationRate: 'fast',
      },
    });

    // Dubstep
    db.set('dubstep', {
      genre: 'dubstep',
      tempoRange: [138, 142],
      keySignatures: ['Dm', 'Am', 'Cm'],
      commonNodes: ['oscillator', 'filter', 'distortion', 'lfo'],
      commonEffects: ['wobble', 'distortion', 'reverb'],
      mixingStyle: {
        bassEmphasis: 1.0,
        stereoWidth: 90,
        reverbAmount: 40,
        compression: 0.9,
      },
      soundDesign: {
        synthesisType: 'fm',
        filterCharacter: 'aggressive',
        modulationRate: 'fast',
      },
    });

    // Ambient
    db.set('ambient', {
      genre: 'ambient',
      tempoRange: [60, 90],
      keySignatures: ['C', 'G', 'D', 'A'],
      commonNodes: ['oscillator', 'reverb', 'delay', 'filter'],
      commonEffects: ['reverb', 'delay', 'chorus'],
      mixingStyle: {
        bassEmphasis: 0.3,
        stereoWidth: 100,
        reverbAmount: 80,
        compression: 0.3,
      },
      soundDesign: {
        synthesisType: 'wavetable',
        filterCharacter: 'warm',
        modulationRate: 'slow',
      },
    });

    // Add more genres...
    // (Techno, House, Trap, etc.)

    return db;
  }

  /**
   * Create nodes for genre and sound type
   */
  private async createNodesForGenre(
    genre: MusicGenre,
    soundType: string,
    characteristics: GenreCharacteristics
  ): Promise<DSPNode[]> {
    const nodes: DSPNode[] = [];

    // Base oscillator
    if (soundType !== 'fx') {
      nodes.push(this.createOscillator(genre, soundType));
    }

    // Filter
    nodes.push(this.createFilter(characteristics.soundDesign.filterCharacter));

    // Envelope
    if (soundType !== 'pad') {
      nodes.push(this.createEnvelope(soundType));
    }

    // Genre-specific effects
    if (genre === 'dubstep' && soundType === 'bass') {
      nodes.push(this.createLFO('fast'));
      nodes.push(this.createDistortion(0.6));
    }

    if (genre === 'ambient') {
      nodes.push(this.createReverb(characteristics.mixingStyle.reverbAmount / 100));
      nodes.push(this.createDelay(0.5));
    }

    if (genre === 'edm' && soundType === 'lead') {
      nodes.push(this.createChorus());
      nodes.push(this.createDelay(0.3));
    }

    // Master gain
    nodes.push(this.createGain(0.8));

    return nodes;
  }

  /**
   * Create connections between nodes
   */
  private createConnections(nodes: DSPNode[]): Array<{ from: string; to: string }> {
    const connections: Array<{ from: string; to: string }> = [];

    for (let i = 0; i < nodes.length - 1; i++) {
      connections.push({
        from: nodes[i].id,
        to: nodes[i + 1].id,
      });
    }

    return connections;
  }

  /**
   * Extract features for genre detection
   */
  private async extractGenreFeatures(audioBuffer: AudioBuffer): Promise<any> {
    const channelData = audioBuffer.getChannelData(0);

    return {
      tempo: this.estimateTempo(channelData, audioBuffer.sampleRate),
      spectralCentroid: 0, // Would calculate
      zeroCrossingRate: 0, // Would calculate
      harmonicContent: 0, // Would calculate
    };
  }

  /**
   * Detect genre using heuristics
   */
  private detectGenreHeuristics(audioBuffer: AudioBuffer): {
    topGenres: Array<{ genre: MusicGenre; confidence: number }>;
  } {
    // Simple heuristic-based detection
    return {
      topGenres: [
        { genre: 'edm', confidence: 0.6 },
        { genre: 'house', confidence: 0.3 },
      ],
    };
  }

  /**
   * Estimate tempo (placeholder)
   */
  private estimateTempo(data: Float32Array, sampleRate: number): number {
    return 128; // Placeholder
  }

  /**
   * Get built-in presets for genre
   */
  private getBuiltInPresetsForGenre(genre: MusicGenre): GenrePreset[] {
    // Return sample presets
    return [];
  }

  /**
   * Adapt mixing to genre style
   */
  private async adaptMixing(
    nodes: DSPNode[],
    mixingStyle: GenreCharacteristics['mixingStyle']
  ): Promise<DSPNode[]> {
    // Adjust existing nodes based on mixing style
    return nodes.map((node) => {
      if (node.type === 'compressor') {
        const ratio = node.parameters?.find((p) => p.name === 'ratio');
        if (ratio) {
          ratio.value = 2 + mixingStyle.compression * 6;
        }
      }

      if (node.type === 'reverb') {
        const mix = node.parameters?.find((p) => p.name === 'mix');
        if (mix) {
          mix.value = mixingStyle.reverbAmount / 100;
        }
      }

      return node;
    });
  }

  /**
   * Suggest additional effects for genre
   */
  private suggestAdditionalEffects(existingNodes: DSPNode[], commonEffects: string[]): DSPNode[] {
    const additionalEffects: DSPNode[] = [];

    for (const effect of commonEffects) {
      const hasEffect = existingNodes.some((n) => n.type === effect);
      if (!hasEffect) {
        switch (effect) {
          case 'reverb':
            additionalEffects.push(this.createReverb(0.3));
            break;
          case 'delay':
            additionalEffects.push(this.createDelay(0.4));
            break;
          case 'distortion':
            additionalEffects.push(this.createDistortion(0.3));
            break;
        }
      }
    }

    return additionalEffects;
  }

  // Node creation helpers
  private createOscillator(genre: MusicGenre, soundType: string): DSPNode {
    const type = genre === 'dubstep' ? 'sawtooth' : soundType === 'bass' ? 'square' : 'sine';

    return {
      id: `osc-${Date.now()}`,
      type: 'oscillator',
      label: 'Oscillator',
      position: { x: 100, y: 100 },
      parameters: [
        { id: 'type', name: 'Type', value: type as any, min: 0, max: 1, default: 0 },
        { id: 'frequency', name: 'Frequency', value: 440, min: 20, max: 20000, default: 440 },
      ],
    };
  }

  private createFilter(character: string): DSPNode {
    return {
      id: `filter-${Date.now()}`,
      type: 'filter',
      label: 'Filter',
      position: { x: 300, y: 100 },
      parameters: [
        { id: 'frequency', name: 'Cutoff', value: 2000, min: 20, max: 20000, default: 2000 },
        { id: 'Q', name: 'Resonance', value: 1, min: 0.1, max: 30, default: 1 },
      ],
    };
  }

  private createEnvelope(soundType: string): DSPNode {
    const attack = soundType === 'pluck' ? 0.001 : 0.01;
    const release = soundType === 'pluck' ? 0.1 : 0.5;

    return {
      id: `env-${Date.now()}`,
      type: 'envelope',
      label: 'Envelope',
      position: { x: 500, y: 100 },
      parameters: [
        { id: 'attack', name: 'Attack', value: attack, min: 0, max: 2, default: attack },
        { id: 'decay', name: 'Decay', value: 0.2, min: 0, max: 2, default: 0.2 },
        { id: 'sustain', name: 'Sustain', value: 0.7, min: 0, max: 1, default: 0.7 },
        { id: 'release', name: 'Release', value: release, min: 0, max: 5, default: release },
      ],
    };
  }

  private createLFO(rate: string): DSPNode {
    const frequency = rate === 'fast' ? 10 : rate === 'medium' ? 2 : 0.5;

    return {
      id: `lfo-${Date.now()}`,
      type: 'lfo',
      label: 'LFO',
      position: { x: 700, y: 100 },
      parameters: [
        { id: 'frequency', name: 'Rate', value: frequency, min: 0.01, max: 20, default: frequency },
        { id: 'depth', name: 'Depth', value: 0.5, min: 0, max: 1, default: 0.5 },
      ],
    };
  }

  private createDistortion(amount: number): DSPNode {
    return {
      id: `dist-${Date.now()}`,
      type: 'distortion',
      label: 'Distortion',
      position: { x: 900, y: 100 },
      parameters: [
        { id: 'amount', name: 'Amount', value: amount, min: 0, max: 1, default: amount },
      ],
    };
  }

  private createReverb(mix: number): DSPNode {
    return {
      id: `reverb-${Date.now()}`,
      type: 'reverb',
      label: 'Reverb',
      position: { x: 1100, y: 100 },
      parameters: [
        { id: 'mix', name: 'Mix', value: mix, min: 0, max: 1, default: mix },
        { id: 'size', name: 'Size', value: 0.5, min: 0, max: 1, default: 0.5 },
      ],
    };
  }

  private createDelay(mix: number): DSPNode {
    return {
      id: `delay-${Date.now()}`,
      type: 'delay',
      label: 'Delay',
      position: { x: 1300, y: 100 },
      parameters: [
        { id: 'time', name: 'Time', value: 0.5, min: 0, max: 5, default: 0.5 },
        { id: 'feedback', name: 'Feedback', value: 0.3, min: 0, max: 0.95, default: 0.3 },
        { id: 'mix', name: 'Mix', value: mix, min: 0, max: 1, default: mix },
      ],
    };
  }

  private createChorus(): DSPNode {
    return {
      id: `chorus-${Date.now()}`,
      type: 'chorus',
      label: 'Chorus',
      position: { x: 1500, y: 100 },
      parameters: [
        { id: 'rate', name: 'Rate', value: 1, min: 0.1, max: 10, default: 1 },
        { id: 'depth', name: 'Depth', value: 0.5, min: 0, max: 1, default: 0.5 },
      ],
    };
  }

  private createGain(value: number): DSPNode {
    return {
      id: `gain-${Date.now()}`,
      type: 'gain',
      label: 'Gain',
      position: { x: 1700, y: 100 },
      parameters: [
        { id: 'gain', name: 'Gain', value, min: 0, max: 2, default: value },
      ],
    };
  }

  private getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
  }
}

export default GenreAwareSynthesis;
