import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web Audio API
global.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn(),
  createGain: vi.fn(),
  createBiquadFilter: vi.fn(),
  createBufferSource: vi.fn(),
  createAnalyser: vi.fn(),
  createBuffer: vi.fn(),
  decodeAudioData: vi.fn(),
  destination: {},
  sampleRate: 44100,
  currentTime: 0,
  state: 'running',
  suspend: vi.fn(),
  resume: vi.fn(),
  close: vi.fn(),
}));

// Mock AudioBuffer
global.AudioBuffer = vi.fn().mockImplementation((options) => ({
  length: options.length,
  numberOfChannels: options.numberOfChannels,
  sampleRate: options.sampleRate,
  duration: options.length / options.sampleRate,
  getChannelData: vi.fn((channel) => new Float32Array(options.length)),
  copyFromChannel: vi.fn(),
  copyToChannel: vi.fn(),
}));

// Mock File API
global.File = class File {
  constructor(bits: any[], name: string, options?: any) {
    return new Blob(bits, options) as any;
  }
} as any;

global.FileReader = class FileReader {
  readAsArrayBuffer = vi.fn();
  readAsText = vi.fn();
  result: any = null;
  onload: any = null;
  onerror: any = null;
} as any;

// Extend expect with custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  toBeCloseToArray(received: number[], expected: number[], precision: number = 2) {
    if (received.length !== expected.length) {
      return {
        message: () =>
          `expected arrays to have same length (${received.length} vs ${expected.length})`,
        pass: false,
      };
    }

    for (let i = 0; i < received.length; i++) {
      const diff = Math.abs(received[i] - expected[i]);
      const threshold = Math.pow(10, -precision) / 2;
      if (diff > threshold) {
        return {
          message: () =>
            `expected ${received[i]} to be close to ${expected[i]} at index ${i}`,
          pass: false,
        };
      }
    }

    return {
      message: () => `expected arrays not to match`,
      pass: true,
    };
  },
  toHaveValidAudioBuffer(received: any) {
    const isValid =
      received &&
      typeof received.length === 'number' &&
      typeof received.numberOfChannels === 'number' &&
      typeof received.sampleRate === 'number' &&
      received.sampleRate > 0 &&
      received.numberOfChannels > 0 &&
      received.length > 0;

    if (isValid) {
      return {
        message: () => `expected value not to be a valid AudioBuffer`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected value to be a valid AudioBuffer`,
        pass: false,
      };
    }
  },
});

// Type augmentation for custom matchers
declare module 'vitest' {
  interface Assertion {
    toBeWithinRange(floor: number, ceiling: number): void;
    toBeCloseToArray(expected: number[], precision?: number): void;
    toHaveValidAudioBuffer(): void;
  }
}
