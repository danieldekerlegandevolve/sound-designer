/**
 * Undo/Redo Toolbar Component
 *
 * Provides UI controls for undo/redo operations
 */

import React, { useState, useEffect } from 'react';
import { getUndoManager } from '../utils/undoManager';
import { UndoRedoState } from '../../shared/undoRedoTypes';
import { Tooltip } from './Tooltip';

export interface UndoRedoToolbarProps {
  showHistory?: boolean;
  compact?: boolean;
}

export function UndoRedoToolbar({ showHistory = false, compact = false }: UndoRedoToolbarProps) {
  const [state, setState] = useState<UndoRedoState>({
    canUndo: false,
    canRedo: false,
    undoDescription: null,
    redoDescription: null,
    historyPosition: -1,
    historySize: 0,
  });

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [history, setHistory] = useState<Array<{ description: string; timestamp: number; isCurrent: boolean }>>([]);

  const undoManager = getUndoManager();

  useEffect(() => {
    // Subscribe to undo/redo state changes
    const unsubscribe = undoManager.subscribe((newState) => {
      setState(newState);
    });

    // Update history
    setHistory(undoManager.getHistory());

    return unsubscribe;
  }, [undoManager]);

  const handleUndo = async () => {
    try {
      await undoManager.undo();
      setHistory(undoManager.getHistory());
    } catch (error) {
      console.error('Undo failed:', error);
    }
  };

  const handleRedo = async () => {
    try {
      await undoManager.redo();
      setHistory(undoManager.getHistory());
    } catch (error) {
      console.error('Redo failed:', error);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear all undo history?')) {
      undoManager.clear();
      setHistory([]);
      setShowHistoryPanel(false);
    }
  };

  if (compact) {
    return (
      <div className="undo-redo-toolbar compact">
        <Tooltip content={state.undoDescription || 'Undo (Ctrl+Z)'} position="bottom">
          <button
            className="toolbar-button"
            onClick={handleUndo}
            disabled={!state.canUndo}
            aria-label="Undo"
          >
            ↶
          </button>
        </Tooltip>

        <Tooltip content={state.redoDescription || 'Redo (Ctrl+Shift+Z)'} position="bottom">
          <button
            className="toolbar-button"
            onClick={handleRedo}
            disabled={!state.canRedo}
            aria-label="Redo"
          >
            ↷
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="undo-redo-toolbar">
      <div className="toolbar-buttons">
        <Tooltip content={state.undoDescription || 'Undo (Ctrl+Z)'} position="bottom">
          <button
            className="toolbar-button undo-button"
            onClick={handleUndo}
            disabled={!state.canUndo}
          >
            <span className="button-icon">↶</span>
            <span className="button-label">Undo</span>
          </button>
        </Tooltip>

        <Tooltip content={state.redoDescription || 'Redo (Ctrl+Shift+Z)'} position="bottom">
          <button
            className="toolbar-button redo-button"
            onClick={handleRedo}
            disabled={!state.canRedo}
          >
            <span className="button-icon">↷</span>
            <span className="button-label">Redo</span>
          </button>
        </Tooltip>

        {showHistory && (
          <button
            className="toolbar-button history-button"
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
          >
            <span className="button-icon">📋</span>
            <span className="button-label">History</span>
          </button>
        )}

        <div className="history-info">
          <span className="history-position">
            {state.historyPosition + 1} / {state.historySize}
          </span>
        </div>
      </div>

      {showHistory && showHistoryPanel && (
        <div className="history-panel">
          <div className="history-panel-header">
            <h3>History</h3>
            <button className="clear-history-button" onClick={handleClearHistory}>
              Clear
            </button>
          </div>

          <div className="history-list">
            {history.length === 0 ? (
              <div className="history-empty">No history</div>
            ) : (
              history.map((item, index) => (
                <div
                  key={index}
                  className={`history-item ${item.isCurrent ? 'current' : ''} ${
                    index > state.historyPosition ? 'future' : 'past'
                  }`}
                >
                  <span className="history-item-description">{item.description}</span>
                  <span className="history-item-time">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Format timestamp as relative time
 */
function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 1000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return new Date(timestamp).toLocaleString();
}
