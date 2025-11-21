import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { DSPNode } from '@shared/types';
import { useProjectStore } from '../../store/projectStore';
import './DSPNodeComponent.css';

const nodeColors: Record<string, string> = {
  oscillator: '#4ade80',
  filter: '#4a9eff',
  envelope: '#fb923c',
  lfo: '#a78bfa',
  gain: '#fbbf24',
  delay: '#ec4899',
  reverb: '#8b5cf6',
  distortion: '#ef4444',
  compressor: '#14b8a6',
  eq: '#06b6d4',
  mixer: '#64748b',
  noise: '#f59e0b',
  ringmod: '#10b981',
  bitcrusher: '#f97316',
};

export function DSPNodeComponent({ id, data, selected }: NodeProps<DSPNode>) {
  const { selectDSPNode, deleteDSPNode } = useProjectStore();
  const node = data as DSPNode;

  const handleClick = () => {
    selectDSPNode(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDSPNode(id);
  };

  const color = nodeColors[node.type] || '#64748b';

  // Ensure inputs and outputs are arrays (handle undefined case)
  const inputs = node.inputs || [];
  const outputs = node.outputs || [];

  return (
    <div
      className={`dsp-node ${selected ? 'selected' : ''}`}
      onClick={handleClick}
      style={{ borderColor: color }}
    >
      <div className="node-header" style={{ backgroundColor: color }}>
        <span className="node-type">{node.type.toUpperCase()}</span>
        <button className="node-delete-btn" onClick={handleDelete}>
          ×
        </button>
      </div>

      <div className="node-body">
        {node.parameters && node.parameters.length > 0 ? (
          <div className="node-parameters">
            {node.parameters.slice(0, 3).map((param) => (
              <div key={param.id} className="node-parameter">
                <span className="param-name">{param.name}</span>
                <span className="param-value">
                  {typeof param.value === 'number' ? param.value.toFixed(2) : param.value}
                  {param.unit && ` ${param.unit}`}
                </span>
              </div>
            ))}
            {node.parameters.length > 3 && (
              <div className="param-more">+{node.parameters.length - 3} more</div>
            )}
          </div>
        ) : (
          <div className="node-empty">No parameters</div>
        )}
      </div>

      {inputs.map((input, i) => (
        <Handle
          key={`in-${i}`}
          type="target"
          position={Position.Left}
          id={input}
          style={{ top: `${((i + 1) * 100) / (inputs.length + 1)}%`, backgroundColor: color }}
        />
      ))}

      {outputs.map((output, i) => (
        <Handle
          key={`out-${i}`}
          type="source"
          position={Position.Right}
          id={output}
          style={{
            top: `${((i + 1) * 100) / (outputs.length + 1)}%`,
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}
