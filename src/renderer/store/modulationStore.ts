import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ModulationSource,
  ModulationTarget,
  ModulationConnection,
  ModulationMatrix,
  AutomationLane,
  AutomationPoint,
  AutomationClip,
  LFOConfig,
  EnvelopeConfig,
  EnvelopeFollowerConfig,
  StepSequencerConfig,
  RandomizerConfig,
  MacroConfig,
  DEFAULT_LFO_CONFIG,
  DEFAULT_ENVELOPE_CONFIG,
  DEFAULT_ENVELOPE_FOLLOWER_CONFIG,
  DEFAULT_STEP_SEQUENCER_CONFIG,
  DEFAULT_RANDOMIZER_CONFIG,
  DEFAULT_MACRO_CONFIG,
  MODULATION_COLORS,
} from '@shared/modulationTypes';
import { nanoid } from 'nanoid';

interface ModulationState {
  // Modulation Matrix
  matrix: ModulationMatrix;

  // Automation
  automationClips: AutomationClip[];
  currentAutomationClip: AutomationClip | null;
  selectedLane: string | null;

  // Macros (always available, not in matrix)
  macros: MacroConfig[];

  // Playback state
  isPlaying: boolean;
  currentTime: number; // in beats
  tempo: number; // BPM

  // UI State
  showMatrix: boolean;
  showAutomation: boolean;
  selectedSource: string | null;
  selectedTarget: string | null;

  // Actions - Modulation Sources
  createLFO: (name: string, config?: Partial<LFOConfig>) => ModulationSource;
  createEnvelope: (name: string, config?: Partial<EnvelopeConfig>) => ModulationSource;
  createEnvelopeFollower: (name: string, config?: Partial<EnvelopeFollowerConfig>) => ModulationSource;
  createStepSequencer: (name: string, config?: Partial<StepSequencerConfig>) => ModulationSource;
  createRandomizer: (name: string, config?: Partial<RandomizerConfig>) => ModulationSource;
  updateSource: (id: string, updates: Partial<ModulationSource>) => void;
  deleteSource: (id: string) => void;
  toggleSource: (id: string) => void;

  // Actions - Modulation Targets
  registerTarget: (target: Omit<ModulationTarget, 'id'>) => ModulationTarget;
  unregisterTarget: (id: string) => void;
  updateTarget: (id: string, updates: Partial<ModulationTarget>) => void;

  // Actions - Modulation Connections
  createConnection: (sourceId: string, targetId: string, amount?: number) => ModulationConnection;
  updateConnection: (id: string, updates: Partial<ModulationConnection>) => void;
  deleteConnection: (id: string) => void;
  toggleConnection: (id: string) => void;
  deleteConnectionsForSource: (sourceId: string) => void;
  deleteConnectionsForTarget: (targetId: string) => void;

  // Actions - Macros
  createMacro: (label: string, color?: string) => MacroConfig;
  updateMacro: (index: number, updates: Partial<MacroConfig>) => void;
  deleteMacro: (index: number) => void;
  setMacroValue: (index: number, value: number) => void;
  addMacroMapping: (macroIndex: number, targetId: string, targetName: string, amount: number) => void;
  removeMacroMapping: (macroIndex: number, targetId: string) => void;

  // Actions - Automation
  createAutomationClip: (name: string) => AutomationClip;
  loadAutomationClip: (clip: AutomationClip) => void;
  deleteAutomationClip: (id: string) => void;
  createAutomationLane: (targetId: string, targetName: string) => AutomationLane;
  deleteAutomationLane: (laneId: string) => void;
  addAutomationPoint: (laneId: string, point: Omit<AutomationPoint, 'id'>) => void;
  updateAutomationPoint: (laneId: string, index: number, updates: Partial<AutomationPoint>) => void;
  deleteAutomationPoint: (laneId: string, index: number) => void;
  clearAutomationLane: (laneId: string) => void;

  // Actions - Playback
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setTempo: (tempo: number) => void;

  // Actions - UI
  setShowMatrix: (show: boolean) => void;
  setShowAutomation: (show: boolean) => void;
  setSelectedSource: (id: string | null) => void;
  setSelectedTarget: (id: string | null) => void;
  setSelectedLane: (id: string | null) => void;

  // Utilities
  getConnectionsForSource: (sourceId: string) => ModulationConnection[];
  getConnectionsForTarget: (targetId: string) => ModulationConnection[];
  getModulationValue: (targetId: string, time: number) => number;
  exportMatrix: () => string;
  importMatrix: (data: string) => void;
}

