import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MIDINote,
  MIDIEvent,
  MIDIControlChange,
  MIDIMapping,
  MIDIDevice,
  MIDIRouting,
  MPEConfiguration,
  PianoRollSettings,
  MIDIClip,
  MIDILearnState,
  DEFAULT_MPE_CONFIG,
  DEFAULT_PIANO_ROLL_SETTINGS,
  quantizeTime,
} from '@shared/midiTypes';
import { nanoid } from 'nanoid';

interface MIDIState {
  // MIDI Devices
  devices: MIDIDevice[];
  selectedInputDevice: string | null;
  selectedOutputDevice: string | null;

  // MIDI Events & Notes
  currentClip: MIDIClip | null;
  clips: MIDIClip[];
  recordedNotes: MIDINote[];
  isRecording: boolean;
  isPlaying: boolean;
  playbackPosition: number; // in ticks

  // MIDI Mappings
  mappings: MIDIMapping[];
  learnState: MIDILearnState;

  // MIDI Routing
  routings: MIDIRouting[];

  // MPE Configuration
  mpeConfig: MPEConfiguration;

  // Piano Roll Settings
  pianoRollSettings: PianoRollSettings;

  // Recent MIDI events for monitoring
  recentEvents: MIDIEvent[];
  maxRecentEvents: number;

  // Web MIDI API access
  midiAccess: any | null;

  // Actions - Device Management
  refreshDevices: () => Promise<void>;
  setSelectedInputDevice: (deviceId: string | null) => void;
  setSelectedOutputDevice: (deviceId: string | null) => void;

  // Actions - Recording & Playback
  startRecording: () => void;
  stopRecording: () => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  setPlaybackPosition: (position: number) => void;

  // Actions - Note Management
  addNote: (note: Omit<MIDINote, 'id'>) => MIDINote;
  updateNote: (id: string, updates: Partial<MIDINote>) => void;
  deleteNote: (id: string) => void;
  deleteSelectedNotes: (ids: string[]) => void;
  quantizeNotes: (noteIds: string[]) => void;
  transposeNotes: (noteIds: string[], semitones: number) => void;

  // Actions - Clip Management
  createClip: (name: string) => MIDIClip;
  loadClip: (clip: MIDIClip) => void;
  saveCurrentClip: (name: string) => void;
  deleteClip: (id: string) => void;
  duplicateClip: (id: string) => MIDIClip;

  // Actions - MIDI Learn
  startMIDILearn: (parameterId: string) => void;
  stopMIDILearn: () => void;
  createMapping: (mapping: Omit<MIDIMapping, 'id'>) => MIDIMapping;
  updateMapping: (id: string, updates: Partial<MIDIMapping>) => void;
  deleteMapping: (id: string) => void;

  // Actions - MIDI Routing
  createRouting: (routing: Omit<MIDIRouting, 'id'>) => MIDIRouting;
  updateRouting: (id: string, updates: Partial<MIDIRouting>) => void;
  deleteRouting: (id: string) => void;
  toggleRouting: (id: string) => void;

  // Actions - MPE
  updateMPEConfig: (config: Partial<MPEConfiguration>) => void;
  toggleMPE: () => void;

  // Actions - Piano Roll Settings
  updatePianoRollSettings: (settings: Partial<PianoRollSettings>) => void;

  // Actions - MIDI Events
  handleMIDIEvent: (event: MIDIEvent) => void;
  clearRecentEvents: () => void;

  // Actions - Import/Export
  exportClip: (clipId: string) => string;
  importClip: (data: string) => MIDIClip;
  exportMIDIFile: (clipId: string) => Blob;
  importMIDIFile: (file: File) => Promise<MIDIClip>;

  // Utilities
  sendNoteOn: (note: number, velocity: number, channel: number) => void;
  sendNoteOff: (note: number, channel: number) => void;
  sendCC: (cc: number, value: number, channel: number) => void;
  sendPitchBend: (value: number, channel: number) => void;
}

