import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { DSPParameter } from '@shared/types';
import { nanoid } from 'nanoid';
import './DSPPropertiesPanel.css';

export function DSPPropertiesPanel() {
  const { project, selectedDSPNode, updateDSPNode } = useProjectStore();

  const node = project.dspGraph.nodes.find((n) => n.id === selectedDSPNode);

  if (!node) {
    return (
      <div className="dsp-properties-panel">
        <div className="panel-header">Node Properties</div>
        <div className="panel-content">
          <div className="empty-state">No node selected</div>
        </div>
      </div>
    );
  }

  const handleParameterChange = (paramId: string, field: string, value: any) => {
    const updatedParameters = node.parameters.map((p) =>
      p.id === paramId ? { ...p, [field]: value } : p
    );
    updateDSPNode(node.id, { parameters: updatedParameters });
  };

  const handleAddParameter = () => {
    const newParameter: DSPParameter = {
      id: nanoid(),
      name: 'New Parameter',
      type: 'float',
      min: 0,
      max: 1,
      default: 0.5,
      value: 0.5,
    };
    updateDSPNode(node.id, {
      parameters: [...node.parameters, newParameter],
    });
  };

  const handleDeleteParameter = (paramId: string) => {
    const updatedParameters = node.parameters.filter((p) => p.id !== paramId);
    updateDSPNode(node.id, { parameters: updatedParameters });
  };

  return (
    <div className="dsp-properties-panel">
      <div className="panel-header">Node Properties</div>
      <div className="panel-content">
        <div className="property-section">
          <div className="section-title">General</div>
          <div className="property-row">
            <label>Type</label>
            <input type="text" value={node.type} disabled />
          </div>
        </div>

        <div className="property-section">
          <div className="section-header">
            <div className="section-title">Parameters</div>
            <button className="add-btn" onClick={handleAddParameter}>
              + Add
            </button>
          </div>

          {node.parameters.length === 0 ? (
            <div className="empty-state-small">No parameters defined</div>
          ) : (
            <div className="parameters-list">
              {node.parameters.map((param) => (
                <div key={param.id} className="parameter-item">
                  <div className="parameter-header">
                    <input
                      type="text"
                      className="param-name-input"
                      value={param.name}
                      onChange={(e) =>
                        handleParameterChange(param.id, 'name', e.target.value)
                      }
                    />
                    <button
                      className="delete-param-btn"
                      onClick={() => handleDeleteParameter(param.id)}
                    >
                      ×
                    </button>
                  </div>

                  <div className="property-row">
                    <label>Type</label>
                    <select
                      value={param.type}
                      onChange={(e) =>
                        handleParameterChange(param.id, 'type', e.target.value)
                      }
                    >
                      <option value="float">Float</option>
                      <option value="int">Integer</option>
                      <option value="bool">Boolean</option>
                      <option value="enum">Enum</option>
                    </select>
                  </div>

                  {(param.type === 'float' || param.type === 'int') && (
                    <>
                      <div className="property-grid">
                        <div className="property-row">
                          <label>Min</label>
                          <input
                            type="number"
                            value={param.min}
                            onChange={(e) =>
                              handleParameterChange(
                                param.id,
                                'min',
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="property-row">
                          <label>Max</label>
                          <input
                            type="number"
                            value={param.max}
                            onChange={(e) =>
                              handleParameterChange(
                                param.id,
                                'max',
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="property-row">
                        <label>Default</label>
                        <input
                          type="number"
                          step={param.type === 'float' ? '0.01' : '1'}
                          value={param.default}
                          onChange={(e) =>
                            handleParameterChange(
                              param.id,
                              'default',
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="property-row">
                    <label>Unit</label>
                    <input
                      type="text"
                      placeholder="Hz, dB, ms, etc."
                      value={param.unit || ''}
                      onChange={(e) =>
                        handleParameterChange(param.id, 'unit', e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
