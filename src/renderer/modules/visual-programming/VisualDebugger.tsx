import React, { useState, useEffect, useRef } from 'react';
import './VisualDebugger.css';

/**
 * Visual Debugger
 * Real-time debugging and visualization tools for audio graph
 */

export interface DebugNode {
  id: string;
  name: string;
  type: string;
  cpuUsage: number;
  audioLevel: number;
  latency: number;
  bufferSize: number;
  sampleRate: number;
  isActive: boolean;
}

export interface DebugConnection {
  from: string;
  to: string;
  audioLevel: number;
  latency: number;
}

interface VisualDebuggerProps {
  nodes: DebugNode[];
  connections: DebugConnection[];
  onToggleNode?: (nodeId: string) => void;
}

export const VisualDebugger: React.FC<VisualDebuggerProps> = ({
  nodes,
  connections,
  onToggleNode,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showPerformance, setShowPerformance] = useState(true);
  const [showAudioLevels, setShowAudioLevels] = useState(true);
  const [showLatency, setShowLatency] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Calculate overall performance metrics
  const totalCPU = nodes.reduce((sum, node) => sum + node.cpuUsage, 0);
  const avgLatency =
    connections.length > 0
      ? connections.reduce((sum, conn) => sum + conn.latency, 0) / connections.length
      : 0;
  const activeNodes = nodes.filter((n) => n.isActive).length;

  // Draw audio flow visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showAudioLevels) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw connections with audio levels
      connections.forEach((conn, index) => {
        const y = 50 + index * 30;
        const level = conn.audioLevel;

        // Draw connection line
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(canvas.width - 20, y);
        ctx.stroke();

        // Draw audio level indicator
        const levelWidth = (canvas.width - 60) * level;
        ctx.fillStyle = level > 0.8 ? '#ff6b6b' : level > 0.6 ? '#ffd43b' : '#51cf66';
        ctx.fillRect(20, y - 5, levelWidth, 10);

        // Draw labels
        ctx.fillStyle = '#aaa';
        ctx.font = '12px monospace';
        ctx.fillText(`${(level * 100).toFixed(0)}%`, canvas.width - 50, y + 4);
      });
    };

    const animationId = requestAnimationFrame(function animate() {
      draw();
      requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animationId);
  }, [connections, showAudioLevels]);

  return (
    <div className="visual-debugger">
      <div className="debugger-header">
        <h2>Visual Debugger</h2>
        <div className="header-controls">
          <label>
            <input
              type="checkbox"
              checked={showPerformance}
              onChange={(e) => setShowPerformance(e.target.checked)}
            />
            Performance
          </label>
          <label>
            <input
              type="checkbox"
              checked={showAudioLevels}
              onChange={(e) => setShowAudioLevels(e.target.checked)}
            />
            Audio Levels
          </label>
          <label>
            <input
              type="checkbox"
              checked={showLatency}
              onChange={(e) => setShowLatency(e.target.checked)}
            />
            Latency
          </label>
        </div>
      </div>

      <div className="debugger-content">
        {/* Overall Performance Stats */}
        {showPerformance && (
          <div className="performance-stats">
            <h3>Performance Overview</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total CPU</span>
                <span className={`stat-value ${totalCPU > 80 ? 'warning' : ''}`}>
                  {totalCPU.toFixed(1)}%
                </span>
                <div className="stat-bar">
                  <div
                    className="stat-fill"
                    style={{
                      width: `${Math.min(totalCPU, 100)}%`,
                      background:
                        totalCPU > 80 ? '#ff6b6b' : totalCPU > 60 ? '#ffd43b' : '#51cf66',
                    }}
                  />
                </div>
              </div>

              <div className="stat-item">
                <span className="stat-label">Active Nodes</span>
                <span className="stat-value">
                  {activeNodes} / {nodes.length}
                </span>
              </div>

              <div className="stat-item">
                <span className="stat-label">Avg Latency</span>
                <span className={`stat-value ${avgLatency > 20 ? 'warning' : ''}`}>
                  {avgLatency.toFixed(2)} ms
                </span>
              </div>

              <div className="stat-item">
                <span className="stat-label">Connections</span>
                <span className="stat-value">{connections.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Nodes List with Debug Info */}
        <div className="debug-nodes-list">
          <h3>Nodes</h3>
          <div className="nodes-table">
            <div className="table-header">
              <span>Name</span>
              <span>Type</span>
              <span>CPU</span>
              <span>Level</span>
              {showLatency && <span>Latency</span>}
              <span>Status</span>
            </div>
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`table-row ${selectedNodeId === node.id ? 'selected' : ''}`}
                onClick={() => setSelectedNodeId(node.id)}
              >
                <span>{node.name}</span>
                <span className="type-badge">{node.type}</span>
                <span className="cpu-value">
                  <div className="mini-bar">
                    <div
                      className="mini-fill"
                      style={{
                        width: `${node.cpuUsage}%`,
                        background:
                          node.cpuUsage > 50
                            ? '#ff6b6b'
                            : node.cpuUsage > 30
                            ? '#ffd43b'
                            : '#51cf66',
                      }}
                    />
                  </div>
                  {node.cpuUsage.toFixed(1)}%
                </span>
                <span className="level-value">
                  <div className="mini-bar">
                    <div
                      className="mini-fill"
                      style={{
                        width: `${node.audioLevel * 100}%`,
                        background: '#4a9eff',
                      }}
                    />
                  </div>
                  {(node.audioLevel * 100).toFixed(0)}%
                </span>
                {showLatency && <span>{node.latency.toFixed(2)} ms</span>}
                <span>
                  <button
                    className={`status-btn ${node.isActive ? 'active' : 'inactive'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleNode?.(node.id);
                    }}
                  >
                    {node.isActive ? 'Active' : 'Inactive'}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Audio Flow Visualization */}
        {showAudioLevels && (
          <div className="audio-flow-viz">
            <h3>Audio Flow</h3>
            <canvas ref={canvasRef} width={600} height={300} />
          </div>
        )}

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="node-details">
            <h3>Node Details: {selectedNode.name}</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span>Type:</span>
                <span>{selectedNode.type}</span>
              </div>
              <div className="detail-item">
                <span>CPU Usage:</span>
                <span>{selectedNode.cpuUsage.toFixed(2)}%</span>
              </div>
              <div className="detail-item">
                <span>Audio Level:</span>
                <span>{(selectedNode.audioLevel * 100).toFixed(2)}%</span>
              </div>
              <div className="detail-item">
                <span>Latency:</span>
                <span>{selectedNode.latency.toFixed(2)} ms</span>
              </div>
              <div className="detail-item">
                <span>Buffer Size:</span>
                <span>{selectedNode.bufferSize} samples</span>
              </div>
              <div className="detail-item">
                <span>Sample Rate:</span>
                <span>{selectedNode.sampleRate} Hz</span>
              </div>
              <div className="detail-item">
                <span>Status:</span>
                <span className={selectedNode.isActive ? 'status-active' : 'status-inactive'}>
                  {selectedNode.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualDebugger;
