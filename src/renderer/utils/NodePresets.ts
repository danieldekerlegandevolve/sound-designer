import { DSPNode, DSPParameter } from '@shared/types';

export interface NodePreset {
  id: string;
  name: string;
  nodeType: DSPNode['type'];
  description: string;
  parameters: DSPParameter[];
  category: 'synth' | 'effect' | 'utility' | 'custom';
}

// Built-in presets
export const builtInPresets: NodePreset[] = [
  // Oscillator Presets
  {
    id: 'osc-sub-bass',
    name: 'Sub Bass',
    nodeType: 'oscillator',
    description: 'Low frequency sine wave for sub bass',
    category: 'synth',
    parameters: [
      { id: 'freq', name: 'frequency', type: 'float', min: 20, max: 200, default: 55, value: 55, unit: 'Hz' },
      { id: 'type', name: 'type', type: 'enum', default: 'sine', value: 'sine', options: ['sine', 'square', 'sawtooth', 'triangle'] },
    ],
  },
  {
    id: 'osc-lead',
    name: 'Lead Synth',
    nodeType: 'oscillator',
    description: 'Bright sawtooth for lead sounds',
    category: 'synth',
    parameters: [
      { id: 'freq', name: 'frequency', type: 'float', min: 200, max: 2000, default: 440, value: 440, unit: 'Hz' },
      { id: 'type', name: 'type', type: 'enum', default: 'sawtooth', value: 'sawtooth', options: ['sine', 'square', 'sawtooth', 'triangle'] },
    ],
  },

  // Filter Presets
  {
    id: 'filter-lowpass',
    name: 'Low Pass Filter',
    nodeType: 'filter',
    description: 'Classic low pass filter for warmth',
    category: 'effect',
    parameters: [
      { id: 'freq', name: 'frequency', type: 'float', min: 20, max: 20000, default: 2000, value: 2000, unit: 'Hz' },
      { id: 'q', name: 'Q', type: 'float', min: 0.1, max: 20, default: 1, value: 1 },
      { id: 'type', name: 'type', type: 'enum', default: 'lowpass', value: 'lowpass', options: ['lowpass', 'highpass', 'bandpass', 'notch'] },
    ],
  },
  {
    id: 'filter-highpass',
    name: 'High Pass Filter',
    nodeType: 'filter',
    description: 'Remove low frequencies',
    category: 'effect',
    parameters: [
      { id: 'freq', name: 'frequency', type: 'float', min: 20, max: 20000, default: 200, value: 200, unit: 'Hz' },
      { id: 'q', name: 'Q', type: 'float', min: 0.1, max: 20, default: 1, value: 1 },
      { id: 'type', name: 'type', type: 'enum', default: 'highpass', value: 'highpass', options: ['lowpass', 'highpass', 'bandpass', 'notch'] },
    ],
  },

  // Delay Presets
  {
    id: 'delay-short',
    name: 'Short Delay',
    nodeType: 'delay',
    description: 'Quick slap-back delay',
    category: 'effect',
    parameters: [
      { id: 'time', name: 'time', type: 'float', min: 0, max: 1, default: 0.125, value: 0.125, unit: 's' },
      { id: 'feedback', name: 'feedback', type: 'float', min: 0, max: 1, default: 0.3, value: 0.3 },
    ],
  },
  {
    id: 'delay-long',
    name: 'Long Delay',
    nodeType: 'delay',
    description: 'Ambient delay effect',
    category: 'effect',
    parameters: [
      { id: 'time', name: 'time', type: 'float', min: 0, max: 2, default: 0.5, value: 0.5, unit: 's' },
      { id: 'feedback', name: 'feedback', type: 'float', min: 0, max: 1, default: 0.6, value: 0.6 },
    ],
  },

  // Compressor Presets
  {
    id: 'comp-gentle',
    name: 'Gentle Compression',
    nodeType: 'compressor',
    description: 'Subtle dynamic control',
    category: 'effect',
    parameters: [
      { id: 'threshold', name: 'threshold', type: 'float', min: -60, max: 0, default: -24, value: -24, unit: 'dB' },
      { id: 'ratio', name: 'ratio', type: 'float', min: 1, max: 20, default: 3, value: 3 },
      { id: 'attack', name: 'attack', type: 'float', min: 0, max: 1, default: 0.003, value: 0.003, unit: 's' },
      { id: 'release', name: 'release', type: 'float', min: 0, max: 1, default: 0.25, value: 0.25, unit: 's' },
    ],
  },
  {
    id: 'comp-aggressive',
    name: 'Aggressive Compression',
    nodeType: 'compressor',
    description: 'Heavy dynamic control',
    category: 'effect',
    parameters: [
      { id: 'threshold', name: 'threshold', type: 'float', min: -60, max: 0, default: -12, value: -12, unit: 'dB' },
      { id: 'ratio', name: 'ratio', type: 'float', min: 1, max: 20, default: 8, value: 8 },
      { id: 'attack', name: 'attack', type: 'float', min: 0, max: 1, default: 0.001, value: 0.001, unit: 's' },
      { id: 'release', name: 'release', type: 'float', min: 0, max: 1, default: 0.1, value: 0.1, unit: 's' },
    ],
  },

  // Distortion Presets
  {
    id: 'dist-subtle',
    name: 'Subtle Distortion',
    nodeType: 'distortion',
    description: 'Light saturation',
    category: 'effect',
    parameters: [
      { id: 'amount', name: 'amount', type: 'float', min: 0, max: 100, default: 20, value: 20 },
    ],
  },
  {
    id: 'dist-heavy',
    name: 'Heavy Distortion',
    nodeType: 'distortion',
    description: 'Aggressive distortion',
    category: 'effect',
    parameters: [
      { id: 'amount', name: 'amount', type: 'float', min: 0, max: 100, default: 80, value: 80 },
    ],
  },

  // Reverb Presets
  {
    id: 'reverb-room',
    name: 'Room Reverb',
    nodeType: 'reverb',
    description: 'Small room ambience',
    category: 'effect',
    parameters: [
      { id: 'roomSize', name: 'room size', type: 'float', min: 0, max: 1, default: 0.3, value: 0.3 },
      { id: 'damping', name: 'damping', type: 'float', min: 0, max: 1, default: 0.5, value: 0.5 },
      { id: 'width', name: 'width', type: 'float', min: 0, max: 1, default: 1, value: 1 },
      { id: 'wet', name: 'wet', type: 'float', min: 0, max: 1, default: 0.2, value: 0.2 },
    ],
  },
  {
    id: 'reverb-hall',
    name: 'Hall Reverb',
    nodeType: 'reverb',
    description: 'Large hall space',
    category: 'effect',
    parameters: [
      { id: 'roomSize', name: 'room size', type: 'float', min: 0, max: 1, default: 0.8, value: 0.8 },
      { id: 'damping', name: 'damping', type: 'float', min: 0, max: 1, default: 0.3, value: 0.3 },
      { id: 'width', name: 'width', type: 'float', min: 0, max: 1, default: 1, value: 1 },
      { id: 'wet', name: 'wet', type: 'float', min: 0, max: 1, default: 0.4, value: 0.4 },
    ],
  },

  // Chorus Presets
  {
    id: 'chorus-subtle',
    name: 'Subtle Chorus',
    nodeType: 'chorus',
    description: 'Light chorus effect',
    category: 'effect',
    parameters: [
      { id: 'rate', name: 'rate', type: 'float', min: 0.1, max: 10, default: 1.5, value: 1.5, unit: 'Hz' },
      { id: 'depth', name: 'depth', type: 'float', min: 0, max: 1, default: 0.3, value: 0.3 },
      { id: 'delay', name: 'delay', type: 'float', min: 1, max: 50, default: 20, value: 20, unit: 'ms' },
      { id: 'feedback', name: 'feedback', type: 'float', min: 0, max: 1, default: 0.2, value: 0.2 },
    ],
  },
  {
    id: 'chorus-wide',
    name: 'Wide Chorus',
    nodeType: 'chorus',
    description: 'Lush stereo chorus',
    category: 'effect',
    parameters: [
      { id: 'rate', name: 'rate', type: 'float', min: 0.1, max: 10, default: 0.5, value: 0.5, unit: 'Hz' },
      { id: 'depth', name: 'depth', type: 'float', min: 0, max: 1, default: 0.6, value: 0.6 },
      { id: 'delay', name: 'delay', type: 'float', min: 1, max: 50, default: 30, value: 30, unit: 'ms' },
      { id: 'feedback', name: 'feedback', type: 'float', min: 0, max: 1, default: 0.4, value: 0.4 },
    ],
  },

  // Flanger Presets
  {
    id: 'flanger-classic',
    name: 'Classic Flanger',
    nodeType: 'flanger',
    description: 'Vintage flanger effect',
    category: 'effect',
    parameters: [
      { id: 'rate', name: 'rate', type: 'float', min: 0.1, max: 10, default: 0.25, value: 0.25, unit: 'Hz' },
      { id: 'depth', name: 'depth', type: 'float', min: 0, max: 1, default: 0.5, value: 0.5 },
      { id: 'delay', name: 'delay', type: 'float', min: 0.1, max: 10, default: 2, value: 2, unit: 'ms' },
      { id: 'feedback', name: 'feedback', type: 'float', min: -1, max: 1, default: 0.7, value: 0.7 },
    ],
  },
  {
    id: 'flanger-jet',
    name: 'Jet Flanger',
    nodeType: 'flanger',
    description: 'Extreme jet plane effect',
    category: 'effect',
    parameters: [
      { id: 'rate', name: 'rate', type: 'float', min: 0.1, max: 10, default: 2, value: 2, unit: 'Hz' },
      { id: 'depth', name: 'depth', type: 'float', min: 0, max: 1, default: 0.9, value: 0.9 },
      { id: 'delay', name: 'delay', type: 'float', min: 0.1, max: 10, default: 1, value: 1, unit: 'ms' },
      { id: 'feedback', name: 'feedback', type: 'float', min: -1, max: 1, default: 0.9, value: 0.9 },
    ],
  },

  // Phaser Presets
  {
    id: 'phaser-smooth',
    name: 'Smooth Phaser',
    nodeType: 'phaser',
    description: 'Smooth phasing effect',
    category: 'effect',
    parameters: [
      { id: 'rate', name: 'rate', type: 'float', min: 0.1, max: 10, default: 0.5, value: 0.5, unit: 'Hz' },
      { id: 'depth', name: 'depth', type: 'float', min: 0, max: 1, default: 0.5, value: 0.5 },
      { id: 'stages', name: 'stages', type: 'int', min: 2, max: 12, default: 4, value: 4 },
      { id: 'feedback', name: 'feedback', type: 'float', min: 0, max: 1, default: 0.5, value: 0.5 },
    ],
  },
  {
    id: 'phaser-intense',
    name: 'Intense Phaser',
    nodeType: 'phaser',
    description: 'Deep phasing effect',
    category: 'effect',
    parameters: [
      { id: 'rate', name: 'rate', type: 'float', min: 0.1, max: 10, default: 1.5, value: 1.5, unit: 'Hz' },
      { id: 'depth', name: 'depth', type: 'float', min: 0, max: 1, default: 0.8, value: 0.8 },
      { id: 'stages', name: 'stages', type: 'int', min: 2, max: 12, default: 8, value: 8 },
      { id: 'feedback', name: 'feedback', type: 'float', min: 0, max: 1, default: 0.7, value: 0.7 },
    ],
  },

  // Vocoder Presets
  {
    id: 'vocoder-classic',
    name: 'Classic Vocoder',
    nodeType: 'vocoder',
    description: 'Robotic voice effect',
    category: 'effect',
    parameters: [
      { id: 'bands', name: 'bands', type: 'int', min: 4, max: 32, default: 16, value: 16 },
      { id: 'emphasis', name: 'emphasis', type: 'float', min: 0, max: 10, default: 2, value: 2 },
      { id: 'attack', name: 'attack', type: 'float', min: 0.001, max: 0.1, default: 0.005, value: 0.005, unit: 's' },
      { id: 'release', name: 'release', type: 'float', min: 0.001, max: 0.5, default: 0.05, value: 0.05, unit: 's' },
    ],
  },
  {
    id: 'vocoder-vintage',
    name: 'Vintage Vocoder',
    nodeType: 'vocoder',
    description: 'Retro vocoder sound',
    category: 'effect',
    parameters: [
      { id: 'bands', name: 'bands', type: 'int', min: 4, max: 32, default: 8, value: 8 },
      { id: 'emphasis', name: 'emphasis', type: 'float', min: 0, max: 10, default: 5, value: 5 },
      { id: 'attack', name: 'attack', type: 'float', min: 0.001, max: 0.1, default: 0.01, value: 0.01, unit: 's' },
      { id: 'release', name: 'release', type: 'float', min: 0.001, max: 0.5, default: 0.1, value: 0.1, unit: 's' },
    ],
  },
];

// Preset storage (localStorage)
const PRESETS_KEY = 'sound-designer-node-presets';

export function saveCustomPreset(preset: NodePreset): void {
  const presets = getCustomPresets();
  presets.push(preset);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function getCustomPresets(): NodePreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function deleteCustomPreset(presetId: string): void {
  const presets = getCustomPresets().filter((p) => p.id !== presetId);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function getAllPresets(): NodePreset[] {
  return [...builtInPresets, ...getCustomPresets()];
}

export function getPresetsByType(nodeType: DSPNode['type']): NodePreset[] {
  return getAllPresets().filter((p) => p.nodeType === nodeType);
}

export function getPresetsByCategory(category: NodePreset['category']): NodePreset[] {
  return getAllPresets().filter((p) => p.category === category);
}

export function applyPreset(preset: NodePreset): Omit<DSPNode, 'id' | 'x' | 'y'> {
  return {
    type: preset.nodeType,
    parameters: preset.parameters.map((p) => ({ ...p })),
    inputs: ['input'],
    outputs: ['output'],
  };
}