export const useModulationStore = create<ModulationState>()(
  persist(
    (set, get) => ({
      matrix: {
        sources: [],
        targets: [],
        connections: [],
      },
      automationClips: [],
      currentAutomationClip: null,
      selectedLane: null,
      macros: [
        { ...DEFAULT_MACRO_CONFIG, label: 'Macro 1', color: MODULATION_COLORS[0] },
        { ...DEFAULT_MACRO_CONFIG, label: 'Macro 2', color: MODULATION_COLORS[1] },
        { ...DEFAULT_MACRO_CONFIG, label: 'Macro 3', color: MODULATION_COLORS[2] },
        { ...DEFAULT_MACRO_CONFIG, label: 'Macro 4', color: MODULATION_COLORS[3] },
      ],
      isPlaying: false,
      currentTime: 0,
      tempo: 120,
      showMatrix: false,
      showAutomation: false,
      selectedSource: null,
      selectedTarget: null,

      createLFO: (name, config = {}) => {
        const source: ModulationSource = {
          id: nanoid(),
          type: 'lfo',
          name,
          enabled: true,
          config: { ...DEFAULT_LFO_CONFIG, ...config },
        };

        set((state) => ({
          matrix: {
            ...state.matrix,
            sources: [...state.matrix.sources, source],
          },
        }));

        return source;
      },

      createEnvelope: (name, config = {}) => {
        const source: ModulationSource = {
          id: nanoid(),
          type: 'envelope',
          name,
          enabled: true,
          config: { ...DEFAULT_ENVELOPE_CONFIG, ...config },
        };

        set((state) => ({
          matrix: {
            ...state.matrix,
            sources: [...state.matrix.sources, source],
          },
        }));

        return source;
      },

      createEnvelopeFollower: (name, config = {}) => {
        const source: ModulationSource = {
          id: nanoid(),
          type: 'envelopeFollower',
          name,
          enabled: true,
          config: { ...DEFAULT_ENVELOPE_FOLLOWER_CONFIG, ...config },
        };

        set((state) => ({
          matrix: {
            ...state.matrix,
            sources: [...state.matrix.sources, source],
          },
        }));

        return source;
      },

      createStepSequencer: (name, config = {}) => {
        const source: ModulationSource = {
          id: nanoid(),
          type: 'stepSequencer',
          name,
          enabled: true,
          config: { ...DEFAULT_STEP_SEQUENCER_CONFIG, ...config },
        };

        set((state) => ({
          matrix: {
            ...state.matrix,
            sources: [...state.matrix.sources, source],
          },
        }));

        return source;
      },

      createRandomizer: (name, config = {}) => {
        const source: ModulationSource = {
          id: nanoid(),
          type: 'randomizer',
          name,
          enabled: true,
          config: { ...DEFAULT_RANDOMIZER_CONFIG, ...config },
        };

        set((state) => ({
          matrix: {
            ...state.matrix,
            sources: [...state.matrix.sources, source],
          },
        }));

        return source;
      },

      updateSource: (id, updates) => {
        set((state) => ({
          matrix: {
            ...state.matrix,
            sources: state.matrix.sources.map((source) =>
              source.id === id ? { ...source, ...updates } : source
            ),
          },
        }));
      },

      deleteSource: (id) => {
        get().deleteConnectionsForSource(id);

        set((state) => ({
          matrix: {
            ...state.matrix,
            sources: state.matrix.sources.filter((source) => source.id !== id),
          },
        }));
      },

      toggleSource: (id) => {
        set((state) => ({
          matrix: {
            ...state.matrix,
            sources: state.matrix.sources.map((source) =>
              source.id === id ? { ...source, enabled: !source.enabled } : source
            ),
          },
        }));
      },

      registerTarget: (targetData) => {
        const target: ModulationTarget = {
          ...targetData,
          id: nanoid(),
        };

        set((state) => ({
          matrix: {
            ...state.matrix,
            targets: [...state.matrix.targets, target],
          },
        }));

        return target;
      },

      unregisterTarget: (id) => {
        get().deleteConnectionsForTarget(id);

        set((state) => ({
          matrix: {
            ...state.matrix,
            targets: state.matrix.targets.filter((target) => target.id !== id),
          },
        }));
      },

      updateTarget: (id, updates) => {
        set((state) => ({
          matrix: {
            ...state.matrix,
            targets: state.matrix.targets.map((target) =>
              target.id === id ? { ...target, ...updates } : target
            ),
          },
        }));
      },

      createConnection: (sourceId, targetId, amount = 0.5) => {
        // Check if connection already exists
        const existing = get().matrix.connections.find(
          (c) => c.sourceId === sourceId && c.targetId === targetId
        );

        if (existing) {
          return existing;
        }

        const connection: ModulationConnection = {
          id: nanoid(),
          sourceId,
          targetId,
          amount,
          enabled: true,
          curve: 'linear',
        };

        set((state) => ({
          matrix: {
            ...state.matrix,
            connections: [...state.matrix.connections, connection],
          },
        }));

        return connection;
      },

      updateConnection: (id, updates) => {
        set((state) => ({
          matrix: {
            ...state.matrix,
            connections: state.matrix.connections.map((conn) =>
              conn.id === id ? { ...conn, ...updates } : conn
            ),
          },
        }));
      },

      deleteConnection: (id) => {
        set((state) => ({
          matrix: {
            ...state.matrix,
            connections: state.matrix.connections.filter((conn) => conn.id !== id),
          },
        }));
      },

      toggleConnection: (id) => {
        set((state) => ({
          matrix: {
            ...state.matrix,
            connections: state.matrix.connections.map((conn) =>
              conn.id === id ? { ...conn, enabled: !conn.enabled } : conn
            ),
          },
        }));
      },

      deleteConnectionsForSource: (sourceId) => {
        set((state) => ({
          matrix: {
            ...state.matrix,
            connections: state.matrix.connections.filter((conn) => conn.sourceId !== sourceId),
          },
        }));
      },

      deleteConnectionsForTarget: (targetId) => {
        set((state) => ({
          matrix: {
            ...state.matrix,
            connections: state.matrix.connections.filter((conn) => conn.targetId !== targetId),
          },
        }));
      },

      createMacro: (label, color) => {
        const macro: MacroConfig = {
          ...DEFAULT_MACRO_CONFIG,
          label,
          color: color || MODULATION_COLORS[get().macros.length % MODULATION_COLORS.length],
        };

        set((state) => ({
          macros: [...state.macros, macro],
        }));

        return macro;
      },

      updateMacro: (index, updates) => {
        set((state) => ({
          macros: state.macros.map((macro, i) => (i === index ? { ...macro, ...updates } : macro)),
        }));
      },

      deleteMacro: (index) => {
        set((state) => ({
          macros: state.macros.filter((_, i) => i !== index),
        }));
      },

      setMacroValue: (index, value) => {
        set((state) => ({
          macros: state.macros.map((macro, i) =>
            i === index ? { ...macro, value: Math.max(0, Math.min(1, value)) } : macro
          ),
        }));
      },

      addMacroMapping: (macroIndex, targetId, targetName, amount) => {
        set((state) => ({
          macros: state.macros.map((macro, i) =>
            i === macroIndex
              ? {
                  ...macro,
                  mappings: [
                    ...macro.mappings.filter((m) => m.targetId !== targetId),
                    {
                      targetId,
                      targetName,
                      amount,
                      curve: 'linear',
                    },
                  ],
                }
              : macro
          ),
        }));
      },

      removeMacroMapping: (macroIndex, targetId) => {
        set((state) => ({
          macros: state.macros.map((macro, i) =>
            i === macroIndex
              ? {
                  ...macro,
                  mappings: macro.mappings.filter((m) => m.targetId !== targetId),
                }
              : macro
          ),
        }));
      },

      createAutomationClip: (name) => {
        const clip: AutomationClip = {
          id: nanoid(),
          name,
          lanes: [],
          startTime: 0,
          duration: 16, // 4 bars at 4/4
          loopEnabled: false,
        };

        set((state) => ({
          automationClips: [...state.automationClips, clip],
          currentAutomationClip: clip,
        }));

        return clip;
      },

      loadAutomationClip: (clip) => {
        set({ currentAutomationClip: clip });
      },

      deleteAutomationClip: (id) => {
        set((state) => ({
          automationClips: state.automationClips.filter((clip) => clip.id !== id),
          currentAutomationClip:
            state.currentAutomationClip?.id === id ? null : state.currentAutomationClip,
        }));
      },

      createAutomationLane: (targetId, targetName) => {
        const { currentAutomationClip } = get();
        if (!currentAutomationClip) return null as any;

        const lane: AutomationLane = {
          id: nanoid(),
          targetId,
          targetName,
          points: [],
          enabled: true,
          color: MODULATION_COLORS[currentAutomationClip.lanes.length % MODULATION_COLORS.length],
        };

        set({
          currentAutomationClip: {
            ...currentAutomationClip,
            lanes: [...currentAutomationClip.lanes, lane],
          },
        });

        return lane;
      },

      deleteAutomationLane: (laneId) => {
        const { currentAutomationClip } = get();
        if (!currentAutomationClip) return;

        set({
          currentAutomationClip: {
            ...currentAutomationClip,
            lanes: currentAutomationClip.lanes.filter((lane) => lane.id !== laneId),
          },
        });
      },

      addAutomationPoint: (laneId, pointData) => {
        const { currentAutomationClip } = get();
        if (!currentAutomationClip) return;

        set({
          currentAutomationClip: {
            ...currentAutomationClip,
            lanes: currentAutomationClip.lanes.map((lane) =>
              lane.id === laneId
                ? {
                    ...lane,
                    points: [...lane.points, pointData as AutomationPoint].sort((a, b) => a.time - b.time),
                  }
                : lane
            ),
          },
        });
      },

      updateAutomationPoint: (laneId, index, updates) => {
        const { currentAutomationClip } = get();
        if (!currentAutomationClip) return;

        set({
          currentAutomationClip: {
            ...currentAutomationClip,
            lanes: currentAutomationClip.lanes.map((lane) =>
              lane.id === laneId
                ? {
                    ...lane,
                    points: lane.points.map((point, i) =>
                      i === index ? { ...point, ...updates } : point
                    ),
                  }
                : lane
            ),
          },
        });
      },

      deleteAutomationPoint: (laneId, index) => {
        const { currentAutomationClip } = get();
        if (!currentAutomationClip) return;

        set({
          currentAutomationClip: {
            ...currentAutomationClip,
            lanes: currentAutomationClip.lanes.map((lane) =>
              lane.id === laneId
                ? {
                    ...lane,
                    points: lane.points.filter((_, i) => i !== index),
                  }
                : lane
            ),
          },
        });
      },

      clearAutomationLane: (laneId) => {
        const { currentAutomationClip } = get();
        if (!currentAutomationClip) return;

        set({
          currentAutomationClip: {
            ...currentAutomationClip,
            lanes: currentAutomationClip.lanes.map((lane) =>
              lane.id === laneId
                ? {
                    ...lane,
                    points: [],
                  }
                : lane
            ),
          },
        });
      },

      setPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setTempo: (tempo) => set({ tempo }),
      setShowMatrix: (show) => set({ showMatrix: show }),
      setShowAutomation: (show) => set({ showAutomation: show }),
      setSelectedSource: (id) => set({ selectedSource: id }),
      setSelectedTarget: (id) => set({ selectedTarget: id }),
      setSelectedLane: (id) => set({ selectedLane: id }),

      getConnectionsForSource: (sourceId) => {
        return get().matrix.connections.filter((conn) => conn.sourceId === sourceId);
      },

      getConnectionsForTarget: (targetId) => {
        return get().matrix.connections.filter((conn) => conn.targetId === targetId);
      },

      getModulationValue: (targetId, time) => {
        const { matrix, macros, currentTime } = get();

        let totalModulation = 0;

        // Get all enabled connections for this target
        const connections = matrix.connections.filter(
          (conn) => conn.targetId === targetId && conn.enabled
        );

        connections.forEach((conn) => {
          const source = matrix.sources.find((s) => s.id === conn.sourceId);
          if (!source || !source.enabled) return;

          // Calculate source value based on type
          let sourceValue = 0;

          switch (source.type) {
            case 'lfo':
              // Would use calculateLFOValue from modulationTypes
              sourceValue = 0; // Simplified
              break;
            case 'envelope':
              // Would use calculateEnvelopeValue
              sourceValue = 0; // Simplified
              break;
            // ... other source types
          }

          // Apply connection amount and curve
          totalModulation += sourceValue * conn.amount;
        });

        // Apply macro modulation
        macros.forEach((macro) => {
          const mapping = macro.mappings.find((m) => m.targetId === targetId);
          if (mapping) {
            totalModulation += macro.value * mapping.amount;
          }
        });

        return totalModulation;
      },

      exportMatrix: () => {
        const { matrix } = get();
        return JSON.stringify(matrix, null, 2);
      },

      importMatrix: (data) => {
        try {
          const matrix: ModulationMatrix = JSON.parse(data);
          set({ matrix });
        } catch (error) {
          console.error('Failed to import modulation matrix:', error);
        }
      },
    }),
    {
      name: 'modulation-storage',
      partialize: (state) => ({
        matrix: state.matrix,
        automationClips: state.automationClips,
        macros: state.macros,
        tempo: state.tempo,
      }),
    }
  )
);
