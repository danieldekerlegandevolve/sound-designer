import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Preset,
  PresetBank,
  PresetSearchCriteria,
  PresetComparison,
  PresetParameter,
  DEFAULT_PRESET,
} from '@shared/presetTypes';
import { nanoid } from 'nanoid';

interface PresetState {
  // Current preset
  currentPreset: Preset | null;

  // Preset library
  presets: Preset[];
  banks: PresetBank[];

  // A/B Comparison
  comparison: PresetComparison;

  // UI State
  selectedCategory: string | null;
  searchQuery: string;
  showFavoritesOnly: boolean;
  sortBy: 'name' | 'date' | 'usage' | 'rating';

  // Actions
  loadPreset: (preset: Preset) => void;
  savePreset: (name: string, overwrite?: boolean) => Preset;
  deletePreset: (id: string) => void;
  updatePreset: (id: string, updates: Partial<Preset>) => void;

  // Favorites
  toggleFavorite: (id: string) => void;

  // A/B Comparison
  setComparisonSlot: (slot: 'A' | 'B', preset: Preset) => void;
  switchComparisonSlot: () => void;
  clearComparison: () => void;

  // Banks
  createBank: (name: string, presets: Preset[]) => PresetBank;
  loadBank: (bank: PresetBank) => void;
  deleteBank: (id: string) => void;

  // Search & Filter
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleFavoritesOnly: () => void;
  setSortBy: (sortBy: 'name' | 'date' | 'usage' | 'rating') => void;
  searchPresets: (criteria: PresetSearchCriteria) => Preset[];

  // Randomization
  randomizeCurrentPreset: () => void;
  generateRandomPreset: () => Preset;

  // Import/Export
  exportPreset: (id: string) => string;
  importPreset: (data: string) => Preset;
  exportBank: (id: string) => string;
  importBank: (data: string) => PresetBank;

  // Utilities
  duplicatePreset: (id: string) => Preset;
  resetToInit: () => void;
}

