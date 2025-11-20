/**
 * MIDI Monitor
 *
 * Monitors and logs MIDI messages for debugging and visualization
 */

import { MIDIMonitorEvent, MIDIMonitorFilter } from '../../shared/midiAdvancedTypes';

export type MonitorEventCallback = (event: MIDIMonitorEvent) => void;

export class MIDIMonitor {
  private events: MIDIMonitorEvent[] = [];
  private maxEvents: number = 1000;
  private filter: MIDIMonitorFilter;
  private callbacks: Set<MonitorEventCallback> = new Set();
  private isEnabled: boolean = true;

  constructor(maxEvents: number = 1000) {
    this.maxEvents = maxEvents;
    this.filter = {
      showNoteOn: true,
      showNoteOff: true,
      showCC: true,
      showPitchBend: true,
      showProgram: true,
      showAftertouch: true,
      showSysex: false,
      channelFilter: [], // Empty = all channels
    };
  }

  /**
   * Log a MIDI message
   */
  logMessage(
    type: MIDIMonitorEvent['type'],
    channel: number,
    data1?: number,
    data2?: number
  ): void {
    if (!this.isEnabled) return;

    // Check filter
    if (!this.shouldLog(type, channel)) return;

    // Create event
    const event: MIDIMonitorEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      channel,
      data1,
      data2,
      message: this.formatMessage(type, channel, data1, data2),
      isFiltered: false,
    };

    // Add to events
    this.events.push(event);

    // Trim if exceeds max
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Notify callbacks
    this.notifyCallbacks(event);
  }

  /**
   * Check if message should be logged based on filter
   */
  private shouldLog(type: MIDIMonitorEvent['type'], channel: number): boolean {
    // Check channel filter
    if (this.filter.channelFilter.length > 0) {
      if (!this.filter.channelFilter.includes(channel)) {
        return false;
      }
    }

    // Check type filter
    switch (type) {
      case 'noteOn':
        return this.filter.showNoteOn;
      case 'noteOff':
        return this.filter.showNoteOff;
      case 'cc':
        return this.filter.showCC;
      case 'pitchBend':
        return this.filter.showPitchBend;
      case 'program':
        return this.filter.showProgram;
      case 'aftertouch':
        return this.filter.showAftertouch;
      case 'sysex':
        return this.filter.showSysex;
      default:
        return true;
    }
  }

  /**
   * Format message for display
   */
  private formatMessage(
    type: MIDIMonitorEvent['type'],
    channel: number,
    data1?: number,
    data2?: number
  ): string {
    const ch = channel + 1; // Display as 1-16

    switch (type) {
      case 'noteOn':
        return `Note On: ${this.noteNumberToName(data1!)} (${data1}) Vel: ${data2} Ch: ${ch}`;

      case 'noteOff':
        return `Note Off: ${this.noteNumberToName(data1!)} (${data1}) Vel: ${data2} Ch: ${ch}`;

      case 'cc':
        return `CC: ${data1} Value: ${data2} Ch: ${ch}`;

      case 'pitchBend':
        const bend14bit = data1! + (data2! << 7);
        const bendNormalized = ((bend14bit - 8192) / 8192).toFixed(3);
        return `Pitch Bend: ${bendNormalized} (${bend14bit}) Ch: ${ch}`;

      case 'program':
        return `Program Change: ${data1} Ch: ${ch}`;

      case 'aftertouch':
        return `Aftertouch: ${data1} Ch: ${ch}`;

      case 'sysex':
        return `SysEx: ${data1} bytes`;

      default:
        return `Unknown: Type ${type} Ch: ${ch}`;
    }
  }

  /**
   * Convert MIDI note number to note name
   */
  private noteNumberToName(noteNumber: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteName = noteNames[noteNumber % 12];
    return `${noteName}${octave}`;
  }

  /**
   * Get all events
   */
  getEvents(): MIDIMonitorEvent[] {
    return [...this.events];
  }

  /**
   * Get recent events (last N)
   */
  getRecentEvents(count: number): MIDIMonitorEvent[] {
    return this.events.slice(-count);
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
    console.log('MIDI monitor events cleared');
  }

  /**
   * Set filter
   */
  setFilter(filter: Partial<MIDIMonitorFilter>): void {
    this.filter = { ...this.filter, ...filter };
  }

  /**
   * Get filter
   */
  getFilter(): MIDIMonitorFilter {
    return { ...this.filter };
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if monitoring is enabled
   */
  isMonitoring(): boolean {
    return this.isEnabled;
  }

  /**
   * Set max events to store
   */
  setMaxEvents(max: number): void {
    this.maxEvents = Math.max(100, Math.min(10000, max));

    // Trim if needed
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  /**
   * Subscribe to monitor events
   */
  subscribe(callback: MonitorEventCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Notify callbacks
   */
  private notifyCallbacks(event: MIDIMonitorEvent): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in MIDI monitor callback:', error);
      }
    });
  }

  /**
   * Export events to JSON
   */
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Export events to CSV
   */
  exportEventsCSV(): string {
    const header = 'Timestamp,Type,Channel,Data1,Data2,Message\n';
    const rows = this.events.map(
      (e) =>
        `${e.timestamp},${e.type},${e.channel},${e.data1 ?? ''},${e.data2 ?? ''},"${e.message}"`
    );
    return header + rows.join('\n');
  }

  /**
   * Get statistics about monitored events
   */
  getStatistics(): {
    total: number;
    byType: Record<string, number>;
    byChannel: Record<number, number>;
  } {
    const stats = {
      total: this.events.length,
      byType: {} as Record<string, number>,
      byChannel: {} as Record<number, number>,
    };

    this.events.forEach((event) => {
      // Count by type
      if (!stats.byType[event.type]) {
        stats.byType[event.type] = 0;
      }
      stats.byType[event.type]++;

      // Count by channel
      if (!stats.byChannel[event.channel]) {
        stats.byChannel[event.channel] = 0;
      }
      stats.byChannel[event.channel]++;
    });

    return stats;
  }
}

// Singleton instance
let midiMonitorInstance: MIDIMonitor | null = null;

/**
 * Get the global MIDIMonitor instance
 */
export function getMIDIMonitor(): MIDIMonitor {
  if (!midiMonitorInstance) {
    midiMonitorInstance = new MIDIMonitor();
  }
  return midiMonitorInstance;
}

/**
 * Reset the global MIDIMonitor instance
 */
export function resetMIDIMonitor(): void {
  midiMonitorInstance = null;
}
