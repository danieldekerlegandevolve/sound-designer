import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Sample,
  SampleCategory,
  SampleLoop,
  SampleMarker,
  SampleSearchCriteria,
  loadAudioFile,
  calculatePeaks,
  calculateRMS,
  calculatePeakLevel,
  normalizeAudioBuffer,
  reverseAudioBuffer,
  trimAudioBuffer,
  applyFade,
  audioBufferToWav,
} from '@shared/sampleTypes';
import { nanoid } from 'nanoid';

interface SampleState {
  samples: Sample[];
  currentSample: Sample | null;
  selectedSamples: Set<string>;

  // Search & Filter
  searchQuery: string;
  selectedCategory: SampleCategory | null;
  showFavoritesOnly: boolean;

  // Editor state
  zoom: number;
  selection: { start: number; end: number } | null;
  playbackPosition: number;
  isPlaying: boolean;

  // History for undo/redo
  history: Array<{ sampleId: string; audioBuffer: AudioBuffer }>;
  historyIndex: number;

  // Actions - Sample Management
  addSample: (file: File) => Promise<Sample>;
  deleteSample: (id: string) => void;
  updateSample: (id: string, updates: Partial<Sample>) => void;
  setCurrentSample: (sample: Sample | null) => void;
  toggleFavorite: (id: string) => void;

  // Actions - Search
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: SampleCategory | null) => void;
  toggleFavoritesOnly: () => void;
  searchSamples: (criteria: SampleSearchCriteria) => Sample[];

  // Actions - Sample Editing
  normalizeSample: (id: string, targetLevel?: number) => void;
  reverseSample: (id: string) => void;
  trimSample: (id: string, startFrame: number, endFrame: number) => void;
  fadeSample: (id: string, type: 'in' | 'out', duration: number) => void;

  // Actions - Markers & Loops
  addMarker: (sampleId: string, frame: number, name: string) => void;
  deleteMarker: (sampleId: string, markerId: string) => void;
  addLoop: (sampleId: string, startFrame: number, endFrame: number) => void;
  updateLoop: (sampleId: string, loopId: string, updates: Partial<SampleLoop>) => void;
  deleteLoop: (sampleId: string, loopId: string) => void;

  // Actions - Playback
  setPlaying: (playing: boolean) => void;
  setPlaybackPosition: (position: number) => void;

  // Actions - Editor
  setZoom: (zoom: number) => void;
  setSelection: (selection: { start: number; end: number } | null) => void;

  // Utilities
  exportSample: (id: string) => Blob | null;
  duplicateSample: (id: string) => Sample | null;
}

