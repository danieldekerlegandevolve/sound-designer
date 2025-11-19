import React, { useRef, useEffect } from 'react';
import { audioEngine } from '../../audio/AudioEngine';
import './SpectrumAnalyzer.css';

interface SpectrumAnalyzerProps {
  width?: number;
  height?: number;
  isPlaying: boolean;
}

export function SpectrumAnalyzer({ width = 600, height = 150, isPlaying }: SpectrumAnalyzerProps) {
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

      const frequencyData = audioEngine.getFrequencyData();
      if (!frequencyData) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      drawGrid(ctx);

      // Draw frequency bars
      const barWidth = (width / frequencyData.length) * 2.5;
      let x = 0;

      for (let i = 0; i < frequencyData.length; i++) {
        const barHeight = (frequencyData[i] / 255) * height;

        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, '#4a9eff');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#ec4899');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      // Draw frequency labels
      drawFrequencyLabels(ctx);

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
    drawFrequencyLabels(ctx);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    // Horizontal lines (dB scale)
    const horizontalSpacing = height / 5;
    for (let i = 0; i <= 5; i++) {
      const y = i * horizontalSpacing;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines (frequency bands)
    const verticalSpacing = width / 10;
    for (let i = 0; i <= 10; i++) {
      const x = i * verticalSpacing;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  };

  const drawFrequencyLabels = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    // Approximate frequency labels (assuming 44.1kHz sample rate)
    const labels = ['20Hz', '100Hz', '500Hz', '1kHz', '5kHz', '10kHz', '20kHz'];
    const positions = [0.05, 0.15, 0.3, 0.45, 0.65, 0.8, 0.95];

    labels.forEach((label, i) => {
      const x = width * positions[i];
      ctx.fillText(label, x, height - 5);
    });
  };

  return (
    <div className="spectrum-analyzer">
      <div className="spectrum-header">
        <span className="spectrum-title">Spectrum Analyzer</span>
        <span className="spectrum-status">{isPlaying ? '● ACTIVE' : '○ INACTIVE'}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="spectrum-canvas"
      />
    </div>
  );
}
