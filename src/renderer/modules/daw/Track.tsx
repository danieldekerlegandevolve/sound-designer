import React, { useState } from 'react';
import { Trash2, Settings, Plus, X } from 'lucide-react';
import { useDAWStore } from '../../store/dawStore';
import { DAWTrack } from '@shared/dawTypes';
import { PluginBrowser } from './PluginBrowser';
import { PluginEditor } from './PluginEditor';
import './Track.css';

interface TrackProps {
  track: DAWTrack;
}

export function Track({ track }: TrackProps) {
  const { updateTrack, removeTrack, selectedTrackId, selectTrack, assignPlugin, removePlugin, addEffect, removeEffect } = useDAWStore();
  const [expanded, setExpanded] = useState(false);
  const [showPluginBrowser, setShowPluginBrowser] = useState(false);
  const [showEffectBrowser, setShowEffectBrowser] = useState(false);
  const [showPluginEditor, setShowPluginEditor] = useState(false);
  const [editingEffectIndex, setEditingEffectIndex] = useState<number | null>(null);

  const isSelected = selectedTrackId === track.id;
  const isMaster = track.type === 'master';

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateTrack(track.id, { volume: value });
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateTrack(track.id, { pan: value });
  };

  const toggleMute = () => {
    updateTrack(track.id, { mute: !track.mute });
  };

  const toggleSolo = () => {
    updateTrack(track.id, { solo: !track.solo });
  };

  const formatVolume = (vol: number): string => {
    if (vol === 0) return '-∞ dB';
    const db = 20 * Math.log10(vol);
    return `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`;
  };

  const formatPan = (pan: number): string => {
    if (pan === 0) return 'C';
    if (pan < 0) return `L${Math.abs(Math.round(pan * 100))}`;
    return `R${Math.round(pan * 100)}`;
  };

  // Get plugin name if assigned
  const pluginName = track.pluginState?.pluginName || 'No plugin';
  const hasPlugin = !!track.pluginState;

  return (
    <>
      <div
        className={`track ${isSelected ? 'selected' : ''}`}
        onClick={() => selectTrack(track.id)}
      >
        <div className="track-color" style={{ backgroundColor: track.color }} />

        <div className="track-header" onClick={() => setExpanded(!expanded)}>
          <div className="track-name-container">
            <div className="track-name">{track.name}</div>
            {hasPlugin && <div className="track-plugin">{pluginName}</div>}
          </div>

        <div className="track-controls" onClick={(e) => e.stopPropagation()}>
          <button
            className={`track-control-btn mute ${track.mute ? 'active' : ''}`}
            onClick={toggleMute}
            title="Mute"
          >
            M
          </button>
          <button
            className={`track-control-btn solo ${track.solo ? 'active' : ''}`}
            onClick={toggleSolo}
            title="Solo"
          >
            S
          </button>
        </div>
      </div>

      {expanded && (
        <div className="track-details">
          <div className="track-fader-group">
            <div className="fader-control">
              <span className="fader-label">Volume</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={track.volume}
                onChange={handleVolumeChange}
                className="fader-slider"
              />
              <span className="fader-value">{formatVolume(track.volume)}</span>
            </div>

            <div className="fader-control">
              <span className="fader-label">Pan</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={track.pan}
                onChange={handlePanChange}
                className="fader-slider"
              />
              <span className="fader-value">{formatPan(track.pan)}</span>
            </div>
          </div>

          {/* Plugin Section */}
          {!isMaster && track.type === 'instrument' && (
            <div className="track-plugin-section">
              <div className="plugin-section-header">
                <span className="section-label">Plugin</span>
              </div>

              {hasPlugin ? (
                <div className="plugin-assigned">
                  <div className="plugin-assigned-info">
                    <div className="plugin-assigned-name">{pluginName}</div>
                    <div className="plugin-assigned-actions">
                      <button
                        className="plugin-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPluginEditor(true);
                        }}
                        title="Edit Plugin Parameters"
                      >
                        <Settings size={14} />
                      </button>
                      <button
                        className="plugin-action-btn remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remove plugin "${pluginName}"?`)) {
                            removePlugin(track.id);
                          }
                        }}
                        title="Remove Plugin"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  className="plugin-add-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPluginBrowser(true);
                  }}
                >
                  <Plus size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Assign Plugin
                </button>
              )}
            </div>
          )}

          {/* Effects Section */}
          {!isMaster && (
            <div className="track-plugin-section">
              <div className="plugin-section-header">
                <span className="section-label">Effects</span>
                <button
                  className="add-effect-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEffectBrowser(true);
                  }}
                  title="Add Effect"
                >
                  <Plus size={12} />
                </button>
              </div>

              {track.effects.length === 0 ? (
                <div className="effects-empty">No effects</div>
              ) : (
                <div className="effects-chain">
                  {track.effects.map((effect, index) => (
                    <div key={index} className="effect-item">
                      <div className="effect-order">{index + 1}</div>
                      <div className="effect-name">{effect.pluginName}</div>
                      <div className="effect-actions">
                        <button
                          className="plugin-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEffectIndex(index);
                          }}
                          title="Edit Effect Parameters"
                        >
                          <Settings size={12} />
                        </button>
                        <button
                          className="plugin-action-btn remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove effect "${effect.pluginName}"?`)) {
                              removeEffect(track.id, index);
                            }
                          }}
                          title="Remove Effect"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isMaster && (
            <button
              className="track-delete"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete track "${track.name}"?`)) {
                  removeTrack(track.id);
                }
              }}
            >
              <Trash2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Delete Track
            </button>
          )}
        </div>
      )}
      </div>

      {/* Plugin Browser Modal */}
      {showPluginBrowser && (
        <PluginBrowser
          onSelect={(pluginProject) => {
            assignPlugin(track.id, pluginProject);
            setShowPluginBrowser(false);
          }}
          onClose={() => setShowPluginBrowser(false)}
        />
      )}

      {/* Effect Browser Modal */}
      {showEffectBrowser && (
        <PluginBrowser
          onSelect={(pluginProject) => {
            addEffect(track.id, pluginProject);
            setShowEffectBrowser(false);
          }}
          onClose={() => setShowEffectBrowser(false)}
        />
      )}

      {/* Plugin Editor Modal */}
      {showPluginEditor && hasPlugin && (
        <PluginEditor
          trackId={track.id}
          onClose={() => setShowPluginEditor(false)}
        />
      )}

      {/* Effect Editor Modal */}
      {editingEffectIndex !== null && track.effects[editingEffectIndex] && (
        <PluginEditor
          trackId={track.id}
          effectIndex={editingEffectIndex}
          onClose={() => setEditingEffectIndex(null)}
        />
      )}
    </>
  );
}
