import React, { useState } from 'react';
import { useModulationStore } from '../../store/modulationStore';
import {
  Plus,
  Trash2,
  Settings,
  ToggleLeft,
  ToggleRight,
  Zap,
  Activity,
  TrendingUp,
  Grid3x3,
  Shuffle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LFO_WAVEFORMS } from '@shared/modulationTypes';
import './ModulationMatrix.css';

interface ModulationMatrixProps {
  onClose?: () => void;
}

export function ModulationMatrix({ onClose }: ModulationMatrixProps) {
  const {
    matrix,
    selectedSource,
    selectedTarget,
    createLFO,
    createEnvelope,
    createEnvelopeFollower,
    createStepSequencer,
    createRandomizer,
    updateSource,
    deleteSource,
    toggleSource,
    createConnection,
    updateConnection,
    deleteConnection,
    toggleConnection,
    setSelectedSource,
    setSelectedTarget,
    getConnectionsForSource,
    getConnectionsForTarget,
  } = useModulationStore();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingSource, setEditingSource] = useState<string | null>(null);
  const [expandedConnections, setExpandedConnections] = useState<Set<string>>(new Set());

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'lfo':
        return <Activity size={18} />;
      case 'envelope':
        return <TrendingUp size={18} />;
      case 'envelopeFollower':
        return <Zap size={18} />;
      case 'stepSequencer':
        return <Grid3x3 size={18} />;
      case 'randomizer':
        return <Shuffle size={18} />;
      default:
        return <Activity size={18} />;
    }
  };

  const handleCreateSource = (type: 'lfo' | 'envelope' | 'envelopeFollower' | 'stepSequencer' | 'randomizer') => {
    const name = `${type.charAt(0).toUpperCase()}${type.slice(1)} ${matrix.sources.length + 1}`;

    switch (type) {
      case 'lfo':
        createLFO(name);
        break;
      case 'envelope':
        createEnvelope(name);
        break;
      case 'envelopeFollower':
        createEnvelopeFollower(name);
        break;
      case 'stepSequencer':
        createStepSequencer(name);
        break;
      case 'randomizer':
        createRandomizer(name);
        break;
    }

    setShowAddMenu(false);
  };

  const handleCreateConnection = (sourceId: string, targetId: string) => {
    createConnection(sourceId, targetId);
  };

  const toggleConnectionExpand = (id: string) => {
    const newExpanded = new Set(expandedConnections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedConnections(newExpanded);
  };

  return (
    <div className="modulation-matrix">
      <div className="matrix-header">
        <h2>Modulation Matrix</h2>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="matrix-content">
        {/* Sources Panel */}
        <div className="sources-panel">
          <div className="panel-header">
            <h3>Sources ({matrix.sources.length})</h3>
            <div className="add-menu-container">
              <button
                className="add-btn"
                onClick={() => setShowAddMenu(!showAddMenu)}
              >
                <Plus size={16} />
                Add Source
              </button>

              {showAddMenu && (
                <div className="add-menu">
                  <button onClick={() => handleCreateSource('lfo')}>
                    <Activity size={16} />
                    LFO
                  </button>
                  <button onClick={() => handleCreateSource('envelope')}>
                    <TrendingUp size={16} />
                    Envelope
                  </button>
                  <button onClick={() => handleCreateSource('envelopeFollower')}>
                    <Zap size={16} />
                    Envelope Follower
                  </button>
                  <button onClick={() => handleCreateSource('stepSequencer')}>
                    <Grid3x3 size={16} />
                    Step Sequencer
                  </button>
                  <button onClick={() => handleCreateSource('randomizer')}>
                    <Shuffle size={16} />
                    Randomizer
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="sources-list">
            {matrix.sources.length === 0 ? (
              <div className="empty-state">
                <p>No modulation sources</p>
                <p className="hint">Click "Add Source" to create one</p>
              </div>
            ) : (
              matrix.sources.map((source) => {
                const connections = getConnectionsForSource(source.id);

                return (
                  <div
                    key={source.id}
                    className={`source-card ${selectedSource === source.id ? 'selected' : ''} ${
                      !source.enabled ? 'disabled' : ''
                    }`}
                  >
                    <div className="source-header">
                      <div
                        className="source-info"
                        onClick={() => setSelectedSource(source.id)}
                      >
                        <div className="source-icon">{getSourceIcon(source.type)}</div>
                        <div>
                          <h4>{source.name}</h4>
                          <span className="source-type">{source.type}</span>
                        </div>
                      </div>

                      <div className="source-controls">
                        <button
                          className={`toggle-btn ${source.enabled ? 'active' : ''}`}
                          onClick={() => toggleSource(source.id)}
                          title={source.enabled ? 'Disable' : 'Enable'}
                        >
                          {source.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() => setEditingSource(source.id)}
                          title="Edit"
                        >
                          <Settings size={16} />
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => deleteSource(source.id)}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Quick config preview */}
                    <div className="source-preview">
                      {source.type === 'lfo' && (
                        <div className="config-preview">
                          <span>
                            {LFO_WAVEFORMS.find((w) => w.value === source.config.waveform)?.icon}{' '}
                            {source.config.frequency.toFixed(2)} Hz
                          </span>
                        </div>
                      )}
                      {source.type === 'envelope' && (
                        <div className="config-preview">
                          <span>
                            A:{source.config.attack.toFixed(2)} D:{source.config.decay.toFixed(2)} S:
                            {source.config.sustain.toFixed(2)} R:{source.config.release.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Connections count */}
                    <div className="connections-badge">
                      {connections.length} connection{connections.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Connections Grid */}
        <div className="connections-grid">
          <div className="grid-header">
            <h3>Routing</h3>
            <p>{matrix.connections.length} active connections</p>
          </div>

          <div className="grid-content">
            {matrix.targets.length === 0 ? (
              <div className="empty-state">
                <p>No modulation targets registered</p>
                <p className="hint">Targets are registered automatically from DSP nodes</p>
              </div>
            ) : (
              <div className="routing-table">
                <div className="table-header">
                  <div className="header-cell">Source</div>
                  <div className="header-cell">Target</div>
                  <div className="header-cell">Amount</div>
                  <div className="header-cell">Curve</div>
                  <div className="header-cell">Actions</div>
                </div>

                <div className="table-body">
                  {matrix.connections.length === 0 ? (
                    <div className="empty-row">
                      <p>No connections yet</p>
                      <p className="hint">Select a source and target, then click "Connect"</p>
                    </div>
                  ) : (
                    matrix.connections.map((connection) => {
                      const source = matrix.sources.find((s) => s.id === connection.sourceId);
                      const target = matrix.targets.find((t) => t.id === connection.targetId);
                      const isExpanded = expandedConnections.has(connection.id);

                      if (!source || !target) return null;

                      return (
                        <div key={connection.id} className="connection-row">
                          <div className="basic-row">
                            <div className="cell">
                              <div className="source-badge">
                                {getSourceIcon(source.type)}
                                {source.name}
                              </div>
                            </div>
                            <div className="cell">
                              <div className="target-badge">{target.parameterName}</div>
                            </div>
                            <div className="cell">
                              <input
                                type="range"
                                min="-100"
                                max="100"
                                value={connection.amount * 100}
                                onChange={(e) =>
                                  updateConnection(connection.id, {
                                    amount: Number(e.target.value) / 100,
                                  })
                                }
                                className="amount-slider"
                              />
                              <span className="amount-value">
                                {(connection.amount * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="cell">
                              <select
                                value={connection.curve}
                                onChange={(e) =>
                                  updateConnection(connection.id, { curve: e.target.value as any })
                                }
                                className="curve-select"
                              >
                                <option value="linear">Linear</option>
                                <option value="exponential">Exponential</option>
                                <option value="logarithmic">Logarithmic</option>
                              </select>
                            </div>
                            <div className="cell actions-cell">
                              <button
                                className={`toggle-btn ${connection.enabled ? 'active' : ''}`}
                                onClick={() => toggleConnection(connection.id)}
                                title={connection.enabled ? 'Disable' : 'Enable'}
                              >
                                {connection.enabled ? (
                                  <ToggleRight size={18} />
                                ) : (
                                  <ToggleLeft size={18} />
                                )}
                              </button>
                              <button
                                className="expand-btn"
                                onClick={() => toggleConnectionExpand(connection.id)}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => deleteConnection(connection.id)}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="expanded-row">
                              <div className="expanded-content">
                                <div className="info-group">
                                  <label>Source Node:</label>
                                  <span>{target.nodeId}</span>
                                </div>
                                <div className="info-group">
                                  <label>Parameter ID:</label>
                                  <span>{target.parameterId}</span>
                                </div>
                                <div className="info-group">
                                  <label>Range:</label>
                                  <span>
                                    {target.min} - {target.max} {target.unit || ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Connect Panel */}
        <div className="quick-connect-panel">
          <h3>Quick Connect</h3>

          <div className="quick-connect-form">
            <div className="form-group">
              <label>Source:</label>
              <select
                value={selectedSource || ''}
                onChange={(e) => setSelectedSource(e.target.value || null)}
              >
                <option value="">Select source...</option>
                {matrix.sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name} ({source.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Target:</label>
              <select
                value={selectedTarget || ''}
                onChange={(e) => setSelectedTarget(e.target.value || null)}
              >
                <option value="">Select target...</option>
                {matrix.targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.parameterName} ({target.nodeId})
                  </option>
                ))}
              </select>
            </div>

            <button
              className="connect-btn"
              disabled={!selectedSource || !selectedTarget}
              onClick={() => {
                if (selectedSource && selectedTarget) {
                  handleCreateConnection(selectedSource, selectedTarget);
                  setSelectedSource(null);
                  setSelectedTarget(null);
                }
              }}
            >
              Create Connection
            </button>
          </div>

          <div className="stats">
            <div className="stat">
              <span className="stat-label">Sources:</span>
              <span className="stat-value">{matrix.sources.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Targets:</span>
              <span className="stat-value">{matrix.targets.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Connections:</span>
              <span className="stat-value">{matrix.connections.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
