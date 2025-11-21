/**
 * Audio Graph Types
 *
 * Core type definitions for the audio processing graph
 */

/**
 * Audio node types
 */
export enum AudioNodeType {
  // Sources
  OSCILLATOR = 'oscillator',
  SAMPLE_PLAYER = 'sample_player',
  NOISE = 'noise',

  // Filters
  FILTER = 'filter',
  EQ = 'eq',

  // Effects
  DELAY = 'delay',
  REVERB = 'reverb',
  DISTORTION = 'distortion',
  CHORUS = 'chorus',
  PHASER = 'phaser',
  COMPRESSOR = 'compressor',

  // Modulation
  LFO = 'lfo',
  ENVELOPE = 'envelope',

  // Utility
  GAIN = 'gain',
  MIXER = 'mixer',
  SPLITTER = 'splitter',
  ANALYZER = 'analyzer',

  // Output
  OUTPUT = 'output',
}

/**
 * Parameter types
 */
export enum ParameterType {
  FREQUENCY = 'frequency',
  GAIN = 'gain',
  Q = 'q',
  DETUNE = 'detune',
  TIME = 'time',
  FEEDBACK = 'feedback',
  MIX = 'mix',
  RATE = 'rate',
  DEPTH = 'depth',
  THRESHOLD = 'threshold',
  RATIO = 'ratio',
  ATTACK = 'attack',
  RELEASE = 'release',
  WAVEFORM = 'waveform',
}

/**
 * Waveform types
 */
export enum WaveformType {
  SINE = 'sine',
  SQUARE = 'square',
  SAWTOOTH = 'sawtooth',
  TRIANGLE = 'triangle',
  NOISE = 'noise',
}

/**
 * Filter types
 */
export enum FilterType {
  LOWPASS = 'lowpass',
  HIGHPASS = 'highpass',
  BANDPASS = 'bandpass',
  LOWSHELF = 'lowshelf',
  HIGHSHELF = 'highshelf',
  PEAKING = 'peaking',
  NOTCH = 'notch',
  ALLPASS = 'allpass',
}

/**
 * Audio node parameter definition
 */
export interface AudioNodeParameter {
  id: string;
  name: string;
  type: ParameterType;
  value: number;
  min: number;
  max: number;
  default: number;
  unit?: string;
  step?: number;
  options?: string[]; // For enumerated parameters
  automatable?: boolean;
  modulation?: number; // Current modulation amount
}

/**
 * Audio node input/output port
 */
export interface AudioPort {
  id: string;
  name: string;
  type: 'audio' | 'control';
  isConnected: boolean;
}

/**
 * Audio connection between nodes
 */
export interface AudioConnection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  gainValue?: number; // Optional gain for the connection
}

/**
 * Audio node position in the visual editor
 */
export interface NodePosition {
  x: number;
  y: number;
}

/**
 * Audio node base definition
 */
export interface AudioGraphNode {
  id: string;
  type: AudioNodeType;
  name: string;
  position: NodePosition;
  parameters: AudioNodeParameter[];
  inputs: AudioPort[];
  outputs: AudioPort[];
  bypass?: boolean;
  color?: string;
  metadata?: Record<string, any>;
}

/**
 * Audio graph state
 */
export interface AudioGraph {
  nodes: AudioGraphNode[];
  connections: AudioConnection[];
  sampleRate: number;
  bufferSize: number;
  isPlaying: boolean;
}

/**
 * Audio processing context
 */
export interface AudioProcessingContext {
  audioContext: AudioContext;
  sampleRate: number;
  bufferSize: number;
  currentTime: number;
}

/**
 * Node creation template
 */
export interface NodeTemplate {
  type: AudioNodeType;
  name: string;
  description: string;
  category: 'source' | 'filter' | 'effect' | 'modulation' | 'utility' | 'output';
  icon: string;
  color: string;
  defaultParameters: Omit<AudioNodeParameter, 'id'>[];
  defaultInputs: Omit<AudioPort, 'id' | 'isConnected'>[];
  defaultOutputs: Omit<AudioPort, 'id' | 'isConnected'>[];
}

/**
 * Analysis data for visualizations
 */
export interface AudioAnalysisData {
  waveform: Float32Array;
  spectrum: Float32Array;
  peak: number;
  rms: number;
  frequencyBins: number;
}

/**
 * DSP processor interface
 */
export interface DSPProcessor {
  process(
    inputs: Float32Array[],
    outputs: Float32Array[],
    parameters: Map<string, number>
  ): void;

  reset(): void;
}

/**
 * Audio engine configuration
 */
export interface AudioEngineConfig {
  sampleRate?: number;
  bufferSize?: number;
  latencyHint?: 'interactive' | 'balanced' | 'playback';
  enableVisualization?: boolean;
  maxNodes?: number;
  maxConnections?: number;
}

/**
 * Audio node instance (runtime)
 */
export interface AudioNodeInstance {
  graphNode: AudioGraphNode;
  webAudioNode?: AudioNode;
  processor?: DSPProcessor;
  analyzerNode?: AnalyserNode;
  gainNode?: GainNode;
  isActive: boolean;
}

/**
 * Utility functions
 */

/**
 * Generate unique node ID
 */
export function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique connection ID
 */
export function generateConnectionId(): string {
  return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique port ID
 */
export function generatePortId(nodeId: string, portName: string): string {
  return `${nodeId}-${portName}`;
}

/**
 * Frequency to MIDI note
 */
export function frequencyToMidi(frequency: number): number {
  return 12 * Math.log2(frequency / 440) + 69;
}

/**
 * MIDI note to frequency
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Linear to dB
 */
export function linearToDb(linear: number): number {
  return 20 * Math.log10(Math.max(linear, 0.00001));
}

/**
 * dB to linear
 */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
