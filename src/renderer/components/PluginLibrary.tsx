import React, { useState, useEffect } from 'react';
import { X, Search, FolderOpen } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { PluginProject } from '@shared/types';
import './PluginLibrary.css';

interface PluginLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RecentProject {
  path: string;
  name: string;
  updatedAt: string;
  lastOpened: number;
  project: PluginProject;
}

export function PluginLibrary({ isOpen, onClose }: PluginLibraryProps) {
  const { setProject, setCurrentFilePath, markClean } = useProjectStore();
  const [plugins, setPlugins] = useState<RecentProject[]>([]);
  const [filteredPlugins, setFilteredPlugins] = useState<RecentProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'updated'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);

  // Load plugins from recent projects
  const loadPlugins = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getRecentProjects();
      if (result.success && result.data) {
        let sorted = [...result.data];

        // Sort the data
        sorted.sort((a, b) => {
          if (sortBy === 'name') {
            return sortOrder === 'asc'
              ? a.project.name.localeCompare(b.project.name)
              : b.project.name.localeCompare(a.project.name);
          } else {
            return sortOrder === 'asc'
              ? a.lastOpened - b.lastOpened
              : b.lastOpened - a.lastOpened;
          }
        });

        setPlugins(sorted);
        setFilteredPlugins(sorted);
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

  // Filter plugins based on search
  useEffect(() => {
    let filtered = [...plugins];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.project.name.toLowerCase().includes(query) ||
          p.project.description?.toLowerCase().includes(query) ||
          p.project.author?.toLowerCase().includes(query)
      );
    }

    setFilteredPlugins(filtered);
  }, [searchQuery, plugins]);

  const handleLoadPlugin = async (plugin: RecentProject) => {
    try {
      // Load the project from the file
      const result = await window.electronAPI.loadProject(plugin.path);
      if (result.success && result.data) {
        setProject(result.data);
        setCurrentFilePath(result.path || null);
        markClean();
        onClose();
      } else {
        alert(`Failed to load plugin: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Failed to load plugin:', error);
      alert(`Failed to load plugin: ${error.message || 'Unknown error'}`);
    }
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
                <div key={plugin.path} className="plugin-card">
                  <div className="plugin-card-header">
                    <h3 className="plugin-name">{plugin.project.name}</h3>
                    <div className="plugin-actions">
                      <button
                        className="plugin-action-btn load"
                        onClick={() => handleLoadPlugin(plugin)}
                        title="Load Plugin"
                      >
                        <FolderOpen size={16} />
                      </button>
                    </div>
                  </div>

                  {plugin.project.description && (
                    <p className="plugin-description">{plugin.project.description}</p>
                  )}

                  <div className="plugin-meta">
                    <div className="plugin-meta-item">
                      <strong>Version:</strong> {plugin.project.version}
                    </div>
                    {plugin.project.author && (
                      <div className="plugin-meta-item">
                        <strong>Author:</strong> {plugin.project.author}
                      </div>
                    )}
                    <div className="plugin-meta-item">
                      <strong>Modified:</strong> {formatDate(plugin.lastOpened)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="plugin-library-footer">
          <div className="plugin-count">
            {filteredPlugins.length} {filteredPlugins.length === 1 ? 'plugin' : 'plugins'}
            {searchQuery ? ` (filtered from ${plugins.length})` : ''}
          </div>
          <button className="close-footer-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
