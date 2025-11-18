import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // UI Designer settings
  gridSize: number;
  gridEnabled: boolean;
  snapToGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;

  // DSP Designer settings
  autoArrange: boolean;
  showMinimap: boolean;

  // General settings
  theme: 'dark' | 'light';
  autoSave: boolean;
  autoSaveInterval: number; // minutes

  // Audio settings
  sampleRate: number;
  bufferSize: number;

  // Actions
  setGridSize: (size: number) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  toggleRulers: () => void;
  toggleGuides: () => void;
  toggleAutoArrange: () => void;
  toggleMinimap: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (minutes: number) => void;
  setSampleRate: (rate: number) => void;
  setBufferSize: (size: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default settings
      gridSize: 10,
      gridEnabled: true,
      snapToGrid: true,
      showRulers: false,
      showGuides: true,
      autoArrange: false,
      showMinimap: true,
      theme: 'dark',
      autoSave: true,
      autoSaveInterval: 5,
      sampleRate: 44100,
      bufferSize: 512,

      // Actions
      setGridSize: (size) => set({ gridSize: size }),
      toggleGrid: () => set((state) => ({ gridEnabled: !state.gridEnabled })),
      toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
      toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),
      toggleGuides: () => set((state) => ({ showGuides: !state.showGuides })),
      toggleAutoArrange: () => set((state) => ({ autoArrange: !state.autoArrange })),
      toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),
      setTheme: (theme) => set({ theme }),
      setAutoSave: (enabled) => set({ autoSave: enabled }),
      setAutoSaveInterval: (minutes) => set({ autoSaveInterval: minutes }),
      setSampleRate: (rate) => set({ sampleRate: rate }),
      setBufferSize: (size) => set({ bufferSize: size }),
    }),
    {
      name: 'sound-designer-settings',
    }
  )
);
