import React from 'react';
import { Play, Pause, Square, SkipBack, Circle } from 'lucide-react';
import { useDAWStore } from '../../store/dawStore';
import { beatsToMBT } from '@shared/dawTypes';
import { DAWAudioEngine } from '../../audio/DAWAudioEngine';

interface TransportProps {
  audioEngine: DAWAudioEngine | null;
}

export function Transport({ audioEngine }: TransportProps) {
  const { project, play, pause, stop, setPlaybackPosition, updateTransport } = useDAWStore();
  const { transport } = project;

  const handlePlay = async () => {
    if (transport.isPlaying) {
      pause();
      audioEngine?.pause();
    } else {
      play();
      if (audioEngine) {
        await audioEngine.play(project, transport.currentTime, (time) => {
          setPlaybackPosition(time);
        });
      }
    }
  };

  const handleStop = () => {
    stop();
    audioEngine?.stop();
  };

  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bpm = parseInt(e.target.value);
    if (bpm >= 40 && bpm <= 300) {
      updateTransport({ bpm });
    }
  };

  const toggleLoop = () => {
    updateTransport({ loopEnabled: !transport.loopEnabled });
  };

  const toggleMetronome = () => {
    updateTransport({ metronomeEnabled: !transport.metronomeEnabled });
  };

  const formatTime = (beats: number): string => {
    return beatsToMBT(beats, transport.timeSignature);
  };

  return (
    <div className="daw-transport">
      <div className="transport-controls">
        <button
          className="transport-button"
          onClick={handleStop}
          title="Stop (Space)"
        >
          <Square size={18} />
        </button>

        <button
          className={`transport-button ${transport.isPlaying ? 'active' : ''}`}
          onClick={handlePlay}
          title={transport.isPlaying ? 'Pause' : 'Play'}
        >
          {transport.isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <button
          className="transport-button"
          onClick={() => updateTransport({ currentTime: 0 })}
          title="Return to Start"
        >
          <SkipBack size={18} />
        </button>

        <button
          className={`transport-button ${transport.isRecording ? 'active' : ''}`}
          onClick={() => updateTransport({ isRecording: !transport.isRecording })}
          title="Record"
          disabled
        >
          <Circle size={16} />
        </button>
      </div>

      <div className="transport-info">
        <div className="transport-position">
          <strong>Position:</strong> {formatTime(transport.currentTime)}
        </div>

        <div className="transport-tempo">
          <strong>BPM:</strong>
          <input
            type="number"
            min="40"
            max="300"
            value={transport.bpm}
            onChange={handleBPMChange}
            className="tempo-input"
          />
        </div>

        <div className="transport-time-sig">
          <strong>Time Signature:</strong>{' '}
          {transport.timeSignature.numerator}/{transport.timeSignature.denominator}
        </div>

        <button
          className={`transport-button ${transport.loopEnabled ? 'active' : ''}`}
          onClick={toggleLoop}
          title="Loop"
        >
          Loop
        </button>

        <button
          className={`transport-button ${transport.metronomeEnabled ? 'active' : ''}`}
          onClick={toggleMetronome}
          title="Metronome"
        >
          Click
        </button>
      </div>
    </div>
  );
}
