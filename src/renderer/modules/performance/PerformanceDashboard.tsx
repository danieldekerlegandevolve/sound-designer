import React, { useState, useEffect, useRef } from 'react';
import { getPerformanceMonitor } from '../../utils/performanceMonitor';
import { getMemoryProfiler } from '../../utils/memoryProfiler';
import { getAudioBufferPool } from '../../utils/audioBufferPool';
import { OptimizationEngine } from '../../utils/optimizer';
import {
  PerformanceMetrics,
  OptimizationRecommendation,
  formatBytes,
  formatPercentage,
  formatDuration,
} from '@shared/performanceTypes';
import { Activity, Cpu, HardDrive, Zap, AlertTriangle, TrendingUp, X } from 'lucide-react';
import './PerformanceDashboard.css';

interface PerformanceDashboardProps {
  onClose?: () => void;
}

export function PerformanceDashboard({ onClose }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'cpu' | 'memory' | 'audio' | 'recommendations'>('overview');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>([]);

  useEffect(() => {
    const monitor = getPerformanceMonitor();
    monitor.start();

    const unsubscribe = monitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);

      // Update recommendations
      const recs = OptimizationEngine.analyzeMetrics(newMetrics);
      setRecommendations(recs);

      // Update history for graph
      historyRef.current.push(newMetrics.cpuUsage);
      if (historyRef.current.length > 60) {
        historyRef.current.shift();
      }
    });

    return () => {
      unsubscribe();
      monitor.stop();
    };
  }, []);

  // Draw CPU history graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw CPU usage line
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 2;
    ctx.beginPath();

    historyRef.current.forEach((value, index) => {
      const x = (index / (historyRef.current.length - 1)) * width;
      const y = height - (value / 100) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Fill area under curve
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(74, 158, 255, 0.1)';
    ctx.fill();
  }, [metrics]);

  if (!metrics) {
    return <div className="performance-dashboard loading">Loading performance data...</div>;
  }

  const memoryProfiler = getMemoryProfiler();
  const bufferPool = getAudioBufferPool();
  const bufferStats = bufferPool.getStats();

  const gradeColors = {
    excellent: '#22c55e',
    good: '#4a9eff',
    fair: '#f59e0b',
    poor: '#ef4444',
    critical: '#dc2626',
  };

  return (
    <div className="performance-dashboard">
      <div className="dashboard-header">
        <h2>Performance Dashboard</h2>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} />
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'cpu' ? 'active' : ''}`}
          onClick={() => setActiveTab('cpu')}
        >
          <Cpu size={16} />
          CPU
        </button>
        <button
          className={`tab ${activeTab === 'memory' ? 'active' : ''}`}
          onClick={() => setActiveTab('memory')}
        >
          <HardDrive size={16} />
          Memory
        </button>
        <button
          className={`tab ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          <Zap size={16} />
          Audio
        </button>
        <button
          className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          <TrendingUp size={16} />
          Optimize
          {recommendations.length > 0 && (
            <span className="badge">{recommendations.length}</span>
          )}
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-panel">
            <div className="score-card" style={{ borderColor: gradeColors[metrics.performanceGrade] }}>
              <div className="score-value">{metrics.performanceScore}</div>
              <div className="score-label">Performance Score</div>
              <div className="score-grade" style={{ color: gradeColors[metrics.performanceGrade] }}>
                {metrics.performanceGrade.toUpperCase()}
              </div>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">
                  <Cpu size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-label">CPU Usage</div>
                  <div className="metric-value">{formatPercentage(metrics.cpuUsage)}</div>
                  <div className="metric-detail">
                    Avg: {formatPercentage(metrics.averageCPU)} • Peak: {formatPercentage(metrics.peakCPU)}
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">
                  <HardDrive size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-label">Memory</div>
                  <div className="metric-value">{formatBytes(metrics.memoryUsed)}</div>
                  <div className="metric-detail">
                    Peak: {formatBytes(metrics.memoryPeak)}
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">
                  <Activity size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-label">Frame Rate</div>
                  <div className="metric-value">{metrics.fps.toFixed(1)} FPS</div>
                  <div className="metric-detail">
                    Frame Time: {formatDuration(metrics.frameTime)}
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">
                  <Zap size={24} />
                </div>
                <div className="metric-info">
                  <div className="metric-label">Audio Latency</div>
                  <div className="metric-value">{formatDuration(metrics.audioCallbackLatency)}</div>
                  <div className="metric-detail">
                    Underruns: {metrics.bufferUnderruns}
                  </div>
                </div>
              </div>
            </div>

            {metrics.warnings.length > 0 && (
              <div className="warnings-panel">
                <h3>
                  <AlertTriangle size={18} />
                  Active Warnings
                </h3>
                <ul>
                  {metrics.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cpu' && (
          <div className="cpu-panel">
            <div className="graph-container">
              <h3>CPU Usage History</h3>
              <canvas ref={canvasRef} width={800} height={200} className="cpu-graph" />
            </div>

            <div className="stats-list">
              <div className="stat-row">
                <span className="stat-label">Current Usage:</span>
                <span className="stat-value">{formatPercentage(metrics.cpuUsage)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Average (30s):</span>
                <span className="stat-value">{formatPercentage(metrics.averageCPU)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Peak Usage:</span>
                <span className="stat-value">{formatPercentage(metrics.peakCPU)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Active Nodes:</span>
                <span className="stat-value">{metrics.activeNodes}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="memory-panel">
            <div className="memory-stats">
              <div className="stat-row">
                <span className="stat-label">Heap Used:</span>
                <span className="stat-value">{formatBytes(metrics.memoryUsed)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Heap Peak:</span>
                <span className="stat-value">{formatBytes(metrics.memoryPeak)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Audio Buffers:</span>
                <span className="stat-value">{formatBytes(metrics.audioBufferMemory)}</span>
              </div>
            </div>

            <div className="buffer-pool-stats">
              <h3>Buffer Pool Statistics</h3>
              <div className="stat-row">
                <span className="stat-label">Total Buffers:</span>
                <span className="stat-value">{bufferStats.totalBuffers}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Available:</span>
                <span className="stat-value">{bufferStats.availableBuffers}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">In Use:</span>
                <span className="stat-value">{bufferStats.inUseBuffers}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Hit Rate:</span>
                <span className="stat-value">{formatPercentage(bufferStats.hitRate)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Total Memory:</span>
                <span className="stat-value">{formatBytes(bufferStats.totalMemory)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="audio-panel">
            <div className="audio-stats">
              <div className="stat-row">
                <span className="stat-label">Sample Rate:</span>
                <span className="stat-value">{metrics.sampleRate} Hz</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Buffer Size:</span>
                <span className="stat-value">{metrics.bufferSize} samples</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Callback Time:</span>
                <span className="stat-value">{formatDuration(metrics.audioCallbackTime)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Latency:</span>
                <span className="stat-value">{formatDuration(metrics.audioCallbackLatency)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Buffer Underruns:</span>
                <span className="stat-value">{metrics.bufferUnderruns}</span>
              </div>
            </div>

            {metrics.bufferUnderruns > 0 && (
              <div className="warning-box">
                <AlertTriangle size={20} />
                <div>
                  <h4>Audio Glitches Detected</h4>
                  <p>
                    {metrics.bufferUnderruns} buffer underruns have occurred. Consider increasing
                    buffer size or reducing CPU load.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-panel">
            {recommendations.length === 0 ? (
              <div className="empty-state">
                <TrendingUp size={48} />
                <h3>No Recommendations</h3>
                <p>Your system is performing well. Keep up the good work!</p>
              </div>
            ) : (
              <div className="recommendations-list">
                {recommendations.map((rec) => (
                  <div key={rec.id} className={`recommendation-card severity-${rec.severity}`}>
                    <div className="rec-header">
                      <span className={`severity-badge ${rec.severity}`}>
                        {rec.severity.toUpperCase()}
                      </span>
                      <span className="category-badge">{rec.category}</span>
                    </div>
                    <h4>{rec.title}</h4>
                    <p className="rec-description">{rec.description}</p>
                    <div className="rec-details">
                      <div className="rec-section">
                        <strong>Impact:</strong> {rec.impact}
                      </div>
                      <div className="rec-section">
                        <strong>Solution:</strong> {rec.solution}
                      </div>
                      <div className="rec-section">
                        <strong>Expected Improvement:</strong> {rec.estimatedImprovement}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
