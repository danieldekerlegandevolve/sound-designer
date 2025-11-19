import React, { useState, useMemo } from 'react';
import { usePresetStore } from '../../store/presetStore';
import {
  Search,
  Star,
  Download,
  Upload,
  Save,
  Trash2,
  Copy,
  Shuffle,
  ArrowLeftRight,
  Filter,
  SortAsc,
} from 'lucide-react';
import { PRESET_CATEGORIES, Preset } from '@shared/presetTypes';
import './PresetBrowser.css';

interface PresetBrowserProps {
  onClose?: () => void;
}

export function PresetBrowser({ onClose }: PresetBrowserProps) {
  const {
    presets,
    currentPreset,
    comparison,
    searchQuery,
    selectedCategory,
    showFavoritesOnly,
    sortBy,
    loadPreset,
    savePreset,
    deletePreset,
    toggleFavorite,
    setSearchQuery,
    setSelectedCategory,
    toggleFavoritesOnly,
    setSortBy,
    setComparisonSlot,
    switchComparisonSlot,
    duplicatePreset,
    randomizeCurrentPreset,
    exportPreset,
    importPreset,
  } = usePresetStore();

  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

  // Filter and sort presets
  const filteredPresets = useMemo(() => {
    let results = [...presets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory) {
      results = results.filter((p) => p.category === selectedCategory);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      results = results.filter((p) => p.isFavorite);
    }

    // Sort
    switch (sortBy) {
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'date':
        results.sort((a, b) =>
          new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()
        );
        break;
      case 'usage':
        results.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'rating':
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return results;
  }, [presets, searchQuery, selectedCategory, showFavoritesOnly, sortBy]);

  const handleSavePreset = () => {
    if (!saveName.trim()) return;

    try {
      savePreset(saveName);
      setShowSaveDialog(false);
      setSaveName('');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleImportPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result as string;
        importPreset(data);
      } catch (error) {
        alert('Failed to import preset');
      }
    };
    reader.readAsText(file);
  };

  const handleExportPreset = (preset: Preset) => {
    const data = exportPreset(preset.id);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${preset.name.replace(/\s+/g, '_')}.preset.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="preset-browser">
      <div className="browser-header">
        <div className="header-top">
          <h2>Preset Browser</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="header-controls">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search presets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="control-buttons">
            <button
              className={`icon-btn ${showFavoritesOnly ? 'active' : ''}`}
              onClick={toggleFavoritesOnly}
              title="Show favorites only"
            >
              <Star size={18} />
            </button>

            <button
              className="icon-btn"
              onClick={() => setShowSaveDialog(true)}
              title="Save current preset"
            >
              <Save size={18} />
            </button>

            <button
              className="icon-btn"
              onClick={randomizeCurrentPreset}
              title="Randomize current preset"
            >
              <Shuffle size={18} />
            </button>

            <label className="icon-btn" title="Import preset">
              <Upload size={18} />
              <input
                type="file"
                accept=".json"
                onChange={handleImportPreset}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        <div className="category-tabs">
          <button
            className={`category-tab ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All ({presets.length})
          </button>
          {PRESET_CATEGORIES.map((cat) => {
            const count = presets.filter((p) => p.category === cat.value).length;
            return (
              <button
                key={cat.value}
                className={`category-tab ${selectedCategory === cat.value ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                <span className="category-icon">{cat.icon}</span>
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="sort-controls">
          <Filter size={14} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date</option>
            <option value="usage">Sort by Usage</option>
            <option value="rating">Sort by Rating</option>
          </select>
        </div>
      </div>

      <div className="browser-content">
        <div className="presets-grid">
          {filteredPresets.length === 0 ? (
            <div className="empty-state">
              <p>No presets found</p>
              <button className="create-preset-btn" onClick={() => setShowSaveDialog(true)}>
                Create Your First Preset
              </button>
            </div>
          ) : (
            filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className={`preset-card ${currentPreset?.id === preset.id ? 'active' : ''} ${
                  selectedPreset?.id === preset.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedPreset(preset)}
                onDoubleClick={() => loadPreset(preset)}
              >
                <div className="preset-card-header">
                  <h4>{preset.name}</h4>
                  <button
                    className={`favorite-btn ${preset.isFavorite ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(preset.id);
                    }}
                  >
                    <Star size={16} fill={preset.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="preset-card-info">
                  <span className="preset-category">
                    {PRESET_CATEGORIES.find((c) => c.value === preset.category)?.icon}{' '}
                    {preset.category}
                  </span>
                  <span className="preset-author">{preset.author}</span>
                </div>

                {preset.description && (
                  <p className="preset-description">{preset.description}</p>
                )}

                <div className="preset-tags">
                  {preset.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="preset-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="preset-card-footer">
                  <span className="usage-count">Used {preset.usageCount}x</span>
                  <div className="preset-actions">
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadPreset(preset);
                      }}
                      title="Load preset"
                    >
                      Load
                    </button>
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setComparisonSlot('A', preset);
                      }}
                      title="Set as A"
                    >
                      A
                    </button>
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setComparisonSlot('B', preset);
                      }}
                      title="Set as B"
                    >
                      B
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedPreset && (
          <div className="preset-details">
            <h3>Preset Details</h3>

            <div className="details-section">
              <label>Name</label>
              <p>{selectedPreset.name}</p>
            </div>

            <div className="details-section">
              <label>Author</label>
              <p>{selectedPreset.author}</p>
            </div>

            <div className="details-section">
              <label>Description</label>
              <p>{selectedPreset.description || 'No description'}</p>
            </div>

            <div className="details-section">
              <label>Category</label>
              <p>{selectedPreset.category}</p>
            </div>

            <div className="details-section">
              <label>Tags</label>
              <div className="tags-list">
                {selectedPreset.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="details-section">
              <label>Created</label>
              <p>{new Date(selectedPreset.createdAt).toLocaleString()}</p>
            </div>

            <div className="details-section">
              <label>Modified</label>
              <p>{new Date(selectedPreset.modifiedAt).toLocaleString()}</p>
            </div>

            <div className="details-actions">
              <button
                className="detail-action-btn primary"
                onClick={() => loadPreset(selectedPreset)}
              >
                Load Preset
              </button>
              <button
                className="detail-action-btn"
                onClick={() => duplicatePreset(selectedPreset.id)}
              >
                <Copy size={16} />
                Duplicate
              </button>
              <button
                className="detail-action-btn"
                onClick={() => handleExportPreset(selectedPreset)}
              >
                <Download size={16} />
                Export
              </button>
              <button
                className="detail-action-btn danger"
                onClick={() => {
                  if (confirm('Delete this preset?')) {
                    deletePreset(selectedPreset.id);
                    setSelectedPreset(null);
                  }
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* A/B Comparison Bar */}
      {(comparison.slotA || comparison.slotB) && (
        <div className="comparison-bar">
          <div className="comparison-slot">
            <span className="slot-label">A</span>
            <span className="slot-name">{comparison.slotA?.name || 'Empty'}</span>
          </div>
          <button className="switch-btn" onClick={switchComparisonSlot}>
            <ArrowLeftRight size={18} />
            Switch (A ↔ B)
          </button>
          <div className="comparison-slot">
            <span className="slot-label">B</span>
            <span className="slot-name">{comparison.slotB?.name || 'Empty'}</span>
          </div>
          <span className="current-indicator">
            Current: <strong>{comparison.currentSlot}</strong>
          </span>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="save-dialog-overlay">
          <div className="save-dialog">
            <h3>Save Preset</h3>
            <input
              type="text"
              placeholder="Preset name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSavePreset()}
              autoFocus
            />
            <div className="dialog-actions">
              <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
              <button className="primary" onClick={handleSavePreset}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
