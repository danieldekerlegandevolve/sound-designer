/**
 * Advanced MIDI Features Types
 *
 * Types for MIDI learn, MPE, arpeggiator, note effects, and CC automation
 */

import { MIDIMessage } from './midiTypes';

// ============================================
// MIDI Learn & Mapping
// ============================================

export interface MIDIMapping {
  id: string;
  name: string;
  midiCC: number;
  midiChannel: number;
  targetType: 'parameter' | 'preset' | 'transport' | 'custom';
  targetId: string; // Parameter ID, preset ID, etc.
  minValue: number;
  maxValue: number;
  curve: 'linear' | 'exponential' | 'logarithmic' | 'custom';
  enabled: boolean;
  lastValue?: number;
}

export interface MIDILearnSession {
  isActive: boolean;
  targetType: string;
  targetId: string;
  targetName: string;
  onComplete?: (mapping: MIDIMapping) => void;
  onCancel?: () => void;
}

// ============================================
// MPE (MIDI Polyphonic Expression)
// ============================================

export interface MPEConfiguration {
  enabled: boolean;
  masterChannel: number; // 0-15, typically 0 or 15
  memberChannels: number[]; // Array of channels for per-note expression
  pitchBendRange: number; // Semitones, typically 48 or 96
  pressureEnabled: boolean;
  timbreEnabled: boolean; // CC74
  slideToPitchEnabled: boolean;
}

export interface MPENote {
  noteNumber: number;
  velocity: number;
  channel: number;
  voiceId: string;
  timestamp: number;
  pitchBend: number; // -1 to 1
  pressure: number; // 0 to 1
  timbre: number; // 0 to 1
  slide: number; // 0 to 1
}

export interface MPEVoice {
  id: string;
  channel: number;
  currentNote: MPENote | null;
  isActive: boolean;
}

// ============================================
// Arpeggiator
// ============================================

export enum ArpeggiatorMode {
  UP = 'up',
  DOWN = 'down',
  UP_DOWN = 'upDown',
  DOWN_UP = 'downUp',
  RANDOM = 'random',
  PLAYED = 'played',
  CHORD = 'chord',
}

export enum ArpeggiatorTimeBase {
  SIXTEENTH = '1/16',
  EIGHTH = '1/8',
  EIGHTH_TRIPLET = '1/8T',
  QUARTER = '1/4',
  QUARTER_TRIPLET = '1/4T',
  HALF = '1/2',
}

export interface ArpeggiatorPattern {
  id: string;
  name: string;
  steps: ArpeggiatorStep[];
}

export interface ArpeggiatorStep {
  enabled: boolean;
  octaveOffset: number; // -4 to 4
  velocityScale: number; // 0 to 2
  gateLength: number; // 0 to 1 (percentage of step)
  accentEnabled: boolean;
}

export interface ArpeggiatorState {
  enabled: boolean;
  mode: ArpeggiatorMode;
  timeBase: ArpeggiatorTimeBase;
  octaveRange: number; // 1 to 4
  pattern: ArpeggiatorPattern;
  swing: number; // 0 to 1
  gateLength: number; // 0 to 1
  heldNotes: number[]; // MIDI note numbers
  currentStep: number;
  currentOctave: number;
  isPlaying: boolean;
  tempo: number; // BPM
  syncToHost: boolean;
}

// ============================================
// Note Effects
// ============================================

export interface NoteHumanizeSettings {
  enabled: boolean;
  timingAmount: number; // 0 to 1 (milliseconds of randomness)
  velocityAmount: number; // 0 to 1 (velocity randomness)
  durationAmount: number; // 0 to 1 (duration randomness)
  seed: number; // For reproducible randomness
}

export interface NoteQuantizeSettings {
  enabled: boolean;
  gridSize: ArpeggiatorTimeBase;
  strength: number; // 0 to 1 (0 = no quantize, 1 = hard quantize)
  swing: number; // 0 to 1
}

