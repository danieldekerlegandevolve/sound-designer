import React, { useRef, useState, useEffect } from 'react';
import { Waveform, Download, Upload, Play, Undo, Redo, Zap } from 'lucide-react';
import './WavetableEditor.css';

interface WavetablePoint {
  x: number;
  y: number;
}

export interface Wavetable {
  id: string;
  name: string;
  points: WavetablePoint[];
  resolution: number;
}

interface WavetableEditorProps {
  onSave?: (wavetable: Wavetable) => void;
  initialWavetable?: Wavetable;
}

export function WavetableEditor({ onSave, initialWavetable }: WavetableEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<WavetablePoint[]>(
    initialWavetable?.points || generateSineWave(256)
  );
  const [name, setName] = useState(initialWavetable?.name || 'Custom Wavetable');
  const [resolution, setResolution] = useState(initialWavetable?.resolution || 256);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<WavetablePoint[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio context for preview
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    drawWaveform();
  }, [points]);

  const drawWaveform = () => {
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

    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
      const y = (i * height) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let i = 0; i <= 8; i++) {
      const x = (i * width) / 8;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw center line
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw waveform
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 3;
    ctx.beginPath();

    points.forEach((point, i) => {
      const x = (point.x * width);
      const y = height / 2 - (point.y * height / 2);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw control points
    ctx.fillStyle = '#4a9eff';
    points.forEach((point) => {
      const x = point.x * width;
      const y = height / 2 - (point.y * height / 2);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    updateWaveform(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    updateWaveform(e);
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      addToHistory();
    }
    setIsDrawing(false);
  };

  const updateWaveform = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = ((rect.height / 2) - (e.clientY - rect.top)) / (rect.height / 2);

    // Clamp y between -1 and 1
    const clampedY = Math.max(-1, Math.min(1, y));

    // Find nearest point or insert new one
    const nearestIndex = Math.round(x * (points.length - 1));
    const newPoints = [...points];
    newPoints[nearestIndex] = { x: nearestIndex / (points.length - 1), y: clampedY };

    setPoints(newPoints);
  };

  const addToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...points]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPoints(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPoints(history[historyIndex + 1]);
    }
  };

  const loadPreset = (type: string) => {
    let newPoints: WavetablePoint[];

    switch (type) {
      case 'sine':
        newPoints = generateSineWave(resolution);
        break;
      case 'square':
        newPoints = generateSquareWave(resolution);
        break;
      case 'sawtooth':
        newPoints = generateSawtoothWave(resolution);
        break;
      case 'triangle':
        newPoints = generateTriangleWave(resolution);
        break;
      case 'noise':
        newPoints = generateNoiseWave(resolution);
        break;
      default:
        return;
    }

    setPoints(newPoints);
    addToHistory();
  };

  const playPreview = async () => {
    if (isPlaying) {
      stopPreview();
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;
    const wavetable = createWavetableBuffer(audioContext);

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.setPeriodicWave(wavetable);
    oscillator.frequency.value = 440;
    gainNode.gain.value = 0.3;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillatorRef.current = oscillator;
    setIsPlaying(true);

    // Auto-stop after 2 seconds
    setTimeout(() => {
      stopPreview();
    }, 2000);
  };

  const stopPreview = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    setIsPlaying(false);
  };

  const createWavetableBuffer = (audioContext: AudioContext): PeriodicWave => {
    const real = new Float32Array(points.length);
    const imag = new Float32Array(points.length);

    // Convert points to Fourier coefficients (simplified)
    points.forEach((point, i) => {
      real[i] = point.y;
      imag[i] = 0;
    });

    return audioContext.createPeriodicWave(real, imag);
  };

  const exportWavetable = () => {
    const wavetable: Wavetable = {
      id: Date.now().toString(),
      name,
      points,
      resolution,
    };

    const dataStr = JSON.stringify(wavetable, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/\s+/g, '_')}.wavetable.json`;
    link.click();

    URL.revokeObjectURL(url);

    if (onSave) {
      onSave(wavetable);
    }
  };

  const importWavetable = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const wavetable: Wavetable = JSON.parse(event.target?.result as string);
        setName(wavetable.name);
        setPoints(wavetable.points);
        setResolution(wavetable.resolution);
        addToHistory();
      } catch (error) {
        alert('Invalid wavetable file');
      }
    };
    reader.readAsText(file);
  };

  const normalizeWaveform = () => {
    const max = Math.max(...points.map((p) => Math.abs(p.y)));
    if (max === 0) return;

    const normalized = points.map((p) => ({ x: p.x, y: p.y / max }));
    setPoints(normalized);
    addToHistory();
  };

  return (
    <div className="wavetable-editor">
      <div className="editor-header">
        <div className="header-left">
          <Waveform size={24} />
          <input
            type="text"
            className="wavetable-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Wavetable name"
          />
        </div>
        <div className="header-right">
          <button className="preview-btn" onClick={playPreview}>
            <Play size={16} />
            {isPlaying ? 'Playing...' : 'Preview'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="wavetable-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        <div className="editor-controls">
          <div className="control-group">
            <label>Presets</label>
            <div className="preset-buttons">
              <button onClick={() => loadPreset('sine')}>Sine</button>
              <button onClick={() => loadPreset('square')}>Square</button>
              <button onClick={() => loadPreset('sawtooth')}>Sawtooth</button>
              <button onClick={() => loadPreset('triangle')}>Triangle</button>
              <button onClick={() => loadPreset('noise')}>Noise</button>
            </div>
          </div>

          <div className="control-group">
            <label>Resolution</label>
            <input
              type="range"
              min="64"
              max="1024"
              step="64"
              value={resolution}
              onChange={(e) => {
                const newRes = parseInt(e.target.value);
                setResolution(newRes);
                setPoints(resampleWaveform(points, newRes));
              }}
            />
            <span>{resolution} samples</span>
          </div>

          <div className="control-group">
            <label>Tools</label>
            <div className="tool-buttons">
              <button onClick={undo} disabled={historyIndex <= 0} title="Undo">
                <Undo size={16} />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                title="Redo"
              >
                <Redo size={16} />
              </button>
              <button onClick={normalizeWaveform} title="Normalize">
                <Zap size={16} />
                Normalize
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>Import/Export</label>
            <div className="io-buttons">
              <label className="import-btn">
                <Upload size={16} />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importWavetable}
                  style={{ display: 'none' }}
                />
              </label>
              <button onClick={exportWavetable}>
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Waveform generation functions
function generateSineWave(resolution: number): WavetablePoint[] {
  const points: WavetablePoint[] = [];
  for (let i = 0; i < resolution; i++) {
    const x = i / (resolution - 1);
    const y = Math.sin(x * Math.PI * 2);
    points.push({ x, y });
  }
  return points;
}

function generateSquareWave(resolution: number): WavetablePoint[] {
  const points: WavetablePoint[] = [];
  for (let i = 0; i < resolution; i++) {
    const x = i / (resolution - 1);
    const y = x < 0.5 ? 1 : -1;
    points.push({ x, y });
  }
  return points;
}

function generateSawtoothWave(resolution: number): WavetablePoint[] {
  const points: WavetablePoint[] = [];
  for (let i = 0; i < resolution; i++) {
    const x = i / (resolution - 1);
    const y = 2 * x - 1;
    points.push({ x, y });
  }
  return points;
}

function generateTriangleWave(resolution: number): WavetablePoint[] {
  const points: WavetablePoint[] = [];
  for (let i = 0; i < resolution; i++) {
    const x = i / (resolution - 1);
    const y = x < 0.5 ? 4 * x - 1 : -4 * x + 3;
    points.push({ x, y });
  }
  return points;
}

function generateNoiseWave(resolution: number): WavetablePoint[] {
  const points: WavetablePoint[] = [];
  for (let i = 0; i < resolution; i++) {
    const x = i / (resolution - 1);
    const y = Math.random() * 2 - 1;
    points.push({ x, y });
  }
  return points;
}

function resampleWaveform(
  points: WavetablePoint[],
  newResolution: number
): WavetablePoint[] {
  const newPoints: WavetablePoint[] = [];

  for (let i = 0; i < newResolution; i++) {
    const x = i / (newResolution - 1);
    const sourceIndex = x * (points.length - 1);
    const index1 = Math.floor(sourceIndex);
    const index2 = Math.min(index1 + 1, points.length - 1);
    const t = sourceIndex - index1;

    // Linear interpolation
    const y = points[index1].y * (1 - t) + points[index2].y * t;

    newPoints.push({ x, y });
  }

  return newPoints;
}
