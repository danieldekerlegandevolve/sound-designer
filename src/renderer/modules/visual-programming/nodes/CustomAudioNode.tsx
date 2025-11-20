import React, { memo, useMemo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './CustomAudioNode.css';

/**
 * Custom Audio Node Component
 * Represents an audio processing node in the visual graph
 */

interface AudioNodeData {
  label: string;
  type: string;
  parameters?: any[];
  debugMode?: boolean;
  cpuUsage?: number;
  audioLevel?: number;
}

const CustomAudioNode: React.FC<NodeProps<AudioNodeData>> = ({ data, selected }) => {
  const { label, type, parameters, debugMode, cpuUsage, audioLevel } = data;

  // Determine node color based on type
  const nodeColor = useMemo(() => {
    const colorMap: Record<string, string> = {
      oscillator: '#ff6b6b',
      filter: '#4a9eff',
      delay: '#51cf66',
      reverb: '#845ef7',
      compressor: '#ffa94d',
      gain: '#66d9e8',
      lfo: '#ff8787',
      envelope: '#ff9e67',
      default: '#868e96',
    };

    return colorMap[type] || colorMap.default;
  }, [type]);

  // Determine handles based on node type
  const { hasInput, hasOutput, hasModInput, hasModOutput } = useMemo(() => {
    const sources = ['oscillator', 'noise', 'sampler'];
    const modulators = ['lfo', 'envelope', 'sequencer'];

    return {
      hasInput: !sources.includes(type),
      hasOutput: true,
      hasModInput: !modulators.includes(type),
      hasModOutput: modulators.includes(type),
    };
  }, [type]);

  return (
    <div className={`custom-audio-node ${selected ? 'selected' : ''}`} style={{ borderColor: nodeColor }}>
      {/* Input Handles */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="audio-in"
          className="audio-handle"
          style={{ background: nodeColor }}
        />
      )}

      {hasModInput && (
        <Handle
          type="target"
          position={Position.Top}
          id="mod-in"
          className="modulation-handle"
          style={{ background: '#ff6b6b' }}
        />
      )}

      {/* Node Content */}
      <div className="node-header" style={{ background: nodeColor }}>
        <span className="node-icon">{getNodeIcon(type)}</span>
        <span className="node-label">{label}</span>
      </div>

      <div className="node-body">
        {parameters && parameters.length > 0 && (
          <div className="node-parameters">
            {parameters.slice(0, 2).map((param, index) => (
              <div key={index} className="mini-parameter">
                <span className="param-name">{param.name}</span>
                <div className="param-bar">
                  <div
                    className="param-fill"
                    style={{
                      width: `${((param.value - param.min) / (param.max - param.min)) * 100}%`,
                      background: nodeColor,
                    }}
                  />
                </div>
              </div>
            ))}
            {parameters.length > 2 && (
              <div className="param-more">+{parameters.length - 2} more</div>
            )}
          </div>
        )}

        {/* Debug Info */}
        {debugMode && (
          <div className="debug-info">
            <div className="debug-item">
              <span>CPU:</span>
              <span>{cpuUsage?.toFixed(1) || 0}%</span>
            </div>
            <div className="debug-item">
              <span>Level:</span>
              <div className="level-meter">
                <div
                  className="level-fill"
                  style={{ width: `${(audioLevel || 0) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Output Handles */}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          id="audio-out"
          className="audio-handle"
          style={{ background: nodeColor }}
        />
      )}

      {hasModOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          id="mod-out"
          className="modulation-handle"
          style={{ background: '#ff6b6b' }}
        />
      )}
    </div>
  );
};

// Helper function to get node icon
function getNodeIcon(type: string): string {
  const iconMap: Record<string, string> = {
    oscillator: '∿',
    filter: '⚡',
    delay: '↻',
    reverb: '◐',
    compressor: '⊓',
    gain: '▲',
    lfo: '∼',
    envelope: '◢',
    mixer: '⊞',
    analyser: '◈',
    default: '●',
  };

  return iconMap[type] || iconMap.default;
}

export default memo(CustomAudioNode);