export interface NoteTransposeSettings {
  enabled: boolean;
  semitones: number; // -48 to 48
  octaves: number; // -4 to 4
}

export interface VelocityScaleSettings {
  enabled: boolean;
  minVelocity: number; // 0 to 127
  maxVelocity: number; // 0 to 127
  curve: 'linear' | 'exponential' | 'logarithmic';
  randomAmount: number; // 0 to 1
}

export interface NoteEffects {
  humanize: NoteHumanizeSettings;
  quantize: NoteQuantizeSettings;
  transpose: NoteTransposeSettings;
  velocityScale: VelocityScaleSettings;
}

// ============================================
// MIDI CC Automation
// ============================================

export interface AutomationPoint {
  time: number; // In seconds or beats
  value: number; // 0 to 127
  curve: 'linear' | 'exponential' | 'logarithmic' | 'step';
}

export interface AutomationLane {
  id: string;
  name: string;
  ccNumber: number;
  channel: number;
  points: AutomationPoint[];
  enabled: boolean;
  color: string;
  isRecording: boolean;
  playbackMode: 'once' | 'loop' | 'pingpong';
}

export interface AutomationState {
  lanes: AutomationLane[];
  isPlaying: boolean;
  currentTime: number;
  loopStart: number;
  loopEnd: number;
  loopEnabled: boolean;
  recordEnabled: boolean;
  recordingLaneId: string | null;
}

// ============================================
// MIDI Monitor
// ============================================

export interface MIDIMonitorEvent {
  id: string;
  timestamp: number;
  type: 'noteOn' | 'noteOff' | 'cc' | 'pitchBend' | 'program' | 'aftertouch' | 'sysex';
  channel: number;
  data1?: number;
  data2?: number;
  message: string;
  isFiltered: boolean;
}

export interface MIDIMonitorFilter {
  showNoteOn: boolean;
  showNoteOff: boolean;
  showCC: boolean;
  showPitchBend: boolean;
  showProgram: boolean;
  showAftertouch: boolean;
  showSysex: boolean;
  channelFilter: number[]; // Empty = all channels
}

// ============================================
// Preset System
// ============================================

export interface MIDIEffectPreset {
  id: string;
  name: string;
  description: string;
  category: 'humanize' | 'rhythmic' | 'creative' | 'utility';
  effects: NoteEffects;
  arpeggiator: Partial<ArpeggiatorState>;
  mappings: MIDIMapping[];
  tags: string[];
}

// ============================================
// Utility Functions
// ============================================

