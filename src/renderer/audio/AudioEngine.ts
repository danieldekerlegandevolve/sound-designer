import { PluginProject, DSPNode } from '@shared/types';

export class AudioEngine {
  private context: AudioContext | null = null;
  private nodes: Map<string, AudioNode> = new Map();
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  async initialize(): Promise<void> {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.context.createGain();

    // Create persistent analyser node
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    // Connect: masterGain -> analyser -> destination
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.context.destination);

    // Load AudioWorklet processors
    try {
      await this.context.audioWorklet.addModule('/audio-processors.js');
    } catch (error) {
      console.warn('AudioWorklet not available, using ScriptProcessor fallback');
    }
  }

  async loadProject(project: PluginProject): Promise<void> {
    if (!this.context || !this.masterGain) {
      await this.initialize();
    }

    // Clear existing nodes
    this.stop();
    this.nodes.clear();

    // Create DSP nodes from project graph
    for (const node of project.dspGraph.nodes) {
      const audioNode = this.createAudioNode(node);
      if (audioNode) {
        this.nodes.set(node.id, audioNode);
      }
    }

    // Connect nodes based on connections
    for (const connection of project.dspGraph.connections) {
      const sourceNode = this.nodes.get(connection.sourceNodeId);
      const targetNode = this.nodes.get(connection.targetNodeId);

      if (sourceNode && targetNode) {
        sourceNode.connect(targetNode);
      }
    }

    // Connect last node to master output
    if (this.nodes.size > 0 && this.masterGain) {
      const lastNode = Array.from(this.nodes.values()).pop();
      if (lastNode) {
        lastNode.connect(this.masterGain);
      }
    }
  }

  private createAudioNode(node: DSPNode): AudioNode | null {
    if (!this.context) return null;

    switch (node.type) {
      case 'oscillator':
        return this.createOscillator(node);
      case 'filter':
        return this.createFilter(node);
      case 'gain':
        return this.createGain(node);
      case 'delay':
        return this.createDelay(node);
      case 'compressor':
        return this.createCompressor(node);
      case 'eq':
        return this.createEQ(node);
      case 'distortion':
        return this.createDistortion(node);
      case 'reverb':
        return this.createReverb(node);
      default:
        console.warn(`Unsupported node type: ${node.type}`);
        return null;
    }
  }

  private createOscillator(node: DSPNode): OscillatorNode {
    const osc = this.context!.createOscillator();
    const freqParam = node.parameters.find((p) => p.name === 'frequency');
    const typeParam = node.parameters.find((p) => p.name === 'type');

    if (freqParam) osc.frequency.value = freqParam.value;
    if (typeParam) osc.type = typeParam.value as OscillatorType;

    return osc;
  }

  private createFilter(node: DSPNode): BiquadFilterNode {
    const filter = this.context!.createBiquadFilter();
    const freqParam = node.parameters.find((p) => p.name === 'frequency');
    const qParam = node.parameters.find((p) => p.name === 'Q');
    const typeParam = node.parameters.find((p) => p.name === 'type');

    if (freqParam) filter.frequency.value = freqParam.value;
    if (qParam) filter.Q.value = qParam.value;
    if (typeParam) filter.type = typeParam.value as BiquadFilterType;

    return filter;
  }

  private createGain(node: DSPNode): GainNode {
    const gain = this.context!.createGain();
    const gainParam = node.parameters.find((p) => p.name === 'gain');

    if (gainParam) gain.gain.value = gainParam.value;

    return gain;
  }

  private createDelay(node: DSPNode): DelayNode {
    const delay = this.context!.createDelay();
    const timeParam = node.parameters.find((p) => p.name === 'time');
    const feedbackParam = node.parameters.find((p) => p.name === 'feedback');

    if (timeParam) delay.delayTime.value = timeParam.value;

    // Create feedback loop
    if (feedbackParam) {
      const feedback = this.context!.createGain();
      feedback.gain.value = feedbackParam.value;
      delay.connect(feedback);
      feedback.connect(delay);
    }

    return delay;
  }

  private createCompressor(node: DSPNode): DynamicsCompressorNode {
    const compressor = this.context!.createDynamicsCompressor();
    const thresholdParam = node.parameters.find((p) => p.name === 'threshold');
    const ratioParam = node.parameters.find((p) => p.name === 'ratio');
    const attackParam = node.parameters.find((p) => p.name === 'attack');
    const releaseParam = node.parameters.find((p) => p.name === 'release');

    if (thresholdParam) compressor.threshold.value = thresholdParam.value;
    if (ratioParam) compressor.ratio.value = ratioParam.value;
    if (attackParam) compressor.attack.value = attackParam.value;
    if (releaseParam) compressor.release.value = releaseParam.value;

    return compressor;
  }

  private createEQ(node: DSPNode): BiquadFilterNode {
    // Create a peaking filter for EQ
    const eq = this.context!.createBiquadFilter();
    eq.type = 'peaking';

    const freqParam = node.parameters.find((p) => p.name === 'frequency');
    const gainParam = node.parameters.find((p) => p.name === 'gain');
    const qParam = node.parameters.find((p) => p.name === 'Q');

    if (freqParam) eq.frequency.value = freqParam.value;
    if (gainParam) eq.gain.value = gainParam.value;
    if (qParam) eq.Q.value = qParam.value;

    return eq;
  }

  private createDistortion(node: DSPNode): WaveShaperNode {
    const distortion = this.context!.createWaveShaper();
    const amountParam = node.parameters.find((p) => p.name === 'amount');

    // Create distortion curve
    const amount = amountParam ? amountParam.value : 50;
    distortion.curve = this.makeDistortionCurve(amount);
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
    const reverb = this.context!.createConvolver();

    // Create impulse response
    const sampleRate = this.context!.sampleRate;
    const length = sampleRate * 2; // 2 second reverb
    const impulse = this.context!.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    reverb.buffer = impulse;
    return reverb;
  }

  async start(): Promise<void> {
    if (!this.context) {
      await this.initialize();
    }

    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }

    // Start oscillators
    this.nodes.forEach((node) => {
      if (node instanceof OscillatorNode && !this.isRunning) {
        node.start();
      }
    });

    this.isRunning = true;
  }

  stop(): void {
    // Stop oscillators
    this.nodes.forEach((node) => {
      if (node instanceof OscillatorNode) {
        try {
          node.stop();
        } catch (e) {
          // Ignore if already stopped
        }
      }
      node.disconnect();
    });

    this.isRunning = false;
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }

  updateNodeParameter(nodeId: string, parameterName: string, value: number): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Update parameter based on node type
    if (node instanceof OscillatorNode && parameterName === 'frequency') {
      node.frequency.value = value;
    } else if (node instanceof BiquadFilterNode) {
      if (parameterName === 'frequency') node.frequency.value = value;
      if (parameterName === 'Q') node.Q.value = value;
      if (parameterName === 'gain') node.gain.value = value;
    } else if (node instanceof GainNode && parameterName === 'gain') {
      node.gain.value = value;
    } else if (node instanceof DelayNode && parameterName === 'time') {
      node.delayTime.value = value;
    } else if (node instanceof DynamicsCompressorNode) {
      if (parameterName === 'threshold') node.threshold.value = value;
      if (parameterName === 'ratio') node.ratio.value = value;
      if (parameterName === 'attack') node.attack.value = value;
      if (parameterName === 'release') node.release.value = value;
    }
  }

  getTimeDomainData(): Uint8Array | null {
    if (!this.analyser) return null;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);

    return dataArray;
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.analyser) return null;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    return dataArray;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  dispose(): void {
    this.stop();
    this.nodes.clear();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();
