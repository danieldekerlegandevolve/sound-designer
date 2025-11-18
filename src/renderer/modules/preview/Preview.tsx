import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Play, Square, Volume2, Settings } from 'lucide-react';
import './Preview.css';

export function Preview() {
  const { project } = useProjectStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  useEffect(() => {
    // Initialize Web Audio API
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handlePlayPause = () => {
    if (!audioContextRef.current) return;

    if (isPlaying) {
      // Stop audio
      setIsPlaying(false);
    } else {
      // Start audio processing
      setIsPlaying(true);
      startAudioProcessing();
    }
  };

  const startAudioProcessing = () => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;

    // Create a simple oscillator as demo
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.frequency.value = 440;
    oscillator.type = 'sine';
    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();

    // Generate waveform data for visualization
    const data = Array.from({ length: 100 }, (_, i) =>
      Math.sin((i / 100) * Math.PI * 2) * 50
    );
    setWaveformData(data);

    setTimeout(() => {
      oscillator.stop();
      setIsPlaying(false);
    }, 2000);
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

          {/* Waveform visualization */}
          {isPlaying && waveformData.length > 0 && (
            <div className="waveform-overlay">
              <svg width="100%" height="100">
                <path
                  d={`M ${waveformData.map((v, i) => `${(i / waveformData.length) * 100},${50 + v}`).join(' L ')}`}
                  stroke="rgba(74, 158, 255, 0.5)"
                  fill="none"
                  strokeWidth="2"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="preview-controls">
          <button
            className={`play-button ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayPause}
          >
            {isPlaying ? <Square size={20} /> : <Play size={20} />}
            {isPlaying ? 'Stop' : 'Play'}
          </button>

          <div className="volume-control">
            <Volume2 size={18} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="volume-slider"
            />
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </div>

          <button className="settings-button">
            <Settings size={18} />
            Audio Settings
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
