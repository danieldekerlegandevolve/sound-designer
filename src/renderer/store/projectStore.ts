import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type {
  PluginProject,
  UIComponent,
  DSPNode,
  DSPConnection,
  EditorMode,
} from '@shared/types';

interface ProjectState {
  project: PluginProject;
  selectedMode: EditorMode;
  selectedUIComponent: string | null;
  selectedDSPNode: string | null;
  isDirty: boolean;
  currentFilePath: string | null;
  autoSaveEnabled: boolean;

  // Actions
  setMode: (mode: EditorMode) => void;
  setProjectName: (name: string) => void;

  // UI Designer actions
  addUIComponent: (component: Omit<UIComponent, 'id'>) => void;
  updateUIComponent: (id: string, updates: Partial<UIComponent>) => void;
  deleteUIComponent: (id: string) => void;
  selectUIComponent: (id: string | null) => void;

  // DSP Designer actions
  addDSPNode: (node: Omit<DSPNode, 'id'>) => void;
  updateDSPNode: (id: string, updates: Partial<DSPNode>) => void;
  deleteDSPNode: (id: string) => void;
  selectDSPNode: (id: string | null) => void;
  addConnection: (connection: Omit<DSPConnection, 'id'>) => void;
  deleteConnection: (id: string) => void;

  // Code actions
  updateCode: (type: 'dsp' | 'ui' | 'helpers', code: string) => void;

  // Project actions
  saveProject: (filePath?: string) => Promise<void>;
  saveProjectAs: () => Promise<void>;
  loadProject: (filePath?: string) => Promise<void>;
  newProject: () => void;
  exportAsJSON: () => Promise<void>;
  importFromJSON: () => Promise<void>;
  setAutoSave: (enabled: boolean) => void;
}

const defaultProject: PluginProject = {
  id: nanoid(),
  name: 'New Plugin',
  version: '1.0.0',
  description: 'A new audio plugin',
  author: '',
  uiComponents: [],
  dspGraph: {
    nodes: [],
    connections: [],
  },
  code: {
    dsp: '// DSP code here\n',
    ui: '// UI customization code here\n',
    helpers: '// Helper functions here\n',
  },
  settings: {
    width: 800,
    height: 600,
    resizable: true,
    backgroundColor: '#2a2a2a',
    sampleRate: 44100,
    bufferSize: 512,
  },
};

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    project: defaultProject,
    selectedMode: 'ui',
    selectedUIComponent: null,
    selectedDSPNode: null,
    isDirty: false,
    currentFilePath: null,
    autoSaveEnabled: true,

    setMode: (mode) => set({ selectedMode: mode }),

    setProjectName: (name) => set((state) => {
      state.project.name = name;
      state.isDirty = true;
    }),

    // UI Designer actions
    addUIComponent: (component) => set((state) => {
      const newComponent = { ...component, id: nanoid() };
      state.project.uiComponents.push(newComponent);
      state.isDirty = true;
    }),

    updateUIComponent: (id, updates) => set((state) => {
      const index = state.project.uiComponents.findIndex((c) => c.id === id);
      if (index !== -1) {
        state.project.uiComponents[index] = {
          ...state.project.uiComponents[index],
          ...updates,
        };
        state.isDirty = true;
      }
    }),

    deleteUIComponent: (id) => set((state) => {
      state.project.uiComponents = state.project.uiComponents.filter((c) => c.id !== id);
      if (state.selectedUIComponent === id) {
        state.selectedUIComponent = null;
      }
      state.isDirty = true;
    }),

    selectUIComponent: (id) => set({ selectedUIComponent: id }),

    // DSP Designer actions
    addDSPNode: (node) => set((state) => {
      const newNode = { ...node, id: nanoid() };
      state.project.dspGraph.nodes.push(newNode);
      state.isDirty = true;
    }),

    updateDSPNode: (id, updates) => set((state) => {
      const index = state.project.dspGraph.nodes.findIndex((n) => n.id === id);
      if (index !== -1) {
        state.project.dspGraph.nodes[index] = {
          ...state.project.dspGraph.nodes[index],
          ...updates,
        };
        state.isDirty = true;
      }
    }),

    deleteDSPNode: (id) => set((state) => {
      state.project.dspGraph.nodes = state.project.dspGraph.nodes.filter((n) => n.id !== id);
      state.project.dspGraph.connections = state.project.dspGraph.connections.filter(
        (c) => c.sourceNodeId !== id && c.targetNodeId !== id
      );
      if (state.selectedDSPNode === id) {
        state.selectedDSPNode = null;
      }
      state.isDirty = true;
    }),

    selectDSPNode: (id) => set({ selectedDSPNode: id }),

    addConnection: (connection) => set((state) => {
      const newConnection = { ...connection, id: nanoid() };
      state.project.dspGraph.connections.push(newConnection);
      state.isDirty = true;
    }),

    deleteConnection: (id) => set((state) => {
      state.project.dspGraph.connections = state.project.dspGraph.connections.filter(
        (c) => c.id !== id
      );
      state.isDirty = true;
    }),

    // Code actions
    updateCode: (type, code) => set((state) => {
      state.project.code[type] = code;
      state.isDirty = true;
    }),

    // Project actions
    saveProject: async (filePath?) => {
      const { project, currentFilePath } = get();
      if (window.electronAPI) {
        const result = await window.electronAPI.saveProject(
          project,
          filePath || currentFilePath || undefined
        );
        if (result.success) {
          set({ isDirty: false, currentFilePath: result.path || null });
        }
      }
    },

    saveProjectAs: async () => {
      const { project } = get();
      if (window.electronAPI) {
        const result = await window.electronAPI.saveProject(project);
        if (result.success) {
          set({ isDirty: false, currentFilePath: result.path || null });
        }
      }
    },

    loadProject: async (filePath?) => {
      if (window.electronAPI) {
        const result = await window.electronAPI.loadProject(filePath);
        if (result.success && result.data) {
          set({
            project: result.data,
            isDirty: false,
            currentFilePath: result.path || null,
          });
        }
      }
    },

    newProject: () => set({
      project: { ...defaultProject, id: nanoid() },
      selectedUIComponent: null,
      selectedDSPNode: null,
      isDirty: false,
      currentFilePath: null,
    }),

    exportAsJSON: async () => {
      const { project } = get();
      if (window.electronAPI) {
        await window.electronAPI.exportProjectJSON(project);
      }
    },

    importFromJSON: async () => {
      if (window.electronAPI) {
        const result = await window.electronAPI.importProjectJSON();
        if (result.success && result.data) {
          set({
            project: result.data,
            isDirty: true,
            currentFilePath: null,
          });
        }
      }
    },

    setAutoSave: (enabled) => set({ autoSaveEnabled: enabled }),
  }))
);
