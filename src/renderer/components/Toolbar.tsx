import React from 'react';
import { useProjectStore } from '../store/projectStore';
import {
  LayoutDashboard,
  GitBranch,
  Code2,
  Play,
  Save,
  FolderOpen,
  FileDown,
  Settings,
} from 'lucide-react';
import './Toolbar.css';

export function Toolbar() {
  const { selectedMode, setMode, project, saveProject, isDirty } = useProjectStore();

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
        <button className="toolbar-btn" title="Open Project">
          <FolderOpen size={18} />
        </button>
        <button
          className="toolbar-btn"
          onClick={saveProject}
          title="Save Project"
        >
          <Save size={18} />
        </button>
        <button className="toolbar-btn" title="Export Plugin">
          <FileDown size={18} />
        </button>
        <button className="toolbar-btn" title="Settings">
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
