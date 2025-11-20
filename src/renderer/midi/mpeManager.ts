/**
 * MPE (MIDI Polyphonic Expression) Manager
 *
 * Manages MPE voice allocation and per-note expression
 */

import {
  MPEConfiguration,
  MPENote,
  MPEVoice,
  DEFAULT_MPE_CONFIG,
  generateVoiceId,
} from '../../shared/midiAdvancedTypes';

export type MPENoteCallback = (note: MPENote, isNoteOn: boolean) => void;
export type MPEVoiceCallback = (voices: MPEVoice[]) => void;

export class MPEManager {
  private config: MPEConfiguration;
  private voices: Map<number, MPEVoice> = new Map(); // channel -> voice
  private activeNotes: Map<string, MPENote> = new Map(); // voiceId -> note
  private noteCallbacks: Set<MPENoteCallback> = new Set();
  private voiceCallbacks: Set<MPEVoiceCallback> = new Set();

  constructor(config: Partial<MPEConfiguration> = {}) {
    this.config = { ...DEFAULT_MPE_CONFIG, ...config };
    this.initializeVoices();
  }

  /**
   * Initialize voice pool
   */
  private initializeVoices(): void {
    this.voices.clear();
    this.config.memberChannels.forEach((channel) => {
      this.voices.set(channel, {
        id: generateVoiceId(),
        channel,
        currentNote: null,
        isActive: false,
      });
    });
  }

