/**
 * DAW Audio Engine
 *
 * Manages Web Audio API context and audio playback for the DAW.
 * Coordinates MIDI scheduling, plugin instantiation, and track mixing.
 */

import { DAWProject, beatsToSeconds } from '@shared/dawTypes';
import { PluginProject } from '@shared/types';
import { TrackAudioProcessor } from './TrackAudioProcessor';
import { MIDIScheduler } from './MIDIScheduler';

export class DAWAudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackProcessors: Map<string, TrackAudioProcessor> = new Map();
  private midiScheduler: MIDIScheduler | null = null;
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private animationFrameId: number | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the audio context
   */
  private async initialize(): Promise<void> {
    try {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.midiScheduler = new MIDIScheduler(this.audioContext);
    } catch (error) {
      console.error('Failed to initialize DAW audio engine:', error);
    }
  }

  /**
   * Get the audio context
   */
  getContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Resume audio context (required for user interaction)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Setup audio graph for a DAW project
   */
  async setupProject(
    project: DAWProject,
    pluginProjects: Map<string, PluginProject>
  ): Promise<void> {
    if (!this.audioContext || !this.masterGain) {
      console.error('Audio context not initialized');
      return;
    }

    // Clear existing track processors
    this.trackProcessors.forEach(processor => processor.destroy());
    this.trackProcessors.clear();

    // Create track processors for each track with a plugin
    for (const track of project.tracks) {
      if (track.pluginState && track.type === 'instrument') {
        const pluginProject = pluginProjects.get(track.pluginState.pluginProjectId);
        if (pluginProject) {
          const processor = new TrackAudioProcessor(
            this.audioContext,
            track,
            pluginProject
          );
          await processor.initialize();
          processor.connect(this.masterGain);
          this.trackProcessors.set(track.id, processor);
        }
      }
    }

    // Setup master track volume
    const masterTrack = project.tracks.find(t => t.type === 'master');
    if (masterTrack && this.masterGain) {
      this.masterGain.gain.value = masterTrack.volume;
    }
  }

  /**
   * Start playback
   */
  async play(
    project: DAWProject,
    currentTime: number,
    onTimeUpdate: (time: number) => void
  ): Promise<void> {
    if (!this.audioContext || !this.midiScheduler) return;

    await this.resume();

    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime - beatsToSeconds(currentTime, project.transport.bpm);

    // Schedule all MIDI events from non-muted tracks
    const clips = project.clips.filter(clip => {
      const track = project.tracks.find(t => t.id === clip.trackId);
      return track && !track.mute && track.pluginState;
    });

    for (const clip of clips) {
      const track = project.tracks.find(t => t.id === clip.trackId);
      if (!track) continue;

      const processor = this.trackProcessors.get(track.id);
      if (!processor) continue;

      this.midiScheduler.scheduleClip(
        clip,
        project.transport.bpm,
        this.startTime,
        (note) => processor.triggerNote(note.pitch, note.velocity / 127, note.duration)
      );
    }

    // Start playback monitoring
    this.monitorPlayback(project.transport.bpm, onTimeUpdate);
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.isPlaying = false;
    this.midiScheduler?.clear();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.isPlaying = false;
    this.startTime = 0;
    this.midiScheduler?.clear();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop all notes
    this.trackProcessors.forEach(processor => processor.stopAllNotes());
  }

  /**
   * Monitor playback position
   */
  private monitorPlayback(bpm: number, onTimeUpdate: (time: number) => void): void {
    if (!this.audioContext || !this.isPlaying) return;

    const currentTimeBeats = (this.audioContext.currentTime - this.startTime) * (bpm / 60);
    onTimeUpdate(currentTimeBeats);

    this.animationFrameId = requestAnimationFrame(() => this.monitorPlayback(bpm, onTimeUpdate));
  }

  /**
   * Update track volume
   */
  updateTrackVolume(trackId: string, volume: number): void {
    const processor = this.trackProcessors.get(trackId);
    if (processor) {
      processor.setVolume(volume);
    }
  }

  /**
   * Update track pan
   */
  updateTrackPan(trackId: string, pan: number): void {
    const processor = this.trackProcessors.get(trackId);
    if (processor) {
      processor.setPan(pan);
    }
  }

  /**
   * Update plugin parameter
   */
  updatePluginParameter(
    trackId: string,
    nodeId: string,
    parameterId: string,
    value: number
  ): void {
    const processor = this.trackProcessors.get(trackId);
    if (processor) {
      processor.updateParameter(nodeId, parameterId, value);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.trackProcessors.forEach(processor => processor.destroy());
    this.trackProcessors.clear();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
