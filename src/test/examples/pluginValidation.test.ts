import { describe, it, expect } from 'vitest';
import { PluginValidator, PluginManifest } from '../utils/pluginValidator';

describe('Plugin Validator', () => {
  const validator = new PluginValidator();

  const validManifest: PluginManifest = {
    name: 'Test Synth',
    vendor: 'Test Audio',
    version: '1.0.0',
    uniqueId: 'TST1',
    category: 'Instrument',
    description: 'A test synthesizer',
    parameters: [
      {
        id: 'volume',
        name: 'Volume',
        min: 0,
        max: 1,
        default: 0.7,
        type: 'float',
        automatable: true,
      },
      {
        id: 'cutoff',
        name: 'Filter Cutoff',
        min: 20,
        max: 20000,
        default: 1000,
        unit: 'Hz',
        type: 'float',
        automatable: true,
      },
    ],
    inputs: 0,
    outputs: 2,
    supportsMidi: true,
    supportsPresets: true,
    isSynth: true,
  };

  it('should validate a correct plugin manifest', () => {
    const result = validator.validateManifest(validManifest);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject plugin without name', () => {
    const manifest = { ...validManifest, name: '' };
    const result = validator.validateManifest(manifest);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Plugin name is required');
  });

  it('should reject plugin without vendor', () => {
    const manifest = { ...validManifest, vendor: '' };
    const result = validator.validateManifest(manifest);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Vendor name is required');
  });

  it('should reject invalid version format', () => {
    const manifest = { ...validManifest, version: 'v1.0' };
    const result = validator.validateManifest(manifest);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Valid version number is required (e.g., 1.0.0)');
  });

  it('should accept valid version formats', () => {
    const versions = ['1.0.0', '2.5.3', '10.20.30'];

    versions.forEach((version) => {
      const manifest = { ...validManifest, version };
      const result = validator.validateManifest(manifest);
      expect(result.isValid).toBe(true);
    });
  });

  it('should reject plugin with short unique ID', () => {
    const manifest = { ...validManifest, uniqueId: 'AB' };
    const result = validator.validateManifest(manifest);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Unique ID must be at least 4 characters');
  });

  it('should warn about long plugin names', () => {
    const manifest = {
      ...validManifest,
      name: 'This Is A Very Long Plugin Name That Exceeds Limits',
    };
    const result = validator.validateManifest(manifest);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('31 characters'))).toBe(true);
  });

  it('should reject plugin without inputs or outputs', () => {
    const manifest = { ...validManifest, inputs: 0, outputs: 0 };
    const result = validator.validateManifest(manifest);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Plugin must have at least one input or output');
  });

  it('should warn about too many channels', () => {
    const manifest = { ...validManifest, inputs: 64, outputs: 64 };
    const result = validator.validateManifest(manifest);

    expect(result.warnings.some((w) => w.includes('32 channels'))).toBe(true);
  });
});

describe('Parameter Validation', () => {
  const validator = new PluginValidator();

  const baseManifest: PluginManifest = {
    name: 'Test Plugin',
    vendor: 'Test',
    version: '1.0.0',
    uniqueId: 'TEST',
    category: 'Effect',
    parameters: [],
    inputs: 2,
    outputs: 2,
    supportsMidi: false,
    supportsPresets: true,
    isSynth: false,
  };

  it('should reject parameter without ID', () => {
    const manifest = {
      ...baseManifest,
      parameters: [
        {
          id: '',
          name: 'Volume',
          min: 0,
          max: 1,
          default: 0.5,
          type: 'float' as const,
          automatable: true,
        },
      ],
    };

    const result = validator.validateManifest(manifest);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('ID is required'))).toBe(true);
  });

  it('should reject parameter with invalid range', () => {
    const manifest = {
      ...baseManifest,
      parameters: [
        {
          id: 'param1',
          name: 'Test',
          min: 1,
          max: 0, // Invalid: min > max
          default: 0.5,
          type: 'float' as const,
          automatable: true,
        },
      ],
    };

    const result = validator.validateManifest(manifest);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Min must be less than max'))).toBe(true);
  });

  it('should reject parameter with default out of range', () => {
    const manifest = {
      ...baseManifest,
      parameters: [
        {
          id: 'param1',
          name: 'Test',
          min: 0,
          max: 1,
          default: 2, // Out of range
          type: 'float' as const,
          automatable: true,
        },
      ],
    };

    const result = validator.validateManifest(manifest);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Default value out of range'))).toBe(true);
  });

  it('should reject duplicate parameter IDs', () => {
    const manifest = {
      ...baseManifest,
      parameters: [
        {
          id: 'volume',
          name: 'Volume 1',
          min: 0,
          max: 1,
          default: 0.5,
          type: 'float' as const,
          automatable: true,
        },
        {
          id: 'volume', // Duplicate
          name: 'Volume 2',
          min: 0,
          max: 1,
          default: 0.5,
          type: 'float' as const,
          automatable: true,
        },
      ],
    };

    const result = validator.validateManifest(manifest);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Duplicate parameter ID: volume');
  });

  it('should warn about too many parameters', () => {
    const parameters = Array.from({ length: 10001 }, (_, i) => ({
      id: `param${i}`,
      name: `Parameter ${i}`,
      min: 0,
      max: 1,
      default: 0.5,
      type: 'float' as const,
      automatable: true,
    }));

    const manifest = { ...baseManifest, parameters };
    const result = validator.validateManifest(manifest);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Too many parameters'))).toBe(true);
  });
});

