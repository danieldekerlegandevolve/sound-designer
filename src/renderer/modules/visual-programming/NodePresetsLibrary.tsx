import React, { useState, useMemo } from 'react';
import './NodePresetsLibrary.css';

/**
 * Node Presets Library
 * Categorized library of pre-configured node chains and patches
 */

export interface NodePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  nodes: any[];
  connections: any[];
  thumbnail?: string;
  author?: string;
  rating?: number;
}

const samplePresets: NodePreset[] = [
  {
    id: 'preset-1',
    name: 'Classic Subtractive Synth',
    description: 'Oscillator -> Filter -> Envelope -> Output',
    category: 'Synthesis',
    tags: ['synth', 'subtractive', 'classic'],
    nodes: [],
    connections: [],
    author: 'Sound Designer',
    rating: 5,
  },
  {
    id: 'preset-2',
    name: 'Tape Echo',
    description: 'Vintage tape delay with modulation',
    category: 'Effects',
    tags: ['delay', 'echo', 'vintage'],
    nodes: [],
    connections: [],
    author: 'Sound Designer',
    rating: 4,
  },
  {
    id: 'preset-3',
    name: 'Vocoder Chain',
    description: 'Full vocoder processing chain',
    category: 'Effects',
    tags: ['vocoder', 'voice', 'processing'],
    nodes: [],
    connections: [],
    author: 'Sound Designer',
    rating: 4,
  },
  {
    id: 'preset-4',
    name: 'Dynamics Chain',
    description: 'Gate -> Compressor -> Limiter',
    category: 'Dynamics',
    tags: ['mastering', 'dynamics', 'compression'],
    nodes: [],
    connections: [],
    author: 'Sound Designer',
    rating: 5,
  },
  {
    id: 'preset-5',
    name: 'Modulated Filter',
    description: 'Filter with LFO modulation',
    category: 'Filters',
    tags: ['filter', 'modulation', 'lfo'],
    nodes: [],
    connections: [],
    author: 'Sound Designer',
    rating: 4,
  },
  {
    id: 'preset-6',
    name: 'Reverb Send',
    description: 'Parallel reverb processing',
    category: 'Effects',
    tags: ['reverb', 'send', 'parallel'],
    nodes: [],
    connections: [],
    author: 'Sound Designer',
    rating: 5,
  },
];

interface NodePresetsLibraryProps {
  onLoadPreset: (preset: NodePreset) => void;
  onSavePreset?: (preset: Partial<NodePreset>) => void;
}

export const NodePresetsLibrary: React.FC<NodePresetsLibraryProps> = ({
  onLoadPreset,
  onSavePreset,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'recent'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = useMemo(() => {
    const cats = new Set(samplePresets.map((p) => p.category));
    return ['All', ...Array.from(cats)];
  }, []);

  const filteredPresets = useMemo(() => {
    let filtered = samplePresets;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'recent':
          return b.id.localeCompare(a.id);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <div className="node-presets-library">
      <div className="library-header">
        <h2>Node Presets Library</h2>
        <div className="header-controls">
          {onSavePreset && (
            <button onClick={() => onSavePreset({})} className="btn-primary">
              Save Current Graph
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="library-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="name">Name</option>
            <option value="rating">Rating</option>
            <option value="recent">Recent</option>
          </select>

          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Presets Display */}
      <div className={`presets-container ${viewMode}`}>
        {filteredPresets.length > 0 ? (
          filteredPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              viewMode={viewMode}
              onLoad={() => onLoadPreset(preset)}
            />
          ))
        ) : (
          <div className="no-results">
            <p>No presets found</p>
            <p className="hint">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface PresetCardProps {
  preset: NodePreset;
  viewMode: 'grid' | 'list';
  onLoad: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({ preset, viewMode, onLoad }) => {
  return (
    <div className={`preset-card ${viewMode}`}>
      {viewMode === 'grid' && (
        <div className="preset-thumbnail">
          {preset.thumbnail ? (
            <img src={preset.thumbnail} alt={preset.name} />
          ) : (
            <div className="placeholder-thumbnail">
              <span>♪</span>
            </div>
          )}
        </div>
      )}

      <div className="preset-info">
        <div className="preset-header">
          <h3>{preset.name}</h3>
          {preset.rating && (
            <div className="rating">
              {'★'.repeat(preset.rating)}
              {'☆'.repeat(5 - preset.rating)}
            </div>
          )}
        </div>

        <p className="preset-description">{preset.description}</p>

        <div className="preset-meta">
          <span className="category">{preset.category}</span>
          {preset.author && <span className="author">by {preset.author}</span>}
        </div>

        <div className="preset-tags">
          {preset.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="preset-actions">
        <button onClick={onLoad} className="btn-load">
          Load Preset
        </button>
      </div>
    </div>
  );
};

export default NodePresetsLibrary;
