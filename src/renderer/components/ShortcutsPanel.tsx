/**
 * Keyboard Shortcuts Reference Panel
 *
 * Displays all available keyboard shortcuts organized by category
 */

import React, { useState, useEffect } from 'react';
import { ShortcutDoc } from '../../shared/helpTypes';
import { getHelpContentManager } from '../utils/helpContentManager';

export interface ShortcutsPanelProps {
  onClose: () => void;
}

export function ShortcutsPanel({ onClose }: ShortcutsPanelProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const helpManager = getHelpContentManager();
    setShortcuts(helpManager.getAllShortcuts());
  }, []);

  // Get unique categories
  const categories = Array.from(
    new Set(shortcuts.map((shortcut) => shortcut.category))
  ).sort();

  // Filter shortcuts
  const filteredShortcuts = shortcuts.filter((shortcut) => {
    // Category filter
    if (selectedCategory && shortcut.category !== selectedCategory) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        shortcut.action.toLowerCase().includes(search) ||
        shortcut.description.toLowerCase().includes(search) ||
        shortcut.keys.toLowerCase().includes(search)
      );
    }

    return true;
  });

  // Group shortcuts by category
  const groupedShortcuts = categories.reduce((acc, category) => {
    acc[category] = filteredShortcuts.filter((s) => s.category === category);
    return acc;
  }, {} as Record<string, ShortcutDoc[]>);

  return (
    <div className="shortcuts-panel">
      <div className="shortcuts-header">
        <h2>Keyboard Shortcuts</h2>
        <button className="shortcuts-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="shortcuts-toolbar">
        {/* Search */}
        <div className="shortcuts-search">
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="shortcuts-search-input"
          />
        </div>

        {/* Category filter */}
        <div className="shortcuts-categories">
          <button
            className={`category-button ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`category-button ${
                selectedCategory === category ? 'active' : ''
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {formatCategoryName(category)}
            </button>
          ))}
        </div>
      </div>

      <div className="shortcuts-content">
        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => {
          if (categoryShortcuts.length === 0) return null;

          return (
            <div key={category} className="shortcuts-category">
              <h3 className="shortcuts-category-title">
                {formatCategoryName(category)}
              </h3>

              <div className="shortcuts-list">
                {categoryShortcuts.map((shortcut) => (
                  <div key={shortcut.id} className="shortcut-item">
                    <div className="shortcut-info">
                      <div className="shortcut-action">{shortcut.action}</div>
                      <div className="shortcut-description">
                        {shortcut.description}
                      </div>
                      {shortcut.context && (
                        <div className="shortcut-context">
                          Context: {shortcut.context}
                        </div>
                      )}
                    </div>
                    <div className="shortcut-keys">
                      {renderKeys(shortcut.keys)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredShortcuts.length === 0 && (
          <div className="shortcuts-empty">
            <p>No shortcuts found matching your search.</p>
          </div>
        )}
      </div>

      <div className="shortcuts-footer">
        <p className="shortcuts-tip">
          💡 Tip: You can also press <kbd>?</kbd> anytime to open this panel
        </p>
      </div>
    </div>
  );
}

/**
 * Format category name for display
 */
function formatCategoryName(category: string): string {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Render keyboard keys with proper formatting
 */
function renderKeys(keys: string): React.ReactNode {
  const parts = keys.split('+');
  return (
    <div className="key-combination">
      {parts.map((key, index) => (
        <React.Fragment key={index}>
          <kbd className="key">{key.trim()}</kbd>
          {index < parts.length - 1 && <span className="key-separator">+</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Shortcut badge component - shows a single shortcut inline
 */
export interface ShortcutBadgeProps {
  keys: string;
  description?: string;
}

export function ShortcutBadge({ keys, description }: ShortcutBadgeProps) {
  return (
    <span className="shortcut-badge" title={description}>
      {renderKeys(keys)}
    </span>
  );
}
