# Sound Designer Testing Framework

Comprehensive testing utilities and framework for audio plugin development.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Utilities

### DSP Testing (`dspTestUtils.ts`)

Generate and analyze test signals for DSP algorithm validation.

#### Signal Generation

```typescript
import { generateSineWave, generateWhiteNoise, generateSweep } from '@test/utils';

// Generate a 440Hz sine wave
const sine = generateSineWave(440, 1.0, 44100);

// Generate white noise
const noise = generateWhiteNoise(1.0, 44100);

// Generate frequency sweep (chirp)
const sweep = generateSweep(20, 20000, 5.0, 44100);
```

#### Signal Analysis

```typescript
import { calculateRMS, calculatePeak, findDominantFrequency } from '@test/utils';

const rms = calculateRMS(signal.samples);
const peak = calculatePeak(signal.samples);
const freq = findDominantFrequency(signal.samples, 44100);
```

#### Signal Validation

```typescript
import { assertSignal } from '@test/utils';

// Assert signal has no NaN or Infinity values
assertSignal.isFinite(samples);

// Assert signal is within range
assertSignal.inRange(samples, -1, 1);

// Assert signal has no clipping
assertSignal.hasNoClipping(samples);
```

### Audio Quality Analysis (`audioQualityAnalyzer.ts`)

Comprehensive audio quality metrics and validation.

```typescript
import { AudioQualityAnalyzer } from '@test/utils';

const analyzer = new AudioQualityAnalyzer(44100);
const metrics = analyzer.analyze(audioSamples);

console.log(metrics.qualityScore); // 0-100
console.log(metrics.qualityGrade); // 'excellent' | 'good' | 'fair' | 'poor'
console.log(metrics.thd); // Total Harmonic Distortion %
console.log(metrics.hasClipping); // boolean

// Generate detailed report
const report = analyzer.generateReport(metrics);
console.log(report);
```

#### Quality Metrics

- **Level Metrics**: RMS, Peak, Crest Factor, Dynamic Range
- **Distortion Metrics**: THD, THD+N
- **Frequency Metrics**: DC Offset, Bandwidth, Fundamental Frequency
- **Quality Checks**: Clipping, DC Offset, Subsonic/Ultrasonic Content
- **Overall Score**: 0-100 quality score with grade

### Plugin Validation (`pluginValidator.ts`)

Validate plugin compliance with VST, AU, and AAX standards.

```typescript
import { PluginValidator } from '@test/utils';

const validator = new PluginValidator();

const manifest = {
  name: 'My Synth',
  vendor: 'My Company',
  version: '1.0.0',
  uniqueId: 'MSYN',
  category: 'Instrument',
  parameters: [/* ... */],
  inputs: 0,
  outputs: 2,
  supportsMidi: true,
  supportsPresets: true,
  isSynth: true,
};

const result = validator.validateManifest(manifest);

console.log(result.isValid); // boolean
console.log(result.errors); // string[]
console.log(result.warnings); // string[]
console.log(result.compliance.vst); // boolean
console.log(result.compliance.vst3); // boolean

// Generate validation report
const report = validator.generateReport(result);
console.log(report);
```

### Mock AudioContext (`mockAudioContext.ts`)

Complete mock implementation of Web Audio API for testing.

```typescript
import { MockAudioContext } from '@test/utils';

const audioContext = new MockAudioContext({ sampleRate: 48000 });

const oscillator = audioContext.createOscillator();
const gain = audioContext.createGain();

oscillator.connect(gain);
gain.connect(audioContext.destination);

oscillator.start();

// Advance time for testing
audioContext.advanceTime(1.0); // Advance 1 second
```

## Custom Matchers

The testing framework includes custom matchers for audio testing:

```typescript
// Check if value is within range
expect(value).toBeWithinRange(0, 1);

// Compare arrays with tolerance
expect(actualArray).toBeCloseToArray(expectedArray, 2);

// Validate AudioBuffer
expect(audioBuffer).toHaveValidAudioBuffer();
```

## Example Tests

### DSP Algorithm Test

```typescript
import { describe, it, expect } from 'vitest';
import { generateSineWave, calculateRMS } from '@test/utils';

describe('My Filter', () => {
  it('should process audio without clipping', () => {
    const input = generateSineWave(440, 1.0, 44100);
    const output = myFilter.process(input.samples);

    expect(output.every(s => Math.abs(s) <= 1)).toBe(true);
  });

  it('should maintain correct gain', () => {
    const input = generateSineWave(440, 1.0, 44100, 0.5);
    const output = myFilter.process(input.samples);

    const inputRMS = calculateRMS(input.samples);
    const outputRMS = calculateRMS(output);

    expect(outputRMS / inputRMS).toBeCloseTo(1.0, 1);
  });
});
```

