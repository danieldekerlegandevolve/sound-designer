import React, { useState, useEffect } from 'react';
import { X, Search, Trash2, FolderOpen, Tag } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import './PluginLibrary.css';

interface PluginLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PluginListItem {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export function PluginLibrary({ isOpen, onClose }: PluginLibraryProps) {
  const { setProject, setCurrentFilePath, markClean } = useProjectStore();
  const [plugins, setPlugins] = useState<PluginListItem[]>([]);
  const [filteredPlugins, setFilteredPlugins] = useState<PluginListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);

  // Load plugins from database
  const loadPlugins = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.listPlugins({ sortBy, sortOrder });
      if (result.success) {
        setPlugins(result.data);
        setFilteredPlugins(result.data);
      }

      const tagsResult = await window.electronAPI.getAllTags();
      if (tagsResult.success) {
        setAllTags(tagsResult.data);
      }
    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load plugins when opened
  useEffect(() => {
    if (isOpen) {
      loadPlugins();
    }
  }, [isOpen, sortBy, sortOrder]);

  // Filter plugins based on search and tags
  useEffect(() => {
    let filtered = [...plugins];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.author.toLowerCase().includes(query)
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) =>
        selectedTags.some((tag) => p.tags.includes(tag))
      );
    }

    setFilteredPlugins(filtered);
  }, [searchQuery, selectedTags, plugins]);

  const handleLoadPlugin = async (id: string) => {
    try {
      const result = await window.electronAPI.getPluginFromDB(id);
      if (result.success && result.data) {
        setProject(result.data);
        setCurrentFilePath(null); // Mark as unsaved
        markClean();
        onClose();
      }
    } catch (error) {
      console.error('Failed to load plugin:', error);
      alert('Failed to load plugin from database');
    }
  };

  const handleDeletePlugin = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from your library?`)) {
      return;
    }

    try {
      const result = await window.electronAPI.deletePluginFromDB(id);
      if (result.success) {
        loadPlugins(); // Reload the list
      }
    } catch (error) {
      console.error('Failed to delete plugin:', error);
      alert('Failed to delete plugin');
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!isOpen) return null;

  return (
    <div className="plugin-library-overlay" onClick={onClose}>
      <div className="plugin-library" onClick={(e) => e.stopPropagation()}>
        <div className="plugin-library-header">
          <h2>Plugin Library</h2>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="plugin-library-filters">
          {/* Search */}
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Sort controls */}
          <div className="sort-controls">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="name">Name</option>
              <option value="created">Created</option>
              <option value="updated">Last Modified</option>
            </select>
            <button
              className="sort-order-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="tag-filters">
            <Tag size={14} />
            <div className="tag-list">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="plugin-library-content">
          {loading ? (
            <div className="plugin-library-loading">Loading plugins...</div>
          ) : filteredPlugins.length === 0 ? (
            <div className="plugin-library-empty">
              {plugins.length === 0 ? (
                <>
                  <p>No plugins saved yet.</p>
                  <p className="help-text">
                    Save your current project to the library using Ctrl+S or the Save button.
                  </p>
                </>
              ) : (
                <p>No plugins match your search criteria.</p>
              )}
            </div>
          ) : (
            <div className="plugin-grid">
              {filteredPlugins.map((plugin) => (
                <div key={plugin.id} className="plugin-card">
                  <div className="plugin-card-header">
                    <h3 className="plugin-name">{plugin.name}</h3>
                    <div className="plugin-actions">
                      <button
                        className="plugin-action-btn load"
                        onClick={() => handleLoadPlugin(plugin.id)}
                        title="Load Plugin"
                      >
                        <FolderOpen size={16} />
                      </button>
                      <button
                        className="plugin-action-btn delete"
                        onClick={() => handleDeletePlugin(plugin.id, plugin.name)}
                        title="Delete Plugin"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {plugin.description && (
                    <p className="plugin-description">{plugin.description}</p>
                  )}

                  <div className="plugin-meta">
                    <div className="plugin-meta-item">
                      <strong>Version:</strong> {plugin.version}
                    </div>
                    {plugin.author && (
                      <div className="plugin-meta-item">
                        <strong>Author:</strong> {plugin.author}
                      </div>
                    )}
                    <div className="plugin-meta-item">
                      <strong>Modified:</strong> {formatDate(plugin.updatedAt)}
                    </div>
                  </div>

                  {plugin.tags.length > 0 && (
                    <div className="plugin-tags">
                      {plugin.tags.map((tag) => (
                        <span key={tag} className="plugin-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="plugin-library-footer">
          <div className="plugin-count">
            {filteredPlugins.length} {filteredPlugins.length === 1 ? 'plugin' : 'plugins'}
            {searchQuery || selectedTags.length > 0 ? ` (filtered from ${plugins.length})` : ''}
          </div>
          <button className="close-footer-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
