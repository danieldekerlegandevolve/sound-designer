import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { current } from 'immer';
import { nanoid } from 'nanoid';
import { HistoryManager } from '../utils/HistoryManager';
import { getDefaultParametersForNodeType } from '../utils/DSPNodeDefaults';
import { sanitizeProjectForIPC } from '../utils/projectSerializer';
import type {
  PluginProject,
  UIComponent,
  DSPNode,
  DSPConnection,
  EditorMode,
} from '@shared/types';

// Create global history manager
const historyManager = new HistoryManager(50);

interface ProjectState {
  project: PluginProject;
  selectedMode: EditorMode;
  selectedUIComponent: string | null;
  selectedUIComponents: string[];
  selectedDSPNode: string | null;
  isDirty: boolean;
  currentFilePath: string | null;
  autoSaveEnabled: boolean;
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setMode: (mode: EditorMode) => void;
  setProjectName: (name: string) => void;

  // UI Designer actions
  addUIComponent: (component: Omit<UIComponent, 'id'>) => void;
  updateUIComponent: (id: string, updates: Partial<UIComponent>) => void;
  deleteUIComponent: (id: string) => void;
  selectUIComponent: (id: string | null) => void;
  toggleUIComponentSelection: (id: string) => void;
  selectMultipleUIComponents: (ids: string[]) => void;
  clearUISelection: () => void;
  groupSelectedComponents: () => void;
  deleteSelectedComponents: () => void;
  copyUIComponent: (id: string) => void;
  pasteUIComponent: () => void;

  // DSP Designer actions
  addDSPNode: (node: Omit<DSPNode, 'id'>) => void;
  updateDSPNode: (id: string, updates: Partial<DSPNode>) => void;
  deleteDSPNode: (id: string) => void;
  selectDSPNode: (id: string | null) => void;
  addConnection: (connection: Omit<DSPConnection, 'id'>) => void;
  deleteConnection: (id: string) => void;
  copyDSPNode: (id: string) => void;
  pasteDSPNode: () => void;

  // Code actions
  updateCode: (type: 'dsp' | 'ui' | 'helpers', code: string) => void;
  updateDSPNodeCode: (id: string, code: string) => void;
  updateUIComponentCode: (id: string, code: string) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  pushHistory: (description: string) => void;

  // Project actions
  saveProject: (filePath?: string) => Promise<void>;
  saveProjectAs: () => Promise<void>;
  loadProject: (filePath?: string) => Promise<void>;
  newProject: () => void;
  exportAsJSON: () => Promise<void>;
  importFromJSON: () => Promise<void>;
  setAutoSave: (enabled: boolean) => void;
}

