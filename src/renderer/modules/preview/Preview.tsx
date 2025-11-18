import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { audioEngine } from '../../audio/AudioEngine';
import { Play, Square, Volume2, Settings, RefreshCw } from 'lucide-react';
import './Preview.css';

export function Preview() {
  const { project } = useProjectStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Initialize audio engine
    const init = async () => {
      await audioEngine.initialize();
      await loadProjectIntoEngine();
    };
    init();

    return () => {
      audioEngine.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reload project when it changes
    if (project) {
      loadProjectIntoEngine();
    }
  }, [project.dspGraph]);

  const loadProjectIntoEngine = async () => {
    setIsLoading(true);
    try {
      await audioEngine.loadProject(project);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      await audioEngine.start();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioEngine.setMasterVolume(newVolume);
  };

  const handleReload = async () => {
    audioEngine.stop();
    setIsPlaying(false);
    await loadProjectIntoEngine();
  };

  return (
    <div className="preview">
      <div className="preview-container">
        <div className="preview-header">
          <h2>Plugin Preview</h2>
          <p>Real-time audio processing preview</p>
        </div>

        <div
          className="plugin-preview-canvas"
          style={{
            width: project.settings.width,
            height: project.settings.height,
            backgroundColor: project.settings.backgroundColor,
          }}
        >
          {/* Render UI components */}
          {project.uiComponents.map((component) => (
            <div
              key={component.id}
              className="preview-component"
              style={{
                position: 'absolute',
                left: component.x,
                top: component.y,
                width: component.width,
                height: component.height,
                ...component.style,
              }}
            >
              {component.type === 'knob' && (
                <div className="preview-knob">
                  <div className="knob-circle-preview">
                    <div className="knob-indicator-preview" />
                  </div>
                  <div className="knob-label-preview">{component.label}</div>
                </div>
              )}
              {component.type === 'slider' && (
                <div className="preview-slider">
                  <div className="slider-label-preview">{component.label}</div>
                  <input type="range" className="slider-input-preview" />
                </div>
              )}
              {component.type === 'button' && (
                <button className="preview-button">{component.label}</button>
              )}
            </div>
          ))}

        </div>

        <div className="preview-controls">
          <button
            className={`play-button ${isPlaying ? 'playing' : ''} ${isLoading ? 'loading' : ''}`}
            onClick={handlePlayPause}
            disabled={isLoading}
          >
            {isPlaying ? <Square size={20} /> : <Play size={20} />}
            {isPlaying ? 'Stop' : isLoading ? 'Loading...' : 'Play'}
          </button>

          <div className="volume-control">
            <Volume2 size={18} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="volume-slider"
            />
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </div>

          <button className="reload-button" onClick={handleReload} title="Reload DSP Graph">
            <RefreshCw size={18} />
            Reload
          </button>

          <button className="settings-button">
            <Settings size={18} />
            Settings
          </button>
        </div>

        <div className="preview-info">
          <div className="info-row">
            <span className="info-label">Sample Rate:</span>
            <span className="info-value">{project.settings.sampleRate} Hz</span>
          </div>
          <div className="info-row">
            <span className="info-label">Buffer Size:</span>
            <span className="info-value">{project.settings.bufferSize} samples</span>
          </div>
          <div className="info-row">
            <span className="info-label">DSP Nodes:</span>
            <span className="info-value">{project.dspGraph.nodes.length}</span>
          </div>
          <div className="info-row">
            <span className="info-label">UI Components:</span>
            <span className="info-value">{project.uiComponents.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
