import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  DAWProject,
  DAWTrack,
  MIDIClip,
  MIDINoteEvent,
  Transport,
  Timeline,
  createDAWProject,
  createTrack,
  createMIDIClip,
  createMIDINote,
  TrackType,
} from '@shared/dawTypes';

interface DAWState {
  // Current project
  project: DAWProject;

  // UI state
  selectedTrackId: string | null;
  selectedClipId: string | null;
  isDirty: boolean;

  // Track actions
  addTrack: (type: TrackType) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<DAWTrack>) => void;
  reorderTrack: (id: string, newOrder: number) => void;
  selectTrack: (id: string | null) => void;

  // Clip actions
  addClip: (trackId: string, startTime: number, duration?: number) => void;
  removeClip: (id: string) => void;
  updateClip: (id: string, updates: Partial<MIDIClip>) => void;
  selectClip: (id: string | null) => void;

  // Note actions (for piano roll)
  addNote: (clipId: string, pitch: number, start: number, duration?: number, velocity?: number) => void;
  removeNote: (clipId: string, noteId: string) => void;
  updateNote: (clipId: string, noteId: string, updates: Partial<MIDINoteEvent>) => void;

  // Transport actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  setPlaybackPosition: (beats: number) => void;
  updateTransport: (updates: Partial<Transport>) => void;

  // Timeline actions
  updateTimeline: (updates: Partial<Timeline>) => void;

  // Project actions
  newProject: (name?: string) => void;
  loadProject: (project: DAWProject) => void;
  saveProject: () => Promise<void>;
}

export const useDAWStore = create<DAWState>()(
  immer((set, get) => ({
    // Initial state
    project: createDAWProject(),
    selectedTrackId: null,
    selectedClipId: null,
    isDirty: false,

    // Track actions
    addTrack: (type) => set((state) => {
      const order = state.project.tracks.length;
      const newTrack = createTrack(type, order);
      state.project.tracks.push(newTrack);
      state.isDirty = true;
    }),

    removeTrack: (id) => set((state) => {
      // Can't remove master track
      const track = state.project.tracks.find(t => t.id === id);
      if (track?.type === 'master') return;

      // Remove track
      state.project.tracks = state.project.tracks.filter(t => t.id !== id);

      // Remove all clips on this track
      state.project.clips = state.project.clips.filter(c => c.trackId !== id);

      // Reorder remaining tracks
      state.project.tracks.forEach((t, index) => {
        t.order = index;
      });

      state.isDirty = true;
    }),

    updateTrack: (id, updates) => set((state) => {
      const index = state.project.tracks.findIndex(t => t.id === id);
      if (index !== -1) {
        Object.assign(state.project.tracks[index], updates);
        state.isDirty = true;
      }
    }),

    reorderTrack: (id, newOrder) => set((state) => {
      const track = state.project.tracks.find(t => t.id === id);
      if (!track || track.type === 'master') return;

      const oldOrder = track.order;
      const maxOrder = state.project.tracks.length - 1;
      const clampedOrder = Math.max(0, Math.min(newOrder, maxOrder));

      // Reorder tracks
      state.project.tracks.forEach(t => {
        if (t.id === id) {
          t.order = clampedOrder;
        } else if (oldOrder < clampedOrder && t.order > oldOrder && t.order <= clampedOrder) {
          t.order--;
        } else if (oldOrder > clampedOrder && t.order < oldOrder && t.order >= clampedOrder) {
          t.order++;
        }
      });

      // Sort by order
      state.project.tracks.sort((a, b) => a.order - b.order);
      state.isDirty = true;
    }),

    selectTrack: (id) => set((state) => {
      state.selectedTrackId = id;
    }),

    // Clip actions
    addClip: (trackId, startTime, duration) => set((state) => {
      const clip = createMIDIClip(trackId, startTime, duration);
      state.project.clips.push(clip);
      state.selectedClipId = clip.id;
      state.isDirty = true;
    }),

    removeClip: (id) => set((state) => {
      state.project.clips = state.project.clips.filter(c => c.id !== id);
      if (state.selectedClipId === id) {
        state.selectedClipId = null;
      }
      state.isDirty = true;
    }),

    updateClip: (id, updates) => set((state) => {
      const index = state.project.clips.findIndex(c => c.id === id);
      if (index !== -1) {
        Object.assign(state.project.clips[index], updates);
        state.isDirty = true;
      }
    }),

    selectClip: (id) => set((state) => {
      state.selectedClipId = id;
    }),

    // Note actions
    addNote: (clipId, pitch, start, duration, velocity) => set((state) => {
      const clip = state.project.clips.find(c => c.id === clipId);
      if (clip) {
        const note = createMIDINote(pitch, start, duration, velocity);
        clip.notes.push(note);
        state.isDirty = true;
      }
    }),

    removeNote: (clipId, noteId) => set((state) => {
      const clip = state.project.clips.find(c => c.id === clipId);
      if (clip) {
        clip.notes = clip.notes.filter(n => n.id !== noteId);
        state.isDirty = true;
      }
    }),

    updateNote: (clipId, noteId, updates) => set((state) => {
      const clip = state.project.clips.find(c => c.id === clipId);
      if (clip) {
        const note = clip.notes.find(n => n.id === noteId);
        if (note) {
          Object.assign(note, updates);
          state.isDirty = true;
        }
      }
    }),

    // Transport actions
    play: () => set((state) => {
      state.project.transport.isPlaying = true;
    }),

    pause: () => set((state) => {
      state.project.transport.isPlaying = false;
    }),

    stop: () => set((state) => {
      state.project.transport.isPlaying = false;
      state.project.transport.currentTime = 0;
    }),

    setPlaybackPosition: (beats) => set((state) => {
      state.project.transport.currentTime = beats;
    }),

    updateTransport: (updates) => set((state) => {
      Object.assign(state.project.transport, updates);
      state.isDirty = true;
    }),

    // Timeline actions
    updateTimeline: (updates) => set((state) => {
      Object.assign(state.project.timeline, updates);
    }),

    // Project actions
    newProject: (name) => set((state) => {
      state.project = createDAWProject(name);
      state.selectedTrackId = null;
      state.selectedClipId = null;
      state.isDirty = false;
    }),

    loadProject: (project) => set((state) => {
      state.project = project;
      state.selectedTrackId = null;
      state.selectedClipId = null;
      state.isDirty = false;
    }),

    saveProject: async () => {
      const { project } = get();
      // Update modified timestamp
      set((state) => {
        state.project.modified = Date.now();
        state.isDirty = false;
      });

      // Save to file system (implementation depends on your file handling)
      // For now, we'll just save to localStorage as a fallback
      try {
        const json = JSON.stringify(get().project);
        localStorage.setItem(`daw-project-${project.id}`, json);
        console.log('DAW project saved:', project.name);
      } catch (error) {
        console.error('Failed to save DAW project:', error);
        throw error;
      }
    },
  }))
);
