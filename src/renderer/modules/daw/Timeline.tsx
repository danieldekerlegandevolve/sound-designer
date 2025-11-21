import React, { useRef, useEffect, useState } from 'react';
import { useDAWStore } from '../../store/dawStore';
import { PianoRoll } from './PianoRoll';
import { snapToGrid } from '@shared/dawTypes';

const TRACK_HEIGHT = 80;
const HEADER_HEIGHT = 40;

export function Timeline() {
  const { project, addClip, updateClip, selectClip, selectedClipId } = useDAWStore();
  const { transport, timeline, clips, tracks } = project;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPianoRoll, setShowPianoRoll] = useState(false);
  const [draggingClip, setDraggingClip] = useState<{ clipId: string; startX: number } | null>(null);

  const zoom = timeline.zoom;

  // Render timeline grid and measures
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = canvas.parentElement?.clientWidth || 0;
    const height = HEADER_HEIGHT;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate visible range
    const beatsPerMeasure = transport.timeSignature.numerator;
    const totalBeats = Math.ceil(width / zoom) + 10;
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
  }, [transport, timeline, zoom]);

  // Handle double-click to create clip
  const handleTrackDoubleClick = (trackId: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const startTime = snapToGrid(x / zoom, timeline.snapEnabled ? timeline.snapValue : 0.01);

    addClip(trackId, startTime, 4); // 4 beat default clip
  };

  // Handle clip click
  const handleClipClick = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectClip(clipId);
  };

  // Handle clip double-click (open piano roll)
  const handleClipDoubleClick = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectClip(clipId);
    setShowPianoRoll(true);
  };

  // Handle clip drag start
  const handleClipDragStart = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingClip({ clipId, startX: e.clientX });
  };

  // Handle mouse move (for dragging)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingClip) {
      const clip = clips.find(c => c.id === draggingClip.clipId);
      if (!clip) return;

      const deltaX = e.clientX - draggingClip.startX;
      const deltaBeats = deltaX / zoom;

      const newStart = snapToGrid(
        clip.startTime + deltaBeats,
        timeline.snapEnabled ? timeline.snapValue : 0.01
      );

      updateClip(clip.id, { startTime: Math.max(0, newStart) });
      setDraggingClip({ clipId: clip.id, startX: e.clientX });
    }
  };

  // Handle mouse up (end drag)
  const handleMouseUp = () => {
    setDraggingClip(null);
  };

  // Get clips for a track
  const getClipsForTrack = (trackId: string) => {
    return clips.filter(c => c.trackId === trackId);
  };

  // Get track color
  const getTrackColor = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    return track?.color || '#4a9eff';
  };

  return (
    <div className="daw-timeline">
      <div className="timeline-header">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div
        className="timeline-content"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {clips.length === 0 && !showPianoRoll && (
          <div className="empty-state">
            <h3>No Clips Yet</h3>
            <p>
              Double-click on a track to create a MIDI clip.
            </p>
          </div>
        )}

        {/* Render tracks and clips */}
        <div className="timeline-tracks" style={{ minWidth: '100%' }}>
          {tracks.filter(t => t.type !== 'master').map((track, index) => {
            const trackClips = getClipsForTrack(track.id);

            return (
              <div
                key={track.id}
                className="timeline-track"
                style={{ height: TRACK_HEIGHT }}
                onDoubleClick={(e) => handleTrackDoubleClick(track.id, e)}
              >
                {/* Render clips for this track */}
                {trackClips.map(clip => {
                  const x = clip.startTime * zoom;
                  const width = clip.duration * zoom;
                  const isSelected = selectedClipId === clip.id;

                  return (
                    <div
                      key={clip.id}
                      className={`timeline-clip ${isSelected ? 'selected' : ''}`}
                      style={{
                        position: 'absolute',
                        left: x,
                        top: index * TRACK_HEIGHT + 10,
                        width,
                        height: TRACK_HEIGHT - 20,
                        backgroundColor: getTrackColor(track.id),
                        border: `2px solid ${isSelected ? '#fff' : 'rgba(0,0,0,0.3)'}`,
                        borderRadius: '4px',
                        padding: '8px',
                        cursor: 'move',
                        userSelect: 'none',
                        boxShadow: isSelected
                          ? '0 0 0 2px rgba(74, 158, 255, 0.5)'
                          : '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                      onClick={(e) => handleClipClick(clip.id, e)}
                      onDoubleClick={(e) => handleClipDoubleClick(clip.id, e)}
                      onMouseDown={(e) => handleClipDragStart(clip.id, e)}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 500, color: '#fff' }}>
                        {clip.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
                        {clip.notes.length} notes
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Piano Roll Modal */}
      {showPianoRoll && selectedClipId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <PianoRoll
            clipId={selectedClipId}
            onClose={() => setShowPianoRoll(false)}
          />
        </div>
      )}
    </div>
  );
}
