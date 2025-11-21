/**
 * Audio Workspace
 *
 * Integrated audio engine workspace combining node editor, palette, inspector, and visualizers
 */

import React, { useState, useEffect, useRef } from 'react';
import { AudioNodeEditor } from './AudioNodeEditor';
import { NodePalette } from './NodePalette';
import { NodeInspector } from './NodeInspector';
import {
  WaveformVisualizer,
  SpectrumAnalyzer,
  Oscilloscope,
  AudioMeter,
} from './AudioVisualizers';
import { getAudioGraphManager } from '../audio/audioGraphManager';
import { AudioNodeType } from '../../shared/audioGraphTypes';

export interface AudioWorkspaceProps {
  onBack?: () => void;
}

export function AudioWorkspace({ onBack }: AudioWorkspaceProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVisualizers, setShowVisualizers] = useState(true);
  const [analyzerNode, setAnalyzerNode] = useState<AnalyserNode | null>(null);
  const audioGraphManager = getAudioGraphManager();

  useEffect(() => {
    // Initialize audio engine
    const initializeAudio = async () => {
      try {
        await audioGraphManager.initialize();
        console.log('Audio engine initialized');

        // Create master analyzer node
        const analyzer = audioGraphManager.getMasterAnalyzer();
        if (analyzer) {
          setAnalyzerNode(analyzer);
        }
      } catch (error) {
        console.error('Failed to initialize audio engine:', error);
        alert('Failed to initialize audio engine. Please check your browser settings.');
      }
    };

    initializeAudio();

    return () => {
      // Cleanup
      audioGraphManager.stop();
    };
  }, []);

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        audioGraphManager.stop();
        setIsPlaying(false);
      } else {
        await audioGraphManager.start();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to start/stop audio:', error);
      alert('Failed to start audio. Please check your audio setup.');
    }
  };

  const handleClearGraph = () => {
    if (confirm('Clear all nodes? This cannot be undone.')) {
      audioGraphManager.clear();
      setSelectedNodeId(null);
    }
  };

  const handleNodeCreate = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  };

  const handleExportGraph = () => {
    try {
      const graph = audioGraphManager.exportGraph();
      const json = JSON.stringify(graph, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audio-graph-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export graph:', error);
      alert('Failed to export graph');
    }
  };

  const handleImportGraph = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const graph = JSON.parse(text);
        audioGraphManager.importGraph(graph);
        setSelectedNodeId(null);
        alert('Graph imported successfully');
      } catch (error) {
        console.error('Failed to import graph:', error);
        alert('Failed to import graph. Please check the file format.');
      }
    };
    input.click();
  };

  return (
    <div className="audio-workspace">
      {/* Node Palette */}
      <NodePalette onNodeCreate={handleNodeCreate} />

      {/* Main Workspace */}
      <div className="workspace-main">
        {/* Header */}
        <div className="workspace-header">
          <div className="workspace-title">Audio Engine</div>
          <div className="workspace-actions">
            {onBack && (
              <button className="workspace-action-btn" onClick={onBack}>
                ← Back
              </button>
            )}
            <button
              className={`workspace-action-btn ${isPlaying ? 'primary' : ''}`}
              onClick={handlePlayPause}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              className="workspace-action-btn"
              onClick={() => setShowVisualizers(!showVisualizers)}
            >
              {showVisualizers ? '📊 Hide Viz' : '📊 Show Viz'}
            </button>
            <button className="workspace-action-btn" onClick={handleImportGraph}>
              📂 Import
            </button>
            <button className="workspace-action-btn" onClick={handleExportGraph}>
              💾 Export
            </button>
            <button className="workspace-action-btn" onClick={handleClearGraph}>
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Node Editor */}
        <div className="workspace-editor-area">
          <AudioNodeEditor
            onNodeSelect={handleNodeSelect}
            onConnectionCreate={(sourceNodeId, sourcePortId, targetNodeId, targetPortId) => {
              try {
                audioGraphManager.connect(sourceNodeId, sourcePortId, targetNodeId, targetPortId);
              } catch (error) {
                console.error('Failed to create connection:', error);
                alert(error instanceof Error ? error.message : 'Failed to create connection');
              }
            }}
          />
        </div>

        {/* Visualizers */}
        {showVisualizers && (
          <div className="workspace-visualizers">
            <div className="visualizers-container">
              {/* Top Row: Waveform and Spectrum */}
              <div className="visualizer-row">
                <div className="visualizer-wrapper">
                  <div className="visualizer-header">
                    <span className="visualizer-title">Waveform</span>
                  </div>
                  <div className="visualizer-content">
                    <WaveformVisualizer
                      analyzerNode={analyzerNode}
                      width={600}
                      height={120}
                      color="#64c8ff"
                    />
                  </div>
                </div>

                <div className="visualizer-wrapper">
                  <div className="visualizer-header">
                    <span className="visualizer-title">Spectrum</span>
                  </div>
                  <div className="visualizer-content">
                    <SpectrumAnalyzer
                      analyzerNode={analyzerNode}
                      width={600}
                      height={120}
                      color="#6496ff"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Row: Oscilloscope and Meter */}
              <div className="visualizer-row">
                <div className="visualizer-wrapper">
                  <div className="visualizer-header">
                    <span className="visualizer-title">Oscilloscope</span>
                  </div>
                  <div className="visualizer-content">
                    <Oscilloscope
                      analyzerNode={analyzerNode}
                      width={300}
                      height={300}
                      color="#64ff96"
                    />
                  </div>
                </div>

                <div className="visualizer-wrapper">
                  <div className="visualizer-header">
                    <span className="visualizer-title">Audio Meter</span>
                  </div>
                  <div className="visualizer-content">
                    <AudioMeter
                      analyzerNode={analyzerNode}
                      orientation="vertical"
                      width={60}
                      height={280}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Node Inspector */}
      <NodeInspector nodeId={selectedNodeId} />
    </div>
  );
}

