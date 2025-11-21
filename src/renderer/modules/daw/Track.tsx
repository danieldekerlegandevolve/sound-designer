import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useDAWStore } from '../../store/dawStore';
import { DAWTrack } from '@shared/dawTypes';
import { useProjectStore } from '../../store/projectStore';
import './Track.css';

interface TrackProps {
  track: DAWTrack;
}

export function Track({ track }: TrackProps) {
  const { updateTrack, removeTrack, selectedTrackId, selectTrack } = useDAWStore();
  const { projects } = useProjectStore();
  const [expanded, setExpanded] = useState(false);

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
  const pluginName = track.pluginId
    ? projects.find(p => p.id === track.pluginId)?.name || 'Unknown Plugin'
    : 'No plugin';

  return (
    <div
      className={`track ${isSelected ? 'selected' : ''}`}
      onClick={() => selectTrack(track.id)}
    >
      <div className="track-color" style={{ backgroundColor: track.color }} />

      <div className="track-header" onClick={() => setExpanded(!expanded)}>
        <div className="track-name-container">
          <div className="track-name">{track.name}</div>
          {track.pluginId && <div className="track-plugin">{pluginName}</div>}
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
  );
}