// Clipboard for copy/paste
let uiComponentClipboard: UIComponent | null = null;
let dspNodeClipboard: DSPNode | null = null;

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
    selectedUIComponents: [],
    selectedDSPNode: null,
    isDirty: false,
    currentFilePath: null,
    autoSaveEnabled: true,
    canUndo: false,
    canRedo: false,

    setMode: (mode) => set({ selectedMode: mode }),

    setProjectName: (name) => set((state) => {
      state.project.name = name;
      state.isDirty = true;
    }),

    // UI Designer actions
    addUIComponent: (component) => {
      const { project } = get();
      historyManager.push(project, `Add ${component.type} component`);
      set((state) => {
        const newComponent = { ...component, id: nanoid() };
        state.project.uiComponents.push(newComponent);
        state.isDirty = true;
        state.canUndo = historyManager.canUndo();
        state.canRedo = historyManager.canRedo();
      });
    },

    updateUIComponent: (id, updates) => {
      const { project } = get();
      const comp = project.uiComponents.find((c) => c.id === id);
      if (comp && Object.keys(updates).some((key) => key !== 'x' && key !== 'y')) {
        // Only push history for non-position updates (to avoid history spam during drag)
        historyManager.push(project, `Update ${comp.type} component`);
      }
      set((state) => {
        const index = state.project.uiComponents.findIndex((c) => c.id === id);
        if (index !== -1) {
          state.project.uiComponents[index] = {
            ...state.project.uiComponents[index],
            ...updates,
          };
          state.isDirty = true;
          state.canUndo = historyManager.canUndo();
          state.canRedo = historyManager.canRedo();
        }
      });
    },

    deleteUIComponent: (id) => {
      const { project } = get();
      const comp = project.uiComponents.find((c) => c.id === id);
      if (comp) {
        historyManager.push(project, `Delete ${comp.type} component`);
      }
      set((state) => {
        state.project.uiComponents = state.project.uiComponents.filter((c) => c.id !== id);
        if (state.selectedUIComponent === id) {
          state.selectedUIComponent = null;
        }
        state.isDirty = true;
        state.canUndo = historyManager.canUndo();
        state.canRedo = historyManager.canRedo();
      });
    },

    selectUIComponent: (id) => set({ selectedUIComponent: id }),

    copyUIComponent: (id) => {
      const { project } = get();
      const component = project.uiComponents.find((c) => c.id === id);
      if (component) {
        uiComponentClipboard = JSON.parse(JSON.stringify(component));
      }
    },

    pasteUIComponent: () => {
      if (!uiComponentClipboard) return;
      const { project } = get();
      historyManager.push(project, `Paste ${uiComponentClipboard.type} component`);
      set((state) => {
        const newComponent = {
          ...uiComponentClipboard!,
          id: nanoid(),
          x: uiComponentClipboard!.x + 20,
          y: uiComponentClipboard!.y + 20,
        };
        state.project.uiComponents.push(newComponent);
        state.isDirty = true;
        state.canUndo = historyManager.canUndo();
        state.canRedo = historyManager.canRedo();
      });
    },

    toggleUIComponentSelection: (id) => {
      set((state) => {
        const index = state.selectedUIComponents.indexOf(id);
        if (index === -1) {
          state.selectedUIComponents.push(id);
        } else {
          state.selectedUIComponents.splice(index, 1);
        }
      });
    },

    selectMultipleUIComponents: (ids) => {
      set({ selectedUIComponents: ids, selectedUIComponent: null });
    },

    clearUISelection: () => {
      set({ selectedUIComponents: [], selectedUIComponent: null });
    },

    groupSelectedComponents: () => {
      const { project, selectedUIComponents } = get();
      if (selectedUIComponents.length < 2) return;

      historyManager.push(project, 'Group components');
      set((state) => {
        // Find bounding box of selected components
        const components = state.project.uiComponents.filter((c) =>
          selectedUIComponents.includes(c.id)
        );

        const minX = Math.min(...components.map((c) => c.x));
        const minY = Math.min(...components.map((c) => c.y));
        const maxX = Math.max(...components.map((c) => c.x + c.width));
        const maxY = Math.max(...components.map((c) => c.y + c.height));

        // Update positions relative to group
        components.forEach((comp) => {
          const index = state.project.uiComponents.findIndex((c) => c.id === comp.id);
          if (index !== -1) {
            state.project.uiComponents[index].groupId = nanoid();
            state.project.uiComponents[index].groupX = comp.x - minX;
            state.project.uiComponents[index].groupY = comp.y - minY;
          }
        });

        state.selectedUIComponents = [];
        state.isDirty = true;
        state.canUndo = historyManager.canUndo();
        state.canRedo = historyManager.canRedo();
      });
    },

    deleteSelectedComponents: () => {
      const { project, selectedUIComponents } = get();
      if (selectedUIComponents.length === 0) return;

      historyManager.push(project, `Delete ${selectedUIComponents.length} components`);
      set((state) => {
        state.project.uiComponents = state.project.uiComponents.filter(
          (c) => !selectedUIComponents.includes(c.id)
        );
        state.selectedUIComponents = [];
        state.selectedUIComponent = null;
        state.isDirty = true;
        state.canUndo = historyManager.canUndo();
        state.canRedo = historyManager.canRedo();
      });
    },

    // DSP Designer actions
    addDSPNode: (node) => {
      const { project } = get();
      historyManager.push(project, `Add ${node.type} node`);
      set((state) => {
        // Add default parameters if not provided
        const parameters = node.parameters && node.parameters.length > 0
          ? node.parameters
          : getDefaultParametersForNodeType(node.type);

        // Ensure inputs and outputs are always defined
        const inputs = node.inputs || ['input'];
        const outputs = node.outputs || ['output'];

        const newNode = { ...node, id: nanoid(), parameters, inputs, outputs };
        state.project.dspGraph.nodes.push(newNode);
        state.isDirty = true;
        state.canUndo = historyManager.canUndo();
        state.canRedo = historyManager.canRedo();
      });
    },

    updateDSPNode: (id, updates) => {
      const { project } = get();
      const node = project.dspGraph.nodes.find((n) => n.id === id);
      if (node && Object.keys(updates).some((key) => key !== 'x' && key !== 'y')) {
        historyManager.push(project, `Update ${node.type} node`);
      }
      set((state) => {
        const index = state.project.dspGraph.nodes.findIndex((n) => n.id === id);
        if (index !== -1) {
          state.project.dspGraph.nodes[index] = {
            ...state.project.dspGraph.nodes[index],
            ...updates,
          };
          state.isDirty = true;
          state.canUndo = historyManager.canUndo();
          state.canRedo = historyManager.canRedo();
        }
      });
    },

    deleteDSPNode: (id) => {
      const { project } = get();
      const node = project.dspGraph.nodes.find((n) => n.id === id);
      if (node) {
        historyManager.push(project, `Delete ${node.type} node`);
      }
      set((state) => {
        state.project.dspGraph.nodes = state.project.dspGraph.nodes.filter((n) => n.id !== id);
        state.project.dspGraph.connections = state.project.dspGraph.connections.filter(
          (c) => c.sourceNodeId !== id && c.targetNodeId !== id
        );
        if (state.selectedDSPNode === id) {
          state.selectedDSPNode = null;
        }
        state.isDirty = true;
        state.canUndo = historyManager.canUndo();
        state.canRedo = historyManager.canRedo();
      });
    },

    selectDSPNode: (id) => set({ selectedDSPNode: id }),

    addConnection: (connection) => {
      const { project } = get();
      historyManager.push(project, 'Add connection');
      set((state) => {
        const newConnection = { ...connection, id: nanoid() };
        state.project.dspGraph.connections.push(newConnection);
        state.isDirty = true;
        state.canUndo = historyManager.canUndo();
        state.canRedo = historyManager.canRedo();
      });
    },

    deleteConnection: (id) => {
      const { project } = get();
      historyManager.push(project, 'Delete connection');
      set((state) => {
        state.project.dspGraph.connections = state.project.dspGraph.connections.filter(
          (c) => c.id !== id
        );
        state.isDirty = true;
        state.canUndo = historyManager.canUndo();
        state.canRedo = historyManager.canRedo();
      });
    },

    copyDSPNode: (id) => {
      const { project } = get();
      const node = project.dspGraph.nodes.find((n) => n.id === id);
      if (node) {
        dspNodeClipboard = JSON.parse(JSON.stringify(node));
      }
    },

    pasteDSPNode: () => {
      if (!dspNodeClipboard) return;
      const { project } = get();
      historyManager.push(project, `Paste ${dspNodeClipboard.type} node`);
      set((state) => {
        const newNode = {
          ...dspNodeClipboard!,
          id: nanoid(),
          x: dspNodeClipboard!.x + 50,
          y: dspNodeClipboard!.y + 50,
        };
        state.project.dspGraph.nodes.push(newNode);
        state.isDirty = true;
        state.canUndo = historyManager.canUndo();
        state.canRedo = historyManager.canRedo();
      });
    },

    // Code actions
    updateCode: (type, code) => set((state) => {
      state.project.code[type] = code;
      state.isDirty = true;
    }),

    updateDSPNodeCode: (id, code) => set((state) => {
      const index = state.project.dspGraph.nodes.findIndex((n) => n.id === id);
      if (index !== -1) {
        state.project.dspGraph.nodes[index].code = code;
        state.isDirty = true;
      }
    }),

    updateUIComponentCode: (id, code) => set((state) => {
      const index = state.project.uiComponents.findIndex((c) => c.id === id);
      if (index !== -1) {
        state.project.uiComponents[index].code = code;
        state.isDirty = true;
      }
    }),

    // History actions
    undo: () => {
      const previousState = historyManager.undo();
      if (previousState) {
        set((state) => {
          state.project = previousState;
          state.isDirty = true;
          state.canUndo = historyManager.canUndo();
          state.canRedo = historyManager.canRedo();
        });
      }
    },

    redo: () => {
      const nextState = historyManager.redo();
      if (nextState) {
        set((state) => {
          state.project = nextState;
          state.isDirty = true;
          state.canUndo = historyManager.canUndo();
          state.canRedo = historyManager.canRedo();
        });
      }
    },

    pushHistory: (description) => {
      const { project } = get();
      historyManager.push(project, description);
      set({
        canUndo: historyManager.canUndo(),
        canRedo: historyManager.canRedo(),
      });
    },

    // Project actions
    saveProject: async (filePath?) => {
      const { project, currentFilePath, saveProjectAs } = get();

      // If no file path exists, open Save As dialog
      if (!filePath && !currentFilePath) {
        return saveProjectAs();
      }

      if (window.electronAPI) {
        try {
          // Use Immer's current() to extract plain value from proxy, then JSON round-trip for safety
          const plainProject = JSON.parse(JSON.stringify(current(project)));

          const result = await window.electronAPI.saveProject(
            plainProject,
            filePath || currentFilePath || undefined
          );

          if (result.success) {
            set({ isDirty: false, currentFilePath: result.path || null });
            import('./toastStore').then(({ toast }) => {
              toast.success(`Saved "${project.name}"`, 2000);
            });
          } else {
            console.error('Failed to save project:', result.error);
            import('./toastStore').then(({ toast }) => {
              toast.error(`Save failed: ${result.error}`, 4000);
            });
          }
        } catch (error: any) {
          console.error('Failed to save project:', error);
          import('./toastStore').then(({ toast }) => {
            toast.error(`Save failed: ${error.message || 'Unknown error'}`, 4000);
          });
        }
      }
    },

    saveProjectAs: async () => {
      const { project } = get();
      if (window.electronAPI) {
        try {
          // Use Immer's current() to extract plain value from proxy, then JSON round-trip for safety
          const plainProject = JSON.parse(JSON.stringify(current(project)));

          const result = await window.electronAPI.saveProject(plainProject);

          if (result.success) {
            set({ isDirty: false, currentFilePath: result.path || null });
            import('./toastStore').then(({ toast }) => {
              toast.success(`Saved "${project.name}"`, 2000);
            });
          } else {
            console.error('Failed to save project:', result.error);
            import('./toastStore').then(({ toast }) => {
              toast.error(`Save failed: ${result.error}`, 4000);
            });
          }
        } catch (error: any) {
          console.error('Failed to save project:', error);
          import('./toastStore').then(({ toast }) => {
            toast.error(`Save failed: ${error.message || 'Unknown error'}`, 4000);
          });
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
