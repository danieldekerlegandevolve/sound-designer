export interface ModulationSource {
  id: string;
  type: 'lfo' | 'envelope' | 'envelopeFollower' | 'macro' | 'stepSequencer' | 'randomizer' | 'midi';
  name: string;
  enabled: boolean;
  config: any; // Type-specific configuration
}

export interface LFOConfig {
  waveform: 'sine' | 'triangle' | 'square' | 'saw' | 'random' | 'sampleAndHold';
  frequency: number; // Hz
  phase: number; // 0-360 degrees
  amplitude: number; // 0-1
  offset: number; // -1 to 1
  syncToTempo: boolean;
  tempoRate: string; // '1/4', '1/8', '1/16', etc.
  retrigger: boolean;
  randomAmount: number; // 0-1 for random waveform variation
}

export interface EnvelopeConfig {
  attack: number; // seconds
  decay: number; // seconds
  sustain: number; // 0-1
  release: number; // seconds
  attackCurve: number; // -1 to 1 (logarithmic to exponential)
  decayCurve: number;
  releaseCurve: number;
  loopMode: 'off' | 'sustain' | 'loop';
}

export interface EnvelopeFollowerConfig {
  attack: number; // milliseconds
  release: number; // milliseconds
  threshold: number; // dB
  inputSource: string; // audio input ID
  gain: number; // multiplier
}

export interface StepSequencerConfig {
  steps: number; // 1-32
  values: number[]; // Array of values 0-1
  length: string; // '1/4', '1/8', '1/16', etc.
  syncToTempo: boolean;
  playMode: 'forward' | 'backward' | 'pingPong' | 'random';
  smoothing: number; // 0-1
}

export interface RandomizerConfig {
  rate: number; // Hz
  smoothness: number; // 0-1
  range: { min: number; max: number };
  distribution: 'uniform' | 'gaussian' | 'perlin';
  seed: number;
}

export interface MacroConfig {
  value: number; // 0-1
  label: string;
  color: string;
  mappings: MacroMapping[];
}

export interface MacroMapping {
  targetId: string;
  targetName: string;
  amount: number; // -1 to 1
  curve: 'linear' | 'exponential' | 'logarithmic';
}

export interface ModulationTarget {
  id: string;
  nodeId: string;
  parameterId: string;
  parameterName: string;
  min: number;
  max: number;
  defaultValue: number;
  unit?: string;
}

export interface ModulationConnection {
  id: string;
  sourceId: string;
  targetId: string;
  amount: number; // -1 to 1 (bipolar modulation)
  enabled: boolean;
  curve: 'linear' | 'exponential' | 'logarithmic' | 'custom';
  customCurve?: number[]; // Array of values for custom curve
}

