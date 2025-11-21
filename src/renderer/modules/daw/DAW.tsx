import React, { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useDAWStore } from '../../store/dawStore';
import { Transport } from './Transport';
import { Timeline } from './Timeline';
import { Track } from './Track';
import { DAWAudioEngine } from '../../audio/DAWAudioEngine';
import './DAW.css';

export function DAW() {
  const { project, addTrack, setPlaybackPosition } = useDAWStore();
  const audioEngineRef = useRef<DAWAudioEngine | null>(null);

  // Initialize audio engine
  useEffect(() => {
    audioEngineRef.current = new DAWAudioEngine();

    return () => {
      audioEngineRef.current?.destroy();
    };
  }, []);

  // Setup audio engine when project changes
  useEffect(() => {
    if (!audioEngineRef.current) return;

    const loadPlugins = async () => {
      // Load all plugin projects for tracks with assigned plugins
      const pluginProjects = new Map();

      for (const track of project.tracks) {
        if (track.pluginState) {
          try {
            const result = await window.electronAPI.getRecentProjects();
            if (result.success) {
              const found = result.projects.find(
                (p: any) => p.project.id === track.pluginState?.pluginProjectId
              );
              if (found) {
                pluginProjects.set(found.project.id, found.project);
              }
            }
          } catch (error) {
            console.error('Failed to load plugin project:', error);
          }
        }
      }

      await audioEngineRef.current?.setupProject(project, pluginProjects);
    };

    loadPlugins();
  }, [project.tracks]);

  // Expose audio engine methods to store
  useEffect(() => {
    if (audioEngineRef.current) {
      (window as any).__dawAudioEngine = audioEngineRef.current;
    }
  }, []);

  const handleAddTrack = () => {
    // For now, default to instrument track
    // In future, show menu to choose track type
    addTrack('instrument');
  };

  return (
    <div className="daw">
      <Transport audioEngine={audioEngineRef.current} />

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
