import React, { useRef, useState, useEffect } from 'react';
import { X, Grid3x3 } from 'lucide-react';
import { useDAWStore } from '../../store/dawStore';
import { MIDINoteEvent, snapToGrid } from '@shared/dawTypes';
import './PianoRoll.css';

interface PianoRollProps {
  clipId: string;
  onClose: () => void;
}

const NOTE_HEIGHT = 16;
const NOTES_PER_OCTAVE = 12;
const NUM_OCTAVES = 8;
const TOTAL_NOTES = NUM_OCTAVES * NOTES_PER_OCTAVE;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_KEYS = [1, 3, 6, 8, 10];

export function PianoRoll({ clipId, onClose }: PianoRollProps) {
  const { project, addNote, removeNote, updateNote } = useDAWStore();
  const clip = project.clips.find(c => c.id === clipId);
  const { timeline, transport } = project;

  const gridRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(50); // pixels per beat
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [draggingNote, setDraggingNote] = useState<{ noteId: string; startX: number; startY: number } | null>(null);
  const [creatingNote, setCreatingNote] = useState<{ pitch: number; start: number } | null>(null);
  const [snapValue, setSnapValue] = useState(0.25); // 1/16 notes

  if (!clip) {
    return (
      <div className="piano-roll">
        <div className="piano-roll-empty">Clip not found</div>
      </div>
    );
  }

  const gridWidth = Math.max(clip.duration * zoom, 1000);
  const gridHeight = TOTAL_NOTES * NOTE_HEIGHT;

  // Get note info
  const getNoteInfo = (midiNote: number) => {
    const octave = Math.floor(midiNote / 12);
    const noteInOctave = midiNote % 12;
    const noteName = NOTE_NAMES[noteInOctave];
    const isBlack = BLACK_KEYS.includes(noteInOctave);
    const isOctaveStart = noteInOctave === 0;
    return { octave, noteInOctave, noteName, isBlack, isOctaveStart };
  };

  // Convert screen Y to MIDI note
  const yToNote = (y: number): number => {
    const noteFromTop = Math.floor(y / NOTE_HEIGHT);
    return TOTAL_NOTES - 1 - noteFromTop; // Invert (higher notes at top)
  };

  // Convert MIDI note to screen Y
  const noteToY = (note: number): number => {
    return (TOTAL_NOTES - 1 - note) * NOTE_HEIGHT;
  };

  // Convert screen X to beats
  const xToBeats = (x: number): number => {
    return x / zoom;
  };

  // Convert beats to screen X
  const beatsToX = (beats: number): number => {
    return beats * zoom;
  };

  // Handle mouse down on grid
  const handleGridMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + gridRef.current.scrollLeft;
    const y = e.clientY - rect.top + gridRef.current.scrollTop;

    const pitch = yToNote(y);
    const start = snapToGrid(xToBeats(x), timeline.snapEnabled ? snapValue : 0.01);

    // Check if clicking on existing note
    const clickedNote = clip.notes.find(note => {
      const noteY = noteToY(note.pitch);
      const noteX = beatsToX(note.start);
      const noteWidth = beatsToX(note.duration);

      return (
        y >= noteY &&
        y < noteY + NOTE_HEIGHT &&
        x >= noteX &&
        x < noteX + noteWidth
      );
    });

    if (clickedNote) {
      // Select note
      if (!e.shiftKey) {
        setSelectedNotes(new Set([clickedNote.id]));
      } else {
        const newSelection = new Set(selectedNotes);
        if (newSelection.has(clickedNote.id)) {
          newSelection.delete(clickedNote.id);
        } else {
          newSelection.add(clickedNote.id);
        }
        setSelectedNotes(newSelection);
      }

      // Start dragging
      setDraggingNote({
        noteId: clickedNote.id,
        startX: x,
        startY: y,
      });
    } else {
      // Create new note
      setCreatingNote({ pitch, start });
    }
  };

  // Handle mouse move
  const handleGridMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;

    if (draggingNote) {
      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + gridRef.current.scrollLeft;
      const y = e.clientY - rect.top + gridRef.current.scrollTop;

      const note = clip.notes.find(n => n.id === draggingNote.noteId);
      if (!note) return;

      const deltaX = x - draggingNote.startX;
      const deltaY = y - draggingNote.startY;

      const deltaBeats = xToBeats(deltaX);
      const deltaPitch = -Math.round(deltaY / NOTE_HEIGHT);

      const newStart = snapToGrid(note.start + deltaBeats, timeline.snapEnabled ? snapValue : 0.01);
      const newPitch = Math.max(0, Math.min(127, note.pitch + deltaPitch));

      updateNote(clipId, note.id, {
        start: Math.max(0, newStart),
        pitch: newPitch,
      });

      setDraggingNote({ ...draggingNote, startX: x, startY: y });
    }
  };

  // Handle mouse up
  const handleGridMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (creatingNote && gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + gridRef.current.scrollLeft;

      const duration = snapToGrid(
        Math.max(xToBeats(x) - creatingNote.start, snapValue),
        timeline.snapEnabled ? snapValue : 0.01
      );

      addNote(clipId, creatingNote.pitch, creatingNote.start, duration, 100);
      setCreatingNote(null);
    }

    setDraggingNote(null);
  };

  // Handle delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        selectedNotes.forEach(noteId => {
          removeNote(clipId, noteId);
        });
        setSelectedNotes(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNotes, clipId, removeNote]);

  // Render grid lines
  const renderGridLines = () => {
    const lines = [];
    const beatsPerMeasure = transport.timeSignature.numerator;

    // Vertical lines (time)
    for (let beat = 0; beat <= clip.duration; beat += snapValue) {
      const x = beatsToX(beat);
      const isMeasure = beat % beatsPerMeasure === 0;
      const isBeat = beat % 1 === 0;

      lines.push(
        <div
          key={`col-${beat}`}
          className={`grid-col ${isMeasure ? 'measure' : isBeat ? 'beat' : ''}`}
          style={{ left: x }}
        />
      );
    }

    return lines;
  };

  // Render piano keys
  const renderPianoKeys = () => {
    const keys = [];

    for (let i = TOTAL_NOTES - 1; i >= 0; i--) {
      const info = getNoteInfo(i);
      const label = info.isOctaveStart ? `${info.noteName}${info.octave}` : '';

      keys.push(
        <div
          key={i}
          className={`piano-key ${info.isBlack ? 'black' : 'white'}`}
          style={{ height: NOTE_HEIGHT }}
        >
          {label}
        </div>
      );
    }

    return keys;
  };

  // Render grid rows
  const renderGridRows = () => {
    const rows = [];

    for (let i = TOTAL_NOTES - 1; i >= 0; i--) {
      const info = getNoteInfo(i);

      rows.push(
        <div
          key={i}
          className={`grid-row ${info.isBlack ? 'black' : 'white'} ${info.isOctaveStart ? 'octave' : ''}`}
          style={{ height: NOTE_HEIGHT }}
        />
      );
    }

    return rows;
  };

  // Render notes
  const renderNotes = () => {
    return clip.notes.map(note => {
      const x = beatsToX(note.start);
      const y = noteToY(note.pitch);
      const width = beatsToX(note.duration);
      const isSelected = selectedNotes.has(note.id);

      return (
        <div
          key={note.id}
          className={`note ${isSelected ? 'selected' : ''}`}
          style={{
            left: x,
            top: y,
            width,
          }}
        />
      );
    });
  };

  return (
    <div className="piano-roll">
      <div className="piano-roll-header">
        <div className="piano-roll-title">
          <span>Piano Roll - {clip.name}</span>
        </div>

        <div className="piano-roll-controls">
          <div className="snap-control">
            <label>
              <input
                type="checkbox"
                checked={timeline.snapEnabled}
                onChange={(e) => {
                  useDAWStore.getState().updateTimeline({ snapEnabled: e.target.checked });
                }}
              />
              Snap
            </label>

            <select
              value={snapValue}
              onChange={(e) => setSnapValue(parseFloat(e.target.value))}
              className="snap-select"
            >
              <option value="1">1/4</option>
              <option value="0.5">1/8</option>
              <option value="0.25">1/16</option>
              <option value="0.125">1/32</option>
            </select>
          </div>

          <button className="transport-button" onClick={onClose} title="Close Piano Roll">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="piano-roll-main">
        <div className="piano-keys">{renderPianoKeys()}</div>

        <div
          ref={gridRef}
          className="note-grid-container"
          onMouseDown={handleGridMouseDown}
          onMouseMove={handleGridMouseMove}
          onMouseUp={handleGridMouseUp}
        >
          <div className="note-grid" style={{ width: gridWidth, height: gridHeight }}>
            <div className="grid-background">
              {renderGridRows()}
              {renderGridLines()}
            </div>

            {renderNotes()}

            {creatingNote && (
              <div
                className="note"
                style={{
                  left: beatsToX(creatingNote.start),
                  top: noteToY(creatingNote.pitch),
                  width: beatsToX(snapValue),
                  opacity: 0.6,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
