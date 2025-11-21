/**
 * Track Audio Processor
 *
 * Handles audio processing for a single track with an assigned plugin.
 * Creates Web Audio nodes from the plugin's DSP graph and handles MIDI note triggering.
 */

import { DAWTrack } from '@shared/dawTypes';
import { PluginProject, DSPNode } from '@shared/types';

interface ActiveNote {
  oscillator: OscillatorNode;
  gain: GainNode;
  pitch: number;
}

export class TrackAudioProcessor {
  private context: AudioContext;
  private track: DAWTrack;
  private pluginProject: PluginProject;

  private outputGain: GainNode;
  private panNode: StereoPannerNode;
  private pluginNodes: Map<string, AudioNode> = new Map();
  private activeNotes: Map<number, ActiveNote> = new Map();

  constructor(context: AudioContext, track: DAWTrack, pluginProject: PluginProject) {
    this.context = context;
    this.track = track;
    this.pluginProject = pluginProject;

    // Create track output nodes
    this.outputGain = context.createGain();
    this.panNode = context.createStereoPanner();

    this.outputGain.gain.value = track.volume;
    this.panNode.pan.value = track.pan;

    // Connect: outputGain -> panNode
    this.outputGain.connect(this.panNode);
  }

  /**
   * Initialize the processor by creating audio nodes from the plugin DSP graph
   */
  async initialize(): Promise<void> {
    // Create audio nodes from plugin DSP graph
    for (const node of this.pluginProject.dspGraph.nodes) {
      if (node.type !== 'oscillator') { // Oscillators are created per-note
        const audioNode = this.createAudioNode(node);
        if (audioNode) {
          this.pluginNodes.set(node.id, audioNode);
        }
      }
    }

    // Connect nodes based on DSP graph connections
    for (const connection of this.pluginProject.dspGraph.connections) {
      const sourceNode = this.pluginNodes.get(connection.sourceNodeId);
      const targetNode = this.pluginNodes.get(connection.targetNodeId);

      if (sourceNode && targetNode) {
        sourceNode.connect(targetNode);
      }
    }
  }

  /**
   * Create an audio node from a DSP node definition
   */
  private createAudioNode(node: DSPNode): AudioNode | null {
    switch (node.type) {
      case 'filter':
        return this.createFilter(node);
      case 'gain':
        return this.createGain(node);
      case 'delay':
        return this.createDelay(node);
      case 'compressor':
        return this.createCompressor(node);
      case 'distortion':
        return this.createDistortion(node);
      case 'reverb':
        return this.createReverb(node);
      case 'envelope':
        return this.createGain(node); // Envelope is handled via gain modulation
      default:
        console.warn(`Unsupported node type for track processor: ${node.type}`);
        return null;
    }
  }

  private createFilter(node: DSPNode): BiquadFilterNode {
    const filter = this.context.createBiquadFilter();

    const params = this.track.pluginState?.parameters || [];
    const freq = params.find(p => p.nodeId === node.id && p.parameterId === 'frequency');
    const q = params.find(p => p.nodeId === node.id && p.parameterId === 'Q');

    if (freq) filter.frequency.value = freq.value;
    if (q) filter.Q.value = q.value;

    filter.type = 'lowpass'; // Default type

    return filter;
  }

  private createGain(node: DSPNode): GainNode {
    const gain = this.context.createGain();

    const params = this.track.pluginState?.parameters || [];
    const gainParam = params.find(p => p.nodeId === node.id && p.parameterId === 'gain');

    if (gainParam) gain.gain.value = gainParam.value;
    else gain.gain.value = 1.0;

    return gain;
  }

  private createDelay(node: DSPNode): DelayNode {
    const delay = this.context.createDelay();

    const params = this.track.pluginState?.parameters || [];
    const time = params.find(p => p.nodeId === node.id && p.parameterId === 'time');

    if (time) delay.delayTime.value = time.value;

    return delay;
  }

  private createCompressor(node: DSPNode): DynamicsCompressorNode {
    const compressor = this.context.createDynamicsCompressor();

    const params = this.track.pluginState?.parameters || [];
    const threshold = params.find(p => p.nodeId === node.id && p.parameterId === 'threshold');
    const ratio = params.find(p => p.nodeId === node.id && p.parameterId === 'ratio');

    if (threshold) compressor.threshold.value = threshold.value;
    if (ratio) compressor.ratio.value = ratio.value;

    return compressor;
  }

  private createDistortion(node: DSPNode): WaveShaperNode {
    const distortion = this.context.createWaveShaper();

    const params = this.track.pluginState?.parameters || [];
    const amount = params.find(p => p.nodeId === node.id && p.parameterId === 'amount');

    const distAmount = amount ? amount.value : 50;
    distortion.curve = this.makeDistortionCurve(distAmount);
    distortion.oversample = '4x';

    return distortion;
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }

