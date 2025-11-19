/**
 * Drag and Drop Types
 *
 * Type definitions for the drag and drop system
 */

/**
 * Drag item types
 */
export enum DragItemType {
  PRESET = 'preset',
  SAMPLE = 'sample',
  MODULATION_SOURCE = 'modulation_source',
  AUTOMATION_LANE = 'automation_lane',
  MIDI_NOTE = 'midi_note',
  EFFECT = 'effect',
  PARAMETER = 'parameter',
}

/**
 * Base drag item interface
 */
export interface DragItem {
  type: DragItemType;
  id: string;
  data: any;
}

/**
 * Preset drag item
 */
export interface PresetDragItem extends DragItem {
  type: DragItemType.PRESET;
  data: {
    presetId: string;
    presetName: string;
    presetData: any;
  };
}

/**
 * Sample drag item
 */
export interface SampleDragItem extends DragItem {
  type: DragItemType.SAMPLE;
  data: {
    sampleId: string;
    sampleName: string;
    samplePath: string;
    duration?: number;
  };
}

/**
 * Modulation source drag item
 */
export interface ModulationSourceDragItem extends DragItem {
  type: DragItemType.MODULATION_SOURCE;
  data: {
    sourceId: string;
    sourceName: string;
    sourceType: 'lfo' | 'envelope' | 'macro';
  };
}

/**
 * MIDI note drag item
 */
export interface MidiNoteDragItem extends DragItem {
  type: DragItemType.MIDI_NOTE;
  data: {
    noteId: string;
    note: number;
    startTime: number;
    duration: number;
    velocity: number;
  };
}

/**
 * Drop zone interface
 */
export interface DropZone {
  id: string;
  accepts: DragItemType[];
  onDrop: (item: DragItem) => void;
  canDrop?: (item: DragItem) => boolean;
  highlight?: boolean;
}

/**
 * Drag state
 */
export interface DragState {
  isDragging: boolean;
  dragItem: DragItem | null;
  dragSourceId: string | null;
  activeDropZoneId: string | null;
}

/**
 * Drag feedback data
 */
export interface DragFeedback {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  cursor: 'grab' | 'grabbing' | 'copy' | 'move' | 'not-allowed';
}

/**
 * Drop result
 */
export interface DropResult {
  success: boolean;
  dropZoneId: string;
  item: DragItem;
  position?: { x: number; y: number };
}

/**
 * Drag and drop configuration
 */
export interface DragDropConfig {
  /**
   * Enable visual feedback during drag
   */
  enableFeedback?: boolean;

  /**
   * Snap to grid when dragging
   */
  snapToGrid?: boolean;

  /**
   * Grid size for snapping
   */
  gridSize?: number;

  /**
   * Custom drag preview renderer
   */
  renderPreview?: (item: DragItem) => HTMLElement;

  /**
   * Delay before drag starts (in ms)
   */
  dragDelay?: number;

  /**
   * Minimum distance to move before drag starts
   */
  dragThreshold?: number;
}
