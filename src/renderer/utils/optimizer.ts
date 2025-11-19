/**
 * Performance Optimizer
 * Benchmarking and optimization recommendations
 */

import {
  BenchmarkResult,
  OptimizationRecommendation,
  PerformanceMetrics,
  calculateStandardDeviation,
  formatDuration,
} from '@shared/performanceTypes';

export class Benchmarker {
  /**
   * Benchmark a function
   */
  static benchmark(
    name: string,
    fn: () => void,
    iterations: number = 1000
  ): BenchmarkResult {
    const times: number[] = [];

    // Warmup
    for (let i = 0; i < Math.min(10, iterations); i++) {
      fn();
    }

    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
    }

    const totalDuration = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalDuration / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const standardDeviation = calculateStandardDeviation(times);
    const opsPerSecond = 1000 / averageTime;

    return {
      name,
      duration: totalDuration,
      iterations,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      opsPerSecond,
    };
  }

  /**
   * Benchmark async function
   */
  static async benchmarkAsync(
    name: string,
    fn: () => Promise<void>,
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    const times: number[] = [];

    // Warmup
    for (let i = 0; i < Math.min(5, iterations); i++) {
      await fn();
    }

    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    const totalDuration = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalDuration / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const standardDeviation = calculateStandardDeviation(times);
    const opsPerSecond = 1000 / averageTime;

    return {
      name,
      duration: totalDuration,
      iterations,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      opsPerSecond,
    };
  }

  /**
   * Generate benchmark report
   */
  static generateReport(results: BenchmarkResult[]): string {
    const lines = [
      '=== Benchmark Results ===',
      '',
    ];

    results.forEach((result) => {
      lines.push(`${result.name}:`);
      lines.push(`  Iterations: ${result.iterations}`);
      lines.push(`  Average: ${formatDuration(result.averageTime)}`);
      lines.push(`  Min: ${formatDuration(result.minTime)}`);
      lines.push(`  Max: ${formatDuration(result.maxTime)}`);
      lines.push(`  Std Dev: ${formatDuration(result.standardDeviation)}`);
      lines.push(`  Ops/sec: ${result.opsPerSecond.toFixed(0)}`);
      lines.push('');
    });

    return lines.join('\n');
  }
}

export class OptimizationEngine {
  /**
   * Analyze performance metrics and generate recommendations
   */
  static analyzeMetrics(metrics: PerformanceMetrics): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // CPU recommendations
    if (metrics.cpuUsage > 90) {
      recommendations.push({
        id: 'cpu_critical',
        severity: 'critical',
        category: 'cpu',
        title: 'Critical CPU Usage',
        description: `CPU usage is at ${metrics.cpuUsage.toFixed(1)}%, causing performance degradation`,
        impact: 'Audio dropouts, UI freezing, system instability',
        solution: 'Reduce active DSP nodes, increase buffer size, optimize algorithms',
        estimatedImprovement: '30-50% CPU reduction',
      });
    } else if (metrics.cpuUsage > 70) {
      recommendations.push({
        id: 'cpu_high',
        severity: 'high',
        category: 'cpu',
        title: 'High CPU Usage',
        description: `CPU usage is at ${metrics.cpuUsage.toFixed(1)}%`,
        impact: 'Reduced headroom for additional processing',
        solution: 'Consider freezing tracks, using lighter algorithms, or increasing buffer size',
        estimatedImprovement: '15-25% CPU reduction',
      });
    }

    // Memory recommendations
    const memoryMB = metrics.memoryUsed / (1024 * 1024);
    if (memoryMB > 1000) {
      recommendations.push({
        id: 'memory_critical',
        severity: 'critical',
        category: 'memory',
        title: 'Critical Memory Usage',
        description: `Memory usage is at ${memoryMB.toFixed(0)} MB`,
        impact: 'Risk of crashes, slow performance, system instability',
        solution: 'Clear unused samples, optimize audio buffer usage, restart application',
        estimatedImprovement: '200-500 MB reduction',
      });
    } else if (memoryMB > 500) {
      recommendations.push({
        id: 'memory_high',
        severity: 'high',
        category: 'memory',
        title: 'High Memory Usage',
        description: `Memory usage is at ${memoryMB.toFixed(0)} MB`,
        impact: 'Slower performance, potential memory leaks',
        solution: 'Review sample library, clear undo history, release unused resources',
        estimatedImprovement: '100-200 MB reduction',
      });
    }

