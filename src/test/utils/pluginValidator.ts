/**
 * Plugin Validator
 * Validates plugin compliance with VST, AU, and AAX standards
 */

export interface PluginValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
  compliance: {
    vst: boolean;
    vst3: boolean;
    au: boolean;
    aax: boolean;
  };
}

export interface PluginManifest {
  name: string;
  vendor: string;
  version: string;
  uniqueId: string;
  category: string;
  description?: string;
  parameters: PluginParameter[];
  inputs: number;
  outputs: number;
  supportsMidi: boolean;
  supportsPresets: boolean;
  isSynth: boolean;
}

export interface PluginParameter {
  id: string;
  name: string;
  min: number;
  max: number;
  default: number;
  unit?: string;
  type: 'float' | 'int' | 'bool' | 'enum';
  automatable: boolean;
}

export class PluginValidator {
  /**
   * Validate plugin manifest
   */
  validateManifest(manifest: PluginManifest): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    // Required fields
    if (!manifest.name || manifest.name.trim() === '') {
      errors.push('Plugin name is required');
    }

    if (!manifest.vendor || manifest.vendor.trim() === '') {
      errors.push('Vendor name is required');
    }

    if (!manifest.version || !this.isValidVersion(manifest.version)) {
      errors.push('Valid version number is required (e.g., 1.0.0)');
    }

    if (!manifest.uniqueId || manifest.uniqueId.length < 4) {
      errors.push('Unique ID must be at least 4 characters');
    }

    // Name validation
    if (manifest.name.length > 31) {
      warnings.push('Plugin name exceeds 31 characters (may be truncated in some DAWs)');
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(manifest.name)) {
      warnings.push('Plugin name contains special characters (may cause issues)');
    }

    // Vendor validation
    if (manifest.vendor.length > 31) {
      warnings.push('Vendor name exceeds 31 characters');
    }

    // Category validation
    const validCategories = [
      'Effect',
      'Instrument',
      'Generator',
      'Analysis',
      'Mastering',
      'Restoration',
      'Delay',
      'Reverb',
      'Dynamics',
      'EQ',
      'Filter',
      'Distortion',
      'Modulation',
    ];

    if (!validCategories.includes(manifest.category)) {
      warnings.push(
        `Category '${manifest.category}' is not standard. Use: ${validCategories.join(', ')}`
      );
    }

    // I/O validation
    if (manifest.inputs < 0 || manifest.outputs < 0) {
      errors.push('Input/output counts cannot be negative');
    }

    if (manifest.inputs === 0 && manifest.outputs === 0) {
      errors.push('Plugin must have at least one input or output');
    }

    if (manifest.inputs > 32 || manifest.outputs > 32) {
      warnings.push('More than 32 channels may not be supported by all DAWs');
    }

    // Parameter validation
    if (manifest.parameters.length === 0) {
      warnings.push('Plugin has no parameters');
    }

    if (manifest.parameters.length > 10000) {
      errors.push('Too many parameters (max 10000 for most plugin formats)');
    }

    manifest.parameters.forEach((param, index) => {
      const paramErrors = this.validateParameter(param, index);
      errors.push(...paramErrors);
    });

    // Check for duplicate parameter IDs
    const paramIds = new Set<string>();
    manifest.parameters.forEach((param) => {
      if (paramIds.has(param.id)) {
        errors.push(`Duplicate parameter ID: ${param.id}`);
      }
      paramIds.add(param.id);
    });

    // MIDI support
    if (manifest.supportsMidi && manifest.isSynth && manifest.inputs > 0) {
      warnings.push('Synth plugins typically have no audio inputs');
    }

    // Preset support
    if (!manifest.supportsPresets) {
      info.push('Plugin does not support presets');
    }

