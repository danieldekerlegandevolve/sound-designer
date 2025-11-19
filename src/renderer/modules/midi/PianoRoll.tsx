import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMIDIStore } from '../../store/midiStore';
import {
  Play,
  Pause,
  Square,
  Circle,
  Grid3x3,
  Music,
  Copy,
  Scissors,
  Trash2,
  MoveVertical,
  Settings,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { MIDINote, midiNoteToName } from '@shared/midiTypes';
import './PianoRoll.css';

interface PianoRollProps {
  width?: number;
  height?: number;
}

interface Selection {
  notes: Set<string>;
  isDragging: boolean;
  isResizing: boolean;
  dragStartX: number;
  dragStartY: number;
  resizeHandle: 'start' | 'end' | null;
}

export function PianoRoll({ width = 1200, height = 600 }: PianoRollProps) {
  const {
    currentClip,
    isRecording,
    isPlaying,
    playbackPosition,
    pianoRollSettings,
    startRecording,
    stopRecording,
    startPlayback,
    stopPlayback,
    addNote,
    updateNote,
    deleteNote,
    deleteSelectedNotes,
    quantizeNotes,
    transposeNotes,
    updatePianoRollSettings,
    sendNoteOn,
    sendNoteOff,
  } = useMIDIStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState({ horizontal: 1, vertical: 1 });
  const [scroll, setScroll] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'draw' | 'select' | 'erase'>('draw');
  const [selection, setSelection] = useState<Selection>({
    notes: new Set(),
    isDragging: false,
    isResizing: false,
    dragStartX: 0,
    dragStartY: 0,
    resizeHandle: null,
  });
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<MIDINote[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const pianoKeyWidth = 60;
  const gridPadding = 10;
  const minNoteWidth = 10;

  // Calculate dimensions
  const pixelsPerTick = (0.5 * zoom.horizontal);
  const noteHeight = pianoRollSettings.noteHeight * zoom.vertical;
  const visibleNotes = Math.min(128, Math.floor((height - 40) / noteHeight));

  // Draw piano roll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentClip) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx);

    // Draw notes
    currentClip.notes.forEach((note) => {
      drawNote(ctx, note, selection.notes.has(note.id), hoveredNote === note.id);
    });

    // Draw playback cursor
    if (isPlaying) {
      drawPlaybackCursor(ctx);
    }
  }, [currentClip, selection, hoveredNote, zoom, scroll, isPlaying, playbackPosition, width, height]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const { gridResolution, tempo, ppq } = pianoRollSettings;

    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    // Vertical grid lines (time)
    const totalTicks = currentClip?.duration || ppq * 16;
    const ticksPerBeat = ppq;
    const ticksPerBar = ticksPerBeat * 4;

    for (let tick = 0; tick <= totalTicks; tick += gridResolution) {
      const x = pianoKeyWidth + (tick * pixelsPerTick) - scroll.x;

      if (x < pianoKeyWidth || x > width) continue;

      // Darker lines on beats and bars
      if (tick % ticksPerBar === 0) {
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 2;
      } else if (tick % ticksPerBeat === 0) {
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
      }

      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines (notes)
    for (let noteNum = 0; noteNum < 128; noteNum++) {
      const y = 40 + (127 - noteNum - scroll.y / noteHeight) * noteHeight;

      if (y < 40 || y > height) continue;

      // Highlight C notes
      if (noteNum % 12 === 0) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(pianoKeyWidth, y, width - pianoKeyWidth, noteHeight);
      }

      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pianoKeyWidth, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw piano keys
    drawPianoKeys(ctx);

    // Draw timeline
    drawTimeline(ctx);
  };

  const drawPianoKeys = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 40, pianoKeyWidth, height - 40);

    for (let noteNum = 0; noteNum < 128; noteNum++) {
      const y = 40 + (127 - noteNum - scroll.y / noteHeight) * noteHeight;

      if (y < 40 || y > height) continue;

      const noteName = midiNoteToName(noteNum);
      const isBlackKey = noteName.includes('#');

      // Draw key background
      ctx.fillStyle = isBlackKey ? '#2a2a2a' : '#3a3a3a';
      ctx.fillRect(0, y, pianoKeyWidth, noteHeight);

      // Draw key border
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, y, pianoKeyWidth, noteHeight);

      // Draw note name for C notes or if there's enough space
      if (noteNum % 12 === 0 || noteHeight > 20) {
        ctx.fillStyle = '#aaa';
        ctx.font = '11px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(noteName, pianoKeyWidth - 5, y + noteHeight / 2);
      }
    }
  };

  const drawTimeline = (ctx: CanvasRenderingContext2D) => {
    const { ppq } = pianoRollSettings;

    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, 40);

    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(width, 40);
    ctx.stroke();

    const totalTicks = currentClip?.duration || ppq * 16;
    const ticksPerBeat = ppq;

    for (let tick = 0; tick <= totalTicks; tick += ticksPerBeat) {
      const x = pianoKeyWidth + (tick * pixelsPerTick) - scroll.x;

      if (x < pianoKeyWidth || x > width) continue;

      const bar = Math.floor(tick / (ticksPerBeat * 4)) + 1;
      const beat = Math.floor((tick % (ticksPerBeat * 4)) / ticksPerBeat) + 1;

      ctx.fillStyle = '#aaa';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${bar}.${beat}`, x, 20);
    }
  };

  const drawNote = (
    ctx: CanvasRenderingContext2D,
    note: MIDINote,
    isSelected: boolean,
    isHovered: boolean
  ) => {
    const x = pianoKeyWidth + (note.startTime * pixelsPerTick) - scroll.x;
    const y = 40 + (127 - note.note - scroll.y / noteHeight) * noteHeight;
    const w = Math.max(minNoteWidth, note.duration * pixelsPerTick);
    const h = noteHeight - 2;

    if (x + w < pianoKeyWidth || x > width || y + h < 40 || y > height) return;

    // Note color based on velocity or mode
    let baseColor: string;
    switch (pianoRollSettings.colorMode) {
      case 'velocity':
        const velocityHue = (note.velocity / 127) * 120; // 0 (red) to 120 (green)
        baseColor = `hsl(${velocityHue}, 70%, 50%)`;
        break;
      case 'channel':
        const channelHue = (note.channel / 16) * 360;
        baseColor = `hsl(${channelHue}, 70%, 50%)`;
        break;
      case 'pitch':
        const pitchHue = (note.note / 127) * 280;
        baseColor = `hsl(${pitchHue}, 70%, 50%)`;
        break;
      default:
        baseColor = '#4a9eff';
    }

    // Draw note body
    ctx.fillStyle = isSelected ? '#fbbf24' : isHovered ? '#60a5fa' : baseColor;
    ctx.fillRect(x, y, w, h);

    // Draw note border
    ctx.strokeStyle = isSelected ? '#f59e0b' : '#1a1a1a';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(x, y, w, h);

    // Draw velocity bar
    const velocityHeight = (note.velocity / 127) * h;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x, y + h - velocityHeight, 4, velocityHeight);

    // Draw resize handles for selected notes
    if (isSelected && w > 20) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y + h / 2 - 3, 6, 6);
      ctx.fillRect(x + w - 6, y + h / 2 - 3, 6, 6);
    }
  };

  const drawPlaybackCursor = (ctx: CanvasRenderingContext2D) => {
    const x = pianoKeyWidth + (playbackPosition * pixelsPerTick) - scroll.x;

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x, height);
    ctx.stroke();
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !currentClip) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on piano keys
    if (x < pianoKeyWidth && y > 40) {
      const noteNum = 127 - Math.floor((y - 40 + scroll.y) / noteHeight);
      sendNoteOn(noteNum, 100, 0);
      setTimeout(() => sendNoteOff(noteNum, 0), 200);
      return;
    }

    if (x < pianoKeyWidth || y < 40) return;

    const clickedNote = findNoteAtPosition(x, y);

    if (tool === 'draw') {
      if (!clickedNote) {
        // Create new note
        const noteNum = 127 - Math.floor((y - 40 + scroll.y) / noteHeight);
        const startTime = Math.max(0, (x - pianoKeyWidth + scroll.x) / pixelsPerTick);
        const quantizedStart = pianoRollSettings.snapToGrid
          ? Math.round(startTime / pianoRollSettings.gridResolution) * pianoRollSettings.gridResolution
          : startTime;

        addNote({
          note: noteNum,
          velocity: 100,
          startTime: quantizedStart,
          duration: pianoRollSettings.gridResolution,
          channel: 0,
        });

        sendNoteOn(noteNum, 100, 0);
        setTimeout(() => sendNoteOff(noteNum, 0), 100);
      }
    } else if (tool === 'select') {
      if (clickedNote) {
        if (!selection.notes.has(clickedNote.id) && !e.shiftKey) {
          setSelection({ ...selection, notes: new Set([clickedNote.id]) });
        } else if (e.shiftKey) {
          const newSelection = new Set(selection.notes);
          newSelection.add(clickedNote.id);
          setSelection({ ...selection, notes: newSelection });
        }

        // Check if clicking on resize handle
        const noteX = pianoKeyWidth + (clickedNote.startTime * pixelsPerTick) - scroll.x;
        const noteW = Math.max(minNoteWidth, clickedNote.duration * pixelsPerTick);

        if (Math.abs(x - noteX) < 6) {
          setSelection({ ...selection, isResizing: true, resizeHandle: 'start', dragStartX: x });
        } else if (Math.abs(x - (noteX + noteW)) < 6) {
          setSelection({ ...selection, isResizing: true, resizeHandle: 'end', dragStartX: x });
        } else {
          setSelection({ ...selection, isDragging: true, dragStartX: x, dragStartY: y });
        }
      } else {
        setSelection({ ...selection, notes: new Set() });
      }
    } else if (tool === 'erase') {
      if (clickedNote) {
        deleteNote(clickedNote.id);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !currentClip) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update hovered note
    const hoveredNote = findNoteAtPosition(x, y);
    setHoveredNote(hoveredNote?.id || null);

    // Handle dragging
    if (selection.isDragging && selection.notes.size > 0) {
      const deltaX = x - selection.dragStartX;
      const deltaY = y - selection.dragStartY;

      const deltaTicks = deltaX / pixelsPerTick;
      const deltaNotes = -Math.round(deltaY / noteHeight);

      selection.notes.forEach((noteId) => {
        const note = currentClip.notes.find((n) => n.id === noteId);
        if (!note) return;

        const newStartTime = Math.max(0, note.startTime + deltaTicks);
        const newNote = Math.max(0, Math.min(127, note.note + deltaNotes));

        updateNote(noteId, {
          startTime: pianoRollSettings.snapToGrid
            ? Math.round(newStartTime / pianoRollSettings.gridResolution) * pianoRollSettings.gridResolution
            : newStartTime,
          note: newNote,
        });
      });

      setSelection({ ...selection, dragStartX: x, dragStartY: y });
    }

    // Handle resizing
    if (selection.isResizing && selection.notes.size > 0) {
      const deltaX = x - selection.dragStartX;
      const deltaTicks = deltaX / pixelsPerTick;

      selection.notes.forEach((noteId) => {
        const note = currentClip.notes.find((n) => n.id === noteId);
        if (!note) return;

        if (selection.resizeHandle === 'start') {
          const newStartTime = Math.max(0, note.startTime + deltaTicks);
          const newDuration = note.duration - deltaTicks;

          if (newDuration > 0) {
            updateNote(noteId, {
              startTime: newStartTime,
              duration: Math.max(pianoRollSettings.gridResolution / 4, newDuration),
            });
          }
        } else if (selection.resizeHandle === 'end') {
          const newDuration = note.duration + deltaTicks;
          updateNote(noteId, {
            duration: Math.max(pianoRollSettings.gridResolution / 4, newDuration),
          });
        }
      });

      setSelection({ ...selection, dragStartX: x });
    }
  };

  const handleMouseUp = () => {
    setSelection({
      ...selection,
      isDragging: false,
      isResizing: false,
      resizeHandle: null,
    });
  };

  const findNoteAtPosition = (x: number, y: number): MIDINote | null => {
    if (!currentClip) return null;

    for (let i = currentClip.notes.length - 1; i >= 0; i--) {
      const note = currentClip.notes[i];
      const noteX = pianoKeyWidth + (note.startTime * pixelsPerTick) - scroll.x;
      const noteY = 40 + (127 - note.note - scroll.y / noteHeight) * noteHeight;
      const noteW = Math.max(minNoteWidth, note.duration * pixelsPerTick);
      const noteH = noteHeight - 2;

      if (x >= noteX && x <= noteX + noteW && y >= noteY && y <= noteY + noteH) {
        return note;
      }
    }

    return null;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedNotes(Array.from(selection.notes));
        setSelection({ ...selection, notes: new Set() });
      } else if (e.key === 'q' && selection.notes.size > 0) {
        quantizeNotes(Array.from(selection.notes));
      } else if (e.key === 'ArrowUp' && selection.notes.size > 0) {
        transposeNotes(Array.from(selection.notes), e.shiftKey ? 12 : 1);
      } else if (e.key === 'ArrowDown' && selection.notes.size > 0) {
        transposeNotes(Array.from(selection.notes), e.shiftKey ? -12 : -1);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selection.notes.size > 0) {
        const selectedNotes = currentClip?.notes.filter((n) => selection.notes.has(n.id)) || [];
        setClipboard(selectedNotes);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard.length > 0) {
        clipboard.forEach((note) => {
          addNote({
            ...note,
            startTime: note.startTime + pianoRollSettings.gridResolution * 4,
          });
        });
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allNoteIds = new Set(currentClip?.notes.map((n) => n.id) || []);
        setSelection({ ...selection, notes: allNoteIds });
      } else if (e.key === ' ') {
        e.preventDefault();
        if (isPlaying) {
          stopPlayback();
        } else {
          startPlayback();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, clipboard, currentClip, isPlaying]);

  return (
    <div className="piano-roll">
      <div className="piano-roll-toolbar">
        <div className="toolbar-group">
          <button
            className={`toolbar-btn ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            title="Record (R)"
          >
            <Circle size={18} fill={isRecording ? 'currentColor' : 'none'} />
          </button>
          <button
            className="toolbar-btn"
            onClick={isPlaying ? stopPlayback : startPlayback}
            title="Play/Pause (Space)"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button className="toolbar-btn" onClick={stopPlayback} title="Stop">
            <Square size={18} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            className={`toolbar-btn ${tool === 'draw' ? 'active' : ''}`}
            onClick={() => setTool('draw')}
            title="Draw Tool (D)"
          >
            <Music size={18} />
          </button>
          <button
            className={`toolbar-btn ${tool === 'select' ? 'active' : ''}`}
            onClick={() => setTool('select')}
            title="Select Tool (S)"
          >
            <Copy size={18} />
          </button>
          <button
            className={`toolbar-btn ${tool === 'erase' ? 'active' : ''}`}
            onClick={() => setTool('erase')}
            title="Erase Tool (E)"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={() => selection.notes.size > 0 && quantizeNotes(Array.from(selection.notes))}
            disabled={selection.notes.size === 0}
            title="Quantize (Q)"
          >
            <Grid3x3 size={18} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() => deleteSelectedNotes(Array.from(selection.notes))}
            disabled={selection.notes.size === 0}
            title="Delete Selected (Del)"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-group">
          <button className="toolbar-btn" onClick={() => setZoom({ ...zoom, horizontal: zoom.horizontal * 1.2 })} title="Zoom In">
            <ZoomIn size={18} />
          </button>
          <button className="toolbar-btn" onClick={() => setZoom({ ...zoom, horizontal: zoom.horizontal / 1.2 })} title="Zoom Out">
            <ZoomOut size={18} />
          </button>
        </div>

        <div className="toolbar-group ml-auto">
          <label className="toolbar-label">
            <input
              type="checkbox"
              checked={pianoRollSettings.snapToGrid}
              onChange={(e) => updatePianoRollSettings({ snapToGrid: e.target.checked })}
            />
            Snap to Grid
          </label>
          <button className="toolbar-btn" onClick={() => setShowSettings(!showSettings)} title="Settings">
            <Settings size={18} />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="piano-roll-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {showSettings && (
        <div className="piano-roll-settings">
          <h4>Piano Roll Settings</h4>
          <div className="setting-row">
            <label>Grid Resolution:</label>
            <select
              value={pianoRollSettings.gridResolution}
              onChange={(e) => updatePianoRollSettings({ gridResolution: Number(e.target.value) })}
            >
              <option value={pianoRollSettings.ppq / 4}>1/16 Note</option>
              <option value={pianoRollSettings.ppq / 2}>1/8 Note</option>
              <option value={pianoRollSettings.ppq}>1/4 Note</option>
              <option value={pianoRollSettings.ppq * 2}>1/2 Note</option>
              <option value={pianoRollSettings.ppq * 4}>Whole Note</option>
            </select>
          </div>
          <div className="setting-row">
            <label>Color Mode:</label>
            <select
              value={pianoRollSettings.colorMode}
              onChange={(e) => updatePianoRollSettings({ colorMode: e.target.value as any })}
            >
              <option value="velocity">Velocity</option>
              <option value="channel">Channel</option>
              <option value="pitch">Pitch</option>
              <option value="uniform">Uniform</option>
            </select>
          </div>
          <div className="setting-row">
            <label>Tempo (BPM):</label>
            <input
              type="number"
              min="20"
              max="300"
              value={pianoRollSettings.tempo}
              onChange={(e) => updatePianoRollSettings({ tempo: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      <div className="piano-roll-status">
        <span>Selected: {selection.notes.size} notes</span>
        <span>Tool: {tool}</span>
        <span>Zoom: {(zoom.horizontal * 100).toFixed(0)}%</span>
        {currentClip && <span>Clip: {currentClip.name}</span>}
      </div>
    </div>
  );
}
