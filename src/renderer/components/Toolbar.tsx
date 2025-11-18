import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { SettingsDialog } from './SettingsDialog';
import {
  LayoutDashboard,
  GitBranch,
  Code2,
  Play,
  Save,
  FolderOpen,
  FileDown,
  Settings,
  FilePlus,
  Upload,
  Download,
  ChevronDown,
  Undo2,
  Redo2,
} from 'lucide-react';
import './Toolbar.css';

export function Toolbar() {
  const {
    selectedMode,
    setMode,
    project,
    saveProject,
    saveProjectAs,
    loadProject,
    newProject,
    exportAsJSON,
    importFromJSON,
    isDirty,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useProjectStore();

  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const modes = [
    { id: 'ui' as const, label: 'UI Designer', icon: LayoutDashboard },
    { id: 'dsp' as const, label: 'DSP Graph', icon: GitBranch },
    { id: 'code' as const, label: 'Code', icon: Code2 },
    { id: 'preview' as const, label: 'Preview', icon: Play },
  ];

  return (
    <div className="toolbar">
      <div className="toolbar-section toolbar-left">
        <div className="app-title">Sound Designer</div>
        <div className="project-name">
          {project.name}
          {isDirty && <span className="dirty-indicator">*</span>}
        </div>
      </div>

      <div className="toolbar-section toolbar-center">
        <div className="mode-switcher">
          {modes.map((mode) => (
            <button
              key={mode.id}
              className={`mode-btn ${selectedMode === mode.id ? 'active' : ''}`}
              onClick={() => setMode(mode.id)}
              title={mode.label}
            >
              <mode.icon size={18} />
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section toolbar-right">
        {/* Undo/Redo */}
        <button
          className="toolbar-btn"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>
        <button
          className="toolbar-btn"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={18} />
        </button>

        <div className="toolbar-divider" />

        {/* File Menu */}
        <div className="menu-container">
          <button
            className="toolbar-btn menu-btn"
            onClick={() => setShowFileMenu(!showFileMenu)}
            title="File Menu"
          >
            <FolderOpen size={18} />
            <ChevronDown size={14} />
          </button>
          {showFileMenu && (
            <>
              <div
                className="menu-overlay"
                onClick={() => setShowFileMenu(false)}
              />
              <div className="dropdown-menu">
                <button className="menu-item" onClick={() => { newProject(); setShowFileMenu(false); }}>
                  <FilePlus size={16} />
                  <span>New Project</span>
                </button>
                <button className="menu-item" onClick={() => { loadProject(); setShowFileMenu(false); }}>
                  <FolderOpen size={16} />
                  <span>Open Project...</span>
                </button>
                <div className="menu-divider" />
                <button className="menu-item" onClick={() => { saveProject(); setShowFileMenu(false); }}>
                  <Save size={16} />
                  <span>Save</span>
                  <span className="menu-shortcut">Ctrl+S</span>
                </button>
                <button className="menu-item" onClick={() => { saveProjectAs(); setShowFileMenu(false); }}>
                  <Save size={16} />
                  <span>Save As...</span>
                  <span className="menu-shortcut">Ctrl+Shift+S</span>
                </button>
                <div className="menu-divider" />
                <button className="menu-item" onClick={() => { importFromJSON(); setShowFileMenu(false); }}>
                  <Upload size={16} />
                  <span>Import JSON...</span>
                </button>
                <button className="menu-item" onClick={() => { exportAsJSON(); setShowFileMenu(false); }}>
                  <Download size={16} />
                  <span>Export JSON...</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Quick Save */}
        <button
          className={`toolbar-btn ${isDirty ? 'highlight' : ''}`}
          onClick={saveProject}
          title="Save Project (Ctrl+S)"
        >
          <Save size={18} />
        </button>

        {/* Export Menu */}
        <div className="menu-container">
          <button
            className="toolbar-btn menu-btn"
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export"
          >
            <FileDown size={18} />
            <ChevronDown size={14} />
          </button>
          {showExportMenu && (
            <>
              <div
                className="menu-overlay"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="dropdown-menu">
                <button className="menu-item">
                  <FileDown size={16} />
                  <span>Export as VST3...</span>
                </button>
                <button className="menu-item">
                  <FileDown size={16} />
                  <span>Export as AU...</span>
                </button>
                <button className="menu-item">
                  <FileDown size={16} />
                  <span>Export as Web App...</span>
                </button>
                <button className="menu-item">
                  <FileDown size={16} />
                  <span>Export as Standalone...</span>
                </button>
              </div>
            </>
          )}
        </div>

        <button
          className="toolbar-btn"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>

      <SettingsDialog isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
