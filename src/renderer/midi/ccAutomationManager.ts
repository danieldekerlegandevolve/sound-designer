/**
 * CC Automation Manager
 *
 * Manages MIDI CC automation recording and playback
 */

import {
  AutomationLane,
  AutomationPoint,
  AutomationState,
  generateAutomationLaneId,
  interpolateAutomation,
} from '../../shared/midiAdvancedTypes';

export type AutomationCallback = (ccNumber: number, channel: number, value: number) => void;
export type LaneChangeCallback = (lanes: AutomationLane[]) => void;

export class CCAutomationManager {
  private state: AutomationState;
  private playbackTimer: number | null = null;
  private lastPlaybackTime: number = 0;
  private automationCallbacks: Set<AutomationCallback> = new Set();
  private laneChangeCallbacks: Set<LaneChangeCallback> = new Set();

  constructor() {
    this.state = {
      lanes: [],
      isPlaying: false,
      currentTime: 0,
      loopStart: 0,
      loopEnd: 8, // 8 seconds default
      loopEnabled: false,
      recordEnabled: false,
      recordingLaneId: null,
    };
  }

  /**
   * Create a new automation lane
   */
  createLane(ccNumber: number, channel: number, name?: string): AutomationLane {
    const lane: AutomationLane = {
      id: generateAutomationLaneId(),
      name: name || `CC${ccNumber} Ch${channel + 1}`,
      ccNumber,
      channel,
      points: [],
      enabled: true,
      color: this.generateLaneColor(this.state.lanes.length),
      isRecording: false,
      playbackMode: 'loop',
    };

    this.state.lanes.push(lane);
    this.notifyLaneChange();

    console.log(`Created automation lane: ${lane.name}`);
    return lane;
  }

  /**
   * Delete an automation lane
   */
  deleteLane(laneId: string): void {
    const index = this.state.lanes.findIndex((l) => l.id === laneId);
    if (index !== -1) {
      this.state.lanes.splice(index, 1);
      this.notifyLaneChange();
      console.log(`Deleted automation lane: ${laneId}`);
    }
  }

  /**
   * Get lane by ID
   */
  getLane(laneId: string): AutomationLane | undefined {
    return this.state.lanes.find((l) => l.id === laneId);
  }

  /**
   * Get all lanes
   */
  getLanes(): AutomationLane[] {
    return [...this.state.lanes];
  }

  /**
   * Update lane properties
   */
  updateLane(laneId: string, updates: Partial<AutomationLane>): void {
    const lane = this.getLane(laneId);
    if (lane) {
      Object.assign(lane, updates);
      this.notifyLaneChange();
    }
  }

  /**
   * Add automation point to a lane
   */
  addPoint(
    laneId: string,
    time: number,
    value: number,
    curve: AutomationPoint['curve'] = 'linear'
  ): void {
    const lane = this.getLane(laneId);
    if (!lane) return;

    const point: AutomationPoint = { time, value, curve };

    // Insert point in sorted order
    const insertIndex = lane.points.findIndex((p) => p.time > time);
    if (insertIndex === -1) {
      lane.points.push(point);
    } else {
      lane.points.splice(insertIndex, 0, point);
    }

    this.notifyLaneChange();
  }

  /**
   * Remove automation point
   */
  removePoint(laneId: string, pointIndex: number): void {
    const lane = this.getLane(laneId);
    if (!lane || pointIndex < 0 || pointIndex >= lane.points.length) return;

    lane.points.splice(pointIndex, 1);
    this.notifyLaneChange();
  }

  /**
   * Update automation point
   */
  updatePoint(
    laneId: string,
    pointIndex: number,
    updates: Partial<AutomationPoint>
  ): void {
    const lane = this.getLane(laneId);
    if (!lane || pointIndex < 0 || pointIndex >= lane.points.length) return;

    Object.assign(lane.points[pointIndex], updates);

    // Re-sort if time changed
    if (updates.time !== undefined) {
      lane.points.sort((a, b) => a.time - b.time);
    }

    this.notifyLaneChange();
  }

  /**
   * Start recording automation
   */
  startRecording(laneId?: string): void {
    if (laneId) {
      const lane = this.getLane(laneId);
      if (lane) {
        lane.isRecording = true;
        this.state.recordingLaneId = laneId;

        // Clear existing points in recording lane
        lane.points = [];
      }
    }

    this.state.recordEnabled = true;
    this.state.currentTime = 0;

    console.log(`Started recording automation${laneId ? ` for lane ${laneId}` : ''}`);
  }

  /**
   * Stop recording automation
   */
  stopRecording(): void {
    this.state.recordEnabled = false;

    // Stop recording on all lanes
    this.state.lanes.forEach((lane) => {
      lane.isRecording = false;
    });

    this.state.recordingLaneId = null;
    this.notifyLaneChange();

    console.log('Stopped recording automation');
  }

  /**
   * Record automation data
   */
  recordAutomation(ccNumber: number, channel: number, value: number): void {
    if (!this.state.recordEnabled) return;

    // Find lane being recorded
    let lane: AutomationLane | undefined;

    if (this.state.recordingLaneId) {
      lane = this.getLane(this.state.recordingLaneId);
    } else {
      // Auto-create lane if needed
      lane = this.state.lanes.find(
        (l) => l.ccNumber === ccNumber && l.channel === channel && l.isRecording
      );

      if (!lane) {
        lane = this.createLane(ccNumber, channel);
        lane.isRecording = true;
        this.state.recordingLaneId = lane.id;
      }
    }

    if (!lane) return;

    // Add automation point
    this.addPoint(lane.id, this.state.currentTime, value, 'linear');
  }