  /**
   * Update MPE configuration
   */
  setConfiguration(config: Partial<MPEConfiguration>): void {
    this.config = { ...this.config, ...config };
    this.initializeVoices();
    console.log('MPE configuration updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfiguration(): MPEConfiguration {
    return { ...this.config };
  }

  /**
   * Handle note on message
   */
  handleNoteOn(noteNumber: number, velocity: number, channel: number): void {
    if (!this.config.enabled) return;

    // Master channel messages are ignored for notes
    if (channel === this.config.masterChannel) return;

    // Find voice for this channel
    const voice = this.voices.get(channel);
    if (!voice) {
      console.warn(`No voice allocated for channel ${channel}`);
      return;
    }

    // Create MPE note
    const note: MPENote = {
      noteNumber,
      velocity,
      channel,
      voiceId: voice.id,
      timestamp: Date.now(),
      pitchBend: 0,
      pressure: 0,
      timbre: 0,
      slide: 0,
    };

    // Update voice
    voice.currentNote = note;
    voice.isActive = true;

    // Store active note
    this.activeNotes.set(voice.id, note);

    // Notify listeners
    this.notifyNoteCallbacks(note, true);
    this.notifyVoiceCallbacks();

    console.log(`MPE Note On: ${noteNumber} on channel ${channel}, voice ${voice.id}`);
  }

  /**
   * Handle note off message
   */
  handleNoteOff(noteNumber: number, channel: number): void {
    if (!this.config.enabled) return;

    const voice = this.voices.get(channel);
    if (!voice || !voice.currentNote) return;

    // Check if this is the correct note
    if (voice.currentNote.noteNumber !== noteNumber) {
      console.warn(
        `Note off mismatch: expected ${voice.currentNote.noteNumber}, got ${noteNumber}`
      );
      return;
    }

    // Get note before clearing
    const note = voice.currentNote;

    // Clear voice
    voice.currentNote = null;
    voice.isActive = false;

    // Remove from active notes
    this.activeNotes.delete(voice.id);

    // Notify listeners
    this.notifyNoteCallbacks(note, false);
    this.notifyVoiceCallbacks();

    console.log(`MPE Note Off: ${noteNumber} on channel ${channel}`);
  }

  /**
   * Handle pitch bend message
   */
  handlePitchBend(value: number, channel: number): void {
    if (!this.config.enabled) return;

    const voice = this.voices.get(channel);
    if (!voice || !voice.currentNote) return;

    // Convert MIDI pitch bend (0-16383) to normalized (-1 to 1)
    const normalized = (value - 8192) / 8192;

    // Update note
    voice.currentNote.pitchBend = normalized;

    // Update in active notes map
    this.activeNotes.set(voice.id, voice.currentNote);

    // Notify listeners
    this.notifyNoteCallbacks(voice.currentNote, true);
  }

  /**
   * Handle channel pressure (aftertouch) message
   */
  handleChannelPressure(value: number, channel: number): void {
    if (!this.config.enabled || !this.config.pressureEnabled) return;

    const voice = this.voices.get(channel);
    if (!voice || !voice.currentNote) return;

    // Normalize pressure (0-127 to 0-1)
    const normalized = value / 127;

    // Update note
    voice.currentNote.pressure = normalized;

    // Update in active notes map
    this.activeNotes.set(voice.id, voice.currentNote);

    // Notify listeners
    this.notifyNoteCallbacks(voice.currentNote, true);
  }

  /**
   * Handle CC74 (timbre) message
   */
  handleTimbre(value: number, channel: number): void {
    if (!this.config.enabled || !this.config.timbreEnabled) return;

    const voice = this.voices.get(channel);
    if (!voice || !voice.currentNote) return;

    // Normalize timbre (0-127 to 0-1)
    const normalized = value / 127;

    // Update note
    voice.currentNote.timbre = normalized;

    // Update in active notes map
    this.activeNotes.set(voice.id, voice.currentNote);

    // Notify listeners
    this.notifyNoteCallbacks(voice.currentNote, true);
  }

  /**
   * Handle slide (CC)
   */
  handleSlide(value: number, channel: number): void {
    if (!this.config.enabled || !this.config.slideToPitchEnabled) return;

    const voice = this.voices.get(channel);
    if (!voice || !voice.currentNote) return;

    // Normalize slide (0-127 to 0-1)
    const normalized = value / 127;

    // Update note
    voice.currentNote.slide = normalized;

    // Update in active notes map
    this.activeNotes.set(voice.id, voice.currentNote);

    // Notify listeners
    this.notifyNoteCallbacks(voice.currentNote, true);
  }

  /**
   * Get all active notes
   */
  getActiveNotes(): MPENote[] {
    return Array.from(this.activeNotes.values());
  }

  /**
   * Get all voices
   */
  getVoices(): MPEVoice[] {
    return Array.from(this.voices.values());
  }

  /**
   * Get voice by channel
   */
  getVoiceByChannel(channel: number): MPEVoice | undefined {
    return this.voices.get(channel);
  }

  /**
   * Subscribe to note events
   */
  onNote(callback: MPENoteCallback): () => void {
    this.noteCallbacks.add(callback);
    return () => {
      this.noteCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to voice changes
   */
  onVoiceChange(callback: MPEVoiceCallback): () => void {
    this.voiceCallbacks.add(callback);
    return () => {
      this.voiceCallbacks.delete(callback);
    };
  }

  /**
   * Notify note callbacks
   */
  private notifyNoteCallbacks(note: MPENote, isNoteOn: boolean): void {
    this.noteCallbacks.forEach((callback) => {
      try {
        callback(note, isNoteOn);
      } catch (error) {
        console.error('Error in MPE note callback:', error);
      }
    });
  }

  /**
   * Notify voice callbacks
   */
  private notifyVoiceCallbacks(): void {
    const voices = this.getVoices();
    this.voiceCallbacks.forEach((callback) => {
      try {
        callback(voices);
      } catch (error) {
        console.error('Error in MPE voice callback:', error);
      }
    });
  }

  /**
   * Clear all active notes (panic)
   */
  panic(): void {
    this.activeNotes.clear();
    this.voices.forEach((voice) => {
      if (voice.currentNote) {
        this.notifyNoteCallbacks(voice.currentNote, false);
      }
      voice.currentNote = null;
      voice.isActive = false;
    });
    this.notifyVoiceCallbacks();
    console.log('MPE panic: all notes cleared');
  }

  /**
   * Get pitch bend in semitones for a note
   */
  getPitchBendSemitones(note: MPENote): number {
    return note.pitchBend * this.config.pitchBendRange;
  }

  /**
   * Get pitch bend in frequency multiplier for a note
   */
  getPitchBendMultiplier(note: MPENote): number {
    const semitones = this.getPitchBendSemitones(note);
    return Math.pow(2, semitones / 12);
  }
}

// Singleton instance
let mpeManagerInstance: MPEManager | null = null;

/**
 * Get the global MPEManager instance
 */
export function getMPEManager(): MPEManager {
  if (!mpeManagerInstance) {
    mpeManagerInstance = new MPEManager();
  }
  return mpeManagerInstance;
}

/**
 * Reset the global MPEManager instance
 */
export function resetMPEManager(): void {
  mpeManagerInstance = null;
}