    return curve;
  }

  private createReverb(node: DSPNode): ConvolverNode {
    const reverb = this.context.createConvolver();

    // Create simple impulse response
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * 2;
    const impulse = this.context.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    reverb.buffer = impulse;
    return reverb;
  }

  /**
   * Trigger a MIDI note
   */
  triggerNote(pitch: number, velocity: number, duration: number): void {
    const now = this.context.currentTime;
    const frequency = 440 * Math.pow(2, (pitch - 69) / 12); // MIDI note to frequency

    // Create oscillator for this note
    const oscillator = this.context.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.type = 'sawtooth'; // Default waveform

    // Create gain envelope
    const noteGain = this.context.createGain();
    noteGain.gain.value = 0;

    // Connect oscillator -> gain -> (effects chain) -> output
    oscillator.connect(noteGain);

    // Connect to effects chain or directly to output
    const firstNode = this.getFirstEffectNode();
    if (firstNode) {
      noteGain.connect(firstNode);
    } else {
      noteGain.connect(this.outputGain);
    }

    // ADSR envelope
    const attackTime = 0.01;
    const releaseTime = 0.1;

    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(velocity, now + attackTime);
    noteGain.gain.setValueAtTime(velocity, now + duration - releaseTime);
    noteGain.gain.linearRampToValueAtTime(0, now + duration);

    // Start and schedule stop
    oscillator.start(now);
    oscillator.stop(now + duration);

    // Store active note
    this.activeNotes.set(pitch, { oscillator, gain: noteGain, pitch });

    // Clean up after note ends
    oscillator.onended = () => {
      this.activeNotes.delete(pitch);
      noteGain.disconnect();
    };
  }

  /**
   * Get the first node in the effects chain
   */
  private getFirstEffectNode(): AudioNode | null {
    // Find the first non-oscillator node that doesn't have inputs from other nodes
    for (const connection of this.pluginProject.dspGraph.connections) {
      const sourceNode = this.pluginProject.dspGraph.nodes.find(n => n.id === connection.sourceNodeId);
      if (sourceNode?.type === 'oscillator') {
        // This is the first effect after the oscillator
        return this.pluginNodes.get(connection.targetNodeId) || null;
      }
    }

    // If no specific chain, find the last node
    if (this.pluginNodes.size > 0) {
      return Array.from(this.pluginNodes.values())[0];
    }

    return null;
  }

  /**
   * Stop all currently playing notes
   */
  stopAllNotes(): void {
    const now = this.context.currentTime;
    this.activeNotes.forEach(note => {
      note.gain.gain.cancelScheduledValues(now);
      note.gain.gain.setValueAtTime(note.gain.gain.value, now);
      note.gain.gain.linearRampToValueAtTime(0, now + 0.05);
      note.oscillator.stop(now + 0.05);
    });
    this.activeNotes.clear();
  }

  /**
   * Update a plugin parameter
   */
  updateParameter(nodeId: string, parameterId: string, value: number): void {
    const audioNode = this.pluginNodes.get(nodeId);
    if (!audioNode) return;

    // Update parameter based on node type
    if (audioNode instanceof BiquadFilterNode) {
      if (parameterId === 'frequency') audioNode.frequency.value = value;
      if (parameterId === 'Q') audioNode.Q.value = value;
    } else if (audioNode instanceof GainNode) {
      if (parameterId === 'gain') audioNode.gain.value = value;
    } else if (audioNode instanceof DelayNode) {
      if (parameterId === 'time') audioNode.delayTime.value = value;
    } else if (audioNode instanceof DynamicsCompressorNode) {
      if (parameterId === 'threshold') audioNode.threshold.value = value;
      if (parameterId === 'ratio') audioNode.ratio.value = value;
    }
  }

  /**
   * Set track volume
   */
  setVolume(volume: number): void {
    this.outputGain.gain.value = volume;
  }

  /**
   * Set track pan
   */
  setPan(pan: number): void {
    this.panNode.pan.value = pan;
  }

  /**
   * Connect to destination (master bus)
   */
  connect(destination: AudioNode): void {
    // Connect the last node in the chain to output
    const lastNode = this.getLastEffectNode();
    if (lastNode) {
      lastNode.connect(this.outputGain);
    }

    this.panNode.connect(destination);
  }

  /**
   * Get the last node in the effects chain
   */
  private getLastEffectNode(): AudioNode | null {
    // Find nodes that don't have outputs to other nodes
    const outputNodes = this.pluginProject.dspGraph.nodes.filter(node => {
      const hasOutput = this.pluginProject.dspGraph.connections.some(
        conn => conn.sourceNodeId === node.id
      );
      return !hasOutput && node.type !== 'oscillator';
    });

    if (outputNodes.length > 0) {
      return this.pluginNodes.get(outputNodes[0].id) || null;
    }

    // Return the last node we created
    if (this.pluginNodes.size > 0) {
      const values = Array.from(this.pluginNodes.values());
      return values[values.length - 1];
    }

    return null;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopAllNotes();
    this.pluginNodes.forEach(node => node.disconnect());
    this.pluginNodes.clear();
    this.outputGain.disconnect();
    this.panNode.disconnect();
  }
}
