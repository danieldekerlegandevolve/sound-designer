/**
 * Node Palette
 *
 * Palette of available audio nodes that can be added to the graph
 */

import React, { useState } from 'react';
import { AudioNodeType } from '../../shared/audioGraphTypes';
import { nodeTemplates, getNodeCategories } from '../audio/nodeTemplates';
import { getAudioGraphManager } from '../audio/audioGraphManager';

export interface NodePaletteProps {
  onNodeCreate?: (nodeId: string) => void;
}

export function NodePalette({ onNodeCreate }: NodePaletteProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('source');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = getNodeCategories();
  const audioGraphManager = getAudioGraphManager();

  // Filter nodes by category and search
  const filteredNodes = nodeTemplates.filter((template) => {
    const matchesCategory = template.category === selectedCategory;
    const matchesSearch = searchQuery
      ? template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesCategory && matchesSearch;
  });

  const handleNodeClick = async (type: AudioNodeType) => {
    try {
      // Create node at center of viewport
      const node = await audioGraphManager.createNode(type, {
        x: 100,
        y: 100,
      });

      if (onNodeCreate) {
        onNodeCreate(node.id);
      }

      console.log('Created node:', node.name);
    } catch (error) {
      console.error('Failed to create node:', error);
    }
  };

  return (
    <div className="node-palette">
      <div className="palette-header">
        <h3>Node Palette</h3>
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="palette-search"
        />
      </div>

      <div className="palette-categories">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {formatCategoryName(category)}
          </button>
        ))}
      </div>

      <div className="palette-nodes">
        {filteredNodes.length === 0 ? (
          <div className="palette-empty">No nodes found</div>
        ) : (
          filteredNodes.map((template) => (
            <div
              key={template.type}
              className="palette-node"
              onClick={() => handleNodeClick(template.type)}
              style={{ borderLeftColor: template.color }}
            >
              <div className="palette-node-icon">{template.icon}</div>
              <div className="palette-node-info">
                <div className="palette-node-name">{template.name}</div>
                <div className="palette-node-desc">{template.description}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatCategoryName(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
