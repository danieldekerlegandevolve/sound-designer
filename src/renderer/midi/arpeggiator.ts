/**
 * Arpeggiator Engine
 *
 * Generates arpeggiated note patterns from held notes
 */

import {
  ArpeggiatorMode,
  ArpeggiatorTimeBase,
  ArpeggiatorState,
  ArpeggiatorPattern,
  DEFAULT_ARPEGGIATOR_PATTERN,
  applySwing,
} from '../../shared/midiAdvancedTypes';

export interface ArpeggiatorNote {
  noteNumber: number;
  velocity: number;
  duration: number; // In seconds
  timestamp: number;
}

export type ArpeggiatorNoteCallback = (note: ArpeggiatorNote, isNoteOn: boolean) => void;

export class Arpeggiator {
  private state: ArpeggiatorState;
  private timerHandle: number | null = null;
  private lastStepTime: number = 0;
  private noteCallbacks: Set<ArpeggiatorNoteCallback> = new Set();
  private currentlyPlayingNote: ArpeggiatorNote | null = null;

  constructor(tempo: number = 120) {
    this.state = {
      enabled: false,
      mode: ArpeggiatorMode.UP,
      timeBase: ArpeggiatorTimeBase.SIXTEENTH,
      octaveRange: 1,
      pattern: DEFAULT_ARPEGGIATOR_PATTERN,
      swing: 0,
      gateLength: 0.8,
      heldNotes: [],
      currentStep: 0,
      currentOctave: 0,
      isPlaying: false,
      tempo,
      syncToHost: false,
    };
  }

  /**
   * Enable/disable arpeggiator
   */
  setEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  /**
   * Set arpeggiator mode
   */
  setMode(mode: ArpeggiatorMode): void {
    this.state.mode = mode;
    this.state.currentStep = 0;
  }

  /**
   * Set time base
   */
  setTimeBase(timeBase: ArpeggiatorTimeBase): void {
    this.state.timeBase = timeBase;
  }

  /**
   * Set octave range
   */
  setOctaveRange(range: number): void {
    this.state.octaveRange = Math.max(1, Math.min(4, range));
    this.state.currentStep = 0;
  }

  /**
   * Set pattern
   */
  setPattern(pattern: ArpeggiatorPattern): void {
    this.state.pattern = pattern;
    this.state.currentStep = 0;
  }

  /**
   * Set swing amount
   */
  setSwing(swing: number): void {
    this.state.swing = Math.max(0, Math.min(1, swing));
  }

  /**
   * Set gate length
   */
  setGateLength(length: number): void {
    this.state.gateLength = Math.max(0, Math.min(1, length));
  }

  /**
   * Set tempo
   */
  setTempo(tempo: number): void {
    this.state.tempo = Math.max(20, Math.min(300, tempo));
    if (this.state.isPlaying) {
      // Restart with new tempo
      this.stop();
      this.start();
    }
  }

  /**
   * Handle note on (add to held notes)
   */
  handleNoteOn(noteNumber: number, velocity: number): void {
    if (!this.state.heldNotes.includes(noteNumber)) {
      this.state.heldNotes.push(noteNumber);
      this.state.heldNotes.sort((a, b) => a - b); // Keep sorted

      // Reset pattern if this is the first note
      if (this.state.heldNotes.length === 1) {
        this.state.currentStep = 0;
        this.state.currentOctave = 0;
      }

      // Start arpeggiator if enabled and not playing
      if (this.state.enabled && !this.state.isPlaying) {
        this.start();
      }
    }
  }

  /**
   * Handle note off (remove from held notes)
   */
  handleNoteOff(noteNumber: number): void {
    const index = this.state.heldNotes.indexOf(noteNumber);
    if (index !== -1) {
      this.state.heldNotes.splice(index, 1);

      // Stop arpeggiator if no notes are held
      if (this.state.heldNotes.length === 0) {
        this.stop();
      }
    }
  }

  /**
   * Start arpeggiator
   */
  start(): void {
    if (this.state.isPlaying || this.state.heldNotes.length === 0) return;

    this.state.isPlaying = true;
    this.state.currentStep = 0;
    this.state.currentOctave = 0;
    this.lastStepTime = performance.now();

    this.scheduleNextStep();
    console.log('Arpeggiator started');
  }

  /**
   * Stop arpeggiator
   */
  stop(): void {
    if (!this.state.isPlaying) return;

    this.state.isPlaying = false;

    if (this.timerHandle !== null) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }

    // Send note off for currently playing note
    if (this.currentlyPlayingNote) {
      this.notifyNoteCallbacks(this.currentlyPlayingNote, false);
      this.currentlyPlayingNote = null;
    }

