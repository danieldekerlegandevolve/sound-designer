/**
 * Mock AudioContext for Testing
 * Provides a complete mock implementation of the Web Audio API
 */

export class MockAudioContext implements Partial<AudioContext> {
  public sampleRate: number = 44100;
  public currentTime: number = 0;
  public state: AudioContextState = 'running';
  public destination: AudioDestinationNode = {} as AudioDestinationNode;

  private nodes: Set<AudioNode> = new Set();

  constructor(options?: { sampleRate?: number }) {
    if (options?.sampleRate) {
      this.sampleRate = options.sampleRate;
    }
  }

  createOscillator(): OscillatorNode {
    const node = new MockOscillatorNode(this);
    this.nodes.add(node as any);
    return node as any;
  }

  createGain(): GainNode {
    const node = new MockGainNode(this);
    this.nodes.add(node as any);
    return node as any;
  }

  createBiquadFilter(): BiquadFilterNode {
    const node = new MockBiquadFilterNode(this);
    this.nodes.add(node as any);
    return node as any;
  }

  createBufferSource(): AudioBufferSourceNode {
    const node = new MockAudioBufferSourceNode(this);
    this.nodes.add(node as any);
    return node as any;
  }

  createAnalyser(): AnalyserNode {
    const node = new MockAnalyserNode(this);
    this.nodes.add(node as any);
    return node as any;
  }

  createBuffer(
    numberOfChannels: number,
    length: number,
    sampleRate: number
  ): AudioBuffer {
    return new MockAudioBuffer({
      numberOfChannels,
      length,
      sampleRate,
    }) as any;
  }

  async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    // Simplified mock - returns a silent buffer
    return this.createBuffer(2, 44100, 44100);
  }

  async suspend(): Promise<void> {
    this.state = 'suspended';
  }

  async resume(): Promise<void> {
    this.state = 'running';
  }

  async close(): Promise<void> {
    this.state = 'closed';
    this.nodes.clear();
  }

  // Advance time (for testing)
  advanceTime(seconds: number): void {
    this.currentTime += seconds;
  }
}

export class MockAudioNode {
  public context: MockAudioContext;
  public numberOfInputs: number = 1;
  public numberOfOutputs: number = 1;
  public channelCount: number = 2;
  public channelCountMode: ChannelCountMode = 'max';
  public channelInterpretation: ChannelInterpretation = 'speakers';

  private connections: Set<AudioNode> = new Set();

  constructor(context: MockAudioContext) {
    this.context = context;
  }

  connect(destination: AudioNode | AudioParam): AudioNode {
    if ('value' in destination) {
      // AudioParam connection
      return this as any;
    }
    this.connections.add(destination);
    return destination;
  }

  disconnect(): void {
    this.connections.clear();
  }
}

export class MockOscillatorNode extends MockAudioNode implements Partial<OscillatorNode> {
  public type: OscillatorType = 'sine';
  public frequency: AudioParam = new MockAudioParam(440);
  public detune: AudioParam = new MockAudioParam(0);

  private isStarted = false;
  private isStopped = false;

  start(when?: number): void {
    this.isStarted = true;
  }

  stop(when?: number): void {
    this.isStopped = true;
  }

  setPeriodicWave(wave: PeriodicWave): void {
    // Mock implementation
  }
}

export class MockGainNode extends MockAudioNode implements Partial<GainNode> {
  public gain: AudioParam = new MockAudioParam(1);
}

export class MockBiquadFilterNode
  extends MockAudioNode
  implements Partial<BiquadFilterNode>
{
  public type: BiquadFilterType = 'lowpass';
  public frequency: AudioParam = new MockAudioParam(350);
  public Q: AudioParam = new MockAudioParam(1);
  public gain: AudioParam = new MockAudioParam(0);
  public detune: AudioParam = new MockAudioParam(0);

  getFrequencyResponse(
    frequencyHz: Float32Array,
    magResponse: Float32Array,
    phaseResponse: Float32Array
  ): void {
    // Simplified mock response
    for (let i = 0; i < frequencyHz.length; i++) {
      magResponse[i] = 1;
      phaseResponse[i] = 0;
    }
  }
}

