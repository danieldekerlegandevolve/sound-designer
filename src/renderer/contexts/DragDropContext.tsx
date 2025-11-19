/**
 * Drag and Drop Context
 *
 * Provides drag and drop functionality throughout the application
 */

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import {
  DragItem,
  DragState,
  DropZone,
  DropResult,
  DragDropConfig,
  DragFeedback,
} from '../../shared/dragDropTypes';

interface DragDropContextValue {
  dragState: DragState;
  dragFeedback: DragFeedback | null;
  startDrag: (item: DragItem, sourceId: string, initialPos: { x: number; y: number }) => void;
  updateDrag: (pos: { x: number; y: number }) => void;
  endDrag: () => DropResult | null;
  cancelDrag: () => void;
  registerDropZone: (zone: DropZone) => () => void;
  setActiveDropZone: (zoneId: string | null) => void;
  canDropInZone: (zoneId: string) => boolean;
}

const DragDropContext = createContext<DragDropContextValue | null>(null);

const DEFAULT_CONFIG: Required<DragDropConfig> = {
  enableFeedback: true,
  snapToGrid: false,
  gridSize: 10,
  renderPreview: () => document.createElement('div'),
  dragDelay: 0,
  dragThreshold: 5,
};

interface DragDropProviderProps {
  children: ReactNode;
  config?: DragDropConfig;
}

export function DragDropProvider({ children, config }: DragDropProviderProps) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragItem: null,
    dragSourceId: null,
    activeDropZoneId: null,
  });

  const [dragFeedback, setDragFeedback] = useState<DragFeedback | null>(null);

  const dropZonesRef = useRef<Map<string, DropZone>>(new Map());
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  /**
   * Start dragging an item
   */
  const startDrag = useCallback(
    (item: DragItem, sourceId: string, initialPos: { x: number; y: number }) => {
      dragStartPos.current = initialPos;

      setDragState({
        isDragging: true,
        dragItem: item,
        dragSourceId: sourceId,
        activeDropZoneId: null,
      });

      if (fullConfig.enableFeedback) {
        setDragFeedback({
          x: initialPos.x,
          y: initialPos.y,
          width: 100,
          height: 40,
          opacity: 0.8,
          cursor: 'grabbing',
        });
      }
    },
    [fullConfig.enableFeedback]
  );

  /**
   * Update drag position
   */
  const updateDrag = useCallback(
    (pos: { x: number; y: number }) => {
      if (!dragState.isDragging) return;

      let { x, y } = pos;

      // Apply grid snapping if enabled
      if (fullConfig.snapToGrid) {
        x = Math.round(x / fullConfig.gridSize) * fullConfig.gridSize;
        y = Math.round(y / fullConfig.gridSize) * fullConfig.gridSize;
      }

      // Update feedback position
      if (fullConfig.enableFeedback) {
        setDragFeedback((prev) =>
          prev ? { ...prev, x, y } : null
        );
      }

      // Check if we're over a drop zone
      let activeZoneId: string | null = null;
      let canDrop = false;

      dropZonesRef.current.forEach((zone, zoneId) => {
        if (!dragState.dragItem) return;

        // Check if item type is accepted
        if (!zone.accepts.includes(dragState.dragItem.type)) return;

        // Check custom canDrop predicate
        if (zone.canDrop && !zone.canDrop(dragState.dragItem)) return;

        // TODO: Add position-based zone detection
        // For now, we'll rely on hover events to set active zone

        if (zone.highlight) {
          activeZoneId = zoneId;
          canDrop = true;
        }
      });

      // Update cursor based on drop availability
      if (fullConfig.enableFeedback && dragFeedback) {
        setDragFeedback((prev) =>
          prev
            ? {
                ...prev,
                cursor: canDrop ? 'copy' : 'not-allowed',
              }
            : null
        );
      }

      setDragState((prev) => ({
        ...prev,
        activeDropZoneId: activeZoneId,
      }));
    },
    [dragState.isDragging, dragState.dragItem, fullConfig, dragFeedback]
  );

  /**
   * End drag and drop
   */
  const endDrag = useCallback((): DropResult | null => {
    if (!dragState.isDragging || !dragState.dragItem) {
      return null;
    }

    let result: DropResult | null = null;

    // If we're over a drop zone, execute the drop
    if (dragState.activeDropZoneId) {
      const zone = dropZonesRef.current.get(dragState.activeDropZoneId);
      if (zone) {
        zone.onDrop(dragState.dragItem);
        result = {
          success: true,
          dropZoneId: dragState.activeDropZoneId,
          item: dragState.dragItem,
        };
      }
    }

    // Reset state
    setDragState({
      isDragging: false,
      dragItem: null,
      dragSourceId: null,
      activeDropZoneId: null,
    });

    setDragFeedback(null);
    dragStartPos.current = null;

    return result;
  }, [dragState]);

  /**
   * Cancel drag
   */
  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      dragItem: null,
      dragSourceId: null,
      activeDropZoneId: null,
    });

    setDragFeedback(null);
    dragStartPos.current = null;
  }, []);

  /**
   * Register a drop zone
   */
  const registerDropZone = useCallback((zone: DropZone): (() => void) => {
    dropZonesRef.current.set(zone.id, zone);

    // Return unregister function
    return () => {
      dropZonesRef.current.delete(zone.id);
    };
  }, []);

  /**
   * Set the currently active drop zone
   */
  const setActiveDropZone = useCallback((zoneId: string | null) => {
    setDragState((prev) => ({
      ...prev,
      activeDropZoneId: zoneId,
    }));
  }, []);

  /**
   * Check if current drag item can drop in a zone
   */
  const canDropInZone = useCallback(
    (zoneId: string): boolean => {
      if (!dragState.dragItem) return false;

      const zone = dropZonesRef.current.get(zoneId);
      if (!zone) return false;

      // Check if item type is accepted
      if (!zone.accepts.includes(dragState.dragItem.type)) return false;

      // Check custom canDrop predicate
      if (zone.canDrop && !zone.canDrop(dragState.dragItem)) return false;

      return true;
    },
    [dragState.dragItem]
  );

  const contextValue: DragDropContextValue = {
    dragState,
    dragFeedback,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    registerDropZone,
    setActiveDropZone,
    canDropInZone,
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
      {dragFeedback && fullConfig.enableFeedback && (
        <div
          style={{
            position: 'fixed',
            left: dragFeedback.x,
            top: dragFeedback.y,
            width: dragFeedback.width,
            height: dragFeedback.height,
            opacity: dragFeedback.opacity,
            cursor: dragFeedback.cursor,
            pointerEvents: 'none',
            zIndex: 10000,
            backgroundColor: 'rgba(100, 150, 255, 0.3)',
            border: '2px dashed rgba(100, 150, 255, 0.8)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#fff',
          }}
        >
          {dragState.dragItem?.type}
        </div>
      )}
    </DragDropContext.Provider>
  );
}