describe('Format Compliance', () => {
  const validator = new PluginValidator();

  it('should check VST2 compliance', () => {
    const manifest: PluginManifest = {
      name: 'VST Plugin',
      vendor: 'Test',
      version: '1.0.0',
      uniqueId: 'VST1', // 4 characters for VST2
      category: 'Effect',
      parameters: [],
      inputs: 2,
      outputs: 2,
      supportsMidi: false,
      supportsPresets: true,
      isSynth: false,
    };

    const result = validator.validateManifest(manifest);
    expect(result.compliance.vst).toBe(true);
  });

  it('should check VST3 compliance', () => {
    const manifest: PluginManifest = {
      name: 'VST3 Plugin',
      vendor: 'Test',
      version: '1.0.0',
      uniqueId: '0123456789ABCDEF0123456789ABCDEF', // 32 char hex
      category: 'Effect',
      parameters: [],
      inputs: 2,
      outputs: 2,
      supportsMidi: false,
      supportsPresets: true,
      isSynth: false,
    };

    const result = validator.validateManifest(manifest);
    // Will have warnings but should not fail
    expect(result.compliance.vst3).toBe(true);
  });

  it('should check AU compliance', () => {
    const manifest: PluginManifest = {
      name: 'AU Plugin',
      vendor: 'Test',
      version: '1.0.0',
      uniqueId: 'tesu', // 4 lowercase letters for AU
      category: 'Effect',
      parameters: [],
      inputs: 2,
      outputs: 2,
      supportsMidi: false,
      supportsPresets: true,
      isSynth: false,
    };

    const result = validator.validateManifest(manifest);
    expect(result.compliance.au).toBe(true);
  });

  it('should generate validation report', () => {
    const manifest: PluginManifest = {
      name: 'Test Plugin',
      vendor: 'Test',
      version: '1.0.0',
      uniqueId: 'TEST',
      category: 'Effect',
      parameters: [],
      inputs: 2,
      outputs: 2,
      supportsMidi: false,
      supportsPresets: true,
      isSynth: false,
    };

    const result = validator.validateManifest(manifest);
    const report = validator.generateReport(result);

    expect(report).toContain('Plugin Validation Report');
    expect(report).toContain('FORMAT COMPLIANCE');
    expect(report).toContain('VST2');
    expect(report).toContain('VST3');
    expect(report).toContain('AU');
    expect(report).toContain('AAX');
  });
});

describe('Automation Validation', () => {
  const validator = new PluginValidator();

  it('should validate automatable parameters', () => {
    const param = {
      id: 'volume',
      name: 'Volume',
      min: 0,
      max: 1,
      default: 0.7,
      type: 'float' as const,
      automatable: true,
    };

    const result = validator.validateAutomation(param);
    expect(result.isValid).toBe(true);
  });

  it('should reject automatable boolean parameters', () => {
    const param = {
      id: 'bypass',
      name: 'Bypass',
      min: 0,
      max: 1,
      default: 0,
      type: 'bool' as const,
      automatable: true,
    };

    const result = validator.validateAutomation(param);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('zipper noise'))).toBe(true);
  });
});