export class MockAudioBufferSourceNode
  extends MockAudioNode
  implements Partial<AudioBufferSourceNode>
{
  public buffer: AudioBuffer | null = null;
  public playbackRate: AudioParam = new MockAudioParam(1);
  public detune: AudioParam = new MockAudioParam(0);
  public loop: boolean = false;
  public loopStart: number = 0;
  public loopEnd: number = 0;

  private isStarted = false;
  private isStopped = false;

  start(when?: number, offset?: number, duration?: number): void {
    this.isStarted = true;
  }

  stop(when?: number): void {
    this.isStopped = true;
  }
}

export class MockAnalyserNode extends MockAudioNode implements Partial<AnalyserNode> {
  public fftSize: number = 2048;
  public frequencyBinCount: number = 1024;
  public minDecibels: number = -100;
  public maxDecibels: number = -30;
  public smoothingTimeConstant: number = 0.8;

  getFloatFrequencyData(array: Float32Array): void {
    array.fill(-Infinity);
  }

  getByteFrequencyData(array: Uint8Array): void {
    array.fill(0);
  }

  getFloatTimeDomainData(array: Float32Array): void {
    array.fill(0);
  }

  getByteTimeDomainData(array: Uint8Array): void {
    array.fill(128);
  }
}

export class MockAudioParam implements Partial<AudioParam> {
  public value: number;
  public defaultValue: number;
  public minValue: number = -3.4028235e38;
  public maxValue: number = 3.4028235e38;

  private automationEvents: Array<{
    type: string;
    value: number;
    time: number;
  }> = [];

  constructor(defaultValue: number) {
    this.value = defaultValue;
    this.defaultValue = defaultValue;
  }

  setValueAtTime(value: number, startTime: number): AudioParam {
    this.automationEvents.push({ type: 'set', value, time: startTime });
    return this as any;
  }

  linearRampToValueAtTime(value: number, endTime: number): AudioParam {
    this.automationEvents.push({ type: 'linearRamp', value, time: endTime });
    return this as any;
  }

  exponentialRampToValueAtTime(value: number, endTime: number): AudioParam {
    this.automationEvents.push({ type: 'exponentialRamp', value, time: endTime });
    return this as any;
  }

  setTargetAtTime(target: number, startTime: number, timeConstant: number): AudioParam {
    this.automationEvents.push({
      type: 'setTarget',
      value: target,
      time: startTime,
    });
    return this as any;
  }

  setValueCurveAtTime(
    values: number[] | Float32Array,
    startTime: number,
    duration: number
  ): AudioParam {
    this.automationEvents.push({
      type: 'setCurve',
      value: values[0],
      time: startTime,
    });
    return this as any;
  }

  cancelScheduledValues(startTime: number): AudioParam {
    this.automationEvents = this.automationEvents.filter((e) => e.time < startTime);
    return this as any;
  }

  cancelAndHoldAtTime(cancelTime: number): AudioParam {
    this.automationEvents = this.automationEvents.filter((e) => e.time < cancelTime);
    return this as any;
  }
}

export class MockAudioBuffer implements Partial<AudioBuffer> {
  public length: number;
  public numberOfChannels: number;
  public sampleRate: number;
  public duration: number;

  private channelData: Float32Array[];

  constructor(options: {
    numberOfChannels: number;
    length: number;
    sampleRate: number;
  }) {
    this.numberOfChannels = options.numberOfChannels;
    this.length = options.length;
    this.sampleRate = options.sampleRate;
    this.duration = options.length / options.sampleRate;

    this.channelData = [];
    for (let i = 0; i < options.numberOfChannels; i++) {
      this.channelData.push(new Float32Array(options.length));
    }
  }

  getChannelData(channel: number): Float32Array {
    return this.channelData[channel];
  }

  copyFromChannel(
    destination: Float32Array,
    channelNumber: number,
    startInChannel?: number
  ): void {
    const start = startInChannel || 0;
    const source = this.channelData[channelNumber];
    destination.set(source.slice(start, start + destination.length));
  }

  copyToChannel(
    source: Float32Array,
    channelNumber: number,
    startInChannel?: number
  ): void {
    const start = startInChannel || 0;
    this.channelData[channelNumber].set(source, start);
  }
}
