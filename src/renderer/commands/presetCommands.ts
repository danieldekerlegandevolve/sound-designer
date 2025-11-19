/**
 * Preset Operation Commands
 *
 * Commands for undoable preset operations
 */

import { Command, PresetOperationData } from '../../shared/undoRedoTypes';

/**
 * Preset create command
 */
export class PresetCreateCommand implements Command {
  private presetId: string;
  private presetName: string;
  private presetData: any;
  private timestamp: number;
  private onCreate: (id: string, name: string, data: any) => void;
  private onDelete: (id: string) => void;

  constructor(
    data: PresetOperationData & { newState: any },
    onCreate: (id: string, name: string, data: any) => void,
    onDelete: (id: string) => void
  ) {
    this.presetId = data.presetId;
    this.presetName = data.presetName;
    this.presetData = data.newState;
    this.timestamp = Date.now();
    this.onCreate = onCreate;
    this.onDelete = onDelete;
  }

  async execute(): Promise<void> {
    this.onCreate(this.presetId, this.presetName, this.presetData);
  }

  async undo(): Promise<void> {
    this.onDelete(this.presetId);
  }

  getDescription(): string {
    return `Create preset "${this.presetName}"`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

/**
 * Preset delete command
 */
export class PresetDeleteCommand implements Command {
  private presetId: string;
  private presetName: string;
  private presetData: any;
  private timestamp: number;
  private onCreate: (id: string, name: string, data: any) => void;
  private onDelete: (id: string) => void;

  constructor(
    data: PresetOperationData & { oldState: any },
    onCreate: (id: string, name: string, data: any) => void,
    onDelete: (id: string) => void
  ) {
    this.presetId = data.presetId;
    this.presetName = data.presetName;
    this.presetData = data.oldState;
    this.timestamp = Date.now();
    this.onCreate = onCreate;
    this.onDelete = onDelete;
  }

  async execute(): Promise<void> {
    this.onDelete(this.presetId);
  }

  async undo(): Promise<void> {
    this.onCreate(this.presetId, this.presetName, this.presetData);
  }

  getDescription(): string {
    return `Delete preset "${this.presetName}"`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

/**
 * Preset update command
 */
export class PresetUpdateCommand implements Command {
  private presetId: string;
  private presetName: string;
  private oldData: any;
  private newData: any;
  private timestamp: number;
  private onUpdate: (id: string, data: any) => void;

  constructor(
    data: PresetOperationData & { oldState: any; newState: any },
    onUpdate: (id: string, data: any) => void
  ) {
    this.presetId = data.presetId;
    this.presetName = data.presetName;
    this.oldData = data.oldState;
    this.newData = data.newState;
    this.timestamp = Date.now();
    this.onUpdate = onUpdate;
  }

  async execute(): Promise<void> {
    this.onUpdate(this.presetId, this.newData);
  }

  async undo(): Promise<void> {
    this.onUpdate(this.presetId, this.oldData);
  }

  getDescription(): string {
    return `Update preset "${this.presetName}"`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

/**
 * Preset rename command
 */
export class PresetRenameCommand implements Command {
  private presetId: string;
  private oldName: string;
  private newName: string;
  private timestamp: number;
  private onRename: (id: string, name: string) => void;

  constructor(
    presetId: string,
    oldName: string,
    newName: string,
    onRename: (id: string, name: string) => void
  ) {
    this.presetId = presetId;
    this.oldName = oldName;
    this.newName = newName;
    this.timestamp = Date.now();
    this.onRename = onRename;
  }

  async execute(): Promise<void> {
    this.onRename(this.presetId, this.newName);
  }

  async undo(): Promise<void> {
    this.onRename(this.presetId, this.oldName);
  }

  getDescription(): string {
    return `Rename preset "${this.oldName}" to "${this.newName}"`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}

/**
 * Preset load command
 */
export class PresetLoadCommand implements Command {
  private presetId: string;
  private presetName: string;
  private previousState: any;
  private newState: any;
  private timestamp: number;
  private onLoadState: (state: any) => void;

  constructor(
    presetId: string,
    presetName: string,
    previousState: any,
    newState: any,
    onLoadState: (state: any) => void
  ) {
    this.presetId = presetId;
    this.presetName = presetName;
    this.previousState = previousState;
    this.newState = newState;
    this.timestamp = Date.now();
    this.onLoadState = onLoadState;
  }

  async execute(): Promise<void> {
    this.onLoadState(this.newState);
  }

  async undo(): Promise<void> {
    this.onLoadState(this.previousState);
  }

  getDescription(): string {
    return `Load preset "${this.presetName}"`;
  }

  getTimestamp(): number {
    return this.timestamp;
  }
}
