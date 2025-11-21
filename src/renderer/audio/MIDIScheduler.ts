/**
 * MIDI Scheduler
 *
 * Schedules MIDI note events for playback synchronized with the audio context timeline.
 */

import { MIDIClip, MIDINoteEvent, beatsToSeconds } from '@shared/dawTypes';

interface ScheduledNote {
  timeoutId: number;
  noteEvent: MIDINoteEvent;
}

export class MIDIScheduler {
  private context: AudioContext;
  private scheduledNotes: ScheduledNote[] = [];

  constructor(context: AudioContext) {
    this.context = context;
  }

  /**
   * Schedule all notes from a MIDI clip
   */
  scheduleClip(
    clip: MIDIClip,
    bpm: number,
    startTime: number,
    onNote: (note: MIDINoteEvent) => void
  ): void {
    for (const note of clip.notes) {
      // Calculate absolute time for this note
      const noteStartBeats = clip.startTime + note.start;
      const noteStartSeconds = beatsToSeconds(noteStartBeats, bpm);
      const absoluteTime = startTime + noteStartSeconds;

      // Only schedule notes in the future
      if (absoluteTime > this.context.currentTime) {
        const delay = (absoluteTime - this.context.currentTime) * 1000;

        const timeoutId = window.setTimeout(() => {
          onNote(note);
        }, delay);

        this.scheduledNotes.push({
          timeoutId,
          noteEvent: note,
        });
      } else {
        // Note should have already played, trigger immediately if very recent
        const lateness = this.context.currentTime - absoluteTime;
        if (lateness < 0.1) { // Less than 100ms late
          onNote(note);
        }
      }
    }
  }

  /**
   * Clear all scheduled notes
   */
  clear(): void {
    for (const scheduled of this.scheduledNotes) {
      window.clearTimeout(scheduled.timeoutId);
    }
    this.scheduledNotes = [];
  }
}
