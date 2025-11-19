/**
 * DSP Testing Utilities
 * Utilities for testing digital signal processing algorithms
 */

export interface AudioTestSignal {
  sampleRate: number;
  duration: number;
  samples: Float32Array;
}

/**
 * Generate a sine wave test signal
 */
export function generateSineWave(
  frequency: number,
  duration: number,
  sampleRate: number = 44100,
  amplitude: number = 1.0
): AudioTestSignal {
  const length = Math.floor(duration * sampleRate);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    samples[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);
  }

  return { sampleRate, duration, samples };
}

/**
 * Generate a square wave test signal
 */
export function generateSquareWave(
  frequency: number,
  duration: number,
  sampleRate: number = 44100,
  amplitude: number = 1.0
): AudioTestSignal {
  const length = Math.floor(duration * sampleRate);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    samples[i] = amplitude * (Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1);
  }

  return { sampleRate, duration, samples };
}

/**
 * Generate white noise test signal
 */
export function generateWhiteNoise(
  duration: number,
  sampleRate: number = 44100,
  amplitude: number = 1.0
): AudioTestSignal {
  const length = Math.floor(duration * sampleRate);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    samples[i] = amplitude * (Math.random() * 2 - 1);
  }

  return { sampleRate, duration, samples };
}

/**
 * Generate a frequency sweep (chirp)
 */
export function generateSweep(
  startFreq: number,
  endFreq: number,
  duration: number,
  sampleRate: number = 44100,
  amplitude: number = 1.0
): AudioTestSignal {
  const length = Math.floor(duration * sampleRate);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const freq = startFreq + (endFreq - startFreq) * (t / duration);
    samples[i] = amplitude * Math.sin(2 * Math.PI * freq * t);
  }

  return { sampleRate, duration, samples };
}

/**
 * Generate an impulse signal (dirac delta)
 */
export function generateImpulse(
  duration: number,
  sampleRate: number = 44100,
  amplitude: number = 1.0
): AudioTestSignal {
  const length = Math.floor(duration * sampleRate);
  const samples = new Float32Array(length);
  samples[0] = amplitude;

  return { sampleRate, duration, samples };
}

/**
 * Calculate RMS (Root Mean Square) of a signal
 */
export function calculateRMS(samples: Float32Array): number {
  let sumSquares = 0;
  for (let i = 0; i < samples.length; i++) {
    sumSquares += samples[i] * samples[i];
  }
  return Math.sqrt(sumSquares / samples.length);
}

/**
 * Calculate peak level of a signal
 */
export function calculatePeak(samples: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
  }
  return peak;
}

/**
 * Calculate Signal-to-Noise Ratio (SNR)
 */
export function calculateSNR(signal: Float32Array, noise: Float32Array): number {
  const signalRMS = calculateRMS(signal);
  const noiseRMS = calculateRMS(noise);
  return 20 * Math.log10(signalRMS / noiseRMS);
}

/**
 * Calculate Total Harmonic Distortion (THD)
 */
export function calculateTHD(
  samples: Float32Array,
  fundamentalFreq: number,
  sampleRate: number,
  numHarmonics: number = 5
): number {
  const spectrum = performFFT(samples);
  const binSize = sampleRate / samples.length;

  // Find fundamental
  const fundamentalBin = Math.round(fundamentalFreq / binSize);
  const fundamentalMagnitude = spectrum[fundamentalBin];

  // Sum harmonic magnitudes
  let harmonicSum = 0;
  for (let i = 2; i <= numHarmonics + 1; i++) {
    const harmonicBin = Math.round((fundamentalFreq * i) / binSize);
    if (harmonicBin < spectrum.length) {
      harmonicSum += spectrum[harmonicBin] * spectrum[harmonicBin];
    }
  }

  const thd = Math.sqrt(harmonicSum) / fundamentalMagnitude;
  return thd * 100; // Return as percentage
}

