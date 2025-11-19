/**
 * MIDI and Automation Commands
 *
 * Commands for undoable MIDI and automation operations
 */

import {
  Command,
  MidiNoteData,
  AutomationPointData,
  ModulationRoutingData,
} from '../../shared/undoRedoTypes';

// ============================================================================
// MIDI Commands
// ============================================================================

/**
 * MIDI note add command
 */
export class MidiNoteAddCommand implements Command {
  private noteId: string;
  private note: number;
  private startTime: number;
  private duration: number;
  private velocity: number;
  private timestamp: number;
  private onAdd: (id: string, note: number, start: number, dur: number, vel: number) => void;
  private onDelete: (id: string) => void;

  constructor(
    data: MidiNoteData & { noteId: string; note: number; startTime: number; duration: number; velocity: number },
    onAdd: (id: string, note: number, start: number, dur: number, vel: number) => void,
    onDelete: (id: string) => void
  ) {
    this.noteId = data.noteId;
    this.note = data.note;
    this.startTime = data.startTime;
    this.duration = data.duration;
    this.velocity = data.velocity;
    this.timestamp = Date.now();
    this.onAdd = onAdd;
    this.onDelete = onDelete;
  }

  async execute(): Promise<void> {
    this.onAdd(this.noteId, this.note, this.startTime, this.duration, this.velocity);
  }

  async undo(): Promise<void> {
    this.onDelete(this.noteId);
  }