/**
 * Audio Engine Quick Start Guide
 */
export function AudioEngineGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="audio-engine-guide">
      <div className="guide-overlay" onClick={onClose} />
      <div className="guide-content">
        <div className="guide-header">
          <h2>Audio Engine Quick Start</h2>
          <button className="guide-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="guide-body">
          <section className="guide-section">
            <h3>🎵 Getting Started</h3>
            <ol>
              <li>Click on nodes in the <strong>left palette</strong> to add them to the canvas</li>
              <li>Drag nodes to position them</li>
              <li>Click and drag from an <strong>output port</strong> to an <strong>input port</strong> to create connections</li>
              <li>Select a node to edit its parameters in the <strong>right inspector</strong></li>
              <li>Click <strong>Play</strong> to start audio processing</li>
            </ol>
          </section>

          <section className="guide-section">
            <h3>🎛️ Node Types</h3>
            <ul>
              <li><strong>Sources:</strong> Oscillator, Sample Player, Noise Generator</li>
              <li><strong>Filters:</strong> Low-pass, High-pass, Band-pass, EQ</li>
              <li><strong>Effects:</strong> Delay, Reverb, Distortion, Chorus, Phaser</li>
              <li><strong>Modulation:</strong> LFO, Envelope Generator</li>
              <li><strong>Utility:</strong> Gain, Mixer, Splitter, Analyzer</li>
              <li><strong>Output:</strong> Master Output (required for audio)</li>
            </ul>
          </section>

          <section className="guide-section">
            <h3>⌨️ Controls</h3>
            <ul>
              <li><strong>Drag Node:</strong> Click and drag on node body</li>
              <li><strong>Pan Canvas:</strong> Shift + Drag or Meta + Drag</li>
              <li><strong>Zoom:</strong> Mouse wheel</li>
              <li><strong>Connect:</strong> Click output port, then click input port</li>
              <li><strong>Delete Node:</strong> Select node, click delete button in inspector</li>
            </ul>
          </section>

          <section className="guide-section">
            <h3>📊 Visualizers</h3>
            <p>
              The bottom panel shows real-time audio visualization:
            </p>
            <ul>
              <li><strong>Waveform:</strong> Time domain view of the audio signal</li>
              <li><strong>Spectrum:</strong> Frequency content of the audio</li>
              <li><strong>Oscilloscope:</strong> XY visualization of stereo signal</li>
              <li><strong>Audio Meter:</strong> Peak and RMS level monitoring</li>
            </ul>
          </section>

          <section className="guide-section">
            <h3>💡 Tips</h3>
            <ul>
              <li>Always connect your signal chain to the <strong>Output node</strong></li>
              <li>Use <strong>Gain nodes</strong> to control levels and prevent clipping</li>
              <li>Experiment with <strong>LFO modulation</strong> for dynamic effects</li>
              <li>Save your work by clicking <strong>Export</strong></li>
              <li>Use the <strong>Bypass button</strong> in the inspector to A/B test changes</li>
            </ul>
          </section>
        </div>

        <div className="guide-footer">
          <button className="guide-btn primary" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
