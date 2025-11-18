import React from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { X, Grid, Ruler, Layers } from 'lucide-react';
import './SettingsDialog.css';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const {
    gridSize,
    gridEnabled,
    snapToGrid,
    showRulers,
    showGuides,
    autoArrange,
    showMinimap,
    theme,
    autoSave,
    autoSaveInterval,
    sampleRate,
    bufferSize,
    setGridSize,
    toggleGrid,
    toggleSnapToGrid,
    toggleRulers,
    toggleGuides,
    toggleAutoArrange,
    toggleMinimap,
    setTheme,
    setAutoSave,
    setAutoSaveInterval,
    setSampleRate,
    setBufferSize,
  } = useSettingsStore();

  if (!isOpen) return null;

  return (
    <div className="settings-dialog-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          {/* UI Designer Settings */}
          <div className="settings-section">
            <h3>
              <Layers size={18} />
              UI Designer
            </h3>

            <div className="setting-row">
              <label>
                <input type="checkbox" checked={gridEnabled} onChange={toggleGrid} />
                <span>Show Grid</span>
              </label>
            </div>

            <div className="setting-row">
              <label>
                <input type="checkbox" checked={snapToGrid} onChange={toggleSnapToGrid} />
                <span>Snap to Grid</span>
              </label>
            </div>

            <div className="setting-row">
              <label htmlFor="gridSize">Grid Size</label>
              <div className="slider-group">
                <input
                  id="gridSize"
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                />
                <span className="slider-value">{gridSize}px</span>
              </div>
            </div>

            <div className="setting-row">
              <label>
                <input type="checkbox" checked={showRulers} onChange={toggleRulers} />
                <span>Show Rulers</span>
              </label>
            </div>

            <div className="setting-row">
              <label>
                <input type="checkbox" checked={showGuides} onChange={toggleGuides} />
                <span>Show Alignment Guides</span>
              </label>
            </div>
          </div>

          {/* DSP Designer Settings */}
          <div className="settings-section">
            <h3>
              <Grid size={18} />
              DSP Designer
            </h3>

            <div className="setting-row">
              <label>
                <input type="checkbox" checked={autoArrange} onChange={toggleAutoArrange} />
                <span>Auto-Arrange Nodes</span>
              </label>
            </div>

            <div className="setting-row">
              <label>
                <input type="checkbox" checked={showMinimap} onChange={toggleMinimap} />
                <span>Show Mini-map</span>
              </label>
            </div>
          </div>

          {/* General Settings */}
          <div className="settings-section">
            <h3>General</h3>

            <div className="setting-row">
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            <div className="setting-row">
              <label>
                <input type="checkbox" checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} />
                <span>Enable Auto-Save</span>
              </label>
            </div>

            <div className="setting-row">
              <label htmlFor="autoSaveInterval">Auto-Save Interval</label>
              <div className="slider-group">
                <input
                  id="autoSaveInterval"
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={autoSaveInterval}
                  onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                  disabled={!autoSave}
                />
                <span className="slider-value">{autoSaveInterval} min</span>
              </div>
            </div>
          </div>

          {/* Audio Settings */}
          <div className="settings-section">
            <h3>Audio</h3>

            <div className="setting-row">
              <label htmlFor="sampleRate">Sample Rate</label>
              <select
                id="sampleRate"
                value={sampleRate}
                onChange={(e) => setSampleRate(Number(e.target.value))}
              >
                <option value="44100">44.1 kHz</option>
                <option value="48000">48 kHz</option>
                <option value="88200">88.2 kHz</option>
                <option value="96000">96 kHz</option>
              </select>
            </div>

            <div className="setting-row">
              <label htmlFor="bufferSize">Buffer Size</label>
              <select
                id="bufferSize"
                value={bufferSize}
                onChange={(e) => setBufferSize(Number(e.target.value))}
              >
                <option value="128">128 samples</option>
                <option value="256">256 samples</option>
                <option value="512">512 samples</option>
                <option value="1024">1024 samples</option>
                <option value="2048">2048 samples</option>
              </select>
            </div>

            <div className="setting-info">
              <p><strong>Note:</strong> Lower buffer sizes reduce latency but may increase CPU usage.</p>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="settings-close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
