import React, { useEffect, useState } from 'react';
import { useMIDIStore } from '../../store/midiStore';
import {
  RefreshCw,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Activity,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MIDI_CC_NAMES } from '@shared/midiTypes';
import './MIDIRouter.css';

interface MIDIRouterProps {
  onClose?: () => void;
}

export function MIDIRouter({ onClose }: MIDIRouterProps) {
  const {
    devices,
    selectedInputDevice,
    selectedOutputDevice,
    mappings,
    routings,
    mpeConfig,
    recentEvents,
    refreshDevices,
    setSelectedInputDevice,
    setSelectedOutputDevice,
    createMapping,
    updateMapping,
    deleteMapping,
    createRouting,
    updateRouting,
    deleteRouting,
    toggleRouting,
    updateMPEConfig,
    toggleMPE,
    clearRecentEvents,
  } = useMIDIStore();

  const [activeTab, setActiveTab] = useState<'devices' | 'mappings' | 'routing' | 'mpe' | 'monitor'>('devices');
  const [showNewMapping, setShowNewMapping] = useState(false);
  const [showNewRouting, setShowNewRouting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    input: true,
    output: true,
    mappings: true,
    routings: true,
    mpe: false,
  });

  useEffect(() => {
    refreshDevices();
  }, []);

  const inputDevices = devices.filter((d) => d.type === 'input');
  const outputDevices = devices.filter((d) => d.type === 'output');

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({ ...expandedSections, [section]: !expandedSections[section] });
  };

  return (
    <div className="midi-router">
      <div className="router-header">
        <h2>MIDI Router & Configuration</h2>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="router-tabs">
        <button
          className={`tab ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => setActiveTab('devices')}
        >
          Devices
        </button>
        <button
          className={`tab ${activeTab === 'mappings' ? 'active' : ''}`}
          onClick={() => setActiveTab('mappings')}
        >
          Mappings ({mappings.length})
        </button>
        <button
          className={`tab ${activeTab === 'routing' ? 'active' : ''}`}
          onClick={() => setActiveTab('routing')}
        >
          Routing ({routings.length})
        </button>
        <button
          className={`tab ${activeTab === 'mpe' ? 'active' : ''}`}
          onClick={() => setActiveTab('mpe')}
        >
          MPE {mpeConfig.enabled && '✓'}
        </button>
        <button
          className={`tab ${activeTab === 'monitor' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitor')}
        >
          Monitor
          {recentEvents.length > 0 && <span className="activity-dot" />}
        </button>
      </div>

      <div className="router-content">
        {activeTab === 'devices' && (
          <div className="devices-panel">
            <div className="section">
              <div className="section-header" onClick={() => toggleSection('input')}>
                <h3>Input Devices ({inputDevices.length})</h3>
                {expandedSections.input ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {expandedSections.input && (
                <div className="section-content">
                  <button className="refresh-btn" onClick={refreshDevices}>
                    <RefreshCw size={16} />
                    Refresh Devices
                  </button>

                  <div className="device-list">
                    {inputDevices.length === 0 ? (
                      <p className="empty-message">No MIDI input devices found</p>
                    ) : (
                      inputDevices.map((device) => (
                        <div
                          key={device.id}
                          className={`device-card ${selectedInputDevice === device.id ? 'selected' : ''} ${
                            device.state === 'disconnected' ? 'disconnected' : ''
                          }`}
                          onClick={() => setSelectedInputDevice(device.id)}
                        >
                          <div className="device-info">
                            <h4>{device.name}</h4>
                            <p>{device.manufacturer}</p>
                          </div>
                          <div className={`device-status ${device.state}`}>
                            {device.state}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="section">
              <div className="section-header" onClick={() => toggleSection('output')}>
                <h3>Output Devices ({outputDevices.length})</h3>
                {expandedSections.output ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {expandedSections.output && (
                <div className="section-content">
                  <div className="device-list">
                    {outputDevices.length === 0 ? (
                      <p className="empty-message">No MIDI output devices found</p>
                    ) : (
                      outputDevices.map((device) => (
                        <div
                          key={device.id}
                          className={`device-card ${selectedOutputDevice === device.id ? 'selected' : ''} ${
                            device.state === 'disconnected' ? 'disconnected' : ''
                          }`}
                          onClick={() => setSelectedOutputDevice(device.id)}
                        >
                          <div className="device-info">
                            <h4>{device.name}</h4>
                            <p>{device.manufacturer}</p>
                          </div>
                          <div className={`device-status ${device.state}`}>
                            {device.state}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'mappings' && (
          <div className="mappings-panel">
            <div className="panel-header">
              <h3>MIDI CC Mappings</h3>
              <button className="add-btn" onClick={() => setShowNewMapping(true)}>
                <Plus size={16} />
                Add Mapping
              </button>
            </div>

            <div className="mappings-list">
              {mappings.length === 0 ? (
                <div className="empty-state">
                  <p>No MIDI mappings configured</p>
                  <p className="help-text">Use MIDI Learn in the parameter panel to create mappings</p>
                </div>
              ) : (
                mappings.map((mapping) => (
                  <div key={mapping.id} className="mapping-card">
                    <div className="mapping-header">
                      <h4>{mapping.name}</h4>
                      <button
                        className="delete-btn"
                        onClick={() => deleteMapping(mapping.id)}
                        title="Delete mapping"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mapping-details">
                      <div className="mapping-row">
                        <span className="label">MIDI CC:</span>
                        <span className="value">
                          CC{mapping.midiCC} - {MIDI_CC_NAMES[mapping.midiCC] || 'Unknown'}
                        </span>
                      </div>
                      <div className="mapping-row">
                        <span className="label">Channel:</span>
                        <span className="value">{mapping.midiChannel + 1}</span>
                      </div>
                      <div className="mapping-row">
                        <span className="label">Parameter:</span>
                        <span className="value">{mapping.parameterName}</span>
                      </div>
                      <div className="mapping-row">
                        <span className="label">Range:</span>
                        <span className="value">
                          {mapping.min.toFixed(2)} - {mapping.max.toFixed(2)}
                        </span>
                      </div>
                      <div className="mapping-row">
                        <span className="label">Curve:</span>
                        <select
                          value={mapping.curve}
                          onChange={(e) =>
                            updateMapping(mapping.id, { curve: e.target.value as any })
                          }
                          className="curve-select"
                        >
                          <option value="linear">Linear</option>
                          <option value="exponential">Exponential</option>
                          <option value="logarithmic">Logarithmic</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'routing' && (
          <div className="routing-panel">
            <div className="panel-header">
              <h3>MIDI Routing</h3>
              <button className="add-btn" onClick={() => setShowNewRouting(true)}>
                <Plus size={16} />
                Add Routing
              </button>
            </div>

            <div className="routing-list">
              {routings.length === 0 ? (
                <div className="empty-state">
                  <p>No MIDI routings configured</p>
                  <p className="help-text">Create routings to connect MIDI devices</p>
                </div>
              ) : (
                routings.map((routing) => (
                  <div key={routing.id} className={`routing-card ${routing.enabled ? 'enabled' : 'disabled'}`}>
                    <div className="routing-header">
                      <h4>{routing.name}</h4>
                      <div className="routing-controls">
                        <button
                          className="toggle-btn"
                          onClick={() => toggleRouting(routing.id)}
                          title={routing.enabled ? 'Disable' : 'Enable'}
                        >
                          {routing.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => deleteRouting(routing.id)}
                          title="Delete routing"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="routing-flow">
                      <div className="routing-device">
                        <span className="device-type">Input</span>
                        <span className="device-name">
                          {devices.find((d) => d.id === routing.inputDevice)?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="routing-arrow">→</div>
                      <div className="routing-device">
                        <span className="device-type">Output</span>
                        <span className="device-name">
                          {devices.find((d) => d.id === routing.outputDevice)?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="routing-settings">
                      <div className="setting-row">
                        <label>Channel:</label>
                        <select
                          value={routing.channel}
                          onChange={(e) =>
                            updateRouting(routing.id, { channel: Number(e.target.value) })
                          }
                        >
                          <option value={-1}>All Channels</option>
                          {Array.from({ length: 16 }, (_, i) => (
                            <option key={i} value={i}>
                              Channel {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="setting-row">
                        <label>Transpose:</label>
                        <input
                          type="number"
                          min="-24"
                          max="24"
                          value={routing.transpose}
                          onChange={(e) =>
                            updateRouting(routing.id, { transpose: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="setting-row">
                        <label>Velocity Curve:</label>
                        <select
                          value={routing.velocityCurve}
                          onChange={(e) =>
                            updateRouting(routing.id, { velocityCurve: e.target.value as any })
                          }
                        >
                          <option value="linear">Linear</option>
                          <option value="soft">Soft</option>
                          <option value="hard">Hard</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'mpe' && (
          <div className="mpe-panel">
            <div className="panel-header">
              <h3>MPE (MIDI Polyphonic Expression)</h3>
              <button
                className={`toggle-btn ${mpeConfig.enabled ? 'active' : ''}`}
                onClick={toggleMPE}
              >
                {mpeConfig.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                {mpeConfig.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="mpe-description">
              <p>
                MPE enables per-note pitch bend, slide, and pressure for expressive instruments like
                Roli Seaboard, Haken Continuum, and LinnStrument.
              </p>
            </div>

            <div className="mpe-settings">
              <div className="setting-row">
                <label>Master Channel:</label>
                <select
                  value={mpeConfig.masterChannel}
                  onChange={(e) => updateMPEConfig({ masterChannel: Number(e.target.value) })}
                  disabled={!mpeConfig.enabled}
                >
                  <option value={0}>Channel 1 (Lower Zone)</option>
                  <option value={15}>Channel 16 (Upper Zone)</option>
                </select>
              </div>

              <div className="setting-row">
                <label>Pitch Bend Range (semitones):</label>
                <input
                  type="number"
                  min="1"
                  max="96"
                  value={mpeConfig.pitchBendRange}
                  onChange={(e) => updateMPEConfig({ pitchBendRange: Number(e.target.value) })}
                  disabled={!mpeConfig.enabled}
                />
              </div>

              <div className="setting-row">
                <label>Slide CC Number:</label>
                <input
                  type="number"
                  min="0"
                  max="127"
                  value={mpeConfig.slideCCNumber}
                  onChange={(e) => updateMPEConfig({ slideCCNumber: Number(e.target.value) })}
                  disabled={!mpeConfig.enabled}
                />
                <span className="cc-name">{MIDI_CC_NAMES[mpeConfig.slideCCNumber] || 'Custom'}</span>
              </div>

              <div className="mpe-zone-info">
                <h4>Member Channels:</h4>
                <div className="channel-grid">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div
                      key={i}
                      className={`channel-indicator ${
                        i === mpeConfig.masterChannel
                          ? 'master'
                          : mpeConfig.memberChannels.includes(i)
                          ? 'member'
                          : 'inactive'
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mpe-presets">
                <h4>MPE Presets:</h4>
                <div className="preset-buttons">
                  <button
                    onClick={() =>
                      updateMPEConfig({
                        masterChannel: 0,
                        memberChannels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                        pitchBendRange: 48,
                      })
                    }
                    disabled={!mpeConfig.enabled}
                  >
                    Lower Zone (Ch 1-15)
                  </button>
                  <button
                    onClick={() =>
                      updateMPEConfig({
                        masterChannel: 15,
                        memberChannels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                        pitchBendRange: 48,
                      })
                    }
                    disabled={!mpeConfig.enabled}
                  >
                    Upper Zone (Ch 1-15)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="monitor-panel">
            <div className="panel-header">
              <h3>MIDI Activity Monitor</h3>
              <button className="clear-btn" onClick={clearRecentEvents}>
                Clear
              </button>
            </div>

            <div className="events-list">
              {recentEvents.length === 0 ? (
                <div className="empty-state">
                  <Activity size={48} />
                  <p>Waiting for MIDI events...</p>
                </div>
              ) : (
                recentEvents.map((event, index) => (
                  <div key={index} className="event-row">
                    <span className="event-time">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`event-type ${event.type}`}>{event.type}</span>
                    <span className="event-channel">Ch {event.channel + 1}</span>
                    {event.data1 !== undefined && (
                      <span className="event-data">
                        {event.type === 'cc' ? `CC${event.data1}` : event.data1}
                      </span>
                    )}
                    {event.data2 !== undefined && (
                      <span className="event-value">{event.data2}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
