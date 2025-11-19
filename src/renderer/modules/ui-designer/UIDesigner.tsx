import React, { useRef, useEffect, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useSettingsStore } from '../../store/settingsStore';
import { PropertiesPanel } from './PropertiesPanel';
import { UIComponent } from '@shared/types';
import './UIDesigner.css';

export function UIDesigner() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    project,
    selectedUIComponent,
    selectedUIComponents,
    selectUIComponent,
    toggleUIComponentSelection,
    selectMultipleUIComponents,
    clearUISelection,
    updateUIComponent,
    deleteUIComponent,
    deleteSelectedComponents,
  } = useProjectStore();

  const { gridSize, snapToGrid, gridEnabled } = useSettingsStore();

  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);

  // Snap to grid helper
  const snap = (value: number): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  const handleMouseDown = (e: React.MouseEvent, component: UIComponent) => {
    if (e.button !== 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Check if clicking on resize handle
    const relX = e.clientX - rect.left - component.x;
    const relY = e.clientY - rect.top - component.y;
    const isResizeHandle = relX > component.width - 10 && relY > component.height - 10;

    if (isResizeHandle) {
      setResizing(component.id);
    } else {
      setDragging(component.id);
      setDragOffset({
        x: e.clientX - rect.left - component.x,
        y: e.clientY - rect.top - component.y,
      });
    }

    // Handle multi-selection with Ctrl/Cmd key
    if (e.ctrlKey || e.metaKey) {
      toggleUIComponentSelection(component.id);
    } else {
      selectUIComponent(component.id);
    }
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (dragging) {
      const x = snap(e.clientX - rect.left - dragOffset.x);
      const y = snap(e.clientY - rect.top - dragOffset.y);
      updateUIComponent(dragging, { x, y });
    } else if (resizing) {
      const component = project.uiComponents.find((c) => c.id === resizing);
      if (!component) return;

      const width = snap(Math.max(20, e.clientX - rect.left - component.x));
      const height = snap(Math.max(20, e.clientY - rect.top - component.y));
      updateUIComponent(resizing, { width, height });
    } else if (selectionStart) {
      // Update selection box
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const x = Math.min(selectionStart.x, currentX);
      const y = Math.min(selectionStart.y, currentY);
      const width = Math.abs(currentX - selectionStart.x);
      const height = Math.abs(currentY - selectionStart.y);
      setSelectionBox({ x, y, width, height });
    }
  };

  const handleMouseUp = () => {
    // Complete selection box
    if (selectionBox && selectionStart) {
      const selected = project.uiComponents
        .filter((comp) => {
          const compRight = comp.x + comp.width;
          const compBottom = comp.y + comp.height;
          const boxRight = selectionBox.x + selectionBox.width;
          const boxBottom = selectionBox.y + selectionBox.height;

          return !(
            comp.x > boxRight ||
            compRight < selectionBox.x ||
            comp.y > boxBottom ||
            compBottom < selectionBox.y
          );
        })
        .map((c) => c.id);

      if (selected.length > 0) {
        selectMultipleUIComponents(selected);
      }
    }

    setDragging(null);
    setResizing(null);
    setSelectionBox(null);
    setSelectionStart(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      if (!(e.ctrlKey || e.metaKey)) {
        clearUISelection();
      }

      // Start selection box
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setSelectionStart({ x, y });
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedUIComponents.length > 0) {
        deleteSelectedComponents();
      } else if (selectedUIComponent) {
        deleteUIComponent(selectedUIComponent);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.mode !== 'ui') return;

      const x = snap(e.clientX - rect.left);
      const y = snap(e.clientY - rect.top);

      const type = data.type;
      const { addUIComponent } = useProjectStore.getState();

      addUIComponent({
        type: type as any,
        x,
        y,
        width: type === 'knob' ? 80 : type === 'waveform' ? 300 : type === 'keyboard' ? 400 : type === 'xy-pad' ? 200 : 200,
        height: type === 'knob' ? 100 : type === 'slider' ? 60 : type === 'waveform' ? 150 : type === 'keyboard' ? 100 : type === 'xy-pad' ? 200 : 40,
        label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
        properties: {},
        style: {},
      });
    } catch (err) {
      console.error('Failed to handle drop:', err);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUIComponent]);

  return (
    <div className="ui-designer">
      <div
        ref={canvasRef}
        className={`canvas ${gridEnabled ? 'grid-enabled' : ''}`}
        style={{
          width: project.settings.width,
          height: project.settings.height,
          backgroundColor: project.settings.backgroundColor,
          backgroundImage: gridEnabled
            ? `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
               linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`
            : 'none',
          backgroundSize: gridEnabled ? `${gridSize}px ${gridSize}px` : 'auto',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {project.uiComponents.map((component) => {
          const isSelected =
            selectedUIComponent === component.id ||
            selectedUIComponents.includes(component.id);

          return (
            <div
              key={component.id}
              className={`ui-component ${isSelected ? 'selected' : ''}`}
              style={{
                left: component.x,
                top: component.y,
                width: component.width,
                height: component.height,
                ...component.style,
              }}
              onMouseDown={(e) => handleMouseDown(e, component)}
            >
              <div className="component-content">
                {renderComponent(component)}
              </div>
              {isSelected && (
                <div className="resize-handle" />
              )}
            </div>
          );
        })}

        {/* Selection box */}
        {selectionBox && (
          <div
            className="selection-box"
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        )}
      </div>
      <PropertiesPanel />
    </div>
  );
}

function renderComponent(component: UIComponent) {
  switch (component.type) {
    case 'knob':
      return (
        <div className="knob-component">
          <div className="knob-circle">
            <div className="knob-indicator" />
          </div>
          <div className="knob-label">{component.label}</div>
        </div>
      );
    case 'slider':
      return (
        <div className="slider-component">
          <div className="slider-label">{component.label}</div>
          <div className="slider-track">
            <div className="slider-thumb" style={{ left: '50%' }} />
          </div>
        </div>
      );
    case 'button':
      return (
        <div className="button-component">
          {component.label}
        </div>
      );
    case 'toggle':
      return (
        <div className="toggle-component">
          <div className="toggle-switch">
            <div className="toggle-handle" />
          </div>
          <div className="toggle-label">{component.label}</div>
        </div>
      );
    case 'display':
      return (
        <div className="display-component">
          <div className="display-value">0.00</div>
          <div className="display-label">{component.label}</div>
        </div>
      );
    case 'waveform':
      return (
        <div className="waveform-component">
          <svg width="100%" height="100%">
            <path
              d="M0,50 Q25,20 50,50 T100,50"
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
            />
          </svg>
        </div>
      );
    case 'keyboard':
      return (
        <div className="keyboard-component">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="key white-key" />
          ))}
        </div>
      );
    case 'xy-pad':
      return (
        <div className="xypad-component">
          <div className="xypad-point" style={{ left: '50%', top: '50%' }} />
        </div>
      );
    default:
      return <div>{component.label}</div>;
  }
}
