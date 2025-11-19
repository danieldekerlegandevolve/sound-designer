import React, { useState, useRef, useEffect } from 'react';
import { useSampleStore } from '../../store/sampleStore';
import {
  Upload,
  Play,
  Pause,
  Square,
  Scissors,
  Copy,
  Trash2,
  Star,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { SAMPLE_CATEGORIES, formatDuration, formatFileSize } from '@shared/sampleTypes';
import './SampleManager.css';

interface SampleManagerProps {
  onClose?: () => void;
}

export function SampleManager({ onClose }: SampleManagerProps) {
  const {
    samples,
    currentSample,
    searchQuery,
    selectedCategory,
    showFavoritesOnly,
    zoom,
    selection,
    isPlaying,
    playbackPosition,
    addSample,
    deleteSample,
    setCurrentSample,
    toggleFavorite,
    setSearchQuery,
    setSelectedCategory,
    toggleFavoritesOnly,
    normalizeSample,
    reverseSample,
    trimSample,
    fadeSample,
    setZoom,
    setSelection,
    setPlaying,
    setPlaybackPosition,
    exportSample,
    duplicateSample,
  } = useSampleStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioContext] = useState(() => new AudioContext());
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);

  const filteredSamples = samples.filter((sample) => {
    if (searchQuery && !sample.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCategory && sample.category !== selectedCategory) {
      return false;
    }
    if (showFavoritesOnly && !sample.isFavorite) {
      return false;
    }
    return true;
  });

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentSample || !currentSample.audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    const audioBuffer = currentSample.audioBuffer;
    const channelHeight = height / audioBuffer.numberOfChannels;

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const step = Math.max(1, Math.floor(channelData.length / (width * zoom)));

      ctx.strokeStyle = '#4a9eff';
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let i = 0; i < width; i++) {
        const start = Math.floor(i * step / zoom);
        const end = Math.floor((i + 1) * step / zoom);

        let min = 1;
        let max = -1;

        for (let j = start; j < Math.min(end, channelData.length); j++) {
          const value = channelData[j];
          if (value < min) min = value;
          if (value > max) max = value;
        }

        const y = channel * channelHeight + channelHeight / 2;
        const yMin = y + min * (channelHeight / 2) * 0.9;
        const yMax = y + max * (channelHeight / 2) * 0.9;

        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          ctx.lineTo(i, yMax);
          ctx.lineTo(i, yMin);
        }
      }

      ctx.stroke();

      // Center line
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, channel * channelHeight + channelHeight / 2);
      ctx.lineTo(width, channel * channelHeight + channelHeight / 2);
      ctx.stroke();
    }

    // Draw selection
    if (selection) {
      const startX = (selection.start / audioBuffer.length) * width;
      const endX = (selection.end / audioBuffer.length) * width;

      ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
      ctx.fillRect(startX, 0, endX - startX, height);

      ctx.strokeStyle = '#4a9eff';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, 0, endX - startX, height);
    }

    // Draw playback position
    if (isPlaying) {
      const x = (playbackPosition / audioBuffer.length) * width;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [currentSample, zoom, selection, playbackPosition, isPlaying]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      try {
        await addSample(files[i]);
      } catch (error) {
        console.error('Failed to load sample:', error);
      }
    }

    e.target.value = '';
  };

  const handlePlayPause = () => {
    if (!currentSample || !currentSample.audioBuffer) return;

    if (isPlaying) {
      if (audioSource) {
        audioSource.stop();
        setAudioSource(null);
      }
      setPlaying(false);
    } else {
      const source = audioContext.createBufferSource();
      source.buffer = currentSample.audioBuffer;
      source.connect(audioContext.destination);

      const startTime = selection ? selection.start / currentSample.sampleRate : 0;
      source.start(0, startTime);

      source.onended = () => {
        setPlaying(false);
        setPlaybackPosition(0);
      };

      setAudioSource(source);
      setPlaying(true);
    }
  };

  const handleExport = () => {
    if (!currentSample) return;

    const blob = exportSample(currentSample.id);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentSample.name}.wav`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sample-manager">
      <div className="manager-header">
        <h2>Sample Manager</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="manager-content">
        {/* Sample Library */}
        <div className="sample-library">
          <div className="library-header">
            <input
              type="text"
              placeholder="Search samples..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} />
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <div className="category-filters">
            <button
              className={`category-btn ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              All ({samples.length})
            </button>
            {SAMPLE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={`category-btn ${selectedCategory === cat.value ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
            <button
              className={`category-btn ${showFavoritesOnly ? 'active' : ''}`}
              onClick={toggleFavoritesOnly}
            >
              <Star size={14} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="samples-list">
            {filteredSamples.map((sample) => (
              <div
                key={sample.id}
                className={`sample-item ${currentSample?.id === sample.id ? 'active' : ''}`}
                onClick={() => setCurrentSample(sample)}
              >
                <div className="sample-info">
                  <h4>{sample.name}</h4>
                  <div className="sample-meta">
                    <span>{formatDuration(sample.duration)}</span>
                    <span>•</span>
                    <span>{sample.channels === 1 ? 'Mono' : 'Stereo'}</span>
                    <span>•</span>
                    <span>{sample.sampleRate / 1000}kHz</span>
                  </div>
                </div>
                <button
                  className="favorite-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(sample.id);
                  }}
                >
                  <Star size={16} fill={sample.isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Editor */}
        <div className="sample-editor">
          {currentSample ? (
            <>
              <div className="editor-toolbar">
                <div className="toolbar-group">
                  <button onClick={handlePlayPause} title="Play/Pause">
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button onClick={() => setPlaying(false)} title="Stop">
                    <Square size={18} />
                  </button>
                </div>

                <div className="toolbar-group">
                  <button onClick={() => setZoom(zoom * 1.5)} title="Zoom In">
                    <ZoomIn size={18} />
                  </button>
                  <button onClick={() => setZoom(zoom / 1.5)} title="Zoom Out">
                    <ZoomOut size={18} />
                  </button>
                  <button onClick={() => setZoom(1)} title="Fit">
                    <Maximize2 size={18} />
                  </button>
                </div>

                <div className="toolbar-group">
                  <button
                    onClick={() => currentSample && normalizeSample(currentSample.id)}
                    title="Normalize"
                  >
                    <Volume2 size={18} />
                  </button>
                  <button
                    onClick={() => currentSample && reverseSample(currentSample.id)}
                    title="Reverse"
                  >
                    <RotateCcw size={18} />
                  </button>
                  {selection && (
                    <button
                      onClick={() => {
                        if (currentSample) {
                          trimSample(currentSample.id, selection.start, selection.end);
                          setSelection(null);
                        }
                      }}
                      title="Trim to Selection"
                    >
                      <Scissors size={18} />
                    </button>
                  )}
                </div>

                <div className="toolbar-group ml-auto">
                  <button onClick={handleExport} title="Export">
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => currentSample && duplicateSample(currentSample.id)}
                    title="Duplicate"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (currentSample && confirm('Delete this sample?')) {
                        deleteSample(currentSample.id);
                        setCurrentSample(null);
                      }
                    }}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <canvas
                ref={canvasRef}
                width={1200}
                height={300}
                className="waveform-canvas"
              />

              <div className="editor-info">
                <span>{currentSample.name}</span>
                <span>•</span>
                <span>{formatDuration(currentSample.duration)}</span>
                <span>•</span>
                <span>{currentSample.channels === 1 ? 'Mono' : 'Stereo'}</span>
                <span>•</span>
                <span>{currentSample.sampleRate}Hz</span>
                {currentSample.fileSize && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(currentSample.fileSize)}</span>
                  </>
                )}
                <span className="ml-auto">Zoom: {(zoom * 100).toFixed(0)}%</span>
              </div>
            </>
          ) : (
            <div className="empty-editor">
              <p>No sample selected</p>
              <p className="hint">Select a sample from the library or import audio files</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