    console.log('Arpeggiator stopped');
  }

  /**
   * Schedule next arpeggiator step
   */
  private scheduleNextStep(): void {
    if (!this.state.isPlaying || this.state.heldNotes.length === 0) return;

    const stepDuration = this.getStepDuration();
    const now = performance.now();
    const timeSinceLastStep = now - this.lastStepTime;
    const nextStepDelay = Math.max(0, stepDuration - timeSinceLastStep);

    this.timerHandle = window.setTimeout(() => {
      this.playStep();
      this.lastStepTime = performance.now();
      this.scheduleNextStep();
    }, nextStepDelay);
  }

  /**
   * Play current arpeggiator step
   */
  private playStep(): void {
    if (this.state.heldNotes.length === 0) return;

    // Get current pattern step
    const patternStep = this.state.pattern.steps[this.state.currentStep % this.state.pattern.steps.length];

    if (!patternStep.enabled) {
      this.advanceStep();
      return;
    }

    // Stop previous note
    if (this.currentlyPlayingNote) {
      this.notifyNoteCallbacks(this.currentlyPlayingNote, false);
    }

    // Get note sequence based on mode
    const noteSequence = this.getNoteSequence();

    // Get current note from sequence
    const sequenceIndex = this.state.currentStep % noteSequence.length;
    let noteNumber = noteSequence[sequenceIndex];

    // Apply octave offset from pattern
    noteNumber += patternStep.octaveOffset * 12;

    // Apply octave range
    noteNumber += this.state.currentOctave * 12;

    // Clamp to MIDI range
    noteNumber = Math.max(0, Math.min(127, noteNumber));

    // Calculate velocity
    const baseVelocity = 100;
    const velocity = Math.round(baseVelocity * patternStep.velocityScale);

    // Calculate note duration
    const stepDuration = this.getStepDuration();
    const duration = stepDuration * patternStep.gateLength * this.state.gateLength;

    // Create note
    const note: ArpeggiatorNote = {
      noteNumber,
      velocity: Math.max(1, Math.min(127, velocity)),
      duration: duration / 1000, // Convert to seconds
      timestamp: Date.now(),
    };

    // Play note
    this.currentlyPlayingNote = note;
    this.notifyNoteCallbacks(note, true);

    // Schedule note off
    setTimeout(() => {
      if (this.currentlyPlayingNote === note) {
        this.notifyNoteCallbacks(note, false);
        this.currentlyPlayingNote = null;
      }
    }, duration);

    // Advance step
    this.advanceStep();
  }

  /**
   * Advance to next step
   */
  private advanceStep(): void {
    this.state.currentStep++;

    // Handle octave range
    const totalSteps = this.state.heldNotes.length * this.state.octaveRange;
    if (this.state.currentStep >= totalSteps) {
      this.state.currentStep = 0;
      this.state.currentOctave = 0;
    } else if (this.state.currentStep % this.state.heldNotes.length === 0) {
      this.state.currentOctave++;
      if (this.state.currentOctave >= this.state.octaveRange) {
        this.state.currentOctave = 0;
      }
    }
  }

  /**
   * Get note sequence based on mode
   */
  private getNoteSequence(): number[] {
    const notes = [...this.state.heldNotes];

    switch (this.state.mode) {
      case ArpeggiatorMode.UP:
        return notes;

      case ArpeggiatorMode.DOWN:
        return notes.reverse();

      case ArpeggiatorMode.UP_DOWN:
        return [...notes, ...notes.slice(1, -1).reverse()];

      case ArpeggiatorMode.DOWN_UP:
        return [...notes.reverse(), ...notes.slice(1, -1)];

      case ArpeggiatorMode.RANDOM:
        return notes.sort(() => Math.random() - 0.5);

      case ArpeggiatorMode.PLAYED:
        return notes; // Already in played order

      case ArpeggiatorMode.CHORD:
        // Play all notes simultaneously
        return notes;

      default:
        return notes;
    }
  }

  /**
   * Get step duration in milliseconds
   */
  private getStepDuration(): number {
    const beatDuration = 60000 / this.state.tempo; // In milliseconds

    switch (this.state.timeBase) {
      case ArpeggiatorTimeBase.SIXTEENTH:
        return beatDuration / 4;
      case ArpeggiatorTimeBase.EIGHTH:
        return beatDuration / 2;
      case ArpeggiatorTimeBase.EIGHTH_TRIPLET:
        return beatDuration / 3;
      case ArpeggiatorTimeBase.QUARTER:
        return beatDuration;
      case ArpeggiatorTimeBase.QUARTER_TRIPLET:
        return (beatDuration * 2) / 3;
      case ArpeggiatorTimeBase.HALF:
        return beatDuration * 2;
      default:
        return beatDuration / 4;
    }
  }

  /**
   * Subscribe to note events
   */
  onNote(callback: ArpeggiatorNoteCallback): () => void {
    this.noteCallbacks.add(callback);
    return () => {
      this.noteCallbacks.delete(callback);
    };
  }

  /**
   * Notify note callbacks
   */
  private notifyNoteCallbacks(note: ArpeggiatorNote, isNoteOn: boolean): void {
    this.noteCallbacks.forEach((callback) => {
      try {
        callback(note, isNoteOn);
      } catch (error) {
        console.error('Error in arpeggiator note callback:', error);
      }
    });
  }

  /**
   * Get current state
   */
  getState(): ArpeggiatorState {
    return { ...this.state };
  }

  /**
   * Clear all held notes
   */
  clearHeldNotes(): void {
    this.state.heldNotes = [];
    this.stop();
  }

  /**
   * Panic (stop and clear everything)
   */
  panic(): void {
    this.stop();
    this.clearHeldNotes();
    if (this.currentlyPlayingNote) {
      this.notifyNoteCallbacks(this.currentlyPlayingNote, false);
      this.currentlyPlayingNote = null;
    }
  }
}

// Singleton instance
let arpeggiatorInstance: Arpeggiator | null = null;

/**
 * Get the global Arpeggiator instance
 */
export function getArpeggiator(): Arpeggiator {
  if (!arpeggiatorInstance) {
    arpeggiatorInstance = new Arpeggiator();
  }
  return arpeggiatorInstance;
}

/**
 * Reset the global Arpeggiator instance
 */
export function resetArpeggiator(): void {
  if (arpeggiatorInstance) {
    arpeggiatorInstance.panic();
  }
  arpeggiatorInstance = null;
}