export interface AutomationPoint {
  time: number; // in beats or seconds
  value: number; // 0-1 normalized
  curve: 'linear' | 'exponential' | 'logarithmic' | 'bezier';
  // For bezier curves
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

export interface AutomationLane {
  id: string;
  targetId: string;
  targetName: string;
  points: AutomationPoint[];
  enabled: boolean;
  color: string;
}

export interface ModulationMatrix {
  sources: ModulationSource[];
  targets: ModulationTarget[];
  connections: ModulationConnection[];
}

export interface AutomationClip {
  id: string;
  name: string;
  lanes: AutomationLane[];
  startTime: number;
  duration: number;
  loopEnabled: boolean;
}

export const DEFAULT_LFO_CONFIG: LFOConfig = {
  waveform: 'sine',
  frequency: 1.0,
  phase: 0,
  amplitude: 1.0,
  offset: 0,
  syncToTempo: true,
  tempoRate: '1/4',
  retrigger: true,
  randomAmount: 0,
};

export const DEFAULT_ENVELOPE_CONFIG: EnvelopeConfig = {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.7,
  release: 0.3,
  attackCurve: 0,
  decayCurve: 0,
  releaseCurve: 0,
  loopMode: 'off',
};

export const DEFAULT_ENVELOPE_FOLLOWER_CONFIG: EnvelopeFollowerConfig = {
  attack: 10,
  release: 100,
  threshold: -60,
  inputSource: 'main',
  gain: 1.0,
};

export const DEFAULT_STEP_SEQUENCER_CONFIG: StepSequencerConfig = {
  steps: 16,
  values: Array(16).fill(0.5),
  length: '1/16',
  syncToTempo: true,
  playMode: 'forward',
  smoothing: 0,
};

export const DEFAULT_RANDOMIZER_CONFIG: RandomizerConfig = {
  rate: 0.5,
  smoothness: 0.5,
  range: { min: 0, max: 1 },
  distribution: 'uniform',
  seed: Date.now(),
};

export const DEFAULT_MACRO_CONFIG: MacroConfig = {
  value: 0.5,
  label: 'Macro',
  color: '#4a9eff',
  mappings: [],
};

export const LFO_WAVEFORMS: Array<{ value: LFOConfig['waveform']; label: string; icon: string }> = [
  { value: 'sine', label: 'Sine', icon: '∿' },
  { value: 'triangle', label: 'Triangle', icon: '△' },
  { value: 'square', label: 'Square', icon: '⊓' },
  { value: 'saw', label: 'Saw', icon: '⟋' },
  { value: 'random', label: 'Random', icon: '∼' },
  { value: 'sampleAndHold', label: 'S&H', icon: '▭' },
];

export const TEMPO_RATES = [
  { value: '1/1', label: '1 bar' },
  { value: '1/2', label: '1/2 note' },
  { value: '1/4', label: '1/4 note' },
  { value: '1/8', label: '1/8 note' },
  { value: '1/16', label: '1/16 note' },
  { value: '1/32', label: '1/32 note' },
  { value: '1/2T', label: '1/2 triplet' },
  { value: '1/4T', label: '1/4 triplet' },
  { value: '1/8T', label: '1/8 triplet' },
  { value: '1/16T', label: '1/16 triplet' },
  { value: '1/2D', label: '1/2 dotted' },
  { value: '1/4D', label: '1/4 dotted' },
  { value: '1/8D', label: '1/8 dotted' },
  { value: '1/16D', label: '1/16 dotted' },
];

export const MODULATION_COLORS = [
  '#4a9eff', // Blue
  '#22c55e', // Green
  '#f59e0b', // Orange
  '#a855f7', // Purple
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#10b981', // Emerald
];

// Utility functions
export function calculateLFOValue(config: LFOConfig, time: number, tempo: number): number {
  const { waveform, frequency, phase, amplitude, offset, syncToTempo, tempoRate } = config;

  let freq = frequency;
  if (syncToTempo) {
    freq = tempoRateToHz(tempoRate, tempo);
  }

  const phaseRad = (phase / 360) * Math.PI * 2;
  const t = time * freq * Math.PI * 2 + phaseRad;

  let value = 0;

  switch (waveform) {
    case 'sine':
      value = Math.sin(t);
      break;
    case 'triangle':
      value = 2 * Math.abs((t / (Math.PI * 2)) % 1 - 0.5) * 2 - 1;
      break;
    case 'square':
      value = Math.sin(t) > 0 ? 1 : -1;
      break;
    case 'saw':
      value = 2 * ((t / (Math.PI * 2)) % 1) - 1;
      break;
    case 'random':
      // Simplified random - would need proper implementation
      value = Math.random() * 2 - 1;
      break;
    case 'sampleAndHold':
      // Sample and hold at each cycle
      const cycle = Math.floor(t / (Math.PI * 2));
      value = Math.sin(cycle) * 2 - 1;
      break;
  }

  return value * amplitude + offset;
}

export function calculateEnvelopeValue(
  config: EnvelopeConfig,
  time: number,
  noteOn: boolean,
  noteOffTime?: number
): number {
  const { attack, decay, sustain, release, attackCurve, decayCurve, releaseCurve } = config;

  if (noteOn) {
    if (time < attack) {
      // Attack phase
      const t = time / attack;
      return applyCurve(t, attackCurve);
    } else if (time < attack + decay) {
      // Decay phase
      const t = (time - attack) / decay;
      return 1 - (1 - sustain) * applyCurve(t, decayCurve);
    } else {
      // Sustain phase
      return sustain;
    }
  } else if (noteOffTime !== undefined) {
    // Release phase
    const releaseStart = Math.max(attack + decay, noteOffTime);
    const t = (time - releaseStart) / release;

    if (t >= 1) return 0;

    const startValue = time < attack + decay
      ? calculateEnvelopeValue(config, noteOffTime, true)
      : sustain;

    return startValue * (1 - applyCurve(t, releaseCurve));
  }

  return 0;
}

function applyCurve(t: number, curve: number): number {
  // curve: -1 (logarithmic) to 1 (exponential), 0 is linear
  if (curve === 0) return t;

  if (curve > 0) {
    // Exponential
    return Math.pow(t, 1 + curve * 3);
  } else {
    // Logarithmic
    return 1 - Math.pow(1 - t, 1 - curve * 3);
  }
}

function tempoRateToHz(rate: string, tempo: number): number {
  const beatsPerSecond = tempo / 60;

  const rates: Record<string, number> = {
    '1/1': beatsPerSecond / 4,
    '1/2': beatsPerSecond / 2,
    '1/4': beatsPerSecond,
    '1/8': beatsPerSecond * 2,
    '1/16': beatsPerSecond * 4,
    '1/32': beatsPerSecond * 8,
    '1/2T': (beatsPerSecond / 2) * (2 / 3),
    '1/4T': beatsPerSecond * (2 / 3),
    '1/8T': beatsPerSecond * 2 * (2 / 3),
    '1/16T': beatsPerSecond * 4 * (2 / 3),
    '1/2D': (beatsPerSecond / 2) * 1.5,
    '1/4D': beatsPerSecond * 1.5,
    '1/8D': beatsPerSecond * 2 * 1.5,
    '1/16D': beatsPerSecond * 4 * 1.5,
  };

  return rates[rate] || beatsPerSecond;
}

export function interpolateAutomation(
  points: AutomationPoint[],
  time: number
): number | null {
  if (points.length === 0) return null;
  if (points.length === 1) return points[0].value;

  // Find surrounding points
  let prevPoint: AutomationPoint | null = null;
  let nextPoint: AutomationPoint | null = null;

  for (let i = 0; i < points.length; i++) {
    if (points[i].time <= time) {
      prevPoint = points[i];
    }
    if (points[i].time >= time && nextPoint === null) {
      nextPoint = points[i];
      break;
    }
  }

  if (!prevPoint) return points[0].value;
  if (!nextPoint) return points[points.length - 1].value;
  if (prevPoint === nextPoint) return prevPoint.value;

  // Interpolate between points
  const t = (time - prevPoint.time) / (nextPoint.time - prevPoint.time);

  switch (prevPoint.curve) {
    case 'linear':
      return prevPoint.value + (nextPoint.value - prevPoint.value) * t;

    case 'exponential':
      return prevPoint.value + (nextPoint.value - prevPoint.value) * Math.pow(t, 2);

    case 'logarithmic':
      return prevPoint.value + (nextPoint.value - prevPoint.value) * Math.sqrt(t);

    case 'bezier':
      if (prevPoint.handleOut && nextPoint.handleIn) {
        return cubicBezier(
          prevPoint.value,
          prevPoint.handleOut.y,
          nextPoint.handleIn.y,
          nextPoint.value,
          t
        );
      }
      return prevPoint.value + (nextPoint.value - prevPoint.value) * t;

    default:
      return prevPoint.value + (nextPoint.value - prevPoint.value) * t;
  }
}

function cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const oneMinusT = 1 - t;
  return (
    oneMinusT * oneMinusT * oneMinusT * p0 +
    3 * oneMinusT * oneMinusT * t * p1 +
    3 * oneMinusT * t * t * p2 +
    t * t * t * p3
  );
}

export function applyModulationCurve(
  value: number,
  curve: ModulationConnection['curve'],
  customCurve?: number[]
): number {
  switch (curve) {
    case 'linear':
      return value;

    case 'exponential':
      return Math.pow(value, 2);

    case 'logarithmic':
      return Math.sqrt(Math.abs(value)) * Math.sign(value);

    case 'custom':
      if (!customCurve || customCurve.length === 0) return value;
      const index = Math.floor((value + 1) / 2 * (customCurve.length - 1));
      return customCurve[Math.max(0, Math.min(index, customCurve.length - 1))];

    default:
      return value;
  }
}
