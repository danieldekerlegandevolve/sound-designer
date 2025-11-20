/**
 * Node Inspector
 *
 * Parameter controls for the selected audio node
 */

import React, { useState, useEffect } from 'react';
import { AudioGraphNode, AudioNodeParameter } from '../../shared/audioGraphTypes';
import { getAudioGraphManager } from '../audio/audioGraphManager';
import { Tooltip } from './Tooltip';

export interface NodeInspectorProps {
  nodeId: string | null;
}

export function NodeInspector({ nodeId }: NodeInspectorProps) {
  const [node, setNode] = useState<AudioGraphNode | null>(null);
  const audioGraphManager = getAudioGraphManager();

  useEffect(() => {
    if (nodeId) {
      const foundNode = audioGraphManager.getNode(nodeId);
      setNode(foundNode || null);
    } else {
      setNode(null);
    }
  }, [nodeId, audioGraphManager]);

  if (!node) {
    return (
      <div className="node-inspector empty">
        <div className="inspector-placeholder">
          <span className="placeholder-icon">🎛️</span>
          <p>Select a node to edit its parameters</p>
        </div>
      </div>
    );
  }

  const handleParameterChange = (parameterId: string, value: number) => {
    try {
      audioGraphManager.setParameter(node.id, parameterId, value);

      // Update local state
      setNode((prevNode) => {
        if (!prevNode) return null;

        return {
          ...prevNode,
          parameters: prevNode.parameters.map((p) =>
            p.id === parameterId ? { ...p, value } : p
          ),
        };
      });
    } catch (error) {
      console.error('Failed to update parameter:', error);
    }
  };

  const handleBypassToggle = () => {
    if (node) {
      node.bypass = !node.bypass;
      setNode({ ...node });
    }
  };

  const handleDeleteNode = () => {
    if (node && confirm(`Delete node "${node.name}"?`)) {
      try {
        audioGraphManager.deleteNode(node.id);
        setNode(null);
      } catch (error) {
        console.error('Failed to delete node:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete node');
      }
    }
  };

  return (
    <div className="node-inspector">
      <div className="inspector-header">
        <div className="node-title">
          <span className="node-color" style={{ backgroundColor: node.color }} />
          <h3>{node.name}</h3>
        </div>

        <div className="inspector-actions">
          <Tooltip content="Bypass node">
            <button
              className={`bypass-btn ${node.bypass ? 'active' : ''}`}
              onClick={handleBypassToggle}
            >
              {node.bypass ? '🔇' : '🔊'}
            </button>
          </Tooltip>

          <Tooltip content="Delete node">
            <button className="delete-btn" onClick={handleDeleteNode}>
              🗑️
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="inspector-content">
        <div className="inspector-section">
          <h4>Parameters</h4>

          {node.parameters.length === 0 ? (
            <div className="no-parameters">No parameters available</div>
          ) : (
            <div className="parameters-list">
              {node.parameters.map((param) => (
                <ParameterControl
                  key={param.id}
                  parameter={param}
                  onChange={(value) => handleParameterChange(param.id, value)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="inspector-section">
          <h4>Connections</h4>

          <div className="connections-info">
            <div className="connection-group">
              <div className="connection-label">Inputs</div>
              {node.inputs.length === 0 ? (
                <div className="connection-empty">No inputs</div>
              ) : (
                node.inputs.map((input) => (
                  <div
                    key={input.id}
                    className={`connection-item ${input.isConnected ? 'connected' : ''}`}
                  >
                    {input.name}
                    {input.isConnected && <span className="connection-status">●</span>}
                  </div>
                ))
              )}
            </div>

            <div className="connection-group">
              <div className="connection-label">Outputs</div>
              {node.outputs.length === 0 ? (
                <div className="connection-empty">No outputs</div>
              ) : (
                node.outputs.map((output) => (
                  <div
                    key={output.id}
                    className={`connection-item ${output.isConnected ? 'connected' : ''}`}
                  >
                    {output.name}
                    {output.isConnected && <span className="connection-status">●</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Parameter Control Component
 */
interface ParameterControlProps {
  parameter: AudioNodeParameter;
  onChange: (value: number) => void;
}

function ParameterControl({ parameter, onChange }: ParameterControlProps) {
  const [localValue, setLocalValue] = useState(parameter.value);

  useEffect(() => {
    setLocalValue(parameter.value);
  }, [parameter.value]);

  const handleChange = (value: number) => {
    setLocalValue(value);
  };

  const handleCommit = () => {
    onChange(localValue);
  };

  const formatValue = (value: number): string => {
    if (parameter.options) {
      return parameter.options[Math.floor(value)] || value.toString();
    }

    const formatted = value.toFixed(parameter.step ? Math.abs(Math.log10(parameter.step)) : 2);
    return parameter.unit ? `${formatted} ${parameter.unit}` : formatted;
  };

  return (
    <div className="parameter-control">
      <div className="parameter-header">
        <label className="parameter-name">{parameter.name}</label>
        <span className="parameter-value">{formatValue(localValue)}</span>
      </div>

      {parameter.options ? (
        <select
          value={Math.floor(localValue)}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            setLocalValue(value);
            onChange(value);
          }}
          className="parameter-select"
        >
          {parameter.options.map((option, index) => (
            <option key={index} value={index}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <div className="parameter-slider-container">
          <input
            type="range"
            min={parameter.min}
            max={parameter.max}
            step={parameter.step || 0.01}
            value={localValue}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            onMouseUp={handleCommit}
            onTouchEnd={handleCommit}
            className="parameter-slider"
          />

          <div className="parameter-input-container">
            <input
              type="number"
              min={parameter.min}
              max={parameter.max}
              step={parameter.step || 0.01}
              value={localValue.toFixed(2)}
              onChange={(e) => handleChange(parseFloat(e.target.value))}
              onBlur={handleCommit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCommit();
                  e.currentTarget.blur();
                }
              }}
              className="parameter-input"
            />
          </div>
        </div>
      )}

      {parameter.modulation !== undefined && parameter.modulation !== 0 && (
        <div className="parameter-modulation">
          <span className="modulation-label">Modulation:</span>
          <span className="modulation-amount">{(parameter.modulation * 100).toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}