export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      currentPreset: null,
      presets: [],
      banks: [],
      comparison: {
        slotA: null,
        slotB: null,
        currentSlot: 'A',
      },
      selectedCategory: null,
      searchQuery: '',
      showFavoritesOnly: false,
      sortBy: 'name',

      loadPreset: (preset) => {
        set({ currentPreset: preset });

        // Update usage count
        const presets = get().presets.map((p) =>
          p.id === preset.id ? { ...p, usageCount: p.usageCount + 1 } : p
        );
        set({ presets });
      },

      savePreset: (name, overwrite = false) => {
        const { currentPreset, presets } = get();

        if (!currentPreset) {
          throw new Error('No current preset to save');
        }

        const existingPreset = presets.find((p) => p.name === name);

        if (existingPreset && !overwrite) {
          throw new Error('Preset with this name already exists');
        }

        const preset: Preset = existingPreset && overwrite
          ? {
              ...existingPreset,
              parameters: currentPreset.parameters,
              modifiedAt: new Date().toISOString(),
            }
          : {
              ...DEFAULT_PRESET,
              id: nanoid(),
              name,
              parameters: currentPreset.parameters,
              category: 'user',
              createdAt: new Date().toISOString(),
              modifiedAt: new Date().toISOString(),
              pluginId: currentPreset.pluginId,
              pluginVersion: currentPreset.pluginVersion,
            };

        if (existingPreset && overwrite) {
          set({
            presets: presets.map((p) => (p.id === preset.id ? preset : p)),
            currentPreset: preset,
          });
        } else {
          set({
            presets: [...presets, preset],
            currentPreset: preset,
          });
        }

        return preset;
      },

      deletePreset: (id) => {
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
          currentPreset: state.currentPreset?.id === id ? null : state.currentPreset,
        }));
      },

      updatePreset: (id, updates) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id
              ? { ...p, ...updates, modifiedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      toggleFavorite: (id) => {
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
        }));
      },

      setComparisonSlot: (slot, preset) => {
        set((state) => ({
          comparison: {
            ...state.comparison,
            [slot === 'A' ? 'slotA' : 'slotB']: preset,
          },
        }));
      },

      switchComparisonSlot: () => {
        const { comparison } = get();
        const newSlot = comparison.currentSlot === 'A' ? 'B' : 'A';
        const preset = newSlot === 'A' ? comparison.slotA : comparison.slotB;

        if (preset) {
          get().loadPreset(preset);
        }

        set((state) => ({
          comparison: {
            ...state.comparison,
            currentSlot: newSlot,
          },
        }));
      },

      clearComparison: () => {
        set({
          comparison: {
            slotA: null,
            slotB: null,
            currentSlot: 'A',
          },
        });
      },

      createBank: (name, presets) => {
        const bank: PresetBank = {
          id: nanoid(),
          name,
          author: 'User',
          description: `Bank containing ${presets.length} presets`,
          presets,
          createdAt: new Date().toISOString(),
          version: '1.0.0',
        };

        set((state) => ({
          banks: [...state.banks, bank],
        }));

        return bank;
      },

      loadBank: (bank) => {
        set((state) => ({
          presets: [...state.presets, ...bank.presets.filter(
            (bp) => !state.presets.find((p) => p.id === bp.id)
          )],
          banks: [...state.banks, bank],
        }));
      },

      deleteBank: (id) => {
        set((state) => ({
          banks: state.banks.filter((b) => b.id !== id),
        }));
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      toggleFavoritesOnly: () => set((state) => ({
        showFavoritesOnly: !state.showFavoritesOnly
      })),

      setSortBy: (sortBy) => set({ sortBy }),

      searchPresets: (criteria) => {
        let results = get().presets;

        if (criteria.query) {
          const query = criteria.query.toLowerCase();
          results = results.filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.description.toLowerCase().includes(query) ||
              p.tags.some((t) => t.toLowerCase().includes(query))
          );
        }

        if (criteria.category) {
          results = results.filter((p) => p.category === criteria.category);
        }

        if (criteria.tags && criteria.tags.length > 0) {
          results = results.filter((p) =>
            criteria.tags!.some((t) => p.tags.includes(t))
          );
        }

        if (criteria.author) {
          results = results.filter((p) => p.author === criteria.author);
        }

        if (criteria.favorites) {
          results = results.filter((p) => p.isFavorite);
        }

        if (criteria.minRating) {
          results = results.filter((p) => (p.rating || 0) >= criteria.minRating!);
        }

        return results;
      },

      randomizeCurrentPreset: () => {
        const { currentPreset } = get();
        if (!currentPreset) return;

        const randomizedParameters = currentPreset.parameters.map((param) => ({
          ...param,
          value: Math.random(), // Simplified - should respect parameter ranges
        }));

        set({
          currentPreset: {
            ...currentPreset,
            parameters: randomizedParameters,
          },
        });
      },

      generateRandomPreset: () => {
        const preset: Preset = {
          ...DEFAULT_PRESET,
          id: nanoid(),
          name: `Random ${Date.now()}`,
          category: 'experimental',
          tags: ['random'],
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          parameters: [], // Would be populated with random values
        };

        set((state) => ({
          presets: [...state.presets, preset],
        }));

        return preset;
      },

      exportPreset: (id) => {
        const preset = get().presets.find((p) => p.id === id);
        if (!preset) throw new Error('Preset not found');
        return JSON.stringify(preset, null, 2);
      },

      importPreset: (data) => {
        const preset: Preset = JSON.parse(data);
        preset.id = nanoid(); // Generate new ID to avoid conflicts

        set((state) => ({
          presets: [...state.presets, preset],
        }));

        return preset;
      },

      exportBank: (id) => {
        const bank = get().banks.find((b) => b.id === id);
        if (!bank) throw new Error('Bank not found');
        return JSON.stringify(bank, null, 2);
      },

      importBank: (data) => {
        const bank: PresetBank = JSON.parse(data);
        bank.id = nanoid();
        bank.presets = bank.presets.map((p) => ({ ...p, id: nanoid() }));

        get().loadBank(bank);
        return bank;
      },

      duplicatePreset: (id) => {
        const preset = get().presets.find((p) => p.id === id);
        if (!preset) throw new Error('Preset not found');

        const duplicate: Preset = {
          ...preset,
          id: nanoid(),
          name: `${preset.name} (Copy)`,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          usageCount: 0,
        };

        set((state) => ({
          presets: [...state.presets, duplicate],
        }));

        return duplicate;
      },

      resetToInit: () => {
        const initPreset: Preset = {
          ...DEFAULT_PRESET,
          id: nanoid(),
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        };

        set({ currentPreset: initPreset });
      },
    }),
    {
      name: 'preset-storage',
      partialize: (state) => ({
        presets: state.presets,
        banks: state.banks,
      }),
    }
  )
);
