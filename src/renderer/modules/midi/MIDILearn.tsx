import React, { useState, useEffect } from 'react';
import { useMIDIStore } from '../../store/midiStore';
import { Activity, Check, X, Settings } from 'lucide-react';
import { MIDI_CC_NAMES } from '@shared/midiTypes';
import './MIDILearn.css';

interface MIDILearnProps {
  parameterId: string;
  parameterName: string;
  currentValue: number;
  minValue: number;
  maxValue: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function MIDILearn({
  parameterId,
  parameterName,
  currentValue,
  minValue,
  maxValue,
  onComplete,
  onCancel,
}: MIDILearnProps) {
  const {
    learnState,
    mappings,
    startMIDILearn,
    stopMIDILearn,
    createMapping,
  } = useMIDIStore();

  const [mappingName, setMappingName] = useState(`${parameterName} Control`);
  const [curve, setCurve] = useState<'linear' | 'exponential' | 'logarithmic'>('linear');
  const [customMin, setCustomMin] = useState(minValue);
  const [customMax, setCustomMax] = useState(maxValue);
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    startMIDILearn(parameterId);

    return () => {
      stopMIDILearn();
    };
  }, [parameterId]);

  const handleCreateMapping = () => {
    if (learnState.lastLearnedCC === null || learnState.lastLearnedChannel === null) {
      return;
    }

    // Check if mapping already exists
    const existingMapping = mappings.find(
      (m) =>
        m.midiCC === learnState.lastLearnedCC &&
        m.midiChannel === learnState.lastLearnedChannel
    );

    if (existingMapping) {
      if (!confirm('A mapping for this CC already exists. Overwrite it?')) {
        return;
      }
    }

    createMapping({
      name: mappingName,
      midiCC: learnState.lastLearnedCC,
      midiChannel: learnState.lastLearnedChannel,
      parameterId,
      parameterName,
      min: useCustomRange ? customMin : minValue,
      max: useCustomRange ? customMax : maxValue,
      curve,
    });

    stopMIDILearn();
    onComplete?.();
  };

  const handleCancel = () => {
    stopMIDILearn();
    onCancel?.();
  };

  const ccName = learnState.lastLearnedCC !== null
    ? MIDI_CC_NAMES[learnState.lastLearnedCC] || 'Unknown CC'
    : null;

  return (
    <div className="midi-learn-overlay">
      <div className="midi-learn-dialog">
        <div className="learn-header">
          <h3>MIDI Learn</h3>
          <button className="close-btn" onClick={handleCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="learn-content">
          <div className="parameter-info">
            <label>Parameter:</label>
            <div className="parameter-name">{parameterName}</div>
            <div className="parameter-value">
              Current: {currentValue.toFixed(2)} ({minValue} - {maxValue})
            </div>
          </div>

          <div className="learn-status">
            {learnState.lastLearnedCC === null ? (
              <>
                <Activity className="activity-icon" size={48} />
                <p className="learn-prompt">Move a MIDI controller to learn...</p>
                <p className="learn-hint">
                  Twist a knob, move a fader, or press a key on your MIDI controller
                </p>
              </>
            ) : (
              <>
                <Check className="success-icon" size={48} />
                <p className="learn-success">MIDI CC detected!</p>
                <div className="detected-info">
                  <div className="detected-row">
                    <span className="label">CC Number:</span>
                    <span className="value">CC{learnState.lastLearnedCC}</span>
                  </div>
                  <div className="detected-row">
                    <span className="label">CC Name:</span>
                    <span className="value">{ccName}</span>
                  </div>
                  <div className="detected-row">
                    <span className="label">MIDI Channel:</span>
                    <span className="value">{(learnState.lastLearnedChannel || 0) + 1}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {learnState.lastLearnedCC !== null && (
            <div className="mapping-config">
              <div className="config-row">
                <label>Mapping Name:</label>
                <input
                  type="text"
                  value={mappingName}
                  onChange={(e) => setMappingName(e.target.value)}
                  placeholder="Enter mapping name..."
                />
              </div>

              <div className="config-row">
                <label>Response Curve:</label>
                <select value={curve} onChange={(e) => setCurve(e.target.value as any)}>
                  <option value="linear">Linear</option>
                  <option value="exponential">Exponential (Faster at top)</option>
                  <option value="logarithmic">Logarithmic (Faster at bottom)</option>
                </select>
              </div>

              <div className="config-row">
                <label>
                  <input
                    type="checkbox"
                    checked={useCustomRange}
                    onChange={(e) => setUseCustomRange(e.target.checked)}
                  />
                  Use Custom Range
                </label>
              </div>

              {useCustomRange && (
                <div className="range-inputs">
                  <div className="range-row">
                    <label>Min Value:</label>
                    <input
                      type="number"
                      value={customMin}
                      onChange={(e) => setCustomMin(Number(e.target.value))}
                      step="0.01"
                    />
                  </div>
                  <div className="range-row">
                    <label>Max Value:</label>
                    <input
                      type="number"
                      value={customMax}
                      onChange={(e) => setCustomMax(Number(e.target.value))}
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              <button
                className="advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings size={16} />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>

              {showAdvanced && (
                <div className="advanced-options">
                  <div className="option-info">
                    <h4>Curve Visualization</h4>
                    <CurvePreview curve={curve} />
                  </div>

                  <div className="option-info">
                    <h4>Tips</h4>
                    <ul>
                      <li>
                        <strong>Linear:</strong> 1:1 relationship, good for most controls
                      </li>
                      <li>
                        <strong>Exponential:</strong> More precision at higher values, good for
                        cutoff frequencies
                      </li>
                      <li>
                        <strong>Logarithmic:</strong> More precision at lower values, good for
                        volume/gain
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="learn-actions">
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          {learnState.lastLearnedCC !== null && (
            <button className="create-btn" onClick={handleCreateMapping}>
              Create Mapping
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CurvePreview({ curve }: { curve: 'linear' | 'exponential' | 'logarithmic' }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, 0);
    ctx.stroke();

    // Draw curve
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let x = 0; x <= width; x++) {
      const normalized = x / width;
      let y: number;

      switch (curve) {
        case 'exponential':
          y = Math.pow(normalized, 2);
          break;
        case 'logarithmic':
          y = Math.pow(normalized, 0.5);
          break;
        default:
          y = normalized;
      }

      const canvasY = height - y * height;

      if (x === 0) {
        ctx.moveTo(x, canvasY);
      } else {
        ctx.lineTo(x, canvasY);
      }
    }

    ctx.stroke();

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    for (let i = 1; i < 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      const x = (width / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }, [curve]);

  return <canvas ref={canvasRef} width={200} height={150} className="curve-canvas" />;
}
