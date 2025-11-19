import { DSPNode, DSPConnection, UIComponent } from './types';

export interface PresetParameter {
  nodeId: string;
  parameterId: string;
  value: any;
}

export interface Preset {
  id: string;
  name: string;
  author: string;
  category: PresetCategory;
  tags: string[];
  description: string;
  isFavorite: boolean;

  // State
  parameters: PresetParameter[];
  dspNodes?: DSPNode[];
  dspConnections?: DSPConnection[];
  uiComponents?: UIComponent[];

  // Metadata
  createdAt: string;
  modifiedAt: string;
  version: string;
  pluginId: string;
  pluginVersion: string;

  // Analytics
  usageCount: number;
  rating?: number;
}

export type PresetCategory =
  | 'bass'
  | 'lead'
  | 'pad'
  | 'pluck'
  | 'fx'
  | 'keys'
  | 'drums'
  | 'vocal'
  | 'experimental'
  | 'init'
  | 'user';

export interface PresetBank {
  id: string;
  name: string;
  author: string;
  description: string;
  presets: Preset[];
  createdAt: string;
  version: string;
}

export interface PresetSearchCriteria {
  query?: string;
  category?: PresetCategory;
  tags?: string[];
  author?: string;
  favorites?: boolean;
  minRating?: number;
}

export interface PresetComparison {
  slotA: Preset | null;
  slotB: Preset | null;
  currentSlot: 'A' | 'B';
}

export const PRESET_CATEGORIES: { value: PresetCategory; label: string; icon: string }[] = [
  { value: 'bass', label: 'Bass', icon: '🎸' },
  { value: 'lead', label: 'Lead', icon: '🎺' },
  { value: 'pad', label: 'Pad', icon: '☁️' },
  { value: 'pluck', label: 'Pluck', icon: '🎹' },
  { value: 'fx', label: 'FX', icon: '✨' },
  { value: 'keys', label: 'Keys', icon: '🎹' },
  { value: 'drums', label: 'Drums', icon: '🥁' },
  { value: 'vocal', label: 'Vocal', icon: '🎤' },
  { value: 'experimental', label: 'Experimental', icon: '🧪' },
  { value: 'init', label: 'Init', icon: '🔄' },
  { value: 'user', label: 'User', icon: '👤' },
];

export const DEFAULT_PRESET: Omit<Preset, 'id' | 'createdAt' | 'modifiedAt'> = {
  name: 'Init',
  author: 'Sound Designer',
  category: 'init',
  tags: ['default'],
  description: 'Initial preset',
  isFavorite: false,
  parameters: [],
  version: '1.0.0',
  pluginId: '',
  pluginVersion: '',
  usageCount: 0,
};
