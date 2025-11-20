/**
 * Audio Node Templates
 *
 * Definitions for all available audio node types
 */

import {
  NodeTemplate,
  AudioNodeType,
  ParameterType,
  WaveformType,
  FilterType,
} from '../../shared/audioGraphTypes';

/**
 * All available node templates
 */
export const nodeTemplates: NodeTemplate[] = [
  // ============================================================================
  // SOURCE NODES
  // ============================================================================

  {
    type: AudioNodeType.OSCILLATOR,
    name: 'Oscillator',
    description: 'Generates periodic waveforms',
    category: 'source',
    icon: '〜',
    color: '#6496ff',
    defaultParameters: [
      {
        name: 'Frequency',
        type: ParameterType.FREQUENCY,
        value: 440,
        min: 20,
        max: 20000,
        default: 440,
        unit: 'Hz',
        automatable: true,
      },
      {
        name: 'Detune',
        type: ParameterType.DETUNE,
        value: 0,
        min: -1200,
        max: 1200,
        default: 0,
        unit: 'cents',
        automatable: true,
      },
      {
        name: 'Waveform',
        type: ParameterType.WAVEFORM,
        value: 0,
        min: 0,
        max: 3,
        default: 0,
        options: [WaveformType.SINE, WaveformType.SQUARE, WaveformType.SAWTOOTH, WaveformType.TRIANGLE],
      },
      {
        name: 'Gain',
        type: ParameterType.GAIN,
        value: 0.5,
        min: 0,
        max: 1,
        default: 0.5,
        automatable: true,
      },
    ],
    defaultInputs: [
      { name: 'FM', type: 'control' },
    ],
    defaultOutputs: [
      { name: 'Out', type: 'audio' },
    ],
  },

  {
    type: AudioNodeType.NOISE,
    name: 'Noise Generator',
    description: 'Generates white/pink noise',
    category: 'source',
    icon: '⚡',
    color: '#ff6496',
    defaultParameters: [
      {
        name: 'Type',
        type: ParameterType.WAVEFORM,
        value: 0,
        min: 0,
        max: 1,
        default: 0,
        options: ['White', 'Pink'],
      },
      {
        name: 'Gain',
        type: ParameterType.GAIN,
        value: 0.3,
        min: 0,
        max: 1,
        default: 0.3,
        automatable: true,
      },
    ],
    defaultInputs: [],
    defaultOutputs: [
      { name: 'Out', type: 'audio' },
    ],
  },

  // ============================================================================
  // FILTER NODES
  // ============================================================================

  {
    type: AudioNodeType.FILTER,
    name: 'Filter',
    description: 'Multi-mode resonant filter',
    category: 'filter',
    icon: '▽',
    color: '#64c8ff',
    defaultParameters: [
      {
        name: 'Type',
        type: ParameterType.WAVEFORM,
        value: 0,
        min: 0,
        max: 7,
        default: 0,
        options: [
          FilterType.LOWPASS,
          FilterType.HIGHPASS,
          FilterType.BANDPASS,
          FilterType.NOTCH,
          FilterType.LOWSHELF,
          FilterType.HIGHSHELF,
          FilterType.PEAKING,
          FilterType.ALLPASS,
        ],
      },
      {
        name: 'Frequency',
        type: ParameterType.FREQUENCY,
        value: 1000,
        min: 20,
        max: 20000,
        default: 1000,
        unit: 'Hz',
        automatable: true,
      },
      {
        name: 'Resonance',
        type: ParameterType.Q,
        value: 1,
        min: 0.001,
        max: 30,
        default: 1,
        automatable: true,
      },
      {
        name: 'Gain',
        type: ParameterType.GAIN,
        value: 0,
        min: -40,
        max: 40,
        default: 0,
        unit: 'dB',
        automatable: true,
      },
    ],
    defaultInputs: [
      { name: 'In', type: 'audio' },
      { name: 'Cutoff CV', type: 'control' },
    ],
    defaultOutputs: [
      { name: 'Out', type: 'audio' },
    ],
  },

  // ============================================================================
  // EFFECT NODES
  // ============================================================================

  {
    type: AudioNodeType.DELAY,
    name: 'Delay',
    description: 'Stereo delay effect',
    category: 'effect',
    icon: '⟳',
    color: '#8ab4ff',
    defaultParameters: [
      {
        name: 'Time',
        type: ParameterType.TIME,
        value: 0.25,
        min: 0.001,
        max: 2,
        default: 0.25,
        unit: 's',
        step: 0.001,
        automatable: true,
      },
      {
        name: 'Feedback',
        type: ParameterType.FEEDBACK,
        value: 0.3,
        min: 0,
        max: 0.95,
        default: 0.3,
        automatable: true,
      },
      {
        name: 'Mix',
        type: ParameterType.MIX,
        value: 0.5,
        min: 0,
        max: 1,
        default: 0.5,
        automatable: true,
      },
    ],
    defaultInputs: [
      { name: 'In', type: 'audio' },
    ],
    defaultOutputs: [
      { name: 'Out', type: 'audio' },
    ],
  },

  {
    type: AudioNodeType.REVERB,
    name: 'Reverb',
    description: 'Algorithmic reverb',
    category: 'effect',
    icon: '◎',
    color: '#96c8ff',
    defaultParameters: [
      {
        name: 'Room Size',
        type: ParameterType.TIME,
        value: 0.5,
        min: 0,
        max: 1,
        default: 0.5,
        automatable: true,
      },
      {
        name: 'Damping',
        type: ParameterType.FEEDBACK,
        value: 0.5,
        min: 0,
        max: 1,
        default: 0.5,
        automatable: true,
      },
      {
        name: 'Mix',
        type: ParameterType.MIX,
        value: 0.3,
        min: 0,
        max: 1,
        default: 0.3,
        automatable: true,
      },
    ],
    defaultInputs: [
      { name: 'In', type: 'audio' },
    ],
    defaultOutputs: [
      { name: 'Out', type: 'audio' },
    ],
  },

  {
    type: AudioNodeType.DISTORTION,
    name: 'Distortion',
    description: 'Waveshaping distortion',
    category: 'effect',
    icon: '⌇',
    color: '#ff8864',
    defaultParameters: [
      {
        name: 'Drive',
        type: ParameterType.GAIN,
        value: 5,
        min: 1,
        max: 100,
        default: 5,
        automatable: true,
      },
      {
        name: 'Tone',
        type: ParameterType.FREQUENCY,
        value: 2000,
        min: 200,
        max: 8000,
        default: 2000,
        unit: 'Hz',
        automatable: true,
      },
      {
        name: 'Mix',
        type: ParameterType.MIX,
        value: 1,
        min: 0,
        max: 1,
        default: 1,
        automatable: true,
      },
    ],
    defaultInputs: [
      { name: 'In', type: 'audio' },
    ],
    defaultOutputs: [
      { name: 'Out', type: 'audio' },
    ],
  },

  {
    type: AudioNodeType.CHORUS,
    name: 'Chorus',
    description: 'Modulated delay chorus',
    category: 'effect',
    icon: '≈',
    color: '#64ffc8',
    defaultParameters: [
      {
        name: 'Rate',
        type: ParameterType.RATE,
        value: 0.5,
        min: 0.1,
        max: 10,
        default: 0.5,
        unit: 'Hz',
        automatable: true,
      },
      {
        name: 'Depth',
        type: ParameterType.DEPTH,
        value: 0.5,
        min: 0,
        max: 1,
        default: 0.5,
        automatable: true,
      },
      {
        name: 'Mix',
        type: ParameterType.MIX,
        value: 0.5,
        min: 0,
        max: 1,
        default: 0.5,
        automatable: true,
      },
    ],
    defaultInputs: [
      { name: 'In', type: 'audio' },
    ],
    defaultOutputs: [
      { name: 'Out', type: 'audio' },
    ],
  },

  {
    type: AudioNodeType.COMPRESSOR,
    name: 'Compressor',
    description: 'Dynamic range compressor',
    category: 'effect',
    icon: '⊟',
    color: '#ffc864',
    defaultParameters: [
      {
        name: 'Threshold',
        type: ParameterType.THRESHOLD,
        value: -24,
        min: -60,
        max: 0,
        default: -24,
        unit: 'dB',
        automatable: true,
      },
      {
        name: 'Ratio',
        type: ParameterType.RATIO,
        value: 4,
        min: 1,
        max: 20,
        default: 4,
        automatable: true,
      },
      {
        name: 'Attack',
        type: ParameterType.ATTACK,
        value: 0.003,
        min: 0,
        max: 1,
        default: 0.003,
        unit: 's',
        automatable: true,
      },
      {
        name: 'Release',
        type: ParameterType.RELEASE,
        value: 0.25,
        min: 0,
        max: 3,
        default: 0.25,
        unit: 's',
        automatable: true,
      },
    ],
    defaultInputs: [
      { name: 'In', type: 'audio' },
    ],
    defaultOutputs: [
      { name: 'Out', type: 'audio' },
    ],
  },

  // ============================================================================
  // MODULATION NODES
  // ============================================================================

  {
    type: AudioNodeType.LFO,
    name: 'LFO',
    description: 'Low frequency oscillator',
    category: 'modulation',
    icon: '∿',
    color: '#c864ff',
    defaultParameters: [
      {
        name: 'Rate',
        type: ParameterType.RATE,
        value: 1,
        min: 0.01,
        max: 20,
        default: 1,
        unit: 'Hz',
        automatable: true,
      },
      {
        name: 'Waveform',
        type: ParameterType.WAVEFORM,
        value: 0,
        min: 0,
        max: 3,
        default: 0,
        options: [WaveformType.SINE, WaveformType.SQUARE, WaveformType.SAWTOOTH, WaveformType.TRIANGLE],
      },
      {
        name: 'Depth',
        type: ParameterType.DEPTH,
        value: 1,
        min: 0,
        max: 1,
        default: 1,
        automatable: true,
      },
    ],
    defaultInputs: [],
    defaultOutputs: [
      { name: 'Out', type: 'control' },
    ],
  },

  {
    type: AudioNodeType.ENVELOPE,
    name: 'Envelope',
    description: 'ADSR envelope generator',
    category: 'modulation',
    icon: '⟋',
    color: '#ff64c8',
    defaultParameters: [
      {
        name: 'Attack',
        type: ParameterType.ATTACK,
        value: 0.01,
        min: 0,
        max: 2,
        default: 0.01,
        unit: 's',
        automatable: true,
      },
      {
        name: 'Decay',
        type: ParameterType.TIME,
        value: 0.1,
        min: 0,
        max: 2,
        default: 0.1,
        unit: 's',
        automatable: true,
      },
      {
        name: 'Sustain',
        type: ParameterType.GAIN,
        value: 0.7,
        min: 0,
        max: 1,
        default: 0.7,
        automatable: true,
      },
      {
        name: 'Release',
        type: ParameterType.RELEASE,
        value: 0.3,
        min: 0,
        max: 5,
        default: 0.3,
        unit: 's',
        automatable: true,
      },
    ],
    defaultInputs: [
      { name: 'Gate', type: 'control' },
    ],
    defaultOutputs: [
      { name: 'Out', type: 'control' },
    ],
  },

  // ============================================================================
  // UTILITY NODES
  // ============================================================================

  {
    type: AudioNodeType.GAIN,
    name: 'Gain',
    description: 'Volume control',
    category: 'utility',
    icon: '⊕',
    color: '#64ff96',
    defaultParameters: [
      {
        name: 'Gain',
        type: ParameterType.GAIN,
        value: 1,
        min: 0,
        max: 2,
        default: 1,
        automatable: true,
      },
    ],
    defaultInputs: [
      { name: 'In', type: 'audio' },
      { name: 'Gain CV', type: 'control' },
    ],
    defaultOutputs: [
      { name: 'Out', type: 'audio' },
    ],
  },

  {
    type: AudioNodeType.MIXER,
    name: 'Mixer',
    description: '4-channel mixer',
    category: 'utility',
    icon: '⫴',
    color: '#96ff64',
    defaultParameters: [
      {
        name: 'Ch 1 Gain',
        type: ParameterType.GAIN,
        value: 1,
        min: 0,
        max: 2,
        default: 1,
        automatable: true,
      },
      {
        name: 'Ch 2 Gain',
        type: ParameterType.GAIN,
        value: 1,
        min: 0,
        max: 2,
        default: 1,
        automatable: true,
      },
      {
        name: 'Ch 3 Gain',
        type: ParameterType.GAIN,
        value: 1,
        min: 0,
        max: 2,
        default: 1,
        automatable: true,
      },
      {
        name: 'Ch 4 Gain',
        type: ParameterType.GAIN,
        value: 1,
        min: 0,
        max: 2,
        default: 1,
        automatable: true,
      },
      {
        name: 'Master',
        type: ParameterType.GAIN,
        value: 1,
        min: 0,
        max: 2,
        default: 1,
        automatable: true,
      },
    ],
    defaultInputs: [
      { name: 'Ch 1', type: 'audio' },
      { name: 'Ch 2', type: 'audio' },
      { name: 'Ch 3', type: 'audio' },
      { name: 'Ch 4', type: 'audio' },
    ],
    defaultOutputs: [
      { name: 'Out', type: 'audio' },
    ],
  },

  {
    type: AudioNodeType.ANALYZER,
    name: 'Analyzer',
    description: 'Spectrum and waveform analysis',
    category: 'utility',
    icon: '📊',
    color: '#64ffff',
    defaultParameters: [],
    defaultInputs: [
      { name: 'In', type: 'audio' },
    ],
    defaultOutputs: [
      { name: 'Out', type: 'audio' },
    ],
  },

  // ============================================================================
  // OUTPUT NODE
  // ============================================================================

  {
    type: AudioNodeType.OUTPUT,
    name: 'Audio Output',
    description: 'Main audio output',
    category: 'output',
    icon: '🔊',
    color: '#64ff64',
    defaultParameters: [
      {
        name: 'Volume',
        type: ParameterType.GAIN,
        value: 0.7,
        min: 0,
        max: 1,
        default: 0.7,
        automatable: true,
      },
    ],
    defaultInputs: [
      { name: 'L', type: 'audio' },
      { name: 'R', type: 'audio' },
    ],
    defaultOutputs: [],
  },
];

/**
 * Get node template by type
 */
export function getNodeTemplate(type: AudioNodeType): NodeTemplate | undefined {
  return nodeTemplates.find((template) => template.type === type);
}

/**
 * Get node templates by category
 */
export function getNodeTemplatesByCategory(category: string): NodeTemplate[] {
  return nodeTemplates.filter((template) => template.category === category);
}

/**
 * Get all node categories
 */
export function getNodeCategories(): string[] {
  const categories = new Set(nodeTemplates.map((t) => t.category));
  return Array.from(categories);
}
