/**
 * Undo/Redo Manager
 *
 * Manages command history and provides undo/redo functionality
 */

import {
  Command,
  UndoManagerConfig,
  UndoRedoState,
  UndoRedoListener,
  canMergeCommands,
} from '../../shared/undoRedoTypes';

const DEFAULT_CONFIG: Required<UndoManagerConfig> = {
  maxHistorySize: 100,
  enableMerging: true,
  mergeWindowMs: 500,
  persistHistory: false,
};

/**
 * UndoManager class - manages command history for undo/redo
 */
export class UndoManager {
  private config: Required<UndoManagerConfig>;
  private history: Command[] = [];
  private currentIndex: number = -1;
  private listeners: Set<UndoRedoListener> = new Set();
  private isExecuting: boolean = false;

  constructor(config: UndoManagerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a command and add it to history
   */
  async execute(command: Command): Promise<void> {
    if (this.isExecuting) {
      console.warn('Cannot execute command while another command is executing');
      return;
    }

    this.isExecuting = true;

    try {
      // Execute the command
      await command.execute();

      // Try to merge with the last command if enabled
      if (this.config.enableMerging && this.currentIndex >= 0) {
        const lastCommand = this.history[this.currentIndex];
        if (
          lastCommand.merge &&
          command.merge &&
          canMergeCommands(lastCommand, command, this.config.mergeWindowMs)
        ) {
          if (lastCommand.merge(command)) {
            // Command was merged, no need to add to history
            this.notifyListeners();
            return;
          }
        }
      }

      // Remove any commands after current index (redo history)
      if (this.currentIndex < this.history.length - 1) {
        this.history.splice(this.currentIndex + 1);
      }

      // Add command to history
      this.history.push(command);
      this.currentIndex++;

      // Enforce max history size
      if (this.history.length > this.config.maxHistorySize) {
        const removeCount = this.history.length - this.config.maxHistorySize;
        this.history.splice(0, removeCount);
        this.currentIndex -= removeCount;
      }

      // Persist if enabled
      if (this.config.persistHistory) {
        this.persistHistory();
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Undo the last command
   */
  async undo(): Promise<void> {
    if (!this.canUndo() || this.isExecuting) {
      return;
    }

    this.isExecuting = true;

    try {
      const command = this.history[this.currentIndex];
      await command.undo();
      this.currentIndex--;

      if (this.config.persistHistory) {
        this.persistHistory();
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Error undoing command:', error);
      // Try to restore state by re-executing
      try {
        const command = this.history[this.currentIndex];
        await command.execute();
      } catch (restoreError) {
        console.error('Error restoring state after failed undo:', restoreError);
      }
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Redo the next command
   */
  async redo(): Promise<void> {
    if (!this.canRedo() || this.isExecuting) {
      return;
    }

    this.isExecuting = true;

    try {
      this.currentIndex++;
      const command = this.history[this.currentIndex];
      await command.execute();

      if (this.config.persistHistory) {
        this.persistHistory();
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Error redoing command:', error);
      this.currentIndex--;
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get the current state
   */
  getState(): UndoRedoState {
    const canUndo = this.canUndo();
    const canRedo = this.canRedo();

    return {
      canUndo,
      canRedo,
      undoDescription: canUndo
        ? this.history[this.currentIndex].getDescription()
        : null,
      redoDescription: canRedo
        ? this.history[this.currentIndex + 1].getDescription()
        : null,
      historyPosition: this.currentIndex,
      historySize: this.history.length,
    };
  }

  /**
   * Get the full history (for debugging/visualization)
   */
  getHistory(): Array<{ description: string; timestamp: number; isCurrent: boolean }> {
    return this.history.map((command, index) => ({
      description: command.getDescription(),
      timestamp: command.getTimestamp(),
      isCurrent: index === this.currentIndex,
    }));
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;

    if (this.config.persistHistory) {
      this.persistHistory();
    }

    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: UndoRedoListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.getState());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in undo/redo listener:', error);
      }
    });
  }

  /**
   * Persist history to storage
   */
  private persistHistory(): void {
    // TODO: Implement persistence if needed
    // This would serialize commands and save to localStorage/IndexedDB
  }

  /**
   * Restore history from storage
   */
  private restoreHistory(): void {
    // TODO: Implement restoration if needed
  }

  /**
   * Begin a transaction (batch multiple commands)
   * Returns a function to commit the transaction
   */
  beginTransaction(description: string): {
    add: (command: Command) => void;
    commit: () => Promise<void>;
    rollback: () => void;
  } {
    const commands: Command[] = [];

    return {
      add: (command: Command) => {
        commands.push(command);
      },
      commit: async () => {
        if (commands.length === 0) return;

        // Create a batch command
        const batchCommand = new BatchCommand(commands, description);
        await this.execute(batchCommand);
      },
      rollback: () => {
        commands.length = 0;
      },
    };
  }
}

/**
 * Batch command - executes multiple commands as one
 */
class BatchCommand implements Command {
  private commands: Command[];
  private description: string;
  private timestamp: number;

  constructor(commands: Command[], description: string) {
    this.commands = commands;
    this.description = description;
    this.timestamp = Date.now();
  }

  async execute(): Promise<void> {
    for (const command of this.commands) {
      await command.execute();
    }
  }

  async undo(): Promise<void> {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i].undo();
    }
  }

  getDescription(): string {
    return this.description;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

// Singleton instance
let undoManagerInstance: UndoManager | null = null;

/**
 * Get the global UndoManager instance
 */
export function getUndoManager(config?: UndoManagerConfig): UndoManager {
  if (!undoManagerInstance) {
    undoManagerInstance = new UndoManager(config);
  }
  return undoManagerInstance;
}

/**
 * Reset the global UndoManager instance
 */
export function resetUndoManager(): void {
  undoManagerInstance = null;
}