  /**
   * Start playback
   */
  startPlayback(): void {
    if (this.state.isPlaying) return;

    this.state.isPlaying = true;
    this.lastPlaybackTime = performance.now();

    this.schedulePlayback();
    console.log('Started automation playback');
  }

  /**
   * Stop playback
   */
  stopPlayback(): void {
    if (!this.state.isPlaying) return;

    this.state.isPlaying = false;

    if (this.playbackTimer !== null) {
      cancelAnimationFrame(this.playbackTimer);
      this.playbackTimer = null;
    }

    console.log('Stopped automation playback');
  }

  /**
   * Schedule next playback frame
   */
  private schedulePlayback(): void {
    if (!this.state.isPlaying) return;

    const now = performance.now();
    const deltaTime = (now - this.lastPlaybackTime) / 1000; // Convert to seconds
    this.lastPlaybackTime = now;

    // Update current time
    this.state.currentTime += deltaTime;

    // Handle looping
    if (this.state.loopEnabled) {
      const loopDuration = this.state.loopEnd - this.state.loopStart;
      if (this.state.currentTime >= this.state.loopEnd) {
        this.state.currentTime = this.state.loopStart;
      } else if (this.state.currentTime < this.state.loopStart) {
        this.state.currentTime = this.state.loopStart;
      }
    }

    // Play automation for each enabled lane
    this.state.lanes.forEach((lane) => {
      if (!lane.enabled || lane.points.length === 0) return;

      const value = interpolateAutomation(lane.points, this.state.currentTime);

      // Send automation value
      this.notifyAutomation(lane.ccNumber, lane.channel, value);
    });

    // Schedule next frame
    this.playbackTimer = requestAnimationFrame(() => this.schedulePlayback());
  }

  /**
   * Seek to specific time
   */
  seekTo(time: number): void {
    this.state.currentTime = Math.max(0, time);

    // If playing, immediately send values for current time
    if (this.state.isPlaying) {
      this.state.lanes.forEach((lane) => {
        if (!lane.enabled || lane.points.length === 0) return;
        const value = interpolateAutomation(lane.points, this.state.currentTime);
        this.notifyAutomation(lane.ccNumber, lane.channel, value);
      });
    }
  }

  /**
   * Set loop range
   */
  setLoopRange(start: number, end: number): void {
    this.state.loopStart = Math.max(0, start);
    this.state.loopEnd = Math.max(this.state.loopStart + 0.1, end);
  }

  /**
   * Enable/disable loop
   */
  setLoopEnabled(enabled: boolean): void {
    this.state.loopEnabled = enabled;
  }

  /**
   * Get current state
   */
  getState(): AutomationState {
    return { ...this.state };
  }

  /**
   * Get current time
   */
  getCurrentTime(): number {
    return this.state.currentTime;
  }

  /**
   * Clear all automation data
   */
  clearAll(): void {
    this.stopPlayback();
    this.stopRecording();
    this.state.lanes = [];
    this.state.currentTime = 0;
    this.notifyLaneChange();
    console.log('Cleared all automation data');
  }

  /**
   * Export automation to JSON
   */
  exportAutomation(): string {
    return JSON.stringify(this.state.lanes, null, 2);
  }

  /**
   * Import automation from JSON
   */
  importAutomation(json: string): void {
    try {
      const lanes = JSON.parse(json) as AutomationLane[];
      this.state.lanes = lanes;
      this.notifyLaneChange();
      console.log(`Imported ${lanes.length} automation lanes`);
    } catch (error) {
      console.error('Failed to import automation:', error);
      throw error;
    }
  }

  /**
   * Subscribe to automation events
   */
  onAutomation(callback: AutomationCallback): () => void {
    this.automationCallbacks.add(callback);
    return () => {
      this.automationCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to lane changes
   */
  onLaneChange(callback: LaneChangeCallback): () => void {
    this.laneChangeCallbacks.add(callback);
    return () => {
      this.laneChangeCallbacks.delete(callback);
    };
  }

  /**
   * Notify automation callbacks
   */
  private notifyAutomation(ccNumber: number, channel: number, value: number): void {
    this.automationCallbacks.forEach((callback) => {
      try {
        callback(ccNumber, channel, value);
      } catch (error) {
        console.error('Error in automation callback:', error);
      }
    });
  }

  /**
   * Notify lane change callbacks
   */
  private notifyLaneChange(): void {
    const lanes = this.getLanes();
    this.laneChangeCallbacks.forEach((callback) => {
      try {
        callback(lanes);
      } catch (error) {
        console.error('Error in lane change callback:', error);
      }
    });
  }

  /**
   * Generate color for lane
   */
  private generateLaneColor(index: number): string {
    const colors = [
      '#6496ff',
      '#64c8ff',
      '#64ff96',
      '#c8ff64',
      '#ff9664',
      '#ff6496',
      '#c864ff',
      '#64ffc8',
    ];
    return colors[index % colors.length];
  }
}

// Singleton instance
let ccAutomationManagerInstance: CCAutomationManager | null = null;

/**
 * Get the global CCAutomationManager instance
 */
export function getCCAutomationManager(): CCAutomationManager {
  if (!ccAutomationManagerInstance) {
    ccAutomationManagerInstance = new CCAutomationManager();
  }
  return ccAutomationManagerInstance;
}

/**
 * Reset the global CCAutomationManager instance
 */
export function resetCCAutomationManager(): void {
  if (ccAutomationManagerInstance) {
    ccAutomationManagerInstance.stopPlayback();
    ccAutomationManagerInstance.stopRecording();
  }
  ccAutomationManagerInstance = null;
}
