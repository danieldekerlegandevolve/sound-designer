/**
 * MIDI Learn Manager
 *
 * Manages MIDI learn sessions and MIDI CC mappings to parameters
 */

import {
  MIDIMapping,
  MIDILearnSession,
  generateMappingId,
  ccToNormalized,
  applyCurve,
} from '../../shared/midiAdvancedTypes';

export type MappingChangeCallback = (mappings: MIDIMapping[]) => void;

export class MIDILearnManager {
  private mappings: Map<string, MIDIMapping> = new Map();
  private learnSession: MIDILearnSession | null = null;
  private listeners: Set<MappingChangeCallback> = new Set();
  private ccCache: Map<string, number> = new Map(); // Cache last CC values

  constructor() {
    // Initialize with empty mappings
  }

  /**
   * Start a MIDI learn session
   */
  startLearnSession(targetType: string, targetId: string, targetName: string): void {
    if (this.learnSession) {
      this.cancelLearnSession();
    }

    this.learnSession = {
      isActive: true,
      targetType,
      targetId,
      targetName,
    };

    console.log(`Started MIDI learn for ${targetName}`);
  }

  /**
   * Cancel current learn session
   */
  cancelLearnSession(): void {
    if (this.learnSession?.onCancel) {
      this.learnSession.onCancel();
    }
    this.learnSession = null;
    console.log('MIDI learn session cancelled');
  }

  /**
   * Handle incoming MIDI CC message during learn session
   */
  handleLearnMIDIMessage(ccNumber: number, channel: number, value: number): boolean {
    if (!this.learnSession) return false;

    // Create new mapping
    const mapping: MIDIMapping = {
      id: generateMappingId(),
      name: `${this.learnSession.targetName} ← CC${ccNumber}`,
      midiCC: ccNumber,
      midiChannel: channel,
      targetType: this.learnSession.targetType as any,
      targetId: this.learnSession.targetId,
      minValue: 0,
      maxValue: 1,
      curve: 'linear',
      enabled: true,
      lastValue: value,
    };

    this.addMapping(mapping);

    if (this.learnSession.onComplete) {
      this.learnSession.onComplete(mapping);
    }

    console.log(`Learned: CC${ccNumber} on channel ${channel} → ${this.learnSession.targetName}`);

    this.learnSession = null;
    return true;
  }

  /**
   * Add a mapping
   */
  addMapping(mapping: MIDIMapping): void {
    this.mappings.set(mapping.id, mapping);
    this.notifyListeners();
  }

  /**
   * Remove a mapping
   */
  removeMapping(mappingId: string): void {
    this.mappings.delete(mappingId);
    this.notifyListeners();
  }

  /**
   * Update a mapping
   */
  updateMapping(mappingId: string, updates: Partial<MIDIMapping>): void {
    const mapping = this.mappings.get(mappingId);
    if (mapping) {
      Object.assign(mapping, updates);
      this.notifyListeners();
    }
  }

  /**
   * Get all mappings
   */
  getMappings(): MIDIMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Get mapping by ID
   */
  getMapping(mappingId: string): MIDIMapping | undefined {
    return this.mappings.get(mappingId);
  }

  /**
   * Get mappings for a specific target
   */
  getMappingsForTarget(targetId: string): MIDIMapping[] {
    return Array.from(this.mappings.values()).filter((m) => m.targetId === targetId);
  }

  /**
   * Handle incoming MIDI CC message and apply to mapped targets
   */
  handleMIDICC(ccNumber: number, channel: number, value: number): Map<string, number> {
    const cacheKey = `${channel}-${ccNumber}`;
    this.ccCache.set(cacheKey, value);

    const affectedTargets = new Map<string, number>();

    // Find all mappings for this CC
    for (const mapping of this.mappings.values()) {
      if (
        mapping.enabled &&
        mapping.midiCC === ccNumber &&
        mapping.midiChannel === channel
      ) {
        // Normalize CC value (0-127 to 0-1)
        const normalized = ccToNormalized(value);

        // Apply curve
        const curved = applyCurve(normalized, mapping.curve);

        // Scale to target range
        const scaled = mapping.minValue + curved * (mapping.maxValue - mapping.minValue);

        // Update last value
        mapping.lastValue = value;

        // Store affected target
        affectedTargets.set(mapping.targetId, scaled);
      }
    }

    if (affectedTargets.size > 0) {
      this.notifyListeners();
    }

    return affectedTargets;
  }

  /**
   * Get current MIDI learn session
   */
  getLearnSession(): MIDILearnSession | null {
    return this.learnSession;
  }

  /**
   * Check if currently in learn mode
   */
  isLearning(): boolean {
    return this.learnSession !== null && this.learnSession.isActive;
  }

  /**
   * Subscribe to mapping changes
   */
  subscribe(callback: MappingChangeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    const mappings = this.getMappings();
    this.listeners.forEach((callback) => callback(mappings));
  }

  /**
   * Export mappings to JSON
   */
  exportMappings(): string {
    const mappings = Array.from(this.mappings.values());
    return JSON.stringify(mappings, null, 2);
  }

  /**
   * Import mappings from JSON
   */
  importMappings(json: string): void {
    try {
      const mappings = JSON.parse(json) as MIDIMapping[];
      this.mappings.clear();
      mappings.forEach((mapping) => {
        this.mappings.set(mapping.id, mapping);
      });
      this.notifyListeners();
      console.log(`Imported ${mappings.length} MIDI mappings`);
    } catch (error) {
      console.error('Failed to import MIDI mappings:', error);
      throw error;
    }
  }

  /**
   * Clear all mappings
   */
  clearMappings(): void {
    this.mappings.clear();
    this.notifyListeners();
    console.log('Cleared all MIDI mappings');
  }

  /**
   * Get last value for a CC
   */
  getLastCCValue(ccNumber: number, channel: number): number | undefined {
    const cacheKey = `${channel}-${ccNumber}`;
    return this.ccCache.get(cacheKey);
  }
}

// Singleton instance
let midiLearnManagerInstance: MIDILearnManager | null = null;

/**
 * Get the global MIDILearnManager instance
 */
export function getMIDILearnManager(): MIDILearnManager {
  if (!midiLearnManagerInstance) {
    midiLearnManagerInstance = new MIDILearnManager();
  }
  return midiLearnManagerInstance;
}

/**
 * Reset the global MIDILearnManager instance
 */
export function resetMIDILearnManager(): void {
  midiLearnManagerInstance = null;
}