export function generateMappingId(): string {
  return `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateAutomationLaneId(): string {
  return `lane-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateVoiceId(): string {
  return `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ccToNormalized(ccValue: number): number {
  return ccValue / 127;
}

export function normalizedToCC(normalized: number): number {
  return Math.round(Math.max(0, Math.min(127, normalized * 127)));
}

export function applyCurve(
  value: number,
  curve: 'linear' | 'exponential' | 'logarithmic' | 'custom'
): number {
  switch (curve) {
    case 'linear':
      return value;
    case 'exponential':
      return Math.pow(value, 2);
    case 'logarithmic':
      return Math.sqrt(value);
    case 'custom':
      // Custom curve can be implemented later
      return value;
    default:
      return value;
  }
}

export function interpolateAutomation(
  points: AutomationPoint[],
  time: number
): number {
  if (points.length === 0) return 0;
  if (points.length === 1) return points[0].value;

  // Find surrounding points
  let beforePoint: AutomationPoint | null = null;
  let afterPoint: AutomationPoint | null = null;

  for (let i = 0; i < points.length; i++) {
    if (points[i].time <= time) {
      beforePoint = points[i];
    }
    if (points[i].time > time && !afterPoint) {
      afterPoint = points[i];
      break;
    }
  }

  // Before first point
  if (!beforePoint) return points[0].value;

  // After last point
  if (!afterPoint) return beforePoint.value;

  // Interpolate
  const t = (time - beforePoint.time) / (afterPoint.time - beforePoint.time);

  switch (beforePoint.curve) {
    case 'step':
      return beforePoint.value;
    case 'linear':
      return beforePoint.value + (afterPoint.value - beforePoint.value) * t;
    case 'exponential':
      return beforePoint.value + (afterPoint.value - beforePoint.value) * Math.pow(t, 2);
    case 'logarithmic':
      return beforePoint.value + (afterPoint.value - beforePoint.value) * Math.sqrt(t);
    default:
      return beforePoint.value;
  }
}

export function quantizeTime(
  time: number,
  gridSize: ArpeggiatorTimeBase,
  bpm: number,
  strength: number = 1
): number {
  const beatDuration = 60 / bpm;
  let gridDuration: number;

  switch (gridSize) {
    case ArpeggiatorTimeBase.SIXTEENTH:
      gridDuration = beatDuration / 4;
      break;
    case ArpeggiatorTimeBase.EIGHTH:
      gridDuration = beatDuration / 2;
      break;
    case ArpeggiatorTimeBase.EIGHTH_TRIPLET:
      gridDuration = beatDuration / 3;
      break;
    case ArpeggiatorTimeBase.QUARTER:
      gridDuration = beatDuration;
      break;
    case ArpeggiatorTimeBase.QUARTER_TRIPLET:
      gridDuration = (beatDuration * 2) / 3;
      break;
    case ArpeggiatorTimeBase.HALF:
      gridDuration = beatDuration * 2;
      break;
    default:
      gridDuration = beatDuration / 4;
  }

  const gridPosition = Math.round(time / gridDuration) * gridDuration;
  return time + (gridPosition - time) * strength;
}

export function applySwing(time: number, gridSize: ArpeggiatorTimeBase, bpm: number, swing: number): number {
  const beatDuration = 60 / bpm;
  let gridDuration: number;

  switch (gridSize) {
    case ArpeggiatorTimeBase.SIXTEENTH:
      gridDuration = beatDuration / 4;
      break;
    case ArpeggiatorTimeBase.EIGHTH:
      gridDuration = beatDuration / 2;
      break;
    default:
      gridDuration = beatDuration / 4;
  }

  const gridIndex = Math.floor(time / gridDuration);
  const isOffbeat = gridIndex % 2 === 1;

  if (isOffbeat && swing > 0) {
    // Delay offbeat notes
    return time + (gridDuration * swing * 0.5);
  }

  return time;
}

export const DEFAULT_ARPEGGIATOR_PATTERN: ArpeggiatorPattern = {
  id: 'default',
  name: 'Default',
  steps: Array.from({ length: 16 }, (_, i) => ({
    enabled: true,
    octaveOffset: 0,
    velocityScale: 1,
    gateLength: 0.8,
    accentEnabled: i % 4 === 0,
  })),
};

export const DEFAULT_MPE_CONFIG: MPEConfiguration = {
  enabled: false,
  masterChannel: 0,
  memberChannels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  pitchBendRange: 48,
  pressureEnabled: true,
  timbreEnabled: true,
  slideToPitchEnabled: true,
};

export const DEFAULT_NOTE_EFFECTS: NoteEffects = {
  humanize: {
    enabled: false,
    timingAmount: 0,
    velocityAmount: 0,
    durationAmount: 0,
    seed: Math.random(),
  },
  quantize: {
    enabled: false,
    gridSize: ArpeggiatorTimeBase.SIXTEENTH,
    strength: 1,
    swing: 0,
  },
  transpose: {
    enabled: false,
    semitones: 0,
    octaves: 0,
  },
  velocityScale: {
    enabled: false,
    minVelocity: 1,
    maxVelocity: 127,
    curve: 'linear',
    randomAmount: 0,
  },
};
