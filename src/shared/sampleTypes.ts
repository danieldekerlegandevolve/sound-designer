export interface Sample {
  id: string;
  name: string;
  filePath?: string;
  audioBuffer: AudioBuffer | null;
  category: SampleCategory;
  tags: string[];

  // Metadata
  duration: number; // seconds
  sampleRate: number;
  channels: number; // 1 = mono, 2 = stereo
  bitDepth?: number;
  fileSize?: number; // bytes
  format?: 'wav' | 'mp3' | 'ogg' | 'flac';

  // Sample properties
  loops: SampleLoop[];
  markers: SampleMarker[];
  regions: SampleRegion[];

  // Analysis data
  peaks?: Float32Array[];
  rms?: number;
  peakLevel?: number;

  // User data
  isFavorite: boolean;
  color?: string;
  notes?: string;
  createdAt: string;
  modifiedAt: string;
}

export type SampleCategory =
  | 'drum'
  | 'bass'
  | 'synth'
  | 'vocal'
  | 'fx'
  | 'ambient'
  | 'loop'
  | 'oneshot'
  | 'user';

export interface SampleLoop {
  id: string;
  name: string;
  startFrame: number;
  endFrame: number;
  mode: 'forward' | 'backward' | 'pingpong';
  crossfadeDuration?: number; // in frames
  enabled: boolean;
}

export interface SampleMarker {
  id: string;
  name: string;
  frame: number;
  color?: string;
}

export interface SampleRegion {
  id: string;
  name: string;
  startFrame: number;
  endFrame: number;
  color?: string;
}

export interface SampleLayer {
  id: string;
  name: string;
  samples: Sample[];
  velocityRange: { min: number; max: number };
  pitchRange?: { min: number; max: number };
  gain: number;
  pan: number;
}

export interface MultiSample {
  id: string;
  name: string;
  layers: SampleLayer[];
  rootNote: number; // MIDI note number
}

export interface SampleSearchCriteria {
  query?: string;
  category?: SampleCategory;
  tags?: string[];
  minDuration?: number;
  maxDuration?: number;
  channels?: number;
  favoritesOnly?: boolean;
}

export interface SampleEditOperation {
  type: 'cut' | 'copy' | 'paste' | 'trim' | 'normalize' | 'reverse' | 'fade' | 'pitchShift' | 'timeStretch';
  startFrame?: number;
  endFrame?: number;
  fadeType?: 'in' | 'out';
  fadeDuration?: number;
  pitchShiftSemitones?: number;
  timeStretchRatio?: number;
  normalizeLevel?: number; // dB
}

export const SAMPLE_CATEGORIES: Array<{ value: SampleCategory; label: string; icon: string }> = [
  { value: 'drum', label: 'Drums', icon: '🥁' },
  { value: 'bass', label: 'Bass', icon: '🎸' },
  { value: 'synth', label: 'Synth', icon: '🎹' },
  { value: 'vocal', label: 'Vocal', icon: '🎤' },
  { value: 'fx', label: 'FX', icon: '✨' },
  { value: 'ambient', label: 'Ambient', icon: '🌊' },
  { value: 'loop', label: 'Loop', icon: '🔁' },
  { value: 'oneshot', label: 'One-Shot', icon: '💥' },
  { value: 'user', label: 'User', icon: '👤' },
];

// Utility functions
export function framesToSeconds(frames: number, sampleRate: number): number {
  return frames / sampleRate;
}

export function secondsToFrames(seconds: number, sampleRate: number): number {
  return Math.floor(seconds * sampleRate);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
  return `${secs}.${ms.toString().padStart(3, '0')}s`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function calculatePeaks(audioBuffer: AudioBuffer, samplesPerPixel: number): Float32Array[] {
  const peaks: Float32Array[] = [];

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    const peakCount = Math.ceil(channelData.length / samplesPerPixel);
    const channelPeaks = new Float32Array(peakCount);

    for (let i = 0; i < peakCount; i++) {
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, channelData.length);

      let max = 0;
      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > max) max = abs;
      }

      channelPeaks[i] = max;
    }

    peaks.push(channelPeaks);
  }

  return peaks;
}

