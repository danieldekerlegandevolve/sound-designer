import React, { useRef, useState, useEffect } from 'react';
import { Activity, Play, Download, RefreshCw } from 'lucide-react';
import './FilterDesigner.css';

interface FilterBand {
  id: string;
  type: 'lowpass' | 'highpass' | 'bandpass' | 'notch' | 'peak' | 'lowshelf' | 'highshelf';
  frequency: number;
  gain: number;
  Q: number;
  enabled: boolean;
}

interface FilterDesignerProps {
  onSave?: (bands: FilterBand[]) => void;
}

export function FilterDesigner({ onSave }: FilterDesignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bands, setBands] = useState<FilterBand[]>([
    {
      id: '1',
      type: 'peak',
      frequency: 1000,
      gain: 0,
      Q: 1,
      enabled: true,
    },
  ]);
  const [selectedBand, setSelectedBand] = useState<string | null>('1');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<OscillatorNode | null>(null);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);

  useEffect(() => {
    drawFrequencyResponse();
  }, [bands]);

  const drawFrequencyResponse = () => {
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
    drawGrid(ctx, width, height);

    // Draw frequency labels
    drawFrequencyLabels(ctx, width, height);

    // Draw gain labels
    drawGainLabels(ctx, width, height);

    // Calculate and draw frequency response
    const frequencyResponse = calculateFrequencyResponse(bands);
    drawResponse(ctx, frequencyResponse, width, height);

    // Draw control points for each band
    drawControlPoints(ctx, bands, width, height);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    // Horizontal lines (gain)
    for (let db = -24; db <= 24; db += 6) {
      const y = height / 2 - (db / 48) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines (frequency)
    const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    frequencies.forEach((freq) => {
      const x = freqToX(freq, width);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });

    // Center line (0 dB)
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  const drawFrequencyLabels = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    const frequencies = [20, 100, 1000, 10000, 20000];
    const labels = ['20Hz', '100Hz', '1kHz', '10kHz', '20kHz'];

    frequencies.forEach((freq, i) => {
      const x = freqToX(freq, width);
      ctx.fillText(labels[i], x, height - 5);
    });
  };

  const drawGainLabels = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';

    for (let db = -24; db <= 24; db += 12) {
      const y = height / 2 - (db / 48) * height;
      ctx.fillText(`${db > 0 ? '+' : ''}${db}dB`, width - 5, y - 5);
    }
  };

  const calculateFrequencyResponse = (bands: FilterBand[]): number[] => {
    const response: number[] = [];
    const numPoints = 1000;

    for (let i = 0; i < numPoints; i++) {
      const freq = 20 * Math.pow(1000, i / numPoints); // 20Hz to 20kHz logarithmic
      let magnitude = 1.0;

      // Apply each enabled band's response
      bands
        .filter((b) => b.enabled)
        .forEach((band) => {
          magnitude *= getBandMagnitude(band, freq);
        });

      // Convert to dB
      const dB = 20 * Math.log10(magnitude);
      response.push(dB);
    }

    return response;
  };

  const getBandMagnitude = (band: FilterBand, freq: number): number => {
    const omega = (2 * Math.PI * freq) / 44100; // Normalized frequency
    const cos = Math.cos(omega);
    const sin = Math.sin(omega);
    const alpha = sin / (2 * band.Q);
    const A = Math.pow(10, band.gain / 40);

    let b0, b1, b2, a0, a1, a2;

    switch (band.type) {
      case 'lowpass':
        b0 = (1 - cos) / 2;
        b1 = 1 - cos;
        b2 = (1 - cos) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cos;
        a2 = 1 - alpha;
        break;

      case 'highpass':
        b0 = (1 + cos) / 2;
        b1 = -(1 + cos);
        b2 = (1 + cos) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cos;
        a2 = 1 - alpha;
        break;

      case 'peak':
        b0 = 1 + alpha * A;
        b1 = -2 * cos;
        b2 = 1 - alpha * A;
        a0 = 1 + alpha / A;
        a1 = -2 * cos;
        a2 = 1 - alpha / A;
        break;

      case 'lowshelf':
        b0 = A * ((A + 1) - (A - 1) * cos + 2 * Math.sqrt(A) * alpha);
        b1 = 2 * A * ((A - 1) - (A + 1) * cos);
        b2 = A * ((A + 1) - (A - 1) * cos - 2 * Math.sqrt(A) * alpha);
        a0 = (A + 1) + (A - 1) * cos + 2 * Math.sqrt(A) * alpha;
        a1 = -2 * ((A - 1) + (A + 1) * cos);
        a2 = (A + 1) + (A - 1) * cos - 2 * Math.sqrt(A) * alpha;
        break;

      case 'highshelf':
        b0 = A * ((A + 1) + (A - 1) * cos + 2 * Math.sqrt(A) * alpha);
        b1 = -2 * A * ((A - 1) + (A + 1) * cos);
        b2 = A * ((A + 1) + (A - 1) * cos - 2 * Math.sqrt(A) * alpha);
        a0 = (A + 1) - (A - 1) * cos + 2 * Math.sqrt(A) * alpha;
        a1 = 2 * ((A - 1) - (A + 1) * cos);
        a2 = (A + 1) - (A - 1) * cos - 2 * Math.sqrt(A) * alpha;
        break;

      default:
        return 1.0;
    }

    // Calculate magnitude response
    const numerator =
      b0 * b0 +
      b1 * b1 +
      b2 * b2 +
      2 * (b0 * b1 + b1 * b2) * cos +
      2 * b0 * b2 * Math.cos(2 * omega);
    const denominator =
      a0 * a0 +
      a1 * a1 +
      a2 * a2 +
      2 * (a0 * a1 + a1 * a2) * cos +
      2 * a0 * a2 * Math.cos(2 * omega);

    return Math.sqrt(numerator / denominator);
  };

  const drawResponse = (
    ctx: CanvasRenderingContext2D,
    response: number[],
    width: number,
    height: number
  ) => {
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 3;
    ctx.beginPath();

    response.forEach((dB, i) => {
      const x = (i / response.length) * width;
      const y = height / 2 - (dB / 48) * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  const drawControlPoints = (
    ctx: CanvasRenderingContext2D,
    bands: FilterBand[],
    width: number,
    height: number
  ) => {
    bands.forEach((band) => {
      if (!band.enabled) return;

      const x = freqToX(band.frequency, width);
      const y = height / 2 - (band.gain / 48) * height;

      // Draw circle
      ctx.fillStyle = band.id === selectedBand ? '#4a9eff' : '#888';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#fff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(band.type, x, y - 15);
    });
  };

  const freqToX = (freq: number, width: number): number => {
    const minFreq = 20;
    const maxFreq = 20000;
    return (Math.log(freq / minFreq) / Math.log(maxFreq / minFreq)) * width;
  };

  const xToFreq = (x: number, width: number): number => {
    const minFreq = 20;
    const maxFreq = 20000;
    return minFreq * Math.pow(maxFreq / minFreq, x / width);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on existing control point
    const clickedBand = bands.find((band) => {
      const bandX = freqToX(band.frequency, canvas.width);
      const bandY = canvas.height / 2 - (band.gain / 48) * canvas.height;
      const distance = Math.sqrt(Math.pow(x - bandX, 2) + Math.pow(y - bandY, 2));
      return distance < 12;
    });

    if (clickedBand) {
      setSelectedBand(clickedBand.id);
    }
  };

  const addBand = () => {
    const newBand: FilterBand = {
      id: Date.now().toString(),
      type: 'peak',
      frequency: 1000,
      gain: 0,
      Q: 1,
      enabled: true,
    };
    setBands([...bands, newBand]);
    setSelectedBand(newBand.id);
  };

  const removeBand = (id: string) => {
    setBands(bands.filter((b) => b.id !== id));
    if (selectedBand === id) {
      setSelectedBand(bands[0]?.id || null);
    }
  };

  const updateBand = (id: string, updates: Partial<FilterBand>) => {
    setBands(bands.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const selectedBandData = bands.find((b) => b.id === selectedBand);

  const playPreview = async () => {
    if (isPlaying) {
      stopPreview();
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 220;
    gainNode.gain.value = 0.2;

    let previousNode: AudioNode = oscillator;

    // Create filter chain
    filterNodesRef.current = bands
      .filter((b) => b.enabled)
      .map((band) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = band.type === 'peak' ? 'peaking' : band.type;
        filter.frequency.value = band.frequency;
        filter.Q.value = band.Q;
        filter.gain.value = band.gain;

        previousNode.connect(filter);
        previousNode = filter;

        return filter;
      });

    previousNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    sourceNodeRef.current = oscillator;
    setIsPlaying(true);
  };

  const stopPreview = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    filterNodesRef.current = [];
    setIsPlaying(false);
  };

  const exportFilter = () => {
    const filterData = {
      name: 'Custom Filter',
      bands: bands.filter((b) => b.enabled),
      timestamp: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(filterData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'filter_design.json';
    link.click();

    URL.revokeObjectURL(url);

    if (onSave) {
      onSave(bands);
    }
  };

  return (
    <div className="filter-designer">
      <div className="designer-header">
        <div className="header-left">
          <Activity size={24} />
          <h3>Filter Designer</h3>
        </div>
        <div className="header-right">
          <button className="preview-btn" onClick={playPreview}>
            <Play size={16} />
            {isPlaying ? 'Stop' : 'Preview'}
          </button>
          <button className="export-btn" onClick={exportFilter}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="designer-content">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="filter-canvas"
          onClick={handleCanvasClick}
        />

        <div className="designer-controls">
          <div className="bands-list">
            <div className="bands-header">
              <h4>Filter Bands</h4>
              <button className="add-band-btn" onClick={addBand}>
                + Add Band
              </button>
            </div>

            {bands.map((band) => (
              <div
                key={band.id}
                className={`band-item ${band.id === selectedBand ? 'selected' : ''}`}
                onClick={() => setSelectedBand(band.id)}
              >
                <input
                  type="checkbox"
                  checked={band.enabled}
                  onChange={(e) => updateBand(band.id, { enabled: e.target.checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="band-type">{band.type}</span>
                <span className="band-freq">{band.frequency.toFixed(0)} Hz</span>
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBand(band.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {selectedBandData && (
            <div className="band-controls">
              <h4>Band Parameters</h4>

              <div className="control-row">
                <label>Type</label>
                <select
                  value={selectedBandData.type}
                  onChange={(e) =>
                    updateBand(selectedBand!, {
                      type: e.target.value as FilterBand['type'],
                    })
                  }
                >
                  <option value="lowpass">Low Pass</option>
                  <option value="highpass">High Pass</option>
                  <option value="bandpass">Band Pass</option>
                  <option value="notch">Notch</option>
                  <option value="peak">Peak</option>
                  <option value="lowshelf">Low Shelf</option>
                  <option value="highshelf">High Shelf</option>
                </select>
              </div>

              <div className="control-row">
                <label>Frequency: {selectedBandData.frequency.toFixed(0)} Hz</label>
                <input
                  type="range"
                  min="20"
                  max="20000"
                  value={selectedBandData.frequency}
                  onChange={(e) =>
                    updateBand(selectedBand!, { frequency: parseFloat(e.target.value) })
                  }
                />
              </div>

              <div className="control-row">
                <label>Gain: {selectedBandData.gain.toFixed(1)} dB</label>
                <input
                  type="range"
                  min="-24"
                  max="24"
                  step="0.1"
                  value={selectedBandData.gain}
                  onChange={(e) =>
                    updateBand(selectedBand!, { gain: parseFloat(e.target.value) })
                  }
                />
              </div>

              <div className="control-row">
                <label>Q: {selectedBandData.Q.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={selectedBandData.Q}
                  onChange={(e) =>
                    updateBand(selectedBand!, { Q: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
