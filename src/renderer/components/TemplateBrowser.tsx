import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import {
  pluginTemplates,
  getAllCategories,
  getTemplatesByCategory,
  searchTemplates,
  createProjectFromTemplate,
  type PluginTemplate,
} from '../utils/PluginTemplates';
import { Search, X, Music, Sliders, Gauge, Waves, Zap } from 'lucide-react';
import './TemplateBrowser.css';

interface TemplateBrowserProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons = {
  synth: Music,
  effect: Sliders,
  utility: Gauge,
  dynamics: Waves,
  modulation: Zap,
};

export function TemplateBrowser({ isOpen, onClose }: TemplateBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<PluginTemplate['category'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { newProject } = useProjectStore();

  if (!isOpen) return null;

  const filteredTemplates =
    searchQuery.trim() !== ''
      ? searchTemplates(searchQuery)
      : selectedCategory === 'all'
      ? pluginTemplates
      : getTemplatesByCategory(selectedCategory);

  const handleSelectTemplate = (template: PluginTemplate) => {
    const project = createProjectFromTemplate(template);
    // Load the template as a new project
    useProjectStore.setState({
      project,
      selectedUIComponent: null,
      selectedUIComponents: [],
      selectedDSPNode: null,
      isDirty: true,
      currentFilePath: null,
    });
    onClose();
  };

  const handleNewBlankProject = () => {
    newProject();
    onClose();
  };

  return (
    <div className="template-browser-overlay" onClick={onClose}>
      <div className="template-browser" onClick={(e) => e.stopPropagation()}>
        <div className="template-browser-header">
          <h2>New Project from Template</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="template-browser-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="template-browser-body">
          <div className="template-categories">
            <button
              className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Templates
            </button>
            {getAllCategories().map((category) => {
              const Icon = categoryIcons[category];
              return (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <Icon size={16} />
                  <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                </button>
              );
            })}
          </div>

          <div className="template-grid">
            {/* Blank Project Card */}
            <div className="template-card blank-card" onClick={handleNewBlankProject}>
              <div className="template-card-icon blank-icon">+</div>
              <div className="template-card-content">
                <h3>Blank Project</h3>
                <p>Start from scratch with an empty canvas</p>
              </div>
            </div>

            {/* Template Cards */}
            {filteredTemplates.map((template) => {
              const Icon = categoryIcons[template.category];
              return (
                <div
                  key={template.id}
                  className="template-card"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="template-card-icon">
                    <Icon size={32} />
                  </div>
                  <div className="template-card-content">
                    <h3>{template.name}</h3>
                    <p>{template.description}</p>
                    <div className="template-tags">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="template-category-badge">
                    {template.category}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="no-results">
              <p>No templates found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