    // Check compliance
    const compliance = {
      vst: this.checkVSTCompliance(manifest, errors, warnings),
      vst3: this.checkVST3Compliance(manifest, errors, warnings),
      au: this.checkAUCompliance(manifest, errors, warnings),
      aax: this.checkAAXCompliance(manifest, errors, warnings),
    };

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      info,
      compliance,
    };
  }

  /**
   * Validate parameter
   */
  private validateParameter(param: PluginParameter, index: number): string[] {
    const errors: string[] = [];

    if (!param.id || param.id.trim() === '') {
      errors.push(`Parameter ${index}: ID is required`);
    }

    if (!param.name || param.name.trim() === '') {
      errors.push(`Parameter ${index}: Name is required`);
    }

    if (param.name && param.name.length > 63) {
      errors.push(`Parameter ${index}: Name exceeds 63 characters`);
    }

    if (param.min >= param.max) {
      errors.push(`Parameter ${index}: Min must be less than max`);
    }

    if (param.default < param.min || param.default > param.max) {
      errors.push(`Parameter ${index}: Default value out of range`);
    }

    if (!['float', 'int', 'bool', 'enum'].includes(param.type)) {
      errors.push(`Parameter ${index}: Invalid type '${param.type}'`);
    }

    return errors;
  }

  /**
   * Check VST2 compliance
   */
  private checkVSTCompliance(
    manifest: PluginManifest,
    errors: string[],
    warnings: string[]
  ): boolean {
    // VST2 specific checks
    if (manifest.uniqueId.length !== 4) {
      warnings.push('VST2: Unique ID should be exactly 4 characters');
    }

    if (manifest.parameters.length > 128) {
      warnings.push('VST2: More than 128 parameters may cause compatibility issues');
    }

    return errors.length === 0;
  }

  /**
   * Check VST3 compliance
   */
  private checkVST3Compliance(
    manifest: PluginManifest,
    errors: string[],
    warnings: string[]
  ): boolean {
    // VST3 specific checks
    if (!/^[0-9A-F]{32}$/.test(manifest.uniqueId)) {
      warnings.push('VST3: Unique ID should be a 32-character hexadecimal GUID');
    }

    // VST3 requires specific channel configurations
    const validConfigs = [
      [0, 1],
      [1, 1],
      [2, 2],
      [0, 2],
    ];
    const hasValidConfig = validConfigs.some(
      ([i, o]) => manifest.inputs === i && manifest.outputs === o
    );

    if (!hasValidConfig) {
      warnings.push(
        `VST3: Channel configuration ${manifest.inputs}→${manifest.outputs} may not be standard`
      );
    }

    return errors.length === 0;
  }

  /**
   * Check Audio Unit compliance
   */
  private checkAUCompliance(
    manifest: PluginManifest,
    errors: string[],
    warnings: string[]
  ): boolean {
    // AU specific checks
    if (!/^[a-z]{4}$/.test(manifest.uniqueId.toLowerCase())) {
      warnings.push('AU: Unique ID should be exactly 4 lowercase letters');
    }

    // AU requires manufacturer code
    if (!manifest.vendor || manifest.vendor.length < 4) {
      warnings.push('AU: Vendor code should be at least 4 characters');
    }

    return errors.length === 0;
  }

  /**
   * Check AAX compliance
   */
  private checkAAXCompliance(
    manifest: PluginManifest,
    errors: string[],
    warnings: string[]
  ): boolean {
    // AAX specific checks
    if (manifest.parameters.length > 1024) {
      warnings.push('AAX: More than 1024 parameters is not recommended');
    }

    // AAX requires specific naming
    if (manifest.name.length > 31) {
      warnings.push('AAX: Plugin name should not exceed 31 characters');
    }

    return errors.length === 0;
  }

  /**
   * Validate version string
   */
  private isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version);
  }

  /**
   * Generate validation report
   */
  generateReport(result: PluginValidationResult): string {
    const lines = [
      '=== Plugin Validation Report ===',
      '',
      `Status: ${result.isValid ? 'VALID' : 'INVALID'}`,
      '',
    ];

    if (result.errors.length > 0) {
      lines.push('ERRORS:');
      result.errors.forEach((error) => lines.push(`  ✗ ${error}`));
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('WARNINGS:');
      result.warnings.forEach((warning) => lines.push(`  ⚠ ${warning}`));
      lines.push('');
    }

    if (result.info.length > 0) {
      lines.push('INFO:');
      result.info.forEach((info) => lines.push(`  ℹ ${info}`));
      lines.push('');
    }

    lines.push('FORMAT COMPLIANCE:');
    lines.push(`  VST2: ${result.compliance.vst ? '✓' : '✗'}`);
    lines.push(`  VST3: ${result.compliance.vst3 ? '✓' : '✗'}`);
    lines.push(`  AU: ${result.compliance.au ? '✓' : '✗'}`);
    lines.push(`  AAX: ${result.compliance.aax ? '✓' : '✗'}`);

    return lines.join('\n');
  }

  /**
   * Validate latency reporting
   */
  validateLatency(reportedLatency: number, measuredLatency: number): {
    isValid: boolean;
    error?: string;
  } {
    const tolerance = 64; // samples

    if (Math.abs(reportedLatency - measuredLatency) > tolerance) {
      return {
        isValid: false,
        error: `Latency mismatch: reported ${reportedLatency} samples, measured ${measuredLatency} samples`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate parameter automation
   */
  validateAutomation(param: PluginParameter): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!param.automatable) {
      return { isValid: true, errors };
    }

    // Check that automated parameters have reasonable ranges
    const range = param.max - param.min;
    if (range === 0) {
      errors.push(`Parameter ${param.name}: Automatable parameter has zero range`);
    }

    // Check for smooth value changes
    if (param.type === 'bool' && param.automatable) {
      errors.push(
        `Parameter ${param.name}: Boolean parameters should not be automatable (causes zipper noise)`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
