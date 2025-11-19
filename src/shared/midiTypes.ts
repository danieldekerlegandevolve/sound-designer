export interface MIDINote {
  id: string;
  note: number; // MIDI note number (0-127)
  velocity: number; // 0-127
  startTime: number; // in ticks or seconds
  duration: number; // in ticks or seconds
  channel: number; // 0-15
}

export interface MIDIEvent {
  type: 'noteOn' | 'noteOff' | 'cc' | 'pitchBend' | 'aftertouch' | 'programChange' | 'sysex';
  timestamp: number;
  channel: number;
  data1?: number; // note number or CC number
  data2?: number; // velocity or CC value
  data?: Uint8Array; // for sysex
}

export interface MIDIControlChange {
  cc: number; // Control Change number (0-127)
  value: number; // 0-127
  channel: number; // 0-15
  timestamp: number;
}

export interface MIDIMapping {
  id: string;
  name: string;
  midiCC: number;
  midiChannel: number;
  parameterId: string;
  parameterName: string;
  min: number;
  max: number;
  curve: 'linear' | 'exponential' | 'logarithmic';
}

export interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  type: 'input' | 'output';
  state: 'connected' | 'disconnected';
}

export interface MIDIRouting {
  id: string;
  name: string;
  inputDevice: string;
  outputDevice: string;
  channel: number; // -1 for all channels
  transpose: number; // semitones
  velocityCurve: 'linear' | 'soft' | 'hard' | 'custom';
  enabled: boolean;
}

export interface MPEConfiguration {
  enabled: boolean;
  masterChannel: number; // Usually 0 or 15
  memberChannels: number[]; // Usually 1-14 or 0-14
  pitchBendRange: number; // in semitones
  slideCCNumber: number; // Usually CC74
  pressureCCNumber: number; // Usually channel aftertouch
}

export interface PianoRollSettings {
  snapToGrid: boolean;
  gridResolution: number; // in ticks (e.g., 480 = quarter note at 480 PPQ)
  timeSignature: { numerator: number; denominator: number };
  tempo: number; // BPM
  ppq: number; // Pulses Per Quarter note (480, 960, etc.)
  noteHeight: number; // pixels
  noteNameDisplay: 'number' | 'name' | 'both';
  colorMode: 'velocity' | 'channel' | 'pitch' | 'uniform';
}

export interface MIDIClip {
  id: string;
  name: string;
  notes: MIDINote[];
  controlChanges: MIDIControlChange[];
  startTime: number;
  duration: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
}

export interface MIDILearnState {
  isLearning: boolean;
  targetParameterId: string | null;
  lastLearnedCC: number | null;
  lastLearnedChannel: number | null;
}

export interface MIDIFileFormat {
  format: 0 | 1 | 2; // 0 = single track, 1 = multiple tracks, 2 = multiple songs
  tracks: MIDITrack[];
  ppq: number;
  tempo: number;
}

export interface MIDITrack {
  name: string;
  channel: number;
  events: MIDIEvent[];
  notes: MIDINote[];
}

// MIDI Constants
export const MIDI_NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

export const MIDI_CC_NAMES: Record<number, string> = {
  1: 'Modulation Wheel',
  2: 'Breath Controller',
  4: 'Foot Controller',
  5: 'Portamento Time',
  7: 'Volume',
  8: 'Balance',
  10: 'Pan',
  11: 'Expression',
  64: 'Sustain Pedal',
  65: 'Portamento On/Off',
  66: 'Sostenuto',
  67: 'Soft Pedal',
  68: 'Legato Footswitch',
  71: 'Resonance',
  72: 'Release Time',
  73: 'Attack Time',
  74: 'Brightness (MPE Slide)',
  75: 'Decay Time',
  76: 'Vibrato Rate',
  77: 'Vibrato Depth',
  78: 'Vibrato Delay',
  91: 'Reverb Send',
  92: 'Tremolo Depth',
  93: 'Chorus Send',
  94: 'Detune Depth',
  95: 'Phaser Depth',
};

export const DEFAULT_MPE_CONFIG: MPEConfiguration = {
  enabled: false,
  masterChannel: 0,
  memberChannels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  pitchBendRange: 48, // ±4 semitones is common for MPE
  slideCCNumber: 74,
  pressureCCNumber: 128, // Channel aftertouch (special value)
};

export const DEFAULT_PIANO_ROLL_SETTINGS: PianoRollSettings = {
  snapToGrid: true,
  gridResolution: 480, // Quarter note at 480 PPQ
  timeSignature: { numerator: 4, denominator: 4 },
  tempo: 120,
  ppq: 480,
  noteHeight: 16,
  noteNameDisplay: 'name',
  colorMode: 'velocity',
};

// Utility functions
export function midiNoteToName(note: number): string {
  const octave = Math.floor(note / 12) - 1;
  const noteName = MIDI_NOTE_NAMES[note % 12];
  return `${noteName}${octave}`;
}

export function midiNoteToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export function frequencyToMidiNote(frequency: number): number {
  return Math.round(69 + 12 * Math.log2(frequency / 440));
}

export function velocityToGain(velocity: number, curve: 'linear' | 'soft' | 'hard' = 'linear'): number {
  const normalized = velocity / 127;

  switch (curve) {
    case 'soft':
      return Math.pow(normalized, 0.5); // Square root curve
    case 'hard':
      return Math.pow(normalized, 2); // Quadratic curve
    default:
      return normalized;
  }
}

export function ccValueToNormalized(value: number): number {
  return value / 127;
}

export function normalizedToCCValue(normalized: number): number {
  return Math.round(normalized * 127);
}

export function quantizeTime(time: number, gridResolution: number): number {
  return Math.round(time / gridResolution) * gridResolution;
}
