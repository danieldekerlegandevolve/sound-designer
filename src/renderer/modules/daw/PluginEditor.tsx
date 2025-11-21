import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useDAWStore } from '../../store/dawStore';
import { PluginProject } from '@shared/types';
import './PluginEditor.css';

interface PluginEditorProps {
  trackId: string;
  effectIndex?: number; // If provided, edit effect instead of main plugin
  onClose: () => void;
}

export function PluginEditor({ trackId, effectIndex, onClose }: PluginEditorProps) {
  const { project, updatePluginParameter, updateEffectParameter } = useDAWStore();
  const [pluginProject, setPluginProject] = useState<PluginProject | null>(null);
  const [loading, setLoading] = useState(true);

  const track = project.tracks.find(t => t.id === trackId);
  const pluginState = effectIndex !== undefined ? track?.effects[effectIndex] : track?.pluginState;

  useEffect(() => {
    loadPluginProject();
  }, [trackId, effectIndex]);

  const loadPluginProject = async () => {
    if (!pluginState) {
      setLoading(false);
      return;
    }

    try {
      // Try to load from recent projects
      const result = await window.electronAPI.getRecentProjects();
      if (result.success && result.data) {
        const found = result.data.find(
          (p: any) => p.project.id === pluginState?.pluginProjectId
        );
        if (found) {
          setPluginProject(found.project);
        }
      }
    } catch (error) {
      console.error('Failed to load plugin project:', error);
    } finally {
      setLoading(false);
    }
  };

  const getParameterValue = (nodeId: string, parameterId: string): number => {
    const param = pluginState?.parameters.find(
      p => p.nodeId === nodeId && p.parameterId === parameterId
    );
    return param?.value ?? 0;
  };

  const handleParameterChange = (nodeId: string, parameterId: string, value: number) => {
    if (effectIndex !== undefined) {
      updateEffectParameter(trackId, effectIndex, nodeId, parameterId, value);
    } else {
      updatePluginParameter(trackId, nodeId, parameterId, value);
    }
  };

  if (!track || !pluginState) {
    return null;
  }

  if (loading) {
    return (
      <div className="plugin-editor-overlay" onClick={onClose}>
        <div className="plugin-editor" onClick={(e) => e.stopPropagation()}>
          <div className="plugin-editor-loading">Loading plugin...</div>
        </div>
      </div>
    );
  }

  if (!pluginProject) {
    return (
      <div className="plugin-editor-overlay" onClick={onClose}>
        <div className="plugin-editor" onClick={(e) => e.stopPropagation()}>
          <div className="plugin-editor-header">
            <h2>Plugin Editor</h2>
            <button className="close-button" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
          <div className="plugin-editor-empty">
            Plugin project not found. The plugin may have been deleted or moved.
          </div>
        </div>
      </div>
    );
  }

  // Group parameters by DSP node
  const nodeGroups = pluginProject.dspGraph.nodes
    .filter(node => node.parameters && node.parameters.length > 0)
    .map(node => ({
      node,
      parameters: node.parameters || [],
    }));

  return (
    <div className="plugin-editor-overlay" onClick={onClose}>
      <div className="plugin-editor" onClick={(e) => e.stopPropagation()}>
        <div className="plugin-editor-header">
          <div>
            <h2>{pluginState.pluginName}</h2>
            <p className="plugin-editor-subtitle">
              {effectIndex !== undefined ? `Effect #${effectIndex + 1} Parameters` : 'Plugin Parameters'}
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="plugin-editor-content">
          {nodeGroups.length === 0 ? (
            <div className="plugin-editor-empty">
              This plugin has no editable parameters.
            </div>
          ) : (
            nodeGroups.map(({ node, parameters }) => (
              <div key={node.id} className="parameter-group">
                <div className="parameter-group-header">
                  <span className="parameter-group-name">{node.label || node.type}</span>
                  <span className="parameter-group-type">{node.type}</span>
                </div>

                <div className="parameter-list">
                  {parameters.map(param => {
                    const value = getParameterValue(node.id, param.id);

                    return (
                      <div key={param.id} className="parameter-item">
                        <div className="parameter-header">
                          <span className="parameter-name">{param.name}</span>
                          <span className="parameter-value">
                            {value.toFixed(2)}
                            {param.unit ? ` ${param.unit}` : ''}
                          </span>
                        </div>

                        {param.type === 'float' || param.type === 'int' ? (
                          <input
                            type="range"
                            min={param.min ?? 0}
                            max={param.max ?? 1}
                            step={param.type === 'int' ? 1 : 0.01}
                            value={value}
                            onChange={(e) =>
                              handleParameterChange(
                                node.id,
                                param.id,
                                parseFloat(e.target.value)
                              )
                            }
                            className="parameter-slider"
                          />
                        ) : param.type === 'bool' ? (
                          <label className="parameter-checkbox">
                            <input
                              type="checkbox"
                              checked={value > 0.5}
                              onChange={(e) =>
                                handleParameterChange(
                                  node.id,
                                  param.id,
                                  e.target.checked ? 1 : 0
                                )
                              }
                            />
                            <span>{value > 0.5 ? 'On' : 'Off'}</span>
                          </label>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="plugin-editor-footer">
          <button className="close-footer-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
