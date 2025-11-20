/**
 * MIDI Advanced Panel
 *
 * Comprehensive UI for all advanced MIDI features in a tabbed interface
 */

import React, { useState, useEffect } from 'react';
import { getAdvancedMIDIProcessor } from '../midi/advancedMidiProcessor';
import {
  MIDIMapping,
  ArpeggiatorMode,
  ArpeggiatorTimeBase,
  MPEConfiguration,
  NoteEffects,
  MIDIMonitorEvent,
} from '../../shared/midiAdvancedTypes';

type TabType = 'learn' | 'arpeggiator' | 'effects' | 'mpe' | 'monitor';

export interface MIDIAdvancedPanelProps {
  onClose?: () => void;
}

export function MIDIAdvancedPanel({ onClose }: MIDIAdvancedPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('learn');

  return (
    <div className="midi-advanced-panel">
      {/* Header */}
      <div className="midi-panel-header">
        <h2>Advanced MIDI</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="midi-tabs">
        <button
          className={`tab ${activeTab === 'learn' ? 'active' : ''}`}
          onClick={() => setActiveTab('learn')}
        >
          🎛️ MIDI Learn
        </button>
        <button
          className={`tab ${activeTab === 'arpeggiator' ? 'active' : ''}`}
          onClick={() => setActiveTab('arpeggiator')}
        >
          🎵 Arpeggiator
        </button>
        <button
          className={`tab ${activeTab === 'effects' ? 'active' : ''}`}
          onClick={() => setActiveTab('effects')}
        >
          ✨ Note FX
        </button>
        <button
          className={`tab ${activeTab === 'mpe' ? 'active' : ''}`}
          onClick={() => setActiveTab('mpe')}
        >
          🎹 MPE
        </button>
        <button
          className={`tab ${activeTab === 'monitor' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitor')}
        >
          📊 Monitor
        </button>
      </div>

      {/* Tab Content */}
      <div className="midi-tab-content">
        {activeTab === 'learn' && <MIDILearnTab />}
        {activeTab === 'arpeggiator' && <ArpeggiatorTab />}
        {activeTab === 'effects' && <NoteEffectsTab />}
        {activeTab === 'mpe' && <MPEConfigTab />}
        {activeTab === 'monitor' && <MIDIMonitorTab />}
      </div>
    </div>
  );
}

/**
 * MIDI Learn Tab
 */
function MIDILearnTab() {
  const [mappings, setMappings] = useState<MIDIMapping[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const processor = getAdvancedMIDIProcessor();
  const learnManager = processor.getMIDILearnManager();

  useEffect(() => {
    setMappings(learnManager.getMappings());
    return learnManager.subscribe((newMappings) => {
      setMappings(newMappings);
    });
  }, []);

  const handleStartLearn = () => {
    learnManager.startLearnSession('parameter', 'demo-param', 'Demo Parameter');
    setIsLearning(true);
  };

  const handleCancelLearn = () => {
    learnManager.cancelLearnSession();
    setIsLearning(false);
  };

  const handleDeleteMapping = (mappingId: string) => {
    learnManager.removeMapping(mappingId);
  };

  const handleToggleMapping = (mappingId: string) => {
    const mapping = learnManager.getMapping(mappingId);
    if (mapping) {
      learnManager.updateMapping(mappingId, { enabled: !mapping.enabled });
    }
  };

  return (
    <div className="midi-learn-tab">
      <div className="learn-header">
        <p className="learn-description">
          Click "Learn" and move a MIDI controller to create a mapping.
        </p>
        {isLearning ? (
          <button className="btn learn-btn active" onClick={handleCancelLearn}>
            Cancel Learning...
          </button>
        ) : (
          <button className="btn learn-btn" onClick={handleStartLearn}>
            Start MIDI Learn
          </button>
        )}
      </div>

      <div className="mappings-list">
        {mappings.length === 0 ? (
          <div className="empty-state">
            <p>No MIDI mappings yet</p>
            <p className="hint">Click "Start MIDI Learn" to create your first mapping</p>
          </div>
        ) : (
          mappings.map((mapping) => (
            <div key={mapping.id} className={`mapping-item ${mapping.enabled ? '' : 'disabled'}`}>
              <div className="mapping-info">
                <div className="mapping-name">{mapping.name}</div>
                <div className="mapping-details">
                  CC{mapping.cc} · Channel {mapping.midiChannel + 1} · {mapping.curve}
                </div>
                <div className="mapping-range">
                  Range: {mapping.minValue.toFixed(2)} → {mapping.maxValue.toFixed(2)}
                </div>
              </div>
              <div className="mapping-controls">
                <button
                  className={`toggle-btn ${mapping.enabled ? 'active' : ''}`}
                  onClick={() => handleToggleMapping(mapping.id)}
                  title={mapping.enabled ? 'Disable' : 'Enable'}
                >
                  {mapping.enabled ? '🔊' : '🔇'}
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteMapping(mapping.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Arpeggiator Tab
 */
function ArpeggiatorTab() {
  const processor = getAdvancedMIDIProcessor();
  const arpeggiator = processor.getArpeggiator();
  const [state, setState] = useState(arpeggiator.getState());

  useEffect(() => {
    const interval = setInterval(() => {
      setState(arpeggiator.getState());
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    arpeggiator.setEnabled(!state.enabled);
  };

  const handleModeChange = (mode: ArpeggiatorMode) => {
    arpeggiator.setMode(mode);
  };

  const handleTimeBaseChange = (timeBase: ArpeggiatorTimeBase) => {
    arpeggiator.setTimeBase(timeBase);
  };

  const handleTempoChange = (tempo: number) => {
    arpeggiator.setTempo(tempo);
  };

  const handleOctaveRangeChange = (range: number) => {
    arpeggiator.setOctaveRange(range);
  };

  const handleGateLengthChange = (length: number) => {
    arpeggiator.setGateLength(length);
  };

  const handleSwingChange = (swing: number) => {
    arpeggiator.setSwing(swing);
  };

  return (
    <div className="arpeggiator-tab">
      {/* Enable Toggle */}
      <div className="arp-header">
        <button className={`btn power-btn ${state.enabled ? 'active' : ''}`} onClick={handleToggle}>
          {state.enabled ? '⏸ Stop' : '▶ Start'}
        </button>
        <div className="arp-status">
          {state.isPlaying && <span className="playing-indicator">● Playing</span>}
          {state.heldNotes.length > 0 && (
            <span className="held-notes">{state.heldNotes.length} notes held</span>
          )}
        </div>
      </div>

      {/* Mode Selection */}
      <div className="control-section">
        <label>Mode</label>
        <div className="mode-buttons">
          {[
            { value: ArpeggiatorMode.UP, label: 'Up' },
            { value: ArpeggiatorMode.DOWN, label: 'Down' },
            { value: ArpeggiatorMode.UP_DOWN, label: 'Up/Down' },
            { value: ArpeggiatorMode.RANDOM, label: 'Random' },
            { value: ArpeggiatorMode.PLAYED, label: 'Played' },
            { value: ArpeggiatorMode.CHORD, label: 'Chord' },
          ].map((mode) => (
            <button
              key={mode.value}
              className={`mode-btn ${state.mode === mode.value ? 'active' : ''}`}
              onClick={() => handleModeChange(mode.value)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Base */}
      <div className="control-section">
        <label>Time Base</label>
        <select
          className="select"
          value={state.timeBase}
          onChange={(e) => handleTimeBaseChange(e.target.value as ArpeggiatorTimeBase)}
        >
          <option value={ArpeggiatorTimeBase.SIXTEENTH}>1/16</option>
          <option value={ArpeggiatorTimeBase.EIGHTH}>1/8</option>
          <option value={ArpeggiatorTimeBase.EIGHTH_TRIPLET}>1/8T</option>
          <option value={ArpeggiatorTimeBase.QUARTER}>1/4</option>
          <option value={ArpeggiatorTimeBase.QUARTER_TRIPLET}>1/4T</option>
          <option value={ArpeggiatorTimeBase.HALF}>1/2</option>
        </select>
      </div>

      {/* Tempo */}
      <div className="control-section">
        <label>
          Tempo: <span className="value">{state.tempo} BPM</span>
        </label>
        <input
          type="range"
          min="20"
          max="300"
          value={state.tempo}
          onChange={(e) => handleTempoChange(parseInt(e.target.value))}
          className="slider"
        />
      </div>

      {/* Octave Range */}
      <div className="control-section">
        <label>
          Octave Range: <span className="value">{state.octaveRange}</span>
        </label>
        <input
          type="range"
          min="1"
          max="4"
          value={state.octaveRange}
          onChange={(e) => handleOctaveRangeChange(parseInt(e.target.value))}
          className="slider"
        />
      </div>

      {/* Gate Length */}
      <div className="control-section">
        <label>
          Gate Length: <span className="value">{(state.gateLength * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={state.gateLength}
          onChange={(e) => handleGateLengthChange(parseFloat(e.target.value))}
          className="slider"
        />
      </div>

      {/* Swing */}
      <div className="control-section">
        <label>
          Swing: <span className="value">{(state.swing * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={state.swing}
          onChange={(e) => handleSwingChange(parseFloat(e.target.value))}
          className="slider"
        />
      </div>
    </div>
  );
}

/**
 * Note Effects Tab
 */
function NoteEffectsTab() {
  const processor = getAdvancedMIDIProcessor();
  const effectsProcessor = processor.getNoteEffectsProcessor();
  const [effects, setEffects] = useState(effectsProcessor.getEffects());

  const updateEffects = (updates: Partial<NoteEffects>) => {
    const newEffects = { ...effects, ...updates };
    effectsProcessor.setEffects(newEffects);
    setEffects(newEffects);
  };

  return (
    <div className="note-effects-tab">
      {/* Humanize */}
      <div className="effect-section">
        <div className="effect-header">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={effects.humanize.enabled}
              onChange={(e) =>
                updateEffects({
                  humanize: { ...effects.humanize, enabled: e.target.checked },
                })
              }
            />
            <span>Humanize</span>
          </label>
        </div>

        {effects.humanize.enabled && (
          <div className="effect-controls">
            <div className="control">
              <label>
                Timing: <span className="value">{(effects.humanize.timingAmount * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effects.humanize.timingAmount}
                onChange={(e) =>
                  updateEffects({
                    humanize: { ...effects.humanize, timingAmount: parseFloat(e.target.value) },
                  })
                }
                className="slider"
              />
            </div>

            <div className="control">
              <label>
                Velocity: <span className="value">{(effects.humanize.velocityAmount * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effects.humanize.velocityAmount}
                onChange={(e) =>
                  updateEffects({
                    humanize: { ...effects.humanize, velocityAmount: parseFloat(e.target.value) },
                  })
                }
                className="slider"
              />
            </div>

            <div className="control">
              <label>
                Duration: <span className="value">{(effects.humanize.durationAmount * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effects.humanize.durationAmount}
                onChange={(e) =>
                  updateEffects({
                    humanize: { ...effects.humanize, durationAmount: parseFloat(e.target.value) },
                  })
                }
                className="slider"
              />
            </div>
          </div>
        )}
      </div>

      {/* Quantize */}
      <div className="effect-section">
        <div className="effect-header">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={effects.quantize.enabled}
              onChange={(e) =>
                updateEffects({
                  quantize: { ...effects.quantize, enabled: e.target.checked },
                })
              }
            />
            <span>Quantize</span>
          </label>
        </div>

        {effects.quantize.enabled && (
          <div className="effect-controls">
            <div className="control">
              <label>
                Strength: <span className="value">{(effects.quantize.strength * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effects.quantize.strength}
                onChange={(e) =>
                  updateEffects({
                    quantize: { ...effects.quantize, strength: parseFloat(e.target.value) },
                  })
                }
                className="slider"
              />
            </div>

            <div className="control">
              <label>
                Swing: <span className="value">{(effects.quantize.swing * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effects.quantize.swing}
                onChange={(e) =>
                  updateEffects({
                    quantize: { ...effects.quantize, swing: parseFloat(e.target.value) },
                  })
                }
                className="slider"
              />
            </div>
          </div>
        )}
      </div>

      {/* Transpose */}
      <div className="effect-section">
        <div className="effect-header">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={effects.transpose.enabled}
              onChange={(e) =>
                updateEffects({
                  transpose: { ...effects.transpose, enabled: e.target.checked },
                })
              }
            />
            <span>Transpose</span>
          </label>
        </div>

        {effects.transpose.enabled && (
          <div className="effect-controls">
            <div className="control">
              <label>
                Semitones: <span className="value">{effects.transpose.semitones > 0 ? '+' : ''}{effects.transpose.semitones}</span>
              </label>
              <input
                type="range"
                min="-48"
                max="48"
                value={effects.transpose.semitones}
                onChange={(e) =>
                  updateEffects({
                    transpose: { ...effects.transpose, semitones: parseInt(e.target.value) },
                  })
                }
                className="slider"
              />
            </div>

            <div className="control">
              <label>
                Octaves: <span className="value">{effects.transpose.octaves > 0 ? '+' : ''}{effects.transpose.octaves}</span>
              </label>
              <input
                type="range"
                min="-4"
                max="4"
                value={effects.transpose.octaves}
                onChange={(e) =>
                  updateEffects({
                    transpose: { ...effects.transpose, octaves: parseInt(e.target.value) },
                  })
                }
                className="slider"
              />
            </div>
          </div>
        )}
      </div>

      {/* Velocity Scale */}
      <div className="effect-section">
        <div className="effect-header">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={effects.velocityScale.enabled}
              onChange={(e) =>
                updateEffects({
                  velocityScale: { ...effects.velocityScale, enabled: e.target.checked },
                })
              }
            />
            <span>Velocity Scale</span>
          </label>
        </div>

        {effects.velocityScale.enabled && (
          <div className="effect-controls">
            <div className="control">
              <label>
                Min: <span className="value">{effects.velocityScale.minVelocity}</span>
              </label>
              <input
                type="range"
                min="1"
                max="127"
                value={effects.velocityScale.minVelocity}
                onChange={(e) =>
                  updateEffects({
                    velocityScale: { ...effects.velocityScale, minVelocity: parseInt(e.target.value) },
                  })
                }
                className="slider"
              />
            </div>

            <div className="control">
              <label>
                Max: <span className="value">{effects.velocityScale.maxVelocity}</span>
              </label>
              <input
                type="range"
                min="1"
                max="127"
                value={effects.velocityScale.maxVelocity}
                onChange={(e) =>
                  updateEffects({
                    velocityScale: { ...effects.velocityScale, maxVelocity: parseInt(e.target.value) },
                  })
                }
                className="slider"
              />
            </div>

            <div className="control">
              <label>Curve</label>
              <select
                className="select"
                value={effects.velocityScale.curve}
                onChange={(e) =>
                  updateEffects({
                    velocityScale: {
                      ...effects.velocityScale,
                      curve: e.target.value as 'linear' | 'exponential' | 'logarithmic',
                    },
                  })
                }
              >
                <option value="linear">Linear</option>
                <option value="exponential">Exponential</option>
                <option value="logarithmic">Logarithmic</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * MPE Config Tab
 */
function MPEConfigTab() {
  const processor = getAdvancedMIDIProcessor();
  const mpeManager = processor.getMPEManager();
  const [config, setConfig] = useState<MPEConfiguration>(mpeManager.getConfiguration());

  const updateConfig = (updates: Partial<MPEConfiguration>) => {
    const newConfig = { ...config, ...updates };
    mpeManager.setConfiguration(newConfig);
    setConfig(newConfig);
  };

  return (
    <div className="mpe-config-tab">
      <div className="control-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
          />
          <span>Enable MPE</span>
        </label>
      </div>

      {config.enabled && (
        <>
          <div className="control-section">
            <label>
              Master Channel: <span className="value">{config.masterChannel + 1}</span>
            </label>
            <input
              type="range"
              min="0"
              max="15"
              value={config.masterChannel}
              onChange={(e) => updateConfig({ masterChannel: parseInt(e.target.value) })}
              className="slider"
            />
          </div>

          <div className="control-section">
            <label>
              Pitch Bend Range: <span className="value">{config.pitchBendRange} semitones</span>
            </label>
            <input
              type="range"
              min="1"
              max="96"
              value={config.pitchBendRange}
              onChange={(e) => updateConfig({ pitchBendRange: parseInt(e.target.value) })}
              className="slider"
            />
          </div>

          <div className="control-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.pressureEnabled}
                onChange={(e) => updateConfig({ pressureEnabled: e.target.checked })}
              />
              <span>Channel Pressure</span>
            </label>
          </div>

          <div className="control-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.timbreEnabled}
                onChange={(e) => updateConfig({ timbreEnabled: e.target.checked })}
              />
              <span>Timbre (CC74)</span>
            </label>
          </div>

          <div className="control-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.slideToPitchEnabled}
                onChange={(e) => updateConfig({ slideToPitchEnabled: e.target.checked })}
              />
              <span>Slide to Pitch</span>
            </label>
          </div>

          <div className="info-box">
            <p>
              <strong>Member Channels:</strong> {config.memberChannels.length} voices
            </p>
            <p className="hint">MPE uses channels 1-15 for per-note expression</p>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * MIDI Monitor Tab
 */
function MIDIMonitorTab() {
  const processor = getAdvancedMIDIProcessor();
  const monitor = processor.getMIDIMonitor();
  const [events, setEvents] = useState<MIDIMonitorEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(monitor.isMonitoring());

  useEffect(() => {
    const updateEvents = () => {
      setEvents(monitor.getRecentEvents(50));
    };

    const unsubscribe = monitor.subscribe(() => {
      updateEvents();
    });

    const interval = setInterval(updateEvents, 500);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleToggleMonitoring = () => {
    const newState = !isMonitoring;
    monitor.setEnabled(newState);
    setIsMonitoring(newState);
  };

  const handleClearEvents = () => {
    monitor.clearEvents();
    setEvents([]);
  };

  return (
    <div className="midi-monitor-tab">
      <div className="monitor-header">
        <button
          className={`btn monitor-btn ${isMonitoring ? 'active' : ''}`}
          onClick={handleToggleMonitoring}
        >
          {isMonitoring ? '⏸ Pause' : '▶ Monitor'}
        </button>
        <button className="btn" onClick={handleClearEvents}>
          Clear
        </button>
        <div className="event-count">{events.length} events</div>
      </div>

      <div className="events-list">
        {events.length === 0 ? (
          <div className="empty-state">
            <p>No MIDI events yet</p>
            <p className="hint">Play some notes or move controllers to see MIDI activity</p>
          </div>
        ) : (
          events
            .slice()
            .reverse()
            .map((event) => (
              <div key={event.id} className={`event-item event-${event.type}`}>
                <span className="event-time">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className="event-type">{event.type}</span>
                <span className="event-message">{event.message}</span>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
