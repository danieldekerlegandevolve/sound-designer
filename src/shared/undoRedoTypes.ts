/**
 * Undo/Redo System Types
 *
 * Implements the Command Pattern for undoable/redoable actions
 */

/**
 * Base interface for all undoable commands
 */
export interface Command {
  /**
   * Execute the command (perform the action)
   */
  execute(): void | Promise<void>;

  /**
   * Undo the command (reverse the action)
   */
  undo(): void | Promise<void>;

  /**
   * Get a human-readable description of the command
   */
  getDescription(): string;

  /**
   * Get the timestamp when the command was created
   */
  getTimestamp(): number;

  /**
   * Try to merge this command with another command
   * Returns true if merge was successful, false otherwise
   * Used for combining similar consecutive actions (e.g., parameter adjustments)
   */
  merge?(other: Command): boolean;
}

/**
 * Configuration for the UndoManager
 */
export interface UndoManagerConfig {
  /**
   * Maximum number of undo steps to keep in history
   * @default 100
   */
  maxHistorySize?: number;

  /**
   * Whether to merge consecutive similar commands
   * @default true
   */
  enableMerging?: boolean;

  /**
   * Time window (in ms) for merging commands
   * Commands within this window can be merged
   * @default 500
   */
  mergeWindowMs?: number;

  /**
   * Whether to persist history to storage
   * @default false
   */
  persistHistory?: boolean;
}

/**
 * State of the undo/redo system
 */
export interface UndoRedoState {
  /**
   * Whether there are actions that can be undone
   */
  canUndo: boolean;

  /**
   * Whether there are actions that can be redone
   */
  canRedo: boolean;

  /**
   * Description of the next action to undo
   */
  undoDescription: string | null;

  /**
   * Description of the next action to redo
   */
  redoDescription: string | null;

  /**
   * Current position in the history
   */
  historyPosition: number;

  /**
   * Total number of actions in history
   */
  historySize: number;
}

/**
 * History entry for serialization
 */
export interface HistoryEntry {
  type: string;
  description: string;
  timestamp: number;
  data: any;
}

/**
 * Listener callback for undo/redo state changes
 */
export type UndoRedoListener = (state: UndoRedoState) => void;

/**
 * Parameter change command data
 */
export interface ParameterChangeData {
  parameterId: string;
  oldValue: number;
  newValue: number;
  parameterName?: string;
}

/**
 * Preset operation command data
 */
export interface PresetOperationData {
  type: 'create' | 'delete' | 'update' | 'rename';
  presetId: string;
  presetName: string;
  oldState?: any;
  newState?: any;
}

/**
 * MIDI note command data
 */
export interface MidiNoteData {
  type: 'add' | 'delete' | 'move' | 'resize';
  noteId?: string;
  note?: number;
  startTime?: number;
  duration?: number;
  velocity?: number;
  oldNote?: number;
  oldStartTime?: number;
  oldDuration?: number;
  oldVelocity?: number;
  newNote?: number;
  newStartTime?: number;
  newDuration?: number;
  newVelocity?: number;
}

/**
 * Automation point command data
 */
export interface AutomationPointData {
  type: 'add' | 'delete' | 'move';
  parameterId: string;
  pointId?: string;
  time?: number;
  value?: number;
  oldTime?: number;
  oldValue?: number;
  newTime?: number;
  newValue?: number;
}

/**
 * Modulation routing command data
 */
export interface ModulationRoutingData {
  type: 'add' | 'delete' | 'update';
  routingId?: string;
  sourceId: string;
  targetId: string;
  amount?: number;
  oldAmount?: number;
  newAmount?: number;
}

/**
 * Sample operation command data
 */
export interface SampleOperationData {
  type: 'add' | 'delete' | 'edit';
  sampleId: string;
  sampleName?: string;
  oldData?: any;
  newData?: any;
}

/**
 * Batch command data - for grouping multiple commands
 */
export interface BatchCommandData {
  commands: Command[];
  description: string;
}

/**
 * Command types for serialization
 */
export enum CommandType {
  PARAMETER_CHANGE = 'parameter_change',
  PRESET_CREATE = 'preset_create',
  PRESET_DELETE = 'preset_delete',
  PRESET_UPDATE = 'preset_update',
  MIDI_NOTE_ADD = 'midi_note_add',
  MIDI_NOTE_DELETE = 'midi_note_delete',
  MIDI_NOTE_MOVE = 'midi_note_move',
  AUTOMATION_POINT_ADD = 'automation_point_add',
  AUTOMATION_POINT_DELETE = 'automation_point_delete',
  AUTOMATION_POINT_MOVE = 'automation_point_move',
  MODULATION_ADD = 'modulation_add',
  MODULATION_DELETE = 'modulation_delete',
  SAMPLE_ADD = 'sample_add',
  SAMPLE_DELETE = 'sample_delete',
  BATCH = 'batch',
}

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category?: string;
}

/**
 * Utility function to format command description
 */
export function formatCommandDescription(command: Command): string {
  return command.getDescription();
}

/**
 * Utility function to check if two commands can be merged
 */
export function canMergeCommands(a: Command, b: Command, windowMs: number = 500): boolean {
  if (!a.merge || !b.merge) {
    return false;
  }

  const timeDiff = Math.abs(a.getTimestamp() - b.getTimestamp());
  return timeDiff <= windowMs;
}