/**
 * Simplified FFT for testing (real input, magnitude output)
 */
export function performFFT(samples: Float32Array): Float32Array {
  const n = samples.length;
  const magnitude = new Float32Array(n / 2);

  // Simplified DFT (not optimized FFT, but works for testing)
  for (let k = 0; k < n / 2; k++) {
    let real = 0;
    let imag = 0;

    for (let t = 0; t < n; t++) {
      const angle = (-2 * Math.PI * k * t) / n;
      real += samples[t] * Math.cos(angle);
      imag += samples[t] * Math.sin(angle);
    }

    magnitude[k] = Math.sqrt(real * real + imag * imag) / n;
  }

  return magnitude;
}

/**
 * Find dominant frequency in a signal
 */
export function findDominantFrequency(
  samples: Float32Array,
  sampleRate: number
): number {
  const spectrum = performFFT(samples);
  const binSize = sampleRate / samples.length;

  let maxMagnitude = 0;
  let maxBin = 0;

  for (let i = 1; i < spectrum.length; i++) {
    if (spectrum[i] > maxMagnitude) {
      maxMagnitude = spectrum[i];
      maxBin = i;
    }
  }

  return maxBin * binSize;
}

/**
 * Check if signal is clipping
 */
export function isClipping(samples: Float32Array, threshold: number = 0.99): boolean {
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) >= threshold) {
      return true;
    }
  }
  return false;
}

/**
 * Check if signal is silent
 */
export function isSilent(samples: Float32Array, threshold: number = 0.001): boolean {
  const rms = calculateRMS(samples);
  return rms < threshold;
}

/**
 * Compare two signals with tolerance
 */
export function signalsMatch(
  a: Float32Array,
  b: Float32Array,
  tolerance: number = 0.001
): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) > tolerance) {
      return false;
    }
  }

  return true;
}

/**
 * Measure latency between input and output signals
 */
export function measureLatency(
  input: Float32Array,
  output: Float32Array,
  sampleRate: number
): number {
  const maxLag = Math.min(input.length, output.length) / 2;
  let maxCorrelation = -Infinity;
  let bestLag = 0;

  for (let lag = 0; lag < maxLag; lag++) {
    let correlation = 0;

    for (let i = 0; i < input.length - lag; i++) {
      correlation += input[i] * output[i + lag];
    }

    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestLag = lag;
    }
  }

  return (bestLag / sampleRate) * 1000; // Return in milliseconds
}

/**
 * Create a mock AudioBuffer for testing
 */
export function createMockAudioBuffer(
  samples: Float32Array | Float32Array[],
  sampleRate: number = 44100
): AudioBuffer {
  const channels = Array.isArray(samples) ? samples : [samples];
  const length = channels[0].length;

  return {
    length,
    numberOfChannels: channels.length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: (channel: number) => channels[channel] || new Float32Array(length),
    copyFromChannel: () => {},
    copyToChannel: () => {},
  } as AudioBuffer;
}

/**
 * Assert signal properties for testing
 */
export const assertSignal = {
  isFinite: (samples: Float32Array) => {
    for (let i = 0; i < samples.length; i++) {
      if (!isFinite(samples[i])) {
        throw new Error(`Non-finite value at index ${i}: ${samples[i]}`);
      }
    }
  },

  inRange: (samples: Float32Array, min: number, max: number) => {
    for (let i = 0; i < samples.length; i++) {
      if (samples[i] < min || samples[i] > max) {
        throw new Error(
          `Value out of range at index ${i}: ${samples[i]} (expected ${min}-${max})`
        );
      }
    }
  },

  hasNoClipping: (samples: Float32Array) => {
    if (isClipping(samples)) {
      throw new Error('Signal contains clipping');
    }
  },

  hasNoSilence: (samples: Float32Array) => {
    if (isSilent(samples)) {
      throw new Error('Signal is silent');
    }
  },
};
