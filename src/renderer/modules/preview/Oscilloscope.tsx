import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../../audio/AudioEngine';
import './Oscilloscope.css';

interface OscilloscopeProps {
  width?: number;
  height?: number;
  isPlaying: boolean;
}

export function Oscilloscope({ width = 600, height = 150, isPlaying }: OscilloscopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearCanvas();
      return;
    }

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const timeDomainData = audioEngine.getTimeDomainData();
      if (!timeDomainData) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      drawGrid(ctx);

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#4a9eff';
      ctx.beginPath();

      const sliceWidth = (width * 1.0) / timeDomainData.length;
      let x = 0;

      for (let i = 0; i < timeDomainData.length; i++) {
        const v = timeDomainData[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw center line
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, width, height]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    drawGrid(ctx);

    // Draw center line
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    // Vertical lines
    const verticalSpacing = width / 10;
    for (let i = 0; i <= 10; i++) {
      const x = i * verticalSpacing;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    const horizontalSpacing = height / 4;
    for (let i = 0; i <= 4; i++) {
      const y = i * horizontalSpacing;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  return (
    <div className="oscilloscope">
      <div className="oscilloscope-header">
        <span className="oscilloscope-title">Oscilloscope</span>
        <span className="oscilloscope-status">{isPlaying ? '● ACTIVE' : '○ INACTIVE'}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="oscilloscope-canvas"
      />
    </div>
  );
}
