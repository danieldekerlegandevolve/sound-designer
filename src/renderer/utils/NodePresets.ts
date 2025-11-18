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
