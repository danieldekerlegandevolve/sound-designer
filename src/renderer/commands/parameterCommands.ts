/**
 * Parameter Change Commands
 *
 * Commands for undoable parameter modifications
 */

import { Command, ParameterChangeData } from '../../shared/undoRedoTypes';

/**
 * Parameter change command
 */
export class ParameterChangeCommand implements Command {
  private parameterId: string;
  private parameterName: string;
  private oldValue: number;
  private newValue: number;
  private timestamp: number;
  private onValueChange: (id: string, value: number) => void;

  constructor(
    data: ParameterChangeData,
    onValueChange: (id: string, value: number) => void
  ) {
    this.parameterId = data.parameterId;
    this.parameterName = data.parameterName || data.parameterId;
    this.oldValue = data.oldValue;
    this.newValue = data.newValue;
    this.timestamp = Date.now();
    this.onValueChange = onValueChange;
  }

  async execute(): Promise<void> {
    this.onValueChange(this.parameterId, this.newValue);
  }

  async undo(): Promise<void> {
    this.onValueChange(this.parameterId, this.oldValue);
  }

  getDescription(): string {
    return `Change ${this.parameterName}: ${this.oldValue.toFixed(2)} → ${this.newValue.toFixed(2)}`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }

  /**
   * Merge with another parameter change command if it's for the same parameter
   */
  merge(other: Command): boolean {
    if (!(other instanceof ParameterChangeCommand)) {
      return false;
    }

    if (this.parameterId !== other.parameterId) {
      return false;
    }

    // Update the new value to the other command's new value
    this.newValue = other.newValue;
    this.timestamp = other.timestamp;
    return true;
  }
}

/**
 * Batch parameter change command
 */
export class BatchParameterChangeCommand implements Command {
  private changes: Array<{
    parameterId: string;
    parameterName: string;
    oldValue: number;
    newValue: number;
  }>;
  private timestamp: number;
  private onValueChange: (id: string, value: number) => void;
  private description: string;

  constructor(
    changes: ParameterChangeData[],
    onValueChange: (id: string, value: number) => void,
    description?: string
  ) {
    this.changes = changes.map((data) => ({
      parameterId: data.parameterId,
      parameterName: data.parameterName || data.parameterId,
      oldValue: data.oldValue,
      newValue: data.newValue,
    }));
    this.timestamp = Date.now();
    this.onValueChange = onValueChange;
    this.description = description || `Change ${this.changes.length} parameters`;
  }

  async execute(): Promise<void> {
    for (const change of this.changes) {
      this.onValueChange(change.parameterId, change.newValue);
    }
  }

  async undo(): Promise<void> {
    // Undo in reverse order
    for (let i = this.changes.length - 1; i >= 0; i--) {
      const change = this.changes[i];
      this.onValueChange(change.parameterId, change.oldValue);
    }
  }

  getDescription(): string {
    return this.description;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

/**
 * Parameter randomize command
 */
export class ParameterRandomizeCommand implements Command {
  private parameterIds: string[];
  private oldValues: Map<string, number>;
  private newValues: Map<string, number>;
  private timestamp: number;
  private onValueChange: (id: string, value: number) => void;

  constructor(
    parameterIds: string[],
    oldValues: Map<string, number>,
    newValues: Map<string, number>,
    onValueChange: (id: string, value: number) => void
  ) {
    this.parameterIds = parameterIds;
    this.oldValues = oldValues;
    this.newValues = newValues;
    this.timestamp = Date.now();
    this.onValueChange = onValueChange;
  }

  async execute(): Promise<void> {
    for (const id of this.parameterIds) {
      const value = this.newValues.get(id);
      if (value !== undefined) {
        this.onValueChange(id, value);
      }
    }
  }

  async undo(): Promise<void> {
    for (const id of this.parameterIds) {
      const value = this.oldValues.get(id);
      if (value !== undefined) {
        this.onValueChange(id, value);
      }
    }
  }

  getDescription(): string {
    return `Randomize ${this.parameterIds.length} parameters`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

/**
 * Parameter reset command
 */
export class ParameterResetCommand implements Command {
  private parameterIds: string[];
  private oldValues: Map<string, number>;
  private defaultValues: Map<string, number>;
  private timestamp: number;
  private onValueChange: (id: string, value: number) => void;

  constructor(
    parameterIds: string[],
    oldValues: Map<string, number>,
    defaultValues: Map<string, number>,
    onValueChange: (id: string, value: number) => void
  ) {
    this.parameterIds = parameterIds;
    this.oldValues = oldValues;
    this.defaultValues = defaultValues;
    this.timestamp = Date.now();
    this.onValueChange = onValueChange;
  }

  async execute(): Promise<void> {
    for (const id of this.parameterIds) {
      const value = this.defaultValues.get(id);
      if (value !== undefined) {
        this.onValueChange(id, value);
      }
    }
  }

  async undo(): Promise<void> {
    for (const id of this.parameterIds) {
      const value = this.oldValues.get(id);
      if (value !== undefined) {
        this.onValueChange(id, value);
      }
    }
  }

  getDescription(): string {
    return `Reset ${this.parameterIds.length} parameters to default`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}