export const useSampleStore = create<SampleState>()(
  persist(
    (set, get) => ({
      samples: [],
      currentSample: null,
      selectedSamples: new Set(),
      searchQuery: '',
      selectedCategory: null,
      showFavoritesOnly: false,
      zoom: 1,
      selection: null,
      playbackPosition: 0,
      isPlaying: false,
      history: [],
      historyIndex: -1,

      addSample: async (file: File) => {
        try {
          const audioBuffer = await loadAudioFile(file);
          const peaks = calculatePeaks(audioBuffer, Math.floor(audioBuffer.length / 1000));
          const rms = calculateRMS(audioBuffer);
          const peakLevel = calculatePeakLevel(audioBuffer);

          const sample: Sample = {
            id: nanoid(),
            name: file.name.replace(/\.[^/.]+$/, ''),
            filePath: file.name,
            audioBuffer,
            category: 'user',
            tags: [],
            duration: audioBuffer.length / audioBuffer.sampleRate,
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels,
            fileSize: file.size,
            peaks,
            rms,
            peakLevel,
            loops: [],
            markers: [],
            regions: [],
            isFavorite: false,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          };

          set((state) => ({
            samples: [...state.samples, sample],
            currentSample: sample,
          }));

          return sample;
        } catch (error) {
          console.error('Failed to load audio file:', error);
          throw error;
        }
      },

      deleteSample: (id) => {
        set((state) => ({
          samples: state.samples.filter((s) => s.id !== id),
          currentSample: state.currentSample?.id === id ? null : state.currentSample,
        }));
      },

      updateSample: (id, updates) => {
        set((state) => ({
          samples: state.samples.map((s) =>
            s.id === id ? { ...s, ...updates, modifiedAt: new Date().toISOString() } : s
          ),
          currentSample: state.currentSample?.id === id
            ? { ...state.currentSample, ...updates, modifiedAt: new Date().toISOString() }
            : state.currentSample,
        }));
      },

      setCurrentSample: (sample) => set({ currentSample: sample }),

      toggleFavorite: (id) => {
        set((state) => ({
          samples: state.samples.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)),
        }));
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      toggleFavoritesOnly: () => set((state) => ({ showFavoritesOnly: !state.showFavoritesOnly })),

      searchSamples: (criteria) => {
        let results = get().samples;

        if (criteria.query) {
          const query = criteria.query.toLowerCase();
          results = results.filter(
            (s) =>
              s.name.toLowerCase().includes(query) ||
              s.tags.some((t) => t.toLowerCase().includes(query))
          );
        }

        if (criteria.category) {
          results = results.filter((s) => s.category === criteria.category);
        }

        if (criteria.favoritesOnly) {
          results = results.filter((s) => s.isFavorite);
        }

        return results;
      },

      normalizeSample: (id, targetLevel = 0) => {
        const sample = get().samples.find((s) => s.id === id);
        if (!sample || !sample.audioBuffer) return;

        const normalized = normalizeAudioBuffer(sample.audioBuffer, targetLevel);
        get().updateSample(id, { audioBuffer: normalized });
      },

      reverseSample: (id) => {
        const sample = get().samples.find((s) => s.id === id);
        if (!sample || !sample.audioBuffer) return;

        const reversed = reverseAudioBuffer(sample.audioBuffer);
        get().updateSample(id, { audioBuffer: reversed });
      },

      trimSample: (id, startFrame, endFrame) => {
        const sample = get().samples.find((s) => s.id === id);
        if (!sample || !sample.audioBuffer) return;

        const trimmed = trimAudioBuffer(sample.audioBuffer, startFrame, endFrame);
        const duration = trimmed.length / trimmed.sampleRate;
        get().updateSample(id, { audioBuffer: trimmed, duration });
      },

      fadeSample: (id, type, duration) => {
        const sample = get().samples.find((s) => s.id === id);
        if (!sample || !sample.audioBuffer) return;

        const faded = applyFade(sample.audioBuffer, type, duration);
        get().updateSample(id, { audioBuffer: faded });
      },

      addMarker: (sampleId, frame, name) => {
        const sample = get().samples.find((s) => s.id === sampleId);
        if (!sample) return;

        const marker: SampleMarker = {
          id: nanoid(),
          name,
          frame,
        };

        get().updateSample(sampleId, {
          markers: [...sample.markers, marker],
        });
      },

      deleteMarker: (sampleId, markerId) => {
        const sample = get().samples.find((s) => s.id === sampleId);
        if (!sample) return;

        get().updateSample(sampleId, {
          markers: sample.markers.filter((m) => m.id !== markerId),
        });
      },

      addLoop: (sampleId, startFrame, endFrame) => {
        const sample = get().samples.find((s) => s.id === sampleId);
        if (!sample) return;

        const loop: SampleLoop = {
          id: nanoid(),
          name: `Loop ${sample.loops.length + 1}`,
          startFrame,
          endFrame,
          mode: 'forward',
          enabled: true,
        };

        get().updateSample(sampleId, {
          loops: [...sample.loops, loop],
        });
      },

      updateLoop: (sampleId, loopId, updates) => {
        const sample = get().samples.find((s) => s.id === sampleId);
        if (!sample) return;

        get().updateSample(sampleId, {
          loops: sample.loops.map((l) => (l.id === loopId ? { ...l, ...updates } : l)),
        });
      },

      deleteLoop: (sampleId, loopId) => {
        const sample = get().samples.find((s) => s.id === sampleId);
        if (!sample) return;

        get().updateSample(sampleId, {
          loops: sample.loops.filter((l) => l.id !== loopId),
        });
      },

      setPlaying: (playing) => set({ isPlaying: playing }),
      setPlaybackPosition: (position) => set({ playbackPosition: position }),
      setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
      setSelection: (selection) => set({ selection }),

      exportSample: (id) => {
        const sample = get().samples.find((s) => s.id === id);
        if (!sample || !sample.audioBuffer) return null;

        return audioBufferToWav(sample.audioBuffer);
      },

      duplicateSample: (id) => {
        const sample = get().samples.find((s) => s.id === id);
        if (!sample) return null;

        const duplicate: Sample = {
          ...sample,
          id: nanoid(),
          name: `${sample.name} (Copy)`,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        };

        set((state) => ({
          samples: [...state.samples, duplicate],
        }));

        return duplicate;
      },
    }),
    {
      name: 'sample-storage',
      partialize: (state) => ({
        samples: state.samples.map((s) => ({
          ...s,
          audioBuffer: null, // Don't persist AudioBuffer
          peaks: undefined, // Will be recalculated
        })),
      }),
    }
  )
);