  getDescription(): string {
    return `Add MIDI note ${this.note} at ${this.startTime.toFixed(2)}`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

/**
 * MIDI note delete command
 */
export class MidiNoteDeleteCommand implements Command {
  private noteId: string;
  private note: number;
  private startTime: number;
  private duration: number;
  private velocity: number;
  private timestamp: number;
  private onAdd: (id: string, note: number, start: number, dur: number, vel: number) => void;
  private onDelete: (id: string) => void;

  constructor(
    data: MidiNoteData & { noteId: string; note: number; startTime: number; duration: number; velocity: number },
    onAdd: (id: string, note: number, start: number, dur: number, vel: number) => void,
    onDelete: (id: string) => void
  ) {
    this.noteId = data.noteId;
    this.note = data.note;
    this.startTime = data.startTime;
    this.duration = data.duration;
    this.velocity = data.velocity;
    this.timestamp = Date.now();
    this.onAdd = onAdd;
    this.onDelete = onDelete;
  }

  async execute(): Promise<void> {
    this.onDelete(this.noteId);
  }

  async undo(): Promise<void> {
    this.onAdd(this.noteId, this.note, this.startTime, this.duration, this.velocity);
  }

  getDescription(): string {
    return `Delete MIDI note ${this.note}`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

/**
 * MIDI note move command
 */
export class MidiNoteMoveCommand implements Command {
  private noteId: string;
  private oldNote: number;
  private oldStartTime: number;
  private oldDuration: number;
  private newNote: number;
  private newStartTime: number;
  private newDuration: number;
  private timestamp: number;
  private onMove: (id: string, note: number, start: number, dur: number) => void;

  constructor(
    data: MidiNoteData & {
      noteId: string;
      oldNote: number;
      oldStartTime: number;
      oldDuration: number;
      newNote: number;
      newStartTime: number;
      newDuration: number;
    },
    onMove: (id: string, note: number, start: number, dur: number) => void
  ) {
    this.noteId = data.noteId;
    this.oldNote = data.oldNote;
    this.oldStartTime = data.oldStartTime;
    this.oldDuration = data.oldDuration;
    this.newNote = data.newNote;
    this.newStartTime = data.newStartTime;
    this.newDuration = data.newDuration;
    this.timestamp = Date.now();
    this.onMove = onMove;
  }

  async execute(): Promise<void> {
    this.onMove(this.noteId, this.newNote, this.newStartTime, this.newDuration);
  }

  async undo(): Promise<void> {
    this.onMove(this.noteId, this.oldNote, this.oldStartTime, this.oldDuration);
  }

  getDescription(): string {
    return `Move MIDI note from ${this.oldNote} to ${this.newNote}`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }

  /**
   * Merge consecutive moves of the same note
   */
  merge(other: Command): boolean {
    if (!(other instanceof MidiNoteMoveCommand)) {
      return false;
    }

    if (this.noteId !== other.noteId) {
      return false;
    }

    // Update to the new position
    this.newNote = other.newNote;
    this.newStartTime = other.newStartTime;
    this.newDuration = other.newDuration;
    this.timestamp = other.timestamp;
    return true;
  }
}

// ============================================================================
// Automation Commands
// ============================================================================

/**
 * Automation point add command
 */
export class AutomationPointAddCommand implements Command {
  private parameterId: string;
  private pointId: string;
  private time: number;
  private value: number;
  private timestamp: number;
  private onAdd: (paramId: string, pointId: string, time: number, value: number) => void;
  private onDelete: (paramId: string, pointId: string) => void;

  constructor(
    data: AutomationPointData & { pointId: string; time: number; value: number },
    onAdd: (paramId: string, pointId: string, time: number, value: number) => void,
    onDelete: (paramId: string, pointId: string) => void
  ) {
    this.parameterId = data.parameterId;
    this.pointId = data.pointId;
    this.time = data.time;
    this.value = data.value;
    this.timestamp = Date.now();
    this.onAdd = onAdd;
    this.onDelete = onDelete;
  }

  async execute(): Promise<void> {
    this.onAdd(this.parameterId, this.pointId, this.time, this.value);
  }

  async undo(): Promise<void> {
    this.onDelete(this.parameterId, this.pointId);
  }

  getDescription(): string {
    return `Add automation point at ${this.time.toFixed(2)}`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

/**
 * Automation point delete command
 */
export class AutomationPointDeleteCommand implements Command {
  private parameterId: string;
  private pointId: string;
  private time: number;
  private value: number;
  private timestamp: number;
  private onAdd: (paramId: string, pointId: string, time: number, value: number) => void;
  private onDelete: (paramId: string, pointId: string) => void;

  constructor(
    data: AutomationPointData & { pointId: string; time: number; value: number },
    onAdd: (paramId: string, pointId: string, time: number, value: number) => void,
    onDelete: (paramId: string, pointId: string) => void
  ) {
    this.parameterId = data.parameterId;
    this.pointId = data.pointId;
    this.time = data.time;
    this.value = data.value;
    this.timestamp = Date.now();
    this.onAdd = onAdd;
    this.onDelete = onDelete;
  }

  async execute(): Promise<void> {
    this.onDelete(this.parameterId, this.pointId);
  }

  async undo(): Promise<void> {
    this.onAdd(this.parameterId, this.pointId, this.time, this.value);
  }

  getDescription(): string {
    return `Delete automation point at ${this.time.toFixed(2)}`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

/**
 * Automation point move command
 */
export class AutomationPointMoveCommand implements Command {
  private parameterId: string;
  private pointId: string;
  private oldTime: number;
  private oldValue: number;
  private newTime: number;
  private newValue: number;
  private timestamp: number;
  private onMove: (paramId: string, pointId: string, time: number, value: number) => void;

  constructor(
    data: AutomationPointData & {
      pointId: string;
      oldTime: number;
      oldValue: number;
      newTime: number;
      newValue: number;
    },
    onMove: (paramId: string, pointId: string, time: number, value: number) => void
  ) {
    this.parameterId = data.parameterId;
    this.pointId = data.pointId;
    this.oldTime = data.oldTime;
    this.oldValue = data.oldValue;
    this.newTime = data.newTime;
    this.newValue = data.newValue;
    this.timestamp = Date.now();
    this.onMove = onMove;
  }

  async execute(): Promise<void> {
    this.onMove(this.parameterId, this.pointId, this.newTime, this.newValue);
  }

  async undo(): Promise<void> {
    this.onMove(this.parameterId, this.pointId, this.oldTime, this.oldValue);
  }

  getDescription(): string {
    return `Move automation point`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }

  /**
   * Merge consecutive moves of the same point
   */
  merge(other: Command): boolean {
    if (!(other instanceof AutomationPointMoveCommand)) {
      return false;
    }

    if (this.parameterId !== other.parameterId || this.pointId !== other.pointId) {
      return false;
    }

    // Update to the new position
    this.newTime = other.newTime;
    this.newValue = other.newValue;
    this.timestamp = other.timestamp;
    return true;
  }
}

// ============================================================================
// Modulation Commands
// ============================================================================

/**
 * Modulation routing add command
 */
export class ModulationAddCommand implements Command {
  private routingId: string;
  private sourceId: string;
  private targetId: string;
  private amount: number;
  private timestamp: number;
  private onAdd: (id: string, sourceId: string, targetId: string, amount: number) => void;
  private onDelete: (id: string) => void;

  constructor(
    data: ModulationRoutingData & { routingId: string; amount: number },
    onAdd: (id: string, sourceId: string, targetId: string, amount: number) => void,
    onDelete: (id: string) => void
  ) {
    this.routingId = data.routingId;
    this.sourceId = data.sourceId;
    this.targetId = data.targetId;
    this.amount = data.amount;
    this.timestamp = Date.now();
    this.onAdd = onAdd;
    this.onDelete = onDelete;
  }

  async execute(): Promise<void> {
    this.onAdd(this.routingId, this.sourceId, this.targetId, this.amount);
  }

  async undo(): Promise<void> {
    this.onDelete(this.routingId);
  }

  getDescription(): string {
    return `Add modulation routing: ${this.sourceId} → ${this.targetId}`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

/**
 * Modulation routing delete command
 */
export class ModulationDeleteCommand implements Command {
  private routingId: string;
  private sourceId: string;
  private targetId: string;
  private amount: number;
  private timestamp: number;
  private onAdd: (id: string, sourceId: string, targetId: string, amount: number) => void;
  private onDelete: (id: string) => void;

  constructor(
    data: ModulationRoutingData & { routingId: string; amount: number },
    onAdd: (id: string, sourceId: string, targetId: string, amount: number) => void,
    onDelete: (id: string) => void
  ) {
    this.routingId = data.routingId;
    this.sourceId = data.sourceId;
    this.targetId = data.targetId;
    this.amount = data.amount;
    this.timestamp = Date.now();
    this.onAdd = onAdd;
    this.onDelete = onDelete;
  }

  async execute(): Promise<void> {
    this.onDelete(this.routingId);
  }

  async undo(): Promise<void> {
    this.onAdd(this.routingId, this.sourceId, this.targetId, this.amount);
  }

  getDescription(): string {
    return `Delete modulation routing: ${this.sourceId} → ${this.targetId}`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

/**
 * Modulation amount change command
 */
export class ModulationAmountChangeCommand implements Command {
  private routingId: string;
  private sourceId: string;
  private targetId: string;
  private oldAmount: number;
  private newAmount: number;
  private timestamp: number;
  private onUpdate: (id: string, amount: number) => void;

  constructor(
    data: ModulationRoutingData & { routingId: string; oldAmount: number; newAmount: number },
    onUpdate: (id: string, amount: number) => void
  ) {
    this.routingId = data.routingId;
    this.sourceId = data.sourceId;
    this.targetId = data.targetId;
    this.oldAmount = data.oldAmount;
    this.newAmount = data.newAmount;
    this.timestamp = Date.now();
    this.onUpdate = onUpdate;
  }

  async execute(): Promise<void> {
    this.onUpdate(this.routingId, this.newAmount);
  }

  async undo(): Promise<void> {
    this.onUpdate(this.routingId, this.oldAmount);
  }

  getDescription(): string {
    return `Change modulation amount: ${this.sourceId} → ${this.targetId}`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }

  /**
   * Merge consecutive amount changes for the same routing
   */
  merge(other: Command): boolean {
    if (!(other instanceof ModulationAmountChangeCommand)) {
      return false;
    }

    if (this.routingId !== other.routingId) {
      return false;
    }

    // Update to the new amount
    this.newAmount = other.newAmount;
    this.timestamp = other.timestamp;
    return true;
  }
}
