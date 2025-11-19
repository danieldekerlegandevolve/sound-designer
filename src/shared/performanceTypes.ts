/**
 * Performance Monitoring Types
 * Types and interfaces for performance tracking and optimization
 */

export interface PerformanceMetrics {
  // CPU metrics
  cpuUsage: number; // 0-100%
  averageCPU: number; // Moving average
  peakCPU: number; // Peak CPU usage

  // Memory metrics
  memoryUsed: number; // bytes
  memoryPeak: number; // bytes
  audioBufferMemory: number; // bytes

  // Audio processing metrics
  audioCallbackTime: number; // milliseconds
  audioCallbackLatency: number; // milliseconds
  bufferUnderruns: number; // count
  sampleRate: number; // Hz
  bufferSize: number; // samples

  // Timing metrics
  frameTime: number; // milliseconds
  fps: number; // frames per second

  // Node metrics
  activeNodes: number;
  totalNodes: number;

  // Overall health
  performanceScore: number; // 0-100
  performanceGrade: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  warnings: string[];
}

export interface PerformanceSample {
  timestamp: number;
  cpuUsage: number;
  memoryUsed: number;
  frameTime: number;
  audioCallbackTime: number;
}

export interface PerformanceHistory {
  samples: PerformanceSample[];
  maxSamples: number;
  startTime: number;
}

export interface OptimizationRecommendation {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'cpu' | 'memory' | 'audio' | 'ui' | 'general';
  title: string;
  description: string;
  impact: string;
  solution: string;
  estimatedImprovement: string;
}

export interface BenchmarkResult {
  name: string;
  duration: number; // milliseconds
  iterations: number;
  averageTime: number; // milliseconds per iteration
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  opsPerSecond: number;
}

export interface AudioBufferStats {
  totalBuffers: number;
  totalMemory: number;
  averageSize: number;
  largestBuffer: number;
  smallestBuffer: number;
  utilizationRate: number; // 0-100%
}

export interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;

  // Breakdown by type
  audioBuffers: number;
  canvasContexts: number;
  eventListeners: number;
  domNodes: number;
}

export interface CPUProfile {
  timestamp: number;
  duration: number;
  samples: CPUProfileSample[];
  topFunctions: Array<{
    name: string;
    percentage: number;
    selfTime: number;
    totalTime: number;
  }>;
}

export interface CPUProfileSample {
  timestamp: number;
  functionName: string;
  duration: number;
}

export interface PerformanceConfig {
  // Monitoring
  sampleInterval: number; // milliseconds
  maxHistorySamples: number;
  enableCPUProfiling: boolean;
  enableMemoryProfiling: boolean;

  // Thresholds
  cpuWarningThreshold: number; // percentage
  cpuCriticalThreshold: number; // percentage
  memoryWarningThreshold: number; // bytes
  memoryCriticalThreshold: number; // bytes
  frameTimeWarningThreshold: number; // milliseconds
  audioLatencyWarningThreshold: number; // milliseconds

  // Optimization
  enableAutoOptimization: boolean;
  autoGarbageCollection: boolean;
  aggressiveBufferPooling: boolean;
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  sampleInterval: 100,
  maxHistorySamples: 600, // 60 seconds at 100ms intervals
  enableCPUProfiling: false,
  enableMemoryProfiling: true,

  cpuWarningThreshold: 70,
  cpuCriticalThreshold: 90,
  memoryWarningThreshold: 500 * 1024 * 1024, // 500 MB
  memoryCriticalThreshold: 1024 * 1024 * 1024, // 1 GB
  frameTimeWarningThreshold: 16.67, // 60 FPS
  audioLatencyWarningThreshold: 10,

  enableAutoOptimization: true,
  autoGarbageCollection: true,
  aggressiveBufferPooling: true,
};

// Utility functions

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)} µs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function calculatePerformanceScore(metrics: Partial<PerformanceMetrics>): number {
  let score = 100;

  // CPU penalty
  if (metrics.cpuUsage !== undefined) {
    if (metrics.cpuUsage > 90) score -= 40;
    else if (metrics.cpuUsage > 70) score -= 20;
    else if (metrics.cpuUsage > 50) score -= 10;
  }

  // Memory penalty
  if (metrics.memoryUsed !== undefined) {
    const memoryMB = metrics.memoryUsed / (1024 * 1024);
    if (memoryMB > 1000) score -= 30;
    else if (memoryMB > 500) score -= 15;
    else if (memoryMB > 250) score -= 5;
  }

  // Frame time penalty
  if (metrics.frameTime !== undefined) {
    if (metrics.frameTime > 33) score -= 20; // < 30 FPS
    else if (metrics.frameTime > 16.67) score -= 10; // < 60 FPS
  }

  // Audio latency penalty
  if (metrics.audioCallbackLatency !== undefined) {
    if (metrics.audioCallbackLatency > 20) score -= 15;
    else if (metrics.audioCallbackLatency > 10) score -= 5;
  }

  // Buffer underruns penalty
  if (metrics.bufferUnderruns !== undefined && metrics.bufferUnderruns > 0) {
    score -= Math.min(20, metrics.bufferUnderruns * 5);
  }

  return Math.max(0, Math.min(100, score));
}

export function getPerformanceGrade(score: number): PerformanceMetrics['performanceGrade'] {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'poor';
  return 'critical';
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

  return Math.sqrt(variance);
}

export function calculateMovingAverage(values: number[], windowSize: number = 10): number {
  if (values.length === 0) return 0;

  const window = values.slice(-windowSize);
  return window.reduce((sum, val) => sum + val, 0) / window.length;
}

export function detectPerformanceBottleneck(
  metrics: PerformanceMetrics
): 'cpu' | 'memory' | 'audio' | 'ui' | 'none' {
  if (metrics.cpuUsage > 80) return 'cpu';
  if (metrics.memoryUsed > 800 * 1024 * 1024) return 'memory';
  if (metrics.audioCallbackLatency > 15 || metrics.bufferUnderruns > 0) return 'audio';
  if (metrics.frameTime > 20) return 'ui';
  return 'none';
}
