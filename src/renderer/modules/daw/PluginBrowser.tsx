import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { PluginProject } from '@shared/types';
import './PluginBrowser.css';

interface PluginBrowserProps {
  onSelect: (project: PluginProject) => void;
  onClose: () => void;
}

interface RecentProject {
  path: string;
  name: string;
  lastOpened: number;
  project: PluginProject;
}

export function PluginBrowser({ onSelect, onClose }: PluginBrowserProps) {
  const [plugins, setPlugins] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      const result = await window.electronAPI.getRecentProjects();
      if (result.success && result.data) {
        setPlugins(result.data);
      }
    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlugins = plugins.filter(p =>
    p.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPluginInfo = (project: PluginProject) => {
    const nodeCount = project.dspGraph.nodes.length;
    const hasOscillator = project.dspGraph.nodes.some(n => n.type === 'oscillator');
    const type = hasOscillator ? 'Instrument' : 'Effect';

    return { nodeCount, type };
  };

  return (
    <div className="plugin-browser-overlay" onClick={onClose}>
      <div className="plugin-browser" onClick={(e) => e.stopPropagation()}>
        <div className="plugin-browser-header">
          <h2>Select Plugin</h2>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="plugin-browser-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="plugin-browser-content">
          {loading ? (
            <div className="plugin-browser-empty">Loading plugins...</div>
          ) : filteredPlugins.length === 0 ? (
            <div className="plugin-browser-empty">
              {searchQuery ? 'No plugins found matching your search.' : 'No plugins available. Create a plugin in the main editor first.'}
            </div>
          ) : (
            <div className="plugin-list">
              {filteredPlugins.map((recentProject) => {
                const info = getPluginInfo(recentProject.project);

                return (
                  <div
                    key={recentProject.path}
                    className="plugin-item"
                    onClick={() => {
                      onSelect(recentProject.project);
                      onClose();
                    }}
                  >
                    <div className="plugin-item-header">
                      <div className="plugin-name">{recentProject.project.name}</div>
                      <div className="plugin-type-badge">{info.type}</div>
                    </div>

                    {recentProject.project.description && (
                      <div className="plugin-description">
                        {recentProject.project.description}
                      </div>
                    )}

                    <div className="plugin-info">
                      <span>{info.nodeCount} DSP nodes</span>
                      {recentProject.project.uiComponents.length > 0 && (
                        <span> • {recentProject.project.uiComponents.length} UI components</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="plugin-browser-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