export function calculateRMS(audioBuffer: AudioBuffer): number {
  let sumSquares = 0;
  let totalSamples = 0;

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);

    for (let i = 0; i < channelData.length; i++) {
      sumSquares += channelData[i] * channelData[i];
      totalSamples++;
    }
  }

  return Math.sqrt(sumSquares / totalSamples);
}

export function calculatePeakLevel(audioBuffer: AudioBuffer): number {
  let peak = 0;

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);

    for (let i = 0; i < channelData.length; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > peak) peak = abs;
    }
  }

  return peak;
}

export function normalizeAudioBuffer(
  audioBuffer: AudioBuffer,
  targetLevel: number = 0 // dB
): AudioBuffer {
  const currentPeak = calculatePeakLevel(audioBuffer);
  const targetPeak = Math.pow(10, targetLevel / 20);
  const gain = targetPeak / currentPeak;

  const normalized = new AudioBuffer({
    length: audioBuffer.length,
    numberOfChannels: audioBuffer.numberOfChannels,
    sampleRate: audioBuffer.sampleRate,
  });

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const targetData = normalized.getChannelData(channel);

    for (let i = 0; i < sourceData.length; i++) {
      targetData[i] = Math.max(-1, Math.min(1, sourceData[i] * gain));
    }
  }

  return normalized;
}

export function reverseAudioBuffer(audioBuffer: AudioBuffer): AudioBuffer {
  const reversed = new AudioBuffer({
    length: audioBuffer.length,
    numberOfChannels: audioBuffer.numberOfChannels,
    sampleRate: audioBuffer.sampleRate,
  });

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const targetData = reversed.getChannelData(channel);

    for (let i = 0; i < sourceData.length; i++) {
      targetData[i] = sourceData[sourceData.length - 1 - i];
    }
  }

  return reversed;
}

export function trimAudioBuffer(
  audioBuffer: AudioBuffer,
  startFrame: number,
  endFrame: number
): AudioBuffer {
  const length = endFrame - startFrame;

  const trimmed = new AudioBuffer({
    length,
    numberOfChannels: audioBuffer.numberOfChannels,
    sampleRate: audioBuffer.sampleRate,
  });

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const targetData = trimmed.getChannelData(channel);

    for (let i = 0; i < length; i++) {
      targetData[i] = sourceData[startFrame + i];
    }
  }

  return trimmed;
}

export function applyFade(
  audioBuffer: AudioBuffer,
  fadeType: 'in' | 'out',
  duration: number // in seconds
): AudioBuffer {
  const fadeDuration = secondsToFrames(duration, audioBuffer.sampleRate);

  const faded = new AudioBuffer({
    length: audioBuffer.length,
    numberOfChannels: audioBuffer.numberOfChannels,
    sampleRate: audioBuffer.sampleRate,
  });

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const targetData = faded.getChannelData(channel);

    for (let i = 0; i < sourceData.length; i++) {
      let gain = 1;

      if (fadeType === 'in' && i < fadeDuration) {
        gain = i / fadeDuration;
      } else if (fadeType === 'out' && i >= sourceData.length - fadeDuration) {
        gain = (sourceData.length - i) / fadeDuration;
      }

      targetData[i] = sourceData[i] * gain;
    }
  }

  return faded;
}

export async function loadAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  return await audioContext.decodeAudioData(arrayBuffer);
}

export function audioBufferToWav(audioBuffer: AudioBuffer): Blob {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const data = new Int16Array(audioBuffer.length * numberOfChannels);

  // Interleave channels
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      const intSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
      data[i * numberOfChannels + channel] = intSample;
    }
  }

  const buffer = new ArrayBuffer(44 + data.length * bytesPerSample);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + data.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, data.length * bytesPerSample, true);

  // Write PCM data
  const dataView = new Int16Array(buffer, 44);
  dataView.set(data);

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
