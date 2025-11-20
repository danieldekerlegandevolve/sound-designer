import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './ModulationNode.css';

/**
 * Modulation Node Component
 * Represents a modulation source (LFO, Envelope, etc.)
 */

interface ModulationNodeData {
  label: string;
  type: string;
  waveform?: string;
  rate?: number;
  depth?: number;
}

const ModulationNode: React.FC<NodeProps<ModulationNodeData>> = ({ data, selected }) => {
  const { label, type, waveform, rate, depth } = data;

  return (
    <div className={`modulation-node ${selected ? 'selected' : ''}`}>
      <div className="modulation-header">
        <span className="modulation-icon">{type === 'lfo' ? '∼' : '◢'}</span>
        <span className="modulation-label">{label}</span>
      </div>

      <div className="modulation-body">
        {type === 'lfo' && (
          <>
            <div className="mod-param">
              <span>Waveform: {waveform || 'sine'}</span>
            </div>
            <div className="mod-param">
              <span>Rate: {rate?.toFixed(2) || 1} Hz</span>
            </div>
            <div className="mod-param">
              <span>Depth: {((depth || 0.5) * 100).toFixed(0)}%</span>
            </div>
            <div className="waveform-preview">
              <svg width="100%" height="30" viewBox="0 0 100 30">
                <path
                  d={generateWaveformPath(waveform || 'sine')}
                  fill="none"
                  stroke="#ff6b6b"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </>
        )}

        {type === 'envelope' && (
          <>
            <div className="envelope-preview">
              <svg width="100%" height="40" viewBox="0 0 100 40">
                <path
                  d="M 0,40 L 20,5 L 40,10 L 80,10 L 100,40"
                  fill="none"
                  stroke="#ff9e67"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="mod-param">
              <span>ADSR Envelope</span>
            </div>
          </>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="mod-out"
        className="modulation-output"
      />
    </div>
  );
};

// Generate SVG path for different waveforms
function generateWaveformPath(waveform: string): string {
  const points = 100;
  const amplitude = 12;
  const offset = 15;

  let path = '';

  for (let i = 0; i <= points; i++) {
    const x = i;
    let y = offset;

    switch (waveform) {
      case 'sine':
        y = offset + amplitude * Math.sin((i / points) * Math.PI * 4);
        break;
      case 'triangle':
        y = offset + amplitude * (2 * Math.abs(2 * ((i / points * 2) % 1) - 1) - 1);
        break;
      case 'square':
        y = offset + amplitude * (Math.sin((i / points) * Math.PI * 4) > 0 ? 1 : -1);
        break;
      case 'sawtooth':
        y = offset + amplitude * (2 * ((i / points * 2) % 1) - 1);
        break;
      default:
        y = offset + amplitude * Math.sin((i / points) * Math.PI * 4);
    }

    path += (i === 0 ? 'M' : ' L') + ` ${x},${y}`;
  }

  return path;
}

export default memo(ModulationNode);
