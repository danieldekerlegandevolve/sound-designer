import React, { useRef, useState } from 'react';
import { Upload, Play, Download, Waveform } from 'lucide-react';
import './ConvolutionIRLoader.css';

interface ImpulseResponse {
  id: string;
  name: string;
  buffer: AudioBuffer;
  duration: number;
  sampleRate: number;
}

interface ConvolutionIRLoaderProps {
  onLoad?: (ir: ImpulseResponse) => void;
}

export function ConvolutionIRLoader({ onLoad }: ConvolutionIRLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [impulseResponse, setImpulseResponse] = useState<ImpulseResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const loadIRFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      const ir: ImpulseResponse = {
        id: Date.now().toString(),
        name: file.name,
        buffer: audioBuffer,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
      };

      setImpulseResponse(ir);
      drawWaveform(audioBuffer);

      if (onLoad) {
        onLoad(ir);
      }
    } catch (error) {
      alert('Failed to load impulse response: ' + error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadIRFile(file);
    }
  };

  const drawWaveform = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = (i * height) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Get channel data
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    // Draw waveform
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const yMin = (1 + min) * amp;
      const yMax = (1 + max) * amp;

      if (i === 0) {
        ctx.moveTo(i, yMin);
      } else {
        ctx.lineTo(i, yMin);
      }
    }

    ctx.stroke();

    // Draw center line
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  const playPreview = async () => {
    if (!impulseResponse) return;

    if (isPlaying) {
      stopPreview();
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;

    // Create impulse source
    const impulse = audioContext.createBufferSource();
    impulse.buffer = impulseResponse.buffer;

    // Create gain node
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5;

    impulse.connect(gainNode);
    gainNode.connect(audioContext.destination);

    impulse.onended = () => {
      setIsPlaying(false);
      sourceNodeRef.current = null;
    };

    impulse.start();
    sourceNodeRef.current = impulse;
    setIsPlaying(true);
  };

  const stopPreview = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const generatePresets = () => {
    const presets = [
      { name: 'Small Room', decay: 0.3, size: 0.2 },
      { name: 'Medium Hall', decay: 1.5, size: 0.5 },
      { name: 'Large Cathedral', decay: 3.0, size: 0.9 },
      { name: 'Plate Reverb', decay: 1.0, size: 0.3 },
    ];

    return presets;
  };

  const loadPreset = (preset: { name: string; decay: number; size: number }) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;
    const sampleRate = audioContext.sampleRate;
    const length = Math.floor(sampleRate * preset.decay);

    // Create synthetic IR buffer
    const buffer = audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t / preset.decay);
        const noise = (Math.random() * 2 - 1) * decay;

        // Add early reflections
        const reflections = Math.sin(t * 1000 * preset.size) * decay * 0.3;

        channelData[i] = noise + reflections;
      }
    }

    const ir: ImpulseResponse = {
      id: Date.now().toString(),
      name: preset.name,
      buffer,
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
    };

    setImpulseResponse(ir);
    drawWaveform(buffer);

    if (onLoad) {
      onLoad(ir);
    }
  };

  return (
    <div className="convolution-ir-loader">
      <div className="loader-header">
        <div className="header-left">
          <Waveform size={24} />
          <h3>Convolution Reverb</h3>
        </div>
        <div className="header-right">
          {impulseResponse && (
            <button className="preview-btn" onClick={playPreview}>
              <Play size={16} />
              {isPlaying ? 'Stop' : 'Preview IR'}
            </button>
          )}
        </div>
      </div>

      <div className="loader-content">
        {!impulseResponse ? (
          <div className="upload-area">
            <Upload size={48} />
            <h4>Load Impulse Response</h4>
            <p>Upload a WAV file containing an impulse response</p>
            <label className="upload-btn">
              Choose File
              <input
                type="file"
                accept=".wav,.mp3,.flac"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </label>
            <div className="presets-section">
              <h5>Or try a preset:</h5>
              <div className="preset-buttons">
                {generatePresets().map((preset) => (
                  <button
                    key={preset.name}
                    className="preset-btn"
                    onClick={() => loadPreset(preset)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="ir-display">
            <div className="ir-info">
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{impulseResponse.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Duration:</span>
                <span className="info-value">
                  {impulseResponse.duration.toFixed(2)}s
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Sample Rate:</span>
                <span className="info-value">{impulseResponse.sampleRate} Hz</span>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={800}
              height={200}
              className="ir-waveform"
            />

            <div className="ir-actions">
              <label className="change-btn">
                <Upload size={16} />
                Load Different IR
                <input
                  type="file"
                  accept=".wav,.mp3,.flac"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>
              <button className="export-btn">
                <Download size={16} />
                Export Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
