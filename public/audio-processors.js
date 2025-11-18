// AudioWorklet processors for advanced DSP

// Generic DSP Processor
class DSPProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.gain = 1.0;

    this.port.onmessage = (event) => {
      if (event.data.type === 'setParameter') {
        this[event.data.name] = event.data.value;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0]) return true;

    for (let channel = 0; channel < output.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      for (let i = 0; i < outputChannel.length; i++) {
        outputChannel[i] = inputChannel[i] * this.gain;
      }
    }

    return true;
  }
}

// Envelope Generator
class EnvelopeProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.attack = 0.1;
    this.decay = 0.1;
    this.sustain = 0.7;
    this.release = 0.3;
    this.currentValue = 0;
    this.stage = 'idle';
    this.sampleRate = 44100;

    this.port.onmessage = (event) => {
      if (event.data.type === 'noteOn') {
        this.stage = 'attack';
      } else if (event.data.type === 'noteOff') {
        this.stage = 'release';
      } else if (event.data.type === 'setParameter') {
        this[event.data.name] = event.data.value;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || !output[0]) return true;

    for (let i = 0; i < output[0].length; i++) {
      // Update envelope
      switch (this.stage) {
        case 'attack':
          this.currentValue += 1.0 / (this.attack * this.sampleRate);
          if (this.currentValue >= 1.0) {
            this.currentValue = 1.0;
            this.stage = 'decay';
          }
          break;

        case 'decay':
          this.currentValue -= (1.0 - this.sustain) / (this.decay * this.sampleRate);
          if (this.currentValue <= this.sustain) {
            this.currentValue = this.sustain;
            this.stage = 'sustain';
          }
          break;

        case 'sustain':
          this.currentValue = this.sustain;
          break;

        case 'release':
          this.currentValue -= this.sustain / (this.release * this.sampleRate);
          if (this.currentValue <= 0) {
            this.currentValue = 0;
            this.stage = 'idle';
          }
          break;
      }

      // Apply envelope to all channels
      for (let channel = 0; channel < output.length; channel++) {
        output[channel][i] = this.currentValue;
      }
    }

    return true;
  }
}

// LFO (Low Frequency Oscillator)
class LFOProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.frequency = 1.0;
    this.phase = 0;
    this.sampleRate = 44100;

    this.port.onmessage = (event) => {
      if (event.data.type === 'setParameter') {
        this[event.data.name] = event.data.value;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || !output[0]) return true;

    for (let i = 0; i < output[0].length; i++) {
      const lfoValue = Math.sin(this.phase * 2 * Math.PI);

      for (let channel = 0; channel < output.length; channel++) {
        output[channel][i] = lfoValue;
      }

      this.phase += this.frequency / this.sampleRate;
      if (this.phase >= 1.0) this.phase -= 1.0;
    }

    return true;
  }
}

// Register processors
registerProcessor('dsp-processor', DSPProcessor);
registerProcessor('envelope-processor', EnvelopeProcessor);
registerProcessor('lfo-processor', LFOProcessor);
