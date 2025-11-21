/**
 * Advanced MIDI Processor
 *
 * Unified processor that integrates all advanced MIDI features:
 * - MIDI Learn/Mapping
 * - MPE (MIDI Polyphonic Expression)
 * - Arpeggiator
 * - Note Effects
 * - CC Automation
 * - MIDI Monitoring
 */

import { getMIDILearnManager } from './midiLearnManager';
import { getMPEManager } from './mpeManager';
import { getArpeggiator, ArpeggiatorNote } from './arpeggiator';
import { getNoteEffectsProcessor } from './noteEffectsProcessor';
import { getCCAutomationManager } from './ccAutomationManager';
import { getMIDIMonitor } from './midiMonitor';

export interface MIDIOutputNote {
  noteNumber: number;
  velocity: number;
  channel: number;
  duration?: number;
}

export type MIDIOutputCallback = (note: MIDIOutputNote, isNoteOn: boolean) => void;
export type CCOutputCallback = (cc: number, channel: number, value: number) => void;
export type ParameterChangeCallback = (parameterId: string, value: number) => void;

export class AdvancedMIDIProcessor {
  private midiLearn = getMIDILearnManager();
  private mpe = getMPEManager();
  private arpeggiator = getArpeggiator();
  private noteEffects = getNoteEffectsProcessor();
  private ccAutomation = getCCAutomationManager();
  private monitor = getMIDIMonitor();

  private noteOutputCallbacks: Set<MIDIOutputCallback> = new Set();
  private ccOutputCallbacks: Set<CCOutputCallback> = new Set();
  private parameterChangeCallbacks: Set<ParameterChangeCallback> = new Set();

  constructor() {
    this.setupArpeggiator();
    this.setupCCAutomation();
    this.setupMPE();
  }

  /**
   * Setup arpeggiator output
   */
  private setupArpeggiator(): void {
    this.arpeggiator.onNote((arpNote: ArpeggiatorNote, isNoteOn: boolean) => {
      // Process note through effects
      const processed = this.noteEffects.processNote(
        arpNote.noteNumber,
        arpNote.velocity,
        arpNote.timestamp,
        arpNote.duration
      );

      // Send to output
      const outputNote: MIDIOutputNote = {
        noteNumber: processed.noteNumber,
        velocity: processed.velocity,
        channel: 0, // Default channel
        duration: processed.duration,
      };

      this.notifyNoteOutput(outputNote, isNoteOn);
    });
  }

  /**
   * Setup CC automation output
   */
  private setupCCAutomation(): void {
    this.ccAutomation.onAutomation((cc: number, channel: number, value: number) => {
      // Round value to MIDI range
      const midiValue = Math.round(Math.max(0, Math.min(127, value)));

      // Send to output
      this.notifyCCOutput(cc, channel, midiValue);

      // Apply to mapped parameters
      this.applyMappedValue(cc, channel, midiValue);
    });
  }

  /**
   * Setup MPE output
   */
  private setupMPE(): void {
    this.mpe.onNote((note, isNoteOn) => {
      const outputNote: MIDIOutputNote = {
        noteNumber: note.noteNumber,
        velocity: note.velocity,
        channel: note.channel,
      };

      this.notifyNoteOutput(outputNote, isNoteOn);
    });
  }

  /**
   * Process incoming MIDI note on
   */
  handleNoteOn(noteNumber: number, velocity: number, channel: number): void {
    // Log to monitor
    this.monitor.logMessage('noteOn', channel, noteNumber, velocity);

    // Check if MPE is enabled
    const mpeConfig = this.mpe.getConfiguration();
    if (mpeConfig.enabled) {
      // Route to MPE
      this.mpe.handleNoteOn(noteNumber, velocity, channel);
      return;
    }

    // Check if arpeggiator is enabled
    const arpState = this.arpeggiator.getState();
    if (arpState.enabled) {
      // Route to arpeggiator
      this.arpeggiator.handleNoteOn(noteNumber, velocity);
      return;
    }

    // Otherwise, process through note effects and output
    const processed = this.noteEffects.processNote(noteNumber, velocity, Date.now());

    const outputNote: MIDIOutputNote = {
      noteNumber: processed.noteNumber,
      velocity: processed.velocity,
      channel,
    };

    this.notifyNoteOutput(outputNote, true);
  }

  /**
   * Process incoming MIDI note off
   */
  handleNoteOff(noteNumber: number, channel: number): void {
    // Log to monitor
    this.monitor.logMessage('noteOff', channel, noteNumber, 0);

    // Check if MPE is enabled
    const mpeConfig = this.mpe.getConfiguration();
    if (mpeConfig.enabled) {
      this.mpe.handleNoteOff(noteNumber, channel);
      return;
    }

    // Check if arpeggiator is enabled
    const arpState = this.arpeggiator.getState();
    if (arpState.enabled) {
      this.arpeggiator.handleNoteOff(noteNumber);
      return;
    }

    // Otherwise, send note off
    const outputNote: MIDIOutputNote = {
      noteNumber,
      velocity: 0,
      channel,
    };

    this.notifyNoteOutput(outputNote, false);
  }

