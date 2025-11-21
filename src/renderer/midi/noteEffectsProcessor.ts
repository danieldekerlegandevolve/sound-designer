/**
 * Note Effects Processor
 *
 * Applies various effects to MIDI notes (humanize, quantize, transpose, velocity scaling)
 */

import {
  NoteEffects,
  DEFAULT_NOTE_EFFECTS,
  quantizeTime,
  applySwing,
  ArpeggiatorTimeBase,
} from '../../shared/midiAdvancedTypes';

export interface ProcessedNote {
  noteNumber: number;
  velocity: number;
  timestamp: number;
  duration?: number;
}

export class NoteEffectsProcessor {
  private effects: NoteEffects;
  private rng: () => number; // Seeded random number generator

  constructor(effects: Partial<NoteEffects> = {}) {
    this.effects = { ...DEFAULT_NOTE_EFFECTS, ...effects };
    this.rng = this.createSeededRNG(this.effects.humanize.seed);
  }

  /**
   * Create seeded random number generator
   */
  private createSeededRNG(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }

  /**
   * Update effects settings
   */
  setEffects(effects: Partial<NoteEffects>): void {
    this.effects = { ...this.effects, ...effects };

    // Update RNG if seed changed
    if (effects.humanize?.seed !== undefined) {
      this.rng = this.createSeededRNG(effects.humanize.seed);
    }
  }

  /**
   * Get current effects settings
   */
  getEffects(): NoteEffects {
    return { ...this.effects };
  }

  /**
   * Process a note through all enabled effects
   */
  processNote(
    noteNumber: number,
    velocity: number,
    timestamp: number,
    duration?: number
  ): ProcessedNote {
    let processed: ProcessedNote = {
      noteNumber,
      velocity,
      timestamp,
      duration,
    };

    // Apply transpose first (affects note number)
    if (this.effects.transpose.enabled) {
      processed = this.applyTranspose(processed);
    }

    // Apply quantize (affects timing)
    if (this.effects.quantize.enabled) {
      processed = this.applyQuantize(processed);
    }

    // Apply humanize (affects timing, velocity, duration)
    if (this.effects.humanize.enabled) {
      processed = this.applyHumanize(processed);
    }

    // Apply velocity scaling last (affects velocity)
    if (this.effects.velocityScale.enabled) {
      processed = this.applyVelocityScale(processed);
    }

    return processed;
  }

  /**
   * Apply transpose effect
   */
  private applyTranspose(note: ProcessedNote): ProcessedNote {
    const { semitones, octaves } = this.effects.transpose;

    let newNoteNumber = note.noteNumber + semitones + octaves * 12;

    // Clamp to valid MIDI range
    newNoteNumber = Math.max(0, Math.min(127, newNoteNumber));

    return {
      ...note,
      noteNumber: newNoteNumber,
    };
  }

  /**
   * Apply quantize effect
   */
  private applyQuantize(note: ProcessedNote): ProcessedNote {
    const { gridSize, strength, swing } = this.effects.quantize;

    // Default tempo for quantization
    const bpm = 120;

    // Quantize timestamp
    let quantizedTime = quantizeTime(note.timestamp / 1000, gridSize, bpm, strength);

    // Apply swing
    if (swing > 0) {
      quantizedTime = applySwing(quantizedTime, gridSize, bpm, swing);
    }

    return {
      ...note,
      timestamp: quantizedTime * 1000,
    };
  }

  /**
   * Apply humanize effect
   */
  private applyHumanize(note: ProcessedNote): ProcessedNote {
    const { timingAmount, velocityAmount, durationAmount } = this.effects.humanize;

    let newTimestamp = note.timestamp;
    let newVelocity = note.velocity;
    let newDuration = note.duration;

    // Humanize timing (add random offset in milliseconds)
    if (timingAmount > 0) {
      const maxOffset = timingAmount * 20; // Max 20ms per amount unit
      const offset = (this.rng() - 0.5) * 2 * maxOffset;
      newTimestamp += offset;
    }

    // Humanize velocity
    if (velocityAmount > 0) {
      const maxVelOffset = velocityAmount * 20; // Max ±20 velocity per amount unit
      const offset = (this.rng() - 0.5) * 2 * maxVelOffset;
      newVelocity = Math.max(1, Math.min(127, Math.round(newVelocity + offset)));
    }

    // Humanize duration
    if (durationAmount > 0 && newDuration !== undefined) {
      const maxDurOffset = durationAmount * 0.2; // Max ±20% per amount unit
      const offset = (this.rng() - 0.5) * 2 * maxDurOffset;
      newDuration = Math.max(0.01, newDuration * (1 + offset));
    }

    return {
      ...note,
      timestamp: newTimestamp,
      velocity: newVelocity,
      duration: newDuration,
    };
  }

  /**
   * Apply velocity scaling effect
   */
  private applyVelocityScale(note: ProcessedNote): ProcessedNote {
    const { minVelocity, maxVelocity, curve, randomAmount } = this.effects.velocityScale;

    // Normalize input velocity (0-127 to 0-1)
    let normalized = note.velocity / 127;

    // Apply curve
    switch (curve) {
      case 'exponential':
        normalized = Math.pow(normalized, 2);
        break;
      case 'logarithmic':
        normalized = Math.sqrt(normalized);
        break;
      case 'linear':
      default:
        // No change
        break;
    }

    // Scale to target range
    let scaledVelocity = minVelocity + normalized * (maxVelocity - minVelocity);

    // Add randomness
    if (randomAmount > 0) {
      const maxRandom = randomAmount * 20;
      const randomOffset = (this.rng() - 0.5) * 2 * maxRandom;
      scaledVelocity += randomOffset;
    }

    // Clamp to valid range
    scaledVelocity = Math.max(1, Math.min(127, Math.round(scaledVelocity)));

    return {
      ...note,
      velocity: scaledVelocity,
    };
  }

  /**
   * Process multiple notes
   */
  processNotes(notes: ProcessedNote[]): ProcessedNote[] {
    return notes.map((note) =>
      this.processNote(note.noteNumber, note.velocity, note.timestamp, note.duration)
    );
  }

  /**
   * Reset humanize seed (for new random sequence)
   */
  resetHumanizeSeed(): void {
    this.effects.humanize.seed = Math.random();
    this.rng = this.createSeededRNG(this.effects.humanize.seed);
  }
}

// Singleton instance
let noteEffectsProcessorInstance: NoteEffectsProcessor | null = null;

/**
 * Get the global NoteEffectsProcessor instance
 */
export function getNoteEffectsProcessor(): NoteEffectsProcessor {
  if (!noteEffectsProcessorInstance) {
    noteEffectsProcessorInstance = new NoteEffectsProcessor();
  }
  return noteEffectsProcessorInstance;
}

/**
 * Reset the global NoteEffectsProcessor instance
 */
export function resetNoteEffectsProcessor(): void {
  noteEffectsProcessorInstance = null;
}