/**
 * Hook to use drag and drop context
 */
export function useDragDrop(): DragDropContextValue {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within DragDropProvider');
  }
  return context;
}

/**
 * Hook to make an element draggable
 */
export function useDraggable(item: DragItem, sourceId: string) {
  const { startDrag, updateDrag, endDrag, cancelDrag } = useDragDrop();
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startDrag(item, sourceId, { x: e.clientX, y: e.clientY });

      const handleMouseMove = (moveEvent: MouseEvent) => {
        updateDrag({ x: moveEvent.clientX, y: moveEvent.clientY });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        endDrag();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [item, sourceId, startDrag, updateDrag, endDrag]
  );

  return {
    isDragging,
    dragHandleProps: {
      onMouseDown: handleMouseDown,
      style: { cursor: isDragging ? 'grabbing' : 'grab' },
    },
  };
}

/**
 * Hook to make an element a drop zone
 */
export function useDropZone(zone: DropZone) {
  const { registerDropZone, setActiveDropZone, canDropInZone } = useDragDrop();
  const [isOver, setIsOver] = useState(false);

  React.useEffect(() => {
    const unregister = registerDropZone(zone);
    return unregister;
  }, [zone, registerDropZone]);

  const canDrop = canDropInZone(zone.id);

  const handleDragEnter = useCallback(() => {
    if (canDrop) {
      setIsOver(true);
      setActiveDropZone(zone.id);
    }
  }, [canDrop, zone.id, setActiveDropZone]);

  const handleDragLeave = useCallback(() => {
    setIsOver(false);
    setActiveDropZone(null);
  }, [setActiveDropZone]);

  return {
    isOver,
    canDrop,
    dropZoneProps: {
      onMouseEnter: handleDragEnter,
      onMouseLeave: handleDragLeave,
      'data-drop-zone': zone.id,
      style: {
        backgroundColor: isOver && canDrop ? 'rgba(100, 150, 255, 0.2)' : undefined,
        outline: isOver && canDrop ? '2px dashed rgba(100, 150, 255, 0.8)' : undefined,
      },
    },
  };
}