  /**
   * Process incoming MIDI CC
   */
  handleCC(ccNumber: number, value: number, channel: number): void {
    // Log to monitor
    this.monitor.logMessage('cc', channel, ccNumber, value);

    // Check if in MIDI learn mode
    if (this.midiLearn.isLearning()) {
      this.midiLearn.handleLearnMIDIMessage(ccNumber, channel, value);
      return;
    }

    // Check if recording automation
    const autoState = this.ccAutomation.getState();
    if (autoState.recordEnabled) {
      this.ccAutomation.recordAutomation(ccNumber, channel, value);
    }

    // Handle MPE CC74 (timbre)
    const mpeConfig = this.mpe.getConfiguration();
    if (mpeConfig.enabled && mpeConfig.timbreEnabled && ccNumber === 74) {
      this.mpe.handleTimbre(value, channel);
    }

    // Apply to mapped parameters
    this.applyMappedValue(ccNumber, channel, value);

    // Send to output
    this.notifyCCOutput(ccNumber, channel, value);
  }

  /**
   * Process incoming MIDI pitch bend
   */
  handlePitchBend(value: number, channel: number): void {
    // Log to monitor
    const lsb = value & 0x7f;
    const msb = (value >> 7) & 0x7f;
    this.monitor.logMessage('pitchBend', channel, lsb, msb);

    // Handle MPE pitch bend
    const mpeConfig = this.mpe.getConfiguration();
    if (mpeConfig.enabled) {
      this.mpe.handlePitchBend(value, channel);
    }
  }

  /**
   * Process incoming MIDI channel pressure (aftertouch)
   */
  handleChannelPressure(value: number, channel: number): void {
    // Log to monitor
    this.monitor.logMessage('aftertouch', channel, value);

    // Handle MPE pressure
    const mpeConfig = this.mpe.getConfiguration();
    if (mpeConfig.enabled && mpeConfig.pressureEnabled) {
      this.mpe.handleChannelPressure(value, channel);
    }
  }

  /**
   * Process incoming MIDI program change
   */
  handleProgramChange(program: number, channel: number): void {
    // Log to monitor
    this.monitor.logMessage('program', channel, program);

    // Could be used for preset changes in the future
  }

  /**
   * Apply mapped CC value to target parameter
   */
  private applyMappedValue(ccNumber: number, channel: number, value: number): void {
    const affectedTargets = this.midiLearn.handleMIDICC(ccNumber, channel, value);

    affectedTargets.forEach((targetValue, targetId) => {
      this.notifyParameterChange(targetId, targetValue);
    });
  }

  /**
   * Subscribe to note output
   */
  onNoteOutput(callback: MIDIOutputCallback): () => void {
    this.noteOutputCallbacks.add(callback);
    return () => {
      this.noteOutputCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to CC output
   */
  onCCOutput(callback: CCOutputCallback): () => void {
    this.ccOutputCallbacks.add(callback);
    return () => {
      this.ccOutputCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to parameter changes
   */
  onParameterChange(callback: ParameterChangeCallback): () => void {
    this.parameterChangeCallbacks.add(callback);
    return () => {
      this.parameterChangeCallbacks.delete(callback);
    };
  }

  /**
   * Notify note output callbacks
   */
  private notifyNoteOutput(note: MIDIOutputNote, isNoteOn: boolean): void {
    this.noteOutputCallbacks.forEach((callback) => {
      try {
        callback(note, isNoteOn);
      } catch (error) {
        console.error('Error in note output callback:', error);
      }
    });
  }

  /**
   * Notify CC output callbacks
   */
  private notifyCCOutput(cc: number, channel: number, value: number): void {
    this.ccOutputCallbacks.forEach((callback) => {
      try {
        callback(cc, channel, value);
      } catch (error) {
        console.error('Error in CC output callback:', error);
      }
    });
  }

  /**
   * Notify parameter change callbacks
   */
  private notifyParameterChange(parameterId: string, value: number): void {
    this.parameterChangeCallbacks.forEach((callback) => {
      try {
        callback(parameterId, value);
      } catch (error) {
        console.error('Error in parameter change callback:', error);
      }
    });
  }

  /**
   * Panic - stop all notes and reset state
   */
  panic(): void {
    this.arpeggiator.panic();
    this.mpe.panic();
    console.log('Advanced MIDI processor panic');
  }

  /**
   * Get access to individual managers
   */
  getMIDILearnManager() {
    return this.midiLearn;
  }

  getMPEManager() {
    return this.mpe;
  }

  getArpeggiator() {
    return this.arpeggiator;
  }

  getNoteEffectsProcessor() {
    return this.noteEffects;
  }

  getCCAutomationManager() {
    return this.ccAutomation;
  }

  getMIDIMonitor() {
    return this.monitor;
  }
}

// Singleton instance
let advancedMIDIProcessorInstance: AdvancedMIDIProcessor | null = null;

/**
 * Get the global AdvancedMIDIProcessor instance
 */
export function getAdvancedMIDIProcessor(): AdvancedMIDIProcessor {
  if (!advancedMIDIProcessorInstance) {
    advancedMIDIProcessorInstance = new AdvancedMIDIProcessor();
  }
  return advancedMIDIProcessorInstance;
}

/**
 * Reset the global AdvancedMIDIProcessor instance
 */
export function resetAdvancedMIDIProcessor(): void {
  if (advancedMIDIProcessorInstance) {
    advancedMIDIProcessorInstance.panic();
  }
  advancedMIDIProcessorInstance = null;
}
