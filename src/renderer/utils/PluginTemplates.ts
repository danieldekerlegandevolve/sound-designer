import { nanoid } from 'nanoid';
import type { PluginProject } from '@shared/types';
import { getDefaultParametersForNodeType } from './DSPNodeDefaults';

export interface PluginTemplate {
  id: string;
  name: string;
  category: 'synth' | 'effect' | 'utility' | 'dynamics' | 'modulation';
  description: string;
  tags: string[];
  thumbnail?: string;
  project: Omit<PluginProject, 'id'>;
}

// Helper to create consistent node positions
const nodePos = (col: number, row: number) => ({
  x: 100 + col * 200,
  y: 100 + row * 120,
});

export const pluginTemplates: PluginTemplate[] = [
  // SYNTHESIZER TEMPLATE
  {
    id: 'template-synth-basic',
    name: 'Basic Synthesizer',
    category: 'synth',
    description: 'Simple subtractive synthesizer with oscillator, filter, and envelope',
    tags: ['synth', 'subtractive', 'beginner'],
    project: {
      name: 'Basic Synth',
      version: '1.0.0',
      description: 'A basic subtractive synthesizer',
      author: '',
      uiComponents: [
        {
          id: nanoid(),
          type: 'knob',
          label: 'Cutoff',
          x: 50,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 20,
            max: 20000,
            value: 1000,
            parameter: 'filter_cutoff',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Resonance',
          x: 150,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0,
            max: 1,
            value: 0.5,
            parameter: 'filter_resonance',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Attack',
          x: 250,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0.001,
            max: 2,
            value: 0.01,
            parameter: 'env_attack',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Decay',
          x: 350,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0.001,
            max: 2,
            value: 0.3,
            parameter: 'env_decay',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Sustain',
          x: 450,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0,
            max: 1,
            value: 0.7,
            parameter: 'env_sustain',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Release',
          x: 550,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0.001,
            max: 5,
            value: 0.5,
            parameter: 'env_release',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'waveform',
          label: 'Output',
          x: 50,
          y: 200,
          width: 300,
          height: 150,
          properties: {},
          style: {},
        },
      ],
      dspGraph: {
        nodes: [
          {
            id: nanoid(),
            type: 'oscillator',
            label: 'OSC',
            ...nodePos(0, 0),
            parameters: {
              waveform: 'sawtooth',
              frequency: 440,
              detune: 0,
            },
          },
          {
            id: nanoid(),
            type: 'filter',
            label: 'Filter',
            ...nodePos(1, 0),
            parameters: {
              type: 'lowpass',
              frequency: 1000,
              Q: 1,
            },
          },
          {
            id: nanoid(),
            type: 'envelope',
            label: 'Envelope',
            ...nodePos(2, 0),
            parameters: {
              attack: 0.01,
              decay: 0.3,
              sustain: 0.7,
              release: 0.5,
            },
          },
          {
            id: nanoid(),
            type: 'gain',
            label: 'Output',
            ...nodePos(3, 0),
            parameters: {
              gain: 0.5,
            },
          },
        ],
        connections: [
          {
            id: nanoid(),
            sourceNodeId: '',
            targetNodeId: '',
            sourcePort: 'output',
            targetPort: 'input',
          },
        ],
      },
      code: {
        dsp: `// Synth DSP code
void processSynth(float** outputs, int numSamples) {
  for (int i = 0; i < numSamples; ++i) {
    // Generate oscillator
    float osc = generateOscillator();

    // Apply filter
    float filtered = applyFilter(osc);

    // Apply envelope
    float enveloped = filtered * getEnvelopeValue();

    outputs[0][i] = enveloped;
    outputs[1][i] = enveloped;
  }
}`,
        ui: '// UI customization code here\n',
        helpers: '// Helper functions here\n',
      },
      settings: {
        width: 700,
        height: 400,
        resizable: true,
        backgroundColor: '#2a2a2a',
        sampleRate: 44100,
        bufferSize: 512,
      },
    },
  },

  // COMPRESSOR TEMPLATE
  {
    id: 'template-compressor',
    name: 'Dynamic Compressor',
    category: 'dynamics',
    description: 'Classic dynamics compressor with threshold, ratio, attack, and release controls',
    tags: ['compressor', 'dynamics', 'mastering'],
    project: {
      name: 'Compressor',
      version: '1.0.0',
      description: 'A dynamic range compressor',
      author: '',
      uiComponents: [
        {
          id: nanoid(),
          type: 'knob',
          label: 'Threshold',
          x: 50,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: -60,
            max: 0,
            value: -20,
            parameter: 'threshold',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Ratio',
          x: 150,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 1,
            max: 20,
            value: 4,
            parameter: 'ratio',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Attack',
          x: 250,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0.1,
            max: 100,
            value: 10,
            parameter: 'attack',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Release',
          x: 350,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 10,
            max: 1000,
            value: 100,
            parameter: 'release',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Makeup',
          x: 450,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0,
            max: 24,
            value: 0,
            parameter: 'makeup_gain',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'display',
          label: 'GR',
          x: 550,
          y: 50,
          width: 100,
          height: 100,
          properties: {
            parameter: 'gain_reduction',
          },
          style: {},
        },
      ],
      dspGraph: {
        nodes: [
          {
            id: nanoid(),
            type: 'input',
            label: 'Input',
            ...nodePos(0, 0),
            parameters: {},
          },
          {
            id: nanoid(),
            type: 'compressor',
            label: 'Compressor',
            ...nodePos(1, 0),
            parameters: {
              threshold: -20,
              ratio: 4,
              attack: 10,
              release: 100,
              knee: 6,
            },
          },
          {
            id: nanoid(),
            type: 'gain',
            label: 'Makeup',
            ...nodePos(2, 0),
            parameters: {
              gain: 1,
            },
          },
          {
            id: nanoid(),
            type: 'output',
            label: 'Output',
            ...nodePos(3, 0),
            parameters: {},
          },
        ],
        connections: [],
      },
      code: {
        dsp: `// Compressor DSP code
float processCompressor(float input, float threshold, float ratio) {
  float dB = 20.0f * log10(abs(input));

  if (dB > threshold) {
    float excess = dB - threshold;
    float compressed = threshold + (excess / ratio);
    float gainReduction = dB - compressed;
    return input * pow(10.0f, -gainReduction / 20.0f);
  }

  return input;
}`,
        ui: '// UI customization code here\n',
        helpers: '// Helper functions here\n',
      },
      settings: {
        width: 700,
        height: 300,
        resizable: true,
        backgroundColor: '#2a2a2a',
        sampleRate: 44100,
        bufferSize: 512,
      },
    },
  },

  // DELAY TEMPLATE
  {
    id: 'template-delay',
    name: 'Stereo Delay',
    category: 'effect',
    description: 'Stereo delay with feedback, filter, and modulation',
    tags: ['delay', 'echo', 'time-based'],
    project: {
      name: 'Stereo Delay',
      version: '1.0.0',
      description: 'A stereo delay effect',
      author: '',
      uiComponents: [
        {
          id: nanoid(),
          type: 'knob',
          label: 'Time L',
          x: 50,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 1,
            max: 2000,
            value: 250,
            parameter: 'time_left',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Time R',
          x: 150,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 1,
            max: 2000,
            value: 375,
            parameter: 'time_right',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Feedback',
          x: 250,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0,
            max: 0.95,
            value: 0.5,
            parameter: 'feedback',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Mix',
          x: 350,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0,
            max: 1,
            value: 0.3,
            parameter: 'mix',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'toggle',
          label: 'Ping-Pong',
          x: 450,
          y: 70,
          width: 120,
          height: 60,
          properties: {
            parameter: 'ping_pong',
          },
          style: {},
        },
      ],
      dspGraph: {
        nodes: [
          {
            id: nanoid(),
            type: 'input',
            label: 'Input',
            ...nodePos(0, 0),
            parameters: {},
          },
          {
            id: nanoid(),
            type: 'delay',
            label: 'Delay L',
            ...nodePos(1, 0),
            parameters: {
              delayTime: 250,
              feedback: 0.5,
            },
          },
          {
            id: nanoid(),
            type: 'delay',
            label: 'Delay R',
            ...nodePos(1, 1),
            parameters: {
              delayTime: 375,
              feedback: 0.5,
            },
          },
          {
            id: nanoid(),
            type: 'mixer',
            label: 'Mix',
            ...nodePos(2, 0),
            parameters: {
              wet: 0.3,
              dry: 0.7,
            },
          },
          {
            id: nanoid(),
            type: 'output',
            label: 'Output',
            ...nodePos(3, 0),
            parameters: {},
          },
        ],
        connections: [],
      },
      code: {
        dsp: `// Delay DSP code
class DelayLine {
  float* buffer;
  int size;
  int writePos;

  float process(float input, int delayTime, float feedback) {
    int readPos = (writePos - delayTime + size) % size;
    float output = buffer[readPos];
    buffer[writePos] = input + (output * feedback);
    writePos = (writePos + 1) % size;
    return output;
  }
};`,
        ui: '// UI customization code here\n',
        helpers: '// Helper functions here\n',
      },
      settings: {
        width: 600,
        height: 300,
        resizable: true,
        backgroundColor: '#2a2a2a',
        sampleRate: 44100,
        bufferSize: 512,
      },
    },
  },

  // EQ TEMPLATE
  {
    id: 'template-eq',
    name: '3-Band EQ',
    category: 'effect',
    description: 'Three-band parametric equalizer with low, mid, and high controls',
    tags: ['eq', 'equalizer', 'filter'],
    project: {
      name: '3-Band EQ',
      version: '1.0.0',
      description: 'A three-band parametric equalizer',
      author: '',
      uiComponents: [
        {
          id: nanoid(),
          type: 'knob',
          label: 'Low Freq',
          x: 50,
          y: 50,
          width: 70,
          height: 90,
          properties: {
            min: 20,
            max: 500,
            value: 100,
            parameter: 'low_freq',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Low Gain',
          x: 130,
          y: 50,
          width: 70,
          height: 90,
          properties: {
            min: -12,
            max: 12,
            value: 0,
            parameter: 'low_gain',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Mid Freq',
          x: 250,
          y: 50,
          width: 70,
          height: 90,
          properties: {
            min: 200,
            max: 5000,
            value: 1000,
            parameter: 'mid_freq',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Mid Gain',
          x: 330,
          y: 50,
          width: 70,
          height: 90,
          properties: {
            min: -12,
            max: 12,
            value: 0,
            parameter: 'mid_gain',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Mid Q',
          x: 410,
          y: 50,
          width: 70,
          height: 90,
          properties: {
            min: 0.1,
            max: 10,
            value: 1,
            parameter: 'mid_q',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'High Freq',
          x: 530,
          y: 50,
          width: 70,
          height: 90,
          properties: {
            min: 2000,
            max: 20000,
            value: 8000,
            parameter: 'high_freq',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'High Gain',
          x: 610,
          y: 50,
          width: 70,
          height: 90,
          properties: {
            min: -12,
            max: 12,
            value: 0,
            parameter: 'high_gain',
          },
          style: {},
        },
      ],
      dspGraph: {
        nodes: [
          {
            id: nanoid(),
            type: 'input',
            label: 'Input',
            ...nodePos(0, 0),
            parameters: {},
          },
          {
            id: nanoid(),
            type: 'filter',
            label: 'Low Shelf',
            ...nodePos(1, 0),
            parameters: {
              type: 'lowshelf',
              frequency: 100,
              gain: 0,
            },
          },
          {
            id: nanoid(),
            type: 'filter',
            label: 'Mid Peak',
            ...nodePos(2, 0),
            parameters: {
              type: 'peaking',
              frequency: 1000,
              Q: 1,
              gain: 0,
            },
          },
          {
            id: nanoid(),
            type: 'filter',
            label: 'High Shelf',
            ...nodePos(3, 0),
            parameters: {
              type: 'highshelf',
              frequency: 8000,
              gain: 0,
            },
          },
          {
            id: nanoid(),
            type: 'output',
            label: 'Output',
            ...nodePos(4, 0),
            parameters: {},
          },
        ],
        connections: [],
      },
      code: {
        dsp: `// EQ DSP code
class BiquadFilter {
  float b0, b1, b2, a1, a2;
  float x1, x2, y1, y2;

  void setPeaking(float freq, float Q, float gainDB, float sampleRate) {
    float A = pow(10.0f, gainDB / 40.0f);
    float omega = 2.0f * M_PI * freq / sampleRate;
    float alpha = sin(omega) / (2.0f * Q);

    b0 = 1.0f + alpha * A;
    b1 = -2.0f * cos(omega);
    b2 = 1.0f - alpha * A;
    a1 = -2.0f * cos(omega);
    a2 = 1.0f - alpha / A;
  }
};`,
        ui: '// UI customization code here\n',
        helpers: '// Helper functions here\n',
      },
      settings: {
        width: 700,
        height: 300,
        resizable: true,
        backgroundColor: '#2a2a2a',
        sampleRate: 44100,
        bufferSize: 512,
      },
    },
  },

  // REVERB TEMPLATE
  {
    id: 'template-reverb',
    name: 'Algorithmic Reverb',
    category: 'effect',
    description: 'Algorithmic reverb with room size, damping, and modulation',
    tags: ['reverb', 'space', 'ambience'],
    project: {
      name: 'Reverb',
      version: '1.0.0',
      description: 'An algorithmic reverb effect',
      author: '',
      uiComponents: [
        {
          id: nanoid(),
          type: 'knob',
          label: 'Room Size',
          x: 50,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0,
            max: 1,
            value: 0.5,
            parameter: 'room_size',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Damping',
          x: 150,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0,
            max: 1,
            value: 0.5,
            parameter: 'damping',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Width',
          x: 250,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0,
            max: 1,
            value: 1,
            parameter: 'width',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Mix',
          x: 350,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0,
            max: 1,
            value: 0.3,
            parameter: 'mix',
          },
          style: {},
        },
      ],
      dspGraph: {
        nodes: [
          {
            id: nanoid(),
            type: 'input',
            label: 'Input',
            ...nodePos(0, 0),
            parameters: {},
          },
          {
            id: nanoid(),
            type: 'reverb',
            label: 'Reverb',
            ...nodePos(1, 0),
            parameters: {
              roomSize: 0.5,
              damping: 0.5,
              width: 1,
            },
          },
          {
            id: nanoid(),
            type: 'mixer',
            label: 'Mix',
            ...nodePos(2, 0),
            parameters: {
              wet: 0.3,
              dry: 0.7,
            },
          },
          {
            id: nanoid(),
            type: 'output',
            label: 'Output',
            ...nodePos(3, 0),
            parameters: {},
          },
        ],
        connections: [],
      },
      code: {
        dsp: `// Reverb DSP code (Freeverb algorithm)
class Reverb {
  CombFilter combs[8];
  AllpassFilter allpasses[4];

  float process(float input, float roomSize, float damping) {
    float output = 0.0f;

    // Parallel comb filters
    for (int i = 0; i < 8; ++i) {
      output += combs[i].process(input, roomSize, damping);
    }

    // Serial allpass filters
    for (int i = 0; i < 4; ++i) {
      output = allpasses[i].process(output);
    }

    return output;
  }
};`,
        ui: '// UI customization code here\n',
        helpers: '// Helper functions here\n',
      },
      settings: {
        width: 500,
        height: 300,
        resizable: true,
        backgroundColor: '#2a2a2a',
        sampleRate: 44100,
        bufferSize: 512,
      },
    },
  },

  // SPECTRUM ANALYZER (UTILITY)
  {
    id: 'template-spectrum-analyzer',
    name: 'Spectrum Analyzer',
    category: 'utility',
    description: 'Real-time spectrum analyzer with adjustable resolution and smoothing',
    tags: ['analyzer', 'spectrum', 'visualization', 'utility'],
    project: {
      name: 'Spectrum Analyzer',
      version: '1.0.0',
      description: 'A real-time spectrum analyzer utility',
      author: '',
      uiComponents: [
        {
          id: nanoid(),
          type: 'waveform',
          label: 'Spectrum',
          x: 20,
          y: 20,
          width: 660,
          height: 300,
          properties: {
            type: 'spectrum',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Resolution',
          x: 50,
          y: 350,
          width: 80,
          height: 100,
          properties: {
            min: 512,
            max: 8192,
            value: 2048,
            parameter: 'fft_size',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Smoothing',
          x: 150,
          y: 350,
          width: 80,
          height: 100,
          properties: {
            min: 0,
            max: 1,
            value: 0.8,
            parameter: 'smoothing',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Gain',
          x: 250,
          y: 350,
          width: 80,
          height: 100,
          properties: {
            min: -12,
            max: 12,
            value: 0,
            parameter: 'display_gain',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'toggle',
          label: 'Freeze',
          x: 380,
          y: 370,
          width: 100,
          height: 60,
          properties: {
            parameter: 'freeze',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'toggle',
          label: 'Peak Hold',
          x: 500,
          y: 370,
          width: 100,
          height: 60,
          properties: {
            parameter: 'peak_hold',
          },
          style: {},
        },
      ],
      dspGraph: {
        nodes: [
          {
            id: nanoid(),
            type: 'input',
            label: 'Input',
            ...nodePos(0, 0),
            parameters: {},
          },
          {
            id: nanoid(),
            type: 'gain',
            label: 'Gain',
            ...nodePos(1, 0),
            parameters: {
              gain: 1,
            },
          },
          {
            id: nanoid(),
            type: 'output',
            label: 'Output',
            ...nodePos(2, 0),
            parameters: {},
          },
        ],
        connections: [],
      },
      code: {
        dsp: `// Spectrum Analyzer DSP code
class FFTAnalyzer {
  float* fftBuffer;
  float* magnitudes;
  int fftSize;
  int bufferPos;

  void analyzeSpectrum(float* input, int numSamples) {
    // Copy samples to FFT buffer
    for (int i = 0; i < numSamples; ++i) {
      fftBuffer[bufferPos++] = input[i];
      if (bufferPos >= fftSize) {
        // Perform FFT
        performFFT(fftBuffer, magnitudes, fftSize);
        bufferPos = 0;
      }
    }
  }

  void performFFT(float* timeDomain, float* freqDomain, int size) {
    // FFT implementation (Cooley-Tukey algorithm)
    // Convert time domain to frequency domain
    // Calculate magnitudes
  }
};`,
        ui: '// UI customization for spectrum display\n',
        helpers: '// Helper functions for frequency conversions\n',
      },
      settings: {
        width: 700,
        height: 500,
        resizable: true,
        backgroundColor: '#1a1a1a',
        sampleRate: 44100,
        bufferSize: 512,
      },
    },
  },

  // LFO MODULATOR (MODULATION)
  {
    id: 'template-lfo-modulator',
    name: 'LFO Modulator',
    category: 'modulation',
    description: 'Multi-waveform LFO with tempo sync and multiple mod destinations',
    tags: ['lfo', 'modulation', 'automation'],
    project: {
      name: 'LFO Modulator',
      version: '1.0.0',
      description: 'A flexible LFO modulation utility',
      author: '',
      uiComponents: [
        {
          id: nanoid(),
          type: 'knob',
          label: 'Rate',
          x: 50,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0.01,
            max: 20,
            value: 1,
            parameter: 'lfo_rate',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Depth',
          x: 150,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0,
            max: 1,
            value: 0.5,
            parameter: 'lfo_depth',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'knob',
          label: 'Phase',
          x: 250,
          y: 50,
          width: 80,
          height: 100,
          properties: {
            min: 0,
            max: 360,
            value: 0,
            parameter: 'lfo_phase',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'button',
          label: 'Sine',
          x: 50,
          y: 180,
          width: 70,
          height: 40,
          properties: {
            parameter: 'waveform',
            value: 'sine',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'button',
          label: 'Triangle',
          x: 130,
          y: 180,
          width: 70,
          height: 40,
          properties: {
            parameter: 'waveform',
            value: 'triangle',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'button',
          label: 'Square',
          x: 210,
          y: 180,
          width: 70,
          height: 40,
          properties: {
            parameter: 'waveform',
            value: 'square',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'button',
          label: 'Saw',
          x: 290,
          y: 180,
          width: 70,
          height: 40,
          properties: {
            parameter: 'waveform',
            value: 'saw',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'toggle',
          label: 'Tempo Sync',
          x: 50,
          y: 250,
          width: 120,
          height: 60,
          properties: {
            parameter: 'tempo_sync',
          },
          style: {},
        },
        {
          id: nanoid(),
          type: 'waveform',
          label: 'LFO Shape',
          x: 400,
          y: 50,
          width: 250,
          height: 150,
          properties: {
            type: 'lfo',
          },
          style: {},
        },
      ],
      dspGraph: {
        nodes: [
          {
            id: nanoid(),
            type: 'input',
            label: 'Input',
            ...nodePos(0, 0),
            parameters: {},
          },
          {
            id: nanoid(),
            type: 'lfo',
            label: 'LFO',
            ...nodePos(1, 0),
            parameters: {
              rate: 1,
              depth: 0.5,
              waveform: 'sine',
              phase: 0,
            },
          },
          {
            id: nanoid(),
            type: 'gain',
            label: 'Modulated Gain',
            ...nodePos(2, 0),
            parameters: {
              gain: 1,
            },
          },
          {
            id: nanoid(),
            type: 'output',
            label: 'Output',
            ...nodePos(3, 0),
            parameters: {},
          },
        ],
        connections: [],
      },
      code: {
        dsp: `// LFO Modulator DSP code
class LFO {
  float phase;
  float rate;
  float sampleRate;

  enum Waveform { Sine, Triangle, Square, Saw };
  Waveform waveform;

  float process() {
    float output = 0.0f;

    switch (waveform) {
      case Sine:
        output = sin(2.0f * M_PI * phase);
        break;
      case Triangle:
        output = 2.0f * abs(2.0f * phase - 1.0f) - 1.0f;
        break;
      case Square:
        output = phase < 0.5f ? 1.0f : -1.0f;
        break;
      case Saw:
        output = 2.0f * phase - 1.0f;
        break;
    }

    // Advance phase
    phase += rate / sampleRate;
    if (phase >= 1.0f) phase -= 1.0f;

    return output;
  }
};`,
        ui: '// UI customization for LFO display\n',
        helpers: '// Helper functions for tempo sync calculations\n',
      },
      settings: {
        width: 700,
        height: 350,
        resizable: true,
        backgroundColor: '#2a2a2a',
        sampleRate: 44100,
        bufferSize: 512,
      },
    },
  },
];

// Get templates by category
export function getTemplatesByCategory(category: PluginTemplate['category']): PluginTemplate[] {
  return pluginTemplates.filter((t) => t.category === category);
}

// Get all categories
export function getAllCategories(): PluginTemplate['category'][] {
  return ['synth', 'effect', 'utility', 'dynamics', 'modulation'];
}

// Search templates
export function searchTemplates(query: string): PluginTemplate[] {
  const lowerQuery = query.toLowerCase();
  return pluginTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

// Create project from template
export function createProjectFromTemplate(template: PluginTemplate): PluginProject {
  const clonedGraph = JSON.parse(JSON.stringify(template.project.dspGraph));

  // Ensure all DSP nodes have proper parameter arrays
  clonedGraph.nodes = clonedGraph.nodes.map((node: any) => {
    // If parameters is an object (old format), convert to array using defaults
    if (node.parameters && !Array.isArray(node.parameters)) {
      return {
        ...node,
        parameters: getDefaultParametersForNodeType(node.type),
      };
    }
    // If parameters is missing or empty, add defaults
    if (!node.parameters || node.parameters.length === 0) {
      return {
        ...node,
        parameters: getDefaultParametersForNodeType(node.type),
      };
    }
    // Parameters is already an array, keep it
    return node;
  });

  return {
    ...template.project,
    id: nanoid(),
    // Deep clone to avoid reference issues
    uiComponents: JSON.parse(JSON.stringify(template.project.uiComponents)),
    dspGraph: clonedGraph,
    code: { ...template.project.code },
    settings: { ...template.project.settings },
  };
}
