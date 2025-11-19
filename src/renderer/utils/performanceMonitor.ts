/**
 * Performance Monitor
 * Real-time performance tracking and analysis
 */

import {
  PerformanceMetrics,
  PerformanceSample,
  PerformanceHistory,
  PerformanceConfig,
  DEFAULT_PERFORMANCE_CONFIG,
  calculatePerformanceScore,
  getPerformanceGrade,
  calculateMovingAverage,
  detectPerformanceBottleneck,
} from '@shared/performanceTypes';

export class PerformanceMonitor {
  private config: PerformanceConfig;
  private history: PerformanceHistory;
  private currentMetrics: PerformanceMetrics;
  private intervalId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private cpuSamples: number[] = [];
  private memorySamples: number[] = [];
  private callbacks: Set<(metrics: PerformanceMetrics) => void> = new Set();

  // Audio processing tracking
  private audioCallbackTimes: number[] = [];
  private audioLatencies: number[] = [];
  private bufferUnderrunCount: number = 0;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_PERFORMANCE_CONFIG, ...config };
    this.history = {
      samples: [],
      maxSamples: this.config.maxHistorySamples,
      startTime: Date.now(),
    };

    this.currentMetrics = this.getInitialMetrics();
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.intervalId !== null) return;

    this.history.startTime = Date.now();
    this.lastFrameTime = performance.now();

    // Start sampling
    this.intervalId = window.setInterval(() => {
      this.sample();
    }, this.config.sampleInterval);

    // Start frame time tracking
    this.trackFrameTime();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Take a performance sample
   */
  private sample(): void {
    const now = performance.now();

    // CPU usage (approximation based on frame time)
    const cpuUsage = this.estimateCPUUsage();
    this.cpuSamples.push(cpuUsage);
    if (this.cpuSamples.length > 60) this.cpuSamples.shift();

    // Memory usage
    const memoryUsed = this.getMemoryUsage();
    this.memorySamples.push(memoryUsed);
    if (this.memorySamples.length > 60) this.memorySamples.shift();

    // Frame time
    const frameTime = now - this.lastFrameTime;

    // Audio callback stats
    const audioCallbackTime = calculateMovingAverage(this.audioCallbackTimes, 10);
    const audioCallbackLatency = calculateMovingAverage(this.audioLatencies, 10);

    // Create sample
    const sample: PerformanceSample = {
      timestamp: now,
      cpuUsage,
      memoryUsed,
      frameTime,
      audioCallbackTime,
    };

    // Add to history
    this.history.samples.push(sample);
    if (this.history.samples.length > this.history.maxSamples) {
      this.history.samples.shift();
    }

    // Update current metrics
    this.updateMetrics(sample);

    // Notify callbacks
    this.notifyCallbacks();
  }

  /**
   * Update current metrics
   */
  private updateMetrics(sample: PerformanceSample): void {
    const averageCPU = calculateMovingAverage(this.cpuSamples, 30);
    const peakCPU = Math.max(...this.cpuSamples);
    const memoryPeak = Math.max(...this.memorySamples);

    const fps = 1000 / sample.frameTime;

    // Count active nodes (would need to be provided by the app)
    const activeNodes = 0; // Placeholder
    const totalNodes = 0; // Placeholder

    // Generate warnings
    const warnings: string[] = [];
    if (sample.cpuUsage > this.config.cpuCriticalThreshold) {
      warnings.push(`Critical CPU usage: ${sample.cpuUsage.toFixed(1)}%`);
    } else if (sample.cpuUsage > this.config.cpuWarningThreshold) {
      warnings.push(`High CPU usage: ${sample.cpuUsage.toFixed(1)}%`);
    }

    if (sample.memoryUsed > this.config.memoryCriticalThreshold) {
      warnings.push('Critical memory usage');
    } else if (sample.memoryUsed > this.config.memoryWarningThreshold) {
      warnings.push('High memory usage');
    }

    if (sample.frameTime > this.config.frameTimeWarningThreshold) {
      warnings.push(`Low frame rate: ${fps.toFixed(1)} FPS`);
    }

    if (sample.audioCallbackTime > this.config.audioLatencyWarningThreshold) {
      warnings.push('High audio latency');
    }

    if (this.bufferUnderrunCount > 0) {
      warnings.push(`${this.bufferUnderrunCount} audio buffer underruns`);
    }

    this.currentMetrics = {
      cpuUsage: sample.cpuUsage,
      averageCPU,
      peakCPU,
      memoryUsed: sample.memoryUsed,
      memoryPeak,
      audioBufferMemory: this.getAudioBufferMemory(),
      audioCallbackTime: sample.audioCallbackTime,
      audioCallbackLatency: sample.audioCallbackTime,
      bufferUnderruns: this.bufferUnderrunCount,
      sampleRate: 44100, // Would be provided by audio context
      bufferSize: 512, // Would be provided by audio context
      frameTime: sample.frameTime,
      fps,
      activeNodes,
      totalNodes,
      performanceScore: 0,
      performanceGrade: 'good',
      warnings,
    };

    // Calculate performance score
    this.currentMetrics.performanceScore = calculatePerformanceScore(this.currentMetrics);
    this.currentMetrics.performanceGrade = getPerformanceGrade(
      this.currentMetrics.performanceScore
    );
  }

  /**
   * Estimate CPU usage based on frame time and work time
   */
  private estimateCPUUsage(): number {
    // This is an approximation - actual CPU usage would need native code
    const frameTime = performance.now() - this.lastFrameTime;
    const targetFrameTime = 16.67; // 60 FPS

    // Estimate based on how much time we're using per frame
    const usage = Math.min(100, (frameTime / targetFrameTime) * 100);

    return usage;
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    // Try to use Performance Memory API
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize || 0;
    }

    // Fallback estimation
    return 0;
  }

  /**
   * Get audio buffer memory usage
   */
  private getAudioBufferMemory(): number {
    // Would need to be tracked by the audio system
    return 0;
  }

  /**
   * Track frame time
   */
  private trackFrameTime(): void {
    const track = () => {
      const now = performance.now();
      this.lastFrameTime = now;
      this.frameCount++;

      if (this.intervalId !== null) {
        requestAnimationFrame(track);
      }
    };

    requestAnimationFrame(track);
  }

  /**
   * Record audio callback time
   */
  recordAudioCallback(duration: number): void {
    this.audioCallbackTimes.push(duration);
    if (this.audioCallbackTimes.length > 60) {
      this.audioCallbackTimes.shift();
    }
  }

  /**
   * Record audio latency
   */
  recordAudioLatency(latency: number): void {
    this.audioLatencies.push(latency);
    if (this.audioLatencies.length > 60) {
      this.audioLatencies.shift();
    }
  }

  /**
   * Record buffer underrun
   */
  recordBufferUnderrun(): void {
    this.bufferUnderrunCount++;
  }

  /**
   * Reset buffer underrun count
   */
  resetBufferUnderruns(): void {
    this.bufferUnderrunCount = 0;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get performance history
   */
  getHistory(): PerformanceHistory {
    return {
      samples: [...this.history.samples],
      maxSamples: this.history.maxSamples,
      startTime: this.history.startTime,
    };
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history.samples = [];
    this.history.startTime = Date.now();
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.add(callback);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(this.currentMetrics);
      } catch (error) {
        console.error('Error in performance callback:', error);
      }
    });
  }

  /**
   * Get initial metrics
   */
  private getInitialMetrics(): PerformanceMetrics {
    return {
      cpuUsage: 0,
      averageCPU: 0,
      peakCPU: 0,
      memoryUsed: 0,
      memoryPeak: 0,
      audioBufferMemory: 0,
      audioCallbackTime: 0,
      audioCallbackLatency: 0,
      bufferUnderruns: 0,
      sampleRate: 44100,
      bufferSize: 512,
      frameTime: 16.67,
      fps: 60,
      activeNodes: 0,
      totalNodes: 0,
      performanceScore: 100,
      performanceGrade: 'excellent',
      warnings: [],
    };
  }

  /**
   * Detect current bottleneck
   */
  detectBottleneck(): ReturnType<typeof detectPerformanceBottleneck> {
    return detectPerformanceBottleneck(this.currentMetrics);
  }

  /**
   * Get performance summary
   */
  getSummary(): string {
    const metrics = this.currentMetrics;
    const bottleneck = this.detectBottleneck();

    const lines = [
      '=== Performance Summary ===',
      '',
      `Score: ${metrics.performanceScore}/100 (${metrics.performanceGrade})`,
      `CPU: ${metrics.cpuUsage.toFixed(1)}% (avg: ${metrics.averageCPU.toFixed(1)}%, peak: ${metrics.peakCPU.toFixed(1)}%)`,
      `Memory: ${(metrics.memoryUsed / (1024 * 1024)).toFixed(1)} MB`,
      `Frame Time: ${metrics.frameTime.toFixed(2)} ms (${metrics.fps.toFixed(1)} FPS)`,
      `Audio Latency: ${metrics.audioCallbackLatency.toFixed(2)} ms`,
      `Buffer Underruns: ${metrics.bufferUnderruns}`,
      '',
    ];

    if (bottleneck !== 'none') {
      lines.push(`⚠ Bottleneck: ${bottleneck.toUpperCase()}`);
      lines.push('');
    }

    if (metrics.warnings.length > 0) {
      lines.push('Warnings:');
      metrics.warnings.forEach((warning) => lines.push(`  - ${warning}`));
    } else {
      lines.push('No warnings');
    }

    return lines.join('\n');
  }

  /**
   * Export performance data
   */
  exportData(): string {
    return JSON.stringify(
      {
        config: this.config,
        currentMetrics: this.currentMetrics,
        history: this.history,
      },
      null,
      2
    );
  }

  /**
   * Force garbage collection (if available)
   */
  forceGC(): void {
    if (this.config.autoGarbageCollection && 'gc' in global) {
      try {
        (global as any).gc();
      } catch (e) {
        console.warn('Garbage collection not available');
      }
    }
  }
}

// Singleton instance
let globalMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor();
  }
  return globalMonitor;
}

export function resetPerformanceMonitor(): void {
  if (globalMonitor) {
    globalMonitor.stop();
  }
  globalMonitor = null;
}
