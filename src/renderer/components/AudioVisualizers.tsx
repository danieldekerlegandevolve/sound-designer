/**
 * Audio Visualizers
 *
 * Waveform, spectrum analyzer, and oscilloscope visualizations
 */

import React, { useRef, useEffect, useState } from 'react';

export interface WaveformVisualizerProps {
  analyzerNode: AnalyserNode | null;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

/**
 * Waveform Visualizer - Time domain display
 */
export function WaveformVisualizer({
  analyzerNode,
  width = 800,
  height = 200,
  color = '#64c8ff',
  backgroundColor = 'rgba(0, 0, 0, 0.2)',
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!analyzerNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzerNode.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyzerNode.getByteTimeDomainData(dataArray);

      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
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
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyzerNode, width, height, color, backgroundColor]);

  return (
    <div className="waveform-visualizer">
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
}

/**
 * Spectrum Analyzer - Frequency domain display
 */
export function SpectrumAnalyzer({
  analyzerNode,
  width = 800,
  height = 200,
  color = '#6496ff',
  backgroundColor = 'rgba(0, 0, 0, 0.2)',
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!analyzerNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzerNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyzerNode.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Draw spectrum
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, adjustAlpha(color, 0.3));

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      // Draw frequency labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px sans-serif';
      ctx.fillText('20Hz', 5, height - 5);
      ctx.fillText('1kHz', width / 2 - 15, height - 5);
      ctx.fillText('20kHz', width - 35, height - 5);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyzerNode, width, height, color, backgroundColor]);

  return (
    <div className="spectrum-analyzer">
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
}

/**
 * Oscilloscope - XY mode display
 */
export function Oscilloscope({
  analyzerNode,
  width = 400,
  height = 400,
  color = '#64ff96',
  backgroundColor = 'rgba(0, 0, 0, 0.2)',
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!analyzerNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzerNode.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyzerNode.getByteTimeDomainData(dataArray);

      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x <= width; x += width / 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= height; y += height / 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw oscilloscope trace (XY mode - simplified)
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < bufferLength; i += 2) {
        const x = (dataArray[i] / 255) * width;
        const y = (dataArray[i + 1] / 255) * height;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyzerNode, width, height, color, backgroundColor]);

  return (
    <div className="oscilloscope">
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
}

/**
 * Audio Level Meters
 */
export interface AudioMeterProps {
  analyzerNode: AnalyserNode | null;
  orientation?: 'horizontal' | 'vertical';
  width?: number;
  height?: number;
}

export function AudioMeter({
  analyzerNode,
  orientation = 'vertical',
  width = 40,
  height = 200,
}: AudioMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [peakLevel, setPeakLevel] = useState(0);
  const [rmsLevel, setRmsLevel] = useState(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!analyzerNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzerNode.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyzerNode.getByteTimeDomainData(dataArray);

      // Calculate peak and RMS
      let peak = 0;
      let sum = 0;

      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        peak = Math.max(peak, Math.abs(normalized));
        sum += normalized * normalized;
      }

      const rms = Math.sqrt(sum / bufferLength);

      setPeakLevel(peak);
      setRmsLevel(rms);

      // Clear canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, width, height);

      if (orientation === 'vertical') {
        // Draw RMS level
        const rmsHeight = rms * height;
        const rmsGradient = ctx.createLinearGradient(0, height - rmsHeight, 0, height);
        rmsGradient.addColorStop(0, '#64ff96');
        rmsGradient.addColorStop(0.6, '#ffc864');
        rmsGradient.addColorStop(1, '#ff6464');

        ctx.fillStyle = rmsGradient;
        ctx.fillRect(0, height - rmsHeight, width / 2, rmsHeight);

        // Draw peak level
        const peakHeight = peak * height;
        const peakGradient = ctx.createLinearGradient(0, height - peakHeight, 0, height);
        peakGradient.addColorStop(0, '#64c8ff');
        peakGradient.addColorStop(0.6, '#ffc864');
        peakGradient.addColorStop(1, '#ff6464');

        ctx.fillStyle = peakGradient;
        ctx.fillRect(width / 2, height - peakHeight, width / 2, peakHeight);

        // Draw scale marks
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
          const y = (i / 10) * height;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      } else {
        // Horizontal orientation
        const rmsWidth = rms * width;
        const peakWidth = peak * width;

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#64ff96');
        gradient.addColorStop(0.6, '#ffc864');
        gradient.addColorStop(1, '#ff6464');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, rmsWidth, height / 2);
        ctx.fillRect(0, height / 2, peakWidth, height / 2);
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyzerNode, orientation, width, height]);

  return (
    <div className="audio-meter">
      <canvas ref={canvasRef} width={width} height={height} />
      <div className="meter-labels">
        <span className="meter-label">Peak: {(peakLevel * 100).toFixed(0)}%</span>
        <span className="meter-label">RMS: {(rmsLevel * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

/**
 * Helper function to adjust color alpha
 */
function adjustAlpha(color: string, alpha: number): string {
  // Simple alpha adjustment for hex colors
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}
