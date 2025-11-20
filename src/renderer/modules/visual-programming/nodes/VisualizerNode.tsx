import React, { memo, useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './VisualizerNode.css';

/**
 * Visualizer Node Component
 * Real-time audio visualization node
 */

interface VisualizerNodeData {
  label: string;
  type: 'oscilloscope' | 'spectrum' | 'meter';
  audioData?: Float32Array;
}

const VisualizerNode: React.FC<NodeProps<VisualizerNodeData>> = ({ data, selected }) => {
  const { label, type, audioData } = data;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);

      if (audioData && audioData.length > 0) {
        setIsActive(true);

        ctx.strokeStyle = '#51cf66';
        ctx.lineWidth = 2;
        ctx.beginPath();

        if (type === 'oscilloscope') {
          // Draw oscilloscope
          const sliceWidth = width / audioData.length;
          let x = 0;

          for (let i = 0; i < audioData.length; i++) {
            const v = audioData[i];
            const y = (v + 1) * height / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }
        } else if (type === 'spectrum') {
          // Draw frequency spectrum
          const barWidth = width / audioData.length;

          for (let i = 0; i < audioData.length; i++) {
            const barHeight = (audioData[i] / 255) * height;
            const x = i * barWidth;
            const y = height - barHeight;

            ctx.fillStyle = `hsl(${(i / audioData.length) * 360}, 70%, 50%)`;
            ctx.fillRect(x, y, barWidth - 1, barHeight);
          }
        } else if (type === 'meter') {
          // Draw level meter
          const level = audioData.reduce((sum, val) => sum + Math.abs(val), 0) / audioData.length;
          const meterHeight = level * height;

          // Draw gradient meter
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#51cf66');
          gradient.addColorStop(0.6, '#ffd43b');
          gradient.addColorStop(1, '#ff6b6b');

          ctx.fillStyle = gradient;
          ctx.fillRect(0, height - meterHeight, width, meterHeight);
        }

        ctx.stroke();
      } else {
        setIsActive(false);
      }
    };

    const animationId = requestAnimationFrame(function animate() {
      draw();
      requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animationId);
  }, [audioData, type]);

  return (
    <div className={`visualizer-node ${selected ? 'selected' : ''} ${isActive ? 'active' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        id="audio-in"
        className="visualizer-input"
      />

      <div className="visualizer-header">
        <span className="visualizer-icon">◈</span>
        <span className="visualizer-label">{label}</span>
      </div>

      <div className="visualizer-body">
        <canvas
          ref={canvasRef}
          width={200}
          height={100}
          className="visualizer-canvas"
        />
        <div className="visualizer-type">{type}</div>
      </div>
    </div>
  );
};

export default memo(VisualizerNode);