export const useMIDIStore = create<MIDIState>()(
  persist(
    (set, get) => ({
      devices: [],
      selectedInputDevice: null,
      selectedOutputDevice: null,
      currentClip: null,
      clips: [],
      recordedNotes: [],
      isRecording: false,
      isPlaying: false,
      playbackPosition: 0,
      mappings: [],
      learnState: {
        isLearning: false,
        targetParameterId: null,
        lastLearnedCC: null,
        lastLearnedChannel: null,
      },
      routings: [],
      mpeConfig: DEFAULT_MPE_CONFIG,
      pianoRollSettings: DEFAULT_PIANO_ROLL_SETTINGS,
      recentEvents: [],
      maxRecentEvents: 100,
      midiAccess: null,

      refreshDevices: async () => {
        try {
          const midiAccess = await (navigator as any).requestMIDIAccess({ sysex: true });
          const devices: MIDIDevice[] = [];

          // Input devices
          midiAccess.inputs.forEach((input: any) => {
            devices.push({
              id: input.id,
              name: input.name || 'Unknown Input',
              manufacturer: input.manufacturer || 'Unknown',
              type: 'input',
              state: input.state === 'connected' ? 'connected' : 'disconnected',
            });

            // Set up MIDI input handler
            input.onmidimessage = (event: any) => {
              get().handleMIDIEvent(parseMIDIMessage(event.data));
            };
          });

          // Output devices
          midiAccess.outputs.forEach((output: any) => {
            devices.push({
              id: output.id,
              name: output.name || 'Unknown Output',
              manufacturer: output.manufacturer || 'Unknown',
              type: 'output',
              state: output.state === 'connected' ? 'connected' : 'disconnected',
            });
          });

          set({ devices, midiAccess });
        } catch (error) {
          console.error('Failed to access MIDI devices:', error);
        }
      },

      setSelectedInputDevice: (deviceId) => set({ selectedInputDevice: deviceId }),
      setSelectedOutputDevice: (deviceId) => set({ selectedOutputDevice: deviceId }),

      startRecording: () => {
        set({
          isRecording: true,
          recordedNotes: [],
          playbackPosition: 0,
        });
      },

      stopRecording: () => {
        const { recordedNotes, currentClip } = get();

        set({ isRecording: false });

        if (currentClip && recordedNotes.length > 0) {
          set({
            currentClip: {
              ...currentClip,
              notes: [...currentClip.notes, ...recordedNotes],
            },
          });
        }
      },

      startPlayback: () => set({ isPlaying: true }),
      stopPlayback: () => set({ isPlaying: false, playbackPosition: 0 }),
      setPlaybackPosition: (position) => set({ playbackPosition: position }),

      addNote: (noteData) => {
        const note: MIDINote = {
          ...noteData,
          id: nanoid(),
        };

        const { currentClip, isRecording } = get();

        if (isRecording) {
          set((state) => ({
            recordedNotes: [...state.recordedNotes, note],
          }));
        } else if (currentClip) {
          set({
            currentClip: {
              ...currentClip,
              notes: [...currentClip.notes, note],
            },
          });
        }

        return note;
      },

      updateNote: (id, updates) => {
        const { currentClip } = get();
        if (!currentClip) return;

        set({
          currentClip: {
            ...currentClip,
            notes: currentClip.notes.map((note) =>
              note.id === id ? { ...note, ...updates } : note
            ),
          },
        });
      },

      deleteNote: (id) => {
        const { currentClip } = get();
        if (!currentClip) return;

        set({
          currentClip: {
            ...currentClip,
            notes: currentClip.notes.filter((note) => note.id !== id),
          },
        });
      },

      deleteSelectedNotes: (ids) => {
        const { currentClip } = get();
        if (!currentClip) return;

        set({
          currentClip: {
            ...currentClip,
            notes: currentClip.notes.filter((note) => !ids.includes(note.id)),
          },
        });
      },

      quantizeNotes: (noteIds) => {
        const { currentClip, pianoRollSettings } = get();
        if (!currentClip) return;

        set({
          currentClip: {
            ...currentClip,
            notes: currentClip.notes.map((note) =>
              noteIds.includes(note.id)
                ? {
                    ...note,
                    startTime: quantizeTime(note.startTime, pianoRollSettings.gridResolution),
                    duration: quantizeTime(note.duration, pianoRollSettings.gridResolution),
                  }
                : note
            ),
          },
        });
      },

      transposeNotes: (noteIds, semitones) => {
        const { currentClip } = get();
        if (!currentClip) return;

        set({
          currentClip: {
            ...currentClip,
            notes: currentClip.notes.map((note) =>
              noteIds.includes(note.id)
                ? {
                    ...note,
                    note: Math.max(0, Math.min(127, note.note + semitones)),
                  }
                : note
            ),
          },
        });
      },

      createClip: (name) => {
        const { pianoRollSettings } = get();
        const clip: MIDIClip = {
          id: nanoid(),
          name,
          notes: [],
          controlChanges: [],
          startTime: 0,
          duration: pianoRollSettings.ppq * 16, // 4 bars at default
          loopEnabled: false,
          loopStart: 0,
          loopEnd: pianoRollSettings.ppq * 16,
        };

        set((state) => ({
          clips: [...state.clips, clip],
          currentClip: clip,
        }));

        return clip;
      },

      loadClip: (clip) => set({ currentClip: clip }),

      saveCurrentClip: (name) => {
        const { currentClip } = get();
        if (!currentClip) return;

        const savedClip = { ...currentClip, name };

        set((state) => ({
          clips: state.clips.some((c) => c.id === savedClip.id)
            ? state.clips.map((c) => (c.id === savedClip.id ? savedClip : c))
            : [...state.clips, savedClip],
          currentClip: savedClip,
        }));
      },

      deleteClip: (id) => {
        set((state) => ({
          clips: state.clips.filter((c) => c.id !== id),
          currentClip: state.currentClip?.id === id ? null : state.currentClip,
        }));
      },

      duplicateClip: (id) => {
        const clip = get().clips.find((c) => c.id === id);
        if (!clip) throw new Error('Clip not found');

        const duplicate: MIDIClip = {
          ...clip,
          id: nanoid(),
          name: `${clip.name} (Copy)`,
          notes: clip.notes.map((n) => ({ ...n, id: nanoid() })),
        };

        set((state) => ({
          clips: [...state.clips, duplicate],
        }));

        return duplicate;
      },

      startMIDILearn: (parameterId) => {
        set({
          learnState: {
            isLearning: true,
            targetParameterId: parameterId,
            lastLearnedCC: null,
            lastLearnedChannel: null,
          },
        });
      },

      stopMIDILearn: () => {
        set({
          learnState: {
            isLearning: false,
            targetParameterId: null,
            lastLearnedCC: null,
            lastLearnedChannel: null,
          },
        });
      },

      createMapping: (mappingData) => {
        const mapping: MIDIMapping = {
          ...mappingData,
          id: nanoid(),
        };

        set((state) => ({
          mappings: [...state.mappings, mapping],
        }));

        return mapping;
      },

      updateMapping: (id, updates) => {
        set((state) => ({
          mappings: state.mappings.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
      },

      deleteMapping: (id) => {
        set((state) => ({
          mappings: state.mappings.filter((m) => m.id !== id),
        }));
      },

      createRouting: (routingData) => {
        const routing: MIDIRouting = {
          ...routingData,
          id: nanoid(),
        };

        set((state) => ({
          routings: [...state.routings, routing],
        }));

        return routing;
      },

      updateRouting: (id, updates) => {
        set((state) => ({
          routings: state.routings.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        }));
      },

      deleteRouting: (id) => {
        set((state) => ({
          routings: state.routings.filter((r) => r.id !== id),
        }));
      },

      toggleRouting: (id) => {
        set((state) => ({
          routings: state.routings.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
          ),
        }));
      },

      updateMPEConfig: (config) => {
        set((state) => ({
          mpeConfig: { ...state.mpeConfig, ...config },
        }));
      },

      toggleMPE: () => {
        set((state) => ({
          mpeConfig: { ...state.mpeConfig, enabled: !state.mpeConfig.enabled },
        }));
      },

      updatePianoRollSettings: (settings) => {
        set((state) => ({
          pianoRollSettings: { ...state.pianoRollSettings, ...settings },
        }));
      },

      handleMIDIEvent: (event) => {
        const { learnState, mappings, mpeConfig, maxRecentEvents } = get();

        // Add to recent events
        set((state) => ({
          recentEvents: [event, ...state.recentEvents].slice(0, maxRecentEvents),
        }));

        // MIDI Learn
        if (learnState.isLearning && event.type === 'cc' && event.data1 !== undefined) {
          set({
            learnState: {
              ...learnState,
              lastLearnedCC: event.data1,
              lastLearnedChannel: event.channel,
            },
          });
        }

        // Process MIDI mappings
        if (event.type === 'cc' && event.data1 !== undefined && event.data2 !== undefined) {
          mappings.forEach((mapping) => {
            if (mapping.midiCC === event.data1 && mapping.midiChannel === event.channel) {
              const normalizedValue = event.data2 / 127;
              const mappedValue = mapping.min + normalizedValue * (mapping.max - mapping.min);

              // Here you would actually update the parameter
              // This would connect to your DSP parameter system
              console.log(`MIDI CC ${event.data1} -> ${mapping.parameterName}: ${mappedValue}`);
            }
          });
        }

        // MPE handling
        if (mpeConfig.enabled && event.type === 'pitchBend') {
          // Handle per-note pitch bend for MPE
          console.log(`MPE Pitch Bend on channel ${event.channel}`);
        }
      },

      clearRecentEvents: () => set({ recentEvents: [] }),

      exportClip: (clipId) => {
        const clip = get().clips.find((c) => c.id === clipId);
        if (!clip) throw new Error('Clip not found');
        return JSON.stringify(clip, null, 2);
      },

      importClip: (data) => {
        const clip: MIDIClip = JSON.parse(data);
        clip.id = nanoid();
        clip.notes = clip.notes.map((n) => ({ ...n, id: nanoid() }));

        set((state) => ({
          clips: [...state.clips, clip],
        }));

        return clip;
      },

      exportMIDIFile: (clipId) => {
        const clip = get().clips.find((c) => c.id === clipId);
        if (!clip) throw new Error('Clip not found');

        // Simplified MIDI file export (would need full MIDI file spec implementation)
        const data = JSON.stringify(clip);
        return new Blob([data], { type: 'audio/midi' });
      },

      importMIDIFile: async (file) => {
        // Simplified MIDI file import (would need full MIDI file parser)
        const text = await file.text();
        return get().importClip(text);
      },

      sendNoteOn: (note, velocity, channel) => {
        const { midiAccess, selectedOutputDevice } = get();
        if (!midiAccess || !selectedOutputDevice) return;

        const output = midiAccess.outputs.get(selectedOutputDevice);
        if (output) {
          output.send([0x90 + channel, note, velocity]);
        }
      },

      sendNoteOff: (note, channel) => {
        const { midiAccess, selectedOutputDevice } = get();
        if (!midiAccess || !selectedOutputDevice) return;

        const output = midiAccess.outputs.get(selectedOutputDevice);
        if (output) {
          output.send([0x80 + channel, note, 0]);
        }
      },

      sendCC: (cc, value, channel) => {
        const { midiAccess, selectedOutputDevice } = get();
        if (!midiAccess || !selectedOutputDevice) return;

        const output = midiAccess.outputs.get(selectedOutputDevice);
        if (output) {
          output.send([0xB0 + channel, cc, value]);
        }
      },

      sendPitchBend: (value, channel) => {
        const { midiAccess, selectedOutputDevice } = get();
        if (!midiAccess || !selectedOutputDevice) return;

        const output = midiAccess.outputs.get(selectedOutputDevice);
        if (output) {
          const lsb = value & 0x7F;
          const msb = (value >> 7) & 0x7F;
          output.send([0xE0 + channel, lsb, msb]);
        }
      },
    }),
    {
      name: 'midi-storage',
      partialize: (state) => ({
        clips: state.clips,
        mappings: state.mappings,
        routings: state.routings,
        mpeConfig: state.mpeConfig,
        pianoRollSettings: state.pianoRollSettings,
      }),
    }
  )
);

// Helper function to parse Web MIDI API messages
function parseMIDIMessage(data: Uint8Array): MIDIEvent {
  const status = data[0] & 0xF0;
  const channel = data[0] & 0x0F;

  const event: MIDIEvent = {
    type: 'noteOn',
    timestamp: Date.now(),
    channel,
  };

  switch (status) {
    case 0x90: // Note On
      event.type = data[2] > 0 ? 'noteOn' : 'noteOff';
      event.data1 = data[1]; // note number
      event.data2 = data[2]; // velocity
      break;
    case 0x80: // Note Off
      event.type = 'noteOff';
      event.data1 = data[1];
      event.data2 = data[2];
      break;
    case 0xB0: // Control Change
      event.type = 'cc';
      event.data1 = data[1]; // CC number
      event.data2 = data[2]; // CC value
      break;
    case 0xE0: // Pitch Bend
      event.type = 'pitchBend';
      event.data1 = data[1]; // LSB
      event.data2 = data[2]; // MSB
      break;
    case 0xD0: // Channel Aftertouch
      event.type = 'aftertouch';
      event.data1 = data[1];
      break;
    case 0xC0: // Program Change
      event.type = 'programChange';
      event.data1 = data[1];
      break;
    case 0xF0: // System Exclusive
      event.type = 'sysex';
      event.data = data;
      break;
  }

  return event;
}
