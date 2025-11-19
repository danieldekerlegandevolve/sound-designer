/**
 * UI/UX Enhancements Module Exports
 *
 * Central export point for all UI/UX enhancement features
 */

// Drag and Drop
export { DragDropProvider, useDragDrop, useDraggable, useDropZone } from '../../contexts/DragDropContext';
export type {
  DragItem,
  DragState,
  DropZone,
  DropResult,
  DragDropConfig,
  DragFeedback,
  PresetDragItem,
  SampleDragItem,
  ModulationSourceDragItem,
  MidiNoteDragItem,
} from '../../../shared/dragDropTypes';
export { DragItemType } from '../../../shared/dragDropTypes';

// Keyboard Shortcuts
export {
  getKeyboardShortcutManager,
  resetKeyboardShortcutManager,
  KeyboardShortcutManager,
  DEFAULT_SHORTCUTS,
} from '../../utils/keyboardShortcuts';
export type { KeyboardShortcut } from '../../../shared/undoRedoTypes';

// UI Components
export {
  ContextMenu,
  useContextMenu,
  Tooltip,
  useTooltip,
  LoadingSpinner,
  InlineLoader,
  Skeleton,
  ProgressBar,
  ErrorBoundary,
  ErrorDisplay,
  useErrorHandler,
} from '../../components';

export type {
  ContextMenuItem,
  TooltipProps,
  LoadingSpinnerProps,
  SkeletonProps,
  ProgressBarProps,
  ErrorDisplayProps,
} from '../../components';
