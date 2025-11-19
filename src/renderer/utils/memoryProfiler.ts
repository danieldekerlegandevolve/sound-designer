/**
 * Memory Profiler
 * Track and analyze memory usage patterns
 */

import { MemorySnapshot, AudioBufferStats, formatBytes } from '@shared/performanceTypes';

export class MemoryProfiler {
  private snapshots: MemorySnapshot[] = [];
  private maxSnapshots: number = 100;
  private audioBuffers: WeakMap<AudioBuffer, number> = new WeakMap();
  private audioBufferSizes: number[] = [];

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot {
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: this.getHeapUsed(),
      heapTotal: this.getHeapTotal(),
      external: this.getExternal(),
      arrayBuffers: this.getArrayBuffersSize(),
      audioBuffers: this.getAudioBuffersSize(),
      canvasContexts: this.getCanvasContextsSize(),
      eventListeners: this.getEventListenersCount(),
      domNodes: this.getDOMNodesCount(),
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Get heap used
   */
  private getHeapUsed(): number {
    if ('memory' in performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Get heap total
   */
  private getHeapTotal(): number {
    if ('memory' in performance && (performance as any).memory) {
      return (performance as any).memory.totalJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * Get external memory
   */
  private getExternal(): number {
    if ('memory' in performance && (performance as any).memory) {
      return (performance as any).memory.jsHeapSizeLimit || 0;
    }
    return 0;
  }

  /**
   * Get ArrayBuffers size
   */
  private getArrayBuffersSize(): number {
    // This is an approximation - would need native support for exact tracking
    return this.audioBufferSizes.reduce((sum, size) => sum + size, 0);
  }

  /**
   * Get audio buffers size
   */
  private getAudioBuffersSize(): number {
    return this.audioBufferSizes.reduce((sum, size) => sum + size, 0);
  }

  /**
   * Get canvas contexts size estimate
   */
  private getCanvasContextsSize(): number {
    const canvases = document.querySelectorAll('canvas');
    let totalSize = 0;

    canvases.forEach((canvas) => {
      const width = canvas.width;
      const height = canvas.height;
      // Estimate: width * height * 4 bytes per pixel (RGBA)
      totalSize += width * height * 4;
    });

    return totalSize;
  }

  /**
   * Get event listeners count
   */
  private getEventListenersCount(): number {
    // This is an estimate - exact count requires native support
    return 0;
  }

  /**
   * Get DOM nodes count
   */
  private getDOMNodesCount(): number {
    return document.getElementsByTagName('*').length;
  }

  /**
   * Track audio buffer
   */
  trackAudioBuffer(buffer: AudioBuffer): void {
    const size = buffer.length * buffer.numberOfChannels * 4; // 4 bytes per float32
    this.audioBuffers.set(buffer, size);
    this.audioBufferSizes.push(size);
  }

  /**
   * Untrack audio buffer
   */
  untrackAudioBuffer(buffer: AudioBuffer): void {
    const size = this.audioBuffers.get(buffer);
    if (size !== undefined) {
      const index = this.audioBufferSizes.indexOf(size);
      if (index !== -1) {
        this.audioBufferSizes.splice(index, 1);
      }
      this.audioBuffers.delete(buffer);
    }
  }

  /**
   * Get audio buffer statistics
   */
  getAudioBufferStats(): AudioBufferStats {
    const totalBuffers = this.audioBufferSizes.length;
    const totalMemory = this.audioBufferSizes.reduce((sum, size) => sum + size, 0);
    const averageSize = totalBuffers > 0 ? totalMemory / totalBuffers : 0;
    const largestBuffer = totalBuffers > 0 ? Math.max(...this.audioBufferSizes) : 0;
    const smallestBuffer = totalBuffers > 0 ? Math.min(...this.audioBufferSizes) : 0;

    const heapTotal = this.getHeapTotal();
    const utilizationRate = heapTotal > 0 ? (totalMemory / heapTotal) * 100 : 0;

    return {
      totalBuffers,
      totalMemory,
      averageSize,
      largestBuffer,
      smallestBuffer,
      utilizationRate,
    };
  }

  /**
   * Get memory usage trend
   */
  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.snapshots.length < 10) return 'stable';

    const recent = this.snapshots.slice(-10);
    const first = recent[0].heapUsed;
    const last = recent[recent.length - 1].heapUsed;

    const change = ((last - first) / first) * 100;

    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Detect memory leaks
   */
  detectLeaks(): Array<{ type: string; description: string; severity: 'high' | 'medium' | 'low' }> {
    const leaks: Array<{ type: string; description: string; severity: 'high' | 'medium' | 'low' }> = [];

    // Check for increasing memory trend
    const trend = this.getMemoryTrend();
    if (trend === 'increasing') {
      leaks.push({
        type: 'memory_growth',
        description: 'Memory usage is consistently increasing',
        severity: 'high',
      });
    }

    // Check for excessive audio buffers
    const audioStats = this.getAudioBufferStats();
    if (audioStats.totalBuffers > 100) {
      leaks.push({
        type: 'audio_buffers',
        description: `Large number of audio buffers: ${audioStats.totalBuffers}`,
        severity: 'medium',
      });
    }

    // Check for excessive DOM nodes
    const latest = this.snapshots[this.snapshots.length - 1];
    if (latest && latest.domNodes > 5000) {
      leaks.push({
        type: 'dom_nodes',
        description: `Excessive DOM nodes: ${latest.domNodes}`,
        severity: 'medium',
      });
    }

    return leaks;
  }

  /**
   * Get memory summary
   */
  getSummary(): string {
    const latest = this.snapshots[this.snapshots.length - 1];
    if (!latest) return 'No memory data available';

    const audioStats = this.getAudioBufferStats();
    const trend = this.getMemoryTrend();
    const leaks = this.detectLeaks();

    const lines = [
      '=== Memory Profile ===',
      '',
      `Heap Used: ${formatBytes(latest.heapUsed)}`,
      `Heap Total: ${formatBytes(latest.heapTotal)}`,
      `Audio Buffers: ${audioStats.totalBuffers} (${formatBytes(audioStats.totalMemory)})`,
      `Canvas Memory: ${formatBytes(latest.canvasContexts)}`,
      `DOM Nodes: ${latest.domNodes}`,
      '',
      `Trend: ${trend.toUpperCase()}`,
      '',
    ];

    if (leaks.length > 0) {
      lines.push('Potential Issues:');
      leaks.forEach((leak) => {
        lines.push(`  [${leak.severity.toUpperCase()}] ${leak.description}`);
      });
    } else {
      lines.push('No memory issues detected');
    }

    return lines.join('\n');
  }

  /**
   * Clear snapshots
   */
  clearSnapshots(): void {
    this.snapshots = [];
  }

  /**
   * Get snapshots
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }
}

// Singleton instance
let globalProfiler: MemoryProfiler | null = null;

export function getMemoryProfiler(): MemoryProfiler {
  if (!globalProfiler) {
    globalProfiler = new MemoryProfiler();
  }
  return globalProfiler;
}