    // Frame time recommendations
    if (metrics.frameTime > 33) {
      recommendations.push({
        id: 'framerate_low',
        severity: 'high',
        category: 'ui',
        title: 'Low Frame Rate',
        description: `Frame time is ${metrics.frameTime.toFixed(2)} ms (${metrics.fps.toFixed(1)} FPS)`,
        impact: 'Stuttering UI, poor user experience',
        solution: 'Reduce waveform detail, limit canvas redraws, optimize React renders',
        estimatedImprovement: '2x frame rate improvement',
      });
    } else if (metrics.frameTime > 16.67) {
      recommendations.push({
        id: 'framerate_moderate',
        severity: 'medium',
        category: 'ui',
        title: 'Moderate Frame Rate',
        description: `Frame time is ${metrics.frameTime.toFixed(2)} ms (${metrics.fps.toFixed(1)} FPS)`,
        impact: 'Slightly choppy UI',
        solution: 'Optimize React component updates, use memoization',
        estimatedImprovement: 'Reach 60 FPS target',
      });
    }

    // Audio latency recommendations
    if (metrics.audioCallbackLatency > 20) {
      recommendations.push({
        id: 'latency_high',
        severity: 'high',
        category: 'audio',
        title: 'High Audio Latency',
        description: `Audio latency is ${metrics.audioCallbackLatency.toFixed(2)} ms`,
        impact: 'Noticeable delay, poor playability',
        solution: 'Reduce buffer size (if stable), optimize DSP algorithms',
        estimatedImprovement: 'Latency < 10 ms',
      });
    }

    // Buffer underruns
    if (metrics.bufferUnderruns > 0) {
      recommendations.push({
        id: 'buffer_underruns',
        severity: 'critical',
        category: 'audio',
        title: 'Audio Buffer Underruns',
        description: `${metrics.bufferUnderruns} buffer underruns detected`,
        impact: 'Audio glitches, clicks, and pops',
        solution: 'Increase buffer size, reduce CPU load, close background applications',
        estimatedImprovement: 'Eliminate audio glitches',
      });
    }

    // General optimizations
    if (metrics.activeNodes > 50) {
      recommendations.push({
        id: 'nodes_excessive',
        severity: 'medium',
        category: 'general',
        title: 'Excessive Active Nodes',
        description: `${metrics.activeNodes} nodes are currently active`,
        impact: 'Increased CPU and memory usage',
        solution: 'Freeze unused tracks, combine similar processors',
        estimatedImprovement: '10-20% performance improvement',
      });
    }

    return recommendations.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Generate optimization report
   */
  static generateReport(recommendations: OptimizationRecommendation[]): string {
    const lines = [
      '=== Optimization Recommendations ===',
      '',
    ];

    if (recommendations.length === 0) {
      lines.push('No optimization recommendations at this time.');
      lines.push('Performance is operating within acceptable parameters.');
      return lines.join('\n');
    }

    const bySeverity = {
      critical: recommendations.filter((r) => r.severity === 'critical'),
      high: recommendations.filter((r) => r.severity === 'high'),
      medium: recommendations.filter((r) => r.severity === 'medium'),
      low: recommendations.filter((r) => r.severity === 'low'),
    };

    if (bySeverity.critical.length > 0) {
      lines.push('🔴 CRITICAL ISSUES:');
      bySeverity.critical.forEach((rec) => {
        lines.push(`\n  ${rec.title}`);
        lines.push(`  ${rec.description}`);
        lines.push(`  Impact: ${rec.impact}`);
        lines.push(`  Solution: ${rec.solution}`);
        lines.push(`  Expected: ${rec.estimatedImprovement}`);
      });
      lines.push('');
    }

    if (bySeverity.high.length > 0) {
      lines.push('🟠 HIGH PRIORITY:');
      bySeverity.high.forEach((rec) => {
        lines.push(`\n  ${rec.title}`);
        lines.push(`  Solution: ${rec.solution}`);
      });
      lines.push('');
    }

    if (bySeverity.medium.length > 0) {
      lines.push('🟡 MEDIUM PRIORITY:');
      bySeverity.medium.forEach((rec) => {
        lines.push(`  • ${rec.title}: ${rec.solution}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get quick wins (easy optimizations with high impact)
   */
  static getQuickWins(recommendations: OptimizationRecommendation[]): OptimizationRecommendation[] {
    return recommendations.filter(
      (rec) =>
        (rec.severity === 'high' || rec.severity === 'critical') &&
        (rec.category === 'cpu' || rec.category === 'memory')
    );
  }
}
