import { nanoid } from 'nanoid';

/**
 * DAW Track Types
 */
export type TrackType = 'instrument' | 'audio' | 'master';

/**
 * MIDI Note Event
 */
export interface MIDINoteEvent {
  id: string;
  pitch: number; // 0-127
  velocity: number; // 0-127
  start: number; // Position in beats from clip start
  duration: number; // Duration in beats
}

/**
 * MIDI Clip
 */
export interface MIDIClip {
  id: string;
  trackId: string;
  name: string;
  startTime: number; // Position in beats
  duration: number; // Duration in beats
  notes: MIDINoteEvent[];
  color?: string;
}

/**
 * Plugin Parameter State
 * Stores the current value of a plugin parameter
 */
export interface PluginParameterState {
  nodeId: string; // DSP node ID
  parameterId: string; // Parameter ID within the node
  value: number;
}

/**
 * Plugin State
 * Stores all parameter states for a plugin instance
 */
export interface PluginState {
  pluginProjectId: string; // Reference to the plugin project
  pluginName: string; // Plugin display name
  parameters: PluginParameterState[]; // Current parameter values
}

/**
 * Audio Track
 */
export interface DAWTrack {
  id: string;
  name: string;
  type: TrackType;
  pluginId?: string; // Reference to a plugin project ID (deprecated - use pluginState)
  pluginState?: PluginState; // Plugin instance state with parameters (for instruments)
  effects: PluginState[]; // Effect plugin chain (for insert effects)
  volume: number; // 0-2 (1 = 100%, 2 = +6dB)
  pan: number; // -1 (left) to 1 (right)
  mute: boolean;
  solo: boolean;
  color: string;
  order: number; // Track order in arrangement
}

/**
 * Transport State
 */
export interface Transport {
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number; // Current playback position in beats
  bpm: number; // Beats per minute
  timeSignature: {
    numerator: number; // Top number (beats per measure)
    denominator: number; // Bottom number (note value)
  };
  loopEnabled: boolean;
  loopStart: number; // Loop start in beats
  loopEnd: number; // Loop end in beats
  metronomeEnabled: boolean;
}

/**
 * Timeline/Arrangement State
 */
export interface Timeline {
  zoom: number; // Horizontal zoom level (pixels per beat)
  scrollX: number; // Horizontal scroll position
  scrollY: number; // Vertical scroll position
  snapEnabled: boolean;
  snapValue: number; // Snap grid value in beats (e.g., 0.25 for 1/16 notes)
}

/**
 * DAW Project
 */
export interface DAWProject {
  id: string;
  name: string;
  version: string;
  created: number; // Timestamp
  modified: number; // Timestamp
  tracks: DAWTrack[];
  clips: MIDIClip[];
  transport: Transport;
  timeline: Timeline;
}

/**
 * Helper: Create default transport state
 */
export function createDefaultTransport(): Transport {
  return {
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    bpm: 120,
    timeSignature: {
      numerator: 4,
      denominator: 4,
    },
    loopEnabled: false,
    loopStart: 0,
    loopEnd: 16, // 4 measures at 4/4
    metronomeEnabled: true,
  };
}

/**
 * Helper: Create default timeline state
 */
export function createDefaultTimeline(): Timeline {
  return {
    zoom: 50, // 50 pixels per beat
    scrollX: 0,
    scrollY: 0,
    snapEnabled: true,
    snapValue: 0.25, // Snap to 1/16 notes
  };
}

/**
 * Helper: Create a new track
 */
export function createTrack(
  type: TrackType,
  order: number,
  name?: string
): DAWTrack {
  const colors = [
    '#4ade80',
    '#60a5fa',
    '#f472b6',
    '#fbbf24',
    '#a78bfa',
    '#fb923c',
  ];

  return {
    id: nanoid(),
    name: name || `${type === 'master' ? 'Master' : type === 'instrument' ? 'Instrument' : 'Audio'} ${order + 1}`,
    type,
    pluginId: undefined,
    effects: [], // Initialize with empty effects chain
    volume: 1,
    pan: 0,
    mute: false,
    solo: false,
    color: type === 'master' ? '#64748b' : colors[order % colors.length],
    order,
  };
}

/**
 * Helper: Create a new MIDI clip
 */
export function createMIDIClip(
  trackId: string,
  startTime: number,
  duration: number = 4
): MIDIClip {
  return {
    id: nanoid(),
    trackId,
    name: 'MIDI Clip',
    startTime,
    duration,
    notes: [],
    color: undefined,
  };
}

/**
 * Helper: Create a new MIDI note
 */
export function createMIDINote(
  pitch: number,
  start: number,
  duration: number = 0.5,
  velocity: number = 100
): MIDINoteEvent {
  return {
    id: nanoid(),
    pitch,
    velocity,
    start,
    duration,
  };
}

/**
 * Helper: Create a new DAW project
 */
export function createDAWProject(name: string = 'New Project'): DAWProject {
  const masterTrack = createTrack('master', 0, 'Master');

  return {
    id: nanoid(),
    name,
    version: '1.0.0',
    created: Date.now(),
    modified: Date.now(),
    tracks: [masterTrack],
    clips: [],
    transport: createDefaultTransport(),
    timeline: createDefaultTimeline(),
  };
}

/**
 * Helper: Convert beats to seconds
 */
export function beatsToSeconds(beats: number, bpm: number): number {
  return (beats / bpm) * 60;
}

/**
 * Helper: Convert seconds to beats
 */
export function secondsToBeats(seconds: number, bpm: number): number {
  return (seconds * bpm) / 60;
}

/**
 * Helper: Snap value to grid
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Helper: Convert beats to measures:beats:ticks format
 */
export function beatsToMBT(
  beats: number,
  timeSignature: { numerator: number; denominator: number }
): string {
  const beatsPerMeasure = timeSignature.numerator;
  const measure = Math.floor(beats / beatsPerMeasure) + 1;
  const beat = Math.floor(beats % beatsPerMeasure) + 1;
  const tick = Math.floor((beats % 1) * 960); // 960 ticks per beat (MIDI standard)

  return `${measure}.${beat}.${tick.toString().padStart(3, '0')}`;
}
