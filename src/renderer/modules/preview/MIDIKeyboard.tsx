import React, { useEffect, useRef } from 'react';
import './MIDIKeyboard.css';

interface MIDIKeyboardProps {
  octaves?: number;
  startOctave?: number;
  onNoteOn: (note: number, velocity: number) => void;
  onNoteOff: (note: number) => void;
}

interface KeyInfo {
  note: number;
  isBlack: boolean;
  label: string;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_KEYS = [1, 3, 6, 8, 10]; // Indices of black keys in an octave

export function MIDIKeyboard({
  octaves = 2,
  startOctave = 3,
  onNoteOn,
  onNoteOff,
}: MIDIKeyboardProps) {
  const activeNotesRef = useRef<Set<number>>(new Set());
  const keysRef = useRef<Map<string, number>>(new Map());

  // Generate key list
  const keys: KeyInfo[] = [];
  for (let octave = 0; octave < octaves; octave++) {
    for (let note = 0; note < 12; note++) {
      const midiNote = (startOctave + octave) * 12 + note;
      keys.push({
        note: midiNote,
        isBlack: BLACK_KEYS.includes(note),
        label: NOTE_NAMES[note] + (startOctave + octave),
      });
    }
  }

  // Map computer keyboard keys to MIDI notes
  useEffect(() => {
    // Piano-style keyboard mapping (zsxdc... for white keys, sdfg... for black keys)
    const whiteKeyMap = ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', '\''];
    const blackKeyMap = ['s', 'd', 'g', 'h', 'j', 'l', ';'];

    const whiteKeys = keys.filter(k => !k.isBlack);
    const blackKeys = keys.filter(k => k.isBlack);

    whiteKeyMap.forEach((key, i) => {
      if (i < whiteKeys.length) {
        keysRef.current.set(key, whiteKeys[i].note);
      }
    });

    blackKeyMap.forEach((key, i) => {
      if (i < blackKeys.length) {
        keysRef.current.set(key, blackKeys[i].note);
      }
    });
  }, [octaves, startOctave]);

  // Handle computer keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Ignore key repeat

      const note = keysRef.current.get(e.key);
      if (note !== undefined && !activeNotesRef.current.has(note)) {
        activeNotesRef.current.add(note);
        onNoteOn(note, 100); // Velocity 100 (0-127)
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const note = keysRef.current.get(e.key);
      if (note !== undefined && activeNotesRef.current.has(note)) {
        activeNotesRef.current.delete(note);
        onNoteOff(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Release all notes on unmount
      activeNotesRef.current.forEach(note => onNoteOff(note));
      activeNotesRef.current.clear();
    };
  }, [onNoteOn, onNoteOff]);

  const handleMouseDown = (note: number) => {
    if (!activeNotesRef.current.has(note)) {
      activeNotesRef.current.add(note);
      onNoteOn(note, 100);
    }
  };

  const handleMouseUp = (note: number) => {
    if (activeNotesRef.current.has(note)) {
      activeNotesRef.current.delete(note);
      onNoteOff(note);
    }
  };

  const handleMouseLeave = (note: number) => {
    if (activeNotesRef.current.has(note)) {
      activeNotesRef.current.delete(note);
      onNoteOff(note);
    }
  };

  // Group keys by octave for rendering
  const whiteKeys = keys.filter(k => !k.isBlack);
  const blackKeys = keys.filter(k => k.isBlack);

  return (
    <div className="midi-keyboard-container">
      <div className="midi-keyboard-hint">
        Use your computer keyboard (z-/ for white keys, s-; for black keys) or click to play
      </div>
      <div className="midi-keyboard">
        {/* White keys */}
        <div className="white-keys">
          {whiteKeys.map((key) => (
            <div
              key={key.note}
              className="piano-key white-key"
              onMouseDown={() => handleMouseDown(key.note)}
              onMouseUp={() => handleMouseUp(key.note)}
              onMouseLeave={() => handleMouseLeave(key.note)}
            >
              <span className="key-label">{key.label}</span>
            </div>
          ))}
        </div>

        {/* Black keys */}
        <div className="black-keys">
          {blackKeys.map((key, idx) => {
            // Calculate position based on pattern
            const noteInOctave = key.note % 12;
            const octaveNum = Math.floor((key.note - startOctave * 12) / 12);
            let offset = 0;

            if (noteInOctave === 1) offset = 0; // C#
            else if (noteInOctave === 3) offset = 1; // D#
            else if (noteInOctave === 6) offset = 2; // F#
            else if (noteInOctave === 8) offset = 3; // G#
            else if (noteInOctave === 10) offset = 4; // A#

            const whiteKeysPerOctave = 7;
            const position = octaveNum * whiteKeysPerOctave + offset;

            return (
              <div
                key={key.note}
                className="piano-key black-key"
                style={{ left: `calc(${position * (100 / whiteKeys.length)}% + ${(100 / whiteKeys.length) * 0.65}%)` }}
                onMouseDown={() => handleMouseDown(key.note)}
                onMouseUp={() => handleMouseUp(key.note)}
                onMouseLeave={() => handleMouseLeave(key.note)}
              >
                <span className="key-label">{key.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
