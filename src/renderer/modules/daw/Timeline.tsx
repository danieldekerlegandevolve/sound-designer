import React, { useRef, useEffect } from 'react';
import { useDAWStore } from '../../store/dawStore';

export function Timeline() {
  const { project } = useDAWStore();
  const { transport, timeline, clips } = project;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Render timeline grid and measures
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate visible range
    const zoom = timeline.zoom;
    const beatsPerMeasure = transport.timeSignature.numerator;
    const totalBeats = Math.ceil(width / zoom) + 10; // Extra beats for scrolling
    const totalMeasures = Math.ceil(totalBeats / beatsPerMeasure);

    // Draw grid lines
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    // Draw beat lines
    for (let beat = 0; beat < totalBeats; beat++) {
      const x = beat * zoom;

      if (beat % beatsPerMeasure === 0) {
        // Measure line (stronger)
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 2;
      } else {
        // Beat line (subtle)
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;
      }

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw measure numbers
    ctx.fillStyle = '#888';
    ctx.font = '11px "Courier New", monospace';
    ctx.textBaseline = 'middle';

    for (let measure = 0; measure < totalMeasures; measure++) {
      const x = measure * beatsPerMeasure * zoom;
      ctx.fillText(`${measure + 1}`, x + 8, 20);
    }

    // Draw playhead
    const playheadX = transport.currentTime * zoom;
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = '#4a9eff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Draw playhead triangle
      ctx.fillStyle = '#4a9eff';
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX - 5, -6);
      ctx.lineTo(playheadX + 5, -6);
      ctx.closePath();
      ctx.fill();
    }
  }, [transport, timeline, clips]);

  return (
    <div className="daw-timeline">
      <div className="timeline-header">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className="timeline-content" ref={containerRef}>
        {clips.length === 0 ? (
          <div className="empty-state">
            <h3>No Clips Yet</h3>
            <p>
              Add an instrument track and double-click on the timeline to create a MIDI clip.
            </p>
          </div>
        ) : (
          <div className="timeline-grid">
            {/* Clips will be rendered here in Phase 2 */}
          </div>
        )}
      </div>
    </div>
  );
}
