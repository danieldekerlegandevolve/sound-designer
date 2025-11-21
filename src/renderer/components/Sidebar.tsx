import React from 'react';
import { useProjectStore } from '../store/projectStore';
import { Plus } from 'lucide-react';
import './Sidebar.css';

export function Sidebar() {
  const { selectedMode, project, addUIComponent, addDSPNode } = useProjectStore();

  const uiComponentTypes = [
    { type: 'knob', label: 'Knob', icon: '⚙️' },
    { type: 'slider', label: 'Slider', icon: '🎚️' },
    { type: 'button', label: 'Button', icon: '🔘' },
    { type: 'toggle', label: 'Toggle', icon: '🔲' },
    { type: 'display', label: 'Display', icon: '📊' },
    { type: 'waveform', label: 'Waveform', icon: '〰️' },
    { type: 'keyboard', label: 'Keyboard', icon: '🎹' },
    { type: 'xy-pad', label: 'XY Pad', icon: '⊞' },
  ];

  const dspNodeTypes = [
    { type: 'oscillator', label: 'Oscillator', color: '#4ade80' },
    { type: 'filter', label: 'Filter', color: '#4a9eff' },
    { type: 'envelope', label: 'Envelope', color: '#fb923c' },
    { type: 'lfo', label: 'LFO', color: '#a78bfa' },
    { type: 'gain', label: 'Gain', color: '#fbbf24' },
    { type: 'delay', label: 'Delay', color: '#ec4899' },
    { type: 'reverb', label: 'Reverb', color: '#8b5cf6' },
    { type: 'distortion', label: 'Distortion', color: '#ef4444' },
    { type: 'compressor', label: 'Compressor', color: '#14b8a6' },
    { type: 'eq', label: 'EQ', color: '#06b6d4' },
    { type: 'mixer', label: 'Mixer', color: '#64748b' },
    { type: 'noise', label: 'Noise Generator', color: '#f59e0b' },
    { type: 'ringmod', label: 'Ring Modulator', color: '#10b981' },
    { type: 'bitcrusher', label: 'Bit Crusher', color: '#f97316' },
  ];

  const handleAddUIComponent = (type: string) => {
    addUIComponent({
      type: type as any,
      x: 100,
      y: 100,
      width: type === 'knob' ? 80 : 200,
      height: type === 'knob' ? 80 : type === 'slider' ? 30 : 40,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
      properties: {},
      style: {},
    });
  };

  const handleAddDSPNode = (type: string) => {
    addDSPNode({
      type: type as any,
      x: 200,
      y: 200,
      parameters: [],
      inputs: ['input'],
      outputs: ['output'],
    });
  };

  const handleDragStart = (e: React.DragEvent, type: string, mode: 'ui' | 'dsp') => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({ type, mode }));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Components</h3>
      </div>

      <div className="sidebar-content">
        {selectedMode === 'ui' && (
          <div className="component-list">
            <div className="component-category">UI Components</div>
            {uiComponentTypes.map((comp) => (
              <button
                key={comp.type}
                className="component-item"
                draggable
                onDragStart={(e) => handleDragStart(e, comp.type, 'ui')}
                onClick={() => handleAddUIComponent(comp.type)}
                title="Drag to canvas or click to add"
              >
                <span className="component-icon">{comp.icon}</span>
                <span className="component-label">{comp.label}</span>
                <Plus size={14} className="add-icon" />
              </button>
            ))}
          </div>
        )}

        {selectedMode === 'dsp' && (
          <div className="component-list">
            <div className="component-category">DSP Nodes</div>
            {dspNodeTypes.map((node) => (
              <button
                key={node.type}
                className="component-item"
                draggable
                onDragStart={(e) => handleDragStart(e, node.type, 'dsp')}
                onClick={() => handleAddDSPNode(node.type)}
                title="Drag to graph or click to add"
              >
                <span
                  className="component-color"
                  style={{ backgroundColor: node.color }}
                />
                <span className="component-label">{node.label}</span>
                <Plus size={14} className="add-icon" />
              </button>
            ))}
          </div>
        )}

        {selectedMode === 'code' && (
          <div className="component-list">
            <div className="component-category">Code Files</div>
            <div className="info-text">
              Edit DSP processing, UI customization, and helper functions.
            </div>
          </div>
        )}

        {selectedMode === 'preview' && (
          <div className="component-list">
            <div className="component-category">Preview Controls</div>
            <div className="info-text">
              Test your plugin with real-time audio processing.
            </div>
          </div>
        )}

        {selectedMode === 'daw' && (
          <div className="component-list">
            <div className="component-category">DAW</div>
            <div className="info-text">
              Create musical arrangements with your plugins. Add tracks, create MIDI clips, and test plugins together.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
