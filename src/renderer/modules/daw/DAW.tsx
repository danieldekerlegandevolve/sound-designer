import React from 'react';
import { Plus } from 'lucide-react';
import { useDAWStore } from '../../store/dawStore';
import { Transport } from './Transport';
import { Timeline } from './Timeline';
import { Track } from './Track';
import './DAW.css';

export function DAW() {
  const { project, addTrack } = useDAWStore();

  const handleAddTrack = () => {
    // For now, default to instrument track
    // In future, show menu to choose track type
    addTrack('instrument');
  };

  return (
    <div className="daw">
      <Transport />

      <div className="daw-main">
        <div className="daw-tracks">
          <div className="tracks-header">
            <h3>Tracks</h3>
            <button className="add-track-button" onClick={handleAddTrack}>
              <Plus size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Add Track
            </button>
          </div>

          <div className="tracks-list">
            {project.tracks.map((track) => (
              <Track key={track.id} track={track} />
            ))}
          </div>
        </div>

        <Timeline />
      </div>
    </div>
  );
}
