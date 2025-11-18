import { PluginProject } from '@shared/types';

interface HistoryEntry {
  project: PluginProject;
  timestamp: number;
  description: string;
}

export class HistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor(maxSize: number = 50) {
    this.maxHistorySize = maxSize;
  }

  // Add a new state to history
  push(project: PluginProject, description: string): void {
    // Remove any history after current index (when undoing then making new changes)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new entry
    this.history.push({
      project: JSON.parse(JSON.stringify(project)), // Deep clone
      timestamp: Date.now(),
      description,
    });

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  // Undo to previous state
  undo(): PluginProject | null {
    if (!this.canUndo()) return null;

    this.currentIndex--;
    return JSON.parse(JSON.stringify(this.history[this.currentIndex].project));
  }

  // Redo to next state
  redo(): PluginProject | null {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    return JSON.parse(JSON.stringify(this.history[this.currentIndex].project));
  }

  // Check if undo is possible
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  // Check if redo is possible
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // Get current state description
  getCurrentDescription(): string {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex].description;
    }
    return '';
  }

  // Get undo description
  getUndoDescription(): string {
    if (this.canUndo()) {
      return this.history[this.currentIndex - 1].description;
    }
    return '';
  }

  // Get redo description
  getRedoDescription(): string {
    if (this.canRedo()) {
      return this.history[this.currentIndex + 1].description;
    }
    return '';
  }

  // Clear all history
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  // Get history size
  size(): number {
    return this.history.length;
  }

  // Get all history entries (for debugging/visualization)
  getHistory(): Array<{ description: string; timestamp: number; isCurrent: boolean }> {
    return this.history.map((entry, index) => ({
      description: entry.description,
      timestamp: entry.timestamp,
      isCurrent: index === this.currentIndex,
    }));
  }
}