### Audio Quality Test

```typescript
import { AudioQualityAnalyzer } from '@test/utils';

describe('Plugin Output Quality', () => {
  const analyzer = new AudioQualityAnalyzer(44100);

  it('should produce high-quality output', () => {
    const output = plugin.render(inputSignal);
    const metrics = analyzer.analyze(output);

    expect(metrics.qualityGrade).toBe('excellent');
    expect(metrics.hasClipping).toBe(false);
    expect(metrics.thd).toBeLessThan(0.1);
  });
});
```

### Plugin Validation Test

```typescript
import { PluginValidator } from '@test/utils';

describe('Plugin Manifest', () => {
  const validator = new PluginValidator();

  it('should be valid for all plugin formats', () => {
    const result = validator.validateManifest(pluginManifest);

    expect(result.isValid).toBe(true);
    expect(result.compliance.vst).toBe(true);
    expect(result.compliance.vst3).toBe(true);
    expect(result.compliance.au).toBe(true);
  });
});
```

## Test Organization

```
src/test/
├── setup.ts                  # Test setup and custom matchers
├── utils/                    # Testing utilities
│   ├── dspTestUtils.ts      # DSP signal generation and analysis
│   ├── audioQualityAnalyzer.ts  # Audio quality metrics
│   ├── pluginValidator.ts   # Plugin compliance validation
│   ├── mockAudioContext.ts  # Web Audio API mocks
│   └── index.ts             # Exports
├── examples/                 # Example tests
│   ├── dsp.test.ts
│   ├── audioQuality.test.ts
│   └── pluginValidation.test.ts
└── README.md                 # This file
```

## Best Practices

### 1. Use Signal Generators

Always use the provided signal generators instead of creating signals manually:

```typescript
// ✓ Good
const signal = generateSineWave(440, 1.0, 44100);

// ✗ Bad
const signal = new Float32Array(44100);
for (let i = 0; i < 44100; i++) {
  signal[i] = Math.sin(2 * Math.PI * 440 * i / 44100);
}
```

### 2. Validate All Audio Output

Always validate that audio output is finite and within range:

```typescript
const output = processAudio(input);

assertSignal.isFinite(output);
assertSignal.inRange(output, -1, 1);
assertSignal.hasNoClipping(output);
```

### 3. Use Quality Analysis

For integration tests, use the audio quality analyzer:

```typescript
const analyzer = new AudioQualityAnalyzer(44100);
const metrics = analyzer.analyze(output);

expect(metrics.qualityGrade).not.toBe('poor');
```

### 4. Test Multiple Sample Rates

Test your DSP algorithms at multiple sample rates:

```typescript
[44100, 48000, 96000].forEach(sampleRate => {
  it(`should work at ${sampleRate}Hz`, () => {
    const signal = generateSineWave(440, 1.0, sampleRate);
    // ... test
  });
});
```

### 5. Use Tolerance for Floating Point

Always use tolerance when comparing floating-point values:

```typescript
// ✓ Good
expect(value).toBeCloseTo(expectedValue, 2);
expect(array).toBeCloseToArray(expectedArray, 2);

// ✗ Bad
expect(value).toBe(expectedValue);
```

## Performance Testing

```typescript
import { describe, it, expect } from 'vitest';

describe('Performance', () => {
  it('should process in real-time', () => {
    const blockSize = 512;
    const sampleRate = 44100;
    const signal = generateSineWave(440, 1.0, sampleRate);

    const startTime = performance.now();

    for (let i = 0; i < signal.samples.length; i += blockSize) {
      const block = signal.samples.slice(i, i + blockSize);
      myProcessor.process(block);
    }

    const endTime = performance.now();
    const processingTime = (endTime - startTime) / 1000; // seconds
    const audioTime = signal.duration; // seconds

    // Should process faster than real-time
    expect(processingTime).toBeLessThan(audioTime);
  });
});
```

## Troubleshooting

### Tests are flaky

- Use larger tolerance values for floating-point comparisons
- Ensure tests are deterministic (avoid Math.random() without seeds)
- Check for timing issues in async tests

### Performance tests fail

- Run tests in release mode, not debug mode
- Disable code coverage for performance tests
- Use realistic block sizes (512 or 1024 samples)

### Mock AudioContext issues

- Ensure you're using the provided MockAudioContext
- Check that all nodes are properly connected
- Verify sample rates match between components

## Contributing

When adding new test utilities:

1. Add comprehensive JSDoc comments
2. Include usage examples
3. Write tests for the test utilities themselves
4. Update this README
