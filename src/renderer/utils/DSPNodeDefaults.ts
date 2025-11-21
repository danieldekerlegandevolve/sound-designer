import { nanoid } from 'nanoid';
import { DSPParameter } from '@shared/types';

/**
 * Default parameters for each DSP node type
 */
export function getDefaultParametersForNodeType(nodeType: string): DSPParameter[] {
  switch (nodeType) {
    case 'oscillator':
      return [
        {
          id: nanoid(),
          name: 'waveform',
          type: 'enum',
          default: 'sine',
          value: 'sine',
          options: ['sine', 'square', 'sawtooth', 'triangle'],
        },
        {
          id: nanoid(),
          name: 'frequency',
          type: 'float',
          min: 20,
          max: 20000,
          default: 440,
          value: 440,
          unit: 'Hz',
        },
        {
          id: nanoid(),
          name: 'detune',
          type: 'float',
          min: -100,
          max: 100,
          default: 0,
          value: 0,
          unit: 'cents',
        },
      ];

    case 'filter':
      return [
        {
          id: nanoid(),
          name: 'type',
          type: 'enum',
          default: 'lowpass',
          value: 'lowpass',
          options: ['lowpass', 'highpass', 'bandpass', 'notch', 'allpass', 'lowshelf', 'highshelf', 'peaking'],
        },
        {
          id: nanoid(),
          name: 'frequency',
          type: 'float',
          min: 20,
          max: 20000,
          default: 1000,
          value: 1000,
          unit: 'Hz',
        },
        {
          id: nanoid(),
          name: 'Q',
          type: 'float',
          min: 0.01,
          max: 100,
          default: 1,
          value: 1,
        },
        {
          id: nanoid(),
          name: 'gain',
          type: 'float',
          min: -40,
          max: 40,
          default: 0,
          value: 0,
          unit: 'dB',
        },
      ];

    case 'envelope':
      return [
        {
          id: nanoid(),
          name: 'attack',
          type: 'float',
          min: 0.001,
          max: 10,
          default: 0.01,
          value: 0.01,
          unit: 's',
        },
        {
          id: nanoid(),
          name: 'decay',
          type: 'float',
          min: 0.001,
          max: 10,
          default: 0.3,
          value: 0.3,
          unit: 's',
        },
        {
          id: nanoid(),
          name: 'sustain',
          type: 'float',
          min: 0,
          max: 1,
          default: 0.7,
          value: 0.7,
        },
        {
          id: nanoid(),
          name: 'release',
          type: 'float',
          min: 0.001,
          max: 10,
          default: 0.5,
          value: 0.5,
          unit: 's',
        },
      ];

    case 'lfo':
      return [
        {
          id: nanoid(),
          name: 'waveform',
          type: 'enum',
          default: 'sine',
          value: 'sine',
          options: ['sine', 'square', 'triangle', 'sawtooth'],
        },
        {
          id: nanoid(),
          name: 'rate',
          type: 'float',
          min: 0.01,
          max: 20,
          default: 1,
          value: 1,
          unit: 'Hz',
        },
        {
          id: nanoid(),
          name: 'depth',
          type: 'float',
          min: 0,
          max: 1,
          default: 0.5,
          value: 0.5,
        },
        {
          id: nanoid(),
          name: 'phase',
          type: 'float',
          min: 0,
          max: 360,
          default: 0,
          value: 0,
          unit: '°',
        },
      ];

    case 'gain':
      return [
        {
          id: nanoid(),
          name: 'gain',
          type: 'float',
          min: 0,
          max: 2,
          default: 1,
          value: 1,
        },
      ];

    case 'delay':
      return [
        {
          id: nanoid(),
          name: 'delayTime',
          type: 'float',
          min: 0,
          max: 5,
          default: 0.25,
          value: 0.25,
          unit: 's',
        },
        {
          id: nanoid(),
          name: 'feedback',
          type: 'float',
          min: 0,
          max: 0.95,
          default: 0.5,
          value: 0.5,
        },
        {
          id: nanoid(),
          name: 'mix',
          type: 'float',
          min: 0,
          max: 1,
          default: 0.3,
          value: 0.3,
        },
      ];

    case 'reverb':
      return [
        {
          id: nanoid(),
          name: 'roomSize',
          type: 'float',
          min: 0,
          max: 1,
          default: 0.5,
          value: 0.5,
        },
        {
          id: nanoid(),
          name: 'damping',
          type: 'float',
          min: 0,
          max: 1,
          default: 0.5,
          value: 0.5,
        },
        {
          id: nanoid(),
          name: 'width',
          type: 'float',
          min: 0,
          max: 1,
          default: 1,
          value: 1,
        },
        {
          id: nanoid(),
          name: 'mix',
          type: 'float',
          min: 0,
          max: 1,
          default: 0.3,
          value: 0.3,
        },
      ];

    case 'distortion':
      return [
        {
          id: nanoid(),
          name: 'drive',
          type: 'float',
          min: 0,
          max: 100,
          default: 10,
          value: 10,
        },
        {
          id: nanoid(),
          name: 'tone',
          type: 'float',
          min: 0,
          max: 1,
          default: 0.5,
          value: 0.5,
        },
        {
          id: nanoid(),
          name: 'output',
          type: 'float',
          min: 0,
          max: 2,
          default: 1,
          value: 1,
        },
      ];

    case 'compressor':
      return [
        {
          id: nanoid(),
          name: 'threshold',
          type: 'float',
          min: -60,
          max: 0,
          default: -20,
          value: -20,
          unit: 'dB',
        },
        {
          id: nanoid(),
          name: 'ratio',
          type: 'float',
          min: 1,
          max: 20,
          default: 4,
          value: 4,
        },
        {
          id: nanoid(),
          name: 'attack',
          type: 'float',
          min: 0.1,
          max: 100,
          default: 10,
          value: 10,
          unit: 'ms',
        },
        {
          id: nanoid(),
          name: 'release',
          type: 'float',
          min: 10,
          max: 1000,
          default: 100,
          value: 100,
          unit: 'ms',
        },
        {
          id: nanoid(),
          name: 'knee',
          type: 'float',
          min: 0,
          max: 40,
          default: 6,
          value: 6,
          unit: 'dB',
        },
      ];

    case 'eq':
      return [
        {
          id: nanoid(),
          name: 'frequency',
          type: 'float',
          min: 20,
          max: 20000,
          default: 1000,
          value: 1000,
          unit: 'Hz',
        },
        {
          id: nanoid(),
          name: 'Q',
          type: 'float',
          min: 0.1,
          max: 10,
          default: 1,
          value: 1,
        },
        {
          id: nanoid(),
          name: 'gain',
          type: 'float',
          min: -12,
          max: 12,
          default: 0,
          value: 0,
          unit: 'dB',
        },
      ];

    case 'mixer':
      return [
        {
          id: nanoid(),
          name: 'gain1',
          type: 'float',
          min: 0,
          max: 2,
          default: 1,
          value: 1,
        },
        {
          id: nanoid(),
          name: 'gain2',
          type: 'float',
          min: 0,
          max: 2,
          default: 1,
          value: 1,
        },
        {
          id: nanoid(),
          name: 'wet',
          type: 'float',
          min: 0,
          max: 1,
          default: 0.5,
          value: 0.5,
        },
        {
          id: nanoid(),
          name: 'dry',
          type: 'float',
          min: 0,
          max: 1,
          default: 0.5,
          value: 0.5,
        },
      ];

    case 'noise':
      return [
        {
          id: nanoid(),
          name: 'type',
          type: 'enum',
          default: 'white',
          value: 'white',
          options: ['white', 'pink', 'brown'],
        },
        {
          id: nanoid(),
          name: 'level',
          type: 'float',
          min: 0,
          max: 1,
          default: 0.5,
          value: 0.5,
        },
      ];

    case 'ringmod':
      return [
        {
          id: nanoid(),
          name: 'frequency',
          type: 'float',
          min: 1,
          max: 1000,
          default: 100,
          value: 100,
          unit: 'Hz',
        },
        {
          id: nanoid(),
          name: 'mix',
          type: 'float',
          min: 0,
          max: 1,
          default: 0.5,
          value: 0.5,
        },
      ];

    case 'bitcrusher':
      return [
        {
          id: nanoid(),
          name: 'bits',
          type: 'int',
          min: 1,
          max: 16,
          default: 8,
          value: 8,
        },
        {
          id: nanoid(),
          name: 'sampleRate',
          type: 'float',
          min: 100,
          max: 44100,
          default: 8000,
          value: 8000,
          unit: 'Hz',
        },
        {
          id: nanoid(),
          name: 'mix',
          type: 'float',
          min: 0,
          max: 1,
          default: 0.5,
          value: 0.5,
        },
      ];

    case 'input':
    case 'output':
      return []; // Input/output nodes don't have parameters

    default:
      return [];
  }
}

/**
 * Get parameter label for display
 */
export function getParameterLabel(param: DSPParameter): string {
  let label = param.name.charAt(0).toUpperCase() + param.name.slice(1);
  if (param.unit) {
    label += ` (${param.unit})`;
  }
  return label;
}

/**
 * Format parameter value for display
 */
export function formatParameterValue(param: DSPParameter): string {
  if (param.type === 'enum') {
    return param.value;
  } else if (param.type === 'int') {
    return String(Math.round(param.value));
  } else if (param.type === 'bool') {
    return param.value ? 'On' : 'Off';
  } else {
    // Float
    return param.value.toFixed(2);
  }
}
